import { Result, RowSet, DatabaseError } from "tsdbc";
import { Request, IResult } from 'mssql'

/**
 * The result set represents results the columns of a query and a single batch of rows of size [fetchSize]
 * Subsequent calls to fetch return more rows, for as many rows in the query as well as potentially multiple
 * queries
 */
export class MSSQLRowSet implements RowSet {

    id: number
    columns: string[]
    rows: any[]
    moreRows: boolean = false
    rowCount: number = -1

    constructor(id: number, columns: string[], rows: any[], moreRows: boolean, rowCount: number) {
        this.id = id
        this.columns = columns
        this.rows = rows
        this.moreRows = moreRows
        this.rowCount = rowCount
    }
}

export class MSSQLResult implements Result {

    sql: string
    result: Promise<IResult<any>>
    request: Request
    rowSets: MSSQLRowSet[] = []
    done: any
    fetchSize: number

    private resolver: (set: RowSet) => void
    private rejecter: (error: DatabaseError) => void
    private currentRows = []
    private listenersAdded = false

    constructor(sql: string, request: Request, result: Promise<IResult<any>>, fetchSize: number) {
        this.sql = sql
        this.result = result
        this.request = request
        this.fetchSize = fetchSize
    }

    private addListeners() {
        if (this.listenersAdded) return
        this.request.on('recordset', recset => {
            let currentSet = this.rowSets.slice(-1)[0]
            if (currentSet) {
                currentSet.moreRows = false
                this.resolver(new MSSQLRowSet(currentSet.id, currentSet.columns, this.currentRows, false, 0))
                this.currentRows = []
            }
            currentSet = new MSSQLRowSet(this.rowSets.length, Object.keys(recset), [], true, 0)
            this.rowSets.push(currentSet)
        })
        this.request.on('error', error => {
            this.rejecter(<DatabaseError>{code: error.code, message: error.message, vendor: error})
        })
        this.request.on('row', row => { 
            let currentSet = this.rowSets.slice(-1)[0]
            this.currentRows.push(row)
            if (this.currentRows.length === this.fetchSize) {
                this.request.pause()
                this.resolver(new MSSQLRowSet(currentSet.id, currentSet.columns, this.currentRows, true, 0))
                this.currentRows = []
            }
        })
        this.request.on('done', done => { 
            let currentSet = this.rowSets.slice(-1)[0]
            currentSet = currentSet ? currentSet : new MSSQLRowSet(this.rowSets.length, undefined, undefined, false, done.rowsAffected[0]) 
            this.done = done
            currentSet.rowCount = done.rowsAffected[0]
            let result = currentSet ? new MSSQLRowSet(currentSet.id, currentSet.columns, this.currentRows, false, done.rowsAffected[0]) : undefined
            this.request.removeAllListeners()
            this.resolver(result)
        })
        this.listenersAdded = true
    }

    private nextResultSet() : Promise<RowSet> {
        return new Promise<RowSet>((resolve, reject) => {
            this.resolver = resolve
            this.rejecter = reject
            this.addListeners()
            this.request.resume()
        })
    }

    public fetch() : Promise<RowSet> {
        if (this.done) return undefined
        return this.nextResultSet()
    }

    public close() : Promise<void> {
        this.request.removeAllListeners()
        this.request.cancel()
        return undefined
    }
}
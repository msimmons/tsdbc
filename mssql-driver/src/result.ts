import { Result, RowSet, DatabaseError } from "tsdbc";
import { Request } from 'mssql'

/**
 * The result set represents results the columns of a query and a single batch of rows of size [fetchSize]
 * Subsequent calls to fetch return more rows, for as many rows in the query as well as potentially multiple
 * queries
 */
export class MSSQLRowSet implements RowSet {

    id: number
    columns: any[] = []
    rows: any[] = []
    moreRows: boolean = true

    constructor(id: number, columns: any[], rows: any[], moreRows: boolean) {
        this.id = id
        this.columns = columns
        this.rows = rows
        this.moreRows = moreRows
    }
}

export class MSSQLResult implements Result {
    request: Request
    updateCounts: number[]
    rowSets: MSSQLRowSet[] = []
    warnings: string[] = []
    error: DatabaseError
    done: any
    count: number
    fetchSize: number

    private resolver: (set: RowSet) => void
    private rejecter: (error: DatabaseError) => void
    private currentRows = []
    private listenersAdded = false

    constructor(request: Request, fetchSize: number) {
        this.request = request
        this.fetchSize = fetchSize
    }

    private addListeners() {
        if (this.listenersAdded) return
        this.request.on('recordset', recset => {
            let currentSet = this.rowSets.slice(-1)[0]
            if (currentSet) {
                currentSet.moreRows = false
                this.resolver(new MSSQLRowSet(currentSet.id, currentSet.columns, this.currentRows, false))
                this.currentRows = []
            }
            currentSet = new MSSQLRowSet(this.rowSets.length, Object.keys(recset), [], true)
            this.rowSets.push(currentSet)
        })
        this.request.on('error', error => {
            this.error = error
            this.rejecter(<DatabaseError>{code: error.code, message: error.message, vendor: error})
        })
        this.request.on('row', row => { 
            let currentSet = this.rowSets.slice(-1)[0]
            this.currentRows.push(row)
            if (this.currentRows.length === this.fetchSize) {
                this.request.pause()
                this.resolver(new MSSQLRowSet(currentSet.id, currentSet.columns, this.currentRows, true))
                this.currentRows = []
            }
        })
        this.request.on('done', done => { 
            let currentSet = this.rowSets.slice(-1)[0]
            this.done = done
            this.updateCounts = done.rowsAffected
            let result = currentSet ? new MSSQLRowSet(currentSet.id, currentSet.columns, this.currentRows, false) : undefined
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

}
import { Result, RowSet, DatabaseError } from "tsdbc";
import { Cursor } from 'pg-cursor'
import { QueryResultBase } from "pg";

/**
 * The result set represents results the columns of a query and a single batch of rows of size [fetchSize]
 * Subsequent calls to fetch return more rows, for as many rows in the query as well as potentially multiple
 * queries
 */
export class PGRowSet implements RowSet {

    id: number
    columns: any[] = []
    rows: any[] = []
    moreRows: boolean = true
    rowCount: number;

    constructor(id: number, columns: any[], rows: any[], moreRows: boolean) {
        this.id = id
        this.columns = columns
        this.rows = rows
        this.moreRows = moreRows
    }
}

export class PGResult implements Result {
    sql: string
    cursor: Cursor
    updateCounts: number[]
    rowSets: PGRowSet[] = []
    warnings: string[] = []
    error: DatabaseError
    done: any
    count: number
    fetchSize: number

    constructor(sql: string, cursor: Cursor, fetchSize: number) {
        this.sql = sql
        this.cursor = cursor
        this.fetchSize = fetchSize
    }

    private nextResultSet() : Promise<RowSet> {
        return new Promise<RowSet>( (resolve, reject) => {
            this.cursor.read(this.fetchSize, async (error, rows) => {
                if (error) reject(error)
                else {
                    let qr = <QueryResultBase>this.cursor._result
                    this.updateCounts = [qr.rowCount]
                    let columns = qr.fields.map(f => f.name)
                    let rowSet = <RowSet>{columns: columns, id: 0, moreRows: rows.length === this.fetchSize, rows: rows, rowCount: qr.rowCount}
                    if (!rowSet.moreRows) {
                        await this.cursor.close()
                        this.done = true
                    }
                    resolve(rowSet)
                }
            })
        })
    }

    public fetch() : Promise<RowSet> {
        if (this.done) return undefined
        return this.nextResultSet()
    }

    public close() : Promise<void> {
        this.cursor.close()
        return undefined
    }
}
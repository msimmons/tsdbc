import { Statement, Connection, ResultSetConcurrency, ResultSetHoldability, ResultSetType, Result, RowSet } from "../../api/src/tsdbc_api";
import * as mssql from 'mssql'
import { MSSQLResult } from "./result";

export class MSSQLStatement implements Statement {

    private request: mssql.Request
    result: MSSQLResult
    sql: string
    //connection : Connection
    //fetchDirection: number
    fetchSize: number = 500
    queryTimeout: number = 30000
    //concurrency: ResultSetConcurrency
    //holdability: ResultSetHoldability
    //type: ResultSetType
    closed: boolean = false

    constructor(request: mssql.Request) {
        this.request = request
    }

    addBatch(sql: string): Statement {
        throw new Error("Method not implemented.");
    }

    clearBatch(): Statement {
        throw new Error("Method not implemented.");
    }

    cancel(): Promise<Result> {
        this.request.cancel()
        return undefined
    }

    close(): Promise<Result> {
        this.request.removeAllListeners()
        this.closed = true
        return undefined
    }

    async execute(sql: string, autogens?: string[]): Promise<RowSet> {
        this.sql = sql
        this.request.stream = true
        this.request.query(sql)
        this.result = new MSSQLResult(this.request, this.fetchSize)
        return this.fetch()
    }

    async fetch() : Promise<RowSet> {
        let rowSet = await this.result.fetch()
        if (this.result.done) this.close()
        return rowSet
    }

    executeBatch(): Promise<Result[]> {
        throw new Error("Method not implemented.");
    }

    generatedKeys(): Promise<RowSet> {
        throw new Error("Method not implemented.");
    }

}
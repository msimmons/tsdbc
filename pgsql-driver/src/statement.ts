import { Statement, Connection, ResultSetConcurrency, ResultSetHoldability, ResultSetType, Result, RowSet } from "tsdbc";
import { PoolClient } from 'pg'
import { PGResult } from "./result";
import * as Cursor from 'pg-cursor'

export class PGStatement implements Statement {

    private client: PoolClient
    result: PGResult
    sql: string
    //connection : Connection
    //fetchDirection: number
    fetchSize: number = 500
    queryTimeout: number = 30000
    //concurrency: ResultSetConcurrency
    //holdability: ResultSetHoldability
    //type: ResultSetType
    closed: boolean = false
    query: any

    constructor(client: PoolClient) {
        this.client = client
    }

    addBatch(sql: string): Statement {
        throw new Error("Method not implemented.");
    }

    clearBatch(): Statement {
        throw new Error("Method not implemented.");
    }

    cancel(): Promise<Result> {
        // TODO
        return undefined
    }

    close(): Promise<Result> {
        // TODO
        this.closed = true
        return undefined
    }

    async execute(sql: string, autogens?: string[]): Promise<RowSet> {
        this.sql = sql
        let cursor = new Cursor(sql)
        this.query = await this.client.query(cursor)
        this.result = new PGResult(cursor, this.fetchSize)
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
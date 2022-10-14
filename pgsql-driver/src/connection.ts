import { Connection, Result, CallableStatement, TransactionIsolation, PreparedStatement, DatabaseError, PlanData } from 'tsdbc'
import { PoolClient } from 'pg'
import * as Cursor from 'pg-cursor'
import { PGResult } from './result'

export class PGConnection implements Connection {

    private client: PoolClient
    queryTimeout: number
    networkTimeout: number
    fetchSize: number
    autoCommit: boolean
    inTransaction = false

    constructor(client: PoolClient, autoCommit: boolean) {
        this.autoCommit = autoCommit
        this.client = client
    }

    async execute(sql: string, autogens?: string[]): Promise<Result> {
        let cursor = await new Cursor(sql, [])
        await this.client.query(cursor)
        return new PGResult(sql, cursor, this.fetchSize)
    }

    prepareCall(sql: string): CallableStatement {
        throw new Error("Method not implemented.");
    }

    prepareStatement(sql: string): PreparedStatement {
        throw new Error("Method not implemented.");
    }

    transactionIsolation : TransactionIsolation
    closed : boolean = false
    readOnly : boolean

    valid(timeout: number): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    async begin(isolation? : TransactionIsolation) : Promise<void> {
        await this.client.query('BEGIN') // TODO Isolation level?
        this.inTransaction = true
    }

    setSavepoint(name?: string) : Promise<void> {
        throw new Error("Method not implemented.");
    }

    releaseSavepoint(savepoint: any): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async rollback(savepoint?: any): Promise<void> {
        try {
            if (this.inTransaction) await this.client.query('ROLLBACK')
            this.inTransaction = false
        } catch (error) {
            console.log(`Error rolling back: ${error}`)
        }
    }

    async commit(): Promise<void> {
        if (this.inTransaction) await this.client.query('COMMIT')
        this.inTransaction = false
    }

    close(): Promise<void> {
        console.log("releasing connection")
        this.client.release()
        this.closed = true
        return undefined
    }

    private translateIsolationLevel(isoIn: TransactionIsolation) {
        switch(isoIn) {
            case undefined: return undefined
            case TransactionIsolation.None: return undefined
            case TransactionIsolation.ReadCommitted: return ''
            case TransactionIsolation.ReadUncommitted: return ''
            case TransactionIsolation.RepeatableRead: return ''
            case TransactionIsolation.Serializable: return ''
            default: return undefined
        }
    }
}
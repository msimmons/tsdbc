import { Connection, Result, CallableStatement, TransactionIsolation, PreparedStatement, DatabaseError } from 'tsdbc'
import { PoolClient } from 'pg'
import * as Cursor from 'pg-cursor'
import { PGResult } from './result'

export class PGConnection implements Connection {

    private client: PoolClient
    queryTimeout: number
    networkTimeout: number
    fetchSize: number
    autoCommit: boolean

    constructor(client: PoolClient, autoCommit: boolean) {
        this.autoCommit = autoCommit
        this.client = client
    }

    async execute(sql: string, autogens?: string[]): Promise<Result> {
        let cursor = new Cursor(sql)
        let query = await this.client.query(cursor)
        console.log(query)
        return new PGResult(sql, cursor, this.fetchSize)
    }

    prepareCall(sql: string): CallableStatement {
        throw new Error("Method not implemented.");
    }

    prepareStatement(sql: string): PreparedStatement {
        throw new Error("Method not implemented.");
    }

    // catalog(): string {
    //     return ''
    // }
    // schema(): string {
    //     return ''
    // }

    // holdability : ResultSetHoldability
    // networkTimeout :  number
    transactionIsolation : TransactionIsolation
    // warnings(): string {
    //     throw new Error("Method not implemented.");
    // }
    closed : boolean = false
    readOnly : boolean

    valid(timeout: number): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    // abort(): Promise<Result> {
    //     throw new Error("Method not implemented.");
    // }

    // clearWarnings(): void {
    //     throw new Error("Method not implemented.");
    // }

    async begin(isolation? : TransactionIsolation) : Promise<void> {
        await this.client.query('BEGIN') // TODO Isolation level?
    }

    setSavepoint(name?: string) : Promise<void> {
        throw new Error("Method not implemented.");
    }

    releaseSavepoint(savepoint: any): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async rollback(savepoint?: any): Promise<void> {
        await this.client.query('ROLLBACK')
    }

    async commit(): Promise<void> {
        await this.client.query('COMMIT')
    }

    close(): Promise<void> {
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
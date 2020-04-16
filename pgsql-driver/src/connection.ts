import { Connection, Result, ResultSetType, ResultSetConcurrency, ResultSetHoldability, CallableStatement, TransactionIsolation, Statement, PreparedStatement, DatabaseError } from '../../api/src/tsdbc_api'
import { Pool, PoolClient } from 'pg'
import { PGStatement } from './statement'

export class PGConnection implements Connection {

    private client: PoolClient
    private statement: PGStatement
    
    autoCommit: boolean
    networkTimeout: number

    constructor(client: PoolClient, autoCommit: boolean) {
        this.autoCommit = autoCommit
        this.client = client
    }

    createStatement(type?: ResultSetType, concurrency?: ResultSetConcurrency, holdability?: ResultSetHoldability): Statement {
        if (this.statement && !this.statement.closed) throw new Error("A statement is still open")
        if (this.closed) throw new Error("The connection is closed")
        this.statement = new PGStatement(this.client)
        return this.statement
    }

    prepareCall(sql: string, type?: ResultSetType, concurrency?: ResultSetConcurrency, holdability?: ResultSetHoldability): CallableStatement {
        throw new Error("Method not implemented.");
    }

    prepareStatement(sql: string, type?: ResultSetType, concurrency?: ResultSetConcurrency, holdability?: ResultSetHoldability): PreparedStatement {
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
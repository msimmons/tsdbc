import { Connection, Result, ResultSetType, ResultSetConcurrency, ResultSetHoldability, CallableStatement, TransactionIsolation, Statement, PreparedStatement, DatabaseError } from 'tsdbc'
import { Request, Transaction, ConnectionPool, ISOLATION_LEVEL } from 'mssql'
import { MSSQLStatement } from './statement'

export class MSSQLConnection implements Connection {

    private request: Request
    private transaction: Transaction
    private statement: MSSQLStatement
    
    autoCommit: boolean
    networkTimeout: number

    constructor(pool: ConnectionPool, autoCommit: boolean) {
        this.autoCommit = autoCommit
        if (autoCommit) {
            this.request = pool.request()
        }
        else {
            this.transaction = pool.transaction()
            this.request = this.transaction.request()
        }
    }

    createStatement(type?: ResultSetType, concurrency?: ResultSetConcurrency, holdability?: ResultSetHoldability): Statement {
        if (this.statement && !this.statement.closed) throw new Error("A statement is still open")
        if (this.closed) throw new Error("The connection is closed")
        this.statement = new MSSQLStatement(this.request)
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

    begin(isolation? : TransactionIsolation) : Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.transaction) this.transaction.begin(this.translateIsolationLevel(isolation), error => {
                if (error) reject(<DatabaseError>{code: error.code, message: error.message, vendor: error})
                else resolve()
            })
            else resolve()
        })
    }

    setSavepoint(name?: string) : Promise<void> {
        throw new Error("Method not implemented.");
    }

    releaseSavepoint(savepoint: any): Promise<void> {
        throw new Error("Method not implemented.");
    }

    rollback(savepoint?: any): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.transaction) this.transaction.rollback(error => {
                if (error) reject(<DatabaseError>{code: error.code, message: error.message, vendor: error})
                else resolve()
            })
            else resolve()
        })
    }

    commit(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.transaction) this.transaction.commit(error => {
                if (error) reject(<DatabaseError>{code: error.code, message: error.message, vendor: error})
                else resolve()
            })
            else resolve()
        })
    }

    close(): Promise<void> {
        if (!this.request.canceled) this.request.cancel()
        this.closed = true
        return undefined
    }

    private translateIsolationLevel(isoIn: TransactionIsolation) {
        switch(isoIn) {
            case undefined: return undefined
            case TransactionIsolation.None: return undefined
            case TransactionIsolation.ReadCommitted: return ISOLATION_LEVEL.READ_COMMITTED
            case TransactionIsolation.ReadUncommitted: return ISOLATION_LEVEL.READ_UNCOMMITTED
            case TransactionIsolation.RepeatableRead: return ISOLATION_LEVEL.REPEATABLE_READ
            case TransactionIsolation.Serializable: return ISOLATION_LEVEL.SERIALIZABLE
            default: return undefined
        }
    }
}
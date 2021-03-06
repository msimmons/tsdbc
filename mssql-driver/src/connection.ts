import { Connection, Result, CallableStatement, TransactionIsolation, PreparedStatement, DatabaseError } from 'tsdbc'
import { Request, Transaction, ConnectionPool, ISOLATION_LEVEL } from 'mssql'
import { MSSQLResult } from './result'

export class MSSQLConnection implements Connection {

    private request: Request
    private transaction: Transaction
    
    autoCommit: boolean
    networkTimeout: number
    queryTimeout: number
    fetchSize: number
    transactionIsolation : TransactionIsolation
    closed : boolean = false
    readOnly : boolean

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
    async execute(sql: string, autogens?: string[]): Promise<Result> {
        this.request.stream = true
        let iresult = this.request.query(sql)
        return new MSSQLResult(sql, this.request, iresult, this.fetchSize)
    }

    prepareCall(sql: string): CallableStatement {
        throw new Error("Method not implemented.");
    }

    prepareStatement(sql: string): PreparedStatement {
        throw new Error("Method not implemented.");
    }

    valid(timeout: number): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    begin(isolation? : TransactionIsolation) : Promise<void> {
        this.transactionIsolation = isolation
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
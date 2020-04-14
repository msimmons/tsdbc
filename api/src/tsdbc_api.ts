export enum ResultSetType {
    ForwardOnly,
    ScrollInsensitive,
    ScrollSensitive
}

export enum ResultSetConcurrency {
    ReadOnly,
    Updateable
}

export enum ResultSetHoldability {
    HoldOverCommit,
    CloseOverCommit
}

export enum TransactionIsolation {
    ReadUncommitted,
    ReadCommitted,
    RepeatableRead,
    Serializable,
    None
}

export interface TableData {
    namespace: string
    name: string
    columns: ColumnData[]
}
export interface IndexData {
    name: string
    unique: boolean
    position: number
    descending: boolean
    filter?: string
}
export interface ColumnData {
    name: string
    type: string
    position: number
    size?: number
    default?: string
    nullable?: boolean
    autoincrement?: boolean
    keySequence?: number
    references?: [TableData, ColumnData]
    indices: IndexData[]
}
export interface ViewData {
    namespace: string
    name: string
    columns: ColumnData[]
}
export interface SequenceData {
    namespace: string
    name: string
}
export interface ParameterData {
    name: string
    type: string
    inOut: string
    default?: string
    position: number
    nullable?: boolean
}
export interface ProcedureData {
    namespace: string
    name: string
    parameters: ParameterData[]
}
export interface SynonymData{
    namespace: string
    name: string
    targetNamespace: string
    target: string
}

export interface OtherData{
    namespace: string
    name: string
    type: string
    vendor: any
}

export interface Namespace { // Schemas and Catalogs
    name: string
    tables: TableData[]
    views: ViewData[]
    sequences: SequenceData[]
    procedures: ProcedureData[]
    synonyms: SynonymData[]
    others: OtherData[]
}
export interface DatabaseMetadata {
    namespaces: Namespace[]
}

export class DatabaseError extends Error {
    readonly code: string
    readonly message: string
    readonly vendor: any
}

export interface DataSource {
    connect(autoCommit?: boolean) : Promise<Connection>
    metaData() : Promise<DatabaseMetadata>
    clientInfo() : Promise<Map<string, string>>
}

export interface Connection {

    readonly transactionIsolation : TransactionIsolation
    readonly closed : boolean
    networkTimeout : number
    readOnly : boolean
    autoCommit : boolean

    //abort() : Promise<Result>
    //clearWarnings() : void
    //warnings() : string
    // various object create functions

    createStatement(type?: ResultSetType, concurrency?: ResultSetConcurrency, holdability?: ResultSetHoldability) : Statement
    prepareCall(sql: string, type?: ResultSetType, concurrency?: ResultSetConcurrency, holdability?: ResultSetHoldability) : CallableStatement
    prepareStatement(sql: string, type?: ResultSetType, concurrency?: ResultSetConcurrency, holdability?: ResultSetHoldability) : PreparedStatement

    //catalog() : string
    //schema() : string
    //holdability : ResultSetHoldability
    //typemap?

    // Transaction related
    begin(isolation?: TransactionIsolation) : Promise<void>
    setSavepoint(name?: string) : Promise<void>
    releaseSavepoint(savepoint: any) : Promise<void>
    rollback(savepoint?: any) : Promise<void>
    commit() : Promise<void>

    valid(timeout: number) : Promise<boolean>
    close() : Promise<void>
}

export interface RowSet {
    readonly id: number
    readonly columns: any[]
    readonly rows: any[]
    readonly moreRows: boolean
}

export interface Result {
    readonly updateCounts: number[]
    readonly rowSets: RowSet[]
    readonly warnings: string[]
    readonly error: DatabaseError

    fetch() : Promise<RowSet>
}

export interface Statement {

    readonly closed : boolean
    fetchSize : number
    queryTimeout : number
    readonly result : Result

    addBatch(sql: string) : void
    clearBatch() : void
    executeBatch() : Promise<Result[]>

    execute(sql: string, autogens?: string[]) : Promise<RowSet>
    fetch() : Promise<RowSet>
    generatedKeys() : Promise<RowSet>

    cancel() : Promise<Result>
    close() : Promise<Result>
    //readonly connection : Connection
    //fetchDirection : number
    //concurrency : ResultSetConcurrency
    //holdability : ResultSetHoldability
    //type : ResultSetType
}

export interface CallableStatement extends Statement {
    // All the parameter and out param methods
}

export interface PreparedStatement extends Statement {}
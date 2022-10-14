import { DataSource, DatabaseError, DatabaseMetadata, Namespace, TableData, ProcedureData, ViewData, SequenceData, SynonymData, ColumnData, ParameterData, IndexData, DriverConfig, PlanData } from 'tsdbc'
import { PGConnection } from './connection'
import { SQL } from './sql'
import { Pool, PoolConfig }  from 'pg'

export class PGDataSource implements DataSource {

    private config: PoolConfig
    private pool: Pool
    lastError: DatabaseError

    constructor(config: DriverConfig, vendorConfig?: PoolConfig) {
        vendorConfig = vendorConfig ?? {host: config.host, user: config.username, password: config.password, database: config.database}
        vendorConfig.host = vendorConfig.host ?? config.host
        vendorConfig.port = vendorConfig.port ?? config.port
        vendorConfig.user = vendorConfig.user ?? config.username
        vendorConfig.password = vendorConfig.password ?? config.password
        vendorConfig.database = vendorConfig.database ?? config.database
        this.config = vendorConfig
    }

    public async close() {
        console.log("closing pool")
        if (this.pool) await this.pool.end()
        console.log("pool closed")
    }

    public async connect(autoCommit?: boolean) : Promise<PGConnection> {
        await this.start()
        try {
            console.log("connecting")
            let client = await this.pool.connect()
            client.on("error", (err) => {console.log(`client.error ${err}`)})
            client.on("end", () => {console.log("client.end")})
            client.on("drain", () => {console.log("client.drain")})
            client.on("notice", (arg) => {console.log(`client.notice ${arg}`)})
            client.on("notification", (arg) => {console.log(`client.notification ${arg}`)})
            console.log("connected")
            return new PGConnection(client, autoCommit)
        }
        catch (error) {
            throw {code: error.code, message: error.message, vendor: error}
        }
    }

    async clientInfo(): Promise<Map<string, string>> {
        await this.start()
        let result = await this.pool.query(SQL.CLIENT_INFO)
        let map = new Map<string,string>()
        if (result.rows.length === 1) {
            Object.keys(result.rows[0]).forEach(key => {
                map.set(key, result.rows[0][key])
            })
        }
        return map
    }

    async metaData(): Promise<DatabaseMetadata> {
        await this.start()
        let nsMap = new Map<string, Namespace>()
        let client = await this.pool.connect()
        let namespaces = (await client.query(SQL.NAMESPACES)).rows.map(record => {
            let ns = {name: record.nspname, tables: [], views: [], procedures: [], sequences: [], synonyms: [], others: []} as Namespace
            nsMap.set(ns.name, ns)
            return ns
        })
        let tableMap = new Map<string, TableData|ViewData>()
        let procMap = new Map<string, ProcedureData>()
        ;(await client.query(SQL.TABLES)).rows.forEach(record => {
            let table = {namespace: record.schemaname, name: record.tablename, columns: [], indices: []} as TableData
            let key = `${table.namespace}.${table.name}`
            tableMap.set(key, table)
            nsMap.get(table.namespace).tables.push(table)
        })
        ;(await client.query(SQL.VIEWS)).rows.forEach(record => {
            let view = {namespace: record.schemaname, name: record.viewname, columns: []} as ViewData
            let key = `${view.namespace}.${view.name}`
            tableMap.set(key, view)
            nsMap.get(view.namespace).views.push(view)
        })
        ;(await client.query(SQL.MATERIALIZED_VIEWS)).rows.forEach(record => {
            let view = {namespace: record.schemaname, name: record.matviewname, columns: []} as ViewData
            let key = `${view.namespace}.${view.name}`
            tableMap.set(key, view)
            nsMap.get(view.namespace).views.push(view)
        })
        ;(await client.query(SQL.PROCEDURES)).rows.forEach(record => {
            let proc = {namespace: record.schema, name: record.name, parameters: []} as ProcedureData
            let key = `${proc.namespace}.${proc.name}`
            procMap.set(key, proc)
            nsMap.get(proc.namespace).procedures.push(proc)
        })
        ;(await client.query(SQL.SEQUENCES)).rows.forEach(record => {
            let seq =  {namespace: record.schema, name: record.name} as SequenceData
            nsMap.get(seq.namespace).sequences.push(seq)
        })
        ;(await client.query(SQL.COLUMNS)).rows.forEach(record => {
            let column = {name: record.column_name, type: record.data_type, size: record.maxlen, position: record.position, nullable: record.is_nullable, indices: []} as ColumnData
            let key = `${record.schema}.${record.table_name}`
            if (tableMap.has(key)) tableMap.get(key).columns.push(column)
        })
        ;(await client.query(SQL.PARAMETERS)).rows.forEach(record => {
            let inOut = record.in_out ? 'OUT' : 'IN'
            let parameter = {name: record.name, type: record.data_type, size: record.maxlen, position: record.position, inOut: inOut, default: record.parameter_default} as ParameterData
            let key = `${record.schema}.${record.name}`
            if (procMap.has(key)) procMap.get(key).parameters.push(parameter)
        })
        ;(await client.query(SQL.INDEX_COLUMNS)).rows.forEach(record => {
            let key = `${record.schema}.${record.table_name}`
            if (tableMap.has(key)) {
                let table = <TableData>tableMap.get(key)
                let column = table.columns.find(c => c.name === record.column_name)
                let index = {name: record.index_name, position: record.position, descending: false, unique: record.is_unique} as IndexData
                if (column) column.indices.push(index)
                if (!table.indices.includes(index.name)) table.indices.push(index.name)
            }
        })
        client.release()
        return {namespaces: namespaces }
    }

    async explain(sql: string): Promise<PlanData> {
        await this.start()
        let client = await this.pool.connect()
        let result = await client.query(`EXPLAIN ${sql}`)
        for (const row of result.rows) {
            console.log(row);
        }
        client.release()
        return {}
    }

    private async start() {
        if (this.pool) return
        this.pool = new Pool(this.config)
        this.pool.on("acquire", (client) => {console.log(`pool.acquire`)})
        this.pool.on('error', (error) => {
            this.lastError = error ? <DatabaseError>{code: error.name, message: error.message, vendor: error} : undefined            
        })
        this.pool.on("connect", (client) => {console.log(`pool.connect`)})
        this.pool.on("remove", (client) => {console.log(`pool.remove`)})
    }

}
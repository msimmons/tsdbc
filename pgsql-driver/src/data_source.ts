import { DataSource, DatabaseError, DatabaseMetadata, Namespace, TableData, ProcedureData, ViewData, SequenceData, SynonymData, ColumnData, ParameterData, IndexData } from '../../api/src/tsdbc_api'
import { PGConnection } from './connection'
import { SQL } from './sql'
import { Pool, PoolConfig }  from 'pg'

export class PGDataSource implements DataSource {

    private config: PoolConfig
    private pool: Pool
    private info: Map<string, string>
    lastError: DatabaseError

    constructor(config: PoolConfig) {
        this.config = config
    }

    public async close() {
        if (this.pool) await this.pool.end()
    }

    public async connect(autoCommit?: boolean) : Promise<PGConnection> {
        await this.start()
        try {
            let client = await this.pool.connect()
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
        let tableMap = new Map<string, TableData>()
        let procMap = new Map<string, ProcedureData>()
        ;(await client.query(SQL.TABLES)).rows.forEach(record => {
            let table = {namespace: record.schemaname, name: record.tablename, columns: []} as TableData
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
        ;(await client.query(SQL.PROCEDURES)).rows.forEach(record => {
            let proc = {namespace: record.schema, name: record.name, parameters: []} as ProcedureData
            let key = `${proc.namespace}.${proc.name}`
            procMap.set(key, proc)
            nsMap.get(proc.namespace).procedures.push(proc)
        })
        ;(await client.query(SQL.SEQUENCES)).rows.forEach(record => {
            let seq =  {namespace: record.namespace, name: record.name} as SequenceData
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
                let column = tableMap.get(key).columns.find(c => c.name === record.column_name)
                let index = {name: record.index_name, position: 0, descending: false, unique: record.is_unique} as IndexData
                if (column) column.indices.push(index)
            }
        })
        client.release()
        return {namespaces: namespaces }
    }

    private async start() {
        if (this.pool) return
        this.pool = new Pool(this.config)
        this.pool.on('error', (error) => {
            this.lastError = error ? <DatabaseError>{code: error.name, message: error.message, vendor: error} : undefined            
        })
    }

}
import { DataSource, DatabaseError, DatabaseMetadata, Namespace, TableData, ProcedureData, ViewData, SequenceData, SynonymData, ColumnData, ParameterData, IndexData, DriverConfig, PlanData } from 'tsdbc'
import { MSSQLConnection } from './connection'
import { SQL } from './sql'
import { config, ConnectionPool, Request } from 'mssql'

export class MSSQLDataSource implements DataSource {

    private config: config
    private pool: ConnectionPool
    private info: Map<string, string>
    lastError: DatabaseError

    constructor(config: DriverConfig, vendorConfig?: config) {
        vendorConfig = vendorConfig ?? {server: config.host, port: config.port, user: config.username, password: config.password, database: config.database}
        vendorConfig.server = vendorConfig.server ?? config.host
        vendorConfig.user = vendorConfig.user ?? config.username
        vendorConfig.password = vendorConfig.password ?? config.password
        vendorConfig.database = vendorConfig.database ?? config.database
        this.config = vendorConfig
    }

    explain(sql: string): Promise<PlanData> {
        throw new Error('Method not implemented.')
    }

    public async close() : Promise<void> {
        return (this.pool.connected) ? await this.pool.close() : undefined
    }

    public async connect(autoCommit?: boolean) : Promise<MSSQLConnection> {
        await this.start()
        try {
            return new MSSQLConnection(this.pool, autoCommit)
        }
        catch (error) {
            throw {code: error.code, message: error.message, vendor: error}
        }
    }

    async clientInfo(): Promise<Map<string, string>> {
        await this.start()
        if (this.info) return this.info
        let request = this.pool.request()
        let result = await request.query(SQL.CLIENT_INFO)
        let map = new Map<string,string>()
        if (result.recordset.length === 1) {
            Object.keys(result.recordset[0]).forEach(key => {
                map.set(key, result.recordset[0][key])
            })
        }
        return map
    }

    async metaData(): Promise<DatabaseMetadata> {
        await this.start()
        let namespaces: Namespace[] = []
        let request = this.pool.request()
        let databases =  (await request.query(SQL.DATABASES)).recordset.map(record => {
            return record.name
        })
        for (var db of databases) {
            let ns = await this.processDatabase(db, request)
            namespaces = namespaces.concat(ns)
        }
        return {namespaces: namespaces }
    }

    private async processDatabase(db: string, request: Request) : Promise<Namespace[]> {
        let nsMap = new Map<string, Namespace>()
        await request.query(`use ${db}`)
        let namespaces = (await request.query(SQL.NAMESPACES)).recordset.map(record => {
            let fullNs = `${db}.${record.name}`
            let ns = {name: fullNs, tables: [], views: [], procedures: [], sequences: [], synonyms: [], others: []} as Namespace
            nsMap.set(record.name, ns)
            return ns
        })
        let tableMap = new Map<number, TableData|ViewData>()
        let procMap = new Map<number, ProcedureData>()
        ;(await request.query(SQL.OBJECTS)).recordset.forEach(record => {
            let type = record.type.trim()
            if (['U','S','IT'].includes(type)) {
                let fullNs = `${db}.${record.namespace}`
                let table = {namespace: fullNs, name: record.name, columns: [], indices: []} as TableData
                tableMap.set(record.object_id, table)
                nsMap.get(record.namespace).tables.push(table)
            }
            else if (['V'].includes(type)) {
                let fullNs = `${db}.${record.namespace}`
                let view = {namespace: fullNs, name: record.name, columns: []} as ViewData
                tableMap.set(record.object_id, view)
                nsMap.get(record.namespace).views.push(view)
            }
            else if (['SO'].includes(type)) {
                let fullNs = `${db}.${record.namespace}`
                let seq =  {namespace: fullNs, name: record.name} as SequenceData
                nsMap.get(record.namespace).sequences.push(seq)
            }
            else if (['P', 'FN'].includes(type)) {
                let fullNs = `${db}.${record.namespace}`
                let proc = {namespace: fullNs, name: record.name, parameters: []} as ProcedureData
                procMap.set(record.object_id, proc)
                nsMap.get(record.namespace).procedures.push(proc)
            }
        })
        ;(await request.query(SQL.SYNONYMS)).recordset.forEach(record => {
            // TODO parse the target name into namespace and name
            let fullNs = `${db}.${record.namespace}`
            let syn = {namespace: fullNs, name: record.name, target: record.target_name} as SynonymData
            nsMap.get(record.namespace).synonyms.push(syn)
        })
        ;(await request.query(SQL.COLUMNS)).recordset.forEach(record => {
            let column = {name: record.name, type: record.type_name, size: record.max_length, position: record.column_id, nullable: record.is_nullable, indices: []} as ColumnData
            if (tableMap.has(record.object_id)) tableMap.get(record.object_id).columns.push(column)
        })
        ;(await request.query(SQL.PARAMETERS)).recordset.forEach(record => {
            let inOut = record.is_output ? 'OUT' : 'IN'
            let parameter = {name: record.name, type: record.type_name, size: record.max_length, position: record.parameter_id, inOut: inOut, default: record.default_value} as ParameterData
            if (procMap.has(record.object_id)) procMap.get(record.object_id).parameters.push(parameter)
        })
        ;(await request.query(SQL.INDEX_COLUMNS)).recordset.forEach(record => {
            if (tableMap.has(record.object_id)) {
                let table = tableMap.get(record.object_id) as TableData
                let column = table.columns[record.column_id-1]
                let index = {name: record.name, position: record.key_ordinal, descending: record.is_descending_key, unique: record.is_unique} as IndexData
                if (column) column.indices.push(index)
                if (!table.indices.includes(index.name)) table.indices.push(index.name)
            }
        })
        return namespaces
    }

    private async start() {
        if (this.pool && (this.pool.connected || this.pool.connecting)) return
        this.pool = new ConnectionPool(this.config, (error) => {
            this.lastError = error ? <DatabaseError>{code: error.code, message: error.message, vendor: error} : undefined
        })
        try {
            await this.pool.connect()
        }
        catch (error) {
            throw <DatabaseError>{code: error.code, message: error.message, vendor: error}
        }
    }

}
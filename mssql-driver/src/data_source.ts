import { DataSource, DatabaseError, DatabaseMetadata, Namespace, TableData, ProcedureData, ViewData, SequenceData, SynonymData, ColumnData, ParameterData, IndexData } from '../../api/src/tsdbc_api'
import { MSSQLConnection } from './connection'
import { SQL } from './sql'
import * as mssql from 'mssql'

export class MSSQLDataSource implements DataSource {

    private config: mssql.config
    private pool: mssql.ConnectionPool
    private info: Map<string, string>
    lastError: DatabaseError

    constructor(config: mssql.config) {
        this.config = config
    }

    public async close() {
        (this.pool.connected) ? await this.pool.close() : undefined
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
        Object.keys(result.recordset.columns).forEach(key => {
            //console.log(result.recordset.columns[key])
        })
        console.log({...result})
        //console.log(result.recordset.toTable().rows)
        return new Map()
    }

    async metaData(): Promise<DatabaseMetadata> {
        await this.start()
        let nsMap = new Map<string, Namespace>()
        let request = this.pool.request()
        let namespaces = (await request.query(SQL.NAMESPACES)).recordset.map(record => {
            let ns = {name: record.name, tables: [], views: [], procedures: [], sequences: [], synonyms: [], others: []} as Namespace
            nsMap.set(ns.name, ns)
            return ns
        })
        let tableMap = new Map<number, TableData>()
        let procMap = new Map<number, ProcedureData>()
        ;(await request.query(SQL.OBJECTS)).recordset.forEach(record => {
            let type = record.type.trim()
            if (['U','S','IT'].includes(type)) {
                let table = {namespace: record.namespace, name: record.name, columns: []} as TableData
                tableMap.set(record.object_id, table)
                nsMap.get(table.namespace).tables.push(table)
            }
            else if (['V'].includes(type)) {
                let view = {namespace: record.namespace, name: record.name, columns: []} as ViewData
                tableMap.set(record.object_id, view)
                nsMap.get(view.namespace).views.push(view)
            }
            else if (['SO'].includes(type)) {
                let seq =  {namespace: record.namespace, name: record.name} as SequenceData
                nsMap.get(seq.namespace).sequences.push(seq)
            }
            else if (['P', 'FN'].includes(type)) {
                let proc = {namespace: record.namespace, name: record.name, parameters: []} as ProcedureData
                procMap.set(record.object_id, proc)
                nsMap.get(proc.namespace).procedures.push(proc)
            }
        })
        ;(await request.query(SQL.SYNONYMS)).recordset.forEach(record => {
            // TODO parse the target name into namespace and name
            let syn = {namespace: record.namespace, name: record.name, target: record.target_name} as SynonymData
            nsMap.get(syn.namespace).synonyms.push(syn)
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
                let column = tableMap.get(record.object_id).columns[record.column_id-1]
                let index = {name: record.name, position: record.key_ordinal, descending: record.is_descending_key, unique: record.is_unique} as IndexData
                    column.indices.push(index)
            }
        })
        return {namespaces: namespaces }
    }

    private async start() {
        if (this.pool && (this.pool.connected || this.pool.connecting)) return
        this.pool = new mssql.ConnectionPool(this.config, (error) => {
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
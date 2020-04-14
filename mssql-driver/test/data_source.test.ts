import { MSSQLDataSource } from '../src/data_source'
import * as mssql from 'mssql'
import {expect} from '../../api/node_modules/chai'
import * as M from '../../api/node_modules/mocha'
import {config} from './test_config'
import { DatabaseError } from '../../api/src/tsdbc_api'

M.describe('A DataSource', () => {

    M.it('returns a successful connection', async () => {
        let ds = new MSSQLDataSource(config)
        let connection = await ds.connect()
        expect(connection).to.not.be.undefined
        await ds.close()
    })

    M.it('returns an error if it fails to connect', async () => {
        let ds = new MSSQLDataSource({...config, password: 'foo'})
        let caught: DatabaseError
        try {
            let result = await ds.connect()
            expect(result).to.be.undefined
        }
        catch (error) {
            caught = error
        }
        expect(caught).to.not.be.undefined
        await ds.close()
    })

    M.it('returns client info', async () => {
        let ds = new MSSQLDataSource(config)
        let clientInfo = await ds.clientInfo()
        expect(clientInfo).to.not.be.undefined
        //await ds.close()
    })

    M.it('returns database meta data', async () => {
        let ds = new MSSQLDataSource(config)
        let info = await ds.metaData()
        expect(info.namespaces.length).to.be.gt(0)
        let sys = info.namespaces.find(ns => ns.name === 'sys')
        expect(sys.tables.length).to.be.gt(0)
        expect(sys.tables[0].columns.length).to.be.gt(0)
        sys.tables.forEach(p => {
            //p.columns.forEach(pa => console.log(pa))
        })
        await ds.close()
    })
})
import { MSSQLDataSource } from '../src/data_source'
import * as fs from 'fs'
import {expect} from 'chai'
import 'mocha'
import {config} from './test_config'
import { DatabaseError } from 'tsdbc'

describe('A DataSource', () => {

    it('returns a successful connection', async () => {
        let ds = new MSSQLDataSource(config)
        let connection = await ds.connect()
        expect(connection).to.not.be.undefined
        await ds.close()
    })

    it('returns an error if it fails to connect', async () => {
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

    it('returns client info', async () => {
        let ds = new MSSQLDataSource(config)
        let clientInfo = await ds.clientInfo()
        expect(clientInfo).to.not.be.undefined
        //await ds.close()
    })

    it('returns database meta data', async () => {
        let ds = new MSSQLDataSource(config)
        let info = await ds.metaData()
        expect(info.namespaces.length).to.be.gt(0)
        console.log(info.namespaces.map(ns => ns.name))
        let sys = info.namespaces.find(ns => ns.name.endsWith('.sys'))
        expect(sys.tables.length).to.be.gt(0)
        expect(sys.tables[0].columns.length).to.be.gt(0)
        sys.tables.forEach(p => {
            //p.columns.forEach(pa => console.log(pa))
        })
        await ds.close()
    })
})
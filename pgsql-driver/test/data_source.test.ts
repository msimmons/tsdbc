import { PGDataSource } from '../src/data_source'
import {expect} from 'chai'
import 'mocha'
import {config, config2} from './test_config'
import { DatabaseError } from 'tsdbc'

describe('A DataSource', () => {

    it('returns a successful connection', async () => {
        let ds = new PGDataSource(config)
        let connection = await ds.connect()
        expect(connection).to.not.be.undefined
        connection.close()
        await ds.close()
    })

    it('returns an error if it fails to connect', async () => {
        let ds = new PGDataSource({...config, password: 'foo'})
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
        let ds = new PGDataSource(config)
        let clientInfo = await ds.clientInfo()
        expect(clientInfo).to.not.be.undefined
        await ds.close()
    })

    it('returns database meta data', async () => {
        let ds = new PGDataSource(config2, {})
        let info = await ds.metaData()
        expect(info.namespaces.length).eql(6)
        await ds.close()
    })

    it('returns the explain plan', async () => {
        let ds = new PGDataSource(config2, {})
        let info = await ds.explain("select * from users")
        await ds.close()
    })

})
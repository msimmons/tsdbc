import { PGDataSource } from '../src/data_source'
import {expect} from 'chai'
import 'mocha'
import {config} from './test_config'

describe('A Connection', () => {
    let ds : PGDataSource
    beforeEach(async function() {
        ds = new PGDataSource(config)
    })

    afterEach(async function() {
        await ds.close()
    })

    it("connects to the database", async function() {
        try {
            let connection = await ds.connect()
            expect(connection).not.undefined
            await connection.close()
        } catch(error) {
            expect(error).be.undefined
        }
    })

    it("executes a sql statement", async function() {
        try {
            let connection = await ds.connect()
            expect(connection).not.undefined
            let result = await connection.execute("select * from pg_stat_activity")
            let rowSet = await result.fetch()
            console.log(rowSet)
            await result.close()
            await connection.close()
        } catch(error) {
            expect(error).undefined
        }
    })
})
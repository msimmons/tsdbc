import { PGDataSource } from '../src/data_source'
import 'mocha'
import {expect} from 'chai'
import {config} from './test_config'
import { RowSet, DatabaseError } from '../../api/src/tsdbc_api'

describe('A Statement', () => {
    let ds = new PGDataSource(config)

    it('Executes a statement', async () => {
        let cnx = await ds.connect(false)
        let statement = cnx.createStatement()
        statement.fetchSize = 100
        await cnx.begin()
        let set = await statement.execute('select * from pg_catalog.pg_class')
        let setCount = 0
        while(set) {
            if (set) {
                setCount++
                expect(set.columns.length).to.be.eq(33)
                expect(set.rows.length).to.be.lte(statement.fetchSize)
            }
            set = await statement.fetch()
        }
        expect(setCount).to.be.eq(4)
        await cnx.commit()
    })

    it('Fails on a bad statement', async () => {
        let cnx = await ds.connect(true)
        let statement = cnx.createStatement()
        let caught: DatabaseError
        try {
            await statement.execute('select * from sys.allf_objects')
        }
        catch(error) {
            caught = error
        }
        expect(caught).to.not.be.undefined
        console.log(caught.message)
    })

    it('Executes a DDL and DML statement', async () => {
        let cnx = await ds.connect(true)
        let statement = cnx.createStatement()
        statement.fetchSize = 500
        try {
            await statement.execute('drop table test')
        }
        catch (error) {}
        let rows = await statement.execute('create table test(col1 text)')
        rows = await statement.execute(`insert into test values ('hello')`)
        console.log(statement.result.updateCounts)
    })

})
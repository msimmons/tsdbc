import { PGDataSource } from '../src/data_source'
import 'mocha'
import {expect} from 'chai'
import {config} from './test_config'
import { RowSet, DatabaseError } from 'tsdbc'

describe('A Statement', () => {
    let ds = new PGDataSource(config)

    it('Executes a statement', async () => {
        let cnx = await ds.connect(false)
        cnx.fetchSize = 100
        await cnx.begin()
        let result = await cnx.execute('select * from pg_catalog.pg_class')
        let set = await result.fetch()
        let setCount = 0
        while(set) {
            if (set) {
                setCount++
                expect(set.columns.length).to.be.eq(33)
                expect(set.rows.length).to.be.lte(cnx.fetchSize)
            }
            set = await result.fetch()
        }
        expect(setCount).to.be.eq(4)
        await cnx.commit()
        await cnx.close()
    })

    it('Fails on a bad statement', async () => {
        let cnx = await ds.connect(true)
        let caught: DatabaseError
        try {
            let result = await cnx.execute('select * from sys.allf_objects')
            await result.fetch()
        }
        catch(error) {
            caught = error
        }
        expect(caught).to.not.be.undefined
        console.log(caught.message)
        await cnx.close()
    })

    it('Executes a DDL and DML statement', async () => {
        let cnx = await ds.connect(true)
        cnx.fetchSize = 500
        try {
            let result = await cnx.execute('drop table test')
            await result.fetch()
        }
        catch (error) {}
        let result = await cnx.execute('create table test(col1 text)')
        await result.fetch()
        result = await cnx.execute(`insert into test values ('hello') returning *`)
        let set = await result.fetch()
        await cnx.close()
    })

})
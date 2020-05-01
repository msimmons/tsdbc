import { MSSQLDataSource } from '../src/data_source'
import 'mocha'
import {expect} from 'chai'
import {config} from './test_config'
import { RowSet, DatabaseError } from 'tsdbc'
import { stat } from 'fs'

describe('A Statement', () => {
    let ds = new MSSQLDataSource(config)

    it('Executes a statement', async () => {
        let cnx = await ds.connect(false)
        cnx.fetchSize = 500
        await cnx.begin()
        let result = await cnx.execute('select * from sys.all_objects')
        let set = await result.fetch()
        let setCount = 0
        while(set) {
            if (set) {
                setCount++
                expect(set.columns.length).to.be.eq(12)
                expect(set.rows.length).to.be.lte(500)
            }
            set = await result.fetch()
        }
        expect(setCount).to.be.eq(5)
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
        let dropResult = await cnx.execute('drop table test')
        await dropResult.fetch()
        let createResult = await cnx.execute('create table test(col1 text)')
        await createResult.fetch()
        let insertResult = await cnx.execute(`insert into test values ('hello')`)
        let rs = await insertResult.fetch()
        while(rs) { console.log(rs); rs = await insertResult.fetch()}
        await cnx.close()
    })

})
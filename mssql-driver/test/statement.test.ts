import { MSSQLDataSource } from '../src/data_source'
import 'mocha'
import {expect} from 'chai'
import {config} from './test_config'
import { RowSet, DatabaseError } from '../../api/src/tsdbc_api'
import { stat } from 'fs'

describe('A Statement', () => {
    let ds = new MSSQLDataSource(config)

    it('Executes a statement', async () => {
        let cnx = await ds.connect(false)
        let statement = cnx.createStatement()
        statement.fetchSize = 500
        await cnx.begin()
        let set = await statement.execute('select * from sys.all_objects')
        let setCount = 0
        while(set) {
            if (set) {
                setCount++
                expect(set.columns.length).to.be.eq(12)
                expect(set.rows.length).to.be.lte(500)
            }
            set = await statement.fetch()
        }
        expect(setCount).to.be.eq(5)
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
        await statement.execute('drop table test')
        let rows = await statement.execute('create table test(col1 text)')
        rows = await statement.execute(`insert into test values ('hello')`)
        rows = await statement.execute('select * from sys.all_objects')
    })

})
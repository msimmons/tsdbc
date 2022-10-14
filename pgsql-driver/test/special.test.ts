import { PGDataSource } from '../src/data_source'
import 'mocha'
import {expect} from 'chai'
import {config,config2} from './test_config'
import { RowSet, DatabaseError } from 'tsdbc'

describe('A Statement', () => {
    let ds = new PGDataSource(config2)

    it('Executes the statement', async () => {
        let cnx = await ds.connect(false)
        let md = await ds.metaData()
        console.log(md.namespaces.map(ns => ns.sequences))
          cnx.fetchSize = 100
        await cnx.begin()
        try {
        let result = await cnx.execute(`select offer_id, offer->'id', offer->'type' from offers`)
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
    } catch(error) {
        console.log(error)
    }
    await cnx.commit()
     await cnx.rollback()
        await cnx.close()
    })
})
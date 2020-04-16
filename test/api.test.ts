import {expect} from 'chai'
import * as M from 'mocha'
import { DataSource } from '../api/src/tsdbc_api'

M.describe('A Driver Manager', () => {

    it('Loads the requested driver', async () => {
        try {
            let driver = await import('../mssql-driver/src/driver')
            let ds = driver.driver.load({})
            await ds.connect()
        }
        catch (error) {
            console.log(error)
        }
    })
})
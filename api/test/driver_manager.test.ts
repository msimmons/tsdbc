import {expect} from 'chai'
import * as M from 'mocha'
import { DataSource } from '../src/tsdbc_api'
import { DriverManager } from '../src/driver_manager'

M.describe('A Driver Manager', () => {

    it('Loads the requested driver', async () => {
        try {
            //let driver = await DriverManager.load('../../mssql-driver/dist/driver.js')
            let driver = await DriverManager.load('../../pgsql-driver/dist/driver.js')
            //let ds = driver.load({server: 'localhost', user: 'sa', password: 'K3nd0n60'})
            let ds = driver.load({server: 'localhost', user: 'postgres', password: 'password'})
            await ds.connect()
            console.log(await ds.clientInfo())
        }
        catch (error) {
            console.log(error)
        }
    })
})
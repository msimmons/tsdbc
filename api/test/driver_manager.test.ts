import {expect} from 'chai'
import * as M from 'mocha'
import { DataSource, DriverManager } from '../src/tsdbc_api'

M.describe('A Driver Manager', () => {

    it('Loads the mssql driver', async () => {
        try {
            let driver = await DriverManager.load('../../mssql-driver/dist/driver.js')
            let ds = driver.load({host: 'localhost', username: 'sa', password: 'K3nd0n60', database: undefined})
            await ds.connect()
            console.log(await ds.clientInfo())
        }
        catch (error) {
            console.log(error)
        }
    })

    it('Loads the pgsql driver', async () => {
        try {
            let driver = await DriverManager.load('../../pgsql-driver/dist/driver.js')
            let ds = driver.load({host: 'localhost', username: 'postgres', password: 'password', database: undefined})
            await ds.connect()
            console.log(await ds.clientInfo())
        }
        catch (error) {
            console.log(error)
        }
    })
})
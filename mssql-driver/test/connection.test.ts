import { MSSQLDataSource } from '../src/data_source'
import * as mssql from 'mssql'
import {expect} from '../../api/node_modules/chai'
import * as M from '../../api/node_modules/mocha'
import {config} from './test_config'

M.describe('A Connection', () => {
    let ds = new MSSQLDataSource(config)
})
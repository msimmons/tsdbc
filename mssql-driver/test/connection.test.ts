import { MSSQLDataSource } from '../src/data_source'
import * as mssql from 'mssql'
import {expect} from 'chai'
import 'mocha'
import {config} from './test_config'

describe('A Connection', () => {
    let ds = new MSSQLDataSource(config)
})
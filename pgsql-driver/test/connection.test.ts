import { PGDataSource } from '../src/data_source'
import {expect} from 'chai'
import 'mocha'
import {config} from './test_config'

describe('A Connection', () => {
    let ds = new PGDataSource(config)
})
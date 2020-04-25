import { Driver, DataSource } from 'tsdbc'
import { PGDataSource } from './data_source'

export const driver = {
    load(config: any, vendorConfig?: any): DataSource {
        return new PGDataSource(config)
    }
} as Driver

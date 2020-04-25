import { Driver, DataSource } from 'tsdbc'
import { MSSQLDataSource } from './data_source'

export const driver = {
    load(config: any, vendorConfig?: any): DataSource {
        return new MSSQLDataSource(config)
    }
} as Driver

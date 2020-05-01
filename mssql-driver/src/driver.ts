import { Driver, DataSource, DriverConfig } from 'tsdbc'
import { MSSQLDataSource } from './data_source'

export const driver = {
    load(config: DriverConfig, vendorConfig?: any): DataSource {
        return new MSSQLDataSource(config)
    }
} as Driver

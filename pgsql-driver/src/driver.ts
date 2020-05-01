import { Driver, DataSource, DriverConfig } from 'tsdbc'
import { PGDataSource } from './data_source'

export const driver = {
    load(config: DriverConfig, vendorConfig?: any): DataSource {
        return new PGDataSource(config, vendorConfig)
    }
} as Driver

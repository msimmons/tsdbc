import { Driver } from "./tsdbc_api";

export class DriverManager {

    static async load(path: string) : Promise<Driver> {
        let driver = await import(path)
        console.log(driver)
        return driver.driver
    }
}
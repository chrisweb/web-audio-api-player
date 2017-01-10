
'use strict';

export interface IConfiguration {
    clientID: number,
    clientSecret: string
}

export default class Configuration {

    constructor() {

        let configuration: IConfiguration = {
            clientID: 1111111111,
            clientSecret: '00000AAAAAAAAAA00000000BBBBBBBBBBB'
        };

        return configuration;

    }

}

'use strict';

export interface IConfiguration {
    clientID: number;
    clientSecret: string;
}

export class Configuration implements IConfiguration {

    readonly clientID: number;
    readonly clientSecret: string;

    constructor() {

        this.clientID = 111111111111;
        this.clientSecret = '111111111111aaaaaaaaaaa111111111111';

    }

}

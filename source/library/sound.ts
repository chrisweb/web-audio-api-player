
'use strict';

export interface ISound {
    buffered: boolean;
    url: string;
    playing: boolean;
}

export interface IOptions {

}

export default class sound {

    private sound: ISound;
    private options: IOptions;

    constructor(options: IOptions) {

        this.options = options;

    }



}
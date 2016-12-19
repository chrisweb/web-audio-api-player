
'use strict';

import { PlayerError, IPlayerError } from './error';

export interface IRequested {
    url: string;
    loadingProgress: number;
}

export interface IRequestResponse {
    arrayBuffer: ArrayBuffer;
}

export class Request {

    // TODO: add possibility to abort http request

    public getArrayBuffer(requested: IRequested): Promise<IRequestResponse | IPlayerError> {
        
        return new Promise(function (resolve, reject) {

            var xhr = new XMLHttpRequest();
            // thirs parameter is for "async", default true but who knows if prefer to explicitly set it just in case
            xhr.open('GET', requested.url, true);
            // set the expected response type from the server to arraybuffer
            xhr.responseType = 'arraybuffer';
            
            xhr.onload = function () {

                // gets called even on for example 404, so check the status
                if (xhr.status === 200) {

                    // successful request so now we can resolve the promise
                    resolve(xhr.response);

                } else {

                    // something went wrong so we reject with an error
                    reject(new PlayerError(xhr.statusText, xhr.status));

                }

            };

            xhr.onprogress = function (event) {

                var percentage = 100 / (event.total / event.loaded);

                // update value on sound object
                requested.loadingProgress = percentage;

            };

            // also reject for any kind of network errors
            xhr.onerror = function () {

                reject(new PlayerError('xhr network error'));

            };

            // now make the request
            xhr.send();

        });

    }

}

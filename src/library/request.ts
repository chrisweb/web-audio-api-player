import { IOnProgress } from './sound';

export interface IRequested {
    url: string;
    loadingProgress: number;
    onLoading?: IOnProgress;
}

export class PlayerRequest {

    public getArrayBuffer(requested: IRequested): Promise<ArrayBuffer> {

        return new Promise(function (resolve, reject) {

            const xhr = new XMLHttpRequest();

            // third parameter is for "async", should already be "true" by default
            // but who knows maybe a browser vendor decides to change it
            // so I prefer to explicitly set it to "true" just in case
            xhr.open('GET', requested.url, true);

            // set the expected response type from the server to arraybuffer
            xhr.responseType = 'arraybuffer';

            xhr.onload = function (): void {

                // gets called even for example a code 404, so check the status is in the 2xx range
                if (xhr.status >= 200 && xhr.status <= 299) {
                    resolve(xhr.response);
                } else {
                    // status code is not 2xx, reject with an error
                    reject(new Error(xhr.statusText + '(status:' + xhr.status + ')'));
                }

            };

            xhr.onprogress = function (event): void {

                const loadingPercentageRaw = 100 / (event.total / event.loaded);
                const loadingPercentage = Math.round(loadingPercentageRaw);

                // update value on sound object
                requested.loadingProgress = loadingPercentage;

                if (requested.onLoading !== null) {
                    requested.onLoading(loadingPercentage, event.total, event.loaded);
                }

            };

            // also reject for any kind of network errors
            xhr.onerror = function (error): void {

                reject(error);

            };

            xhr.send();

        });

    }

}

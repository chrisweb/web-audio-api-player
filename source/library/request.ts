
'use strict';

export class Request {

    // TODO: add possibility to abort http request

    public getAudioBuffer(soundUrl: string, audioContext: AudioContext, callback: (error: Error | boolean, buffer: AudioBuffer) => void): void {

        var xhr = new XMLHttpRequest();

        xhr.open('GET', soundUrl, true);
        xhr.responseType = 'arraybuffer';
        xhr.send();

        xhr.onerror = function (event) {

            console.log(event);

            // TODO: request error

            callback(new Error(), null);

        };

        xhr.onprogress = function (event) {
            
            var percentage = 100 / (event.total / event.loaded);

            // TODO: report back the loaded progressor set / update value on sound object?

        };

        xhr.onload = function () {

            audioContext.decodeAudioData(xhr.response, function onSuccess(decodedBuffer) {

                callback(false, decodedBuffer);

            }, function onFailure() {

                // TODO: decoding error

                callback(new Error(), null);

            });

        };

    }

}

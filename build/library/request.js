(function (dependencies, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(dependencies, factory);
    }
})(["require", "exports", "./error"], function (require, exports) {
    'use strict';
    var error_1 = require("./error");
    var PlayerRequest = (function () {
        function PlayerRequest() {
        }
        // TODO: add possibility to abort http request
        PlayerRequest.prototype.getArrayBuffer = function (requested) {
            return new Promise(function (resolve, reject) {
                var xhr = new XMLHttpRequest();
                // TODO: abort the request?
                // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/abort
                // thirs parameter is for "async", default true but who knows if prefer to explicitly set it just in case
                xhr.open('GET', requested.url, true);
                // set the expected response type from the server to arraybuffer
                xhr.responseType = 'arraybuffer';
                xhr.onload = function () {
                    // gets called even on for example 404, so check the status
                    if (xhr.status === 200) {
                        // successful request so now we can resolve the promise
                        resolve(xhr.response);
                    }
                    else {
                        // something went wrong so we reject with an error
                        reject(new error_1.PlayerError(xhr.statusText, xhr.status));
                    }
                };
                xhr.onprogress = function (event) {
                    var percentage = 100 / (event.total / event.loaded);
                    // update value on sound object
                    requested.loadingProgress = percentage;
                    requested.onLoading(percentage);
                };
                // also reject for any kind of network errors
                xhr.onerror = function () {
                    reject(new error_1.PlayerError('xhr network error'));
                };
                // now make the request
                xhr.send();
            });
        };
        return PlayerRequest;
    }());
    exports.PlayerRequest = PlayerRequest;
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9saWJyYXJ5L3JlcXVlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7SUFDQSxZQUFZLENBQUM7SUFFYixpQ0FBb0Q7SUFVcEQ7UUFBQTtRQTZEQSxDQUFDO1FBM0RHLDhDQUE4QztRQUV2QyxzQ0FBYyxHQUFyQixVQUFzQixTQUFxQjtZQUV2QyxNQUFNLENBQUMsSUFBSSxPQUFPLENBQUMsVUFBVSxPQUFPLEVBQUUsTUFBTTtnQkFFeEMsSUFBSSxHQUFHLEdBQUcsSUFBSSxjQUFjLEVBQUUsQ0FBQztnQkFFL0IsMkJBQTJCO2dCQUMzQix3RUFBd0U7Z0JBRXhFLHlHQUF5RztnQkFDekcsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFFckMsZ0VBQWdFO2dCQUNoRSxHQUFHLENBQUMsWUFBWSxHQUFHLGFBQWEsQ0FBQztnQkFFakMsR0FBRyxDQUFDLE1BQU0sR0FBRztvQkFFVCwyREFBMkQ7b0JBQzNELEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQzt3QkFFckIsdURBQXVEO3dCQUN2RCxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUUxQixDQUFDO29CQUFDLElBQUksQ0FBQyxDQUFDO3dCQUVKLGtEQUFrRDt3QkFDbEQsTUFBTSxDQUFDLElBQUksbUJBQVcsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO29CQUV4RCxDQUFDO2dCQUVMLENBQUMsQ0FBQztnQkFFRixHQUFHLENBQUMsVUFBVSxHQUFHLFVBQVUsS0FBSztvQkFFNUIsSUFBSSxVQUFVLEdBQUcsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBRXBELCtCQUErQjtvQkFDL0IsU0FBUyxDQUFDLGVBQWUsR0FBRyxVQUFVLENBQUM7b0JBRXZDLFNBQVMsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBRXBDLENBQUMsQ0FBQztnQkFFRiw2Q0FBNkM7Z0JBQzdDLEdBQUcsQ0FBQyxPQUFPLEdBQUc7b0JBRVYsTUFBTSxDQUFDLElBQUksbUJBQVcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUM7Z0JBRWpELENBQUMsQ0FBQztnQkFFRix1QkFBdUI7Z0JBQ3ZCLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUVmLENBQUMsQ0FBQyxDQUFDO1FBRVAsQ0FBQztRQUVMLG9CQUFDO0lBQUQsQ0E3REEsQUE2REMsSUFBQTtJQTdEWSxzQ0FBYSIsImZpbGUiOiJsaWJyYXJ5L3JlcXVlc3QuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgUGxheWVyRXJyb3IsIElQbGF5ZXJFcnJvciB9IGZyb20gJy4vZXJyb3InO1xuaW1wb3J0IHsgSU9uUHJvZ3Jlc3MgfSBmcm9tICcuL3NvdW5kJztcblxuZXhwb3J0IGludGVyZmFjZSBJUmVxdWVzdGVkIHtcbiAgICB1cmw6IHN0cmluZztcbiAgICBsb2FkaW5nUHJvZ3Jlc3M6IG51bWJlcjtcbiAgICBvbkxvYWRpbmc6IElPblByb2dyZXNzO1xuICAgIG9uUGxheWluZzogSU9uUHJvZ3Jlc3M7XG59XG5cbmV4cG9ydCBjbGFzcyBQbGF5ZXJSZXF1ZXN0IHtcblxuICAgIC8vIFRPRE86IGFkZCBwb3NzaWJpbGl0eSB0byBhYm9ydCBodHRwIHJlcXVlc3RcblxuICAgIHB1YmxpYyBnZXRBcnJheUJ1ZmZlcihyZXF1ZXN0ZWQ6IElSZXF1ZXN0ZWQpOiBQcm9taXNlPEFycmF5QnVmZmVyIHwgSVBsYXllckVycm9yPiB7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblxuICAgICAgICAgICAgbGV0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgICAgICAgICAvLyBUT0RPOiBhYm9ydCB0aGUgcmVxdWVzdD9cbiAgICAgICAgICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9YTUxIdHRwUmVxdWVzdC9hYm9ydFxuXG4gICAgICAgICAgICAvLyB0aGlycyBwYXJhbWV0ZXIgaXMgZm9yIFwiYXN5bmNcIiwgZGVmYXVsdCB0cnVlIGJ1dCB3aG8ga25vd3MgaWYgcHJlZmVyIHRvIGV4cGxpY2l0bHkgc2V0IGl0IGp1c3QgaW4gY2FzZVxuICAgICAgICAgICAgeGhyLm9wZW4oJ0dFVCcsIHJlcXVlc3RlZC51cmwsIHRydWUpO1xuXG4gICAgICAgICAgICAvLyBzZXQgdGhlIGV4cGVjdGVkIHJlc3BvbnNlIHR5cGUgZnJvbSB0aGUgc2VydmVyIHRvIGFycmF5YnVmZmVyXG4gICAgICAgICAgICB4aHIucmVzcG9uc2VUeXBlID0gJ2FycmF5YnVmZmVyJztcblxuICAgICAgICAgICAgeGhyLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgICAgIC8vIGdldHMgY2FsbGVkIGV2ZW4gb24gZm9yIGV4YW1wbGUgNDA0LCBzbyBjaGVjayB0aGUgc3RhdHVzXG4gICAgICAgICAgICAgICAgaWYgKHhoci5zdGF0dXMgPT09IDIwMCkge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIHN1Y2Nlc3NmdWwgcmVxdWVzdCBzbyBub3cgd2UgY2FuIHJlc29sdmUgdGhlIHByb21pc2VcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh4aHIucmVzcG9uc2UpO1xuXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgICAgICAvLyBzb21ldGhpbmcgd2VudCB3cm9uZyBzbyB3ZSByZWplY3Qgd2l0aCBhbiBlcnJvclxuICAgICAgICAgICAgICAgICAgICByZWplY3QobmV3IFBsYXllckVycm9yKHhoci5zdGF0dXNUZXh0LCB4aHIuc3RhdHVzKSk7XG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHhoci5vbnByb2dyZXNzID0gZnVuY3Rpb24gKGV2ZW50KSB7XG5cbiAgICAgICAgICAgICAgICBsZXQgcGVyY2VudGFnZSA9IDEwMCAvIChldmVudC50b3RhbCAvIGV2ZW50LmxvYWRlZCk7XG5cbiAgICAgICAgICAgICAgICAvLyB1cGRhdGUgdmFsdWUgb24gc291bmQgb2JqZWN0XG4gICAgICAgICAgICAgICAgcmVxdWVzdGVkLmxvYWRpbmdQcm9ncmVzcyA9IHBlcmNlbnRhZ2U7XG5cbiAgICAgICAgICAgICAgICByZXF1ZXN0ZWQub25Mb2FkaW5nKHBlcmNlbnRhZ2UpO1xuXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvLyBhbHNvIHJlamVjdCBmb3IgYW55IGtpbmQgb2YgbmV0d29yayBlcnJvcnNcbiAgICAgICAgICAgIHhoci5vbmVycm9yID0gZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBQbGF5ZXJFcnJvcigneGhyIG5ldHdvcmsgZXJyb3InKSk7XG5cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vIG5vdyBtYWtlIHRoZSByZXF1ZXN0XG4gICAgICAgICAgICB4aHIuc2VuZCgpO1xuXG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG59XG4iXX0=

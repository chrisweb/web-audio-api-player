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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9idWlsZC9zb3VyY2UvbGlicmFyeS9yZXF1ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0lBQ0EsWUFBWSxDQUFDO0lBRWIsaUNBQW9EO0lBT3BEO1FBQUE7UUF3REEsQ0FBQztRQXRERyw4Q0FBOEM7UUFFdkMsc0NBQWMsR0FBckIsVUFBc0IsU0FBcUI7WUFFdkMsTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLFVBQVUsT0FBTyxFQUFFLE1BQU07Z0JBRXhDLElBQUksR0FBRyxHQUFHLElBQUksY0FBYyxFQUFFLENBQUM7Z0JBRS9CLHlHQUF5RztnQkFDekcsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFFckMsZ0VBQWdFO2dCQUNoRSxHQUFHLENBQUMsWUFBWSxHQUFHLGFBQWEsQ0FBQztnQkFFakMsR0FBRyxDQUFDLE1BQU0sR0FBRztvQkFFVCwyREFBMkQ7b0JBQzNELEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQzt3QkFFckIsdURBQXVEO3dCQUN2RCxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUUxQixDQUFDO29CQUFDLElBQUksQ0FBQyxDQUFDO3dCQUVKLGtEQUFrRDt3QkFDbEQsTUFBTSxDQUFDLElBQUksbUJBQVcsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO29CQUV4RCxDQUFDO2dCQUVMLENBQUMsQ0FBQztnQkFFRixHQUFHLENBQUMsVUFBVSxHQUFHLFVBQVUsS0FBSztvQkFFNUIsSUFBSSxVQUFVLEdBQUcsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBRXBELCtCQUErQjtvQkFDL0IsU0FBUyxDQUFDLGVBQWUsR0FBRyxVQUFVLENBQUM7Z0JBRTNDLENBQUMsQ0FBQztnQkFFRiw2Q0FBNkM7Z0JBQzdDLEdBQUcsQ0FBQyxPQUFPLEdBQUc7b0JBRVYsTUFBTSxDQUFDLElBQUksbUJBQVcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUM7Z0JBRWpELENBQUMsQ0FBQztnQkFFRix1QkFBdUI7Z0JBQ3ZCLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUVmLENBQUMsQ0FBQyxDQUFDO1FBRVAsQ0FBQztRQUVMLG9CQUFDO0lBQUQsQ0F4REEsQUF3REMsSUFBQTtJQXhEWSxzQ0FBYSIsImZpbGUiOiJsaWJyYXJ5L3JlcXVlc3QuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgUGxheWVyRXJyb3IsIElQbGF5ZXJFcnJvciB9IGZyb20gJy4vZXJyb3InO1xuXG5leHBvcnQgaW50ZXJmYWNlIElSZXF1ZXN0ZWQge1xuICAgIHVybDogc3RyaW5nO1xuICAgIGxvYWRpbmdQcm9ncmVzczogbnVtYmVyO1xufVxuXG5leHBvcnQgY2xhc3MgUGxheWVyUmVxdWVzdCB7XG5cbiAgICAvLyBUT0RPOiBhZGQgcG9zc2liaWxpdHkgdG8gYWJvcnQgaHR0cCByZXF1ZXN0XG5cbiAgICBwdWJsaWMgZ2V0QXJyYXlCdWZmZXIocmVxdWVzdGVkOiBJUmVxdWVzdGVkKTogUHJvbWlzZTxBcnJheUJ1ZmZlciB8IElQbGF5ZXJFcnJvcj4ge1xuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cbiAgICAgICAgICAgIGxldCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgICAgICAgICAgLy8gdGhpcnMgcGFyYW1ldGVyIGlzIGZvciBcImFzeW5jXCIsIGRlZmF1bHQgdHJ1ZSBidXQgd2hvIGtub3dzIGlmIHByZWZlciB0byBleHBsaWNpdGx5IHNldCBpdCBqdXN0IGluIGNhc2VcbiAgICAgICAgICAgIHhoci5vcGVuKCdHRVQnLCByZXF1ZXN0ZWQudXJsLCB0cnVlKTtcblxuICAgICAgICAgICAgLy8gc2V0IHRoZSBleHBlY3RlZCByZXNwb25zZSB0eXBlIGZyb20gdGhlIHNlcnZlciB0byBhcnJheWJ1ZmZlclxuICAgICAgICAgICAgeGhyLnJlc3BvbnNlVHlwZSA9ICdhcnJheWJ1ZmZlcic7XG5cbiAgICAgICAgICAgIHhoci5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBnZXRzIGNhbGxlZCBldmVuIG9uIGZvciBleGFtcGxlIDQwNCwgc28gY2hlY2sgdGhlIHN0YXR1c1xuICAgICAgICAgICAgICAgIGlmICh4aHIuc3RhdHVzID09PSAyMDApIHtcblxuICAgICAgICAgICAgICAgICAgICAvLyBzdWNjZXNzZnVsIHJlcXVlc3Qgc28gbm93IHdlIGNhbiByZXNvbHZlIHRoZSBwcm9taXNlXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeGhyLnJlc3BvbnNlKTtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gc29tZXRoaW5nIHdlbnQgd3Jvbmcgc28gd2UgcmVqZWN0IHdpdGggYW4gZXJyb3JcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBQbGF5ZXJFcnJvcih4aHIuc3RhdHVzVGV4dCwgeGhyLnN0YXR1cykpO1xuXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB4aHIub25wcm9ncmVzcyA9IGZ1bmN0aW9uIChldmVudCkge1xuXG4gICAgICAgICAgICAgICAgbGV0IHBlcmNlbnRhZ2UgPSAxMDAgLyAoZXZlbnQudG90YWwgLyBldmVudC5sb2FkZWQpO1xuXG4gICAgICAgICAgICAgICAgLy8gdXBkYXRlIHZhbHVlIG9uIHNvdW5kIG9iamVjdFxuICAgICAgICAgICAgICAgIHJlcXVlc3RlZC5sb2FkaW5nUHJvZ3Jlc3MgPSBwZXJjZW50YWdlO1xuXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvLyBhbHNvIHJlamVjdCBmb3IgYW55IGtpbmQgb2YgbmV0d29yayBlcnJvcnNcbiAgICAgICAgICAgIHhoci5vbmVycm9yID0gZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBQbGF5ZXJFcnJvcigneGhyIG5ldHdvcmsgZXJyb3InKSk7XG5cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vIG5vdyBtYWtlIHRoZSByZXF1ZXN0XG4gICAgICAgICAgICB4aHIuc2VuZCgpO1xuXG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG59XG4iXX0=

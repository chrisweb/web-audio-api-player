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
                    if (requested.onLoading !== null) {
                        requested.onLoading(percentage, event.total, event.loaded);
                    }
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9saWJyYXJ5L3JlcXVlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7SUFDQSxZQUFZLENBQUM7SUFFYixpQ0FBb0Q7SUFVcEQ7UUFBQTtRQStEQSxDQUFDO1FBN0RHLDhDQUE4QztRQUV2QyxzQ0FBYyxHQUFyQixVQUFzQixTQUFxQjtZQUV2QyxNQUFNLENBQUMsSUFBSSxPQUFPLENBQUMsVUFBVSxPQUFPLEVBQUUsTUFBTTtnQkFFeEMsSUFBSSxHQUFHLEdBQUcsSUFBSSxjQUFjLEVBQUUsQ0FBQztnQkFFL0IsMkJBQTJCO2dCQUMzQix3RUFBd0U7Z0JBRXhFLHlHQUF5RztnQkFDekcsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFFckMsZ0VBQWdFO2dCQUNoRSxHQUFHLENBQUMsWUFBWSxHQUFHLGFBQWEsQ0FBQztnQkFFakMsR0FBRyxDQUFDLE1BQU0sR0FBRztvQkFFVCwyREFBMkQ7b0JBQzNELEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQzt3QkFFckIsdURBQXVEO3dCQUN2RCxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUUxQixDQUFDO29CQUFDLElBQUksQ0FBQyxDQUFDO3dCQUVKLGtEQUFrRDt3QkFDbEQsTUFBTSxDQUFDLElBQUksbUJBQVcsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO29CQUV4RCxDQUFDO2dCQUVMLENBQUMsQ0FBQztnQkFFRixHQUFHLENBQUMsVUFBVSxHQUFHLFVBQVUsS0FBSztvQkFFNUIsSUFBSSxVQUFVLEdBQUcsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBRXBELCtCQUErQjtvQkFDL0IsU0FBUyxDQUFDLGVBQWUsR0FBRyxVQUFVLENBQUM7b0JBRXZDLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxTQUFTLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQzt3QkFDL0IsU0FBUyxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBQy9ELENBQUM7Z0JBRUwsQ0FBQyxDQUFDO2dCQUVGLDZDQUE2QztnQkFDN0MsR0FBRyxDQUFDLE9BQU8sR0FBRztvQkFFVixNQUFNLENBQUMsSUFBSSxtQkFBVyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQztnQkFFakQsQ0FBQyxDQUFDO2dCQUVGLHVCQUF1QjtnQkFDdkIsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDO1lBRWYsQ0FBQyxDQUFDLENBQUM7UUFFUCxDQUFDO1FBRUwsb0JBQUM7SUFBRCxDQS9EQSxBQStEQyxJQUFBO0lBL0RZLHNDQUFhIiwiZmlsZSI6ImxpYnJhcnkvcmVxdWVzdC5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBQbGF5ZXJFcnJvciwgSVBsYXllckVycm9yIH0gZnJvbSAnLi9lcnJvcic7XG5pbXBvcnQgeyBJT25Qcm9ncmVzcyB9IGZyb20gJy4vc291bmQnO1xuXG5leHBvcnQgaW50ZXJmYWNlIElSZXF1ZXN0ZWQge1xuICAgIHVybDogc3RyaW5nO1xuICAgIGxvYWRpbmdQcm9ncmVzczogbnVtYmVyO1xuICAgIG9uTG9hZGluZz86IElPblByb2dyZXNzO1xuICAgIG9uUGxheWluZz86IElPblByb2dyZXNzO1xufVxuXG5leHBvcnQgY2xhc3MgUGxheWVyUmVxdWVzdCB7XG5cbiAgICAvLyBUT0RPOiBhZGQgcG9zc2liaWxpdHkgdG8gYWJvcnQgaHR0cCByZXF1ZXN0XG5cbiAgICBwdWJsaWMgZ2V0QXJyYXlCdWZmZXIocmVxdWVzdGVkOiBJUmVxdWVzdGVkKTogUHJvbWlzZTxBcnJheUJ1ZmZlciB8IElQbGF5ZXJFcnJvcj4ge1xuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cbiAgICAgICAgICAgIGxldCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgICAgICAgICAgLy8gVE9ETzogYWJvcnQgdGhlIHJlcXVlc3Q/XG4gICAgICAgICAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvWE1MSHR0cFJlcXVlc3QvYWJvcnRcblxuICAgICAgICAgICAgLy8gdGhpcnMgcGFyYW1ldGVyIGlzIGZvciBcImFzeW5jXCIsIGRlZmF1bHQgdHJ1ZSBidXQgd2hvIGtub3dzIGlmIHByZWZlciB0byBleHBsaWNpdGx5IHNldCBpdCBqdXN0IGluIGNhc2VcbiAgICAgICAgICAgIHhoci5vcGVuKCdHRVQnLCByZXF1ZXN0ZWQudXJsLCB0cnVlKTtcblxuICAgICAgICAgICAgLy8gc2V0IHRoZSBleHBlY3RlZCByZXNwb25zZSB0eXBlIGZyb20gdGhlIHNlcnZlciB0byBhcnJheWJ1ZmZlclxuICAgICAgICAgICAgeGhyLnJlc3BvbnNlVHlwZSA9ICdhcnJheWJ1ZmZlcic7XG5cbiAgICAgICAgICAgIHhoci5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBnZXRzIGNhbGxlZCBldmVuIG9uIGZvciBleGFtcGxlIDQwNCwgc28gY2hlY2sgdGhlIHN0YXR1c1xuICAgICAgICAgICAgICAgIGlmICh4aHIuc3RhdHVzID09PSAyMDApIHtcblxuICAgICAgICAgICAgICAgICAgICAvLyBzdWNjZXNzZnVsIHJlcXVlc3Qgc28gbm93IHdlIGNhbiByZXNvbHZlIHRoZSBwcm9taXNlXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeGhyLnJlc3BvbnNlKTtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gc29tZXRoaW5nIHdlbnQgd3Jvbmcgc28gd2UgcmVqZWN0IHdpdGggYW4gZXJyb3JcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBQbGF5ZXJFcnJvcih4aHIuc3RhdHVzVGV4dCwgeGhyLnN0YXR1cykpO1xuXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB4aHIub25wcm9ncmVzcyA9IGZ1bmN0aW9uIChldmVudCkge1xuXG4gICAgICAgICAgICAgICAgbGV0IHBlcmNlbnRhZ2UgPSAxMDAgLyAoZXZlbnQudG90YWwgLyBldmVudC5sb2FkZWQpO1xuXG4gICAgICAgICAgICAgICAgLy8gdXBkYXRlIHZhbHVlIG9uIHNvdW5kIG9iamVjdFxuICAgICAgICAgICAgICAgIHJlcXVlc3RlZC5sb2FkaW5nUHJvZ3Jlc3MgPSBwZXJjZW50YWdlO1xuXG4gICAgICAgICAgICAgICAgaWYgKHJlcXVlc3RlZC5vbkxvYWRpbmcgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdGVkLm9uTG9hZGluZyhwZXJjZW50YWdlLCBldmVudC50b3RhbCwgZXZlbnQubG9hZGVkKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vIGFsc28gcmVqZWN0IGZvciBhbnkga2luZCBvZiBuZXR3b3JrIGVycm9yc1xuICAgICAgICAgICAgeGhyLm9uZXJyb3IgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgICAgICByZWplY3QobmV3IFBsYXllckVycm9yKCd4aHIgbmV0d29yayBlcnJvcicpKTtcblxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8gbm93IG1ha2UgdGhlIHJlcXVlc3RcbiAgICAgICAgICAgIHhoci5zZW5kKCk7XG5cbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbn1cbiJdfQ==

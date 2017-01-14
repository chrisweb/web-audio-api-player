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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9saWJyYXJ5L3JlcXVlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7SUFDQSxZQUFZLENBQUM7SUFFYixpQ0FBb0Q7SUFPcEQ7UUFBQTtRQXdEQSxDQUFDO1FBdERHLDhDQUE4QztRQUV2QyxzQ0FBYyxHQUFyQixVQUFzQixTQUFxQjtZQUV2QyxNQUFNLENBQUMsSUFBSSxPQUFPLENBQUMsVUFBVSxPQUFPLEVBQUUsTUFBTTtnQkFFeEMsSUFBSSxHQUFHLEdBQUcsSUFBSSxjQUFjLEVBQUUsQ0FBQztnQkFFL0IseUdBQXlHO2dCQUN6RyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUVyQyxnRUFBZ0U7Z0JBQ2hFLEdBQUcsQ0FBQyxZQUFZLEdBQUcsYUFBYSxDQUFDO2dCQUVqQyxHQUFHLENBQUMsTUFBTSxHQUFHO29CQUVULDJEQUEyRDtvQkFDM0QsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO3dCQUVyQix1REFBdUQ7d0JBQ3ZELE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBRTFCLENBQUM7b0JBQUMsSUFBSSxDQUFDLENBQUM7d0JBRUosa0RBQWtEO3dCQUNsRCxNQUFNLENBQUMsSUFBSSxtQkFBVyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7b0JBRXhELENBQUM7Z0JBRUwsQ0FBQyxDQUFDO2dCQUVGLEdBQUcsQ0FBQyxVQUFVLEdBQUcsVUFBVSxLQUFLO29CQUU1QixJQUFJLFVBQVUsR0FBRyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFFcEQsK0JBQStCO29CQUMvQixTQUFTLENBQUMsZUFBZSxHQUFHLFVBQVUsQ0FBQztnQkFFM0MsQ0FBQyxDQUFDO2dCQUVGLDZDQUE2QztnQkFDN0MsR0FBRyxDQUFDLE9BQU8sR0FBRztvQkFFVixNQUFNLENBQUMsSUFBSSxtQkFBVyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQztnQkFFakQsQ0FBQyxDQUFDO2dCQUVGLHVCQUF1QjtnQkFDdkIsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDO1lBRWYsQ0FBQyxDQUFDLENBQUM7UUFFUCxDQUFDO1FBRUwsb0JBQUM7SUFBRCxDQXhEQSxBQXdEQyxJQUFBO0lBeERZLHNDQUFhIiwiZmlsZSI6ImxpYnJhcnkvcmVxdWVzdC5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBQbGF5ZXJFcnJvciwgSVBsYXllckVycm9yIH0gZnJvbSAnLi9lcnJvcic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVJlcXVlc3RlZCB7XG4gICAgdXJsOiBzdHJpbmc7XG4gICAgbG9hZGluZ1Byb2dyZXNzOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBQbGF5ZXJSZXF1ZXN0IHtcblxuICAgIC8vIFRPRE86IGFkZCBwb3NzaWJpbGl0eSB0byBhYm9ydCBodHRwIHJlcXVlc3RcblxuICAgIHB1YmxpYyBnZXRBcnJheUJ1ZmZlcihyZXF1ZXN0ZWQ6IElSZXF1ZXN0ZWQpOiBQcm9taXNlPEFycmF5QnVmZmVyIHwgSVBsYXllckVycm9yPiB7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblxuICAgICAgICAgICAgbGV0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgICAgICAgICAvLyB0aGlycyBwYXJhbWV0ZXIgaXMgZm9yIFwiYXN5bmNcIiwgZGVmYXVsdCB0cnVlIGJ1dCB3aG8ga25vd3MgaWYgcHJlZmVyIHRvIGV4cGxpY2l0bHkgc2V0IGl0IGp1c3QgaW4gY2FzZVxuICAgICAgICAgICAgeGhyLm9wZW4oJ0dFVCcsIHJlcXVlc3RlZC51cmwsIHRydWUpO1xuXG4gICAgICAgICAgICAvLyBzZXQgdGhlIGV4cGVjdGVkIHJlc3BvbnNlIHR5cGUgZnJvbSB0aGUgc2VydmVyIHRvIGFycmF5YnVmZmVyXG4gICAgICAgICAgICB4aHIucmVzcG9uc2VUeXBlID0gJ2FycmF5YnVmZmVyJztcblxuICAgICAgICAgICAgeGhyLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgICAgIC8vIGdldHMgY2FsbGVkIGV2ZW4gb24gZm9yIGV4YW1wbGUgNDA0LCBzbyBjaGVjayB0aGUgc3RhdHVzXG4gICAgICAgICAgICAgICAgaWYgKHhoci5zdGF0dXMgPT09IDIwMCkge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIHN1Y2Nlc3NmdWwgcmVxdWVzdCBzbyBub3cgd2UgY2FuIHJlc29sdmUgdGhlIHByb21pc2VcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh4aHIucmVzcG9uc2UpO1xuXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgICAgICAvLyBzb21ldGhpbmcgd2VudCB3cm9uZyBzbyB3ZSByZWplY3Qgd2l0aCBhbiBlcnJvclxuICAgICAgICAgICAgICAgICAgICByZWplY3QobmV3IFBsYXllckVycm9yKHhoci5zdGF0dXNUZXh0LCB4aHIuc3RhdHVzKSk7XG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHhoci5vbnByb2dyZXNzID0gZnVuY3Rpb24gKGV2ZW50KSB7XG5cbiAgICAgICAgICAgICAgICBsZXQgcGVyY2VudGFnZSA9IDEwMCAvIChldmVudC50b3RhbCAvIGV2ZW50LmxvYWRlZCk7XG5cbiAgICAgICAgICAgICAgICAvLyB1cGRhdGUgdmFsdWUgb24gc291bmQgb2JqZWN0XG4gICAgICAgICAgICAgICAgcmVxdWVzdGVkLmxvYWRpbmdQcm9ncmVzcyA9IHBlcmNlbnRhZ2U7XG5cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vIGFsc28gcmVqZWN0IGZvciBhbnkga2luZCBvZiBuZXR3b3JrIGVycm9yc1xuICAgICAgICAgICAgeGhyLm9uZXJyb3IgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgICAgICByZWplY3QobmV3IFBsYXllckVycm9yKCd4aHIgbmV0d29yayBlcnJvcicpKTtcblxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8gbm93IG1ha2UgdGhlIHJlcXVlc3RcbiAgICAgICAgICAgIHhoci5zZW5kKCk7XG5cbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbn1cbiJdfQ==

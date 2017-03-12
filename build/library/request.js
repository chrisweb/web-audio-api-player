(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./error"], factory);
    }
})(function (require, exports) {
    'use strict';
    Object.defineProperty(exports, "__esModule", { value: true });
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9saWJyYXJ5L3JlcXVlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0lBQ0EsWUFBWSxDQUFDOztJQUViLGlDQUFvRDtJQVNwRDtRQUFBO1FBK0RBLENBQUM7UUE3REcsOENBQThDO1FBRXZDLHNDQUFjLEdBQXJCLFVBQXNCLFNBQXFCO1lBRXZDLE1BQU0sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxVQUFVLE9BQU8sRUFBRSxNQUFNO2dCQUV4QyxJQUFJLEdBQUcsR0FBRyxJQUFJLGNBQWMsRUFBRSxDQUFDO2dCQUUvQiwyQkFBMkI7Z0JBQzNCLHdFQUF3RTtnQkFFeEUseUdBQXlHO2dCQUN6RyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUVyQyxnRUFBZ0U7Z0JBQ2hFLEdBQUcsQ0FBQyxZQUFZLEdBQUcsYUFBYSxDQUFDO2dCQUVqQyxHQUFHLENBQUMsTUFBTSxHQUFHO29CQUVULDJEQUEyRDtvQkFDM0QsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO3dCQUVyQix1REFBdUQ7d0JBQ3ZELE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBRTFCLENBQUM7b0JBQUMsSUFBSSxDQUFDLENBQUM7d0JBRUosa0RBQWtEO3dCQUNsRCxNQUFNLENBQUMsSUFBSSxtQkFBVyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7b0JBRXhELENBQUM7Z0JBRUwsQ0FBQyxDQUFDO2dCQUVGLEdBQUcsQ0FBQyxVQUFVLEdBQUcsVUFBVSxLQUFLO29CQUU1QixJQUFJLFVBQVUsR0FBRyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFFcEQsK0JBQStCO29CQUMvQixTQUFTLENBQUMsZUFBZSxHQUFHLFVBQVUsQ0FBQztvQkFFdkMsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLFNBQVMsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO3dCQUMvQixTQUFTLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDL0QsQ0FBQztnQkFFTCxDQUFDLENBQUM7Z0JBRUYsNkNBQTZDO2dCQUM3QyxHQUFHLENBQUMsT0FBTyxHQUFHO29CQUVWLE1BQU0sQ0FBQyxJQUFJLG1CQUFXLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDO2dCQUVqRCxDQUFDLENBQUM7Z0JBRUYsdUJBQXVCO2dCQUN2QixHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7WUFFZixDQUFDLENBQUMsQ0FBQztRQUVQLENBQUM7UUFFTCxvQkFBQztJQUFELENBL0RBLEFBK0RDLElBQUE7SUEvRFksc0NBQWEiLCJmaWxlIjoibGlicmFyeS9yZXF1ZXN0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IFBsYXllckVycm9yLCBJUGxheWVyRXJyb3IgfSBmcm9tICcuL2Vycm9yJztcbmltcG9ydCB7IElPblByb2dyZXNzIH0gZnJvbSAnLi9zb3VuZCc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVJlcXVlc3RlZCB7XG4gICAgdXJsOiBzdHJpbmc7XG4gICAgbG9hZGluZ1Byb2dyZXNzOiBudW1iZXI7XG4gICAgb25Mb2FkaW5nPzogSU9uUHJvZ3Jlc3M7XG59XG5cbmV4cG9ydCBjbGFzcyBQbGF5ZXJSZXF1ZXN0IHtcblxuICAgIC8vIFRPRE86IGFkZCBwb3NzaWJpbGl0eSB0byBhYm9ydCBodHRwIHJlcXVlc3RcblxuICAgIHB1YmxpYyBnZXRBcnJheUJ1ZmZlcihyZXF1ZXN0ZWQ6IElSZXF1ZXN0ZWQpOiBQcm9taXNlPEFycmF5QnVmZmVyIHwgSVBsYXllckVycm9yPiB7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblxuICAgICAgICAgICAgbGV0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgICAgICAgICAvLyBUT0RPOiBhYm9ydCB0aGUgcmVxdWVzdD9cbiAgICAgICAgICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9YTUxIdHRwUmVxdWVzdC9hYm9ydFxuXG4gICAgICAgICAgICAvLyB0aGlycyBwYXJhbWV0ZXIgaXMgZm9yIFwiYXN5bmNcIiwgZGVmYXVsdCB0cnVlIGJ1dCB3aG8ga25vd3MgaWYgcHJlZmVyIHRvIGV4cGxpY2l0bHkgc2V0IGl0IGp1c3QgaW4gY2FzZVxuICAgICAgICAgICAgeGhyLm9wZW4oJ0dFVCcsIHJlcXVlc3RlZC51cmwsIHRydWUpO1xuXG4gICAgICAgICAgICAvLyBzZXQgdGhlIGV4cGVjdGVkIHJlc3BvbnNlIHR5cGUgZnJvbSB0aGUgc2VydmVyIHRvIGFycmF5YnVmZmVyXG4gICAgICAgICAgICB4aHIucmVzcG9uc2VUeXBlID0gJ2FycmF5YnVmZmVyJztcblxuICAgICAgICAgICAgeGhyLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgICAgIC8vIGdldHMgY2FsbGVkIGV2ZW4gb24gZm9yIGV4YW1wbGUgNDA0LCBzbyBjaGVjayB0aGUgc3RhdHVzXG4gICAgICAgICAgICAgICAgaWYgKHhoci5zdGF0dXMgPT09IDIwMCkge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIHN1Y2Nlc3NmdWwgcmVxdWVzdCBzbyBub3cgd2UgY2FuIHJlc29sdmUgdGhlIHByb21pc2VcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh4aHIucmVzcG9uc2UpO1xuXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgICAgICAvLyBzb21ldGhpbmcgd2VudCB3cm9uZyBzbyB3ZSByZWplY3Qgd2l0aCBhbiBlcnJvclxuICAgICAgICAgICAgICAgICAgICByZWplY3QobmV3IFBsYXllckVycm9yKHhoci5zdGF0dXNUZXh0LCB4aHIuc3RhdHVzKSk7XG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHhoci5vbnByb2dyZXNzID0gZnVuY3Rpb24gKGV2ZW50KSB7XG5cbiAgICAgICAgICAgICAgICBsZXQgcGVyY2VudGFnZSA9IDEwMCAvIChldmVudC50b3RhbCAvIGV2ZW50LmxvYWRlZCk7XG5cbiAgICAgICAgICAgICAgICAvLyB1cGRhdGUgdmFsdWUgb24gc291bmQgb2JqZWN0XG4gICAgICAgICAgICAgICAgcmVxdWVzdGVkLmxvYWRpbmdQcm9ncmVzcyA9IHBlcmNlbnRhZ2U7XG5cbiAgICAgICAgICAgICAgICBpZiAocmVxdWVzdGVkLm9uTG9hZGluZyAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0ZWQub25Mb2FkaW5nKHBlcmNlbnRhZ2UsIGV2ZW50LnRvdGFsLCBldmVudC5sb2FkZWQpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8gYWxzbyByZWplY3QgZm9yIGFueSBraW5kIG9mIG5ldHdvcmsgZXJyb3JzXG4gICAgICAgICAgICB4aHIub25lcnJvciA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgICAgIHJlamVjdChuZXcgUGxheWVyRXJyb3IoJ3hociBuZXR3b3JrIGVycm9yJykpO1xuXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvLyBub3cgbWFrZSB0aGUgcmVxdWVzdFxuICAgICAgICAgICAgeGhyLnNlbmQoKTtcblxuICAgICAgICB9KTtcblxuICAgIH1cblxufVxuIl19

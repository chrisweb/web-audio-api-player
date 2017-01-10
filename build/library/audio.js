(function (dependencies, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(dependencies, factory);
    }
})(["require", "exports"], function (require, exports) {
    'use strict';
    var PlayerAudio = (function () {
        function PlayerAudio() {
            // initial context state is still "closed"
            this._contextState = 'closed';
            // TODO: to speed up things would it be better to create a context in the constructor?
            // and suspend the context upon creating it until it gets used?
        }
        PlayerAudio.prototype.decodeAudio = function (arrayBuffer) {
            var _this = this;
            if (this._contextState === 'closed') {
                this._createContext();
            }
            if (this._contextState === 'suspended') {
                this._unfreezeAudioContext().then(function () {
                    return Promise.resolve(_this._context.decodeAudioData(arrayBuffer));
                });
            }
            // decodeAudioData returns a promise of type PromiseLike
            // using resolve to return a promise of type Promise
            return Promise.resolve(this._context.decodeAudioData(arrayBuffer));
        };
        PlayerAudio.prototype._createContext = function () {
            var _this = this;
            var AudioContext = window.AudioContext || window.webkitAudioContext;
            var audioContext = new AudioContext();
            audioContext.onstatechange = function () {
                _this._contextState = audioContext.state;
                if (_this._contextState === 'closed') {
                    _this._context = null;
                }
            };
            this._context = audioContext;
        };
        PlayerAudio.prototype._destroyAudioContext = function () {
            var _this = this;
            this._context.close().then(function () {
                _this._context = null;
            });
        };
        PlayerAudio.prototype._freezeAudioContext = function () {
            // did resume get implemented
            if (typeof this._context.suspend === 'undefined') {
                return Promise.resolve();
            }
            else {
                // resume the audio hardware access
                return this._context.resume();
            }
        };
        PlayerAudio.prototype._unfreezeAudioContext = function () {
            // did suspend get implemented
            if (typeof this._context.suspend === 'undefined') {
                return Promise.resolve();
            }
            else {
                // halt the audio hardware access temporarily to reduce CPU and battery usage
                return this._context.suspend();
            }
        };
        PlayerAudio.prototype.createAudioGraph = function () {
            var _this = this;
            if (this._contextState === 'closed') {
                this._createContext();
            }
            if (this._contextState === 'suspended') {
                this._unfreezeAudioContext().then(function () {
                    _this._createAudioGraph();
                });
            }
            return this._createAudioGraph();
        };
        PlayerAudio.prototype._createAudioGraph = function () {
            var audioGraph = {
                sourceNode: this._context.createBufferSource(),
                gainNode: this._context.createGain(),
                pannerNode: this._context.createPanner()
            };
            // connect the source node to the gain node
            audioGraph.sourceNode.connect(audioGraph.gainNode);
            // connect the gain node to the panner node
            //audioGraph.gainNode.connect(audioGraph.pannerNode);
            // connect to the panner node to the destination (speakers)
            //audioGraph.pannerNode.connect(this._context.destination);
            // connect the gain node to the destination (speakers)
            audioGraph.gainNode.connect(this._context.destination);
            return audioGraph;
        };
        return PlayerAudio;
    }());
    exports.PlayerAudio = PlayerAudio;
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9idWlsZC9zb3VyY2UvbGlicmFyeS9hdWRpby50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7OztJQUNBLFlBQVksQ0FBQztJQVViO1FBS0k7WUFFSSwwQ0FBMEM7WUFDMUMsSUFBSSxDQUFDLGFBQWEsR0FBRyxRQUFRLENBQUM7WUFFOUIsc0ZBQXNGO1lBQ3RGLCtEQUErRDtRQUVuRSxDQUFDO1FBRU0saUNBQVcsR0FBbEIsVUFBbUIsV0FBd0I7WUFBM0MsaUJBb0JDO1lBbEJHLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQztnQkFDbEMsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQzFCLENBQUM7WUFFRCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxLQUFLLFdBQVcsQ0FBQyxDQUFDLENBQUM7Z0JBRXJDLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDLElBQUksQ0FBQztvQkFFOUIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztnQkFFdkUsQ0FBQyxDQUFDLENBQUM7WUFFUCxDQUFDO1lBRUQsd0RBQXdEO1lBQ3hELG9EQUFvRDtZQUNwRCxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBRXZFLENBQUM7UUFFUyxvQ0FBYyxHQUF4QjtZQUFBLGlCQWtCQztZQWhCRyxJQUFJLFlBQVksR0FBRyxNQUFNLENBQUMsWUFBWSxJQUFLLE1BQWMsQ0FBQyxrQkFBa0IsQ0FBQztZQUU3RSxJQUFJLFlBQVksR0FBRyxJQUFJLFlBQVksRUFBRSxDQUFDO1lBRXRDLFlBQVksQ0FBQyxhQUFhLEdBQUc7Z0JBRXpCLEtBQUksQ0FBQyxhQUFhLEdBQUcsWUFBWSxDQUFDLEtBQUssQ0FBQztnQkFFeEMsRUFBRSxDQUFDLENBQUMsS0FBSSxDQUFDLGFBQWEsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDO29CQUNsQyxLQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztnQkFDekIsQ0FBQztZQUVMLENBQUMsQ0FBQztZQUVGLElBQUksQ0FBQyxRQUFRLEdBQUcsWUFBWSxDQUFDO1FBRWpDLENBQUM7UUFFUywwQ0FBb0IsR0FBOUI7WUFBQSxpQkFRQztZQU5HLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUMsSUFBSSxDQUFDO2dCQUV2QixLQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztZQUV6QixDQUFDLENBQUMsQ0FBQztRQUVQLENBQUM7UUFFUyx5Q0FBbUIsR0FBN0I7WUFFSSw2QkFBNkI7WUFDN0IsRUFBRSxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sS0FBSyxXQUFXLENBQUMsQ0FBQyxDQUFDO2dCQUUvQyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBRTdCLENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFFSixtQ0FBbUM7Z0JBQ25DLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBRWxDLENBQUM7UUFFTCxDQUFDO1FBRVMsMkNBQXFCLEdBQS9CO1lBRUksOEJBQThCO1lBQzlCLEVBQUUsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEtBQUssV0FBVyxDQUFDLENBQUMsQ0FBQztnQkFFL0MsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUU3QixDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBRUosNkVBQTZFO2dCQUM3RSxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUVuQyxDQUFDO1FBRUwsQ0FBQztRQUVNLHNDQUFnQixHQUF2QjtZQUFBLGlCQWtCQztZQWhCRyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xDLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUMxQixDQUFDO1lBRUQsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsS0FBSyxXQUFXLENBQUMsQ0FBQyxDQUFDO2dCQUVyQyxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQyxJQUFJLENBQUM7b0JBRTlCLEtBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO2dCQUU3QixDQUFDLENBQUMsQ0FBQztZQUVQLENBQUM7WUFFRCxNQUFNLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFFcEMsQ0FBQztRQUVTLHVDQUFpQixHQUEzQjtZQUVJLElBQUksVUFBVSxHQUFHO2dCQUNiLFVBQVUsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLGtCQUFrQixFQUFFO2dCQUM5QyxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUU7Z0JBQ3BDLFVBQVUsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksRUFBRTthQUMzQyxDQUFDO1lBRUYsMkNBQTJDO1lBQzNDLFVBQVUsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUVuRCwyQ0FBMkM7WUFDM0MscURBQXFEO1lBRXJELDJEQUEyRDtZQUMzRCwyREFBMkQ7WUFFM0Qsc0RBQXNEO1lBQ3RELFVBQVUsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUM7WUFFdkQsTUFBTSxDQUFDLFVBQVUsQ0FBQztRQUV0QixDQUFDO1FBRUwsa0JBQUM7SUFBRCxDQS9JQSxBQStJQyxJQUFBO0lBL0lZLGtDQUFXIiwiZmlsZSI6ImxpYnJhcnkvYXVkaW8uanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgUGxheWVyRXJyb3IsIElQbGF5ZXJFcnJvciB9IGZyb20gJy4vZXJyb3InO1xuXG5leHBvcnQgaW50ZXJmYWNlIElBdWRpb0dyYXBoIHtcbiAgICBzb3VyY2VOb2RlOiBBdWRpb0J1ZmZlclNvdXJjZU5vZGU7XG4gICAgZ2Fpbk5vZGU6IEdhaW5Ob2RlO1xuICAgIHBhbm5lck5vZGU6IFBhbm5lck5vZGU7XG59XG5cbmV4cG9ydCBjbGFzcyBQbGF5ZXJBdWRpbyB7XG5cbiAgICBwcm90ZWN0ZWQgX2NvbnRleHQ6IEF1ZGlvQ29udGV4dDtcbiAgICBwcm90ZWN0ZWQgX2NvbnRleHRTdGF0ZTogc3RyaW5nO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG5cbiAgICAgICAgLy8gaW5pdGlhbCBjb250ZXh0IHN0YXRlIGlzIHN0aWxsIFwiY2xvc2VkXCJcbiAgICAgICAgdGhpcy5fY29udGV4dFN0YXRlID0gJ2Nsb3NlZCc7XG5cbiAgICAgICAgLy8gVE9ETzogdG8gc3BlZWQgdXAgdGhpbmdzIHdvdWxkIGl0IGJlIGJldHRlciB0byBjcmVhdGUgYSBjb250ZXh0IGluIHRoZSBjb25zdHJ1Y3Rvcj9cbiAgICAgICAgLy8gYW5kIHN1c3BlbmQgdGhlIGNvbnRleHQgdXBvbiBjcmVhdGluZyBpdCB1bnRpbCBpdCBnZXRzIHVzZWQ/XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgZGVjb2RlQXVkaW8oYXJyYXlCdWZmZXI6IEFycmF5QnVmZmVyKTogUHJvbWlzZTxBdWRpb0J1ZmZlcj4ge1xuXG4gICAgICAgIGlmICh0aGlzLl9jb250ZXh0U3RhdGUgPT09ICdjbG9zZWQnKSB7XG4gICAgICAgICAgICB0aGlzLl9jcmVhdGVDb250ZXh0KCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5fY29udGV4dFN0YXRlID09PSAnc3VzcGVuZGVkJykge1xuXG4gICAgICAgICAgICB0aGlzLl91bmZyZWV6ZUF1ZGlvQ29udGV4dCgpLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLl9jb250ZXh0LmRlY29kZUF1ZGlvRGF0YShhcnJheUJ1ZmZlcikpO1xuXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gZGVjb2RlQXVkaW9EYXRhIHJldHVybnMgYSBwcm9taXNlIG9mIHR5cGUgUHJvbWlzZUxpa2VcbiAgICAgICAgLy8gdXNpbmcgcmVzb2x2ZSB0byByZXR1cm4gYSBwcm9taXNlIG9mIHR5cGUgUHJvbWlzZVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuX2NvbnRleHQuZGVjb2RlQXVkaW9EYXRhKGFycmF5QnVmZmVyKSk7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX2NyZWF0ZUNvbnRleHQoKSB7XG5cbiAgICAgICAgbGV0IEF1ZGlvQ29udGV4dCA9IHdpbmRvdy5BdWRpb0NvbnRleHQgfHwgKHdpbmRvdyBhcyBhbnkpLndlYmtpdEF1ZGlvQ29udGV4dDtcblxuICAgICAgICBsZXQgYXVkaW9Db250ZXh0ID0gbmV3IEF1ZGlvQ29udGV4dCgpO1xuXG4gICAgICAgIGF1ZGlvQ29udGV4dC5vbnN0YXRlY2hhbmdlID0gKCkgPT4ge1xuXG4gICAgICAgICAgICB0aGlzLl9jb250ZXh0U3RhdGUgPSBhdWRpb0NvbnRleHQuc3RhdGU7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLl9jb250ZXh0U3RhdGUgPT09ICdjbG9zZWQnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fY29udGV4dCA9IG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLl9jb250ZXh0ID0gYXVkaW9Db250ZXh0O1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9kZXN0cm95QXVkaW9Db250ZXh0KCkge1xuXG4gICAgICAgIHRoaXMuX2NvbnRleHQuY2xvc2UoKS50aGVuKCgpID0+IHtcblxuICAgICAgICAgICAgdGhpcy5fY29udGV4dCA9IG51bGw7XG5cbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX2ZyZWV6ZUF1ZGlvQ29udGV4dCgpOiBQcm9taXNlPHZvaWQ+IHtcblxuICAgICAgICAvLyBkaWQgcmVzdW1lIGdldCBpbXBsZW1lbnRlZFxuICAgICAgICBpZiAodHlwZW9mIHRoaXMuX2NvbnRleHQuc3VzcGVuZCA9PT0gJ3VuZGVmaW5lZCcpIHtcblxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgIC8vIHJlc3VtZSB0aGUgYXVkaW8gaGFyZHdhcmUgYWNjZXNzXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY29udGV4dC5yZXN1bWUoKTtcblxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX3VuZnJlZXplQXVkaW9Db250ZXh0KCk6IFByb21pc2U8dm9pZD4ge1xuXG4gICAgICAgIC8vIGRpZCBzdXNwZW5kIGdldCBpbXBsZW1lbnRlZFxuICAgICAgICBpZiAodHlwZW9mIHRoaXMuX2NvbnRleHQuc3VzcGVuZCA9PT0gJ3VuZGVmaW5lZCcpIHtcblxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgIC8vIGhhbHQgdGhlIGF1ZGlvIGhhcmR3YXJlIGFjY2VzcyB0ZW1wb3JhcmlseSB0byByZWR1Y2UgQ1BVIGFuZCBiYXR0ZXJ5IHVzYWdlXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY29udGV4dC5zdXNwZW5kKCk7XG5cbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgcHVibGljIGNyZWF0ZUF1ZGlvR3JhcGgoKTogSUF1ZGlvR3JhcGgge1xuXG4gICAgICAgIGlmICh0aGlzLl9jb250ZXh0U3RhdGUgPT09ICdjbG9zZWQnKSB7XG4gICAgICAgICAgICB0aGlzLl9jcmVhdGVDb250ZXh0KCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5fY29udGV4dFN0YXRlID09PSAnc3VzcGVuZGVkJykge1xuXG4gICAgICAgICAgICB0aGlzLl91bmZyZWV6ZUF1ZGlvQ29udGV4dCgpLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fY3JlYXRlQXVkaW9HcmFwaCgpO1xuXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX2NyZWF0ZUF1ZGlvR3JhcGgoKTtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfY3JlYXRlQXVkaW9HcmFwaCgpOiBJQXVkaW9HcmFwaCB7XG5cbiAgICAgICAgbGV0IGF1ZGlvR3JhcGggPSB7XG4gICAgICAgICAgICBzb3VyY2VOb2RlOiB0aGlzLl9jb250ZXh0LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpLFxuICAgICAgICAgICAgZ2Fpbk5vZGU6IHRoaXMuX2NvbnRleHQuY3JlYXRlR2FpbigpLFxuICAgICAgICAgICAgcGFubmVyTm9kZTogdGhpcy5fY29udGV4dC5jcmVhdGVQYW5uZXIoKVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGNvbm5lY3QgdGhlIHNvdXJjZSBub2RlIHRvIHRoZSBnYWluIG5vZGVcbiAgICAgICAgYXVkaW9HcmFwaC5zb3VyY2VOb2RlLmNvbm5lY3QoYXVkaW9HcmFwaC5nYWluTm9kZSk7XG5cbiAgICAgICAgLy8gY29ubmVjdCB0aGUgZ2FpbiBub2RlIHRvIHRoZSBwYW5uZXIgbm9kZVxuICAgICAgICAvL2F1ZGlvR3JhcGguZ2Fpbk5vZGUuY29ubmVjdChhdWRpb0dyYXBoLnBhbm5lck5vZGUpO1xuXG4gICAgICAgIC8vIGNvbm5lY3QgdG8gdGhlIHBhbm5lciBub2RlIHRvIHRoZSBkZXN0aW5hdGlvbiAoc3BlYWtlcnMpXG4gICAgICAgIC8vYXVkaW9HcmFwaC5wYW5uZXJOb2RlLmNvbm5lY3QodGhpcy5fY29udGV4dC5kZXN0aW5hdGlvbik7XG5cbiAgICAgICAgLy8gY29ubmVjdCB0aGUgZ2FpbiBub2RlIHRvIHRoZSBkZXN0aW5hdGlvbiAoc3BlYWtlcnMpXG4gICAgICAgIGF1ZGlvR3JhcGguZ2Fpbk5vZGUuY29ubmVjdCh0aGlzLl9jb250ZXh0LmRlc3RpbmF0aW9uKTtcblxuICAgICAgICByZXR1cm4gYXVkaW9HcmFwaDtcblxuICAgIH1cblxufVxuIl19

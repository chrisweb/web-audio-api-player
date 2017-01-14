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
        PlayerAudio.prototype.createAudioGraph = function (audioGraphOptions) {
            var _this = this;
            if (this._contextState === 'closed') {
                this._createContext();
            }
            if (this._contextState === 'suspended') {
                this._unfreezeAudioContext().then(function () {
                    _this._createAudioGraph(audioGraphOptions);
                });
            }
            return this._createAudioGraph(audioGraphOptions);
        };
        PlayerAudio.prototype._createAudioGraph = function (audioGraphOptions) {
            var audioGraph = {
                sourceNode: this._context.createBufferSource(),
                gainNode: this._context.createGain(),
                pannerNode: this._context.createPanner()
            };
            audioGraph.gainNode.gain.value = audioGraphOptions.volume / 100;
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9saWJyYXJ5L2F1ZGlvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0lBQ0EsWUFBWSxDQUFDO0lBY2I7UUFLSTtZQUVJLDBDQUEwQztZQUMxQyxJQUFJLENBQUMsYUFBYSxHQUFHLFFBQVEsQ0FBQztZQUU5QixzRkFBc0Y7WUFDdEYsK0RBQStEO1FBRW5FLENBQUM7UUFFTSxpQ0FBVyxHQUFsQixVQUFtQixXQUF3QjtZQUEzQyxpQkFvQkM7WUFsQkcsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDO2dCQUNsQyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDMUIsQ0FBQztZQUVELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLEtBQUssV0FBVyxDQUFDLENBQUMsQ0FBQztnQkFFckMsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUMsSUFBSSxDQUFDO29CQUU5QixNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFJLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO2dCQUV2RSxDQUFDLENBQUMsQ0FBQztZQUVQLENBQUM7WUFFRCx3REFBd0Q7WUFDeEQsb0RBQW9EO1lBQ3BELE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7UUFFdkUsQ0FBQztRQUVTLG9DQUFjLEdBQXhCO1lBQUEsaUJBa0JDO1lBaEJHLElBQUksWUFBWSxHQUFHLE1BQU0sQ0FBQyxZQUFZLElBQUssTUFBYyxDQUFDLGtCQUFrQixDQUFDO1lBRTdFLElBQUksWUFBWSxHQUFHLElBQUksWUFBWSxFQUFFLENBQUM7WUFFdEMsWUFBWSxDQUFDLGFBQWEsR0FBRztnQkFFekIsS0FBSSxDQUFDLGFBQWEsR0FBRyxZQUFZLENBQUMsS0FBSyxDQUFDO2dCQUV4QyxFQUFFLENBQUMsQ0FBQyxLQUFJLENBQUMsYUFBYSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7b0JBQ2xDLEtBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO2dCQUN6QixDQUFDO1lBRUwsQ0FBQyxDQUFDO1lBRUYsSUFBSSxDQUFDLFFBQVEsR0FBRyxZQUFZLENBQUM7UUFFakMsQ0FBQztRQUVTLDBDQUFvQixHQUE5QjtZQUFBLGlCQVFDO1lBTkcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxJQUFJLENBQUM7Z0JBRXZCLEtBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1lBRXpCLENBQUMsQ0FBQyxDQUFDO1FBRVAsQ0FBQztRQUVTLHlDQUFtQixHQUE3QjtZQUVJLDZCQUE2QjtZQUM3QixFQUFFLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxLQUFLLFdBQVcsQ0FBQyxDQUFDLENBQUM7Z0JBRS9DLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7WUFFN0IsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUVKLG1DQUFtQztnQkFDbkMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUM7WUFFbEMsQ0FBQztRQUVMLENBQUM7UUFFUywyQ0FBcUIsR0FBL0I7WUFFSSw4QkFBOEI7WUFDOUIsRUFBRSxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sS0FBSyxXQUFXLENBQUMsQ0FBQyxDQUFDO2dCQUUvQyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBRTdCLENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFFSiw2RUFBNkU7Z0JBQzdFLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBRW5DLENBQUM7UUFFTCxDQUFDO1FBRU0sc0NBQWdCLEdBQXZCLFVBQXdCLGlCQUFxQztZQUE3RCxpQkFrQkM7WUFoQkcsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDO2dCQUNsQyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDMUIsQ0FBQztZQUVELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLEtBQUssV0FBVyxDQUFDLENBQUMsQ0FBQztnQkFFckMsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUMsSUFBSSxDQUFDO29CQUU5QixLQUFJLENBQUMsaUJBQWlCLENBQUMsaUJBQWlCLENBQUMsQ0FBQztnQkFFOUMsQ0FBQyxDQUFDLENBQUM7WUFFUCxDQUFDO1lBRUQsTUFBTSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBRXJELENBQUM7UUFFUyx1Q0FBaUIsR0FBM0IsVUFBNEIsaUJBQXFDO1lBRTdELElBQUksVUFBVSxHQUFHO2dCQUNiLFVBQVUsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLGtCQUFrQixFQUFFO2dCQUM5QyxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUU7Z0JBQ3BDLFVBQVUsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksRUFBRTthQUMzQyxDQUFDO1lBRUYsVUFBVSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLGlCQUFpQixDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUM7WUFFaEUsMkNBQTJDO1lBQzNDLFVBQVUsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUVuRCwyQ0FBMkM7WUFDM0MscURBQXFEO1lBRXJELDJEQUEyRDtZQUMzRCwyREFBMkQ7WUFFM0Qsc0RBQXNEO1lBQ3RELFVBQVUsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUM7WUFFdkQsTUFBTSxDQUFDLFVBQVUsQ0FBQztRQUV0QixDQUFDO1FBRUwsa0JBQUM7SUFBRCxDQWpKQSxBQWlKQyxJQUFBO0lBakpZLGtDQUFXIiwiZmlsZSI6ImxpYnJhcnkvYXVkaW8uanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgUGxheWVyRXJyb3IsIElQbGF5ZXJFcnJvciB9IGZyb20gJy4vZXJyb3InO1xuXG5leHBvcnQgaW50ZXJmYWNlIElBdWRpb0dyYXBoIHtcbiAgICBzb3VyY2VOb2RlOiBBdWRpb0J1ZmZlclNvdXJjZU5vZGU7XG4gICAgZ2Fpbk5vZGU6IEdhaW5Ob2RlO1xuICAgIHBhbm5lck5vZGU6IFBhbm5lck5vZGU7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUF1ZGlvR3JhcGhPcHRpb25zIHtcbiAgICB2b2x1bWU6IG51bWJlcjtcbn1cblxuZXhwb3J0IGNsYXNzIFBsYXllckF1ZGlvIHtcblxuICAgIHByb3RlY3RlZCBfY29udGV4dDogQXVkaW9Db250ZXh0O1xuICAgIHByb3RlY3RlZCBfY29udGV4dFN0YXRlOiBzdHJpbmc7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcblxuICAgICAgICAvLyBpbml0aWFsIGNvbnRleHQgc3RhdGUgaXMgc3RpbGwgXCJjbG9zZWRcIlxuICAgICAgICB0aGlzLl9jb250ZXh0U3RhdGUgPSAnY2xvc2VkJztcblxuICAgICAgICAvLyBUT0RPOiB0byBzcGVlZCB1cCB0aGluZ3Mgd291bGQgaXQgYmUgYmV0dGVyIHRvIGNyZWF0ZSBhIGNvbnRleHQgaW4gdGhlIGNvbnN0cnVjdG9yP1xuICAgICAgICAvLyBhbmQgc3VzcGVuZCB0aGUgY29udGV4dCB1cG9uIGNyZWF0aW5nIGl0IHVudGlsIGl0IGdldHMgdXNlZD9cblxuICAgIH1cblxuICAgIHB1YmxpYyBkZWNvZGVBdWRpbyhhcnJheUJ1ZmZlcjogQXJyYXlCdWZmZXIpOiBQcm9taXNlPEF1ZGlvQnVmZmVyPiB7XG5cbiAgICAgICAgaWYgKHRoaXMuX2NvbnRleHRTdGF0ZSA9PT0gJ2Nsb3NlZCcpIHtcbiAgICAgICAgICAgIHRoaXMuX2NyZWF0ZUNvbnRleHQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl9jb250ZXh0U3RhdGUgPT09ICdzdXNwZW5kZWQnKSB7XG5cbiAgICAgICAgICAgIHRoaXMuX3VuZnJlZXplQXVkaW9Db250ZXh0KCkudGhlbigoKSA9PiB7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuX2NvbnRleHQuZGVjb2RlQXVkaW9EYXRhKGFycmF5QnVmZmVyKSk7XG5cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH1cblxuICAgICAgICAvLyBkZWNvZGVBdWRpb0RhdGEgcmV0dXJucyBhIHByb21pc2Ugb2YgdHlwZSBQcm9taXNlTGlrZVxuICAgICAgICAvLyB1c2luZyByZXNvbHZlIHRvIHJldHVybiBhIHByb21pc2Ugb2YgdHlwZSBQcm9taXNlXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5fY29udGV4dC5kZWNvZGVBdWRpb0RhdGEoYXJyYXlCdWZmZXIpKTtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfY3JlYXRlQ29udGV4dCgpIHtcblxuICAgICAgICBsZXQgQXVkaW9Db250ZXh0ID0gd2luZG93LkF1ZGlvQ29udGV4dCB8fCAod2luZG93IGFzIGFueSkud2Via2l0QXVkaW9Db250ZXh0O1xuXG4gICAgICAgIGxldCBhdWRpb0NvbnRleHQgPSBuZXcgQXVkaW9Db250ZXh0KCk7XG5cbiAgICAgICAgYXVkaW9Db250ZXh0Lm9uc3RhdGVjaGFuZ2UgPSAoKSA9PiB7XG5cbiAgICAgICAgICAgIHRoaXMuX2NvbnRleHRTdGF0ZSA9IGF1ZGlvQ29udGV4dC5zdGF0ZTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuX2NvbnRleHRTdGF0ZSA9PT0gJ2Nsb3NlZCcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9jb250ZXh0ID0gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuX2NvbnRleHQgPSBhdWRpb0NvbnRleHQ7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX2Rlc3Ryb3lBdWRpb0NvbnRleHQoKSB7XG5cbiAgICAgICAgdGhpcy5fY29udGV4dC5jbG9zZSgpLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgICAgICB0aGlzLl9jb250ZXh0ID0gbnVsbDtcblxuICAgICAgICB9KTtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfZnJlZXplQXVkaW9Db250ZXh0KCk6IFByb21pc2U8dm9pZD4ge1xuXG4gICAgICAgIC8vIGRpZCByZXN1bWUgZ2V0IGltcGxlbWVudGVkXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5fY29udGV4dC5zdXNwZW5kID09PSAndW5kZWZpbmVkJykge1xuXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgLy8gcmVzdW1lIHRoZSBhdWRpbyBoYXJkd2FyZSBhY2Nlc3NcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jb250ZXh0LnJlc3VtZSgpO1xuXG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfdW5mcmVlemVBdWRpb0NvbnRleHQoKTogUHJvbWlzZTx2b2lkPiB7XG5cbiAgICAgICAgLy8gZGlkIHN1c3BlbmQgZ2V0IGltcGxlbWVudGVkXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5fY29udGV4dC5zdXNwZW5kID09PSAndW5kZWZpbmVkJykge1xuXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgLy8gaGFsdCB0aGUgYXVkaW8gaGFyZHdhcmUgYWNjZXNzIHRlbXBvcmFyaWx5IHRvIHJlZHVjZSBDUFUgYW5kIGJhdHRlcnkgdXNhZ2VcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jb250ZXh0LnN1c3BlbmQoKTtcblxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgY3JlYXRlQXVkaW9HcmFwaChhdWRpb0dyYXBoT3B0aW9uczogSUF1ZGlvR3JhcGhPcHRpb25zKTogSUF1ZGlvR3JhcGgge1xuXG4gICAgICAgIGlmICh0aGlzLl9jb250ZXh0U3RhdGUgPT09ICdjbG9zZWQnKSB7XG4gICAgICAgICAgICB0aGlzLl9jcmVhdGVDb250ZXh0KCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5fY29udGV4dFN0YXRlID09PSAnc3VzcGVuZGVkJykge1xuXG4gICAgICAgICAgICB0aGlzLl91bmZyZWV6ZUF1ZGlvQ29udGV4dCgpLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fY3JlYXRlQXVkaW9HcmFwaChhdWRpb0dyYXBoT3B0aW9ucyk7XG5cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5fY3JlYXRlQXVkaW9HcmFwaChhdWRpb0dyYXBoT3B0aW9ucyk7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX2NyZWF0ZUF1ZGlvR3JhcGgoYXVkaW9HcmFwaE9wdGlvbnM6IElBdWRpb0dyYXBoT3B0aW9ucyk6IElBdWRpb0dyYXBoIHtcblxuICAgICAgICBsZXQgYXVkaW9HcmFwaCA9IHtcbiAgICAgICAgICAgIHNvdXJjZU5vZGU6IHRoaXMuX2NvbnRleHQuY3JlYXRlQnVmZmVyU291cmNlKCksXG4gICAgICAgICAgICBnYWluTm9kZTogdGhpcy5fY29udGV4dC5jcmVhdGVHYWluKCksXG4gICAgICAgICAgICBwYW5uZXJOb2RlOiB0aGlzLl9jb250ZXh0LmNyZWF0ZVBhbm5lcigpXG4gICAgICAgIH07XG5cbiAgICAgICAgYXVkaW9HcmFwaC5nYWluTm9kZS5nYWluLnZhbHVlID0gYXVkaW9HcmFwaE9wdGlvbnMudm9sdW1lIC8gMTAwO1xuXG4gICAgICAgIC8vIGNvbm5lY3QgdGhlIHNvdXJjZSBub2RlIHRvIHRoZSBnYWluIG5vZGVcbiAgICAgICAgYXVkaW9HcmFwaC5zb3VyY2VOb2RlLmNvbm5lY3QoYXVkaW9HcmFwaC5nYWluTm9kZSk7XG5cbiAgICAgICAgLy8gY29ubmVjdCB0aGUgZ2FpbiBub2RlIHRvIHRoZSBwYW5uZXIgbm9kZVxuICAgICAgICAvL2F1ZGlvR3JhcGguZ2Fpbk5vZGUuY29ubmVjdChhdWRpb0dyYXBoLnBhbm5lck5vZGUpO1xuXG4gICAgICAgIC8vIGNvbm5lY3QgdG8gdGhlIHBhbm5lciBub2RlIHRvIHRoZSBkZXN0aW5hdGlvbiAoc3BlYWtlcnMpXG4gICAgICAgIC8vYXVkaW9HcmFwaC5wYW5uZXJOb2RlLmNvbm5lY3QodGhpcy5fY29udGV4dC5kZXN0aW5hdGlvbik7XG5cbiAgICAgICAgLy8gY29ubmVjdCB0aGUgZ2FpbiBub2RlIHRvIHRoZSBkZXN0aW5hdGlvbiAoc3BlYWtlcnMpXG4gICAgICAgIGF1ZGlvR3JhcGguZ2Fpbk5vZGUuY29ubmVjdCh0aGlzLl9jb250ZXh0LmRlc3RpbmF0aW9uKTtcblxuICAgICAgICByZXR1cm4gYXVkaW9HcmFwaDtcblxuICAgIH1cblxufVxuIl19

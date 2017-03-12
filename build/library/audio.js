(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    'use strict';
    Object.defineProperty(exports, "__esModule", { value: true });
    var PlayerAudio = (function () {
        function PlayerAudio() {
            // initial context state is still "closed"
            this._contextState = 'closed';
            this._audioGraph = null;
            // TODO: to speed up things would it be better to create a context in the constructor?
            // and suspend the context upon creating it until it gets used?
        }
        PlayerAudio.prototype.decodeAudio = function (arrayBuffer) {
            var _this = this;
            return this._getAudioContext().then(function () {
                // decodeAudioData returns a promise of type PromiseLike
                // using resolve to return a promise of type Promise
                return Promise.resolve(_this._context.decodeAudioData(arrayBuffer));
            });
        };
        PlayerAudio.prototype._getAudioContext = function () {
            var _this = this;
            return new Promise(function (resolve, reject) {
                if (_this._contextState === 'closed') {
                    var AudioContext_1 = window.AudioContext || window.webkitAudioContext;
                    var audioContext_1 = new AudioContext_1();
                    audioContext_1.onstatechange = function () {
                        _this._contextState = audioContext_1.state;
                        if (_this._contextState === 'closed') {
                            _this._context = null;
                        }
                    };
                    _this._context = audioContext_1;
                    _this._createAudioGraph();
                    resolve();
                }
                else if (_this._contextState === 'suspended') {
                    _this._unfreezeAudioContext().then(function () {
                        resolve();
                    });
                }
                else {
                    resolve();
                }
            });
        };
        PlayerAudio.prototype._destroyAudioContext = function () {
            var _this = this;
            this._destroyAudioGraph();
            this._context.close().then(function () {
                _this._context = null;
            });
        };
        PlayerAudio.prototype._unfreezeAudioContext = function () {
            // did resume get implemented
            if (typeof this._context.suspend === 'undefined') {
                return Promise.resolve();
            }
            else {
                // resume the audio hardware access
                return this._context.resume();
            }
        };
        PlayerAudio.prototype._freezeAudioContext = function () {
            // did suspend get implemented
            if (typeof this._context.suspend === 'undefined') {
                return Promise.resolve();
            }
            else {
                // halt the audio hardware access temporarily to reduce CPU and battery usage
                return this._context.suspend();
            }
        };
        PlayerAudio.prototype._createAudioGraph = function () {
            // https://developer.mozilla.org/en-US/docs/Web/API/GainNode
            var audioGraph = {
                gainNode: this._context.createGain()
            };
            // connect the gain node to the destination (speakers)
            audioGraph.gainNode.connect(this._context.destination);
            this._audioGraph = audioGraph;
        };
        PlayerAudio.prototype.setAudioGraph = function (audioGraph) {
            if (this._audioGraph !== null) {
                this._destroyAudioGraph();
            }
            this._audioGraph = audioGraph;
        };
        PlayerAudio.prototype.getAudioGraph = function () {
            return this._audioGraph;
        };
        PlayerAudio.prototype.createSourceNode = function (sourceNodeOptions) {
            var _this = this;
            return this._getAudioContext().then(function () {
                var sourceNode = _this._context.createBufferSource();
                // do we loop this song
                sourceNode.loop = sourceNodeOptions.loop;
                // if the song ends destroy it's audioGraph as the source can't be reused anyway
                // NOTE: the onended handler won't have any effect if the loop property is set to
                // true, as the audio won't stop playing. To see the effect in this case you'd
                // have to use AudioBufferSourceNode.stop()
                sourceNode.onended = function () {
                    sourceNodeOptions.onEnded();
                    sourceNode.disconnect();
                    sourceNode = null;
                };
                return sourceNode;
            });
        };
        PlayerAudio.prototype.connectSourceNodeToGraph = function (sourceNode) {
            sourceNode.connect(this._audioGraph.gainNode);
        };
        PlayerAudio.prototype._destroyAudioGraph = function () {
            this._audioGraph.gainNode.disconnect();
            this._audioGraph = null;
        };
        PlayerAudio.prototype.destroySourceNode = function (sourceNode) {
            sourceNode.disconnect();
            sourceNode = null;
            return sourceNode;
        };
        PlayerAudio.prototype.changeGainValue = function (volume) {
            var _this = this;
            this._getAudioContext().then(function () {
                _this._audioGraph.gainNode.gain.value = volume / 100;
            });
        };
        return PlayerAudio;
    }());
    exports.PlayerAudio = PlayerAudio;
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9saWJyYXJ5L2F1ZGlvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztJQUNBLFlBQVksQ0FBQzs7SUFtQmI7UUFNSTtZQUVJLDBDQUEwQztZQUMxQyxJQUFJLENBQUMsYUFBYSxHQUFHLFFBQVEsQ0FBQztZQUM5QixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztZQUV4QixzRkFBc0Y7WUFDdEYsK0RBQStEO1FBRW5FLENBQUM7UUFFTSxpQ0FBVyxHQUFsQixVQUFtQixXQUF3QjtZQUEzQyxpQkFVQztZQVJHLE1BQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxJQUFJLENBQUM7Z0JBRWhDLHdEQUF3RDtnQkFDeEQsb0RBQW9EO2dCQUNwRCxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFJLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1lBRXZFLENBQUMsQ0FBQyxDQUFDO1FBRVAsQ0FBQztRQUVTLHNDQUFnQixHQUExQjtZQUFBLGlCQTBDQztZQXhDRyxNQUFNLENBQUMsSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLEVBQUUsTUFBTTtnQkFFL0IsRUFBRSxDQUFDLENBQUMsS0FBSSxDQUFDLGFBQWEsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDO29CQUVsQyxJQUFJLGNBQVksR0FBRyxNQUFNLENBQUMsWUFBWSxJQUFLLE1BQWMsQ0FBQyxrQkFBa0IsQ0FBQztvQkFFN0UsSUFBSSxjQUFZLEdBQUcsSUFBSSxjQUFZLEVBQUUsQ0FBQztvQkFFdEMsY0FBWSxDQUFDLGFBQWEsR0FBRzt3QkFFekIsS0FBSSxDQUFDLGFBQWEsR0FBRyxjQUFZLENBQUMsS0FBSyxDQUFDO3dCQUV4QyxFQUFFLENBQUMsQ0FBQyxLQUFJLENBQUMsYUFBYSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7NEJBQ2xDLEtBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO3dCQUN6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Z0Y7Z0JBQ2hGLGlGQUFpRjtnQkFDakYsOEVBQThFO2dCQUM5RSwyQ0FBMkM7Z0JBQzNDLFVBQVUsQ0FBQyxPQUFPLEdBQUc7b0JBRWpCLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUU1QixVQUFVLENBQUMsVUFBVSxFQUFFLENBQUM7b0JBRXhCLFVBQVUsR0FBRyxJQUFJLENBQUM7Z0JBRXRCLENBQUMsQ0FBQztnQkFFRixNQUFNLENBQUMsVUFBVSxDQUFDO1lBRXRCLENBQUMsQ0FBQyxDQUFDO1FBRVAsQ0FBQztRQUVNLDhDQUF3QixHQUEvQixVQUFnQyxVQUFpQztZQUU3RCxVQUFVLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFbEQsQ0FBQztRQUVTLHdDQUFrQixHQUE1QjtZQUVJLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBRXZDLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1FBRTVCLENBQUM7UUFFTSx1Q0FBaUIsR0FBeEIsVUFBeUIsVUFBaUM7WUFFdEQsVUFBVSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBRXhCLFVBQVUsR0FBRyxJQUFJLENBQUM7WUFFbEIsTUFBTSxDQUFDLFVBQVUsQ0FBQztRQUV0QixDQUFDO1FBRU0scUNBQWUsR0FBdEIsVUFBdUIsTUFBYztZQUFyQyxpQkFRQztZQU5HLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLElBQUksQ0FBQztnQkFFekIsS0FBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLEdBQUcsR0FBRyxDQUFDO1lBRXhELENBQUMsQ0FBQyxDQUFDO1FBRVAsQ0FBQztRQTZDTCxrQkFBQztJQUFELENBaFFBLEFBZ1FDLElBQUE7SUFoUVksa0NBQVciLCJmaWxlIjoibGlicmFyeS9hdWRpby5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBQbGF5ZXJFcnJvciwgSVBsYXllckVycm9yIH0gZnJvbSAnLi9lcnJvcic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUF1ZGlvR3JhcGgge1xuICAgIGdhaW5Ob2RlOiBHYWluTm9kZTtcbiAgICBwYW5uZXJOb2RlPzogUGFubmVyTm9kZTtcbiAgICBzdGVyZW9QYW5uZXJOb2RlPzogU3RlcmVvUGFubmVyTm9kZTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJQXVkaW9HcmFwaE9wdGlvbnMge1xuICAgIHZvbHVtZTogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElTb3VyY2VOb2RlT3B0aW9ucyB7XG4gICAgbG9vcDogYm9vbGVhbjtcbiAgICBvbkVuZGVkOiBGdW5jdGlvbjtcbn1cblxuZXhwb3J0IGNsYXNzIFBsYXllckF1ZGlvIHtcblxuICAgIHByb3RlY3RlZCBfY29udGV4dDogQXVkaW9Db250ZXh0O1xuICAgIHByb3RlY3RlZCBfY29udGV4dFN0YXRlOiBzdHJpbmc7XG4gICAgcHJvdGVjdGVkIF9hdWRpb0dyYXBoOiBJQXVkaW9HcmFwaCB8IG51bGw7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcblxuICAgICAgICAvLyBpbml0aWFsIGNvbnRleHQgc3RhdGUgaXMgc3RpbGwgXCJjbG9zZWRcIlxuICAgICAgICB0aGlzLl9jb250ZXh0U3RhdGUgPSAnY2xvc2VkJztcbiAgICAgICAgdGhpcy5fYXVkaW9HcmFwaCA9IG51bGw7XG5cbiAgICAgICAgLy8gVE9ETzogdG8gc3BlZWQgdXAgdGhpbmdzIHdvdWxkIGl0IGJlIGJldHRlciB0byBjcmVhdGUgYSBjb250ZXh0IGluIHRoZSBjb25zdHJ1Y3Rvcj9cbiAgICAgICAgLy8gYW5kIHN1c3BlbmQgdGhlIGNvbnRleHQgdXBvbiBjcmVhdGluZyBpdCB1bnRpbCBpdCBnZXRzIHVzZWQ/XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgZGVjb2RlQXVkaW8oYXJyYXlCdWZmZXI6IEFycmF5QnVmZmVyKTogUHJvbWlzZTxBdWRpb0J1ZmZlcj4ge1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9nZXRBdWRpb0NvbnRleHQoKS50aGVuKCgpID0+IHtcblxuICAgICAgICAgICAgLy8gZGVjb2RlQXVkaW9EYXRhIHJldHVybnMgYSBwcm9taXNlIG9mIHR5cGUgUHJvbWlzZUxpa2VcbiAgICAgICAgICAgIC8vIHVzaW5nIHJlc29sdmUgdG8gcmV0dXJuIGEgcHJvbWlzZSBvZiB0eXBlIFByb21pc2VcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5fY29udGV4dC5kZWNvZGVBdWRpb0RhdGEoYXJyYXlCdWZmZXIpKTtcblxuICAgICAgICB9KTtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfZ2V0QXVkaW9Db250ZXh0KCk6IFByb21pc2U8e30+IHtcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgICAgICBpZiAodGhpcy5fY29udGV4dFN0YXRlID09PSAnY2xvc2VkJykge1xuXG4gICAgICAgICAgICAgICAgbGV0IEF1ZGlvQ29udGV4dCA9IHdpbmRvdy5BdWRpb0NvbnRleHQgfHwgKHdpbmRvdyBhcyBhbnkpLndlYmtpdEF1ZGlvQ29udGV4dDtcblxuICAgICAgICAgICAgICAgIGxldCBhdWRpb0NvbnRleHQgPSBuZXcgQXVkaW9Db250ZXh0KCk7XG5cbiAgICAgICAgICAgICAgICBhdWRpb0NvbnRleHQub25zdGF0ZWNoYW5nZSA9ICgpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jb250ZXh0U3RhdGUgPSBhdWRpb0NvbnRleHQuc3RhdGU7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX2NvbnRleHRTdGF0ZSA9PT0gJ2Nsb3NlZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2NvbnRleHQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fY29udGV4dCA9IGF1ZGlvQ29udGV4dDtcblxuICAgICAgICAgICAgICAgIHRoaXMuX2NyZWF0ZUF1ZGlvR3JhcGgoKTtcblxuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcblxuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9jb250ZXh0U3RhdGUgPT09ICdzdXNwZW5kZWQnKSB7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl91bmZyZWV6ZUF1ZGlvQ29udGV4dCgpLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcblxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX2Rlc3Ryb3lBdWRpb0NvbnRleHQoKSB7XG5cbiAgICAgICAgdGhpcy5fZGVzdHJveUF1ZGlvR3JhcGgoKTtcblxuICAgICAgICB0aGlzLl9jb250ZXh0LmNsb3NlKCkudGhlbigoKSA9PiB7XG5cbiAgICAgICAgICAgIHRoaXMuX2NvbnRleHQgPSBudWxsO1xuXG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF91bmZyZWV6ZUF1ZGlvQ29udGV4dCgpOiBQcm9taXNlPHZvaWQ+IHtcblxuICAgICAgICAvLyBkaWQgcmVzdW1lIGdldCBpbXBsZW1lbnRlZFxuICAgICAgICBpZiAodHlwZW9mIHRoaXMuX2NvbnRleHQuc3VzcGVuZCA9PT0gJ3VuZGVmaW5lZCcpIHtcblxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgIC8vIHJlc3VtZSB0aGUgYXVkaW8gaGFyZHdhcmUgYWNjZXNzXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY29udGV4dC5yZXN1bWUoKTtcblxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX2ZyZWV6ZUF1ZGlvQ29udGV4dCgpOiBQcm9taXNlPHZvaWQ+IHtcblxuICAgICAgICAvLyBkaWQgc3VzcGVuZCBnZXQgaW1wbGVtZW50ZWRcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLl9jb250ZXh0LnN1c3BlbmQgPT09ICd1bmRlZmluZWQnKSB7XG5cbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAvLyBoYWx0IHRoZSBhdWRpbyBoYXJkd2FyZSBhY2Nlc3MgdGVtcG9yYXJpbHkgdG8gcmVkdWNlIENQVSBhbmQgYmF0dGVyeSB1c2FnZVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NvbnRleHQuc3VzcGVuZCgpO1xuXG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfY3JlYXRlQXVkaW9HcmFwaCgpIHtcblxuICAgICAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvR2Fpbk5vZGVcblxuICAgICAgICBsZXQgYXVkaW9HcmFwaCA9IHtcbiAgICAgICAgICAgIGdhaW5Ob2RlOiB0aGlzLl9jb250ZXh0LmNyZWF0ZUdhaW4oKVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGNvbm5lY3QgdGhlIGdhaW4gbm9kZSB0byB0aGUgZGVzdGluYXRpb24gKHNwZWFrZXJzKVxuICAgICAgICBhdWRpb0dyYXBoLmdhaW5Ob2RlLmNvbm5lY3QodGhpcy5fY29udGV4dC5kZXN0aW5hdGlvbik7XG5cbiAgICAgICAgdGhpcy5fYXVkaW9HcmFwaCA9IGF1ZGlvR3JhcGg7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0QXVkaW9HcmFwaChhdWRpb0dyYXBoOiBJQXVkaW9HcmFwaCkge1xuXG4gICAgICAgIGlmICh0aGlzLl9hdWRpb0dyYXBoICE9PSBudWxsKSB7XG5cbiAgICAgICAgICAgIHRoaXMuX2Rlc3Ryb3lBdWRpb0dyYXBoKCk7XG5cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2F1ZGlvR3JhcGggPSBhdWRpb0dyYXBoO1xuXG4gICAgfVxuXG4gICAgcHVibGljIGdldEF1ZGlvR3JhcGgoKTogSUF1ZGlvR3JhcGgge1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9hdWRpb0dyYXBoO1xuXG4gICAgfVxuXG4gICAgcHVibGljIGNyZWF0ZVNvdXJjZU5vZGUoc291cmNlTm9kZU9wdGlvbnM6IElTb3VyY2VOb2RlT3B0aW9ucyk6IFByb21pc2U8QXVkaW9CdWZmZXJTb3VyY2VOb2RlPiB7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX2dldEF1ZGlvQ29udGV4dCgpLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgICAgICBsZXQgc291cmNlTm9kZSA9IHRoaXMuX2NvbnRleHQuY3JlYXRlQnVmZmVyU291cmNlKCk7XG5cbiAgICAgICAgICAgIC8vIGRvIHdlIGxvb3AgdGhpcyBzb25nXG4gICAgICAgICAgICBzb3VyY2VOb2RlLmxvb3AgPSBzb3VyY2VOb2RlT3B0aW9ucy5sb29wO1xuXG4gICAgICAgICAgICAvLyBpZiB0aGUgc29uZyBlbmRzIGRlc3Ryb3kgaXQncyBhdWRpb0dyYXBoIGFzIHRoZSBzb3VyY2UgY2FuJ3QgYmUgcmV1c2VkIGFueXdheVxuICAgICAgICAgICAgLy8gTk9URTogdGhlIG9uZW5kZWQgaGFuZGxlciB3b24ndCBoYXZlIGFueSBlZmZlY3QgaWYgdGhlIGxvb3AgcHJvcGVydHkgaXMgc2V0IHRvXG4gICAgICAgICAgICAvLyB0cnVlLCBhcyB0aGUgYXVkaW8gd29uJ3Qgc3RvcCBwbGF5aW5nLiBUbyBzZWUgdGhlIGVmZmVjdCBpbiB0aGlzIGNhc2UgeW91J2RcbiAgICAgICAgICAgIC8vIGhhdmUgdG8gdXNlIEF1ZGlvQnVmZmVyU291cmNlTm9kZS5zdG9wKClcbiAgICAgICAgICAgIHNvdXJjZU5vZGUub25lbmRlZCA9ICgpID0+IHtcblxuICAgICAgICAgICAgICAgIHNvdXJjZU5vZGVPcHRpb25zLm9uRW5kZWQoKTtcblxuICAgICAgICAgICAgICAgIHNvdXJjZU5vZGUuZGlzY29ubmVjdCgpO1xuXG4gICAgICAgICAgICAgICAgc291cmNlTm9kZSA9IG51bGw7XG5cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHJldHVybiBzb3VyY2VOb2RlO1xuXG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG4gICAgcHVibGljIGNvbm5lY3RTb3VyY2VOb2RlVG9HcmFwaChzb3VyY2VOb2RlOiBBdWRpb0J1ZmZlclNvdXJjZU5vZGUpIHtcblxuICAgICAgICBzb3VyY2VOb2RlLmNvbm5lY3QodGhpcy5fYXVkaW9HcmFwaC5nYWluTm9kZSk7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX2Rlc3Ryb3lBdWRpb0dyYXBoKCk6IHZvaWQge1xuXG4gICAgICAgIHRoaXMuX2F1ZGlvR3JhcGguZ2Fpbk5vZGUuZGlzY29ubmVjdCgpO1xuXG4gICAgICAgIHRoaXMuX2F1ZGlvR3JhcGggPSBudWxsO1xuXG4gICAgfVxuXG4gICAgcHVibGljIGRlc3Ryb3lTb3VyY2VOb2RlKHNvdXJjZU5vZGU6IEF1ZGlvQnVmZmVyU291cmNlTm9kZSkge1xuXG4gICAgICAgIHNvdXJjZU5vZGUuZGlzY29ubmVjdCgpO1xuXG4gICAgICAgIHNvdXJjZU5vZGUgPSBudWxsO1xuXG4gICAgICAgIHJldHVybiBzb3VyY2VOb2RlO1xuXG4gICAgfVxuXG4gICAgcHVibGljIGNoYW5nZUdhaW5WYWx1ZSh2b2x1bWU6IG51bWJlcikge1xuXG4gICAgICAgIHRoaXMuX2dldEF1ZGlvQ29udGV4dCgpLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgICAgICB0aGlzLl9hdWRpb0dyYXBoLmdhaW5Ob2RlLmdhaW4udmFsdWUgPSB2b2x1bWUgLyAxMDA7XG5cbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbiAgICAvKnB1YmxpYyBzZXRQbGF5YmFja1JhdGUocGxheWJhY2tSYXRlOiBudW1iZXIpOiB2b2lkIHtcblxuICAgICAgICAvLyA8IDEgc2xvd2VyLCA+IDEgZmFzdGVyIHBsYXliYWNrXG4gICAgICAgIC8vdGhpcy5fYXVkaW9HcmFwaC5zb3VyY2VOb2RlLnNldFBsYXliYWNrUmF0ZShwbGF5YmFja1JhdGUpO1xuXG4gICAgfTtcblxuICAgIHB1YmxpYyBnZXRQbGF5YmFja1JhdGUoKTogbnVtYmVyIHtcblxuICAgICAgICAvL3JldHVybiB0aGlzLl9hdWRpb0dyYXBoLnNvdXJjZU5vZGUucGxheWJhY2tSYXRlO1xuXG4gICAgICAgIHJldHVybiAwO1xuXG4gICAgfTtcblxuICAgIHB1YmxpYyByZXNldFBsYXliYWNrUmF0ZSgpOiB2b2lkIHtcblxuXG5cbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0UGFubmVyKGxlZnQ6IG51bWJlciwgcmlnaHQ6IG51bWJlcik6IHZvaWQge1xuXG4gICAgICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9QYW5uZXJOb2RlXG5cbiAgICAgICAgLy90aGlzLmF1ZGlvR3JhcGgucGFubmVyTm9kZS5zZXRQb3NpdGlvbigwLCAwLCAwKTtcblxuICAgIH07XG5cbiAgICBwdWJsaWMgZ2V0UGFubmVyKCk6IHsgbGVmdDogbnVtYmVyLCByaWdodDogbnVtYmVyIH0ge1xuXG4gICAgICAgIC8vcmV0dXJuIHRoaXMuYXVkaW9HcmFwaC5wYW5uZXJOb2RlLmdldFBvc2l0aW9uKCk7XG5cbiAgICAgICAgcmV0dXJuIHsgbGVmdDogMCwgcmlnaHQ6IDAgfTtcblxuICAgIH07XG5cbiAgICBwdWJsaWMgcmVzZXRQYW5uZXIoKTogdm9pZCB7XG5cblxuXG4gICAgfSovXG5cbn1cbiJdfQ==

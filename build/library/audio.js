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
        function PlayerAudio(options) {
            this._audioContext = null;
            this._audioGraph = null;
            // initial context state is still "closed"
            this._contextState = 'closed';
            this._volume = options.volume;
            if (options.customAudioContext !== undefined) {
                this._audioContext = options.customAudioContext;
            }
            if (options.customAudioGraph !== undefined) {
                this._audioGraph = options.customAudioGraph;
            }
            else {
                this._createAudioGraph();
            }
            // TODO: to speed up things would it be better to create a context in the constructor?
            // and suspend the context upon creating it until it gets used?
        }
        PlayerAudio.prototype.decodeAudio = function (arrayBuffer) {
            return this.getAudioContext().then(function (audioContext) {
                // Note to self:
                // newer decodeAudioData returns promise, older accept as second
                // and third parameter a success and an error callback funtion
                // https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/decodeAudioData
                var audioBufferPromise = audioContext.decodeAudioData(arrayBuffer);
                // decodeAudioData returns a promise of type PromiseLike
                // using resolve to return a promise of type Promise
                return Promise.resolve(audioBufferPromise);
            });
        };
        PlayerAudio.prototype._createAudioContext = function () {
            var AudioContext = window.AudioContext || window.webkitAudioContext;
            var audioContext = new AudioContext();
            this._bindContextStateListener(audioContext);
            return audioContext;
        };
        PlayerAudio.prototype._bindContextStateListener = function (audioContext) {
            var _this = this;
            audioContext.onstatechange = function () {
                _this._contextState = audioContext.state;
                if (_this._contextState === 'closed') {
                    _this._audioContext = null;
                }
            };
        };
        PlayerAudio.prototype.getAudioContext = function () {
            var _this = this;
            return new Promise(function (resolve, reject) {
                if (_this._contextState === 'closed') {
                    var audioContext = _this._createAudioContext();
                    _this._audioContext = audioContext;
                    resolve(audioContext);
                }
                else if (_this._contextState === 'suspended') {
                    _this._unfreezeAudioContext().then(function () {
                        resolve(_this._audioContext);
                    });
                }
                else {
                    resolve(_this._audioContext);
                }
            });
        };
        PlayerAudio.prototype.setAudioContext = function (audioContext) {
            this._audioContext = audioContext;
            this._bindContextStateListener(audioContext);
        };
        PlayerAudio.prototype._destroyAudioContext = function () {
            var _this = this;
            this._destroyAudioGraph();
            this._audioContext.close().then(function () {
                _this._audioContext = null;
            });
        };
        PlayerAudio.prototype._unfreezeAudioContext = function () {
            // did resume get implemented
            if (typeof this._audioContext.suspend === 'undefined') {
                // this browser does not support resume
                // just send back a promise as resume would do
                return Promise.resolve();
            }
            else {
                // resume the audio hardware access
                // audio context resume returns a promise
                // https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/resume
                return this._audioContext.resume();
            }
        };
        PlayerAudio.prototype._freezeAudioContext = function () {
            // did suspend get implemented
            if (typeof this._audioContext.suspend === 'undefined') {
                return Promise.resolve();
            }
            else {
                // halt the audio hardware access temporarily to reduce CPU and battery usage
                return this._audioContext.suspend();
            }
        };
        PlayerAudio.prototype.setAudioGraph = function (audioGraph) {
            if (this._audioGraph !== null) {
                this._destroyAudioGraph();
            }
            this._audioGraph = audioGraph;
        };
        PlayerAudio.prototype.getAudioGraph = function () {
            var _this = this;
            return new Promise(function (resolve, reject) {
                if (_this._audioGraph !== null) {
                    resolve(_this._audioGraph);
                }
                else {
                    _this._createAudioGraph()
                        .then(function (audioGraph) {
                        _this._audioGraph = audioGraph;
                        resolve(audioGraph);
                    }).catch(reject);
                }
            });
        };
        PlayerAudio.prototype.createSourceNode = function (sourceNodeOptions) {
            return this.getAudioContext().then(function (audioContext) {
                var sourceNode = audioContext.createBufferSource();
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
        PlayerAudio.prototype.connectSourceNodeToGraphNodes = function (sourceNode) {
            sourceNode.connect(this._audioGraph.gainNode);
            if (this._audioGraph.analyserNode !== null) {
                sourceNode.connect(this._audioGraph.analyserNode);
            }
            if (this._audioGraph.delayNode !== null) {
                sourceNode.connect(this._audioGraph.delayNode);
            }
        };
        PlayerAudio.prototype._createAudioGraph = function () {
            var _this = this;
            return new Promise(function (resolve, reject) {
                _this.getAudioContext().then(function (audioContext) {
                    if (_this._audioGraph === null) {
                        _this._audioGraph = {
                            gainNode: audioContext.createGain()
                        };
                    }
                    // connect the gain node to the destination (speakers)
                    // https://developer.mozilla.org/en-US/docs/Web/API/AudioDestinationNode
                    _this._audioGraph.gainNode.connect(audioContext.destination);
                    // update volume
                    _this.changeGainValue(_this._volume);
                    resolve(_this._audioGraph);
                });
            });
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
            this.getAudioGraph().then(function (audioGraph) {
                audioGraph.gainNode.gain.value = volume / 100;
            });
        };
        return PlayerAudio;
    }());
    exports.PlayerAudio = PlayerAudio;
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9saWJyYXJ5L2F1ZGlvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztJQUNBLFlBQVksQ0FBQzs7SUFxR2I7UUFPSSxxQkFBWSxPQUF1QjtZQUp6QixrQkFBYSxHQUF5QixJQUFJLENBQUM7WUFFM0MsZ0JBQVcsR0FBdUIsSUFBSSxDQUFDO1lBSTdDLDBDQUEwQztZQUMxQyxJQUFJLENBQUMsYUFBYSxHQUFHLFFBQVEsQ0FBQztZQUU5QixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFFOUIsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLGtCQUFrQixLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBQzNDLElBQUksQ0FBQyxhQUFhLEdBQUcsT0FBTyxDQUFDLGtCQUFrQixDQUFDO1lBQ3BELENBQUM7WUFFRCxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQztnQkFDekMsSUFBSSxDQUFDLFdBQVcsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUM7WUFDaEQsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNKLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQzdCLENBQUM7WUFFRCxzRkFBc0Y7WUFDdEYsK0RBQStEO1FBRW5FLENBQUM7UUFFTSxpQ0FBVyxHQUFsQixVQUFtQixXQUF3QjtZQUV2QyxNQUFNLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFDLFlBQTJCO2dCQUUzRCxnQkFBZ0I7Z0JBQ2hCLGdFQUFnRTtnQkFDaEUsOERBQThEO2dCQUM5RCxnRkFBZ0Y7Z0JBRWhGLElBQUksa0JBQWtCLEdBQUcsWUFBWSxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFFbkUsd0RBQXdEO2dCQUN4RCxvREFBb0Q7Z0JBQ3BELE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLGtCQUFrQixD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S0FBSSxDQUFDLFdBQVcsR0FBRzs0QkFDZixRQUFRLEVBQUUsWUFBWSxDQUFDLFVBQVUsRUFBRTt5QkFDdEMsQ0FBQztvQkFFTixDQUFDO29CQUVELHNEQUFzRDtvQkFDdEQsd0VBQXdFO29CQUN4RSxLQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDO29CQUU1RCxnQkFBZ0I7b0JBQ2hCLEtBQUksQ0FBQyxlQUFlLENBQUMsS0FBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUVuQyxPQUFPLENBQUMsS0FBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUU5QixDQUFDLENBQUMsQ0FBQztZQUVQLENBQUMsQ0FBQyxDQUFDO1FBRVAsQ0FBQztRQUVTLHdDQUFrQixHQUE1QjtZQUVJLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBRXZDLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1FBRTVCLENBQUM7UUFFTSx1Q0FBaUIsR0FBeEIsVUFBeUIsVUFBaUM7WUFFdEQsVUFBVSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBRXhCLFVBQVUsR0FBRyxJQUFJLENBQUM7WUFFbEIsTUFBTSxDQUFDLFVBQVUsQ0FBQztRQUV0QixDQUFDO1FBRU0scUNBQWUsR0FBdEIsVUFBdUIsTUFBYztZQUVqQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQUMsVUFBdUI7Z0JBRTlDLFVBQVUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLEdBQUcsR0FBRyxDQUFDO1lBRWxELENBQUMsQ0FBQyxDQUFDO1FBRVAsQ0FBQztRQUVMLGtCQUFDO0lBQUQsQ0F2U0EsQUF1U0MsSUFBQTtJQXZTWSxrQ0FBVyIsImZpbGUiOiJsaWJyYXJ5L2F1ZGlvLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IFBsYXllckVycm9yLCBJUGxheWVyRXJyb3IgfSBmcm9tICcuL2Vycm9yJztcblxuLy8gTm90ZSB0byBzZWxmOiBBdWRpb0dyYXBoIGRvY3VtZW50YXRpb25cbi8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9BdWRpb05vZGVcblxuZXhwb3J0IGludGVyZmFjZSBJV2F2ZVRhYmxlIHtcbn1cblxuLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0F1ZGlvQ29udGV4dFxuZXhwb3J0IGludGVyZmFjZSBJQXVkaW9Db250ZXh0IHtcblxuICAgIGRlc3RpbmF0aW9uOiBBdWRpb0Rlc3RpbmF0aW9uTm9kZTsgLy8gcmVhZG9ubHlcbiAgICBzYW1wbGVSYXRlOiBudW1iZXI7IC8vIHJlYWRvbmx5XG4gICAgY3VycmVudFRpbWU6IG51bWJlcjsgLy8gcmVhZG9ubHlcbiAgICBsaXN0ZW5lcjogQXVkaW9MaXN0ZW5lcjsgLy8gcmVhZG9ubHlcbiAgICBhY3RpdmVTb3VyY2VDb3VudDogbnVtYmVyOyAvLyByZWFkb25seVxuXG4gICAgc3RhdGU6IHN0cmluZzsgLy8gcmVhZG9ubHlcblxuICAgIGNyZWF0ZUJ1ZmZlcihudW1iZXJPZkNoYW5uZWxzOiBudW1iZXIsIGxlbmd0aDogbnVtYmVyLCBzYW1wbGVSYXRlOiBudW1iZXIpOiBBdWRpb0J1ZmZlcjtcbiAgICBjcmVhdGVCdWZmZXIoYnVmZmVyOiBBcnJheUJ1ZmZlciwgbWl4VG9Nb25vOiBib29sZWFuKTogQXVkaW9CdWZmZXI7XG4gICAgLy8gb2xkIGRlY29kZUF1ZGlvRGF0YVxuICAgIC8vZGVjb2RlQXVkaW9EYXRhKGF1ZGlvRGF0YTogQXJyYXlCdWZmZXIsIGRlY29kZVN1Y2Nlc3NDYWxsYmFjaz86IEZ1bmN0aW9uLCBkZWNvZGVFcnJvckNhbGxiYWNrPzogRnVuY3Rpb24pOiB2b2lkO1xuICAgIC8vIG5ld2VyIGRlY29kZUF1ZGlvRGF0YVxuICAgIGRlY29kZUF1ZGlvRGF0YShhdWRpb0RhdGE6IEFycmF5QnVmZmVyKTogUHJvbWlzZTxBdWRpb0J1ZmZlcj47XG4gICAgY3JlYXRlQnVmZmVyU291cmNlKCk6IEF1ZGlvQnVmZmVyU291cmNlTm9kZTtcbiAgICBjcmVhdGVNZWRpYUVsZW1lbnRTb3VyY2UobWVkaWFFbGVtZW50OiBIVE1MTWVkaWFFbGVtZW50KTogTWVkaWFFbGVtZW50QXVkaW9Tb3VyY2VOb2RlO1xuICAgIGNyZWF0ZU1lZGlhU3RyZWFtU291cmNlKG1lZGlhU3RyZWFtTWVkaWFTdHJlYW06IE1lZGlhU3RyZWFtKTogTWVkaWFTdHJlYW1BdWRpb1NvdXJjZU5vZGU7XG4gICAgY3JlYXRlTWVkaWFTdHJlYW1EZXN0aW5hdGlvbigpOiBNZWRpYVN0cmVhbUF1ZGlvRGVzdGluYXRpb25Ob2RlO1xuICAgIGNyZWF0ZVNjcmlwdFByb2Nlc3NvcihidWZmZXJTaXplOiBudW1iZXIsIG51bWJlck9mSW5wdXRDaGFubmVscz86IG51bWJlciwgbnVtYmVyT2ZPdXRwdXRDaGFubmVscz86IG51bWJlcik6IFNjcmlwdFByb2Nlc3Nvck5vZGU7XG4gICAgY3JlYXRlQW5hbHlzZXIoKTogQW5hbHlzZXJOb2RlO1xuICAgIGNyZWF0ZUdhaW4oKTogR2Fpbk5vZGU7XG4gICAgY3JlYXRlRGVsYXkobWF4RGVsYXlUaW1lPzogbnVtYmVyKTogRGVsYXlOb2RlO1xuICAgIGNyZWF0ZUJpcXVhZEZpbHRlcigpOiBCaXF1YWRGaWx0ZXJOb2RlO1xuICAgIGNyZWF0ZVdhdmVTaGFwZXIoKTogV2F2ZVNoYXBlck5vZGU7XG4gICAgY3JlYXRlUGFubmVyKCk6IFBhbm5lck5vZGU7XG4gICAgY3JlYXRlQ29udm9sdmVyKCk6IENvbnZvbHZlck5vZGU7XG4gICAgY3JlYXRlQ2hhbm5lbFNwbGl0dGVyKG51bWJlck9mT3V0cHV0cz86IG51bWJlcik6IENoYW5uZWxTcGxpdHRlck5vZGU7XG4gICAgY3JlYXRlQ2hhbm5lbE1lcmdlcihudW1iZXJPZklucHV0cz86IG51bWJlcik6IENoYW5uZWxNZXJnZXJOb2RlO1xuICAgIGNyZWF0ZUR5bmFtaWNzQ29tcHJlc3NvcigpOiBEeW5hbWljc0NvbXByZXNzb3JOb2RlO1xuICAgIGNyZWF0ZU9zY2lsbGF0b3IoKTogT3NjaWxsYXRvck5vZGU7XG4gICAgY3JlYXRlV2F2ZVRhYmxlKHJlYWw6IEZsb2F0MzJBcnJheSwgaW1hZzogRmxvYXQzMkFycmF5KTogSVdhdmVUYWJsZTtcblxuICAgIG9uc3RhdGVjaGFuZ2UoKTogdm9pZDtcbiAgICBjbG9zZSgpOiBQcm9taXNlPHZvaWQ+O1xuICAgIHN1c3BlbmQoKTogUHJvbWlzZTx2b2lkPjtcbiAgICByZXN1bWUoKTogUHJvbWlzZTx2b2lkPjtcbn1cblxuZGVjbGFyZSB2YXIgd2Via2l0QXVkaW9Db250ZXh0OiB7XG4gICAgcHJvdG90eXBlOiBJQXVkaW9Db250ZXh0O1xuICAgIG5ldyAoKTogSUF1ZGlvQ29udGV4dDtcbn07XG5cbmRlY2xhcmUgdmFyIEF1ZGlvQ29udGV4dDoge1xuICAgIHByb3RvdHlwZTogSUF1ZGlvQ29udGV4dDtcbiAgICBuZXcgKCk6IElBdWRpb0NvbnRleHQ7XG59O1xuXG5leHBvcnQgaW50ZXJmYWNlIElBdWRpb0dyYXBoIHtcbiAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvR2Fpbk5vZGVcbiAgICBnYWluTm9kZTogR2Fpbk5vZGU7XG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1Bhbm5lck5vZGVcbiAgICBwYW5uZXJOb2RlPzogUGFubmVyTm9kZTtcbiAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvU3RlcmVvUGFubmVyTm9kZVxuICAgIHN0ZXJlb1Bhbm5lck5vZGU/OiBTdGVyZW9QYW5uZXJOb2RlO1xuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9EZWxheU5vZGVcbiAgICBkZWxheU5vZGU/OiBEZWxheU5vZGU7XG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1NjcmlwdFByb2Nlc3Nvck5vZGVcbiAgICBzY3JpcHRQcm9jZXNzb3JOb2RlPzogU2NyaXB0UHJvY2Vzc29yTm9kZTtcbiAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvQW5hbHlzZXJOb2RlXG4gICAgYW5hbHlzZXJOb2RlPzogQW5hbHlzZXJOb2RlO1xuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9CaXF1YWRGaWx0ZXJOb2RlXG4gICAgYmlxdWFkRmlsdGVyTm9kZT86IEJpcXVhZEZpbHRlck5vZGU7XG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0NoYW5uZWxNZXJnZXJOb2RlXG4gICAgY2hhbm5lbE1lcmdlTm9kZT86IENoYW5uZWxNZXJnZXJOb2RlO1xuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9DaGFubmVsU3BsaXR0ZXJOb2RlXG4gICAgY2hhbm5lbFNwbGl0dGVyTm9kZT86IENoYW5uZWxTcGxpdHRlck5vZGU7XG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0NvbnZvbHZlck5vZGVcbiAgICBjb252b2x2ZXJOb2RlPzogQ29udm9sdmVyTm9kZTtcbiAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvRHluYW1pY3NDb21wcmVzc29yTm9kZVxuICAgIGR5bmFtaWNDb21wcmVzc29yTm9kZT86IER5bmFtaWNzQ29tcHJlc3Nvck5vZGU7XG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL09zY2lsbGF0b3JOb2RlXG4gICAgb3NjaWxsYXRvck5vZGU/OiBPc2NpbGxhdG9yTm9kZTtcbiAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvV2F2ZVNoYXBlck5vZGVcbiAgICB3YXZlU2hhcGVyTm9kZT86IFdhdmVTaGFwZXJOb2RlO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElBdWRpb09wdGlvbnMge1xuICAgIHZvbHVtZTogbnVtYmVyO1xuICAgIGN1c3RvbUF1ZGlvQ29udGV4dD86IElBdWRpb0NvbnRleHQ7XG4gICAgY3VzdG9tQXVkaW9HcmFwaD86IElBdWRpb0dyYXBoO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElTb3VyY2VOb2RlT3B0aW9ucyB7XG4gICAgbG9vcDogYm9vbGVhbjtcbiAgICBvbkVuZGVkOiBGdW5jdGlvbjtcbn1cblxuZXhwb3J0IGNsYXNzIFBsYXllckF1ZGlvIHtcblxuICAgIHByb3RlY3RlZCBfdm9sdW1lOiBudW1iZXI7XG4gICAgcHJvdGVjdGVkIF9hdWRpb0NvbnRleHQ6IElBdWRpb0NvbnRleHQgfCBudWxsID0gbnVsbDtcbiAgICBwcm90ZWN0ZWQgX2NvbnRleHRTdGF0ZTogc3RyaW5nO1xuICAgIHByb3RlY3RlZCBfYXVkaW9HcmFwaDogSUF1ZGlvR3JhcGggfCBudWxsID0gbnVsbDtcblxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnM/OiBJQXVkaW9PcHRpb25zKSB7XG5cbiAgICAgICAgLy8gaW5pdGlhbCBjb250ZXh0IHN0YXRlIGlzIHN0aWxsIFwiY2xvc2VkXCJcbiAgICAgICAgdGhpcy5fY29udGV4dFN0YXRlID0gJ2Nsb3NlZCc7XG5cbiAgICAgICAgdGhpcy5fdm9sdW1lID0gb3B0aW9ucy52b2x1bWU7XG5cbiAgICAgICAgaWYgKG9wdGlvbnMuY3VzdG9tQXVkaW9Db250ZXh0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuX2F1ZGlvQ29udGV4dCA9IG9wdGlvbnMuY3VzdG9tQXVkaW9Db250ZXh0O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG9wdGlvbnMuY3VzdG9tQXVkaW9HcmFwaCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLl9hdWRpb0dyYXBoID0gb3B0aW9ucy5jdXN0b21BdWRpb0dyYXBoO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fY3JlYXRlQXVkaW9HcmFwaCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVE9ETzogdG8gc3BlZWQgdXAgdGhpbmdzIHdvdWxkIGl0IGJlIGJldHRlciB0byBjcmVhdGUgYSBjb250ZXh0IGluIHRoZSBjb25zdHJ1Y3Rvcj9cbiAgICAgICAgLy8gYW5kIHN1c3BlbmQgdGhlIGNvbnRleHQgdXBvbiBjcmVhdGluZyBpdCB1bnRpbCBpdCBnZXRzIHVzZWQ/XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgZGVjb2RlQXVkaW8oYXJyYXlCdWZmZXI6IEFycmF5QnVmZmVyKTogUHJvbWlzZTxBdWRpb0J1ZmZlcj4ge1xuXG4gICAgICAgIHJldHVybiB0aGlzLmdldEF1ZGlvQ29udGV4dCgpLnRoZW4oKGF1ZGlvQ29udGV4dDogSUF1ZGlvQ29udGV4dCkgPT4ge1xuXG4gICAgICAgICAgICAvLyBOb3RlIHRvIHNlbGY6XG4gICAgICAgICAgICAvLyBuZXdlciBkZWNvZGVBdWRpb0RhdGEgcmV0dXJucyBwcm9taXNlLCBvbGRlciBhY2NlcHQgYXMgc2Vjb25kXG4gICAgICAgICAgICAvLyBhbmQgdGhpcmQgcGFyYW1ldGVyIGEgc3VjY2VzcyBhbmQgYW4gZXJyb3IgY2FsbGJhY2sgZnVudGlvblxuICAgICAgICAgICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0F1ZGlvQ29udGV4dC9kZWNvZGVBdWRpb0RhdGFcblxuICAgICAgICAgICAgbGV0IGF1ZGlvQnVmZmVyUHJvbWlzZSA9IGF1ZGlvQ29udGV4dC5kZWNvZGVBdWRpb0RhdGEoYXJyYXlCdWZmZXIpO1xuXG4gICAgICAgICAgICAvLyBkZWNvZGVBdWRpb0RhdGEgcmV0dXJucyBhIHByb21pc2Ugb2YgdHlwZSBQcm9taXNlTGlrZVxuICAgICAgICAgICAgLy8gdXNpbmcgcmVzb2x2ZSB0byByZXR1cm4gYSBwcm9taXNlIG9mIHR5cGUgUHJvbWlzZVxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhdWRpb0J1ZmZlclByb21pc2UpO1xuXG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9jcmVhdGVBdWRpb0NvbnRleHQoKTogSUF1ZGlvQ29udGV4dCB7XG5cbiAgICAgICAgbGV0IEF1ZGlvQ29udGV4dCA9IHdpbmRvdy5BdWRpb0NvbnRleHQgfHwgKHdpbmRvdyBhcyBhbnkpLndlYmtpdEF1ZGlvQ29udGV4dDtcblxuICAgICAgICBsZXQgYXVkaW9Db250ZXh0ID0gbmV3IEF1ZGlvQ29udGV4dCgpO1xuXG4gICAgICAgIHRoaXMuX2JpbmRDb250ZXh0U3RhdGVMaXN0ZW5lcihhdWRpb0NvbnRleHQpO1xuXG4gICAgICAgIHJldHVybiBhdWRpb0NvbnRleHQ7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX2JpbmRDb250ZXh0U3RhdGVMaXN0ZW5lcihhdWRpb0NvbnRleHQ6IElBdWRpb0NvbnRleHQpIHtcblxuICAgICAgICBhdWRpb0NvbnRleHQub25zdGF0ZWNoYW5nZSA9ICgpID0+IHtcblxuICAgICAgICAgICAgdGhpcy5fY29udGV4dFN0YXRlID0gYXVkaW9Db250ZXh0LnN0YXRlO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5fY29udGV4dFN0YXRlID09PSAnY2xvc2VkJykge1xuICAgICAgICAgICAgICAgIHRoaXMuX2F1ZGlvQ29udGV4dCA9IG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBnZXRBdWRpb0NvbnRleHQoKTogUHJvbWlzZTxJQXVkaW9Db250ZXh0PiB7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICAgICAgaWYgKHRoaXMuX2NvbnRleHRTdGF0ZSA9PT0gJ2Nsb3NlZCcpIHtcblxuICAgICAgICAgICAgICAgIGxldCBhdWRpb0NvbnRleHQgPSB0aGlzLl9jcmVhdGVBdWRpb0NvbnRleHQoKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuX2F1ZGlvQ29udGV4dCA9IGF1ZGlvQ29udGV4dDtcblxuICAgICAgICAgICAgICAgIHJlc29sdmUoYXVkaW9Db250ZXh0KTtcblxuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9jb250ZXh0U3RhdGUgPT09ICdzdXNwZW5kZWQnKSB7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl91bmZyZWV6ZUF1ZGlvQ29udGV4dCgpLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodGhpcy5fYXVkaW9Db250ZXh0KTtcblxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh0aGlzLl9hdWRpb0NvbnRleHQpO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0QXVkaW9Db250ZXh0KGF1ZGlvQ29udGV4dDogSUF1ZGlvQ29udGV4dCk6IHZvaWQge1xuXG4gICAgICAgIHRoaXMuX2F1ZGlvQ29udGV4dCA9IGF1ZGlvQ29udGV4dDtcblxuICAgICAgICB0aGlzLl9iaW5kQ29udGV4dFN0YXRlTGlzdGVuZXIoYXVkaW9Db250ZXh0KTtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfZGVzdHJveUF1ZGlvQ29udGV4dCgpIHtcblxuICAgICAgICB0aGlzLl9kZXN0cm95QXVkaW9HcmFwaCgpO1xuXG4gICAgICAgIHRoaXMuX2F1ZGlvQ29udGV4dC5jbG9zZSgpLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgICAgICB0aGlzLl9hdWRpb0NvbnRleHQgPSBudWxsO1xuXG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF91bmZyZWV6ZUF1ZGlvQ29udGV4dCgpOiBQcm9taXNlPHZvaWQ+IHtcblxuICAgICAgICAvLyBkaWQgcmVzdW1lIGdldCBpbXBsZW1lbnRlZFxuICAgICAgICBpZiAodHlwZW9mIHRoaXMuX2F1ZGlvQ29udGV4dC5zdXNwZW5kID09PSAndW5kZWZpbmVkJykge1xuXG4gICAgICAgICAgICAvLyB0aGlzIGJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCByZXN1bWVcbiAgICAgICAgICAgIC8vIGp1c3Qgc2VuZCBiYWNrIGEgcHJvbWlzZSBhcyByZXN1bWUgd291bGQgZG9cbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAvLyByZXN1bWUgdGhlIGF1ZGlvIGhhcmR3YXJlIGFjY2Vzc1xuICAgICAgICAgICAgLy8gYXVkaW8gY29udGV4dCByZXN1bWUgcmV0dXJucyBhIHByb21pc2VcbiAgICAgICAgICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9BdWRpb0NvbnRleHQvcmVzdW1lXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fYXVkaW9Db250ZXh0LnJlc3VtZSgpO1xuXG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfZnJlZXplQXVkaW9Db250ZXh0KCk6IFByb21pc2U8dm9pZD4ge1xuXG4gICAgICAgIC8vIGRpZCBzdXNwZW5kIGdldCBpbXBsZW1lbnRlZFxuICAgICAgICBpZiAodHlwZW9mIHRoaXMuX2F1ZGlvQ29udGV4dC5zdXNwZW5kID09PSAndW5kZWZpbmVkJykge1xuXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgLy8gaGFsdCB0aGUgYXVkaW8gaGFyZHdhcmUgYWNjZXNzIHRlbXBvcmFyaWx5IHRvIHJlZHVjZSBDUFUgYW5kIGJhdHRlcnkgdXNhZ2VcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9hdWRpb0NvbnRleHQuc3VzcGVuZCgpO1xuXG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHB1YmxpYyBzZXRBdWRpb0dyYXBoKGF1ZGlvR3JhcGg6IElBdWRpb0dyYXBoKSB7XG5cbiAgICAgICAgaWYgKHRoaXMuX2F1ZGlvR3JhcGggIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuX2Rlc3Ryb3lBdWRpb0dyYXBoKCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9hdWRpb0dyYXBoID0gYXVkaW9HcmFwaDtcblxuICAgIH1cblxuICAgIHB1YmxpYyBnZXRBdWRpb0dyYXBoKCk6IFByb21pc2U8SUF1ZGlvR3JhcGg+IHtcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgICAgICBpZiAodGhpcy5fYXVkaW9HcmFwaCAhPT0gbnVsbCkge1xuXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh0aGlzLl9hdWRpb0dyYXBoKTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgIHRoaXMuX2NyZWF0ZUF1ZGlvR3JhcGgoKVxuICAgICAgICAgICAgICAgICAgICAudGhlbigoYXVkaW9HcmFwaDogSUF1ZGlvR3JhcGgpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fYXVkaW9HcmFwaCA9IGF1ZGlvR3JhcGg7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoYXVkaW9HcmFwaCk7XG5cbiAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2gocmVqZWN0KTtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG4gICAgcHVibGljIGNyZWF0ZVNvdXJjZU5vZGUoc291cmNlTm9kZU9wdGlvbnM6IElTb3VyY2VOb2RlT3B0aW9ucyk6IFByb21pc2U8QXVkaW9CdWZmZXJTb3VyY2VOb2RlPiB7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0QXVkaW9Db250ZXh0KCkudGhlbigoYXVkaW9Db250ZXh0OiBJQXVkaW9Db250ZXh0KSA9PiB7XG5cbiAgICAgICAgICAgIGxldCBzb3VyY2VOb2RlID0gYXVkaW9Db250ZXh0LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpO1xuXG4gICAgICAgICAgICAvLyBkbyB3ZSBsb29wIHRoaXMgc29uZ1xuICAgICAgICAgICAgc291cmNlTm9kZS5sb29wID0gc291cmNlTm9kZU9wdGlvbnMubG9vcDtcblxuICAgICAgICAgICAgLy8gaWYgdGhlIHNvbmcgZW5kcyBkZXN0cm95IGl0J3MgYXVkaW9HcmFwaCBhcyB0aGUgc291cmNlIGNhbid0IGJlIHJldXNlZCBhbnl3YXlcbiAgICAgICAgICAgIC8vIE5PVEU6IHRoZSBvbmVuZGVkIGhhbmRsZXIgd29uJ3QgaGF2ZSBhbnkgZWZmZWN0IGlmIHRoZSBsb29wIHByb3BlcnR5IGlzIHNldCB0b1xuICAgICAgICAgICAgLy8gdHJ1ZSwgYXMgdGhlIGF1ZGlvIHdvbid0IHN0b3AgcGxheWluZy4gVG8gc2VlIHRoZSBlZmZlY3QgaW4gdGhpcyBjYXNlIHlvdSdkXG4gICAgICAgICAgICAvLyBoYXZlIHRvIHVzZSBBdWRpb0J1ZmZlclNvdXJjZU5vZGUuc3RvcCgpXG4gICAgICAgICAgICBzb3VyY2VOb2RlLm9uZW5kZWQgPSAoKSA9PiB7XG5cbiAgICAgICAgICAgICAgICBzb3VyY2VOb2RlT3B0aW9ucy5vbkVuZGVkKCk7XG5cbiAgICAgICAgICAgICAgICBzb3VyY2VOb2RlLmRpc2Nvbm5lY3QoKTtcblxuICAgICAgICAgICAgICAgIHNvdXJjZU5vZGUgPSBudWxsO1xuXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICByZXR1cm4gc291cmNlTm9kZTtcblxuICAgICAgICB9KTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBjb25uZWN0U291cmNlTm9kZVRvR3JhcGhOb2Rlcyhzb3VyY2VOb2RlOiBBdWRpb0J1ZmZlclNvdXJjZU5vZGUpIHtcblxuICAgICAgICBzb3VyY2VOb2RlLmNvbm5lY3QodGhpcy5fYXVkaW9HcmFwaC5nYWluTm9kZSk7XG5cbiAgICAgICAgaWYgKHRoaXMuX2F1ZGlvR3JhcGguYW5hbHlzZXJOb2RlICE9PSBudWxsKSB7XG4gICAgICAgICAgICBzb3VyY2VOb2RlLmNvbm5lY3QodGhpcy5fYXVkaW9HcmFwaC5hbmFseXNlck5vZGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuX2F1ZGlvR3JhcGguZGVsYXlOb2RlICE9PSBudWxsKSB7XG4gICAgICAgICAgICBzb3VyY2VOb2RlLmNvbm5lY3QodGhpcy5fYXVkaW9HcmFwaC5kZWxheU5vZGUpO1xuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX2NyZWF0ZUF1ZGlvR3JhcGgoKTogUHJvbWlzZTxJQXVkaW9HcmFwaD4ge1xuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgICAgIHRoaXMuZ2V0QXVkaW9Db250ZXh0KCkudGhlbigoYXVkaW9Db250ZXh0OiBJQXVkaW9Db250ZXh0KSA9PiB7XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fYXVkaW9HcmFwaCA9PT0gbnVsbCkge1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2F1ZGlvR3JhcGggPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBnYWluTm9kZTogYXVkaW9Db250ZXh0LmNyZWF0ZUdhaW4oKVxuICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gY29ubmVjdCB0aGUgZ2FpbiBub2RlIHRvIHRoZSBkZXN0aW5hdGlvbiAoc3BlYWtlcnMpXG4gICAgICAgICAgICAgICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0F1ZGlvRGVzdGluYXRpb25Ob2RlXG4gICAgICAgICAgICAgICAgdGhpcy5fYXVkaW9HcmFwaC5nYWluTm9kZS5jb25uZWN0KGF1ZGlvQ29udGV4dC5kZXN0aW5hdGlvbik7XG5cbiAgICAgICAgICAgICAgICAvLyB1cGRhdGUgdm9sdW1lXG4gICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VHYWluVmFsdWUodGhpcy5fdm9sdW1lKTtcblxuICAgICAgICAgICAgICAgIHJlc29sdmUodGhpcy5fYXVkaW9HcmFwaCk7XG5cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9kZXN0cm95QXVkaW9HcmFwaCgpOiB2b2lkIHtcblxuICAgICAgICB0aGlzLl9hdWRpb0dyYXBoLmdhaW5Ob2RlLmRpc2Nvbm5lY3QoKTtcblxuICAgICAgICB0aGlzLl9hdWRpb0dyYXBoID0gbnVsbDtcblxuICAgIH1cblxuICAgIHB1YmxpYyBkZXN0cm95U291cmNlTm9kZShzb3VyY2VOb2RlOiBBdWRpb0J1ZmZlclNvdXJjZU5vZGUpIHtcblxuICAgICAgICBzb3VyY2VOb2RlLmRpc2Nvbm5lY3QoKTtcblxuICAgICAgICBzb3VyY2VOb2RlID0gbnVsbDtcblxuICAgICAgICByZXR1cm4gc291cmNlTm9kZTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBjaGFuZ2VHYWluVmFsdWUodm9sdW1lOiBudW1iZXIpIHtcblxuICAgICAgICB0aGlzLmdldEF1ZGlvR3JhcGgoKS50aGVuKChhdWRpb0dyYXBoOiBJQXVkaW9HcmFwaCkgPT4ge1xuXG4gICAgICAgICAgICBhdWRpb0dyYXBoLmdhaW5Ob2RlLmdhaW4udmFsdWUgPSB2b2x1bWUgLyAxMDA7XG5cbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbn1cbiJdfQ==

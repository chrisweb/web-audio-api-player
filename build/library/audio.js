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
                this.setAudioContext(options.customAudioContext);
            }
            if (options.customAudioGraph !== undefined) {
                this.setAudioGraph(options.customAudioGraph);
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
            var _this = this;
            if (this._audioGraph !== null) {
                this._destroyAudioGraph();
            }
            // check if there is gain node
            if (!('gainNode' in audioGraph)
                || audioGraph.gainNode === null
                || audioGraph.gainNode === undefined) {
                this.getAudioContext().then(function (audioContext) {
                    audioGraph.gainNode = audioContext.createGain();
                    _this._audioGraph = audioGraph;
                });
            }
            else {
                this._audioGraph = audioGraph;
            }
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
            if ('analyserNode' in this._audioGraph
                && this._audioGraph.analyserNode !== null
                && this._audioGraph.analyserNode !== undefined) {
                sourceNode.connect(this._audioGraph.analyserNode);
            }
            if ('delayNode' in this._audioGraph
                && this._audioGraph.delayNode !== null
                && this._audioGraph.delayNode !== undefined) {
                sourceNode.connect(this._audioGraph.delayNode);
            }
            // TODO: handle other types of nodes as well
            // do it recursivly!?
        };
        PlayerAudio.prototype._createAudioGraph = function () {
            var _this = this;
            return new Promise(function (resolve, reject) {
                _this.getAudioContext().then(function (audioContext) {
                    if (!_this._audioGraph) {
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9saWJyYXJ5L2F1ZGlvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztJQUNBLFlBQVksQ0FBQzs7SUFxR2I7UUFPSSxxQkFBWSxPQUF1QjtZQUp6QixrQkFBYSxHQUF5QixJQUFJLENBQUM7WUFFM0MsZ0JBQVcsR0FBdUIsSUFBSSxDQUFDO1lBSTdDLDBDQUEwQztZQUMxQyxJQUFJLENBQUMsYUFBYSxHQUFHLFFBQVEsQ0FBQztZQUU5QixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFFOUIsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLGtCQUFrQixLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBQzNDLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDckQsQ0FBQztZQUVELEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDO2dCQUN6QyxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ2pELENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDSixJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUM3QixDQUFDO1lBRUQsc0ZBQXNGO1lBQ3RGLCtEQUErRDtRQUVuRSxDQUFDO1FBRU0saUNBQVcsR0FBbEIsVUFBbUIsV0FBd0I7WUFFdkMsTUFBTSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBQyxZQUEyQjtnQkFFM0QsZ0JBQWdCO2dCQUNoQixnRUFBZ0U7Z0JBQ2hFLDhEQUE4RDtnQkFDOUQsZ0ZBQWdGO2dCQUVoRixJQUFJLGtCQUFrQixHQUFHLFlBQVksQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLENBQUM7Z0JBRW5FLHdEQUF3RDtnQkFDeEQsb0RBQW9EO2dCQUNwRCxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FB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SUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLENBQUM7WUFFdkMsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7UUFFNUIsQ0FBQztRQUVNLHVDQUFpQixHQUF4QixVQUF5QixVQUFpQztZQUV0RCxVQUFVLENBQUMsVUFBVSxFQUFFLENBQUM7WUFFeEIsVUFBVSxHQUFHLElBQUksQ0FBQztZQUVsQixNQUFNLENBQUMsVUFBVSxDQUFDO1FBRXRCLENBQUM7UUFFTSxxQ0FBZSxHQUF0QixVQUF1QixNQUFjO1lBRWpDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBQyxVQUF1QjtnQkFFOUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sR0FBRyxHQUFHLENBQUM7WUFFbEQsQ0FBQyxDQUFDLENBQUM7UUFFUCxDQUFDO1FBRUwsa0JBQUM7SUFBRCxDQW5VQSxBQW1VQyxJQUFBO0lBblVZLGtDQUFXIiwiZmlsZSI6ImxpYnJhcnkvYXVkaW8uanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgUGxheWVyRXJyb3IsIElQbGF5ZXJFcnJvciB9IGZyb20gJy4vZXJyb3InO1xuXG4vLyBOb3RlIHRvIHNlbGY6IEF1ZGlvR3JhcGggZG9jdW1lbnRhdGlvblxuLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0F1ZGlvTm9kZVxuXG5leHBvcnQgaW50ZXJmYWNlIElXYXZlVGFibGUge1xufVxuXG4vLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvQXVkaW9Db250ZXh0XG5leHBvcnQgaW50ZXJmYWNlIElBdWRpb0NvbnRleHQge1xuXG4gICAgZGVzdGluYXRpb246IEF1ZGlvRGVzdGluYXRpb25Ob2RlOyAvLyByZWFkb25seVxuICAgIHNhbXBsZVJhdGU6IG51bWJlcjsgLy8gcmVhZG9ubHlcbiAgICBjdXJyZW50VGltZTogbnVtYmVyOyAvLyByZWFkb25seVxuICAgIGxpc3RlbmVyOiBBdWRpb0xpc3RlbmVyOyAvLyByZWFkb25seVxuICAgIGFjdGl2ZVNvdXJjZUNvdW50OiBudW1iZXI7IC8vIHJlYWRvbmx5XG5cbiAgICBzdGF0ZTogc3RyaW5nOyAvLyByZWFkb25seVxuXG4gICAgY3JlYXRlQnVmZmVyKG51bWJlck9mQ2hhbm5lbHM6IG51bWJlciwgbGVuZ3RoOiBudW1iZXIsIHNhbXBsZVJhdGU6IG51bWJlcik6IEF1ZGlvQnVmZmVyO1xuICAgIGNyZWF0ZUJ1ZmZlcihidWZmZXI6IEFycmF5QnVmZmVyLCBtaXhUb01vbm86IGJvb2xlYW4pOiBBdWRpb0J1ZmZlcjtcbiAgICAvLyBvbGQgZGVjb2RlQXVkaW9EYXRhXG4gICAgLy9kZWNvZGVBdWRpb0RhdGEoYXVkaW9EYXRhOiBBcnJheUJ1ZmZlciwgZGVjb2RlU3VjY2Vzc0NhbGxiYWNrPzogRnVuY3Rpb24sIGRlY29kZUVycm9yQ2FsbGJhY2s/OiBGdW5jdGlvbik6IHZvaWQ7XG4gICAgLy8gbmV3ZXIgZGVjb2RlQXVkaW9EYXRhXG4gICAgZGVjb2RlQXVkaW9EYXRhKGF1ZGlvRGF0YTogQXJyYXlCdWZmZXIpOiBQcm9taXNlPEF1ZGlvQnVmZmVyPjtcbiAgICBjcmVhdGVCdWZmZXJTb3VyY2UoKTogQXVkaW9CdWZmZXJTb3VyY2VOb2RlO1xuICAgIGNyZWF0ZU1lZGlhRWxlbWVudFNvdXJjZShtZWRpYUVsZW1lbnQ6IEhUTUxNZWRpYUVsZW1lbnQpOiBNZWRpYUVsZW1lbnRBdWRpb1NvdXJjZU5vZGU7XG4gICAgY3JlYXRlTWVkaWFTdHJlYW1Tb3VyY2UobWVkaWFTdHJlYW1NZWRpYVN0cmVhbTogTWVkaWFTdHJlYW0pOiBNZWRpYVN0cmVhbUF1ZGlvU291cmNlTm9kZTtcbiAgICBjcmVhdGVNZWRpYVN0cmVhbURlc3RpbmF0aW9uKCk6IE1lZGlhU3RyZWFtQXVkaW9EZXN0aW5hdGlvbk5vZGU7XG4gICAgY3JlYXRlU2NyaXB0UHJvY2Vzc29yKGJ1ZmZlclNpemU6IG51bWJlciwgbnVtYmVyT2ZJbnB1dENoYW5uZWxzPzogbnVtYmVyLCBudW1iZXJPZk91dHB1dENoYW5uZWxzPzogbnVtYmVyKTogU2NyaXB0UHJvY2Vzc29yTm9kZTtcbiAgICBjcmVhdGVBbmFseXNlcigpOiBBbmFseXNlck5vZGU7XG4gICAgY3JlYXRlR2FpbigpOiBHYWluTm9kZTtcbiAgICBjcmVhdGVEZWxheShtYXhEZWxheVRpbWU/OiBudW1iZXIpOiBEZWxheU5vZGU7XG4gICAgY3JlYXRlQmlxdWFkRmlsdGVyKCk6IEJpcXVhZEZpbHRlck5vZGU7XG4gICAgY3JlYXRlV2F2ZVNoYXBlcigpOiBXYXZlU2hhcGVyTm9kZTtcbiAgICBjcmVhdGVQYW5uZXIoKTogUGFubmVyTm9kZTtcbiAgICBjcmVhdGVDb252b2x2ZXIoKTogQ29udm9sdmVyTm9kZTtcbiAgICBjcmVhdGVDaGFubmVsU3BsaXR0ZXIobnVtYmVyT2ZPdXRwdXRzPzogbnVtYmVyKTogQ2hhbm5lbFNwbGl0dGVyTm9kZTtcbiAgICBjcmVhdGVDaGFubmVsTWVyZ2VyKG51bWJlck9mSW5wdXRzPzogbnVtYmVyKTogQ2hhbm5lbE1lcmdlck5vZGU7XG4gICAgY3JlYXRlRHluYW1pY3NDb21wcmVzc29yKCk6IER5bmFtaWNzQ29tcHJlc3Nvck5vZGU7XG4gICAgY3JlYXRlT3NjaWxsYXRvcigpOiBPc2NpbGxhdG9yTm9kZTtcbiAgICBjcmVhdGVXYXZlVGFibGUocmVhbDogRmxvYXQzMkFycmF5LCBpbWFnOiBGbG9hdDMyQXJyYXkpOiBJV2F2ZVRhYmxlO1xuXG4gICAgb25zdGF0ZWNoYW5nZSgpOiB2b2lkO1xuICAgIGNsb3NlKCk6IFByb21pc2U8dm9pZD47XG4gICAgc3VzcGVuZCgpOiBQcm9taXNlPHZvaWQ+O1xuICAgIHJlc3VtZSgpOiBQcm9taXNlPHZvaWQ+O1xufVxuXG5kZWNsYXJlIHZhciB3ZWJraXRBdWRpb0NvbnRleHQ6IHtcbiAgICBwcm90b3R5cGU6IElBdWRpb0NvbnRleHQ7XG4gICAgbmV3ICgpOiBJQXVkaW9Db250ZXh0O1xufTtcblxuZGVjbGFyZSB2YXIgQXVkaW9Db250ZXh0OiB7XG4gICAgcHJvdG90eXBlOiBJQXVkaW9Db250ZXh0O1xuICAgIG5ldyAoKTogSUF1ZGlvQ29udGV4dDtcbn07XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUF1ZGlvR3JhcGgge1xuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9HYWluTm9kZVxuICAgIGdhaW5Ob2RlOiBHYWluTm9kZTtcbiAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvUGFubmVyTm9kZVxuICAgIHBhbm5lck5vZGU/OiBQYW5uZXJOb2RlO1xuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9TdGVyZW9QYW5uZXJOb2RlXG4gICAgc3RlcmVvUGFubmVyTm9kZT86IFN0ZXJlb1Bhbm5lck5vZGU7XG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0RlbGF5Tm9kZVxuICAgIGRlbGF5Tm9kZT86IERlbGF5Tm9kZTtcbiAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvU2NyaXB0UHJvY2Vzc29yTm9kZVxuICAgIHNjcmlwdFByb2Nlc3Nvck5vZGU/OiBTY3JpcHRQcm9jZXNzb3JOb2RlO1xuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9BbmFseXNlck5vZGVcbiAgICBhbmFseXNlck5vZGU/OiBBbmFseXNlck5vZGU7XG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0JpcXVhZEZpbHRlck5vZGVcbiAgICBiaXF1YWRGaWx0ZXJOb2RlPzogQmlxdWFkRmlsdGVyTm9kZTtcbiAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvQ2hhbm5lbE1lcmdlck5vZGVcbiAgICBjaGFubmVsTWVyZ2VOb2RlPzogQ2hhbm5lbE1lcmdlck5vZGU7XG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0NoYW5uZWxTcGxpdHRlck5vZGVcbiAgICBjaGFubmVsU3BsaXR0ZXJOb2RlPzogQ2hhbm5lbFNwbGl0dGVyTm9kZTtcbiAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvQ29udm9sdmVyTm9kZVxuICAgIGNvbnZvbHZlck5vZGU/OiBDb252b2x2ZXJOb2RlO1xuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9EeW5hbWljc0NvbXByZXNzb3JOb2RlXG4gICAgZHluYW1pY0NvbXByZXNzb3JOb2RlPzogRHluYW1pY3NDb21wcmVzc29yTm9kZTtcbiAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvT3NjaWxsYXRvck5vZGVcbiAgICBvc2NpbGxhdG9yTm9kZT86IE9zY2lsbGF0b3JOb2RlO1xuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9XYXZlU2hhcGVyTm9kZVxuICAgIHdhdmVTaGFwZXJOb2RlPzogV2F2ZVNoYXBlck5vZGU7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUF1ZGlvT3B0aW9ucyB7XG4gICAgdm9sdW1lOiBudW1iZXI7XG4gICAgY3VzdG9tQXVkaW9Db250ZXh0PzogSUF1ZGlvQ29udGV4dDtcbiAgICBjdXN0b21BdWRpb0dyYXBoPzogSUF1ZGlvR3JhcGg7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVNvdXJjZU5vZGVPcHRpb25zIHtcbiAgICBsb29wOiBib29sZWFuO1xuICAgIG9uRW5kZWQ6IEZ1bmN0aW9uO1xufVxuXG5leHBvcnQgY2xhc3MgUGxheWVyQXVkaW8ge1xuXG4gICAgcHJvdGVjdGVkIF92b2x1bWU6IG51bWJlcjtcbiAgICBwcm90ZWN0ZWQgX2F1ZGlvQ29udGV4dDogSUF1ZGlvQ29udGV4dCB8IG51bGwgPSBudWxsO1xuICAgIHByb3RlY3RlZCBfY29udGV4dFN0YXRlOiBzdHJpbmc7XG4gICAgcHJvdGVjdGVkIF9hdWRpb0dyYXBoOiBJQXVkaW9HcmFwaCB8IG51bGwgPSBudWxsO1xuXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucz86IElBdWRpb09wdGlvbnMpIHtcblxuICAgICAgICAvLyBpbml0aWFsIGNvbnRleHQgc3RhdGUgaXMgc3RpbGwgXCJjbG9zZWRcIlxuICAgICAgICB0aGlzLl9jb250ZXh0U3RhdGUgPSAnY2xvc2VkJztcblxuICAgICAgICB0aGlzLl92b2x1bWUgPSBvcHRpb25zLnZvbHVtZTtcblxuICAgICAgICBpZiAob3B0aW9ucy5jdXN0b21BdWRpb0NvbnRleHQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5zZXRBdWRpb0NvbnRleHQob3B0aW9ucy5jdXN0b21BdWRpb0NvbnRleHQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG9wdGlvbnMuY3VzdG9tQXVkaW9HcmFwaCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLnNldEF1ZGlvR3JhcGgob3B0aW9ucy5jdXN0b21BdWRpb0dyYXBoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2NyZWF0ZUF1ZGlvR3JhcGgoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRPRE86IHRvIHNwZWVkIHVwIHRoaW5ncyB3b3VsZCBpdCBiZSBiZXR0ZXIgdG8gY3JlYXRlIGEgY29udGV4dCBpbiB0aGUgY29uc3RydWN0b3I/XG4gICAgICAgIC8vIGFuZCBzdXNwZW5kIHRoZSBjb250ZXh0IHVwb24gY3JlYXRpbmcgaXQgdW50aWwgaXQgZ2V0cyB1c2VkP1xuXG4gICAgfVxuXG4gICAgcHVibGljIGRlY29kZUF1ZGlvKGFycmF5QnVmZmVyOiBBcnJheUJ1ZmZlcik6IFByb21pc2U8QXVkaW9CdWZmZXI+IHtcblxuICAgICAgICByZXR1cm4gdGhpcy5nZXRBdWRpb0NvbnRleHQoKS50aGVuKChhdWRpb0NvbnRleHQ6IElBdWRpb0NvbnRleHQpID0+IHtcblxuICAgICAgICAgICAgLy8gTm90ZSB0byBzZWxmOlxuICAgICAgICAgICAgLy8gbmV3ZXIgZGVjb2RlQXVkaW9EYXRhIHJldHVybnMgcHJvbWlzZSwgb2xkZXIgYWNjZXB0IGFzIHNlY29uZFxuICAgICAgICAgICAgLy8gYW5kIHRoaXJkIHBhcmFtZXRlciBhIHN1Y2Nlc3MgYW5kIGFuIGVycm9yIGNhbGxiYWNrIGZ1bnRpb25cbiAgICAgICAgICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9BdWRpb0NvbnRleHQvZGVjb2RlQXVkaW9EYXRhXG5cbiAgICAgICAgICAgIGxldCBhdWRpb0J1ZmZlclByb21pc2UgPSBhdWRpb0NvbnRleHQuZGVjb2RlQXVkaW9EYXRhKGFycmF5QnVmZmVyKTtcblxuICAgICAgICAgICAgLy8gZGVjb2RlQXVkaW9EYXRhIHJldHVybnMgYSBwcm9taXNlIG9mIHR5cGUgUHJvbWlzZUxpa2VcbiAgICAgICAgICAgIC8vIHVzaW5nIHJlc29sdmUgdG8gcmV0dXJuIGEgcHJvbWlzZSBvZiB0eXBlIFByb21pc2VcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYXVkaW9CdWZmZXJQcm9taXNlKTtcblxuICAgICAgICB9KTtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfY3JlYXRlQXVkaW9Db250ZXh0KCk6IElBdWRpb0NvbnRleHQge1xuXG4gICAgICAgIGxldCBBdWRpb0NvbnRleHQgPSB3aW5kb3cuQXVkaW9Db250ZXh0IHx8ICh3aW5kb3cgYXMgYW55KS53ZWJraXRBdWRpb0NvbnRleHQ7XG5cbiAgICAgICAgbGV0IGF1ZGlvQ29udGV4dCA9IG5ldyBBdWRpb0NvbnRleHQoKTtcblxuICAgICAgICB0aGlzLl9iaW5kQ29udGV4dFN0YXRlTGlzdGVuZXIoYXVkaW9Db250ZXh0KTtcblxuICAgICAgICByZXR1cm4gYXVkaW9Db250ZXh0O1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9iaW5kQ29udGV4dFN0YXRlTGlzdGVuZXIoYXVkaW9Db250ZXh0OiBJQXVkaW9Db250ZXh0KSB7XG5cbiAgICAgICAgYXVkaW9Db250ZXh0Lm9uc3RhdGVjaGFuZ2UgPSAoKSA9PiB7XG5cbiAgICAgICAgICAgIHRoaXMuX2NvbnRleHRTdGF0ZSA9IGF1ZGlvQ29udGV4dC5zdGF0ZTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuX2NvbnRleHRTdGF0ZSA9PT0gJ2Nsb3NlZCcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9hdWRpb0NvbnRleHQgPSBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH07XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0QXVkaW9Db250ZXh0KCk6IFByb21pc2U8SUF1ZGlvQ29udGV4dD4ge1xuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLl9jb250ZXh0U3RhdGUgPT09ICdjbG9zZWQnKSB7XG5cbiAgICAgICAgICAgICAgICBsZXQgYXVkaW9Db250ZXh0ID0gdGhpcy5fY3JlYXRlQXVkaW9Db250ZXh0KCk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9hdWRpb0NvbnRleHQgPSBhdWRpb0NvbnRleHQ7XG5cbiAgICAgICAgICAgICAgICByZXNvbHZlKGF1ZGlvQ29udGV4dCk7XG5cbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5fY29udGV4dFN0YXRlID09PSAnc3VzcGVuZGVkJykge1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fdW5mcmVlemVBdWRpb0NvbnRleHQoKS50aGVuKCgpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHRoaXMuX2F1ZGlvQ29udGV4dCk7XG5cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgIHJlc29sdmUodGhpcy5fYXVkaW9Db250ZXh0KTtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG4gICAgcHVibGljIHNldEF1ZGlvQ29udGV4dChhdWRpb0NvbnRleHQ6IElBdWRpb0NvbnRleHQpOiB2b2lkIHtcblxuICAgICAgICB0aGlzLl9hdWRpb0NvbnRleHQgPSBhdWRpb0NvbnRleHQ7XG5cbiAgICAgICAgdGhpcy5fYmluZENvbnRleHRTdGF0ZUxpc3RlbmVyKGF1ZGlvQ29udGV4dCk7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX2Rlc3Ryb3lBdWRpb0NvbnRleHQoKSB7XG5cbiAgICAgICAgdGhpcy5fZGVzdHJveUF1ZGlvR3JhcGgoKTtcblxuICAgICAgICB0aGlzLl9hdWRpb0NvbnRleHQuY2xvc2UoKS50aGVuKCgpID0+IHtcblxuICAgICAgICAgICAgdGhpcy5fYXVkaW9Db250ZXh0ID0gbnVsbDtcblxuICAgICAgICB9KTtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfdW5mcmVlemVBdWRpb0NvbnRleHQoKTogUHJvbWlzZTx2b2lkPiB7XG5cbiAgICAgICAgLy8gZGlkIHJlc3VtZSBnZXQgaW1wbGVtZW50ZWRcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLl9hdWRpb0NvbnRleHQuc3VzcGVuZCA9PT0gJ3VuZGVmaW5lZCcpIHtcblxuICAgICAgICAgICAgLy8gdGhpcyBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgcmVzdW1lXG4gICAgICAgICAgICAvLyBqdXN0IHNlbmQgYmFjayBhIHByb21pc2UgYXMgcmVzdW1lIHdvdWxkIGRvXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgLy8gcmVzdW1lIHRoZSBhdWRpbyBoYXJkd2FyZSBhY2Nlc3NcbiAgICAgICAgICAgIC8vIGF1ZGlvIGNvbnRleHQgcmVzdW1lIHJldHVybnMgYSBwcm9taXNlXG4gICAgICAgICAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvQXVkaW9Db250ZXh0L3Jlc3VtZVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2F1ZGlvQ29udGV4dC5yZXN1bWUoKTtcblxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX2ZyZWV6ZUF1ZGlvQ29udGV4dCgpOiBQcm9taXNlPHZvaWQ+IHtcblxuICAgICAgICAvLyBkaWQgc3VzcGVuZCBnZXQgaW1wbGVtZW50ZWRcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLl9hdWRpb0NvbnRleHQuc3VzcGVuZCA9PT0gJ3VuZGVmaW5lZCcpIHtcblxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgIC8vIGhhbHQgdGhlIGF1ZGlvIGhhcmR3YXJlIGFjY2VzcyB0ZW1wb3JhcmlseSB0byByZWR1Y2UgQ1BVIGFuZCBiYXR0ZXJ5IHVzYWdlXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fYXVkaW9Db250ZXh0LnN1c3BlbmQoKTtcblxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0QXVkaW9HcmFwaChhdWRpb0dyYXBoOiBJQXVkaW9HcmFwaCkge1xuXG4gICAgICAgIGlmICh0aGlzLl9hdWRpb0dyYXBoICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLl9kZXN0cm95QXVkaW9HcmFwaCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gY2hlY2sgaWYgdGhlcmUgaXMgZ2FpbiBub2RlXG4gICAgICAgIGlmICghKCdnYWluTm9kZScgaW4gYXVkaW9HcmFwaClcbiAgICAgICAgICAgIHx8IGF1ZGlvR3JhcGguZ2Fpbk5vZGUgPT09IG51bGxcbiAgICAgICAgICAgIHx8IGF1ZGlvR3JhcGguZ2Fpbk5vZGUgPT09IHVuZGVmaW5lZCkge1xuXG4gICAgICAgICAgICB0aGlzLmdldEF1ZGlvQ29udGV4dCgpLnRoZW4oKGF1ZGlvQ29udGV4dDogSUF1ZGlvQ29udGV4dCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgYXVkaW9HcmFwaC5nYWluTm9kZSA9IGF1ZGlvQ29udGV4dC5jcmVhdGVHYWluKCk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9hdWRpb0dyYXBoID0gYXVkaW9HcmFwaDtcblxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgdGhpcy5fYXVkaW9HcmFwaCA9IGF1ZGlvR3JhcGg7XG5cbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgcHVibGljIGdldEF1ZGlvR3JhcGgoKTogUHJvbWlzZTxJQXVkaW9HcmFwaD4ge1xuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLl9hdWRpb0dyYXBoICE9PSBudWxsKSB7XG5cbiAgICAgICAgICAgICAgICByZXNvbHZlKHRoaXMuX2F1ZGlvR3JhcGgpO1xuXG4gICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fY3JlYXRlQXVkaW9HcmFwaCgpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKChhdWRpb0dyYXBoOiBJQXVkaW9HcmFwaCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9hdWRpb0dyYXBoID0gYXVkaW9HcmFwaDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShhdWRpb0dyYXBoKTtcblxuICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaChyZWplY3QpO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgY3JlYXRlU291cmNlTm9kZShzb3VyY2VOb2RlT3B0aW9uczogSVNvdXJjZU5vZGVPcHRpb25zKTogUHJvbWlzZTxBdWRpb0J1ZmZlclNvdXJjZU5vZGU+IHtcblxuICAgICAgICByZXR1cm4gdGhpcy5nZXRBdWRpb0NvbnRleHQoKS50aGVuKChhdWRpb0NvbnRleHQ6IElBdWRpb0NvbnRleHQpID0+IHtcblxuICAgICAgICAgICAgbGV0IHNvdXJjZU5vZGUgPSBhdWRpb0NvbnRleHQuY3JlYXRlQnVmZmVyU291cmNlKCk7XG5cbiAgICAgICAgICAgIC8vIGRvIHdlIGxvb3AgdGhpcyBzb25nXG4gICAgICAgICAgICBzb3VyY2VOb2RlLmxvb3AgPSBzb3VyY2VOb2RlT3B0aW9ucy5sb29wO1xuXG4gICAgICAgICAgICAvLyBpZiB0aGUgc29uZyBlbmRzIGRlc3Ryb3kgaXQncyBhdWRpb0dyYXBoIGFzIHRoZSBzb3VyY2UgY2FuJ3QgYmUgcmV1c2VkIGFueXdheVxuICAgICAgICAgICAgLy8gTk9URTogdGhlIG9uZW5kZWQgaGFuZGxlciB3b24ndCBoYXZlIGFueSBlZmZlY3QgaWYgdGhlIGxvb3AgcHJvcGVydHkgaXMgc2V0IHRvXG4gICAgICAgICAgICAvLyB0cnVlLCBhcyB0aGUgYXVkaW8gd29uJ3Qgc3RvcCBwbGF5aW5nLiBUbyBzZWUgdGhlIGVmZmVjdCBpbiB0aGlzIGNhc2UgeW91J2RcbiAgICAgICAgICAgIC8vIGhhdmUgdG8gdXNlIEF1ZGlvQnVmZmVyU291cmNlTm9kZS5zdG9wKClcbiAgICAgICAgICAgIHNvdXJjZU5vZGUub25lbmRlZCA9ICgpID0+IHtcblxuICAgICAgICAgICAgICAgIHNvdXJjZU5vZGVPcHRpb25zLm9uRW5kZWQoKTtcblxuICAgICAgICAgICAgICAgIHNvdXJjZU5vZGUuZGlzY29ubmVjdCgpO1xuXG4gICAgICAgICAgICAgICAgc291cmNlTm9kZSA9IG51bGw7XG5cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHJldHVybiBzb3VyY2VOb2RlO1xuXG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG4gICAgcHVibGljIGNvbm5lY3RTb3VyY2VOb2RlVG9HcmFwaE5vZGVzKHNvdXJjZU5vZGU6IEF1ZGlvQnVmZmVyU291cmNlTm9kZSkge1xuXG4gICAgICAgIHNvdXJjZU5vZGUuY29ubmVjdCh0aGlzLl9hdWRpb0dyYXBoLmdhaW5Ob2RlKTtcblxuICAgICAgICBpZiAoJ2FuYWx5c2VyTm9kZScgaW4gdGhpcy5fYXVkaW9HcmFwaFxuICAgICAgICAgICAgJiYgdGhpcy5fYXVkaW9HcmFwaC5hbmFseXNlck5vZGUgIT09IG51bGxcbiAgICAgICAgICAgICYmIHRoaXMuX2F1ZGlvR3JhcGguYW5hbHlzZXJOb2RlICE9PSB1bmRlZmluZWQpIHtcblxuICAgICAgICAgICAgc291cmNlTm9kZS5jb25uZWN0KHRoaXMuX2F1ZGlvR3JhcGguYW5hbHlzZXJOb2RlKTtcblxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCdkZWxheU5vZGUnIGluIHRoaXMuX2F1ZGlvR3JhcGhcbiAgICAgICAgICAgICYmIHRoaXMuX2F1ZGlvR3JhcGguZGVsYXlOb2RlICE9PSBudWxsXG4gICAgICAgICAgICAmJiB0aGlzLl9hdWRpb0dyYXBoLmRlbGF5Tm9kZSAhPT0gdW5kZWZpbmVkKSB7XG5cbiAgICAgICAgICAgIHNvdXJjZU5vZGUuY29ubmVjdCh0aGlzLl9hdWRpb0dyYXBoLmRlbGF5Tm9kZSk7XG5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRPRE86IGhhbmRsZSBvdGhlciB0eXBlcyBvZiBub2RlcyBhcyB3ZWxsXG4gICAgICAgIC8vIGRvIGl0IHJlY3Vyc2l2bHkhP1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9jcmVhdGVBdWRpb0dyYXBoKCk6IFByb21pc2U8SUF1ZGlvR3JhcGg+IHtcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgICAgICB0aGlzLmdldEF1ZGlvQ29udGV4dCgpLnRoZW4oKGF1ZGlvQ29udGV4dDogSUF1ZGlvQ29udGV4dCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9hdWRpb0dyYXBoKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYXVkaW9HcmFwaCA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdhaW5Ob2RlOiBhdWRpb0NvbnRleHQuY3JlYXRlR2FpbigpXG4gICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBjb25uZWN0IHRoZSBnYWluIG5vZGUgdG8gdGhlIGRlc3RpbmF0aW9uIChzcGVha2VycylcbiAgICAgICAgICAgICAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvQXVkaW9EZXN0aW5hdGlvbk5vZGVcbiAgICAgICAgICAgICAgICB0aGlzLl9hdWRpb0dyYXBoLmdhaW5Ob2RlLmNvbm5lY3QoYXVkaW9Db250ZXh0LmRlc3RpbmF0aW9uKTtcblxuICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSB2b2x1bWVcbiAgICAgICAgICAgICAgICB0aGlzLmNoYW5nZUdhaW5WYWx1ZSh0aGlzLl92b2x1bWUpO1xuXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh0aGlzLl9hdWRpb0dyYXBoKTtcblxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX2Rlc3Ryb3lBdWRpb0dyYXBoKCk6IHZvaWQge1xuXG4gICAgICAgIHRoaXMuX2F1ZGlvR3JhcGguZ2Fpbk5vZGUuZGlzY29ubmVjdCgpO1xuXG4gICAgICAgIHRoaXMuX2F1ZGlvR3JhcGggPSBudWxsO1xuXG4gICAgfVxuXG4gICAgcHVibGljIGRlc3Ryb3lTb3VyY2VOb2RlKHNvdXJjZU5vZGU6IEF1ZGlvQnVmZmVyU291cmNlTm9kZSkge1xuXG4gICAgICAgIHNvdXJjZU5vZGUuZGlzY29ubmVjdCgpO1xuXG4gICAgICAgIHNvdXJjZU5vZGUgPSBudWxsO1xuXG4gICAgICAgIHJldHVybiBzb3VyY2VOb2RlO1xuXG4gICAgfVxuXG4gICAgcHVibGljIGNoYW5nZUdhaW5WYWx1ZSh2b2x1bWU6IG51bWJlcikge1xuXG4gICAgICAgIHRoaXMuZ2V0QXVkaW9HcmFwaCgpLnRoZW4oKGF1ZGlvR3JhcGg6IElBdWRpb0dyYXBoKSA9PiB7XG5cbiAgICAgICAgICAgIGF1ZGlvR3JhcGguZ2Fpbk5vZGUuZ2Fpbi52YWx1ZSA9IHZvbHVtZSAvIDEwMDtcblxuICAgICAgICB9KTtcblxuICAgIH1cblxufVxuIl19

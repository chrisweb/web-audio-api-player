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
            var _this = this;
            this._audioContext = null;
            this._audioGraph = null;
            // initial context state is still "closed"
            this._contextState = 'closed';
            this._volume = options.volume;
            if ('customAudioContext' in options
                && options.customAudioContext !== null
                && options.customAudioContext !== undefined) {
                this.setAudioContext(options.customAudioContext);
            }
            else {
                this._audioContext = this._createAudioContext();
            }
            if ('customAudioGraph' in options
                && options.customAudioGraph !== null
                && options.customAudioGraph !== undefined) {
                this.setAudioGraph(options.customAudioGraph);
            }
            else {
                this._createAudioGraph()
                    .then(function (audioGraph) {
                    _this._audioGraph = audioGraph;
                });
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
            // initialize the audio context
            var audioContext = new AudioContext();
            // bind the listener for the context state changes
            this._bindContextStateListener(audioContext);
            // set the "initial" state to running
            this._contextState = 'running';
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
            var _this = this;
            if (this._audioContext !== null) {
                this._destroyAudioContext().then(function () {
                    _this._setAudioContext(audioContext);
                });
            }
            else {
                this._setAudioContext(audioContext);
            }
        };
        PlayerAudio.prototype._setAudioContext = function (audioContext) {
            this._audioContext = audioContext;
            this._bindContextStateListener(audioContext);
        };
        PlayerAudio.prototype._destroyAudioContext = function () {
            var _this = this;
            return this._audioContext.close().then(function () {
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
            // TODO: disconnect other nodes!?
            this._audioGraph = null;
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9saWJyYXJ5L2F1ZGlvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztJQUNBLFlBQVksQ0FBQzs7SUFxR2I7UUFPSSxxQkFBWSxPQUF1QjtZQUFuQyxpQkErQkM7WUFuQ1Msa0JBQWEsR0FBeUIsSUFBSSxDQUFDO1lBRTNDLGdCQUFXLEdBQXVCLElBQUksQ0FBQztZQUk3QywwQ0FBMEM7WUFDMUMsSUFBSSxDQUFDLGFBQWEsR0FBRyxRQUFRLENBQUM7WUFFOUIsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO1lBRTlCLEVBQUUsQ0FBQyxDQUFDLG9CQUFvQixJQUFJLE9BQU87bUJBQzVCLE9BQU8sQ0FBQyxrQkFBa0IsS0FBSyxJQUFJO21CQUNuQyxPQUFPLENBQUMsa0JBQWtCLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQztnQkFDOUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUNyRCxDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ0osSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztZQUNwRCxDQUFDO1lBRUQsRUFBRSxDQUFDLENBQUMsa0JBQWtCLElBQUksT0FBTzttQkFDMUIsT0FBTyxDQUFDLGdCQUFnQixLQUFLLElBQUk7bUJBQ2pDLE9BQU8sQ0FBQyxnQkFBZ0IsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDO2dCQUM1QyxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ2pELENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDSixJQUFJLENBQUMsaUJBQWlCLEVBQUU7cUJBQ25CLElBQUksQ0FBQyxVQUFDLFVBQXVCO29CQUUxQixLQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQztnQkFFbEMsQ0FBQyxDQUFDLENBQUM7WUFDWCxDQUFDO1lBRUQsc0ZBQXNG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QUF1QixNQUFjO1lBRWpDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBQyxVQUF1QjtnQkFFOUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sR0FBRyxHQUFHLENBQUM7WUFFbEQsQ0FBQyxDQUFDLENBQUM7UUFFUCxDQUFDO1FBRUwsa0JBQUM7SUFBRCxDQXRXQSxBQXNXQyxJQUFBO0lBdFdZLGtDQUFXIiwiZmlsZSI6ImxpYnJhcnkvYXVkaW8uanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgUGxheWVyRXJyb3IsIElQbGF5ZXJFcnJvciB9IGZyb20gJy4vZXJyb3InO1xuXG4vLyBOb3RlIHRvIHNlbGY6IEF1ZGlvR3JhcGggZG9jdW1lbnRhdGlvblxuLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0F1ZGlvTm9kZVxuXG5leHBvcnQgaW50ZXJmYWNlIElXYXZlVGFibGUge1xufVxuXG4vLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvQXVkaW9Db250ZXh0XG5leHBvcnQgaW50ZXJmYWNlIElBdWRpb0NvbnRleHQge1xuXG4gICAgZGVzdGluYXRpb246IEF1ZGlvRGVzdGluYXRpb25Ob2RlOyAvLyByZWFkb25seVxuICAgIHNhbXBsZVJhdGU6IG51bWJlcjsgLy8gcmVhZG9ubHlcbiAgICBjdXJyZW50VGltZTogbnVtYmVyOyAvLyByZWFkb25seVxuICAgIGxpc3RlbmVyOiBBdWRpb0xpc3RlbmVyOyAvLyByZWFkb25seVxuICAgIGFjdGl2ZVNvdXJjZUNvdW50OiBudW1iZXI7IC8vIHJlYWRvbmx5XG5cbiAgICBzdGF0ZTogc3RyaW5nOyAvLyByZWFkb25seVxuXG4gICAgY3JlYXRlQnVmZmVyKG51bWJlck9mQ2hhbm5lbHM6IG51bWJlciwgbGVuZ3RoOiBudW1iZXIsIHNhbXBsZVJhdGU6IG51bWJlcik6IEF1ZGlvQnVmZmVyO1xuICAgIGNyZWF0ZUJ1ZmZlcihidWZmZXI6IEFycmF5QnVmZmVyLCBtaXhUb01vbm86IGJvb2xlYW4pOiBBdWRpb0J1ZmZlcjtcbiAgICAvLyBvbGQgZGVjb2RlQXVkaW9EYXRhXG4gICAgLy9kZWNvZGVBdWRpb0RhdGEoYXVkaW9EYXRhOiBBcnJheUJ1ZmZlciwgZGVjb2RlU3VjY2Vzc0NhbGxiYWNrPzogRnVuY3Rpb24sIGRlY29kZUVycm9yQ2FsbGJhY2s/OiBGdW5jdGlvbik6IHZvaWQ7XG4gICAgLy8gbmV3ZXIgZGVjb2RlQXVkaW9EYXRhXG4gICAgZGVjb2RlQXVkaW9EYXRhKGF1ZGlvRGF0YTogQXJyYXlCdWZmZXIpOiBQcm9taXNlPEF1ZGlvQnVmZmVyPjtcbiAgICBjcmVhdGVCdWZmZXJTb3VyY2UoKTogQXVkaW9CdWZmZXJTb3VyY2VOb2RlO1xuICAgIGNyZWF0ZU1lZGlhRWxlbWVudFNvdXJjZShtZWRpYUVsZW1lbnQ6IEhUTUxNZWRpYUVsZW1lbnQpOiBNZWRpYUVsZW1lbnRBdWRpb1NvdXJjZU5vZGU7XG4gICAgY3JlYXRlTWVkaWFTdHJlYW1Tb3VyY2UobWVkaWFTdHJlYW1NZWRpYVN0cmVhbTogTWVkaWFTdHJlYW0pOiBNZWRpYVN0cmVhbUF1ZGlvU291cmNlTm9kZTtcbiAgICBjcmVhdGVNZWRpYVN0cmVhbURlc3RpbmF0aW9uKCk6IE1lZGlhU3RyZWFtQXVkaW9EZXN0aW5hdGlvbk5vZGU7XG4gICAgY3JlYXRlU2NyaXB0UHJvY2Vzc29yKGJ1ZmZlclNpemU6IG51bWJlciwgbnVtYmVyT2ZJbnB1dENoYW5uZWxzPzogbnVtYmVyLCBudW1iZXJPZk91dHB1dENoYW5uZWxzPzogbnVtYmVyKTogU2NyaXB0UHJvY2Vzc29yTm9kZTtcbiAgICBjcmVhdGVBbmFseXNlcigpOiBBbmFseXNlck5vZGU7XG4gICAgY3JlYXRlR2FpbigpOiBHYWluTm9kZTtcbiAgICBjcmVhdGVEZWxheShtYXhEZWxheVRpbWU/OiBudW1iZXIpOiBEZWxheU5vZGU7XG4gICAgY3JlYXRlQmlxdWFkRmlsdGVyKCk6IEJpcXVhZEZpbHRlck5vZGU7XG4gICAgY3JlYXRlV2F2ZVNoYXBlcigpOiBXYXZlU2hhcGVyTm9kZTtcbiAgICBjcmVhdGVQYW5uZXIoKTogUGFubmVyTm9kZTtcbiAgICBjcmVhdGVDb252b2x2ZXIoKTogQ29udm9sdmVyTm9kZTtcbiAgICBjcmVhdGVDaGFubmVsU3BsaXR0ZXIobnVtYmVyT2ZPdXRwdXRzPzogbnVtYmVyKTogQ2hhbm5lbFNwbGl0dGVyTm9kZTtcbiAgICBjcmVhdGVDaGFubmVsTWVyZ2VyKG51bWJlck9mSW5wdXRzPzogbnVtYmVyKTogQ2hhbm5lbE1lcmdlck5vZGU7XG4gICAgY3JlYXRlRHluYW1pY3NDb21wcmVzc29yKCk6IER5bmFtaWNzQ29tcHJlc3Nvck5vZGU7XG4gICAgY3JlYXRlT3NjaWxsYXRvcigpOiBPc2NpbGxhdG9yTm9kZTtcbiAgICBjcmVhdGVXYXZlVGFibGUocmVhbDogRmxvYXQzMkFycmF5LCBpbWFnOiBGbG9hdDMyQXJyYXkpOiBJV2F2ZVRhYmxlO1xuXG4gICAgb25zdGF0ZWNoYW5nZSgpOiB2b2lkO1xuICAgIGNsb3NlKCk6IFByb21pc2U8dm9pZD47XG4gICAgc3VzcGVuZCgpOiBQcm9taXNlPHZvaWQ+O1xuICAgIHJlc3VtZSgpOiBQcm9taXNlPHZvaWQ+O1xufVxuXG5kZWNsYXJlIHZhciB3ZWJraXRBdWRpb0NvbnRleHQ6IHtcbiAgICBwcm90b3R5cGU6IElBdWRpb0NvbnRleHQ7XG4gICAgbmV3ICgpOiBJQXVkaW9Db250ZXh0O1xufTtcblxuZGVjbGFyZSB2YXIgQXVkaW9Db250ZXh0OiB7XG4gICAgcHJvdG90eXBlOiBJQXVkaW9Db250ZXh0O1xuICAgIG5ldyAoKTogSUF1ZGlvQ29udGV4dDtcbn07XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUF1ZGlvR3JhcGgge1xuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9HYWluTm9kZVxuICAgIGdhaW5Ob2RlOiBHYWluTm9kZTtcbiAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvUGFubmVyTm9kZVxuICAgIHBhbm5lck5vZGU/OiBQYW5uZXJOb2RlO1xuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9TdGVyZW9QYW5uZXJOb2RlXG4gICAgc3RlcmVvUGFubmVyTm9kZT86IFN0ZXJlb1Bhbm5lck5vZGU7XG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0RlbGF5Tm9kZVxuICAgIGRlbGF5Tm9kZT86IERlbGF5Tm9kZTtcbiAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvU2NyaXB0UHJvY2Vzc29yTm9kZVxuICAgIHNjcmlwdFByb2Nlc3Nvck5vZGU/OiBTY3JpcHRQcm9jZXNzb3JOb2RlO1xuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9BbmFseXNlck5vZGVcbiAgICBhbmFseXNlck5vZGU/OiBBbmFseXNlck5vZGU7XG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0JpcXVhZEZpbHRlck5vZGVcbiAgICBiaXF1YWRGaWx0ZXJOb2RlPzogQmlxdWFkRmlsdGVyTm9kZTtcbiAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvQ2hhbm5lbE1lcmdlck5vZGVcbiAgICBjaGFubmVsTWVyZ2VOb2RlPzogQ2hhbm5lbE1lcmdlck5vZGU7XG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0NoYW5uZWxTcGxpdHRlck5vZGVcbiAgICBjaGFubmVsU3BsaXR0ZXJOb2RlPzogQ2hhbm5lbFNwbGl0dGVyTm9kZTtcbiAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvQ29udm9sdmVyTm9kZVxuICAgIGNvbnZvbHZlck5vZGU/OiBDb252b2x2ZXJOb2RlO1xuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9EeW5hbWljc0NvbXByZXNzb3JOb2RlXG4gICAgZHluYW1pY0NvbXByZXNzb3JOb2RlPzogRHluYW1pY3NDb21wcmVzc29yTm9kZTtcbiAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvT3NjaWxsYXRvck5vZGVcbiAgICBvc2NpbGxhdG9yTm9kZT86IE9zY2lsbGF0b3JOb2RlO1xuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9XYXZlU2hhcGVyTm9kZVxuICAgIHdhdmVTaGFwZXJOb2RlPzogV2F2ZVNoYXBlck5vZGU7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUF1ZGlvT3B0aW9ucyB7XG4gICAgdm9sdW1lOiBudW1iZXI7XG4gICAgY3VzdG9tQXVkaW9Db250ZXh0PzogSUF1ZGlvQ29udGV4dDtcbiAgICBjdXN0b21BdWRpb0dyYXBoPzogSUF1ZGlvR3JhcGg7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVNvdXJjZU5vZGVPcHRpb25zIHtcbiAgICBsb29wOiBib29sZWFuO1xuICAgIG9uRW5kZWQ6IEZ1bmN0aW9uO1xufVxuXG5leHBvcnQgY2xhc3MgUGxheWVyQXVkaW8ge1xuXG4gICAgcHJvdGVjdGVkIF92b2x1bWU6IG51bWJlcjtcbiAgICBwcm90ZWN0ZWQgX2F1ZGlvQ29udGV4dDogSUF1ZGlvQ29udGV4dCB8IG51bGwgPSBudWxsO1xuICAgIHByb3RlY3RlZCBfY29udGV4dFN0YXRlOiBzdHJpbmc7XG4gICAgcHJvdGVjdGVkIF9hdWRpb0dyYXBoOiBJQXVkaW9HcmFwaCB8IG51bGwgPSBudWxsO1xuXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucz86IElBdWRpb09wdGlvbnMpIHtcblxuICAgICAgICAvLyBpbml0aWFsIGNvbnRleHQgc3RhdGUgaXMgc3RpbGwgXCJjbG9zZWRcIlxuICAgICAgICB0aGlzLl9jb250ZXh0U3RhdGUgPSAnY2xvc2VkJztcblxuICAgICAgICB0aGlzLl92b2x1bWUgPSBvcHRpb25zLnZvbHVtZTtcblxuICAgICAgICBpZiAoJ2N1c3RvbUF1ZGlvQ29udGV4dCcgaW4gb3B0aW9uc1xuICAgICAgICAgICAgJiYgb3B0aW9ucy5jdXN0b21BdWRpb0NvbnRleHQgIT09IG51bGxcbiAgICAgICAgICAgICYmIG9wdGlvbnMuY3VzdG9tQXVkaW9Db250ZXh0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0QXVkaW9Db250ZXh0KG9wdGlvbnMuY3VzdG9tQXVkaW9Db250ZXh0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2F1ZGlvQ29udGV4dCA9IHRoaXMuX2NyZWF0ZUF1ZGlvQ29udGV4dCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCdjdXN0b21BdWRpb0dyYXBoJyBpbiBvcHRpb25zXG4gICAgICAgICAgICAmJiBvcHRpb25zLmN1c3RvbUF1ZGlvR3JhcGggIT09IG51bGxcbiAgICAgICAgICAgICYmIG9wdGlvbnMuY3VzdG9tQXVkaW9HcmFwaCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLnNldEF1ZGlvR3JhcGgob3B0aW9ucy5jdXN0b21BdWRpb0dyYXBoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2NyZWF0ZUF1ZGlvR3JhcGgoKVxuICAgICAgICAgICAgICAgIC50aGVuKChhdWRpb0dyYXBoOiBJQXVkaW9HcmFwaCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2F1ZGlvR3JhcGggPSBhdWRpb0dyYXBoO1xuXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUT0RPOiB0byBzcGVlZCB1cCB0aGluZ3Mgd291bGQgaXQgYmUgYmV0dGVyIHRvIGNyZWF0ZSBhIGNvbnRleHQgaW4gdGhlIGNvbnN0cnVjdG9yP1xuICAgICAgICAvLyBhbmQgc3VzcGVuZCB0aGUgY29udGV4dCB1cG9uIGNyZWF0aW5nIGl0IHVudGlsIGl0IGdldHMgdXNlZD9cblxuICAgIH1cblxuICAgIHB1YmxpYyBkZWNvZGVBdWRpbyhhcnJheUJ1ZmZlcjogQXJyYXlCdWZmZXIpOiBQcm9taXNlPEF1ZGlvQnVmZmVyPiB7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0QXVkaW9Db250ZXh0KCkudGhlbigoYXVkaW9Db250ZXh0OiBJQXVkaW9Db250ZXh0KSA9PiB7XG5cbiAgICAgICAgICAgIC8vIE5vdGUgdG8gc2VsZjpcbiAgICAgICAgICAgIC8vIG5ld2VyIGRlY29kZUF1ZGlvRGF0YSByZXR1cm5zIHByb21pc2UsIG9sZGVyIGFjY2VwdCBhcyBzZWNvbmRcbiAgICAgICAgICAgIC8vIGFuZCB0aGlyZCBwYXJhbWV0ZXIgYSBzdWNjZXNzIGFuZCBhbiBlcnJvciBjYWxsYmFjayBmdW50aW9uXG4gICAgICAgICAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvQXVkaW9Db250ZXh0L2RlY29kZUF1ZGlvRGF0YVxuXG4gICAgICAgICAgICBsZXQgYXVkaW9CdWZmZXJQcm9taXNlID0gYXVkaW9Db250ZXh0LmRlY29kZUF1ZGlvRGF0YShhcnJheUJ1ZmZlcik7XG5cbiAgICAgICAgICAgIC8vIGRlY29kZUF1ZGlvRGF0YSByZXR1cm5zIGEgcHJvbWlzZSBvZiB0eXBlIFByb21pc2VMaWtlXG4gICAgICAgICAgICAvLyB1c2luZyByZXNvbHZlIHRvIHJldHVybiBhIHByb21pc2Ugb2YgdHlwZSBQcm9taXNlXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGF1ZGlvQnVmZmVyUHJvbWlzZSk7XG5cbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX2NyZWF0ZUF1ZGlvQ29udGV4dCgpOiBJQXVkaW9Db250ZXh0IHtcblxuICAgICAgICBsZXQgQXVkaW9Db250ZXh0ID0gd2luZG93LkF1ZGlvQ29udGV4dCB8fCAod2luZG93IGFzIGFueSkud2Via2l0QXVkaW9Db250ZXh0O1xuXG4gICAgICAgIC8vIGluaXRpYWxpemUgdGhlIGF1ZGlvIGNvbnRleHRcbiAgICAgICAgbGV0IGF1ZGlvQ29udGV4dCA9IG5ldyBBdWRpb0NvbnRleHQoKTtcblxuICAgICAgICAvLyBiaW5kIHRoZSBsaXN0ZW5lciBmb3IgdGhlIGNvbnRleHQgc3RhdGUgY2hhbmdlc1xuICAgICAgICB0aGlzLl9iaW5kQ29udGV4dFN0YXRlTGlzdGVuZXIoYXVkaW9Db250ZXh0KTtcblxuICAgICAgICAvLyBzZXQgdGhlIFwiaW5pdGlhbFwiIHN0YXRlIHRvIHJ1bm5pbmdcbiAgICAgICAgdGhpcy5fY29udGV4dFN0YXRlID0gJ3J1bm5pbmcnXG5cbiAgICAgICAgcmV0dXJuIGF1ZGlvQ29udGV4dDtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfYmluZENvbnRleHRTdGF0ZUxpc3RlbmVyKGF1ZGlvQ29udGV4dDogSUF1ZGlvQ29udGV4dCkge1xuXG4gICAgICAgIGF1ZGlvQ29udGV4dC5vbnN0YXRlY2hhbmdlID0gKCkgPT4ge1xuXG4gICAgICAgICAgICB0aGlzLl9jb250ZXh0U3RhdGUgPSBhdWRpb0NvbnRleHQuc3RhdGU7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLl9jb250ZXh0U3RhdGUgPT09ICdjbG9zZWQnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fYXVkaW9Db250ZXh0ID0gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9O1xuXG4gICAgfVxuXG4gICAgcHVibGljIGdldEF1ZGlvQ29udGV4dCgpOiBQcm9taXNlPElBdWRpb0NvbnRleHQ+IHtcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgICAgICBpZiAodGhpcy5fY29udGV4dFN0YXRlID09PSAnY2xvc2VkJykge1xuXG4gICAgICAgICAgICAgICAgbGV0IGF1ZGlvQ29udGV4dCA9IHRoaXMuX2NyZWF0ZUF1ZGlvQ29udGV4dCgpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fYXVkaW9Db250ZXh0ID0gYXVkaW9Db250ZXh0O1xuXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShhdWRpb0NvbnRleHQpO1xuXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2NvbnRleHRTdGF0ZSA9PT0gJ3N1c3BlbmRlZCcpIHtcblxuICAgICAgICAgICAgICAgIHRoaXMuX3VuZnJlZXplQXVkaW9Db250ZXh0KCkudGhlbigoKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0aGlzLl9hdWRpb0NvbnRleHQpO1xuXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICByZXNvbHZlKHRoaXMuX2F1ZGlvQ29udGV4dCk7XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBzZXRBdWRpb0NvbnRleHQoYXVkaW9Db250ZXh0OiBJQXVkaW9Db250ZXh0KTogdm9pZCB7XG5cbiAgICAgICAgaWYgKHRoaXMuX2F1ZGlvQ29udGV4dCAhPT0gbnVsbCkge1xuXG4gICAgICAgICAgICB0aGlzLl9kZXN0cm95QXVkaW9Db250ZXh0KCkudGhlbigoKSA9PiB7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9zZXRBdWRpb0NvbnRleHQoYXVkaW9Db250ZXh0KTtcblxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgdGhpcy5fc2V0QXVkaW9Db250ZXh0KGF1ZGlvQ29udGV4dCk7XG5cbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9zZXRBdWRpb0NvbnRleHQoYXVkaW9Db250ZXh0OiBJQXVkaW9Db250ZXh0KSB7XG5cbiAgICAgICAgdGhpcy5fYXVkaW9Db250ZXh0ID0gYXVkaW9Db250ZXh0O1xuXG4gICAgICAgIHRoaXMuX2JpbmRDb250ZXh0U3RhdGVMaXN0ZW5lcihhdWRpb0NvbnRleHQpO1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9kZXN0cm95QXVkaW9Db250ZXh0KCk6IFByb21pc2U8dm9pZD4ge1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9hdWRpb0NvbnRleHQuY2xvc2UoKS50aGVuKCgpID0+IHtcblxuICAgICAgICAgICAgdGhpcy5fYXVkaW9Db250ZXh0ID0gbnVsbDtcblxuICAgICAgICB9KTtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfdW5mcmVlemVBdWRpb0NvbnRleHQoKTogUHJvbWlzZTx2b2lkPiB7XG5cbiAgICAgICAgLy8gZGlkIHJlc3VtZSBnZXQgaW1wbGVtZW50ZWRcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLl9hdWRpb0NvbnRleHQuc3VzcGVuZCA9PT0gJ3VuZGVmaW5lZCcpIHtcblxuICAgICAgICAgICAgLy8gdGhpcyBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgcmVzdW1lXG4gICAgICAgICAgICAvLyBqdXN0IHNlbmQgYmFjayBhIHByb21pc2UgYXMgcmVzdW1lIHdvdWxkIGRvXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgLy8gcmVzdW1lIHRoZSBhdWRpbyBoYXJkd2FyZSBhY2Nlc3NcbiAgICAgICAgICAgIC8vIGF1ZGlvIGNvbnRleHQgcmVzdW1lIHJldHVybnMgYSBwcm9taXNlXG4gICAgICAgICAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvQXVkaW9Db250ZXh0L3Jlc3VtZVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2F1ZGlvQ29udGV4dC5yZXN1bWUoKTtcblxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX2ZyZWV6ZUF1ZGlvQ29udGV4dCgpOiBQcm9taXNlPHZvaWQ+IHtcblxuICAgICAgICAvLyBkaWQgc3VzcGVuZCBnZXQgaW1wbGVtZW50ZWRcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLl9hdWRpb0NvbnRleHQuc3VzcGVuZCA9PT0gJ3VuZGVmaW5lZCcpIHtcblxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgIC8vIGhhbHQgdGhlIGF1ZGlvIGhhcmR3YXJlIGFjY2VzcyB0ZW1wb3JhcmlseSB0byByZWR1Y2UgQ1BVIGFuZCBiYXR0ZXJ5IHVzYWdlXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fYXVkaW9Db250ZXh0LnN1c3BlbmQoKTtcblxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0QXVkaW9HcmFwaChhdWRpb0dyYXBoOiBJQXVkaW9HcmFwaCkge1xuXG4gICAgICAgIGlmICh0aGlzLl9hdWRpb0dyYXBoICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLl9kZXN0cm95QXVkaW9HcmFwaCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gY2hlY2sgaWYgdGhlcmUgaXMgZ2FpbiBub2RlXG4gICAgICAgIGlmICghKCdnYWluTm9kZScgaW4gYXVkaW9HcmFwaClcbiAgICAgICAgICAgIHx8IGF1ZGlvR3JhcGguZ2Fpbk5vZGUgPT09IG51bGxcbiAgICAgICAgICAgIHx8IGF1ZGlvR3JhcGguZ2Fpbk5vZGUgPT09IHVuZGVmaW5lZCkge1xuXG4gICAgICAgICAgICB0aGlzLmdldEF1ZGlvQ29udGV4dCgpLnRoZW4oKGF1ZGlvQ29udGV4dDogSUF1ZGlvQ29udGV4dCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgYXVkaW9HcmFwaC5nYWluTm9kZSA9IGF1ZGlvQ29udGV4dC5jcmVhdGVHYWluKCk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9hdWRpb0dyYXBoID0gYXVkaW9HcmFwaDtcblxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgdGhpcy5fYXVkaW9HcmFwaCA9IGF1ZGlvR3JhcGg7XG5cbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgcHVibGljIGdldEF1ZGlvR3JhcGgoKTogUHJvbWlzZTxJQXVkaW9HcmFwaD4ge1xuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLl9hdWRpb0dyYXBoICE9PSBudWxsKSB7XG5cbiAgICAgICAgICAgICAgICByZXNvbHZlKHRoaXMuX2F1ZGlvR3JhcGgpO1xuXG4gICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fY3JlYXRlQXVkaW9HcmFwaCgpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKChhdWRpb0dyYXBoOiBJQXVkaW9HcmFwaCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9hdWRpb0dyYXBoID0gYXVkaW9HcmFwaDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShhdWRpb0dyYXBoKTtcblxuICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaChyZWplY3QpO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSk7XG5cbiAgICB9XG5cblxuICAgIHByb3RlY3RlZCBfY3JlYXRlQXVkaW9HcmFwaCgpOiBQcm9taXNlPElBdWRpb0dyYXBoPiB7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICAgICAgdGhpcy5nZXRBdWRpb0NvbnRleHQoKS50aGVuKChhdWRpb0NvbnRleHQ6IElBdWRpb0NvbnRleHQpID0+IHtcblxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5fYXVkaW9HcmFwaCkge1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2F1ZGlvR3JhcGggPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBnYWluTm9kZTogYXVkaW9Db250ZXh0LmNyZWF0ZUdhaW4oKVxuICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gY29ubmVjdCB0aGUgZ2FpbiBub2RlIHRvIHRoZSBkZXN0aW5hdGlvbiAoc3BlYWtlcnMpXG4gICAgICAgICAgICAgICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0F1ZGlvRGVzdGluYXRpb25Ob2RlXG4gICAgICAgICAgICAgICAgdGhpcy5fYXVkaW9HcmFwaC5nYWluTm9kZS5jb25uZWN0KGF1ZGlvQ29udGV4dC5kZXN0aW5hdGlvbik7XG5cbiAgICAgICAgICAgICAgICAvLyB1cGRhdGUgdm9sdW1lXG4gICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VHYWluVmFsdWUodGhpcy5fdm9sdW1lKTtcblxuICAgICAgICAgICAgICAgIHJlc29sdmUodGhpcy5fYXVkaW9HcmFwaCk7XG5cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9kZXN0cm95QXVkaW9HcmFwaCgpOiB2b2lkIHtcblxuICAgICAgICB0aGlzLl9hdWRpb0dyYXBoLmdhaW5Ob2RlLmRpc2Nvbm5lY3QoKTtcblxuICAgICAgICAvLyBUT0RPOiBkaXNjb25uZWN0IG90aGVyIG5vZGVzIT9cblxuICAgICAgICB0aGlzLl9hdWRpb0dyYXBoID0gbnVsbDtcblxuICAgIH1cblxuICAgIHB1YmxpYyBjcmVhdGVTb3VyY2VOb2RlKHNvdXJjZU5vZGVPcHRpb25zOiBJU291cmNlTm9kZU9wdGlvbnMpOiBQcm9taXNlPEF1ZGlvQnVmZmVyU291cmNlTm9kZT4ge1xuXG4gICAgICAgIHJldHVybiB0aGlzLmdldEF1ZGlvQ29udGV4dCgpLnRoZW4oKGF1ZGlvQ29udGV4dDogSUF1ZGlvQ29udGV4dCkgPT4ge1xuXG4gICAgICAgICAgICBsZXQgc291cmNlTm9kZSA9IGF1ZGlvQ29udGV4dC5jcmVhdGVCdWZmZXJTb3VyY2UoKTtcblxuICAgICAgICAgICAgLy8gZG8gd2UgbG9vcCB0aGlzIHNvbmdcbiAgICAgICAgICAgIHNvdXJjZU5vZGUubG9vcCA9IHNvdXJjZU5vZGVPcHRpb25zLmxvb3A7XG5cbiAgICAgICAgICAgIC8vIGlmIHRoZSBzb25nIGVuZHMgZGVzdHJveSBpdCdzIGF1ZGlvR3JhcGggYXMgdGhlIHNvdXJjZSBjYW4ndCBiZSByZXVzZWQgYW55d2F5XG4gICAgICAgICAgICAvLyBOT1RFOiB0aGUgb25lbmRlZCBoYW5kbGVyIHdvbid0IGhhdmUgYW55IGVmZmVjdCBpZiB0aGUgbG9vcCBwcm9wZXJ0eSBpcyBzZXQgdG9cbiAgICAgICAgICAgIC8vIHRydWUsIGFzIHRoZSBhdWRpbyB3b24ndCBzdG9wIHBsYXlpbmcuIFRvIHNlZSB0aGUgZWZmZWN0IGluIHRoaXMgY2FzZSB5b3UnZFxuICAgICAgICAgICAgLy8gaGF2ZSB0byB1c2UgQXVkaW9CdWZmZXJTb3VyY2VOb2RlLnN0b3AoKVxuICAgICAgICAgICAgc291cmNlTm9kZS5vbmVuZGVkID0gKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgc291cmNlTm9kZU9wdGlvbnMub25FbmRlZCgpO1xuXG4gICAgICAgICAgICAgICAgc291cmNlTm9kZS5kaXNjb25uZWN0KCk7XG5cbiAgICAgICAgICAgICAgICBzb3VyY2VOb2RlID0gbnVsbDtcblxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgcmV0dXJuIHNvdXJjZU5vZGU7XG5cbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgY29ubmVjdFNvdXJjZU5vZGVUb0dyYXBoTm9kZXMoc291cmNlTm9kZTogQXVkaW9CdWZmZXJTb3VyY2VOb2RlKSB7XG5cbiAgICAgICAgc291cmNlTm9kZS5jb25uZWN0KHRoaXMuX2F1ZGlvR3JhcGguZ2Fpbk5vZGUpO1xuXG4gICAgICAgIGlmICgnYW5hbHlzZXJOb2RlJyBpbiB0aGlzLl9hdWRpb0dyYXBoXG4gICAgICAgICAgICAmJiB0aGlzLl9hdWRpb0dyYXBoLmFuYWx5c2VyTm9kZSAhPT0gbnVsbFxuICAgICAgICAgICAgJiYgdGhpcy5fYXVkaW9HcmFwaC5hbmFseXNlck5vZGUgIT09IHVuZGVmaW5lZCkge1xuXG4gICAgICAgICAgICBzb3VyY2VOb2RlLmNvbm5lY3QodGhpcy5fYXVkaW9HcmFwaC5hbmFseXNlck5vZGUpO1xuXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoJ2RlbGF5Tm9kZScgaW4gdGhpcy5fYXVkaW9HcmFwaFxuICAgICAgICAgICAgJiYgdGhpcy5fYXVkaW9HcmFwaC5kZWxheU5vZGUgIT09IG51bGxcbiAgICAgICAgICAgICYmIHRoaXMuX2F1ZGlvR3JhcGguZGVsYXlOb2RlICE9PSB1bmRlZmluZWQpIHtcblxuICAgICAgICAgICAgc291cmNlTm9kZS5jb25uZWN0KHRoaXMuX2F1ZGlvR3JhcGguZGVsYXlOb2RlKTtcblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gVE9ETzogaGFuZGxlIG90aGVyIHR5cGVzIG9mIG5vZGVzIGFzIHdlbGxcbiAgICAgICAgLy8gZG8gaXQgcmVjdXJzaXZseSE/XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgZGVzdHJveVNvdXJjZU5vZGUoc291cmNlTm9kZTogQXVkaW9CdWZmZXJTb3VyY2VOb2RlKSB7XG5cbiAgICAgICAgc291cmNlTm9kZS5kaXNjb25uZWN0KCk7XG5cbiAgICAgICAgc291cmNlTm9kZSA9IG51bGw7XG5cbiAgICAgICAgcmV0dXJuIHNvdXJjZU5vZGU7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgY2hhbmdlR2FpblZhbHVlKHZvbHVtZTogbnVtYmVyKSB7XG5cbiAgICAgICAgdGhpcy5nZXRBdWRpb0dyYXBoKCkudGhlbigoYXVkaW9HcmFwaDogSUF1ZGlvR3JhcGgpID0+IHtcblxuICAgICAgICAgICAgYXVkaW9HcmFwaC5nYWluTm9kZS5nYWluLnZhbHVlID0gdm9sdW1lIC8gMTAwO1xuXG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG59XG4iXX0=

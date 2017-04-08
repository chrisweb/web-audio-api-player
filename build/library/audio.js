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
        function PlayerAudio(customAudioContext, customAudioGraph) {
            this._audioContext = null;
            this._audioGraph = null;
            // initial context state is still "closed"
            this._contextState = 'closed';
            if (customAudioContext !== undefined) {
                this._audioContext = customAudioContext;
            }
            if (customAudioGraph !== undefined) {
                this._audioGraph = customAudioGraph;
            }
            else {
                this._createAudioGraph();
            }
            // TODO: to speed up things would it be better to create a context in the constructor?
            // and suspend the context upon creating it until it gets used?
        }
        PlayerAudio.prototype.decodeAudio = function (arrayBuffer) {
            return this.getAudioContext().then(function (audioContext) {
                // decodeAudioData returns a promise of type PromiseLike
                // using resolve to return a promise of type Promise
                return Promise.resolve(audioContext.decodeAudioData(arrayBuffer));
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
            return this._audioGraph;
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
            this.getAudioContext().then(function (audioContext) {
                if (_this._audioGraph === null) {
                    _this._audioGraph = {
                        gainNode: audioContext.createGain()
                    };
                }
                // connect the gain node to the destination (speakers)
                // https://developer.mozilla.org/en-US/docs/Web/API/AudioDestinationNode
                _this._audioGraph.gainNode.connect(audioContext.destination);
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
            var _this = this;
            this.getAudioContext().then(function (audioContext) {
                _this._audioGraph.gainNode.gain.value = volume / 100;
            });
        };
        return PlayerAudio;
    }());
    exports.PlayerAudio = PlayerAudio;
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9saWJyYXJ5L2F1ZGlvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztJQUNBLFlBQVksQ0FBQzs7SUFnR2I7UUFNSSxxQkFBWSxrQkFBa0MsRUFBRSxnQkFBOEI7WUFKcEUsa0JBQWEsR0FBeUIsSUFBSSxDQUFDO1lBRTNDLGdCQUFXLEdBQXVCLElBQUksQ0FBQztZQUk3QywwQ0FBMEM7WUFDMUMsSUFBSSxDQUFDLGFBQWEsR0FBRyxRQUFRLENBQUM7WUFFOUIsRUFBRSxDQUFDLENBQUMsa0JBQWtCLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQztnQkFDbkMsSUFBSSxDQUFDLGFBQWEsR0FBRyxrQkFBa0IsQ0FBQztZQUM1QyxDQUFDO1lBRUQsRUFBRSxDQUFDLENBQUMsZ0JBQWdCLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQztnQkFDakMsSUFBSSxDQUFDLFdBQVcsR0FBRyxnQkFBZ0IsQ0FBQztZQUN4QyxDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ0osSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFDN0IsQ0FBQztZQUVELHNGQUFzRjtZQUN0RiwrREFBK0Q7UUFFbkUsQ0FBQztRQUVNLGlDQUFXLEdBQWxCLFVBQW1CLFdBQXdCO1lBRXZDLE1BQU0sQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQUMsWUFBMkI7Z0JBRTNELHdEQUF3RDtnQkFDeEQsb0RBQW9EO2dCQUNwRCxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7WUFFdEUsQ0FBQyxDQUFDLENBQUM7UUFFUCxDQUFDO1FBRVMseUNBQW1CLEdBQTdCO1lBRUksSUFBSSxZQUFZLEdBQUcsTUFBTSxDQUFDLFlBQVksSUFBSyxNQUFjLENBQUMsa0JBQWtCLENBQUM7WUFFN0UsSUFBSSxZQUFZLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQztZQUV0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LEtBQUssR0FBRyxNQUFNLEdBQUcsR0FBRyxDQUFDO1lBRXhELENBQUMsQ0FBQyxDQUFDO1FBRVAsQ0FBQztRQUVMLGtCQUFDO0lBQUQsQ0FqUUEsQUFpUUMsSUFBQTtJQWpRWSxrQ0FBVyIsImZpbGUiOiJsaWJyYXJ5L2F1ZGlvLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IFBsYXllckVycm9yLCBJUGxheWVyRXJyb3IgfSBmcm9tICcuL2Vycm9yJztcblxuLy8gTm90ZSB0byBzZWxmOiBBdWRpb0dyYXBoIGRvY3VtZW50YXRpb25cbi8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9BdWRpb05vZGVcblxuZXhwb3J0IGludGVyZmFjZSBJV2F2ZVRhYmxlIHtcbn1cblxuLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0F1ZGlvQ29udGV4dFxuZXhwb3J0IGludGVyZmFjZSBJQXVkaW9Db250ZXh0IHtcblxuICAgIGRlc3RpbmF0aW9uOiBBdWRpb0Rlc3RpbmF0aW9uTm9kZTsgLy8gcmVhZG9ubHlcbiAgICBzYW1wbGVSYXRlOiBudW1iZXI7IC8vIHJlYWRvbmx5XG4gICAgY3VycmVudFRpbWU6IG51bWJlcjsgLy8gcmVhZG9ubHlcbiAgICBsaXN0ZW5lcjogQXVkaW9MaXN0ZW5lcjsgLy8gcmVhZG9ubHlcbiAgICBhY3RpdmVTb3VyY2VDb3VudDogbnVtYmVyOyAvLyByZWFkb25seVxuXG4gICAgc3RhdGU6IHN0cmluZzsgLy8gcmVhZG9ubHlcblxuICAgIGNyZWF0ZUJ1ZmZlcihudW1iZXJPZkNoYW5uZWxzOiBudW1iZXIsIGxlbmd0aDogbnVtYmVyLCBzYW1wbGVSYXRlOiBudW1iZXIpOiBBdWRpb0J1ZmZlcjtcbiAgICBjcmVhdGVCdWZmZXIoYnVmZmVyOiBBcnJheUJ1ZmZlciwgbWl4VG9Nb25vOiBib29sZWFuKTogQXVkaW9CdWZmZXI7XG4gICAgZGVjb2RlQXVkaW9EYXRhKGF1ZGlvRGF0YTogQXJyYXlCdWZmZXIsIGRlY29kZVN1Y2Nlc3NDYWxsYmFjaz86IEZ1bmN0aW9uLCBkZWNvZGVFcnJvckNhbGxiYWNrPzogRnVuY3Rpb24pOiB2b2lkO1xuICAgIGNyZWF0ZUJ1ZmZlclNvdXJjZSgpOiBBdWRpb0J1ZmZlclNvdXJjZU5vZGU7XG4gICAgY3JlYXRlTWVkaWFFbGVtZW50U291cmNlKG1lZGlhRWxlbWVudDogSFRNTE1lZGlhRWxlbWVudCk6IE1lZGlhRWxlbWVudEF1ZGlvU291cmNlTm9kZTtcbiAgICBjcmVhdGVNZWRpYVN0cmVhbVNvdXJjZShtZWRpYVN0cmVhbU1lZGlhU3RyZWFtOiBNZWRpYVN0cmVhbSk6IE1lZGlhU3RyZWFtQXVkaW9Tb3VyY2VOb2RlO1xuICAgIGNyZWF0ZU1lZGlhU3RyZWFtRGVzdGluYXRpb24oKTogTWVkaWFTdHJlYW1BdWRpb0Rlc3RpbmF0aW9uTm9kZTtcbiAgICBjcmVhdGVTY3JpcHRQcm9jZXNzb3IoYnVmZmVyU2l6ZTogbnVtYmVyLCBudW1iZXJPZklucHV0Q2hhbm5lbHM/OiBudW1iZXIsIG51bWJlck9mT3V0cHV0Q2hhbm5lbHM/OiBudW1iZXIpOiBTY3JpcHRQcm9jZXNzb3JOb2RlO1xuICAgIGNyZWF0ZUFuYWx5c2VyKCk6IEFuYWx5c2VyTm9kZTtcbiAgICBjcmVhdGVHYWluKCk6IEdhaW5Ob2RlO1xuICAgIGNyZWF0ZURlbGF5KG1heERlbGF5VGltZT86IG51bWJlcik6IERlbGF5Tm9kZTtcbiAgICBjcmVhdGVCaXF1YWRGaWx0ZXIoKTogQmlxdWFkRmlsdGVyTm9kZTtcbiAgICBjcmVhdGVXYXZlU2hhcGVyKCk6IFdhdmVTaGFwZXJOb2RlO1xuICAgIGNyZWF0ZVBhbm5lcigpOiBQYW5uZXJOb2RlO1xuICAgIGNyZWF0ZUNvbnZvbHZlcigpOiBDb252b2x2ZXJOb2RlO1xuICAgIGNyZWF0ZUNoYW5uZWxTcGxpdHRlcihudW1iZXJPZk91dHB1dHM/OiBudW1iZXIpOiBDaGFubmVsU3BsaXR0ZXJOb2RlO1xuICAgIGNyZWF0ZUNoYW5uZWxNZXJnZXIobnVtYmVyT2ZJbnB1dHM/OiBudW1iZXIpOiBDaGFubmVsTWVyZ2VyTm9kZTtcbiAgICBjcmVhdGVEeW5hbWljc0NvbXByZXNzb3IoKTogRHluYW1pY3NDb21wcmVzc29yTm9kZTtcbiAgICBjcmVhdGVPc2NpbGxhdG9yKCk6IE9zY2lsbGF0b3JOb2RlO1xuICAgIGNyZWF0ZVdhdmVUYWJsZShyZWFsOiBGbG9hdDMyQXJyYXksIGltYWc6IEZsb2F0MzJBcnJheSk6IElXYXZlVGFibGU7XG5cbiAgICBvbnN0YXRlY2hhbmdlKCk6IHZvaWQ7XG4gICAgY2xvc2UoKTogUHJvbWlzZTx2b2lkPjtcbiAgICBzdXNwZW5kKCk6IFByb21pc2U8dm9pZD47XG4gICAgcmVzdW1lKCk6IFByb21pc2U8dm9pZD47XG59XG5cbmRlY2xhcmUgdmFyIHdlYmtpdEF1ZGlvQ29udGV4dDoge1xuICAgIHByb3RvdHlwZTogSUF1ZGlvQ29udGV4dDtcbiAgICBuZXcgKCk6IElBdWRpb0NvbnRleHQ7XG59O1xuXG5kZWNsYXJlIHZhciBBdWRpb0NvbnRleHQ6IHtcbiAgICBwcm90b3R5cGU6IElBdWRpb0NvbnRleHQ7XG4gICAgbmV3ICgpOiBJQXVkaW9Db250ZXh0O1xufTtcblxuZXhwb3J0IGludGVyZmFjZSBJQXVkaW9HcmFwaCB7XG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0dhaW5Ob2RlXG4gICAgZ2Fpbk5vZGU6IEdhaW5Ob2RlO1xuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9QYW5uZXJOb2RlXG4gICAgcGFubmVyTm9kZT86IFBhbm5lck5vZGU7XG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1N0ZXJlb1Bhbm5lck5vZGVcbiAgICBzdGVyZW9QYW5uZXJOb2RlPzogU3RlcmVvUGFubmVyTm9kZTtcbiAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvRGVsYXlOb2RlXG4gICAgZGVsYXlOb2RlPzogRGVsYXlOb2RlO1xuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9TY3JpcHRQcm9jZXNzb3JOb2RlXG4gICAgc2NyaXB0UHJvY2Vzc29yTm9kZT86IFNjcmlwdFByb2Nlc3Nvck5vZGU7XG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0FuYWx5c2VyTm9kZVxuICAgIGFuYWx5c2VyTm9kZT86IEFuYWx5c2VyTm9kZTtcbiAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvQmlxdWFkRmlsdGVyTm9kZVxuICAgIGJpcXVhZEZpbHRlck5vZGU/OiBCaXF1YWRGaWx0ZXJOb2RlO1xuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9DaGFubmVsTWVyZ2VyTm9kZVxuICAgIGNoYW5uZWxNZXJnZU5vZGU/OiBDaGFubmVsTWVyZ2VyTm9kZTtcbiAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvQ2hhbm5lbFNwbGl0dGVyTm9kZVxuICAgIGNoYW5uZWxTcGxpdHRlck5vZGU/OiBDaGFubmVsU3BsaXR0ZXJOb2RlO1xuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9Db252b2x2ZXJOb2RlXG4gICAgY29udm9sdmVyTm9kZT86IENvbnZvbHZlck5vZGU7XG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0R5bmFtaWNzQ29tcHJlc3Nvck5vZGVcbiAgICBkeW5hbWljQ29tcHJlc3Nvck5vZGU/OiBEeW5hbWljc0NvbXByZXNzb3JOb2RlO1xuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9Pc2NpbGxhdG9yTm9kZVxuICAgIG9zY2lsbGF0b3JOb2RlPzogT3NjaWxsYXRvck5vZGU7XG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1dhdmVTaGFwZXJOb2RlXG4gICAgd2F2ZVNoYXBlck5vZGU/OiBXYXZlU2hhcGVyTm9kZTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJQXVkaW9HcmFwaE9wdGlvbnMge1xuICAgIHZvbHVtZTogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElTb3VyY2VOb2RlT3B0aW9ucyB7XG4gICAgbG9vcDogYm9vbGVhbjtcbiAgICBvbkVuZGVkOiBGdW5jdGlvbjtcbn1cblxuZXhwb3J0IGNsYXNzIFBsYXllckF1ZGlvIHtcblxuICAgIHByb3RlY3RlZCBfYXVkaW9Db250ZXh0OiBJQXVkaW9Db250ZXh0IHwgbnVsbCA9IG51bGw7XG4gICAgcHJvdGVjdGVkIF9jb250ZXh0U3RhdGU6IHN0cmluZztcbiAgICBwcm90ZWN0ZWQgX2F1ZGlvR3JhcGg6IElBdWRpb0dyYXBoIHwgbnVsbCA9IG51bGw7XG5cbiAgICBjb25zdHJ1Y3RvcihjdXN0b21BdWRpb0NvbnRleHQ/OiBJQXVkaW9Db250ZXh0LCBjdXN0b21BdWRpb0dyYXBoPzogSUF1ZGlvR3JhcGgpIHtcblxuICAgICAgICAvLyBpbml0aWFsIGNvbnRleHQgc3RhdGUgaXMgc3RpbGwgXCJjbG9zZWRcIlxuICAgICAgICB0aGlzLl9jb250ZXh0U3RhdGUgPSAnY2xvc2VkJztcblxuICAgICAgICBpZiAoY3VzdG9tQXVkaW9Db250ZXh0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuX2F1ZGlvQ29udGV4dCA9IGN1c3RvbUF1ZGlvQ29udGV4dDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjdXN0b21BdWRpb0dyYXBoICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuX2F1ZGlvR3JhcGggPSBjdXN0b21BdWRpb0dyYXBoO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fY3JlYXRlQXVkaW9HcmFwaCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVE9ETzogdG8gc3BlZWQgdXAgdGhpbmdzIHdvdWxkIGl0IGJlIGJldHRlciB0byBjcmVhdGUgYSBjb250ZXh0IGluIHRoZSBjb25zdHJ1Y3Rvcj9cbiAgICAgICAgLy8gYW5kIHN1c3BlbmQgdGhlIGNvbnRleHQgdXBvbiBjcmVhdGluZyBpdCB1bnRpbCBpdCBnZXRzIHVzZWQ/XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgZGVjb2RlQXVkaW8oYXJyYXlCdWZmZXI6IEFycmF5QnVmZmVyKTogUHJvbWlzZTxBdWRpb0J1ZmZlcj4ge1xuXG4gICAgICAgIHJldHVybiB0aGlzLmdldEF1ZGlvQ29udGV4dCgpLnRoZW4oKGF1ZGlvQ29udGV4dDogSUF1ZGlvQ29udGV4dCkgPT4ge1xuXG4gICAgICAgICAgICAvLyBkZWNvZGVBdWRpb0RhdGEgcmV0dXJucyBhIHByb21pc2Ugb2YgdHlwZSBQcm9taXNlTGlrZVxuICAgICAgICAgICAgLy8gdXNpbmcgcmVzb2x2ZSB0byByZXR1cm4gYSBwcm9taXNlIG9mIHR5cGUgUHJvbWlzZVxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhdWRpb0NvbnRleHQuZGVjb2RlQXVkaW9EYXRhKGFycmF5QnVmZmVyKSk7XG5cbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX2NyZWF0ZUF1ZGlvQ29udGV4dCgpOiBJQXVkaW9Db250ZXh0IHtcblxuICAgICAgICBsZXQgQXVkaW9Db250ZXh0ID0gd2luZG93LkF1ZGlvQ29udGV4dCB8fCAod2luZG93IGFzIGFueSkud2Via2l0QXVkaW9Db250ZXh0O1xuXG4gICAgICAgIGxldCBhdWRpb0NvbnRleHQgPSBuZXcgQXVkaW9Db250ZXh0KCk7XG5cbiAgICAgICAgdGhpcy5fYmluZENvbnRleHRTdGF0ZUxpc3RlbmVyKGF1ZGlvQ29udGV4dCk7XG5cbiAgICAgICAgcmV0dXJuIGF1ZGlvQ29udGV4dDtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfYmluZENvbnRleHRTdGF0ZUxpc3RlbmVyKGF1ZGlvQ29udGV4dDogSUF1ZGlvQ29udGV4dCkge1xuXG4gICAgICAgIGF1ZGlvQ29udGV4dC5vbnN0YXRlY2hhbmdlID0gKCkgPT4ge1xuXG4gICAgICAgICAgICB0aGlzLl9jb250ZXh0U3RhdGUgPSBhdWRpb0NvbnRleHQuc3RhdGU7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLl9jb250ZXh0U3RhdGUgPT09ICdjbG9zZWQnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fYXVkaW9Db250ZXh0ID0gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9O1xuXG4gICAgfVxuXG4gICAgcHVibGljIGdldEF1ZGlvQ29udGV4dCgpOiBQcm9taXNlPHt9PiB7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICAgICAgaWYgKHRoaXMuX2NvbnRleHRTdGF0ZSA9PT0gJ2Nsb3NlZCcpIHtcblxuICAgICAgICAgICAgICAgIGxldCBhdWRpb0NvbnRleHQgPSB0aGlzLl9jcmVhdGVBdWRpb0NvbnRleHQoKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuX2F1ZGlvQ29udGV4dCA9IGF1ZGlvQ29udGV4dDtcblxuICAgICAgICAgICAgICAgIHJlc29sdmUoYXVkaW9Db250ZXh0KTtcblxuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9jb250ZXh0U3RhdGUgPT09ICdzdXNwZW5kZWQnKSB7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl91bmZyZWV6ZUF1ZGlvQ29udGV4dCgpLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodGhpcy5fYXVkaW9Db250ZXh0KTtcblxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh0aGlzLl9hdWRpb0NvbnRleHQpO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0QXVkaW9Db250ZXh0KGF1ZGlvQ29udGV4dDogSUF1ZGlvQ29udGV4dCk6IHZvaWQge1xuXG4gICAgICAgIHRoaXMuX2F1ZGlvQ29udGV4dCA9IGF1ZGlvQ29udGV4dDtcblxuICAgICAgICB0aGlzLl9iaW5kQ29udGV4dFN0YXRlTGlzdGVuZXIoYXVkaW9Db250ZXh0KTtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfZGVzdHJveUF1ZGlvQ29udGV4dCgpIHtcblxuICAgICAgICB0aGlzLl9kZXN0cm95QXVkaW9HcmFwaCgpO1xuXG4gICAgICAgIHRoaXMuX2F1ZGlvQ29udGV4dC5jbG9zZSgpLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgICAgICB0aGlzLl9hdWRpb0NvbnRleHQgPSBudWxsO1xuXG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF91bmZyZWV6ZUF1ZGlvQ29udGV4dCgpOiBQcm9taXNlPHZvaWQ+IHtcblxuICAgICAgICAvLyBkaWQgcmVzdW1lIGdldCBpbXBsZW1lbnRlZFxuICAgICAgICBpZiAodHlwZW9mIHRoaXMuX2F1ZGlvQ29udGV4dC5zdXNwZW5kID09PSAndW5kZWZpbmVkJykge1xuXG4gICAgICAgICAgICAvLyB0aGlzIGJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCByZXN1bWVcbiAgICAgICAgICAgIC8vIGp1c3Qgc2VuZCBiYWNrIGEgcHJvbWlzZSBhcyByZXN1bWUgd291bGQgZG9cbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAvLyByZXN1bWUgdGhlIGF1ZGlvIGhhcmR3YXJlIGFjY2Vzc1xuICAgICAgICAgICAgLy8gYXVkaW8gY29udGV4dCByZXN1bWUgcmV0dXJucyBhIHByb21pc2VcbiAgICAgICAgICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9BdWRpb0NvbnRleHQvcmVzdW1lXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fYXVkaW9Db250ZXh0LnJlc3VtZSgpO1xuXG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfZnJlZXplQXVkaW9Db250ZXh0KCk6IFByb21pc2U8dm9pZD4ge1xuXG4gICAgICAgIC8vIGRpZCBzdXNwZW5kIGdldCBpbXBsZW1lbnRlZFxuICAgICAgICBpZiAodHlwZW9mIHRoaXMuX2F1ZGlvQ29udGV4dC5zdXNwZW5kID09PSAndW5kZWZpbmVkJykge1xuXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgLy8gaGFsdCB0aGUgYXVkaW8gaGFyZHdhcmUgYWNjZXNzIHRlbXBvcmFyaWx5IHRvIHJlZHVjZSBDUFUgYW5kIGJhdHRlcnkgdXNhZ2VcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9hdWRpb0NvbnRleHQuc3VzcGVuZCgpO1xuXG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHB1YmxpYyBzZXRBdWRpb0dyYXBoKGF1ZGlvR3JhcGg6IElBdWRpb0dyYXBoKSB7XG5cbiAgICAgICAgaWYgKHRoaXMuX2F1ZGlvR3JhcGggIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuX2Rlc3Ryb3lBdWRpb0dyYXBoKCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9hdWRpb0dyYXBoID0gYXVkaW9HcmFwaDtcblxuICAgIH1cblxuICAgIHB1YmxpYyBnZXRBdWRpb0dyYXBoKCk6IElBdWRpb0dyYXBoIHtcblxuICAgICAgICByZXR1cm4gdGhpcy5fYXVkaW9HcmFwaDtcblxuICAgIH1cblxuICAgIHB1YmxpYyBjcmVhdGVTb3VyY2VOb2RlKHNvdXJjZU5vZGVPcHRpb25zOiBJU291cmNlTm9kZU9wdGlvbnMpOiBQcm9taXNlPEF1ZGlvQnVmZmVyU291cmNlTm9kZT4ge1xuXG4gICAgICAgIHJldHVybiB0aGlzLmdldEF1ZGlvQ29udGV4dCgpLnRoZW4oKGF1ZGlvQ29udGV4dDogSUF1ZGlvQ29udGV4dCkgPT4ge1xuXG4gICAgICAgICAgICBsZXQgc291cmNlTm9kZSA9IGF1ZGlvQ29udGV4dC5jcmVhdGVCdWZmZXJTb3VyY2UoKTtcblxuICAgICAgICAgICAgLy8gZG8gd2UgbG9vcCB0aGlzIHNvbmdcbiAgICAgICAgICAgIHNvdXJjZU5vZGUubG9vcCA9IHNvdXJjZU5vZGVPcHRpb25zLmxvb3A7XG5cbiAgICAgICAgICAgIC8vIGlmIHRoZSBzb25nIGVuZHMgZGVzdHJveSBpdCdzIGF1ZGlvR3JhcGggYXMgdGhlIHNvdXJjZSBjYW4ndCBiZSByZXVzZWQgYW55d2F5XG4gICAgICAgICAgICAvLyBOT1RFOiB0aGUgb25lbmRlZCBoYW5kbGVyIHdvbid0IGhhdmUgYW55IGVmZmVjdCBpZiB0aGUgbG9vcCBwcm9wZXJ0eSBpcyBzZXQgdG9cbiAgICAgICAgICAgIC8vIHRydWUsIGFzIHRoZSBhdWRpbyB3b24ndCBzdG9wIHBsYXlpbmcuIFRvIHNlZSB0aGUgZWZmZWN0IGluIHRoaXMgY2FzZSB5b3UnZFxuICAgICAgICAgICAgLy8gaGF2ZSB0byB1c2UgQXVkaW9CdWZmZXJTb3VyY2VOb2RlLnN0b3AoKVxuICAgICAgICAgICAgc291cmNlTm9kZS5vbmVuZGVkID0gKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgc291cmNlTm9kZU9wdGlvbnMub25FbmRlZCgpO1xuXG4gICAgICAgICAgICAgICAgc291cmNlTm9kZS5kaXNjb25uZWN0KCk7XG5cbiAgICAgICAgICAgICAgICBzb3VyY2VOb2RlID0gbnVsbDtcblxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgcmV0dXJuIHNvdXJjZU5vZGU7XG5cbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgY29ubmVjdFNvdXJjZU5vZGVUb0dyYXBoTm9kZXMoc291cmNlTm9kZTogQXVkaW9CdWZmZXJTb3VyY2VOb2RlKSB7XG5cbiAgICAgICAgc291cmNlTm9kZS5jb25uZWN0KHRoaXMuX2F1ZGlvR3JhcGguZ2Fpbk5vZGUpO1xuXG4gICAgICAgIGlmICh0aGlzLl9hdWRpb0dyYXBoLmFuYWx5c2VyTm9kZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgc291cmNlTm9kZS5jb25uZWN0KHRoaXMuX2F1ZGlvR3JhcGguYW5hbHlzZXJOb2RlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl9hdWRpb0dyYXBoLmRlbGF5Tm9kZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgc291cmNlTm9kZS5jb25uZWN0KHRoaXMuX2F1ZGlvR3JhcGguZGVsYXlOb2RlKTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9jcmVhdGVBdWRpb0dyYXBoKCkge1xuXG4gICAgICAgIHRoaXMuZ2V0QXVkaW9Db250ZXh0KCkudGhlbigoYXVkaW9Db250ZXh0OiBJQXVkaW9Db250ZXh0KSA9PiB7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLl9hdWRpb0dyYXBoID09PSBudWxsKSB7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9hdWRpb0dyYXBoID0ge1xuICAgICAgICAgICAgICAgICAgICBnYWluTm9kZTogYXVkaW9Db250ZXh0LmNyZWF0ZUdhaW4oKVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gY29ubmVjdCB0aGUgZ2FpbiBub2RlIHRvIHRoZSBkZXN0aW5hdGlvbiAoc3BlYWtlcnMpXG4gICAgICAgICAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvQXVkaW9EZXN0aW5hdGlvbk5vZGVcbiAgICAgICAgICAgIHRoaXMuX2F1ZGlvR3JhcGguZ2Fpbk5vZGUuY29ubmVjdChhdWRpb0NvbnRleHQuZGVzdGluYXRpb24pO1xuXG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9kZXN0cm95QXVkaW9HcmFwaCgpOiB2b2lkIHtcblxuICAgICAgICB0aGlzLl9hdWRpb0dyYXBoLmdhaW5Ob2RlLmRpc2Nvbm5lY3QoKTtcblxuICAgICAgICB0aGlzLl9hdWRpb0dyYXBoID0gbnVsbDtcblxuICAgIH1cblxuICAgIHB1YmxpYyBkZXN0cm95U291cmNlTm9kZShzb3VyY2VOb2RlOiBBdWRpb0J1ZmZlclNvdXJjZU5vZGUpIHtcblxuICAgICAgICBzb3VyY2VOb2RlLmRpc2Nvbm5lY3QoKTtcblxuICAgICAgICBzb3VyY2VOb2RlID0gbnVsbDtcblxuICAgICAgICByZXR1cm4gc291cmNlTm9kZTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBjaGFuZ2VHYWluVmFsdWUodm9sdW1lOiBudW1iZXIpIHtcblxuICAgICAgICB0aGlzLmdldEF1ZGlvQ29udGV4dCgpLnRoZW4oKGF1ZGlvQ29udGV4dDogSUF1ZGlvQ29udGV4dCkgPT4ge1xuXG4gICAgICAgICAgICB0aGlzLl9hdWRpb0dyYXBoLmdhaW5Ob2RlLmdhaW4udmFsdWUgPSB2b2x1bWUgLyAxMDA7XG5cbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbn1cbiJdfQ==

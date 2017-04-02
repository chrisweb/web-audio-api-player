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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9saWJyYXJ5L2F1ZGlvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztJQUNBLFlBQVksQ0FBQzs7SUFnR2I7UUFNSSxxQkFBWSxrQkFBa0MsRUFBRSxnQkFBOEI7WUFKcEUsa0JBQWEsR0FBeUIsSUFBSSxDQUFDO1lBRTNDLGdCQUFXLEdBQXVCLElBQUksQ0FBQztZQUk3QywwQ0FBMEM7WUFDMUMsSUFBSSxDQUFDLGFBQWEsR0FBRyxRQUFRLENBQUM7WUFFOUIsRUFBRSxDQUFDLENBQUMsa0JBQWtCLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQztnQkFDbkMsSUFBSSxDQUFDLGFBQWEsR0FBRyxrQkFBa0IsQ0FBQztZQUM1QyxDQUFDO1lBRUQsRUFBRSxDQUFDLENBQUMsZ0JBQWdCLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQztnQkFDakMsSUFBSSxDQUFDLFdBQVcsR0FBRyxnQkFBZ0IsQ0FBQztZQUN4QyxDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ0osSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFDN0IsQ0FBQztZQUVELHNGQUFzRjtZQUN0RiwrREFBK0Q7UUFFbkUsQ0FBQztRQUVNLGlDQUFXLEdBQWxCLFVBQW1CLFdBQXdCO1lBRXZDLE1BQU0sQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQUMsWUFBMkI7Z0JBRTNELHdEQUF3RDtnQkFDeEQsb0RBQW9EO2dCQUNwRCxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7WUFFdEUsQ0FBQyxDQUFDLENBQUM7UUFFUCxDQUFDO1FBRVMseUNBQW1CLEdBQTdCO1lBRUksSUFBSSxZQUFZLEdBQUcsTUFBTSxDQUFDLFlBQVksSUFBSyxNQUFjLENBQUMsa0JBQWtCLENBQUM7WUFFN0UsSUFBSSxZQUFZLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQztZQUV0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LEtBQUssR0FBRyxNQUFNLEdBQUcsR0FBRyxDQUFDO1lBRXhELENBQUMsQ0FBQyxDQUFDO1FBRVAsQ0FBQztRQUVMLGtCQUFDO0lBQUQsQ0FqUUEsQUFpUUMsSUFBQTtJQWpRWSxrQ0FBVyIsImZpbGUiOiJsaWJyYXJ5L2F1ZGlvLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IFBsYXllckVycm9yLCBJUGxheWVyRXJyb3IgfSBmcm9tICcuL2Vycm9yJztcblxuLy8gTm90ZSB0byBzZWxmOiBBdWRpb0dyYXBoIGRvY3VtZW50YXRpb25cbi8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9BdWRpb05vZGVcblxuZXhwb3J0IGludGVyZmFjZSBJV2F2ZVRhYmxlIHtcclxufVxuXG4vLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvQXVkaW9Db250ZXh0XG5leHBvcnQgaW50ZXJmYWNlIElBdWRpb0NvbnRleHQge1xyXG5cclxuICAgIGRlc3RpbmF0aW9uOiBBdWRpb0Rlc3RpbmF0aW9uTm9kZTsgLy8gcmVhZG9ubHlcclxuICAgIHNhbXBsZVJhdGU6IG51bWJlcjsgLy8gcmVhZG9ubHlcclxuICAgIGN1cnJlbnRUaW1lOiBudW1iZXI7IC8vIHJlYWRvbmx5XHJcbiAgICBsaXN0ZW5lcjogQXVkaW9MaXN0ZW5lcjsgLy8gcmVhZG9ubHlcclxuICAgIGFjdGl2ZVNvdXJjZUNvdW50OiBudW1iZXI7IC8vIHJlYWRvbmx5XHJcblxyXG4gICAgc3RhdGU6IHN0cmluZzsgLy8gcmVhZG9ubHlcclxuXHJcbiAgICBjcmVhdGVCdWZmZXIobnVtYmVyT2ZDaGFubmVsczogbnVtYmVyLCBsZW5ndGg6IG51bWJlciwgc2FtcGxlUmF0ZTogbnVtYmVyKTogQXVkaW9CdWZmZXI7XHJcbiAgICBjcmVhdGVCdWZmZXIoYnVmZmVyOiBBcnJheUJ1ZmZlciwgbWl4VG9Nb25vOiBib29sZWFuKTogQXVkaW9CdWZmZXI7XHJcbiAgICBkZWNvZGVBdWRpb0RhdGEoYXVkaW9EYXRhOiBBcnJheUJ1ZmZlciwgZGVjb2RlU3VjY2Vzc0NhbGxiYWNrPzogRnVuY3Rpb24sIGRlY29kZUVycm9yQ2FsbGJhY2s/OiBGdW5jdGlvbik6IHZvaWQ7XHJcbiAgICBjcmVhdGVCdWZmZXJTb3VyY2UoKTogQXVkaW9CdWZmZXJTb3VyY2VOb2RlO1xyXG4gICAgY3JlYXRlTWVkaWFFbGVtZW50U291cmNlKG1lZGlhRWxlbWVudDogSFRNTE1lZGlhRWxlbWVudCk6IE1lZGlhRWxlbWVudEF1ZGlvU291cmNlTm9kZTtcclxuICAgIGNyZWF0ZU1lZGlhU3RyZWFtU291cmNlKG1lZGlhU3RyZWFtTWVkaWFTdHJlYW06IE1lZGlhU3RyZWFtKTogTWVkaWFTdHJlYW1BdWRpb1NvdXJjZU5vZGU7XHJcbiAgICBjcmVhdGVNZWRpYVN0cmVhbURlc3RpbmF0aW9uKCk6IE1lZGlhU3RyZWFtQXVkaW9EZXN0aW5hdGlvbk5vZGU7XHJcbiAgICBjcmVhdGVTY3JpcHRQcm9jZXNzb3IoYnVmZmVyU2l6ZTogbnVtYmVyLCBudW1iZXJPZklucHV0Q2hhbm5lbHM/OiBudW1iZXIsIG51bWJlck9mT3V0cHV0Q2hhbm5lbHM/OiBudW1iZXIpOiBTY3JpcHRQcm9jZXNzb3JOb2RlO1xyXG4gICAgY3JlYXRlQW5hbHlzZXIoKTogQW5hbHlzZXJOb2RlO1xyXG4gICAgY3JlYXRlR2FpbigpOiBHYWluTm9kZTtcclxuICAgIGNyZWF0ZURlbGF5KG1heERlbGF5VGltZT86IG51bWJlcik6IERlbGF5Tm9kZTtcclxuICAgIGNyZWF0ZUJpcXVhZEZpbHRlcigpOiBCaXF1YWRGaWx0ZXJOb2RlO1xyXG4gICAgY3JlYXRlV2F2ZVNoYXBlcigpOiBXYXZlU2hhcGVyTm9kZTtcclxuICAgIGNyZWF0ZVBhbm5lcigpOiBQYW5uZXJOb2RlO1xyXG4gICAgY3JlYXRlQ29udm9sdmVyKCk6IENvbnZvbHZlck5vZGU7XHJcbiAgICBjcmVhdGVDaGFubmVsU3BsaXR0ZXIobnVtYmVyT2ZPdXRwdXRzPzogbnVtYmVyKTogQ2hhbm5lbFNwbGl0dGVyTm9kZTtcclxuICAgIGNyZWF0ZUNoYW5uZWxNZXJnZXIobnVtYmVyT2ZJbnB1dHM/OiBudW1iZXIpOiBDaGFubmVsTWVyZ2VyTm9kZTtcclxuICAgIGNyZWF0ZUR5bmFtaWNzQ29tcHJlc3NvcigpOiBEeW5hbWljc0NvbXByZXNzb3JOb2RlO1xyXG4gICAgY3JlYXRlT3NjaWxsYXRvcigpOiBPc2NpbGxhdG9yTm9kZTtcclxuICAgIGNyZWF0ZVdhdmVUYWJsZShyZWFsOiBGbG9hdDMyQXJyYXksIGltYWc6IEZsb2F0MzJBcnJheSk6IElXYXZlVGFibGU7XHJcblxyXG4gICAgb25zdGF0ZWNoYW5nZSgpOiB2b2lkO1xyXG4gICAgY2xvc2UoKTogUHJvbWlzZTx2b2lkPjtcclxuICAgIHN1c3BlbmQoKTogUHJvbWlzZTx2b2lkPjtcclxuICAgIHJlc3VtZSgpOiBQcm9taXNlPHZvaWQ+O1xyXG59XHJcblxyXG5kZWNsYXJlIHZhciB3ZWJraXRBdWRpb0NvbnRleHQ6IHtcclxuICAgIHByb3RvdHlwZTogSUF1ZGlvQ29udGV4dDtcclxuICAgIG5ldyAoKTogSUF1ZGlvQ29udGV4dDtcclxufTtcclxuXHJcbmRlY2xhcmUgdmFyIEF1ZGlvQ29udGV4dDoge1xyXG4gICAgcHJvdG90eXBlOiBJQXVkaW9Db250ZXh0O1xyXG4gICAgbmV3ICgpOiBJQXVkaW9Db250ZXh0O1xyXG59O1xuXG5leHBvcnQgaW50ZXJmYWNlIElBdWRpb0dyYXBoIHtcbiAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvR2Fpbk5vZGVcbiAgICBnYWluTm9kZTogR2Fpbk5vZGU7XG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1Bhbm5lck5vZGVcbiAgICBwYW5uZXJOb2RlPzogUGFubmVyTm9kZTtcbiAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvU3RlcmVvUGFubmVyTm9kZVxuICAgIHN0ZXJlb1Bhbm5lck5vZGU/OiBTdGVyZW9QYW5uZXJOb2RlO1xuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9EZWxheU5vZGVcbiAgICBkZWxheU5vZGU/OiBEZWxheU5vZGU7XG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1NjcmlwdFByb2Nlc3Nvck5vZGVcbiAgICBzY3JpcHRQcm9jZXNzb3JOb2RlPzogU2NyaXB0UHJvY2Vzc29yTm9kZTtcbiAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvQW5hbHlzZXJOb2RlXG4gICAgYW5hbHlzZXJOb2RlPzogQW5hbHlzZXJOb2RlO1xuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9CaXF1YWRGaWx0ZXJOb2RlXG4gICAgYmlxdWFkRmlsdGVyTm9kZT86IEJpcXVhZEZpbHRlck5vZGU7XG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0NoYW5uZWxNZXJnZXJOb2RlXG4gICAgY2hhbm5lbE1lcmdlTm9kZT86IENoYW5uZWxNZXJnZXJOb2RlO1xuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9DaGFubmVsU3BsaXR0ZXJOb2RlXG4gICAgY2hhbm5lbFNwbGl0dGVyTm9kZT86IENoYW5uZWxTcGxpdHRlck5vZGU7XG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0NvbnZvbHZlck5vZGVcbiAgICBjb252b2x2ZXJOb2RlPzogQ29udm9sdmVyTm9kZTtcbiAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvRHluYW1pY3NDb21wcmVzc29yTm9kZVxuICAgIGR5bmFtaWNDb21wcmVzc29yTm9kZT86IER5bmFtaWNzQ29tcHJlc3Nvck5vZGU7XG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL09zY2lsbGF0b3JOb2RlXG4gICAgb3NjaWxsYXRvck5vZGU/OiBPc2NpbGxhdG9yTm9kZTtcbiAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvV2F2ZVNoYXBlck5vZGVcbiAgICB3YXZlU2hhcGVyTm9kZT86IFdhdmVTaGFwZXJOb2RlO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElBdWRpb0dyYXBoT3B0aW9ucyB7XG4gICAgdm9sdW1lOiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVNvdXJjZU5vZGVPcHRpb25zIHtcbiAgICBsb29wOiBib29sZWFuO1xuICAgIG9uRW5kZWQ6IEZ1bmN0aW9uO1xufVxuXG5leHBvcnQgY2xhc3MgUGxheWVyQXVkaW8ge1xuXG4gICAgcHJvdGVjdGVkIF9hdWRpb0NvbnRleHQ6IElBdWRpb0NvbnRleHQgfCBudWxsID0gbnVsbDtcbiAgICBwcm90ZWN0ZWQgX2NvbnRleHRTdGF0ZTogc3RyaW5nO1xuICAgIHByb3RlY3RlZCBfYXVkaW9HcmFwaDogSUF1ZGlvR3JhcGggfCBudWxsID0gbnVsbDtcblxuICAgIGNvbnN0cnVjdG9yKGN1c3RvbUF1ZGlvQ29udGV4dD86IElBdWRpb0NvbnRleHQsIGN1c3RvbUF1ZGlvR3JhcGg/OiBJQXVkaW9HcmFwaCkge1xuXG4gICAgICAgIC8vIGluaXRpYWwgY29udGV4dCBzdGF0ZSBpcyBzdGlsbCBcImNsb3NlZFwiXG4gICAgICAgIHRoaXMuX2NvbnRleHRTdGF0ZSA9ICdjbG9zZWQnO1xuXG4gICAgICAgIGlmIChjdXN0b21BdWRpb0NvbnRleHQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5fYXVkaW9Db250ZXh0ID0gY3VzdG9tQXVkaW9Db250ZXh0O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGN1c3RvbUF1ZGlvR3JhcGggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5fYXVkaW9HcmFwaCA9IGN1c3RvbUF1ZGlvR3JhcGg7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9jcmVhdGVBdWRpb0dyYXBoKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUT0RPOiB0byBzcGVlZCB1cCB0aGluZ3Mgd291bGQgaXQgYmUgYmV0dGVyIHRvIGNyZWF0ZSBhIGNvbnRleHQgaW4gdGhlIGNvbnN0cnVjdG9yP1xuICAgICAgICAvLyBhbmQgc3VzcGVuZCB0aGUgY29udGV4dCB1cG9uIGNyZWF0aW5nIGl0IHVudGlsIGl0IGdldHMgdXNlZD9cblxuICAgIH1cblxuICAgIHB1YmxpYyBkZWNvZGVBdWRpbyhhcnJheUJ1ZmZlcjogQXJyYXlCdWZmZXIpOiBQcm9taXNlPEF1ZGlvQnVmZmVyPiB7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0QXVkaW9Db250ZXh0KCkudGhlbigoYXVkaW9Db250ZXh0OiBJQXVkaW9Db250ZXh0KSA9PiB7XG5cbiAgICAgICAgICAgIC8vIGRlY29kZUF1ZGlvRGF0YSByZXR1cm5zIGEgcHJvbWlzZSBvZiB0eXBlIFByb21pc2VMaWtlXG4gICAgICAgICAgICAvLyB1c2luZyByZXNvbHZlIHRvIHJldHVybiBhIHByb21pc2Ugb2YgdHlwZSBQcm9taXNlXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGF1ZGlvQ29udGV4dC5kZWNvZGVBdWRpb0RhdGEoYXJyYXlCdWZmZXIpKTtcblxuICAgICAgICB9KTtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfY3JlYXRlQXVkaW9Db250ZXh0KCk6IElBdWRpb0NvbnRleHQge1xuXG4gICAgICAgIGxldCBBdWRpb0NvbnRleHQgPSB3aW5kb3cuQXVkaW9Db250ZXh0IHx8ICh3aW5kb3cgYXMgYW55KS53ZWJraXRBdWRpb0NvbnRleHQ7XG5cbiAgICAgICAgbGV0IGF1ZGlvQ29udGV4dCA9IG5ldyBBdWRpb0NvbnRleHQoKTtcblxuICAgICAgICB0aGlzLl9iaW5kQ29udGV4dFN0YXRlTGlzdGVuZXIoYXVkaW9Db250ZXh0KTtcblxuICAgICAgICByZXR1cm4gYXVkaW9Db250ZXh0O1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9iaW5kQ29udGV4dFN0YXRlTGlzdGVuZXIoYXVkaW9Db250ZXh0OiBJQXVkaW9Db250ZXh0KSB7XG5cbiAgICAgICAgYXVkaW9Db250ZXh0Lm9uc3RhdGVjaGFuZ2UgPSAoKSA9PiB7XG5cbiAgICAgICAgICAgIHRoaXMuX2NvbnRleHRTdGF0ZSA9IGF1ZGlvQ29udGV4dC5zdGF0ZTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuX2NvbnRleHRTdGF0ZSA9PT0gJ2Nsb3NlZCcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9hdWRpb0NvbnRleHQgPSBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH07XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0QXVkaW9Db250ZXh0KCk6IFByb21pc2U8e30+IHtcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgICAgICBpZiAodGhpcy5fY29udGV4dFN0YXRlID09PSAnY2xvc2VkJykge1xuXG4gICAgICAgICAgICAgICAgbGV0IGF1ZGlvQ29udGV4dCA9IHRoaXMuX2NyZWF0ZUF1ZGlvQ29udGV4dCgpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fYXVkaW9Db250ZXh0ID0gYXVkaW9Db250ZXh0O1xuXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShhdWRpb0NvbnRleHQpO1xuXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2NvbnRleHRTdGF0ZSA9PT0gJ3N1c3BlbmRlZCcpIHtcblxuICAgICAgICAgICAgICAgIHRoaXMuX3VuZnJlZXplQXVkaW9Db250ZXh0KCkudGhlbigoKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0aGlzLl9hdWRpb0NvbnRleHQpO1xuXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICByZXNvbHZlKHRoaXMuX2F1ZGlvQ29udGV4dCk7XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBzZXRBdWRpb0NvbnRleHQoYXVkaW9Db250ZXh0OiBJQXVkaW9Db250ZXh0KTogdm9pZCB7XG5cbiAgICAgICAgdGhpcy5fYXVkaW9Db250ZXh0ID0gYXVkaW9Db250ZXh0O1xuXG4gICAgICAgIHRoaXMuX2JpbmRDb250ZXh0U3RhdGVMaXN0ZW5lcihhdWRpb0NvbnRleHQpO1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9kZXN0cm95QXVkaW9Db250ZXh0KCkge1xuXG4gICAgICAgIHRoaXMuX2Rlc3Ryb3lBdWRpb0dyYXBoKCk7XG5cbiAgICAgICAgdGhpcy5fYXVkaW9Db250ZXh0LmNsb3NlKCkudGhlbigoKSA9PiB7XG5cbiAgICAgICAgICAgIHRoaXMuX2F1ZGlvQ29udGV4dCA9IG51bGw7XG5cbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX3VuZnJlZXplQXVkaW9Db250ZXh0KCk6IFByb21pc2U8dm9pZD4ge1xuXG4gICAgICAgIC8vIGRpZCByZXN1bWUgZ2V0IGltcGxlbWVudGVkXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5fYXVkaW9Db250ZXh0LnN1c3BlbmQgPT09ICd1bmRlZmluZWQnKSB7XG5cbiAgICAgICAgICAgIC8vIHRoaXMgYnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IHJlc3VtZVxuICAgICAgICAgICAgLy8ganVzdCBzZW5kIGJhY2sgYSBwcm9taXNlIGFzIHJlc3VtZSB3b3VsZCBkb1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgIC8vIHJlc3VtZSB0aGUgYXVkaW8gaGFyZHdhcmUgYWNjZXNzXG4gICAgICAgICAgICAvLyBhdWRpbyBjb250ZXh0IHJlc3VtZSByZXR1cm5zIGEgcHJvbWlzZVxuICAgICAgICAgICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0F1ZGlvQ29udGV4dC9yZXN1bWVcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9hdWRpb0NvbnRleHQucmVzdW1lKCk7XG5cbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9mcmVlemVBdWRpb0NvbnRleHQoKTogUHJvbWlzZTx2b2lkPiB7XG5cbiAgICAgICAgLy8gZGlkIHN1c3BlbmQgZ2V0IGltcGxlbWVudGVkXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5fYXVkaW9Db250ZXh0LnN1c3BlbmQgPT09ICd1bmRlZmluZWQnKSB7XG5cbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAvLyBoYWx0IHRoZSBhdWRpbyBoYXJkd2FyZSBhY2Nlc3MgdGVtcG9yYXJpbHkgdG8gcmVkdWNlIENQVSBhbmQgYmF0dGVyeSB1c2FnZVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2F1ZGlvQ29udGV4dC5zdXNwZW5kKCk7XG5cbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgcHVibGljIHNldEF1ZGlvR3JhcGgoYXVkaW9HcmFwaDogSUF1ZGlvR3JhcGgpIHtcblxuICAgICAgICBpZiAodGhpcy5fYXVkaW9HcmFwaCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5fZGVzdHJveUF1ZGlvR3JhcGgoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2F1ZGlvR3JhcGggPSBhdWRpb0dyYXBoO1xuXG4gICAgfVxuXG4gICAgcHVibGljIGdldEF1ZGlvR3JhcGgoKTogSUF1ZGlvR3JhcGgge1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9hdWRpb0dyYXBoO1xuXG4gICAgfVxuXG4gICAgcHVibGljIGNyZWF0ZVNvdXJjZU5vZGUoc291cmNlTm9kZU9wdGlvbnM6IElTb3VyY2VOb2RlT3B0aW9ucyk6IFByb21pc2U8QXVkaW9CdWZmZXJTb3VyY2VOb2RlPiB7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0QXVkaW9Db250ZXh0KCkudGhlbigoYXVkaW9Db250ZXh0OiBJQXVkaW9Db250ZXh0KSA9PiB7XG5cbiAgICAgICAgICAgIGxldCBzb3VyY2VOb2RlID0gYXVkaW9Db250ZXh0LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpO1xuXG4gICAgICAgICAgICAvLyBkbyB3ZSBsb29wIHRoaXMgc29uZ1xuICAgICAgICAgICAgc291cmNlTm9kZS5sb29wID0gc291cmNlTm9kZU9wdGlvbnMubG9vcDtcblxuICAgICAgICAgICAgLy8gaWYgdGhlIHNvbmcgZW5kcyBkZXN0cm95IGl0J3MgYXVkaW9HcmFwaCBhcyB0aGUgc291cmNlIGNhbid0IGJlIHJldXNlZCBhbnl3YXlcbiAgICAgICAgICAgIC8vIE5PVEU6IHRoZSBvbmVuZGVkIGhhbmRsZXIgd29uJ3QgaGF2ZSBhbnkgZWZmZWN0IGlmIHRoZSBsb29wIHByb3BlcnR5IGlzIHNldCB0b1xuICAgICAgICAgICAgLy8gdHJ1ZSwgYXMgdGhlIGF1ZGlvIHdvbid0IHN0b3AgcGxheWluZy4gVG8gc2VlIHRoZSBlZmZlY3QgaW4gdGhpcyBjYXNlIHlvdSdkXG4gICAgICAgICAgICAvLyBoYXZlIHRvIHVzZSBBdWRpb0J1ZmZlclNvdXJjZU5vZGUuc3RvcCgpXG4gICAgICAgICAgICBzb3VyY2VOb2RlLm9uZW5kZWQgPSAoKSA9PiB7XG5cbiAgICAgICAgICAgICAgICBzb3VyY2VOb2RlT3B0aW9ucy5vbkVuZGVkKCk7XG5cbiAgICAgICAgICAgICAgICBzb3VyY2VOb2RlLmRpc2Nvbm5lY3QoKTtcblxuICAgICAgICAgICAgICAgIHNvdXJjZU5vZGUgPSBudWxsO1xuXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICByZXR1cm4gc291cmNlTm9kZTtcblxuICAgICAgICB9KTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBjb25uZWN0U291cmNlTm9kZVRvR3JhcGhOb2Rlcyhzb3VyY2VOb2RlOiBBdWRpb0J1ZmZlclNvdXJjZU5vZGUpIHtcblxuICAgICAgICBzb3VyY2VOb2RlLmNvbm5lY3QodGhpcy5fYXVkaW9HcmFwaC5nYWluTm9kZSk7XG5cbiAgICAgICAgaWYgKHRoaXMuX2F1ZGlvR3JhcGguYW5hbHlzZXJOb2RlICE9PSBudWxsKSB7XG4gICAgICAgICAgICBzb3VyY2VOb2RlLmNvbm5lY3QodGhpcy5fYXVkaW9HcmFwaC5hbmFseXNlck5vZGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuX2F1ZGlvR3JhcGguZGVsYXlOb2RlICE9PSBudWxsKSB7XG4gICAgICAgICAgICBzb3VyY2VOb2RlLmNvbm5lY3QodGhpcy5fYXVkaW9HcmFwaC5kZWxheU5vZGUpO1xuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX2NyZWF0ZUF1ZGlvR3JhcGgoKSB7XG5cbiAgICAgICAgdGhpcy5nZXRBdWRpb0NvbnRleHQoKS50aGVuKChhdWRpb0NvbnRleHQ6IElBdWRpb0NvbnRleHQpID0+IHtcblxuICAgICAgICAgICAgaWYgKHRoaXMuX2F1ZGlvR3JhcGggPT09IG51bGwpIHtcblxuICAgICAgICAgICAgICAgIHRoaXMuX2F1ZGlvR3JhcGggPSB7XG4gICAgICAgICAgICAgICAgICAgIGdhaW5Ob2RlOiBhdWRpb0NvbnRleHQuY3JlYXRlR2FpbigpXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBjb25uZWN0IHRoZSBnYWluIG5vZGUgdG8gdGhlIGRlc3RpbmF0aW9uIChzcGVha2VycylcbiAgICAgICAgICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9BdWRpb0Rlc3RpbmF0aW9uTm9kZVxuICAgICAgICAgICAgdGhpcy5fYXVkaW9HcmFwaC5nYWluTm9kZS5jb25uZWN0KGF1ZGlvQ29udGV4dC5kZXN0aW5hdGlvbik7XG5cbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX2Rlc3Ryb3lBdWRpb0dyYXBoKCk6IHZvaWQge1xuXG4gICAgICAgIHRoaXMuX2F1ZGlvR3JhcGguZ2Fpbk5vZGUuZGlzY29ubmVjdCgpO1xuXG4gICAgICAgIHRoaXMuX2F1ZGlvR3JhcGggPSBudWxsO1xuXG4gICAgfVxuXG4gICAgcHVibGljIGRlc3Ryb3lTb3VyY2VOb2RlKHNvdXJjZU5vZGU6IEF1ZGlvQnVmZmVyU291cmNlTm9kZSkge1xuXG4gICAgICAgIHNvdXJjZU5vZGUuZGlzY29ubmVjdCgpO1xuXG4gICAgICAgIHNvdXJjZU5vZGUgPSBudWxsO1xuXG4gICAgICAgIHJldHVybiBzb3VyY2VOb2RlO1xuXG4gICAgfVxuXG4gICAgcHVibGljIGNoYW5nZUdhaW5WYWx1ZSh2b2x1bWU6IG51bWJlcikge1xuXG4gICAgICAgIHRoaXMuZ2V0QXVkaW9Db250ZXh0KCkudGhlbigoYXVkaW9Db250ZXh0OiBJQXVkaW9Db250ZXh0KSA9PiB7XG5cbiAgICAgICAgICAgIHRoaXMuX2F1ZGlvR3JhcGguZ2Fpbk5vZGUuZ2Fpbi52YWx1ZSA9IHZvbHVtZSAvIDEwMDtcblxuICAgICAgICB9KTtcblxuICAgIH1cblxufVxuIl19

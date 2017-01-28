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
                sourceNode.onended = function () {
                    sourceNode.disconnect();
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
            this._audioGraph.gainNode.gain.value = volume / 100;
        };
        return PlayerAudio;
    }());
    exports.PlayerAudio = PlayerAudio;
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9saWJyYXJ5L2F1ZGlvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0lBQ0EsWUFBWSxDQUFDO0lBa0JiO1FBTUk7WUFFSSwwQ0FBMEM7WUFDMUMsSUFBSSxDQUFDLGFBQWEsR0FBRyxRQUFRLENBQUM7WUFFOUIsc0ZBQXNGO1lBQ3RGLCtEQUErRDtRQUVuRSxDQUFDO1FBRU0saUNBQVcsR0FBbEIsVUFBbUIsV0FBd0I7WUFBM0MsaUJBVUM7WUFSRyxNQUFNLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUMsSUFBSSxDQUFDO2dCQUVoQyx3REFBd0Q7Z0JBQ3hELG9EQUFvRDtnQkFDcEQsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztZQUV2RSxDQUFDLENBQUMsQ0FBQztRQUVQLENBQUM7UUFFUyxzQ0FBZ0IsR0FBMUI7WUFBQSxpQkEwQ0M7WUF4Q0csTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLFVBQUMsT0FBTyxFQUFFLE1BQU07Z0JBRS9CLEVBQUUsQ0FBQyxDQUFDLEtBQUksQ0FBQyxhQUFhLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQztvQkFFbEMsSUFBSSxjQUFZLEdBQUcsTUFBTSxDQUFDLFlBQVksSUFBSyxNQUFjLENBQUMsa0JBQWtCLENBQUM7b0JBRTdFLElBQUksY0FBWSxHQUFHLElBQUksY0FBWSxFQUFFLENBQUM7b0JBRXRDLGNBQVksQ0FBQyxhQUFhLEdBQUc7d0JBRXpCLEtBQUksQ0FBQyxhQUFhLEdBQUcsY0FBWSxDQUFDLEtBQUssQ0FBQzt3QkFFeEMsRUFBRSxDQUFDLENBQUMsS0FBSSxDQUFDLGFBQWEsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDOzRCQUNsQyxLQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQzt3QkFDekIsQ0FBQztvQkFFTCxDQUFDLENBQUM7b0JBRUYsS0FBSSxDQUFD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QUFVLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQzVCLENBQUMsQ0FBQztnQkFFRixNQUFNLENBQUMsVUFBVSxDQUFDO1lBRXRCLENBQUMsQ0FBQyxDQUFDO1FBRVAsQ0FBQztRQUVNLDhDQUF3QixHQUEvQixVQUFnQyxVQUFpQztZQUU3RCxVQUFVLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFbEQsQ0FBQztRQUVTLHdDQUFrQixHQUE1QjtZQUVJLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBRXZDLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1FBRTVCLENBQUM7UUFFTSx1Q0FBaUIsR0FBeEIsVUFBeUIsVUFBaUM7WUFFdEQsVUFBVSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBRXhCLFVBQVUsR0FBRyxJQUFJLENBQUM7WUFFbEIsTUFBTSxDQUFDLFVBQVUsQ0FBQztRQUV0QixDQUFDO1FBRU0scUNBQWUsR0FBdEIsVUFBdUIsTUFBYztZQUVqQyxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFFeEQsQ0FBQztRQTZDTCxrQkFBQztJQUFELENBbFBBLEFBa1BDLElBQUE7SUFsUFksa0NBQVciLCJmaWxlIjoibGlicmFyeS9hdWRpby5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBQbGF5ZXJFcnJvciwgSVBsYXllckVycm9yIH0gZnJvbSAnLi9lcnJvcic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUF1ZGlvR3JhcGgge1xuICAgIGdhaW5Ob2RlOiBHYWluTm9kZTtcbiAgICBwYW5uZXJOb2RlPzogUGFubmVyTm9kZTtcbiAgICBzdGVyZW9QYW5uZXJOb2RlPzogU3RlcmVvUGFubmVyTm9kZTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJQXVkaW9HcmFwaE9wdGlvbnMge1xuICAgIHZvbHVtZTogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElTb3VyY2VOb2RlT3B0aW9ucyB7XG4gICAgbG9vcDogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNsYXNzIFBsYXllckF1ZGlvIHtcblxuICAgIHByb3RlY3RlZCBfY29udGV4dDogQXVkaW9Db250ZXh0O1xuICAgIHByb3RlY3RlZCBfY29udGV4dFN0YXRlOiBzdHJpbmc7XG4gICAgcHJvdGVjdGVkIF9hdWRpb0dyYXBoOiBJQXVkaW9HcmFwaDtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuXG4gICAgICAgIC8vIGluaXRpYWwgY29udGV4dCBzdGF0ZSBpcyBzdGlsbCBcImNsb3NlZFwiXG4gICAgICAgIHRoaXMuX2NvbnRleHRTdGF0ZSA9ICdjbG9zZWQnO1xuXG4gICAgICAgIC8vIFRPRE86IHRvIHNwZWVkIHVwIHRoaW5ncyB3b3VsZCBpdCBiZSBiZXR0ZXIgdG8gY3JlYXRlIGEgY29udGV4dCBpbiB0aGUgY29uc3RydWN0b3I/XG4gICAgICAgIC8vIGFuZCBzdXNwZW5kIHRoZSBjb250ZXh0IHVwb24gY3JlYXRpbmcgaXQgdW50aWwgaXQgZ2V0cyB1c2VkP1xuXG4gICAgfVxuXG4gICAgcHVibGljIGRlY29kZUF1ZGlvKGFycmF5QnVmZmVyOiBBcnJheUJ1ZmZlcik6IFByb21pc2U8QXVkaW9CdWZmZXI+IHtcblxuICAgICAgICByZXR1cm4gdGhpcy5fZ2V0QXVkaW9Db250ZXh0KCkudGhlbigoKSA9PiB7XG5cbiAgICAgICAgICAgIC8vIGRlY29kZUF1ZGlvRGF0YSByZXR1cm5zIGEgcHJvbWlzZSBvZiB0eXBlIFByb21pc2VMaWtlXG4gICAgICAgICAgICAvLyB1c2luZyByZXNvbHZlIHRvIHJldHVybiBhIHByb21pc2Ugb2YgdHlwZSBQcm9taXNlXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuX2NvbnRleHQuZGVjb2RlQXVkaW9EYXRhKGFycmF5QnVmZmVyKSk7XG5cbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX2dldEF1ZGlvQ29udGV4dCgpOiBQcm9taXNlPHt9PiB7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICAgICAgaWYgKHRoaXMuX2NvbnRleHRTdGF0ZSA9PT0gJ2Nsb3NlZCcpIHtcblxuICAgICAgICAgICAgICAgIGxldCBBdWRpb0NvbnRleHQgPSB3aW5kb3cuQXVkaW9Db250ZXh0IHx8ICh3aW5kb3cgYXMgYW55KS53ZWJraXRBdWRpb0NvbnRleHQ7XG5cbiAgICAgICAgICAgICAgICBsZXQgYXVkaW9Db250ZXh0ID0gbmV3IEF1ZGlvQ29udGV4dCgpO1xuXG4gICAgICAgICAgICAgICAgYXVkaW9Db250ZXh0Lm9uc3RhdGVjaGFuZ2UgPSAoKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY29udGV4dFN0YXRlID0gYXVkaW9Db250ZXh0LnN0YXRlO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9jb250ZXh0U3RhdGUgPT09ICdjbG9zZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9jb250ZXh0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIHRoaXMuX2NvbnRleHQgPSBhdWRpb0NvbnRleHQ7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9jcmVhdGVBdWRpb0dyYXBoKCk7XG5cbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG5cbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5fY29udGV4dFN0YXRlID09PSAnc3VzcGVuZGVkJykge1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fdW5mcmVlemVBdWRpb0NvbnRleHQoKS50aGVuKCgpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG5cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9kZXN0cm95QXVkaW9Db250ZXh0KCkge1xuXG4gICAgICAgIHRoaXMuX2Rlc3Ryb3lBdWRpb0dyYXBoKCk7XG5cbiAgICAgICAgdGhpcy5fY29udGV4dC5jbG9zZSgpLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgICAgICB0aGlzLl9jb250ZXh0ID0gbnVsbDtcblxuICAgICAgICB9KTtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfdW5mcmVlemVBdWRpb0NvbnRleHQoKTogUHJvbWlzZTx2b2lkPiB7XG5cbiAgICAgICAgLy8gZGlkIHJlc3VtZSBnZXQgaW1wbGVtZW50ZWRcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLl9jb250ZXh0LnN1c3BlbmQgPT09ICd1bmRlZmluZWQnKSB7XG5cbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAvLyByZXN1bWUgdGhlIGF1ZGlvIGhhcmR3YXJlIGFjY2Vzc1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NvbnRleHQucmVzdW1lKCk7XG5cbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9mcmVlemVBdWRpb0NvbnRleHQoKTogUHJvbWlzZTx2b2lkPiB7XG5cbiAgICAgICAgLy8gZGlkIHN1c3BlbmQgZ2V0IGltcGxlbWVudGVkXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5fY29udGV4dC5zdXNwZW5kID09PSAndW5kZWZpbmVkJykge1xuXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgLy8gaGFsdCB0aGUgYXVkaW8gaGFyZHdhcmUgYWNjZXNzIHRlbXBvcmFyaWx5IHRvIHJlZHVjZSBDUFUgYW5kIGJhdHRlcnkgdXNhZ2VcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jb250ZXh0LnN1c3BlbmQoKTtcblxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX2NyZWF0ZUF1ZGlvR3JhcGgoKSB7XG5cbiAgICAgICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0dhaW5Ob2RlXG5cbiAgICAgICAgbGV0IGF1ZGlvR3JhcGggPSB7XG4gICAgICAgICAgICBnYWluTm9kZTogdGhpcy5fY29udGV4dC5jcmVhdGVHYWluKClcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBjb25uZWN0IHRoZSBnYWluIG5vZGUgdG8gdGhlIGRlc3RpbmF0aW9uIChzcGVha2VycylcbiAgICAgICAgYXVkaW9HcmFwaC5nYWluTm9kZS5jb25uZWN0KHRoaXMuX2NvbnRleHQuZGVzdGluYXRpb24pO1xuXG4gICAgICAgIHRoaXMuX2F1ZGlvR3JhcGggPSBhdWRpb0dyYXBoO1xuXG4gICAgfVxuXG4gICAgcHVibGljIHNldEF1ZGlvR3JhcGgoYXVkaW9HcmFwaDogSUF1ZGlvR3JhcGgpIHtcblxuICAgICAgICBpZiAodGhpcy5fYXVkaW9HcmFwaCAhPT0gbnVsbCkge1xuXG4gICAgICAgICAgICB0aGlzLl9kZXN0cm95QXVkaW9HcmFwaCgpO1xuXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9hdWRpb0dyYXBoID0gYXVkaW9HcmFwaDtcblxuICAgIH1cblxuICAgIHB1YmxpYyBnZXRBdWRpb0dyYXBoKCk6IElBdWRpb0dyYXBoIHtcblxuICAgICAgICByZXR1cm4gdGhpcy5fYXVkaW9HcmFwaDtcblxuICAgIH1cblxuICAgIHB1YmxpYyBjcmVhdGVTb3VyY2VOb2RlKHNvdXJjZU5vZGVPcHRpb25zOiBJU291cmNlTm9kZU9wdGlvbnMpOiBQcm9taXNlPEF1ZGlvQnVmZmVyU291cmNlTm9kZT4ge1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9nZXRBdWRpb0NvbnRleHQoKS50aGVuKCgpID0+IHtcblxuICAgICAgICAgICAgbGV0IHNvdXJjZU5vZGUgPSB0aGlzLl9jb250ZXh0LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpO1xuXG4gICAgICAgICAgICAvLyBkbyB3ZSBsb29wIHRoaXMgc29uZ1xuICAgICAgICAgICAgc291cmNlTm9kZS5sb29wID0gc291cmNlTm9kZU9wdGlvbnMubG9vcDtcblxuICAgICAgICAgICAgLy8gaWYgdGhlIHNvbmcgZW5kcyBkZXN0cm95IGl0J3MgYXVkaW9HcmFwaCBhcyB0aGUgc291cmNlIGNhbid0IGJlIHJldXNlZCBhbnl3YXlcbiAgICAgICAgICAgIHNvdXJjZU5vZGUub25lbmRlZCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBzb3VyY2VOb2RlLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHJldHVybiBzb3VyY2VOb2RlO1xuXG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG4gICAgcHVibGljIGNvbm5lY3RTb3VyY2VOb2RlVG9HcmFwaChzb3VyY2VOb2RlOiBBdWRpb0J1ZmZlclNvdXJjZU5vZGUpIHtcblxuICAgICAgICBzb3VyY2VOb2RlLmNvbm5lY3QodGhpcy5fYXVkaW9HcmFwaC5nYWluTm9kZSk7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX2Rlc3Ryb3lBdWRpb0dyYXBoKCk6IHZvaWQge1xuXG4gICAgICAgIHRoaXMuX2F1ZGlvR3JhcGguZ2Fpbk5vZGUuZGlzY29ubmVjdCgpO1xuXG4gICAgICAgIHRoaXMuX2F1ZGlvR3JhcGggPSBudWxsO1xuXG4gICAgfVxuXG4gICAgcHVibGljIGRlc3Ryb3lTb3VyY2VOb2RlKHNvdXJjZU5vZGU6IEF1ZGlvQnVmZmVyU291cmNlTm9kZSkge1xuXG4gICAgICAgIHNvdXJjZU5vZGUuZGlzY29ubmVjdCgpO1xuXG4gICAgICAgIHNvdXJjZU5vZGUgPSBudWxsO1xuXG4gICAgICAgIHJldHVybiBzb3VyY2VOb2RlO1xuXG4gICAgfVxuXG4gICAgcHVibGljIGNoYW5nZUdhaW5WYWx1ZSh2b2x1bWU6IG51bWJlcikge1xuXG4gICAgICAgIHRoaXMuX2F1ZGlvR3JhcGguZ2Fpbk5vZGUuZ2Fpbi52YWx1ZSA9IHZvbHVtZSAvIDEwMDtcblxuICAgIH1cblxuICAgIC8qcHVibGljIHNldFBsYXliYWNrUmF0ZShwbGF5YmFja1JhdGU6IG51bWJlcik6IHZvaWQge1xuXG4gICAgICAgIC8vIDwgMSBzbG93ZXIsID4gMSBmYXN0ZXIgcGxheWJhY2tcbiAgICAgICAgLy90aGlzLl9hdWRpb0dyYXBoLnNvdXJjZU5vZGUuc2V0UGxheWJhY2tSYXRlKHBsYXliYWNrUmF0ZSk7XG5cbiAgICB9O1xuXG4gICAgcHVibGljIGdldFBsYXliYWNrUmF0ZSgpOiBudW1iZXIge1xuXG4gICAgICAgIC8vcmV0dXJuIHRoaXMuX2F1ZGlvR3JhcGguc291cmNlTm9kZS5wbGF5YmFja1JhdGU7XG5cbiAgICAgICAgcmV0dXJuIDA7XG5cbiAgICB9O1xuXG4gICAgcHVibGljIHJlc2V0UGxheWJhY2tSYXRlKCk6IHZvaWQge1xuXG5cblxuICAgIH1cblxuICAgIHB1YmxpYyBzZXRQYW5uZXIobGVmdDogbnVtYmVyLCByaWdodDogbnVtYmVyKTogdm9pZCB7XG5cbiAgICAgICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1Bhbm5lck5vZGVcblxuICAgICAgICAvL3RoaXMuYXVkaW9HcmFwaC5wYW5uZXJOb2RlLnNldFBvc2l0aW9uKDAsIDAsIDApO1xuXG4gICAgfTtcblxuICAgIHB1YmxpYyBnZXRQYW5uZXIoKTogeyBsZWZ0OiBudW1iZXIsIHJpZ2h0OiBudW1iZXIgfSB7XG5cbiAgICAgICAgLy9yZXR1cm4gdGhpcy5hdWRpb0dyYXBoLnBhbm5lck5vZGUuZ2V0UG9zaXRpb24oKTtcblxuICAgICAgICByZXR1cm4geyBsZWZ0OiAwLCByaWdodDogMCB9O1xuXG4gICAgfTtcblxuICAgIHB1YmxpYyByZXNldFBhbm5lcigpOiB2b2lkIHtcblxuXG5cbiAgICB9Ki9cblxufVxuIl19

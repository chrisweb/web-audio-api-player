(function (dependencies, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(dependencies, factory);
    }
})(["require", "exports"], function (require, exports) {
    'use strict';
    var PlayerSound = (function () {
        function PlayerSound(soundAttributes) {
            // user provided values
            if (typeof soundAttributes.sources === 'string') {
                this.sources = [soundAttributes.sources];
            }
            else {
                this.sources = soundAttributes.sources;
            }
            this.id = soundAttributes.id;
            this.playlistId = soundAttributes.playlistId || null;
            this.loop = soundAttributes.loop || false;
            if (typeof soundAttributes.onLoading === 'function') {
                this.onLoading = soundAttributes.onLoading;
            }
            else {
                this.onLoading = null;
            }
            if (typeof soundAttributes.onPlaying === 'function') {
                this.onPlaying = soundAttributes.onPlaying;
            }
            else {
                this.onPlaying = null;
            }
            if (typeof soundAttributes.onEnded === 'function') {
                this.onEnded = soundAttributes.onEnded;
            }
            else {
                this.onEnded = null;
            }
            if (typeof soundAttributes.arrayBuffer === 'ArrayBuffer') {
                this.arrayBuffer = soundAttributes.arrayBuffer;
            }
            else {
                this.arrayBuffer = null;
            }
            if (typeof soundAttributes.audioBuffer === 'AudioBuffer') {
                this.audioBuffer = soundAttributes.audioBuffer;
                this.audioBufferDate = new Date();
            }
            else {
                this.audioBuffer = null;
                this.audioBufferDate = null;
            }
            // default values
            this.sourceNode = null;
            this.isBuffered = false;
            this.isBuffering = false;
            this.playTimeOffset = 0;
            this.startTime = 0;
            this.playTime = 0;
            this.playedTimePercentage = 0;
            this.isPlaying = false;
        }
        return PlayerSound;
    }());
    exports.PlayerSound = PlayerSound;
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9saWJyYXJ5L3NvdW5kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0lBQ0EsWUFBWSxDQUFDO0lBb0RiO1FBMkJJLHFCQUFZLGVBQWlDO1lBRXpDLHVCQUF1QjtZQUN2QixFQUFFLENBQUMsQ0FBQyxPQUFPLGVBQWUsQ0FBQyxPQUFPLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQztnQkFDOUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM3QyxDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ0osSUFBSSxDQUFDLE9BQU8sR0FBRyxlQUFlLENBQUMsT0FBTyxDQUFDO1lBQzNDLENBQUM7WUFFRCxJQUFJLENBQUMsRUFBRSxHQUFHLGVBQWUsQ0FBQyxFQUFFLENBQUM7WUFDN0IsSUFBSSxDQUFDLFVBQVUsR0FBRyxlQUFlLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQztZQUNyRCxJQUFJLENBQUMsSUFBSSxHQUFHLGVBQWUsQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDO1lBRTFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sZUFBZSxDQUFDLFNBQVMsS0FBSyxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUNsRCxJQUFJLENBQUMsU0FBUyxHQUFHLGVBQWUsQ0FBQyxTQUFTLENBQUM7WUFDL0MsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNKLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO1lBQzFCLENBQUM7WUFFRCxFQUFFLENBQUMsQ0FBQyxPQUFPLGVBQWUsQ0FBQyxTQUFTLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQztnQkFDbEQsSUFBSSxDQUFDLFNBQVMsR0FBRyxlQUFlLENBQUMsU0FBUyxDQUFDO1lBQy9DLENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDSixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztZQUMxQixDQUFDO1lBRUQsRUFBRSxDQUFDLENBQUMsT0FBTyxlQUFlLENBQUMsT0FBTyxLQUFLLFVBQVUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hELElBQUksQ0FBQyxPQUFPLEdBQUcsZUFBZSxDQUFDLE9BQU8sQ0FBQztZQUMzQyxDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ0osSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDeEIsQ0FBQztZQUVELEVBQUUsQ0FBQyxDQUFDLE9BQU8sZUFBZSxDQUFDLFdBQVcsS0FBSyxhQUFhLENBQUMsQ0FBQyxDQUFDO2dCQUN2RCxJQUFJLENBQUMsV0FBVyxHQUFHLGVBQWUsQ0FBQyxXQUFXLENBQUM7WUFDbkQsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNKLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1lBQzVCLENBQUM7WUFFRCxFQUFFLENBQUMsQ0FBQyxPQUFPLGVBQWUsQ0FBQyxXQUFXLEtBQUssYUFBYSxDQUFDLENBQUMsQ0FBQztnQkFDdkQsSUFBSSxDQUFDLFdBQVcsR0FBRyxlQUFlLENBQUMsV0FBVyxDQUFDO2dCQUMvQyxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksSUFBSSxFQUFFLENBQUM7WUFDdEMsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNKLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO2dCQUN4QixJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQztZQUNoQyxDQUFDO1lBRUQsaUJBQWlCO1lBQ2pCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDO1lBQ3hCLElBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDO1lBQ3pCLElBQUksQ0FBQyxjQUFjLEdBQUcsQ0FBQyxDQUFDO1lBQ3hCLElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO1lBQ25CLElBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDO1lBQ2xCLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxDQUFDLENBQUM7WUFDOUIsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7UUFFM0IsQ0FBQztRQUVMLGtCQUFDO0lBQUQsQ0FwRkEsQUFvRkMsSUFBQTtJQXBGWSxrQ0FBVyIsImZpbGUiOiJsaWJyYXJ5L3NvdW5kLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IElSZXF1ZXN0ZWQgfSBmcm9tICcuL3JlcXVlc3QnO1xuaW1wb3J0IHsgUGxheWVyRXJyb3IsIElQbGF5ZXJFcnJvciB9IGZyb20gJy4vZXJyb3InO1xuaW1wb3J0IHsgSUF1ZGlvR3JhcGggfSBmcm9tICcuL2F1ZGlvJztcblxuZXhwb3J0IGludGVyZmFjZSBJU291bmRTb3VyY2Uge1xuICAgIHVybDogc3RyaW5nO1xuICAgIGNvZGVjPzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElPblByb2dyZXNzIHtcbiAgICAocHJvZ3Jlc3M6IG51bWJlciwgbWF4aW11bVZhbHVlOiBudW1iZXIsIGN1cnJlbnRWYWx1ZTogbnVtYmVyKTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJT25FbmRlZCB7XG4gICAgKHdpbGxQbGF5TmV4dDogYm9vbGVhbik6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVNvdW5kQXR0cmlidXRlcyB7XG4gICAgc291cmNlczogKElTb3VuZFNvdXJjZSB8IHN0cmluZylbXSB8IHN0cmluZztcbiAgICBpZDogbnVtYmVyO1xuICAgIHBsYXlsaXN0SWQ/OiBudW1iZXIgfCBudWxsO1xuICAgIGxvb3A/OiBib29sZWFuO1xuICAgIG9uTG9hZGluZz86IElPblByb2dyZXNzO1xuICAgIG9uUGxheWluZz86IElPblByb2dyZXNzO1xuICAgIG9uRW5kZWQ/OiBJT25FbmRlZDtcbiAgICBhdWRpb0J1ZmZlcj86IEF1ZGlvQnVmZmVyIHwgbnVsbDtcbiAgICBhcnJheUJ1ZmZlcj86IEFycmF5QnVmZmVyIHwgbnVsbDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJU291bmQgZXh0ZW5kcyBJU291bmRBdHRyaWJ1dGVzLCBJUmVxdWVzdGVkIHtcbiAgICBzb3VyY2VOb2RlOiBBdWRpb0J1ZmZlclNvdXJjZU5vZGUgfCBudWxsO1xuICAgIGlzQnVmZmVyZWQ6IGJvb2xlYW47XG4gICAgaXNCdWZmZXJpbmc6IGJvb2xlYW47XG4gICAgYXVkaW9CdWZmZXI6IEF1ZGlvQnVmZmVyIHwgbnVsbDtcbiAgICBhcnJheUJ1ZmZlcjogQXJyYXlCdWZmZXIgfCBudWxsO1xuICAgIGF1ZGlvQnVmZmVyRGF0ZTogRGF0ZSB8IG51bGw7XG4gICAgcGxheVRpbWVPZmZzZXQ6IG51bWJlcjtcbiAgICBzdGFydFRpbWU6IG51bWJlcjtcbiAgICBwbGF5VGltZTogbnVtYmVyO1xuICAgIHBsYXllZFRpbWVQZXJjZW50YWdlOiBudW1iZXI7XG4gICAgaXNQbGF5aW5nOiBib29sZWFuO1xuICAgIHNvdXJjZXM6IChJU291bmRTb3VyY2UgfCBzdHJpbmcpW107XG4gICAgY29kZWM6IHN0cmluZyB8IG51bGw7XG4gICAgZHVyYXRpb246IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJT3B0aW9ucyB7XG5cbn1cblxuZXhwb3J0IGNsYXNzIFBsYXllclNvdW5kIGltcGxlbWVudHMgSVNvdW5kIHtcblxuICAgIHB1YmxpYyBzb3VyY2VzOiAoSVNvdW5kU291cmNlIHwgc3RyaW5nKVtdO1xuICAgIHB1YmxpYyBpZDogbnVtYmVyO1xuICAgIHB1YmxpYyBwbGF5bGlzdElkOiBudW1iZXIgfCBudWxsO1xuICAgIHB1YmxpYyBsb29wOiBib29sZWFuO1xuICAgIHB1YmxpYyB1cmw6IHN0cmluZztcblxuICAgIHB1YmxpYyBzb3VyY2VOb2RlOiBBdWRpb0J1ZmZlclNvdXJjZU5vZGUgfCBudWxsO1xuICAgIHB1YmxpYyBpc0J1ZmZlcmVkOiBib29sZWFuO1xuICAgIHB1YmxpYyBpc0J1ZmZlcmluZzogYm9vbGVhbjtcbiAgICBwdWJsaWMgYXVkaW9CdWZmZXI6IEF1ZGlvQnVmZmVyIHwgbnVsbDtcbiAgICBwdWJsaWMgYXJyYXlCdWZmZXI6IEFycmF5QnVmZmVyIHwgbnVsbDtcbiAgICBwdWJsaWMgYXVkaW9CdWZmZXJEYXRlOiBEYXRlIHwgbnVsbDtcbiAgICBwdWJsaWMgcGxheVRpbWVPZmZzZXQ6IG51bWJlcjtcbiAgICBwdWJsaWMgc3RhcnRUaW1lOiBudW1iZXI7XG4gICAgcHVibGljIHBsYXlUaW1lOiBudW1iZXI7XG4gICAgcHVibGljIHBsYXllZFRpbWVQZXJjZW50YWdlOiBudW1iZXI7XG4gICAgcHVibGljIGlzUGxheWluZzogYm9vbGVhbjtcbiAgICBwdWJsaWMgbG9hZGluZ1Byb2dyZXNzOiBudW1iZXI7XG4gICAgcHVibGljIGNvZGVjOiBzdHJpbmc7XG4gICAgcHVibGljIGR1cmF0aW9uOiBudW1iZXI7XG5cbiAgICBwdWJsaWMgb25Mb2FkaW5nOiBJT25Qcm9ncmVzcztcbiAgICBwdWJsaWMgb25QbGF5aW5nOiBJT25Qcm9ncmVzcztcbiAgICBwdWJsaWMgb25FbmRlZDogSU9uRW5kZWQ7XG5cbiAgICBjb25zdHJ1Y3Rvcihzb3VuZEF0dHJpYnV0ZXM6IElTb3VuZEF0dHJpYnV0ZXMpIHtcblxuICAgICAgICAvLyB1c2VyIHByb3ZpZGVkIHZhbHVlc1xuICAgICAgICBpZiAodHlwZW9mIHNvdW5kQXR0cmlidXRlcy5zb3VyY2VzID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhpcy5zb3VyY2VzID0gW3NvdW5kQXR0cmlidXRlcy5zb3VyY2VzXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc291cmNlcyA9IHNvdW5kQXR0cmlidXRlcy5zb3VyY2VzO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5pZCA9IHNvdW5kQXR0cmlidXRlcy5pZDtcbiAgICAgICAgdGhpcy5wbGF5bGlzdElkID0gc291bmRBdHRyaWJ1dGVzLnBsYXlsaXN0SWQgfHwgbnVsbDtcbiAgICAgICAgdGhpcy5sb29wID0gc291bmRBdHRyaWJ1dGVzLmxvb3AgfHwgZmFsc2U7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBzb3VuZEF0dHJpYnV0ZXMub25Mb2FkaW5nID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0aGlzLm9uTG9hZGluZyA9IHNvdW5kQXR0cmlidXRlcy5vbkxvYWRpbmc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLm9uTG9hZGluZyA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIHNvdW5kQXR0cmlidXRlcy5vblBsYXlpbmcgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRoaXMub25QbGF5aW5nID0gc291bmRBdHRyaWJ1dGVzLm9uUGxheWluZztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMub25QbGF5aW5nID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2Ygc291bmRBdHRyaWJ1dGVzLm9uRW5kZWQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRoaXMub25FbmRlZCA9IHNvdW5kQXR0cmlidXRlcy5vbkVuZGVkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5vbkVuZGVkID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2Ygc291bmRBdHRyaWJ1dGVzLmFycmF5QnVmZmVyID09PSAnQXJyYXlCdWZmZXInKSB7XG4gICAgICAgICAgICB0aGlzLmFycmF5QnVmZmVyID0gc291bmRBdHRyaWJ1dGVzLmFycmF5QnVmZmVyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5hcnJheUJ1ZmZlciA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIHNvdW5kQXR0cmlidXRlcy5hdWRpb0J1ZmZlciA9PT0gJ0F1ZGlvQnVmZmVyJykge1xuICAgICAgICAgICAgdGhpcy5hdWRpb0J1ZmZlciA9IHNvdW5kQXR0cmlidXRlcy5hdWRpb0J1ZmZlcjtcbiAgICAgICAgICAgIHRoaXMuYXVkaW9CdWZmZXJEYXRlID0gbmV3IERhdGUoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuYXVkaW9CdWZmZXIgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5hdWRpb0J1ZmZlckRhdGUgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZGVmYXVsdCB2YWx1ZXNcbiAgICAgICAgdGhpcy5zb3VyY2VOb2RlID0gbnVsbDtcbiAgICAgICAgdGhpcy5pc0J1ZmZlcmVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaXNCdWZmZXJpbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5wbGF5VGltZU9mZnNldCA9IDA7XG4gICAgICAgIHRoaXMuc3RhcnRUaW1lID0gMDtcbiAgICAgICAgdGhpcy5wbGF5VGltZSA9IDA7XG4gICAgICAgIHRoaXMucGxheWVkVGltZVBlcmNlbnRhZ2UgPSAwO1xuICAgICAgICB0aGlzLmlzUGxheWluZyA9IGZhbHNlO1xuXG4gICAgfVxuXG59XG4iXX0=

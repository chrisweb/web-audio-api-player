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
            if (typeof soundAttributes.onPlaying === 'function') {
                this.onPlaying = soundAttributes.onPlaying;
            }
            // default values
            this.sourceNode = null;
            this.isBuffered = false;
            this.isBuffering = false;
            this.audioBuffer = null;
            this.audioBufferDate = null;
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9saWJyYXJ5L3NvdW5kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0lBQ0EsWUFBWSxDQUFDO0lBMkNiO1FBd0JJLHFCQUFZLGVBQWlDO1lBRXpDLHVCQUF1QjtZQUN2QixFQUFFLENBQUMsQ0FBQyxPQUFPLGVBQWUsQ0FBQyxPQUFPLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQztnQkFDOUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM3QyxDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ0osSUFBSSxDQUFDLE9BQU8sR0FBRyxlQUFlLENBQUMsT0FBTyxDQUFDO1lBQzNDLENBQUM7WUFFRCxJQUFJLENBQUMsRUFBRSxHQUFHLGVBQWUsQ0FBQyxFQUFFLENBQUM7WUFDN0IsSUFBSSxDQUFDLFVBQVUsR0FBRyxlQUFlLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQztZQUNyRCxJQUFJLENBQUMsSUFBSSxHQUFHLGVBQWUsQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDO1lBRTFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sZUFBZSxDQUFDLFNBQVMsS0FBSyxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUNsRCxJQUFJLENBQUMsU0FBUyxHQUFHLGVBQWUsQ0FBQyxTQUFTLENBQUM7WUFDL0MsQ0FBQztZQUVELEVBQUUsQ0FBQyxDQUFDLE9BQU8sZUFBZSxDQUFDLFNBQVMsS0FBSyxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUNsRCxJQUFJLENBQUMsU0FBUyxHQUFHLGVBQWUsQ0FBQyxTQUFTLENBQUM7WUFDL0MsQ0FBQztZQUVELGlCQUFpQjtZQUNqQixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztZQUN2QixJQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztZQUN4QixJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztZQUN6QixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztZQUN4QixJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQztZQUM1QixJQUFJLENBQUMsY0FBYyxHQUFHLENBQUMsQ0FBQztZQUN4QixJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQztZQUNuQixJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQztZQUNsQixJQUFJLENBQUMsb0JBQW9CLEdBQUcsQ0FBQyxDQUFDO1lBQzlCLElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO1FBRTNCLENBQUM7UUFFTCxrQkFBQztJQUFELENBM0RBLEFBMkRDLElBQUE7SUEzRFksa0NBQVciLCJmaWxlIjoibGlicmFyeS9zb3VuZC5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBJUmVxdWVzdGVkIH0gZnJvbSAnLi9yZXF1ZXN0JztcbmltcG9ydCB7IFBsYXllckVycm9yLCBJUGxheWVyRXJyb3IgfSBmcm9tICcuL2Vycm9yJztcbmltcG9ydCB7IElBdWRpb0dyYXBoIH0gZnJvbSAnLi9hdWRpbyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVNvdW5kU291cmNlIHtcbiAgICB1cmw6IHN0cmluZztcbiAgICBjb2RlYz86IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJT25Qcm9ncmVzcyB7XG4gICAgKHByb2dyZXNzOiBudW1iZXIpOiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElTb3VuZEF0dHJpYnV0ZXMge1xuICAgIHNvdXJjZXM6IChJU291bmRTb3VyY2UgfCBzdHJpbmcpW10gfCBzdHJpbmc7XG4gICAgaWQ6IG51bWJlcjtcbiAgICBwbGF5bGlzdElkPzogbnVtYmVyIHwgbnVsbDtcbiAgICBsb29wPzogYm9vbGVhbjtcbiAgICBvbkxvYWRpbmc6IElPblByb2dyZXNzO1xuICAgIG9uUGxheWluZzogSU9uUHJvZ3Jlc3M7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVNvdW5kIGV4dGVuZHMgSVJlcXVlc3RlZCwgSVNvdW5kQXR0cmlidXRlcyB7XG4gICAgc291cmNlTm9kZTogQXVkaW9CdWZmZXJTb3VyY2VOb2RlIHwgbnVsbDtcbiAgICBpc0J1ZmZlcmVkOiBib29sZWFuO1xuICAgIGlzQnVmZmVyaW5nOiBib29sZWFuO1xuICAgIGF1ZGlvQnVmZmVyOiBBdWRpb0J1ZmZlciB8IG51bGw7XG4gICAgYXVkaW9CdWZmZXJEYXRlOiBEYXRlIHwgbnVsbDtcbiAgICBwbGF5VGltZU9mZnNldDogbnVtYmVyO1xuICAgIHN0YXJ0VGltZTogbnVtYmVyO1xuICAgIHBsYXlUaW1lOiBudW1iZXI7XG4gICAgcGxheWVkVGltZVBlcmNlbnRhZ2U6IG51bWJlcjtcbiAgICBpc1BsYXlpbmc6IGJvb2xlYW47XG4gICAgc291cmNlczogKElTb3VuZFNvdXJjZSB8IHN0cmluZylbXTtcbiAgICBjb2RlYzogc3RyaW5nIHwgbnVsbDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJT3B0aW9ucyB7XG5cbn1cblxuZXhwb3J0IGNsYXNzIFBsYXllclNvdW5kIGltcGxlbWVudHMgSVNvdW5kIHtcblxuICAgIHB1YmxpYyBzb3VyY2VzOiAoSVNvdW5kU291cmNlIHwgc3RyaW5nKVtdO1xuICAgIHB1YmxpYyBpZDogbnVtYmVyO1xuICAgIHB1YmxpYyBwbGF5bGlzdElkOiBudW1iZXIgfCBudWxsO1xuICAgIHB1YmxpYyBsb29wOiBib29sZWFuO1xuICAgIHB1YmxpYyB1cmw6IHN0cmluZztcblxuICAgIHB1YmxpYyBzb3VyY2VOb2RlOiBBdWRpb0J1ZmZlclNvdXJjZU5vZGUgfCBudWxsO1xuICAgIHB1YmxpYyBpc0J1ZmZlcmVkOiBib29sZWFuO1xuICAgIHB1YmxpYyBpc0J1ZmZlcmluZzogYm9vbGVhbjtcbiAgICBwdWJsaWMgYXVkaW9CdWZmZXI6IEF1ZGlvQnVmZmVyIHwgbnVsbDtcbiAgICBwdWJsaWMgYXVkaW9CdWZmZXJEYXRlOiBEYXRlIHwgbnVsbDtcbiAgICBwdWJsaWMgcGxheVRpbWVPZmZzZXQ6IG51bWJlcjtcbiAgICBwdWJsaWMgc3RhcnRUaW1lOiBudW1iZXI7XG4gICAgcHVibGljIHBsYXlUaW1lOiBudW1iZXI7XG4gICAgcHVibGljIHBsYXllZFRpbWVQZXJjZW50YWdlOiBudW1iZXI7XG4gICAgcHVibGljIGlzUGxheWluZzogYm9vbGVhbjtcbiAgICBwdWJsaWMgbG9hZGluZ1Byb2dyZXNzOiBudW1iZXI7XG4gICAgcHVibGljIGNvZGVjOiBzdHJpbmc7XG5cbiAgICBwdWJsaWMgb25Mb2FkaW5nOiBJT25Qcm9ncmVzcztcbiAgICBwdWJsaWMgb25QbGF5aW5nOiBJT25Qcm9ncmVzcztcblxuICAgIGNvbnN0cnVjdG9yKHNvdW5kQXR0cmlidXRlczogSVNvdW5kQXR0cmlidXRlcykge1xuXG4gICAgICAgIC8vIHVzZXIgcHJvdmlkZWQgdmFsdWVzXG4gICAgICAgIGlmICh0eXBlb2Ygc291bmRBdHRyaWJ1dGVzLnNvdXJjZXMgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aGlzLnNvdXJjZXMgPSBbc291bmRBdHRyaWJ1dGVzLnNvdXJjZXNdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zb3VyY2VzID0gc291bmRBdHRyaWJ1dGVzLnNvdXJjZXM7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmlkID0gc291bmRBdHRyaWJ1dGVzLmlkO1xuICAgICAgICB0aGlzLnBsYXlsaXN0SWQgPSBzb3VuZEF0dHJpYnV0ZXMucGxheWxpc3RJZCB8fCBudWxsO1xuICAgICAgICB0aGlzLmxvb3AgPSBzb3VuZEF0dHJpYnV0ZXMubG9vcCB8fCBmYWxzZTtcblxuICAgICAgICBpZiAodHlwZW9mIHNvdW5kQXR0cmlidXRlcy5vbkxvYWRpbmcgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRoaXMub25Mb2FkaW5nID0gc291bmRBdHRyaWJ1dGVzLm9uTG9hZGluZztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2Ygc291bmRBdHRyaWJ1dGVzLm9uUGxheWluZyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdGhpcy5vblBsYXlpbmcgPSBzb3VuZEF0dHJpYnV0ZXMub25QbGF5aW5nO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZGVmYXVsdCB2YWx1ZXNcbiAgICAgICAgdGhpcy5zb3VyY2VOb2RlID0gbnVsbDtcbiAgICAgICAgdGhpcy5pc0J1ZmZlcmVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaXNCdWZmZXJpbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5hdWRpb0J1ZmZlciA9IG51bGw7XG4gICAgICAgIHRoaXMuYXVkaW9CdWZmZXJEYXRlID0gbnVsbDtcbiAgICAgICAgdGhpcy5wbGF5VGltZU9mZnNldCA9IDA7XG4gICAgICAgIHRoaXMuc3RhcnRUaW1lID0gMDtcbiAgICAgICAgdGhpcy5wbGF5VGltZSA9IDA7XG4gICAgICAgIHRoaXMucGxheWVkVGltZVBlcmNlbnRhZ2UgPSAwO1xuICAgICAgICB0aGlzLmlzUGxheWluZyA9IGZhbHNlO1xuXG4gICAgfVxuXG59XG4iXX0=

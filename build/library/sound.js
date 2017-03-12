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
            // the user can set the duration manually
            // this is usefull if we need to convert the position percentage into seconds but don't want to preload the song
            // to get the duration the song has to get preloaded as the duration is a property of the audioBuffer
            this.duration = soundAttributes.duration || null;
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
            if (typeof soundAttributes.onStarted === 'function') {
                this.onStarted = soundAttributes.onStarted;
            }
            else {
                this.onStarted = null;
            }
            if (typeof soundAttributes.onEnded === 'function') {
                this.onEnded = soundAttributes.onEnded;
            }
            else {
                this.onEnded = null;
            }
            var arrayBufferType = typeof soundAttributes.arrayBuffer;
            if (arrayBufferType === 'ArrayBuffer') {
                this.arrayBuffer = soundAttributes.arrayBuffer;
            }
            else {
                this.arrayBuffer = null;
            }
            var audioBufferType = typeof soundAttributes.audioBuffer;
            if (audioBufferType === 'AudioBuffer') {
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9saWJyYXJ5L3NvdW5kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztJQUNBLFlBQVksQ0FBQzs7SUE0RGI7UUE0QkkscUJBQVksZUFBaUM7WUFFekMsdUJBQXVCO1lBQ3ZCLEVBQUUsQ0FBQyxDQUFDLE9BQU8sZUFBZSxDQUFDLE9BQU8sS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDO2dCQUM5QyxJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzdDLENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDSixJQUFJLENBQUMsT0FBTyxHQUFHLGVBQWUsQ0FBQyxPQUFPLENBQUM7WUFDM0MsQ0FBQztZQUVELElBQUksQ0FBQyxFQUFFLEdBQUcsZUFBZSxDQUFDLEVBQUUsQ0FBQztZQUM3QixJQUFJLENBQUMsVUFBVSxHQUFHLGVBQWUsQ0FBQyxVQUFVLElBQUksSUFBSSxDQUFDO1lBQ3JELElBQUksQ0FBQyxJQUFJLEdBQUcsZUFBZSxDQUFDLElBQUksSUFBSSxLQUFLLENBQUM7WUFDMUMseUNBQXlDO1lBQ3pDLGdIQUFnSDtZQUNoSCxxR0FBcUc7WUFDckcsSUFBSSxDQUFDLFFBQVEsR0FBRyxlQUFlLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQztZQUVqRCxFQUFFLENBQUMsQ0FBQyxPQUFPLGVBQWUsQ0FBQyxTQUFTLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQztnQkFDbEQsSUFBSSxDQUFDLFNBQVMsR0FBRyxlQUFlLENBQUMsU0FBUyxDQUFDO1lBQy9DLENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDSixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztZQUMxQixDQUFDO1lBRUQsRUFBRSxDQUFDLENBQUMsT0FBTyxlQUFlLENBQUMsU0FBUyxLQUFLLFVBQVUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xELElBQUksQ0FBQyxTQUFTLEdBQUcsZUFBZSxDQUFDLFNBQVMsQ0FBQztZQUMvQyxDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ0osSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7WUFDMUIsQ0FBQztZQUVELEVBQUUsQ0FBQyxDQUFDLE9BQU8sZUFBZSxDQUFDLFNBQVMsS0FBSyxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUNsRCxJQUFJLENBQUMsU0FBUyxHQUFHLGVBQWUsQ0FBQyxTQUFTLENBQUM7WUFDL0MsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNKLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO1lBQzFCLENBQUM7WUFFRCxFQUFFLENBQUMsQ0FBQyxPQUFPLGVBQWUsQ0FBQyxPQUFPLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQztnQkFDaEQsSUFBSSxDQUFDLE9BQU8sR0FBRyxlQUFlLENBQUMsT0FBTyxDQUFDO1lBQzNDLENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDSixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztZQUN4QixDQUFDO1lBRUQsSUFBSSxlQUFlLEdBQVcsT0FBTyxlQUFlLENBQUMsV0FBVyxDQUFDO1lBRWpFLEVBQUUsQ0FBQyxDQUFDLGVBQWUsS0FBSyxhQUFhLENBQUMsQ0FBQyxDQUFDO2dCQUNwQyxJQUFJLENBQUMsV0FBVyxHQUFHLGVBQWUsQ0FBQyxXQUFXLENBQUM7WUFDbkQsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNKLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1lBQzVCLENBQUM7WUFFRCxJQUFJLGVBQWUsR0FBVyxPQUFPLGVBQWUsQ0FBQyxXQUFXLENBQUM7WUFFakUsRUFBRSxDQUFDLENBQUMsZUFBZSxLQUFLLGFBQWEsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BDLElBQUksQ0FBQyxXQUFXLEdBQUcsZUFBZSxDQUFDLFdBQVcsQ0FBQztnQkFDL0MsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO1lBQ3RDLENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDSixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztnQkFDeEIsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7WUFDaEMsQ0FBQztZQUVELGlCQUFpQjtZQUNqQixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztZQUN2QixJQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztZQUN4QixJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztZQUN6QixJQUFJLENBQUMsY0FBYyxHQUFHLENBQUMsQ0FBQztZQUN4QixJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQztZQUNuQixJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQztZQUNsQixJQUFJLENBQUMsb0JBQW9CLEdBQUcsQ0FBQyxDQUFDO1lBQzlCLElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO1FBRTNCLENBQUM7UUFFTCxrQkFBQztJQUFELENBbkdBLEFBbUdDLElBQUE7SUFuR1ksa0NBQVciLCJmaWxlIjoibGlicmFyeS9zb3VuZC5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBJUmVxdWVzdGVkIH0gZnJvbSAnLi9yZXF1ZXN0JztcbmltcG9ydCB7IFBsYXllckVycm9yLCBJUGxheWVyRXJyb3IgfSBmcm9tICcuL2Vycm9yJztcbmltcG9ydCB7IElBdWRpb0dyYXBoIH0gZnJvbSAnLi9hdWRpbyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVNvdW5kU291cmNlIHtcbiAgICB1cmw6IHN0cmluZztcbiAgICBjb2RlYz86IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJT25Qcm9ncmVzcyB7XG4gICAgKHByb2dyZXNzOiBudW1iZXIsIG1heGltdW1WYWx1ZTogbnVtYmVyLCBjdXJyZW50VmFsdWU6IG51bWJlcik6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSU9uRW5kZWQge1xuICAgICh3aWxsUGxheU5leHQ6IGJvb2xlYW4pOiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElPblN0YXJ0ZWQge1xuICAgICgpOiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElTb3VuZEF0dHJpYnV0ZXMge1xuICAgIC8vIHNvdXJjZXMgYXJlIG5vdCBtYW5kYXRvcnkgYXMgdXNlciBjYW4gcHJvdmlkZSBhbiBhcnJheUJ1ZmZlclxuICAgIC8vIGFuZCAvIG9yIGF1ZGlvQnVmZmVyIGluIHdoaWNoIGNhc2UgdGhlIHNvdXJjZSB1cmwgaXMgbm90IG5lZWRlZFxuICAgIHNvdXJjZXM/OiAoSVNvdW5kU291cmNlIHwgc3RyaW5nKVtdIHwgc3RyaW5nO1xuICAgIGlkOiBudW1iZXI7XG4gICAgcGxheWxpc3RJZD86IG51bWJlciB8IG51bGw7XG4gICAgbG9vcD86IGJvb2xlYW47XG4gICAgb25Mb2FkaW5nPzogSU9uUHJvZ3Jlc3M7XG4gICAgb25QbGF5aW5nPzogSU9uUHJvZ3Jlc3M7XG4gICAgb25FbmRlZD86IElPbkVuZGVkO1xuICAgIG9uU3RhcnRlZD86IElPblN0YXJ0ZWQ7XG4gICAgYXVkaW9CdWZmZXI/OiBBdWRpb0J1ZmZlciB8IG51bGw7XG4gICAgYXJyYXlCdWZmZXI/OiBBcnJheUJ1ZmZlciB8IG51bGw7XG4gICAgZHVyYXRpb24/OiBudW1iZXIgfCBudWxsO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElTb3VuZCBleHRlbmRzIElTb3VuZEF0dHJpYnV0ZXMsIElSZXF1ZXN0ZWQge1xuICAgIHNvdXJjZU5vZGU6IEF1ZGlvQnVmZmVyU291cmNlTm9kZSB8IG51bGw7XG4gICAgaXNCdWZmZXJlZDogYm9vbGVhbjtcbiAgICBpc0J1ZmZlcmluZzogYm9vbGVhbjtcbiAgICBhdWRpb0J1ZmZlcjogQXVkaW9CdWZmZXIgfCBudWxsO1xuICAgIGFycmF5QnVmZmVyOiBBcnJheUJ1ZmZlciB8IG51bGw7XG4gICAgYXVkaW9CdWZmZXJEYXRlOiBEYXRlIHwgbnVsbDtcbiAgICBwbGF5VGltZU9mZnNldDogbnVtYmVyO1xuICAgIHN0YXJ0VGltZTogbnVtYmVyO1xuICAgIHBsYXlUaW1lOiBudW1iZXI7XG4gICAgcGxheWVkVGltZVBlcmNlbnRhZ2U6IG51bWJlcjtcbiAgICBpc1BsYXlpbmc6IGJvb2xlYW47XG4gICAgc291cmNlczogKElTb3VuZFNvdXJjZSB8IHN0cmluZylbXTtcbiAgICBjb2RlYzogc3RyaW5nIHwgbnVsbDtcbiAgICBkdXJhdGlvbjogbnVtYmVyIHwgbnVsbDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJT3B0aW9ucyB7XG5cbn1cblxuZXhwb3J0IGNsYXNzIFBsYXllclNvdW5kIGltcGxlbWVudHMgSVNvdW5kIHtcblxuICAgIHB1YmxpYyBzb3VyY2VzOiAoSVNvdW5kU291cmNlIHwgc3RyaW5nKVtdO1xuICAgIHB1YmxpYyBpZDogbnVtYmVyO1xuICAgIHB1YmxpYyBwbGF5bGlzdElkOiBudW1iZXIgfCBudWxsO1xuICAgIHB1YmxpYyBsb29wOiBib29sZWFuO1xuICAgIHB1YmxpYyB1cmw6IHN0cmluZztcblxuICAgIHB1YmxpYyBzb3VyY2VOb2RlOiBBdWRpb0J1ZmZlclNvdXJjZU5vZGUgfCBudWxsO1xuICAgIHB1YmxpYyBpc0J1ZmZlcmVkOiBib29sZWFuO1xuICAgIHB1YmxpYyBpc0J1ZmZlcmluZzogYm9vbGVhbjtcbiAgICBwdWJsaWMgYXVkaW9CdWZmZXI6IEF1ZGlvQnVmZmVyIHwgbnVsbDtcbiAgICBwdWJsaWMgYXJyYXlCdWZmZXI6IEFycmF5QnVmZmVyIHwgbnVsbDtcbiAgICBwdWJsaWMgYXVkaW9CdWZmZXJEYXRlOiBEYXRlIHwgbnVsbDtcbiAgICBwdWJsaWMgcGxheVRpbWVPZmZzZXQ6IG51bWJlcjtcbiAgICBwdWJsaWMgc3RhcnRUaW1lOiBudW1iZXI7XG4gICAgcHVibGljIHBsYXlUaW1lOiBudW1iZXI7XG4gICAgcHVibGljIHBsYXllZFRpbWVQZXJjZW50YWdlOiBudW1iZXI7XG4gICAgcHVibGljIGlzUGxheWluZzogYm9vbGVhbjtcbiAgICBwdWJsaWMgbG9hZGluZ1Byb2dyZXNzOiBudW1iZXI7XG4gICAgcHVibGljIGNvZGVjOiBzdHJpbmc7XG4gICAgcHVibGljIGR1cmF0aW9uOiBudW1iZXIgfCBudWxsO1xuXG4gICAgcHVibGljIG9uTG9hZGluZzogSU9uUHJvZ3Jlc3M7XG4gICAgcHVibGljIG9uUGxheWluZzogSU9uUHJvZ3Jlc3M7XG4gICAgcHVibGljIG9uU3RhcnRlZDogSU9uU3RhcnRlZDtcbiAgICBwdWJsaWMgb25FbmRlZDogSU9uRW5kZWQ7XG5cbiAgICBjb25zdHJ1Y3Rvcihzb3VuZEF0dHJpYnV0ZXM6IElTb3VuZEF0dHJpYnV0ZXMpIHtcblxuICAgICAgICAvLyB1c2VyIHByb3ZpZGVkIHZhbHVlc1xuICAgICAgICBpZiAodHlwZW9mIHNvdW5kQXR0cmlidXRlcy5zb3VyY2VzID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhpcy5zb3VyY2VzID0gW3NvdW5kQXR0cmlidXRlcy5zb3VyY2VzXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc291cmNlcyA9IHNvdW5kQXR0cmlidXRlcy5zb3VyY2VzO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5pZCA9IHNvdW5kQXR0cmlidXRlcy5pZDtcbiAgICAgICAgdGhpcy5wbGF5bGlzdElkID0gc291bmRBdHRyaWJ1dGVzLnBsYXlsaXN0SWQgfHwgbnVsbDtcbiAgICAgICAgdGhpcy5sb29wID0gc291bmRBdHRyaWJ1dGVzLmxvb3AgfHwgZmFsc2U7XG4gICAgICAgIC8vIHRoZSB1c2VyIGNhbiBzZXQgdGhlIGR1cmF0aW9uIG1hbnVhbGx5XG4gICAgICAgIC8vIHRoaXMgaXMgdXNlZnVsbCBpZiB3ZSBuZWVkIHRvIGNvbnZlcnQgdGhlIHBvc2l0aW9uIHBlcmNlbnRhZ2UgaW50byBzZWNvbmRzIGJ1dCBkb24ndCB3YW50IHRvIHByZWxvYWQgdGhlIHNvbmdcbiAgICAgICAgLy8gdG8gZ2V0IHRoZSBkdXJhdGlvbiB0aGUgc29uZyBoYXMgdG8gZ2V0IHByZWxvYWRlZCBhcyB0aGUgZHVyYXRpb24gaXMgYSBwcm9wZXJ0eSBvZiB0aGUgYXVkaW9CdWZmZXJcbiAgICAgICAgdGhpcy5kdXJhdGlvbiA9IHNvdW5kQXR0cmlidXRlcy5kdXJhdGlvbiB8fCBudWxsO1xuXG4gICAgICAgIGlmICh0eXBlb2Ygc291bmRBdHRyaWJ1dGVzLm9uTG9hZGluZyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdGhpcy5vbkxvYWRpbmcgPSBzb3VuZEF0dHJpYnV0ZXMub25Mb2FkaW5nO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5vbkxvYWRpbmcgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBzb3VuZEF0dHJpYnV0ZXMub25QbGF5aW5nID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0aGlzLm9uUGxheWluZyA9IHNvdW5kQXR0cmlidXRlcy5vblBsYXlpbmc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLm9uUGxheWluZyA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIHNvdW5kQXR0cmlidXRlcy5vblN0YXJ0ZWQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRoaXMub25TdGFydGVkID0gc291bmRBdHRyaWJ1dGVzLm9uU3RhcnRlZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMub25TdGFydGVkID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2Ygc291bmRBdHRyaWJ1dGVzLm9uRW5kZWQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRoaXMub25FbmRlZCA9IHNvdW5kQXR0cmlidXRlcy5vbkVuZGVkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5vbkVuZGVkID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBhcnJheUJ1ZmZlclR5cGU6IHN0cmluZyA9IHR5cGVvZiBzb3VuZEF0dHJpYnV0ZXMuYXJyYXlCdWZmZXI7XG5cbiAgICAgICAgaWYgKGFycmF5QnVmZmVyVHlwZSA9PT0gJ0FycmF5QnVmZmVyJykge1xuICAgICAgICAgICAgdGhpcy5hcnJheUJ1ZmZlciA9IHNvdW5kQXR0cmlidXRlcy5hcnJheUJ1ZmZlcjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuYXJyYXlCdWZmZXIgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGF1ZGlvQnVmZmVyVHlwZTogc3RyaW5nID0gdHlwZW9mIHNvdW5kQXR0cmlidXRlcy5hdWRpb0J1ZmZlcjtcblxuICAgICAgICBpZiAoYXVkaW9CdWZmZXJUeXBlID09PSAnQXVkaW9CdWZmZXInKSB7XG4gICAgICAgICAgICB0aGlzLmF1ZGlvQnVmZmVyID0gc291bmRBdHRyaWJ1dGVzLmF1ZGlvQnVmZmVyO1xuICAgICAgICAgICAgdGhpcy5hdWRpb0J1ZmZlckRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5hdWRpb0J1ZmZlciA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLmF1ZGlvQnVmZmVyRGF0ZSA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBkZWZhdWx0IHZhbHVlc1xuICAgICAgICB0aGlzLnNvdXJjZU5vZGUgPSBudWxsO1xuICAgICAgICB0aGlzLmlzQnVmZmVyZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pc0J1ZmZlcmluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLnBsYXlUaW1lT2Zmc2V0ID0gMDtcbiAgICAgICAgdGhpcy5zdGFydFRpbWUgPSAwO1xuICAgICAgICB0aGlzLnBsYXlUaW1lID0gMDtcbiAgICAgICAgdGhpcy5wbGF5ZWRUaW1lUGVyY2VudGFnZSA9IDA7XG4gICAgICAgIHRoaXMuaXNQbGF5aW5nID0gZmFsc2U7XG5cbiAgICB9XG5cbn1cbiJdfQ==

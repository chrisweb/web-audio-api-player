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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9saWJyYXJ5L3NvdW5kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0lBQ0EsWUFBWSxDQUFDO0lBK0NiO1FBMEJJLHFCQUFZLGVBQWlDO1lBRXpDLHVCQUF1QjtZQUN2QixFQUFFLENBQUMsQ0FBQyxPQUFPLGVBQWUsQ0FBQyxPQUFPLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQztnQkFDOUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM3QyxDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ0osSUFBSSxDQUFDLE9BQU8sR0FBRyxlQUFlLENBQUMsT0FBTyxDQUFDO1lBQzNDLENBQUM7WUFFRCxJQUFJLENBQUMsRUFBRSxHQUFHLGVBQWUsQ0FBQyxFQUFFLENBQUM7WUFDN0IsSUFBSSxDQUFDLFVBQVUsR0FBRyxlQUFlLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQztZQUNyRCxJQUFJLENBQUMsSUFBSSxHQUFHLGVBQWUsQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDO1lBRTFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sZUFBZSxDQUFDLFNBQVMsS0FBSyxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUNsRCxJQUFJLENBQUMsU0FBUyxHQUFHLGVBQWUsQ0FBQyxTQUFTLENBQUM7WUFDL0MsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNKLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO1lBQzFCLENBQUM7WUFFRCxFQUFFLENBQUMsQ0FBQyxPQUFPLGVBQWUsQ0FBQyxTQUFTLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQztnQkFDbEQsSUFBSSxDQUFDLFNBQVMsR0FBRyxlQUFlLENBQUMsU0FBUyxDQUFDO1lBQy9DLENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDSixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztZQUMxQixDQUFDO1lBRUQsRUFBRSxDQUFDLENBQUMsT0FBTyxlQUFlLENBQUMsV0FBVyxLQUFLLGFBQWEsQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZELElBQUksQ0FBQyxXQUFXLEdBQUcsZUFBZSxDQUFDLFdBQVcsQ0FBQztZQUNuRCxDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ0osSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7WUFDNUIsQ0FBQztZQUVELEVBQUUsQ0FBQyxDQUFDLE9BQU8sZUFBZSxDQUFDLFdBQVcsS0FBSyxhQUFhLENBQUMsQ0FBQyxDQUFDO2dCQUN2RCxJQUFJLENBQUMsV0FBVyxHQUFHLGVBQWUsQ0FBQyxXQUFXLENBQUM7Z0JBQy9DLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQztZQUN0QyxDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ0osSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7Z0JBQ3hCLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDO1lBQ2hDLENBQUM7WUFFRCxpQkFBaUI7WUFDakIsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7WUFDdkIsSUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7WUFDeEIsSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7WUFDekIsSUFBSSxDQUFDLGNBQWMsR0FBRyxDQUFDLENBQUM7WUFDeEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7WUFDbkIsSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUM7WUFDbEIsSUFBSSxDQUFDLG9CQUFvQixHQUFHLENBQUMsQ0FBQztZQUM5QixJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztRQUUzQixDQUFDO1FBRUwsa0JBQUM7SUFBRCxDQTdFQSxBQTZFQyxJQUFBO0lBN0VZLGtDQUFXIiwiZmlsZSI6ImxpYnJhcnkvc291bmQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgSVJlcXVlc3RlZCB9IGZyb20gJy4vcmVxdWVzdCc7XG5pbXBvcnQgeyBQbGF5ZXJFcnJvciwgSVBsYXllckVycm9yIH0gZnJvbSAnLi9lcnJvcic7XG5pbXBvcnQgeyBJQXVkaW9HcmFwaCB9IGZyb20gJy4vYXVkaW8nO1xuXG5leHBvcnQgaW50ZXJmYWNlIElTb3VuZFNvdXJjZSB7XG4gICAgdXJsOiBzdHJpbmc7XG4gICAgY29kZWM/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSU9uUHJvZ3Jlc3Mge1xuICAgIChwcm9ncmVzczogbnVtYmVyLCBtYXhpbXVtVmFsdWU6IG51bWJlciwgY3VycmVudFZhbHVlOiBudW1iZXIpOiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElTb3VuZEF0dHJpYnV0ZXMge1xuICAgIHNvdXJjZXM6IChJU291bmRTb3VyY2UgfCBzdHJpbmcpW10gfCBzdHJpbmc7XG4gICAgaWQ6IG51bWJlcjtcbiAgICBwbGF5bGlzdElkPzogbnVtYmVyIHwgbnVsbDtcbiAgICBsb29wPzogYm9vbGVhbjtcbiAgICBvbkxvYWRpbmc/OiBJT25Qcm9ncmVzcztcbiAgICBvblBsYXlpbmc/OiBJT25Qcm9ncmVzcztcbiAgICBhdWRpb0J1ZmZlcj86IEF1ZGlvQnVmZmVyIHwgbnVsbDtcbiAgICBhcnJheUJ1ZmZlcj86IEFycmF5QnVmZmVyIHwgbnVsbDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJU291bmQgZXh0ZW5kcyBJU291bmRBdHRyaWJ1dGVzLCBJUmVxdWVzdGVkIHtcbiAgICBzb3VyY2VOb2RlOiBBdWRpb0J1ZmZlclNvdXJjZU5vZGUgfCBudWxsO1xuICAgIGlzQnVmZmVyZWQ6IGJvb2xlYW47XG4gICAgaXNCdWZmZXJpbmc6IGJvb2xlYW47XG4gICAgYXVkaW9CdWZmZXI6IEF1ZGlvQnVmZmVyIHwgbnVsbDtcbiAgICBhcnJheUJ1ZmZlcjogQXJyYXlCdWZmZXIgfCBudWxsO1xuICAgIGF1ZGlvQnVmZmVyRGF0ZTogRGF0ZSB8IG51bGw7XG4gICAgcGxheVRpbWVPZmZzZXQ6IG51bWJlcjtcbiAgICBzdGFydFRpbWU6IG51bWJlcjtcbiAgICBwbGF5VGltZTogbnVtYmVyO1xuICAgIHBsYXllZFRpbWVQZXJjZW50YWdlOiBudW1iZXI7XG4gICAgaXNQbGF5aW5nOiBib29sZWFuO1xuICAgIHNvdXJjZXM6IChJU291bmRTb3VyY2UgfCBzdHJpbmcpW107XG4gICAgY29kZWM6IHN0cmluZyB8IG51bGw7XG4gICAgZHVyYXRpb246IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJT3B0aW9ucyB7XG5cbn1cblxuZXhwb3J0IGNsYXNzIFBsYXllclNvdW5kIGltcGxlbWVudHMgSVNvdW5kIHtcblxuICAgIHB1YmxpYyBzb3VyY2VzOiAoSVNvdW5kU291cmNlIHwgc3RyaW5nKVtdO1xuICAgIHB1YmxpYyBpZDogbnVtYmVyO1xuICAgIHB1YmxpYyBwbGF5bGlzdElkOiBudW1iZXIgfCBudWxsO1xuICAgIHB1YmxpYyBsb29wOiBib29sZWFuO1xuICAgIHB1YmxpYyB1cmw6IHN0cmluZztcblxuICAgIHB1YmxpYyBzb3VyY2VOb2RlOiBBdWRpb0J1ZmZlclNvdXJjZU5vZGUgfCBudWxsO1xuICAgIHB1YmxpYyBpc0J1ZmZlcmVkOiBib29sZWFuO1xuICAgIHB1YmxpYyBpc0J1ZmZlcmluZzogYm9vbGVhbjtcbiAgICBwdWJsaWMgYXVkaW9CdWZmZXI6IEF1ZGlvQnVmZmVyIHwgbnVsbDtcbiAgICBwdWJsaWMgYXJyYXlCdWZmZXI6IEFycmF5QnVmZmVyIHwgbnVsbDtcbiAgICBwdWJsaWMgYXVkaW9CdWZmZXJEYXRlOiBEYXRlIHwgbnVsbDtcbiAgICBwdWJsaWMgcGxheVRpbWVPZmZzZXQ6IG51bWJlcjtcbiAgICBwdWJsaWMgc3RhcnRUaW1lOiBudW1iZXI7XG4gICAgcHVibGljIHBsYXlUaW1lOiBudW1iZXI7XG4gICAgcHVibGljIHBsYXllZFRpbWVQZXJjZW50YWdlOiBudW1iZXI7XG4gICAgcHVibGljIGlzUGxheWluZzogYm9vbGVhbjtcbiAgICBwdWJsaWMgbG9hZGluZ1Byb2dyZXNzOiBudW1iZXI7XG4gICAgcHVibGljIGNvZGVjOiBzdHJpbmc7XG4gICAgcHVibGljIGR1cmF0aW9uOiBudW1iZXI7XG5cbiAgICBwdWJsaWMgb25Mb2FkaW5nOiBJT25Qcm9ncmVzcztcbiAgICBwdWJsaWMgb25QbGF5aW5nOiBJT25Qcm9ncmVzcztcblxuICAgIGNvbnN0cnVjdG9yKHNvdW5kQXR0cmlidXRlczogSVNvdW5kQXR0cmlidXRlcykge1xuXG4gICAgICAgIC8vIHVzZXIgcHJvdmlkZWQgdmFsdWVzXG4gICAgICAgIGlmICh0eXBlb2Ygc291bmRBdHRyaWJ1dGVzLnNvdXJjZXMgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aGlzLnNvdXJjZXMgPSBbc291bmRBdHRyaWJ1dGVzLnNvdXJjZXNdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zb3VyY2VzID0gc291bmRBdHRyaWJ1dGVzLnNvdXJjZXM7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmlkID0gc291bmRBdHRyaWJ1dGVzLmlkO1xuICAgICAgICB0aGlzLnBsYXlsaXN0SWQgPSBzb3VuZEF0dHJpYnV0ZXMucGxheWxpc3RJZCB8fCBudWxsO1xuICAgICAgICB0aGlzLmxvb3AgPSBzb3VuZEF0dHJpYnV0ZXMubG9vcCB8fCBmYWxzZTtcblxuICAgICAgICBpZiAodHlwZW9mIHNvdW5kQXR0cmlidXRlcy5vbkxvYWRpbmcgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRoaXMub25Mb2FkaW5nID0gc291bmRBdHRyaWJ1dGVzLm9uTG9hZGluZztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMub25Mb2FkaW5nID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2Ygc291bmRBdHRyaWJ1dGVzLm9uUGxheWluZyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdGhpcy5vblBsYXlpbmcgPSBzb3VuZEF0dHJpYnV0ZXMub25QbGF5aW5nO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5vblBsYXlpbmcgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBzb3VuZEF0dHJpYnV0ZXMuYXJyYXlCdWZmZXIgPT09ICdBcnJheUJ1ZmZlcicpIHtcbiAgICAgICAgICAgIHRoaXMuYXJyYXlCdWZmZXIgPSBzb3VuZEF0dHJpYnV0ZXMuYXJyYXlCdWZmZXI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmFycmF5QnVmZmVyID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2Ygc291bmRBdHRyaWJ1dGVzLmF1ZGlvQnVmZmVyID09PSAnQXVkaW9CdWZmZXInKSB7XG4gICAgICAgICAgICB0aGlzLmF1ZGlvQnVmZmVyID0gc291bmRBdHRyaWJ1dGVzLmF1ZGlvQnVmZmVyO1xuICAgICAgICAgICAgdGhpcy5hdWRpb0J1ZmZlckRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5hdWRpb0J1ZmZlciA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLmF1ZGlvQnVmZmVyRGF0ZSA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBkZWZhdWx0IHZhbHVlc1xuICAgICAgICB0aGlzLnNvdXJjZU5vZGUgPSBudWxsO1xuICAgICAgICB0aGlzLmlzQnVmZmVyZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pc0J1ZmZlcmluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLnBsYXlUaW1lT2Zmc2V0ID0gMDtcbiAgICAgICAgdGhpcy5zdGFydFRpbWUgPSAwO1xuICAgICAgICB0aGlzLnBsYXlUaW1lID0gMDtcbiAgICAgICAgdGhpcy5wbGF5ZWRUaW1lUGVyY2VudGFnZSA9IDA7XG4gICAgICAgIHRoaXMuaXNQbGF5aW5nID0gZmFsc2U7XG5cbiAgICB9XG5cbn1cbiJdfQ==

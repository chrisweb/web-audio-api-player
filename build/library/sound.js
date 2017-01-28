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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9saWJyYXJ5L3NvdW5kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0lBQ0EsWUFBWSxDQUFDO0lBNkNiO1FBMEJJLHFCQUFZLGVBQWlDO1lBRXpDLHVCQUF1QjtZQUN2QixFQUFFLENBQUMsQ0FBQyxPQUFPLGVBQWUsQ0FBQyxPQUFPLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQztnQkFDOUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM3QyxDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ0osSUFBSSxDQUFDLE9BQU8sR0FBRyxlQUFlLENBQUMsT0FBTyxDQUFDO1lBQzNDLENBQUM7WUFFRCxJQUFJLENBQUMsRUFBRSxHQUFHLGVBQWUsQ0FBQyxFQUFFLENBQUM7WUFDN0IsSUFBSSxDQUFDLFVBQVUsR0FBRyxlQUFlLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQztZQUNyRCxJQUFJLENBQUMsSUFBSSxHQUFHLGVBQWUsQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDO1lBRTFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sZUFBZSxDQUFDLFNBQVMsS0FBSyxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUNsRCxJQUFJLENBQUMsU0FBUyxHQUFHLGVBQWUsQ0FBQyxTQUFTLENBQUM7WUFDL0MsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNKLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO1lBQzFCLENBQUM7WUFFRCxFQUFFLENBQUMsQ0FBQyxPQUFPLGVBQWUsQ0FBQyxTQUFTLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQztnQkFDbEQsSUFBSSxDQUFDLFNBQVMsR0FBRyxlQUFlLENBQUMsU0FBUyxDQUFDO1lBQy9DLENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDSixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztZQUMxQixDQUFDO1lBRUQsaUJBQWlCO1lBQ2pCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDO1lBQ3hCLElBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDO1lBQ3pCLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1lBQ3hCLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDO1lBQzVCLElBQUksQ0FBQyxjQUFjLEdBQUcsQ0FBQyxDQUFDO1lBQ3hCLElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO1lBQ25CLElBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDO1lBQ2xCLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxDQUFDLENBQUM7WUFDOUIsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7UUFFM0IsQ0FBQztRQUVMLGtCQUFDO0lBQUQsQ0FqRUEsQUFpRUMsSUFBQTtJQWpFWSxrQ0FBVyIsImZpbGUiOiJsaWJyYXJ5L3NvdW5kLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IElSZXF1ZXN0ZWQgfSBmcm9tICcuL3JlcXVlc3QnO1xuaW1wb3J0IHsgUGxheWVyRXJyb3IsIElQbGF5ZXJFcnJvciB9IGZyb20gJy4vZXJyb3InO1xuaW1wb3J0IHsgSUF1ZGlvR3JhcGggfSBmcm9tICcuL2F1ZGlvJztcblxuZXhwb3J0IGludGVyZmFjZSBJU291bmRTb3VyY2Uge1xuICAgIHVybDogc3RyaW5nO1xuICAgIGNvZGVjPzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElPblByb2dyZXNzIHtcbiAgICAocHJvZ3Jlc3M6IG51bWJlciwgbWF4aW11bVZhbHVlOiBudW1iZXIsIGN1cnJlbnRWYWx1ZTogbnVtYmVyKTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJU291bmRBdHRyaWJ1dGVzIHtcbiAgICBzb3VyY2VzOiAoSVNvdW5kU291cmNlIHwgc3RyaW5nKVtdIHwgc3RyaW5nO1xuICAgIGlkOiBudW1iZXI7XG4gICAgcGxheWxpc3RJZD86IG51bWJlciB8IG51bGw7XG4gICAgbG9vcD86IGJvb2xlYW47XG4gICAgb25Mb2FkaW5nPzogSU9uUHJvZ3Jlc3M7XG4gICAgb25QbGF5aW5nPzogSU9uUHJvZ3Jlc3M7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVNvdW5kIGV4dGVuZHMgSVJlcXVlc3RlZCwgSVNvdW5kQXR0cmlidXRlcyB7XG4gICAgc291cmNlTm9kZTogQXVkaW9CdWZmZXJTb3VyY2VOb2RlIHwgbnVsbDtcbiAgICBpc0J1ZmZlcmVkOiBib29sZWFuO1xuICAgIGlzQnVmZmVyaW5nOiBib29sZWFuO1xuICAgIGF1ZGlvQnVmZmVyOiBBdWRpb0J1ZmZlciB8IG51bGw7XG4gICAgYXJyYXlCdWZmZXI6IEFycmF5QnVmZmVyIHwgbnVsbDtcbiAgICBhdWRpb0J1ZmZlckRhdGU6IERhdGUgfCBudWxsO1xuICAgIHBsYXlUaW1lT2Zmc2V0OiBudW1iZXI7XG4gICAgc3RhcnRUaW1lOiBudW1iZXI7XG4gICAgcGxheVRpbWU6IG51bWJlcjtcbiAgICBwbGF5ZWRUaW1lUGVyY2VudGFnZTogbnVtYmVyO1xuICAgIGlzUGxheWluZzogYm9vbGVhbjtcbiAgICBzb3VyY2VzOiAoSVNvdW5kU291cmNlIHwgc3RyaW5nKVtdO1xuICAgIGNvZGVjOiBzdHJpbmcgfCBudWxsO1xuICAgIGR1cmF0aW9uOiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSU9wdGlvbnMge1xuXG59XG5cbmV4cG9ydCBjbGFzcyBQbGF5ZXJTb3VuZCBpbXBsZW1lbnRzIElTb3VuZCB7XG5cbiAgICBwdWJsaWMgc291cmNlczogKElTb3VuZFNvdXJjZSB8IHN0cmluZylbXTtcbiAgICBwdWJsaWMgaWQ6IG51bWJlcjtcbiAgICBwdWJsaWMgcGxheWxpc3RJZDogbnVtYmVyIHwgbnVsbDtcbiAgICBwdWJsaWMgbG9vcDogYm9vbGVhbjtcbiAgICBwdWJsaWMgdXJsOiBzdHJpbmc7XG5cbiAgICBwdWJsaWMgc291cmNlTm9kZTogQXVkaW9CdWZmZXJTb3VyY2VOb2RlIHwgbnVsbDtcbiAgICBwdWJsaWMgaXNCdWZmZXJlZDogYm9vbGVhbjtcbiAgICBwdWJsaWMgaXNCdWZmZXJpbmc6IGJvb2xlYW47XG4gICAgcHVibGljIGF1ZGlvQnVmZmVyOiBBdWRpb0J1ZmZlciB8IG51bGw7XG4gICAgcHVibGljIGFycmF5QnVmZmVyOiBBcnJheUJ1ZmZlciB8IG51bGw7XG4gICAgcHVibGljIGF1ZGlvQnVmZmVyRGF0ZTogRGF0ZSB8IG51bGw7XG4gICAgcHVibGljIHBsYXlUaW1lT2Zmc2V0OiBudW1iZXI7XG4gICAgcHVibGljIHN0YXJ0VGltZTogbnVtYmVyO1xuICAgIHB1YmxpYyBwbGF5VGltZTogbnVtYmVyO1xuICAgIHB1YmxpYyBwbGF5ZWRUaW1lUGVyY2VudGFnZTogbnVtYmVyO1xuICAgIHB1YmxpYyBpc1BsYXlpbmc6IGJvb2xlYW47XG4gICAgcHVibGljIGxvYWRpbmdQcm9ncmVzczogbnVtYmVyO1xuICAgIHB1YmxpYyBjb2RlYzogc3RyaW5nO1xuICAgIHB1YmxpYyBkdXJhdGlvbjogbnVtYmVyO1xuXG4gICAgcHVibGljIG9uTG9hZGluZzogSU9uUHJvZ3Jlc3M7XG4gICAgcHVibGljIG9uUGxheWluZzogSU9uUHJvZ3Jlc3M7XG5cbiAgICBjb25zdHJ1Y3Rvcihzb3VuZEF0dHJpYnV0ZXM6IElTb3VuZEF0dHJpYnV0ZXMpIHtcblxuICAgICAgICAvLyB1c2VyIHByb3ZpZGVkIHZhbHVlc1xuICAgICAgICBpZiAodHlwZW9mIHNvdW5kQXR0cmlidXRlcy5zb3VyY2VzID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhpcy5zb3VyY2VzID0gW3NvdW5kQXR0cmlidXRlcy5zb3VyY2VzXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc291cmNlcyA9IHNvdW5kQXR0cmlidXRlcy5zb3VyY2VzO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5pZCA9IHNvdW5kQXR0cmlidXRlcy5pZDtcbiAgICAgICAgdGhpcy5wbGF5bGlzdElkID0gc291bmRBdHRyaWJ1dGVzLnBsYXlsaXN0SWQgfHwgbnVsbDtcbiAgICAgICAgdGhpcy5sb29wID0gc291bmRBdHRyaWJ1dGVzLmxvb3AgfHwgZmFsc2U7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBzb3VuZEF0dHJpYnV0ZXMub25Mb2FkaW5nID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0aGlzLm9uTG9hZGluZyA9IHNvdW5kQXR0cmlidXRlcy5vbkxvYWRpbmc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLm9uTG9hZGluZyA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIHNvdW5kQXR0cmlidXRlcy5vblBsYXlpbmcgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRoaXMub25QbGF5aW5nID0gc291bmRBdHRyaWJ1dGVzLm9uUGxheWluZztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMub25QbGF5aW5nID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGRlZmF1bHQgdmFsdWVzXG4gICAgICAgIHRoaXMuc291cmNlTm9kZSA9IG51bGw7XG4gICAgICAgIHRoaXMuaXNCdWZmZXJlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmlzQnVmZmVyaW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMuYXVkaW9CdWZmZXIgPSBudWxsO1xuICAgICAgICB0aGlzLmF1ZGlvQnVmZmVyRGF0ZSA9IG51bGw7XG4gICAgICAgIHRoaXMucGxheVRpbWVPZmZzZXQgPSAwO1xuICAgICAgICB0aGlzLnN0YXJ0VGltZSA9IDA7XG4gICAgICAgIHRoaXMucGxheVRpbWUgPSAwO1xuICAgICAgICB0aGlzLnBsYXllZFRpbWVQZXJjZW50YWdlID0gMDtcbiAgICAgICAgdGhpcy5pc1BsYXlpbmcgPSBmYWxzZTtcblxuICAgIH1cblxufVxuIl19

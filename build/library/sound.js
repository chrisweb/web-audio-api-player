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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9saWJyYXJ5L3NvdW5kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0lBQ0EsWUFBWSxDQUFDO0lBcUNiO1FBcUJJLHFCQUFZLGVBQWlDO1lBRXpDLHVCQUF1QjtZQUN2QixFQUFFLENBQUMsQ0FBQyxPQUFPLGVBQWUsQ0FBQyxPQUFPLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQztnQkFDOUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM3QyxDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ0osSUFBSSxDQUFDLE9BQU8sR0FBRyxlQUFlLENBQUMsT0FBTyxDQUFDO1lBQzNDLENBQUM7WUFFRCxJQUFJLENBQUMsRUFBRSxHQUFHLGVBQWUsQ0FBQyxFQUFFLENBQUM7WUFDN0IsSUFBSSxDQUFDLFVBQVUsR0FBRyxlQUFlLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQztZQUNyRCxJQUFJLENBQUMsSUFBSSxHQUFHLGVBQWUsQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDO1lBRTFDLGlCQUFpQjtZQUNqQixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztZQUN2QixJQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztZQUN4QixJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztZQUN6QixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztZQUN4QixJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQztZQUM1QixJQUFJLENBQUMsY0FBYyxHQUFHLENBQUMsQ0FBQztZQUN4QixJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQztZQUNuQixJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQztZQUNsQixJQUFJLENBQUMsb0JBQW9CLEdBQUcsQ0FBQyxDQUFDO1lBQzlCLElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO1FBRTNCLENBQUM7UUFFTCxrQkFBQztJQUFELENBaERBLEFBZ0RDLElBQUE7SUFoRFksa0NBQVciLCJmaWxlIjoibGlicmFyeS9zb3VuZC5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBJUmVxdWVzdGVkIH0gZnJvbSAnLi9yZXF1ZXN0JztcbmltcG9ydCB7IFBsYXllckVycm9yLCBJUGxheWVyRXJyb3IgfSBmcm9tICcuL2Vycm9yJztcbmltcG9ydCB7IElBdWRpb0dyYXBoIH0gZnJvbSAnLi9hdWRpbyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVNvdW5kU291cmNlIHtcbiAgICB1cmw6IHN0cmluZztcbiAgICBjb2RlYz86IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJU291bmRBdHRyaWJ1dGVzIHtcbiAgICBzb3VyY2VzOiAoSVNvdW5kU291cmNlIHwgc3RyaW5nKVtdIHwgc3RyaW5nO1xuICAgIGlkOiBudW1iZXI7XG4gICAgcGxheWxpc3RJZD86IG51bWJlciB8IG51bGw7XG4gICAgbG9vcD86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVNvdW5kIGV4dGVuZHMgSVJlcXVlc3RlZCwgSVNvdW5kQXR0cmlidXRlcyB7XG4gICAgc291cmNlTm9kZTogQXVkaW9CdWZmZXJTb3VyY2VOb2RlIHwgbnVsbDtcbiAgICBpc0J1ZmZlcmVkOiBib29sZWFuO1xuICAgIGlzQnVmZmVyaW5nOiBib29sZWFuO1xuICAgIGF1ZGlvQnVmZmVyOiBBdWRpb0J1ZmZlciB8IG51bGw7XG4gICAgYXVkaW9CdWZmZXJEYXRlOiBEYXRlIHwgbnVsbDtcbiAgICBwbGF5VGltZU9mZnNldDogbnVtYmVyO1xuICAgIHN0YXJ0VGltZTogbnVtYmVyO1xuICAgIHBsYXlUaW1lOiBudW1iZXI7XG4gICAgcGxheWVkVGltZVBlcmNlbnRhZ2U6IG51bWJlcjtcbiAgICBpc1BsYXlpbmc6IGJvb2xlYW47XG4gICAgc291cmNlczogKElTb3VuZFNvdXJjZSB8IHN0cmluZylbXTtcbiAgICBjb2RlYzogc3RyaW5nIHwgbnVsbDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJT3B0aW9ucyB7XG5cbn1cblxuZXhwb3J0IGNsYXNzIFBsYXllclNvdW5kIGltcGxlbWVudHMgSVNvdW5kIHtcblxuICAgIHB1YmxpYyBzb3VyY2VzOiAoSVNvdW5kU291cmNlIHwgc3RyaW5nKVtdO1xuICAgIHB1YmxpYyBpZDogbnVtYmVyO1xuICAgIHB1YmxpYyBwbGF5bGlzdElkOiBudW1iZXIgfCBudWxsO1xuICAgIHB1YmxpYyBsb29wOiBib29sZWFuO1xuICAgIHB1YmxpYyB1cmw6IHN0cmluZztcblxuICAgIHB1YmxpYyBzb3VyY2VOb2RlOiBBdWRpb0J1ZmZlclNvdXJjZU5vZGUgfCBudWxsO1xuICAgIHB1YmxpYyBpc0J1ZmZlcmVkOiBib29sZWFuO1xuICAgIHB1YmxpYyBpc0J1ZmZlcmluZzogYm9vbGVhbjtcbiAgICBwdWJsaWMgYXVkaW9CdWZmZXI6IEF1ZGlvQnVmZmVyIHwgbnVsbDtcbiAgICBwdWJsaWMgYXVkaW9CdWZmZXJEYXRlOiBEYXRlIHwgbnVsbDtcbiAgICBwdWJsaWMgcGxheVRpbWVPZmZzZXQ6IG51bWJlcjtcbiAgICBwdWJsaWMgc3RhcnRUaW1lOiBudW1iZXI7XG4gICAgcHVibGljIHBsYXlUaW1lOiBudW1iZXI7XG4gICAgcHVibGljIHBsYXllZFRpbWVQZXJjZW50YWdlOiBudW1iZXI7XG4gICAgcHVibGljIGlzUGxheWluZzogYm9vbGVhbjtcbiAgICBwdWJsaWMgbG9hZGluZ1Byb2dyZXNzOiBudW1iZXI7XG4gICAgcHVibGljIGNvZGVjOiBzdHJpbmc7XG5cbiAgICBjb25zdHJ1Y3Rvcihzb3VuZEF0dHJpYnV0ZXM6IElTb3VuZEF0dHJpYnV0ZXMpIHtcblxuICAgICAgICAvLyB1c2VyIHByb3ZpZGVkIHZhbHVlc1xuICAgICAgICBpZiAodHlwZW9mIHNvdW5kQXR0cmlidXRlcy5zb3VyY2VzID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhpcy5zb3VyY2VzID0gW3NvdW5kQXR0cmlidXRlcy5zb3VyY2VzXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc291cmNlcyA9IHNvdW5kQXR0cmlidXRlcy5zb3VyY2VzO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5pZCA9IHNvdW5kQXR0cmlidXRlcy5pZDtcbiAgICAgICAgdGhpcy5wbGF5bGlzdElkID0gc291bmRBdHRyaWJ1dGVzLnBsYXlsaXN0SWQgfHwgbnVsbDtcbiAgICAgICAgdGhpcy5sb29wID0gc291bmRBdHRyaWJ1dGVzLmxvb3AgfHwgZmFsc2U7XG5cbiAgICAgICAgLy8gZGVmYXVsdCB2YWx1ZXNcbiAgICAgICAgdGhpcy5zb3VyY2VOb2RlID0gbnVsbDtcbiAgICAgICAgdGhpcy5pc0J1ZmZlcmVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaXNCdWZmZXJpbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5hdWRpb0J1ZmZlciA9IG51bGw7XG4gICAgICAgIHRoaXMuYXVkaW9CdWZmZXJEYXRlID0gbnVsbDtcbiAgICAgICAgdGhpcy5wbGF5VGltZU9mZnNldCA9IDA7XG4gICAgICAgIHRoaXMuc3RhcnRUaW1lID0gMDtcbiAgICAgICAgdGhpcy5wbGF5VGltZSA9IDA7XG4gICAgICAgIHRoaXMucGxheWVkVGltZVBlcmNlbnRhZ2UgPSAwO1xuICAgICAgICB0aGlzLmlzUGxheWluZyA9IGZhbHNlO1xuXG4gICAgfVxuXG59XG4iXX0=

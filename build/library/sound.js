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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9idWlsZC9zb3VyY2UvbGlicmFyeS9zb3VuZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7OztJQUNBLFlBQVksQ0FBQztJQW1DYjtRQW9CSSxxQkFBWSxlQUFpQztZQUV6Qyx1QkFBdUI7WUFDdkIsRUFBRSxDQUFDLENBQUMsT0FBTyxlQUFlLENBQUMsT0FBTyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0JBQzlDLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDN0MsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNKLElBQUksQ0FBQyxPQUFPLEdBQUcsZUFBZSxDQUFDLE9BQU8sQ0FBQztZQUMzQyxDQUFDO1lBRUQsSUFBSSxDQUFDLEVBQUUsR0FBRyxlQUFlLENBQUMsRUFBRSxDQUFDO1lBQzdCLElBQUksQ0FBQyxVQUFVLEdBQUcsZUFBZSxDQUFDLFVBQVUsSUFBSSxJQUFJLENBQUM7WUFDckQsSUFBSSxDQUFDLElBQUksR0FBRyxlQUFlLENBQUMsSUFBSSxJQUFJLEtBQUssQ0FBQztZQUUxQyxpQkFBaUI7WUFDakIsSUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7WUFDeEIsSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7WUFDekIsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7WUFDeEIsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7WUFDNUIsSUFBSSxDQUFDLGNBQWMsR0FBRyxDQUFDLENBQUM7WUFDeEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7WUFDbkIsSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUM7WUFDbEIsSUFBSSxDQUFDLG9CQUFvQixHQUFHLENBQUMsQ0FBQztZQUM5QixJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztRQUUzQixDQUFDO1FBRUwsa0JBQUM7SUFBRCxDQTlDQSxBQThDQyxJQUFBO0lBOUNZLGtDQUFXIiwiZmlsZSI6ImxpYnJhcnkvc291bmQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgSVJlcXVlc3RlZCB9IGZyb20gJy4vcmVxdWVzdCc7XG5pbXBvcnQgeyBQbGF5ZXJFcnJvciwgSVBsYXllckVycm9yIH0gZnJvbSAnLi9lcnJvcic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVNvdW5kU291cmNlIHtcbiAgICB1cmw6IHN0cmluZztcbiAgICBjb2RlYz86IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJU291bmRBdHRyaWJ1dGVzIHtcbiAgICBzb3VyY2VzOiAoSVNvdW5kU291cmNlIHwgc3RyaW5nKVtdIHwgc3RyaW5nO1xuICAgIGlkOiBudW1iZXI7XG4gICAgcGxheWxpc3RJZD86IG51bWJlciB8IG51bGw7XG4gICAgbG9vcD86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVNvdW5kIGV4dGVuZHMgSVJlcXVlc3RlZCwgSVNvdW5kQXR0cmlidXRlcyB7XG4gICAgaXNCdWZmZXJlZDogYm9vbGVhbjtcbiAgICBpc0J1ZmZlcmluZzogYm9vbGVhbjtcbiAgICBhdWRpb0J1ZmZlcjogQXVkaW9CdWZmZXIgfCBudWxsO1xuICAgIGF1ZGlvQnVmZmVyRGF0ZTogRGF0ZSB8IG51bGw7XG4gICAgcGxheVRpbWVPZmZzZXQ6IG51bWJlcjtcbiAgICBzdGFydFRpbWU6IG51bWJlcjtcbiAgICBwbGF5VGltZTogbnVtYmVyO1xuICAgIHBsYXllZFRpbWVQZXJjZW50YWdlOiBudW1iZXI7XG4gICAgaXNQbGF5aW5nOiBib29sZWFuO1xuICAgIHNvdXJjZXM6IChJU291bmRTb3VyY2UgfCBzdHJpbmcpW107XG4gICAgY29kZWM6IHN0cmluZyB8IG51bGw7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSU9wdGlvbnMge1xuXG59XG5cbmV4cG9ydCBjbGFzcyBQbGF5ZXJTb3VuZCBpbXBsZW1lbnRzIElTb3VuZCB7XG5cbiAgICBwdWJsaWMgc291cmNlczogKElTb3VuZFNvdXJjZSB8IHN0cmluZylbXTtcbiAgICBwdWJsaWMgaWQ6IG51bWJlcjtcbiAgICBwdWJsaWMgcGxheWxpc3RJZDogbnVtYmVyIHwgbnVsbDtcbiAgICBwdWJsaWMgbG9vcDogYm9vbGVhbjtcbiAgICBwdWJsaWMgdXJsOiBzdHJpbmc7XG5cbiAgICBwdWJsaWMgaXNCdWZmZXJlZDogYm9vbGVhbjtcbiAgICBwdWJsaWMgaXNCdWZmZXJpbmc6IGJvb2xlYW47XG4gICAgcHVibGljIGF1ZGlvQnVmZmVyOiBBdWRpb0J1ZmZlciB8IG51bGw7XG4gICAgcHVibGljIGF1ZGlvQnVmZmVyRGF0ZTogRGF0ZSB8IG51bGw7XG4gICAgcHVibGljIHBsYXlUaW1lT2Zmc2V0OiBudW1iZXI7XG4gICAgcHVibGljIHN0YXJ0VGltZTogbnVtYmVyO1xuICAgIHB1YmxpYyBwbGF5VGltZTogbnVtYmVyO1xuICAgIHB1YmxpYyBwbGF5ZWRUaW1lUGVyY2VudGFnZTogbnVtYmVyO1xuICAgIHB1YmxpYyBpc1BsYXlpbmc6IGJvb2xlYW47XG4gICAgcHVibGljIGxvYWRpbmdQcm9ncmVzczogbnVtYmVyO1xuICAgIHB1YmxpYyBjb2RlYzogc3RyaW5nO1xuXG4gICAgY29uc3RydWN0b3Ioc291bmRBdHRyaWJ1dGVzOiBJU291bmRBdHRyaWJ1dGVzKSB7XG5cbiAgICAgICAgLy8gdXNlciBwcm92aWRlZCB2YWx1ZXNcbiAgICAgICAgaWYgKHR5cGVvZiBzb3VuZEF0dHJpYnV0ZXMuc291cmNlcyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRoaXMuc291cmNlcyA9IFtzb3VuZEF0dHJpYnV0ZXMuc291cmNlc107XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNvdXJjZXMgPSBzb3VuZEF0dHJpYnV0ZXMuc291cmNlcztcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaWQgPSBzb3VuZEF0dHJpYnV0ZXMuaWQ7XG4gICAgICAgIHRoaXMucGxheWxpc3RJZCA9IHNvdW5kQXR0cmlidXRlcy5wbGF5bGlzdElkIHx8IG51bGw7XG4gICAgICAgIHRoaXMubG9vcCA9IHNvdW5kQXR0cmlidXRlcy5sb29wIHx8IGZhbHNlO1xuXG4gICAgICAgIC8vIGRlZmF1bHQgdmFsdWVzXG4gICAgICAgIHRoaXMuaXNCdWZmZXJlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmlzQnVmZmVyaW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMuYXVkaW9CdWZmZXIgPSBudWxsO1xuICAgICAgICB0aGlzLmF1ZGlvQnVmZmVyRGF0ZSA9IG51bGw7XG4gICAgICAgIHRoaXMucGxheVRpbWVPZmZzZXQgPSAwO1xuICAgICAgICB0aGlzLnN0YXJ0VGltZSA9IDA7XG4gICAgICAgIHRoaXMucGxheVRpbWUgPSAwO1xuICAgICAgICB0aGlzLnBsYXllZFRpbWVQZXJjZW50YWdlID0gMDtcbiAgICAgICAgdGhpcy5pc1BsYXlpbmcgPSBmYWxzZTtcblxuICAgIH1cblxufVxuIl19

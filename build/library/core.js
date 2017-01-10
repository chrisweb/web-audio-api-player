(function (dependencies, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(dependencies, factory);
    }
})(["require", "exports", "./sound", "./audio", "./request"], function (require, exports) {
    'use strict';
    var sound_1 = require("./sound");
    var audio_1 = require("./audio");
    var request_1 = require("./request");
    var PlayerCore = (function () {
        function PlayerCore(options) {
            if (options === void 0) { options = {
                volume: 80,
                loopQueue: false,
                soundsBaseUrl: ''
            }; }
            // constants
            this.WHERE_IN_QUEUE_AT_END = 'append';
            this.WHERE_IN_QUEUE_AT_START = 'prepend';
            this.WHERE_IN_QUEUE_AFTER_CURRENT = 'afterCurrent';
            this.PLAY_SOUND_NEXT = 'next';
            this.PLAY_SOUND_PREVIOUS = 'previous';
            this.PLAY_SOUND_FIRST = 'first';
            this.PLAY_SOUND_LAST = 'last';
            this._volume = options.volume;
            this._soundsBaseUrl = options.soundsBaseUrl;
            this._queue = [];
            this._currentIndex = 0;
            this._initialize();
        }
        PlayerCore.prototype._initialize = function () {
            // TODO: check if web audio api is available
            var webAudioApi = true;
            if (webAudioApi) {
                this._isWebAudioApiSupported = true;
            }
            else {
                // use the html5 audio element
                this._isWebAudioApiSupported = false;
            }
            // TODO: initialize the audio graph when initializing the player
            // suspend the audio context while not playing any sound?
            this._playerAudio = new audio_1.PlayerAudio();
            this._audioGraph = this._playerAudio.createAudioGraph();
        };
        PlayerCore.prototype.addSoundToQueue = function (soundAttributes, whereInQueue) {
            if (whereInQueue === void 0) { whereInQueue = this.WHERE_IN_QUEUE_AT_END; }
            var sound = new sound_1.PlayerSound(soundAttributes);
            // TODO: is queue just an array of sounds, or do we need something more complex with a position tracker?
            // TODO: allow array of soundAttributes to be injected, to create several at once, if input is an array output should be too
            switch (whereInQueue) {
                case this.WHERE_IN_QUEUE_AT_END:
                    this._appendSoundToQueue(sound);
                    break;
                case this.WHERE_IN_QUEUE_AT_START:
                    this._prependSoundToQueue(sound);
                    break;
                case this.WHERE_IN_QUEUE_AFTER_CURRENT:
                    this._prependSoundToQueue(sound);
                    break;
            }
            return sound;
        };
        PlayerCore.prototype._appendSoundToQueue = function (sound) {
            this._queue.push(sound);
        };
        PlayerCore.prototype._prependSoundToQueue = function (sound) {
            this._queue.unshift(sound);
        };
        PlayerCore.prototype._addSoundToQueueAfterCurrent = function (sound) {
            // TODO: add option to play after being added or user uses play method?
            var afterCurrentIndex = this._currentIndex + 1;
            this._queue.splice(afterCurrentIndex, 0, sound);
        };
        PlayerCore.prototype.resetQueue = function () {
            this._queue = [];
            this._queueIndex = 0;
            // TODO: check if a song is getting played and stop it
        };
        /*public getQueue() {
    
            // TODO: is the needed?
    
            return this._queue;
    
        }*/
        PlayerCore.prototype.setVolume = function (volume) {
            this._volume = volume;
            // https://developer.mozilla.org/en-US/docs/Web/API/GainNode
            //this._audioGraph.gainNode.value = this._volume / 100;
        };
        PlayerCore.prototype.getVolume = function () {
            return this._volume;
        };
        PlayerCore.prototype.setPlaybackRate = function (playbackRate) {
            // < 1 slower, > 1 faster playback
            //this._audioGraph.sourceNode.setPlaybackRate(playbackRate);
        };
        ;
        PlayerCore.prototype.getPlaybackRate = function () {
            //return this._audioGraph.sourceNode.playbackRate;
            return 0;
        };
        ;
        PlayerCore.prototype.resetPlaybackRate = function () {
        };
        PlayerCore.prototype.setPanner = function (left, right) {
            // https://developer.mozilla.org/en-US/docs/Web/API/PannerNode
            //this.audioGraph.pannerNode.setPosition(0, 0, 0);
        };
        ;
        PlayerCore.prototype.getPanner = function () {
            //return this.audioGraph.pannerNode.getPosition();
            return { left: 0, right: 0 };
        };
        ;
        PlayerCore.prototype.resetPanner = function () {
        };
        PlayerCore.prototype.play = function (whichSound) {
            // TODO: check the available codecs and defined sources, play the first one that has matches and available codec
            // TODO: let user define order of preferred codecs for playerback
            var _this = this;
            // check if the queue is empty
            if (this._queue.length === 0) {
            }
            // whichSound is optional, if set it can be the id of the sound or next / previous / first / last
            var sound = this._getSoundFromQueue(whichSound);
            // extract the url and codec from sources
            var _a = this._sourceToVariables(sound.sources), url = _a.url, _b = _a.codec, codec = _b === void 0 ? null : _b;
            sound.url = url;
            sound.codec = codec;
            // TODO: would be good to cache buffers, so need to check if is in cache
            // let the user choose (by setting an option) what amount of sounds will be cached
            // add a cached date / timestamp to be able to clear cache by oldest first
            // or even better add a played counter to cache by least played and date
            if (sound.url !== null) {
                var request = new request_1.PlayerRequest();
                // change buffering state
                sound.isBuffering = true;
                request.getArrayBuffer(sound).then(function (arrayBuffer) {
                    _this._playerAudio.decodeAudio(arrayBuffer).then(function (audioBuffer) {
                        sound.audioBuffer = audioBuffer;
                        sound.isBuffering = false;
                        sound.isBuffered = true;
                        sound.audioBufferDate = new Date();
                        _this._startPlaying(sound);
                    }).catch(function (decodeAudioError) {
                        // TODO: handle error decodeAudioError
                    });
                }).catch(function (requestError) {
                    // TODO: handle error requestError
                });
            }
            else {
            }
        };
        PlayerCore.prototype._startPlaying = function (sound) {
            this._audioGraph.sourceNode.buffer = sound.audioBuffer;
            // the audiocontext time right now (since the audiocontext got created)
            sound.startTime = this._audioGraph.sourceNode.context.currentTime;
            this._audioGraph.sourceNode.start(0, sound.playTimeOffset);
            sound.isPlaying = true;
        };
        PlayerCore.prototype._getSoundFromQueue = function (whichSound) {
            var _this = this;
            var sound = null;
            // if which song to play did not get specified, play one based from the queue based on the queue index position marker
            if (whichSound === undefined && this._queue[this._currentIndex] !== undefined) {
                sound = this._queue[this._currentIndex];
            }
            else if (typeof whichSound === 'number') {
                // if which song to play is a song ID
                var foundInArray = this._queue.some(function (soundFromQueue, queueIndex) {
                    if (soundFromQueue.id === whichSound) {
                        sound = soundFromQueue;
                        _this._currentIndex = queueIndex;
                        return true;
                    }
                });
            }
            else {
                // if which song to play is a constant
                switch (whichSound) {
                    case this.PLAY_SOUND_NEXT:
                        if (this._queue[this._currentIndex + 1] !== undefined) {
                            this._currentIndex = this._currentIndex + 1;
                        }
                        break;
                    case this.PLAY_SOUND_PREVIOUS:
                        if (this._queue[this._currentIndex - 1] !== undefined) {
                            this._currentIndex = this._currentIndex + 1;
                        }
                        break;
                    case this.PLAY_SOUND_FIRST:
                        if (this._queue.length > 0) {
                            this._currentIndex = 0;
                        }
                        break;
                    case this.PLAY_SOUND_LAST:
                        if (this._queue.length > 0) {
                            this._currentIndex = this._queue.length - 1;
                        }
                        break;
                }
                sound = this._queue[this._currentIndex];
            }
            return sound;
        };
        PlayerCore.prototype._sourceToVariables = function (sources) {
            // TODO: source can be on object where the property name is the codec and the value is the sound url
            // if sound isnt an object try to detect sound source extension by file extention or by checking the file mime type
            var _this = this;
            // TODO: get a list of supported codecs by this device
            var firstMatchingSource = {
                url: null,
                codec: null
            };
            sources.forEach(function (source) {
                // TODO: find out what the source codec is
                // TODO: check if the source codec is among the ones that are supported by this device
                //if () {
                var soundUrl = '';
                // if the player had as option a baseUrl for sounds add it now
                if (_this._soundsBaseUrl !== '') {
                    soundUrl = _this._soundsBaseUrl;
                }
                // two kind of source are possible, a string (the url) or an object (key is the codec and value is the url)
                if (typeof source === 'string') {
                    soundUrl += source;
                    firstMatchingSource = {
                        url: soundUrl
                    };
                }
                else {
                    soundUrl += source.url;
                    firstMatchingSource = {
                        url: soundUrl,
                        codec: source.codec
                    };
                }
            });
            return firstMatchingSource;
        };
        PlayerCore.prototype.pause = function () {
            // TODO: do we ctx.suspend() and resume the context on pause to free device resources?
            var sound = this._getSoundFromQueue();
            var timeAtPause = this._audioGraph.sourceNode.context.currentTime;
            sound.playTimeOffset += timeAtPause - sound.startTime;
            this._stopPlaying();
        };
        PlayerCore.prototype.stop = function () {
            // stop placeholder
            // TODO: do we need a stop method (or is pause enough)
        };
        PlayerCore.prototype._stopPlaying = function () {
            this._audioGraph.sourceNode.stop(0);
        };
        PlayerCore.prototype.next = function () {
            // TODO: add aliases for play('next') / previous / first / last?
        };
        return PlayerCore;
    }());
    exports.PlayerCore = PlayerCore;
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9idWlsZC9zb3VyY2UvbGlicmFyeS9jb3JlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0lBQ0EsWUFBWSxDQUFDO0lBRWIsaUNBQThFO0lBQzlFLGlDQUFtRDtJQUNuRCxxQ0FBMEM7SUFTMUM7UUFrQ0ksb0JBQVksT0FJWDtZQUpXLHdCQUFBLEVBQUE7Z0JBQ1IsTUFBTSxFQUFFLEVBQUU7Z0JBQ1YsU0FBUyxFQUFFLEtBQUs7Z0JBQ2hCLGFBQWEsRUFBRSxFQUFFO2FBQ3BCO1lBZEQsWUFBWTtZQUNILDBCQUFxQixHQUFXLFFBQVEsQ0FBQztZQUN6Qyw0QkFBdUIsR0FBVyxTQUFTLENBQUM7WUFDNUMsaUNBQTRCLEdBQVcsY0FBYyxDQUFDO1lBRXRELG9CQUFlLEdBQUcsTUFBTSxDQUFDO1lBQ3pCLHdCQUFtQixHQUFHLFVBQVUsQ0FBQztZQUNqQyxxQkFBZ0IsR0FBRyxPQUFPLENBQUM7WUFDM0Isb0JBQWUsR0FBRyxNQUFNLENBQUM7WUFROUIsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO1lBQzlCLElBQUksQ0FBQyxjQUFjLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQztZQUM1QyxJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztZQUNqQixJQUFJLENBQUMsYUFBYSxHQUFHLENBQUMsQ0FBQztZQUV2QixJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFFdkIsQ0FBQztRQUVTLGdDQUFXLEdBQXJCO1lBRUksNENBQTRDO1lBQzVDLElBQUksV0FBVyxHQUFHLElBQUksQ0FBQztZQUV2QixFQUFFLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO2dCQUVkLElBQUksQ0FBQyx1QkFBdUIsR0FBRyxJQUFJLENBQUM7WUFFeEMsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUVKLDhCQUE4QjtnQkFDOUIsSUFBSSxDQUFDLHVCQUF1QixHQUFHLEtBQUssQ0FBQztZQUV6QyxDQUFDO1lBRUQsZ0VB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TSxDQUFDLEtBQUs7cUJBQ3RCLENBQUM7Z0JBRU4sQ0FBQztZQUVMLENBQUMsQ0FBQyxDQUFDO1lBRUgsTUFBTSxDQUFDLG1CQUFtQixDQUFDO1FBRS9CLENBQUM7UUFFTSwwQkFBSyxHQUFaO1lBRUksc0ZBQXNGO1lBRXRGLElBQUksS0FBSyxHQUFrQixJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztZQUVyRCxJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDO1lBRWxFLEtBQUssQ0FBQyxjQUFjLElBQUksV0FBVyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUM7WUFFdEQsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBRXhCLENBQUM7UUFFTSx5QkFBSSxHQUFYO1lBRUksbUJBQW1CO1lBQ25CLHNEQUFzRDtRQUUxRCxDQUFDO1FBRVMsaUNBQVksR0FBdEI7WUFFSSxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFeEMsQ0FBQztRQUVNLHlCQUFJLEdBQVg7WUFFSSxnRUFBZ0U7UUFFcEUsQ0FBQztRQWdHTCxpQkFBQztJQUFELENBamdCQSxBQWlnQkMsSUFBQTtJQWpnQlksZ0NBQVUiLCJmaWxlIjoibGlicmFyeS9jb3JlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IFBsYXllclNvdW5kLCBJU291bmQsIElTb3VuZEF0dHJpYnV0ZXMsIElTb3VuZFNvdXJjZSB9IGZyb20gJy4vc291bmQnO1xuaW1wb3J0IHsgUGxheWVyQXVkaW8sIElBdWRpb0dyYXBoIH0gZnJvbSAnLi9hdWRpbyc7XG5pbXBvcnQgeyBQbGF5ZXJSZXF1ZXN0IH0gZnJvbSAnLi9yZXF1ZXN0JztcbmltcG9ydCB7IFBsYXllckVycm9yLCBJUGxheWVyRXJyb3IgfSBmcm9tICcuL2Vycm9yJztcblxuZXhwb3J0IGludGVyZmFjZSBJQ29yZU9wdGlvbnMge1xuICAgIHZvbHVtZT86IG51bWJlcjtcbiAgICBsb29wUXVldWU/OiBib29sZWFuO1xuICAgIHNvdW5kc0Jhc2VVcmw/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBQbGF5ZXJDb3JlIHtcblxuICAgIC8vIGlzIHRoZSB3ZWIgYXVkaW8gQVBJIHN1cHBvcnRlZFxuICAgIHByb3RlY3RlZCBfaXNXZWJBdWRpb0FwaVN1cHBvcnRlZDogYm9vbGVhbjtcbiAgICAvLyB0aGUgc291bmRzIHF1ZXVlXG4gICAgcHJvdGVjdGVkIF9xdWV1ZTogSVNvdW5kW107XG4gICAgLy8gdGhlIHF1ZXVlIGluZGV4IG9mIHRoZSBzb25nIHRvIHBsYXkgaWYgbm9uZSBnb3QgZGVmaW5lZCBcbiAgICBwcm90ZWN0ZWQgX3F1ZXVlSW5kZXg6IG51bWJlcjtcbiAgICAvLyB0aGUgdm9sdW1lICgwIHRvIDEwMClcbiAgICBwcm90ZWN0ZWQgX3ZvbHVtZTogbnVtYmVyO1xuICAgIC8vIHRoZSBiYXNlIHVybCB0aGF0IGFsbCBzb3VuZHMgd2lsbCBoYXZlIGluIGNvbW1vblxuICAgIHByb3RlY3RlZCBfc291bmRzQmFzZVVybDogc3RyaW5nO1xuICAgIC8vIHRoZSBjdXJyZW50IHNvdW5kIGluIHF1ZXVlIGluZGV4XG4gICAgcHJvdGVjdGVkIF9jdXJyZW50SW5kZXg6IG51bWJlcjtcbiAgICAvLyBpbnN0YW5jZSBvZiB0aGUgYXVkaW8gbGlicmFyeSBjbGFzc1xuICAgIHByb3RlY3RlZCBfcGxheWVyQXVkaW86IFBsYXllckF1ZGlvO1xuICAgIC8vIGN1c3RvbSBhdWRpbyBncmFwaFxuICAgIHByb3RlY3RlZCBfYXVkaW9HcmFwaDogSUF1ZGlvR3JhcGg7XG5cbiAgICAvLyBjYWxsYmFjayBob29rc1xuICAgIHB1YmxpYyBvblBsYXlTdGFydDogKCkgPT4gdm9pZDtcbiAgICBwdWJsaWMgb25QbGF5aW5nOiAoKSA9PiB2b2lkO1xuICAgIHB1YmxpYyBvbkJ1ZmZlcmluZzogKCkgPT4gdm9pZDtcblxuICAgIC8vIGNvbnN0YW50c1xuICAgIHJlYWRvbmx5IFdIRVJFX0lOX1FVRVVFX0FUX0VORDogc3RyaW5nID0gJ2FwcGVuZCc7XG4gICAgcmVhZG9ubHkgV0hFUkVfSU5fUVVFVUVfQVRfU1RBUlQ6IHN0cmluZyA9ICdwcmVwZW5kJztcbiAgICByZWFkb25seSBXSEVSRV9JTl9RVUVVRV9BRlRFUl9DVVJSRU5UOiBzdHJpbmcgPSAnYWZ0ZXJDdXJyZW50JztcblxuICAgIHJlYWRvbmx5IFBMQVlfU09VTkRfTkVYVCA9ICduZXh0JztcbiAgICByZWFkb25seSBQTEFZX1NPVU5EX1BSRVZJT1VTID0gJ3ByZXZpb3VzJztcbiAgICByZWFkb25seSBQTEFZX1NPVU5EX0ZJUlNUID0gJ2ZpcnN0JztcbiAgICByZWFkb25seSBQTEFZX1NPVU5EX0xBU1QgPSAnbGFzdCc7XG5cbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zOiBJQ29yZU9wdGlvbnMgPSB7XG4gICAgICAgIHZvbHVtZTogODAsXG4gICAgICAgIGxvb3BRdWV1ZTogZmFsc2UsXG4gICAgICAgIHNvdW5kc0Jhc2VVcmw6ICcnXG4gICAgfSkge1xuXG4gICAgICAgIHRoaXMuX3ZvbHVtZSA9IG9wdGlvbnMudm9sdW1lO1xuICAgICAgICB0aGlzLl9zb3VuZHNCYXNlVXJsID0gb3B0aW9ucy5zb3VuZHNCYXNlVXJsO1xuICAgICAgICB0aGlzLl9xdWV1ZSA9IFtdO1xuICAgICAgICB0aGlzLl9jdXJyZW50SW5kZXggPSAwO1xuXG4gICAgICAgIHRoaXMuX2luaXRpYWxpemUoKTtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfaW5pdGlhbGl6ZSgpIHtcblxuICAgICAgICAvLyBUT0RPOiBjaGVjayBpZiB3ZWIgYXVkaW8gYXBpIGlzIGF2YWlsYWJsZVxuICAgICAgICBsZXQgd2ViQXVkaW9BcGkgPSB0cnVlO1xuXG4gICAgICAgIGlmICh3ZWJBdWRpb0FwaSkge1xuXG4gICAgICAgICAgICB0aGlzLl9pc1dlYkF1ZGlvQXBpU3VwcG9ydGVkID0gdHJ1ZTtcblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAvLyB1c2UgdGhlIGh0bWw1IGF1ZGlvIGVsZW1lbnRcbiAgICAgICAgICAgIHRoaXMuX2lzV2ViQXVkaW9BcGlTdXBwb3J0ZWQgPSBmYWxzZTtcblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gVE9ETzogaW5pdGlhbGl6ZSB0aGUgYXVkaW8gZ3JhcGggd2hlbiBpbml0aWFsaXppbmcgdGhlIHBsYXllclxuICAgICAgICAvLyBzdXNwZW5kIHRoZSBhdWRpbyBjb250ZXh0IHdoaWxlIG5vdCBwbGF5aW5nIGFueSBzb3VuZD9cblxuICAgICAgICB0aGlzLl9wbGF5ZXJBdWRpbyA9IG5ldyBQbGF5ZXJBdWRpbygpO1xuXG4gICAgICAgIHRoaXMuX2F1ZGlvR3JhcGggPSB0aGlzLl9wbGF5ZXJBdWRpby5jcmVhdGVBdWRpb0dyYXBoKCk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgYWRkU291bmRUb1F1ZXVlKHNvdW5kQXR0cmlidXRlczogSVNvdW5kQXR0cmlidXRlcywgd2hlcmVJblF1ZXVlOiBzdHJpbmcgPSB0aGlzLldIRVJFX0lOX1FVRVVFX0FUX0VORCk6IElTb3VuZCB7XG5cbiAgICAgICAgbGV0IHNvdW5kOiBJU291bmQgPSBuZXcgUGxheWVyU291bmQoc291bmRBdHRyaWJ1dGVzKTtcblxuICAgICAgICAvLyBUT0RPOiBpcyBxdWV1ZSBqdXN0IGFuIGFycmF5IG9mIHNvdW5kcywgb3IgZG8gd2UgbmVlZCBzb21ldGhpbmcgbW9yZSBjb21wbGV4IHdpdGggYSBwb3NpdGlvbiB0cmFja2VyP1xuXG4gICAgICAgIC8vIFRPRE86IGFsbG93IGFycmF5IG9mIHNvdW5kQXR0cmlidXRlcyB0byBiZSBpbmplY3RlZCwgdG8gY3JlYXRlIHNldmVyYWwgYXQgb25jZSwgaWYgaW5wdXQgaXMgYW4gYXJyYXkgb3V0cHV0IHNob3VsZCBiZSB0b29cblxuICAgICAgICBzd2l0Y2ggKHdoZXJlSW5RdWV1ZSkge1xuICAgICAgICAgICAgY2FzZSB0aGlzLldIRVJFX0lOX1FVRVVFX0FUX0VORDpcbiAgICAgICAgICAgICAgICB0aGlzLl9hcHBlbmRTb3VuZFRvUXVldWUoc291bmQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSB0aGlzLldIRVJFX0lOX1FVRVVFX0FUX1NUQVJUOlxuICAgICAgICAgICAgICAgIHRoaXMuX3ByZXBlbmRTb3VuZFRvUXVldWUoc291bmQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSB0aGlzLldIRVJFX0lOX1FVRVVFX0FGVEVSX0NVUlJFTlQ6XG4gICAgICAgICAgICAgICAgdGhpcy5fcHJlcGVuZFNvdW5kVG9RdWV1ZShzb3VuZCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc291bmQ7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgX2FwcGVuZFNvdW5kVG9RdWV1ZShzb3VuZDogSVNvdW5kKTogdm9pZCB7XG5cbiAgICAgICAgdGhpcy5fcXVldWUucHVzaChzb3VuZCk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgX3ByZXBlbmRTb3VuZFRvUXVldWUoc291bmQ6IElTb3VuZCk6IHZvaWQge1xuXG4gICAgICAgIHRoaXMuX3F1ZXVlLnVuc2hpZnQoc291bmQpO1xuXG4gICAgfVxuXG4gICAgcHVibGljIF9hZGRTb3VuZFRvUXVldWVBZnRlckN1cnJlbnQoc291bmQ6IElTb3VuZCk6IHZvaWQge1xuXG4gICAgICAgIC8vIFRPRE86IGFkZCBvcHRpb24gdG8gcGxheSBhZnRlciBiZWluZyBhZGRlZCBvciB1c2VyIHVzZXMgcGxheSBtZXRob2Q/XG5cbiAgICAgICAgbGV0IGFmdGVyQ3VycmVudEluZGV4ID0gdGhpcy5fY3VycmVudEluZGV4ICsgMTtcblxuICAgICAgICB0aGlzLl9xdWV1ZS5zcGxpY2UoYWZ0ZXJDdXJyZW50SW5kZXgsIDAsIHNvdW5kKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyByZXNldFF1ZXVlKCkge1xuXG4gICAgICAgIHRoaXMuX3F1ZXVlID0gW107XG4gICAgICAgIHRoaXMuX3F1ZXVlSW5kZXggPSAwO1xuXG4gICAgICAgIC8vIFRPRE86IGNoZWNrIGlmIGEgc29uZyBpcyBnZXR0aW5nIHBsYXllZCBhbmQgc3RvcCBpdFxuXG4gICAgfVxuXG4gICAgLypwdWJsaWMgZ2V0UXVldWUoKSB7XG5cbiAgICAgICAgLy8gVE9ETzogaXMgdGhlIG5lZWRlZD9cblxuICAgICAgICByZXR1cm4gdGhpcy5fcXVldWU7XG5cbiAgICB9Ki9cblxuICAgIHB1YmxpYyBzZXRWb2x1bWUodm9sdW1lOiBudW1iZXIpOiB2b2lkIHtcblxuICAgICAgICB0aGlzLl92b2x1bWUgPSB2b2x1bWU7XG5cbiAgICAgICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0dhaW5Ob2RlXG5cbiAgICAgICAgLy90aGlzLl9hdWRpb0dyYXBoLmdhaW5Ob2RlLnZhbHVlID0gdGhpcy5fdm9sdW1lIC8gMTAwO1xuXG4gICAgfVxuXG4gICAgcHVibGljIGdldFZvbHVtZSgpOiBudW1iZXIge1xuXG4gICAgICAgIHJldHVybiB0aGlzLl92b2x1bWU7XG5cbiAgICB9XG5cblxuICAgIHB1YmxpYyBzZXRQbGF5YmFja1JhdGUocGxheWJhY2tSYXRlOiBudW1iZXIpOiB2b2lkIHtcblxuICAgICAgICAvLyA8IDEgc2xvd2VyLCA+IDEgZmFzdGVyIHBsYXliYWNrXG4gICAgICAgIC8vdGhpcy5fYXVkaW9HcmFwaC5zb3VyY2VOb2RlLnNldFBsYXliYWNrUmF0ZShwbGF5YmFja1JhdGUpO1xuXG4gICAgfTtcblxuICAgIHB1YmxpYyBnZXRQbGF5YmFja1JhdGUoKTogbnVtYmVyIHtcblxuICAgICAgICAvL3JldHVybiB0aGlzLl9hdWRpb0dyYXBoLnNvdXJjZU5vZGUucGxheWJhY2tSYXRlO1xuXG4gICAgICAgIHJldHVybiAwO1xuXG4gICAgfTtcblxuICAgIHB1YmxpYyByZXNldFBsYXliYWNrUmF0ZSgpOiB2b2lkIHtcblxuXG5cbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0UGFubmVyKGxlZnQ6IG51bWJlciwgcmlnaHQ6IG51bWJlcik6IHZvaWQge1xuXG4gICAgICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9QYW5uZXJOb2RlXG5cbiAgICAgICAgLy90aGlzLmF1ZGlvR3JhcGgucGFubmVyTm9kZS5zZXRQb3NpdGlvbigwLCAwLCAwKTtcblxuICAgIH07XG5cbiAgICBwdWJsaWMgZ2V0UGFubmVyKCk6IHsgbGVmdDogbnVtYmVyLCByaWdodDogbnVtYmVyIH0ge1xuXG4gICAgICAgIC8vcmV0dXJuIHRoaXMuYXVkaW9HcmFwaC5wYW5uZXJOb2RlLmdldFBvc2l0aW9uKCk7XG5cbiAgICAgICAgcmV0dXJuIHsgbGVmdDogMCwgcmlnaHQ6IDAgfTtcblxuICAgIH07XG5cbiAgICBwdWJsaWMgcmVzZXRQYW5uZXIoKTogdm9pZCB7XG5cblxuXG4gICAgfVxuXG4gICAgcHVibGljIHBsYXkod2hpY2hTb3VuZD86IG51bWJlciB8IHN0cmluZyB8IHVuZGVmaW5lZCk6IHZvaWQge1xuXG4gICAgICAgIC8vIFRPRE86IGNoZWNrIHRoZSBhdmFpbGFibGUgY29kZWNzIGFuZCBkZWZpbmVkIHNvdXJjZXMsIHBsYXkgdGhlIGZpcnN0IG9uZSB0aGF0IGhhcyBtYXRjaGVzIGFuZCBhdmFpbGFibGUgY29kZWNcbiAgICAgICAgLy8gVE9ETzogbGV0IHVzZXIgZGVmaW5lIG9yZGVyIG9mIHByZWZlcnJlZCBjb2RlY3MgZm9yIHBsYXllcmJhY2tcblxuICAgICAgICAvLyBjaGVjayBpZiB0aGUgcXVldWUgaXMgZW1wdHlcbiAgICAgICAgaWYgKHRoaXMuX3F1ZXVlLmxlbmd0aCA9PT0gMCkge1xuXG4gICAgICAgICAgICAvLyBUT0RPOiBzaG91bGQgd2UgZG8gc29tZXRoaW5nIGlmIHRoZSBxdWV1ZSBpcyBlbXB0eT8gdGhyb3cgYW4gZXJyb3Igb3IgZG8gbm90aGluZz9cblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gd2hpY2hTb3VuZCBpcyBvcHRpb25hbCwgaWYgc2V0IGl0IGNhbiBiZSB0aGUgaWQgb2YgdGhlIHNvdW5kIG9yIG5leHQgLyBwcmV2aW91cyAvIGZpcnN0IC8gbGFzdFxuICAgICAgICBsZXQgc291bmQ6IElTb3VuZCB8IG51bGwgPSB0aGlzLl9nZXRTb3VuZEZyb21RdWV1ZSh3aGljaFNvdW5kKTtcblxuICAgICAgICAvLyBleHRyYWN0IHRoZSB1cmwgYW5kIGNvZGVjIGZyb20gc291cmNlc1xuICAgICAgICBsZXQgeyB1cmwsIGNvZGVjID0gbnVsbCB9ID0gdGhpcy5fc291cmNlVG9WYXJpYWJsZXMoc291bmQuc291cmNlcyk7XG5cbiAgICAgICAgc291bmQudXJsID0gdXJsO1xuICAgICAgICBzb3VuZC5jb2RlYyA9IGNvZGVjO1xuXG4gICAgICAgIC8vIFRPRE86IHdvdWxkIGJlIGdvb2QgdG8gY2FjaGUgYnVmZmVycywgc28gbmVlZCB0byBjaGVjayBpZiBpcyBpbiBjYWNoZVxuICAgICAgICAvLyBsZXQgdGhlIHVzZXIgY2hvb3NlIChieSBzZXR0aW5nIGFuIG9wdGlvbikgd2hhdCBhbW91bnQgb2Ygc291bmRzIHdpbGwgYmUgY2FjaGVkXG4gICAgICAgIC8vIGFkZCBhIGNhY2hlZCBkYXRlIC8gdGltZXN0YW1wIHRvIGJlIGFibGUgdG8gY2xlYXIgY2FjaGUgYnkgb2xkZXN0IGZpcnN0XG4gICAgICAgIC8vIG9yIGV2ZW4gYmV0dGVyIGFkZCBhIHBsYXllZCBjb3VudGVyIHRvIGNhY2hlIGJ5IGxlYXN0IHBsYXllZCBhbmQgZGF0ZVxuXG4gICAgICAgIGlmIChzb3VuZC51cmwgIT09IG51bGwpIHtcblxuICAgICAgICAgICAgbGV0IHJlcXVlc3QgPSBuZXcgUGxheWVyUmVxdWVzdCgpO1xuXG4gICAgICAgICAgICAvLyBjaGFuZ2UgYnVmZmVyaW5nIHN0YXRlXG4gICAgICAgICAgICBzb3VuZC5pc0J1ZmZlcmluZyA9IHRydWU7XG5cbiAgICAgICAgICAgIHJlcXVlc3QuZ2V0QXJyYXlCdWZmZXIoc291bmQpLnRoZW4oKGFycmF5QnVmZmVyOiBBcnJheUJ1ZmZlcikgPT4ge1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fcGxheWVyQXVkaW8uZGVjb2RlQXVkaW8oYXJyYXlCdWZmZXIpLnRoZW4oKGF1ZGlvQnVmZmVyOiBBdWRpb0J1ZmZlcikgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgIHNvdW5kLmF1ZGlvQnVmZmVyID0gYXVkaW9CdWZmZXI7XG4gICAgICAgICAgICAgICAgICAgIHNvdW5kLmlzQnVmZmVyaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHNvdW5kLmlzQnVmZmVyZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBzb3VuZC5hdWRpb0J1ZmZlckRhdGUgPSBuZXcgRGF0ZSgpO1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N0YXJ0UGxheWluZyhzb3VuZCk7XG5cbiAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZGVjb2RlQXVkaW9FcnJvcjogSVBsYXllckVycm9yKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogaGFuZGxlIGVycm9yIGRlY29kZUF1ZGlvRXJyb3JcblxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB9KS5jYXRjaCgocmVxdWVzdEVycm9yOiBJUGxheWVyRXJyb3IpID0+IHtcblxuICAgICAgICAgICAgICAgIC8vIFRPRE86IGhhbmRsZSBlcnJvciByZXF1ZXN0RXJyb3JcblxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgLy8gVE9ETzogaGFuZGxlIGVycm9yIG5vIHNvdW5kIHVybFxuXG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfc3RhcnRQbGF5aW5nKHNvdW5kOiBJU291bmQpOiB2b2lkIHtcblxuICAgICAgICB0aGlzLl9hdWRpb0dyYXBoLnNvdXJjZU5vZGUuYnVmZmVyID0gc291bmQuYXVkaW9CdWZmZXI7XG5cbiAgICAgICAgLy8gdGhlIGF1ZGlvY29udGV4dCB0aW1lIHJpZ2h0IG5vdyAoc2luY2UgdGhlIGF1ZGlvY29udGV4dCBnb3QgY3JlYXRlZClcbiAgICAgICAgc291bmQuc3RhcnRUaW1lID0gdGhpcy5fYXVkaW9HcmFwaC5zb3VyY2VOb2RlLmNvbnRleHQuY3VycmVudFRpbWU7XG5cbiAgICAgICAgdGhpcy5fYXVkaW9HcmFwaC5zb3VyY2VOb2RlLnN0YXJ0KDAsIHNvdW5kLnBsYXlUaW1lT2Zmc2V0KTtcblxuICAgICAgICBzb3VuZC5pc1BsYXlpbmcgPSB0cnVlO1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9nZXRTb3VuZEZyb21RdWV1ZSh3aGljaFNvdW5kPzogc3RyaW5nIHwgbnVtYmVyKTogSVNvdW5kIHwgbnVsbCB7XG5cbiAgICAgICAgbGV0IHNvdW5kOiBJU291bmQgfCBudWxsID0gbnVsbDtcblxuICAgICAgICAvLyBpZiB3aGljaCBzb25nIHRvIHBsYXkgZGlkIG5vdCBnZXQgc3BlY2lmaWVkLCBwbGF5IG9uZSBiYXNlZCBmcm9tIHRoZSBxdWV1ZSBiYXNlZCBvbiB0aGUgcXVldWUgaW5kZXggcG9zaXRpb24gbWFya2VyXG4gICAgICAgIGlmICh3aGljaFNvdW5kID09PSB1bmRlZmluZWQgJiYgdGhpcy5fcXVldWVbdGhpcy5fY3VycmVudEluZGV4XSAhPT0gdW5kZWZpbmVkKSB7XG5cbiAgICAgICAgICAgIHNvdW5kID0gdGhpcy5fcXVldWVbdGhpcy5fY3VycmVudEluZGV4XTtcblxuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB3aGljaFNvdW5kID09PSAnbnVtYmVyJykge1xuXG4gICAgICAgICAgICAvLyBpZiB3aGljaCBzb25nIHRvIHBsYXkgaXMgYSBzb25nIElEXG4gICAgICAgICAgICBsZXQgZm91bmRJbkFycmF5ID0gdGhpcy5fcXVldWUuc29tZSgoc291bmRGcm9tUXVldWU6IElTb3VuZCwgcXVldWVJbmRleDogbnVtYmVyKSA9PiB7XG5cbiAgICAgICAgICAgICAgICBpZiAoc291bmRGcm9tUXVldWUuaWQgPT09IHdoaWNoU291bmQpIHtcblxuICAgICAgICAgICAgICAgICAgICBzb3VuZCA9IHNvdW5kRnJvbVF1ZXVlO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jdXJyZW50SW5kZXggPSBxdWV1ZUluZGV4O1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAvLyBpZiB3aGljaCBzb25nIHRvIHBsYXkgaXMgYSBjb25zdGFudFxuICAgICAgICAgICAgc3dpdGNoICh3aGljaFNvdW5kKSB7XG4gICAgICAgICAgICAgICAgY2FzZSB0aGlzLlBMQVlfU09VTkRfTkVYVDpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX3F1ZXVlW3RoaXMuX2N1cnJlbnRJbmRleCArIDFdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRJbmRleCA9IHRoaXMuX2N1cnJlbnRJbmRleCArIDE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSB0aGlzLlBMQVlfU09VTkRfUFJFVklPVVM6XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9xdWV1ZVt0aGlzLl9jdXJyZW50SW5kZXggLSAxXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9jdXJyZW50SW5kZXggPSB0aGlzLl9jdXJyZW50SW5kZXggKyAxO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgdGhpcy5QTEFZX1NPVU5EX0ZJUlNUOlxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fcXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fY3VycmVudEluZGV4ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIHRoaXMuUExBWV9TT1VORF9MQVNUOlxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fcXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fY3VycmVudEluZGV4ID0gdGhpcy5fcXVldWUubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzb3VuZCA9IHRoaXMuX3F1ZXVlW3RoaXMuX2N1cnJlbnRJbmRleF07XG5cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzb3VuZDtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfc291cmNlVG9WYXJpYWJsZXMoc291cmNlczogKElTb3VuZFNvdXJjZSB8IHN0cmluZylbXSk6IHsgdXJsOiBzdHJpbmcgfCBudWxsLCBjb2RlYz86IHN0cmluZyB8IG51bGwgfSB7XG5cbiAgICAgICAgLy8gVE9ETzogc291cmNlIGNhbiBiZSBvbiBvYmplY3Qgd2hlcmUgdGhlIHByb3BlcnR5IG5hbWUgaXMgdGhlIGNvZGVjIGFuZCB0aGUgdmFsdWUgaXMgdGhlIHNvdW5kIHVybFxuICAgICAgICAvLyBpZiBzb3VuZCBpc250IGFuIG9iamVjdCB0cnkgdG8gZGV0ZWN0IHNvdW5kIHNvdXJjZSBleHRlbnNpb24gYnkgZmlsZSBleHRlbnRpb24gb3IgYnkgY2hlY2tpbmcgdGhlIGZpbGUgbWltZSB0eXBlXG5cbiAgICAgICAgLy8gVE9ETzogZ2V0IGEgbGlzdCBvZiBzdXBwb3J0ZWQgY29kZWNzIGJ5IHRoaXMgZGV2aWNlXG5cbiAgICAgICAgbGV0IGZpcnN0TWF0Y2hpbmdTb3VyY2U6IHsgdXJsOiBzdHJpbmcgfCBudWxsLCBjb2RlYz86IHN0cmluZyB8IG51bGwgfSA9IHtcbiAgICAgICAgICAgIHVybDogbnVsbCxcbiAgICAgICAgICAgIGNvZGVjOiBudWxsXG4gICAgICAgIH07XG5cbiAgICAgICAgc291cmNlcy5mb3JFYWNoKChzb3VyY2UpID0+IHtcblxuICAgICAgICAgICAgLy8gVE9ETzogZmluZCBvdXQgd2hhdCB0aGUgc291cmNlIGNvZGVjIGlzXG5cbiAgICAgICAgICAgIC8vIFRPRE86IGNoZWNrIGlmIHRoZSBzb3VyY2UgY29kZWMgaXMgYW1vbmcgdGhlIG9uZXMgdGhhdCBhcmUgc3VwcG9ydGVkIGJ5IHRoaXMgZGV2aWNlXG4gICAgICAgICAgICAvL2lmICgpIHtcblxuICAgICAgICAgICAgbGV0IHNvdW5kVXJsID0gJyc7XG5cbiAgICAgICAgICAgIC8vIGlmIHRoZSBwbGF5ZXIgaGFkIGFzIG9wdGlvbiBhIGJhc2VVcmwgZm9yIHNvdW5kcyBhZGQgaXQgbm93XG4gICAgICAgICAgICBpZiAodGhpcy5fc291bmRzQmFzZVVybCAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICBzb3VuZFVybCA9IHRoaXMuX3NvdW5kc0Jhc2VVcmw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHR3byBraW5kIG9mIHNvdXJjZSBhcmUgcG9zc2libGUsIGEgc3RyaW5nICh0aGUgdXJsKSBvciBhbiBvYmplY3QgKGtleSBpcyB0aGUgY29kZWMgYW5kIHZhbHVlIGlzIHRoZSB1cmwpXG4gICAgICAgICAgICBpZiAodHlwZW9mIHNvdXJjZSA9PT0gJ3N0cmluZycpIHtcblxuICAgICAgICAgICAgICAgIHNvdW5kVXJsICs9IHNvdXJjZTtcblxuICAgICAgICAgICAgICAgIGZpcnN0TWF0Y2hpbmdTb3VyY2UgPSB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogc291bmRVcmxcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgc291bmRVcmwgKz0gc291cmNlLnVybDtcblxuICAgICAgICAgICAgICAgIGZpcnN0TWF0Y2hpbmdTb3VyY2UgPSB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogc291bmRVcmwsXG4gICAgICAgICAgICAgICAgICAgIGNvZGVjOiBzb3VyY2UuY29kZWNcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGZpcnN0TWF0Y2hpbmdTb3VyY2U7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgcGF1c2UoKSB7XG5cbiAgICAgICAgLy8gVE9ETzogZG8gd2UgY3R4LnN1c3BlbmQoKSBhbmQgcmVzdW1lIHRoZSBjb250ZXh0IG9uIHBhdXNlIHRvIGZyZWUgZGV2aWNlIHJlc291cmNlcz9cblxuICAgICAgICBsZXQgc291bmQ6IElTb3VuZCB8IG51bGwgPSB0aGlzLl9nZXRTb3VuZEZyb21RdWV1ZSgpO1xuXG4gICAgICAgIGxldCB0aW1lQXRQYXVzZSA9IHRoaXMuX2F1ZGlvR3JhcGguc291cmNlTm9kZS5jb250ZXh0LmN1cnJlbnRUaW1lO1xuXG4gICAgICAgIHNvdW5kLnBsYXlUaW1lT2Zmc2V0ICs9IHRpbWVBdFBhdXNlIC0gc291bmQuc3RhcnRUaW1lO1xuXG4gICAgICAgIHRoaXMuX3N0b3BQbGF5aW5nKCk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgc3RvcCgpIHtcblxuICAgICAgICAvLyBzdG9wIHBsYWNlaG9sZGVyXG4gICAgICAgIC8vIFRPRE86IGRvIHdlIG5lZWQgYSBzdG9wIG1ldGhvZCAob3IgaXMgcGF1c2UgZW5vdWdoKVxuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9zdG9wUGxheWluZygpIHtcblxuICAgICAgICB0aGlzLl9hdWRpb0dyYXBoLnNvdXJjZU5vZGUuc3RvcCgwKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBuZXh0KCkge1xuXG4gICAgICAgIC8vIFRPRE86IGFkZCBhbGlhc2VzIGZvciBwbGF5KCduZXh0JykgLyBwcmV2aW91cyAvIGZpcnN0IC8gbGFzdD9cblxuICAgIH1cblxuLypcblxuICAgIHBsYXllci5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uIHN0b3BGdW5jdGlvbigpIHtcblxuICAgICAgICBpZiAodGhpcy50cmFjayA9PT0gdW5kZWZpbmVkKSB7XG5cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcblxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLnRyYWNrLmlzUGxheWluZykge1xuXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gc3RvcCB0aGUgdHJhY2sgcGxheWJhY2tcbiAgICAgICAgdGhpcy5hdWRpb0dyYXBoLnNvdXJjZU5vZGUuc3RvcCgwKTtcblxuICAgICAgICAvLyBjaGFuZ2UgdGhlIHRyYWNrIGF0dHJpYnV0ZXNcbiAgICAgICAgdGhpcy50cmFjay5pc1BsYXlpbmcgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLnRyYWNrLnBsYXlUaW1lID0gMDtcblxuICAgICAgICAvLyBhZnRlciBhIHN0b3AgeW91IGNhbnQgY2FsbCBhIHN0YXJ0IGFnYWluLCB5b3UgbmVlZCB0byBjcmVhdGUgYSBuZXdcbiAgICAgICAgLy8gc291cmNlIG5vZGUsIHRoaXMgbWVhbnMgdGhhdCB3ZSB1bnNldCB0aGUgYXVkaW9ncmFwaCBhZnRlciBhIHN0b3BcbiAgICAgICAgLy8gc28gdGhhdCBpdCBnZXRzIHJlY3JlYXRlZCBvbiB0aGUgbmV4dCBwbGF5XG4gICAgICAgIHRoaXMuYXVkaW9HcmFwaCA9IHVuZGVmaW5lZDtcbiAgICAgICAgXG4gICAgICAgIC8vIHN0b3AgdGhlIHByb2dyZXNzIHRpbWVyXG4gICAgICAgIHN0b3BUaW1lci5jYWxsKHRoaXMpO1xuXG4gICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgfTtcblxuICAgIHBsYXllci5wcm90b3R5cGUucG9zaXRpb25DaGFuZ2UgPSBmdW5jdGlvbiBwb3NpdGlvbkNoYW5nZUZ1bmN0aW9uKHRyYWNrUG9zaXRpb25JblBlcmNlbnQpIHtcbiAgICAgICAgXG4gICAgICAgIC8vIHN0b3AgdGhlIHRyYWNrIHBsYXliYWNrXG4gICAgICAgIHRoaXMuc3RvcCgpO1xuXG4gICAgICAgIGxldCB0cmFja1Bvc2l0aW9uSW5TZWNvbmRzID0gKHRoaXMudHJhY2suYnVmZmVyLmR1cmF0aW9uIC8gMTAwKSAqIHRyYWNrUG9zaXRpb25JblBlcmNlbnQ7XG5cbiAgICAgICAgdGhpcy50cmFjay5wbGF5VGltZU9mZnNldCA9IHRyYWNrUG9zaXRpb25JblNlY29uZHM7XG5cbiAgICAgICAgLy8gc3RhcnQgdGhlIHBsYXliYWNrIGF0IHRoZSBnaXZlbiBwb3NpdGlvblxuICAgICAgICB0aGlzLnBsYXkoKTtcblxuICAgIH07XG5cbiAgICBsZXQgdHJpZ2dlclByb2dyZXNzRXZlbnQgPSBmdW5jdGlvbiB0cmlnZ2VyUHJvZ3Jlc3NFdmVudEZ1bmN0aW9uKCkge1xuXG4gICAgICAgIGxldCB0aW1lTm93ID0gdGhpcy5hdWRpb0dyYXBoLnNvdXJjZU5vZGUuY29udGV4dC5jdXJyZW50VGltZTtcblxuICAgICAgICB0aGlzLnRyYWNrLnBsYXlUaW1lID0gKHRpbWVOb3cgLSB0aGlzLnRyYWNrLnN0YXJ0VGltZSkgKyB0aGlzLnRyYWNrLnBsYXlUaW1lT2Zmc2V0O1xuXG4gICAgICAgIC8vIGlmIHRoZSBwbGF5ZXIgaXMgYXQgdGhlIGVuZCBvZiB0aGUgdHJhY2tcbiAgICAgICAgaWYgKHRoaXMudHJhY2sucGxheVRpbWUgPj0gdGhpcy50cmFjay5idWZmZXIuZHVyYXRpb24pIHtcblxuICAgICAgICAgICAgdGhpcy5zdG9wKCk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmxvb3BUcmFjaykge1xuXG4gICAgICAgICAgICAgICAgdGhpcy5wbGF5KCk7XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy50cmFjay5wbGF5bGlzdElkICE9PSBudWxsKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ldmVudHMudHJpZ2dlcihcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZXZlbnRzLmNvbnN0YW50cy5QTEFZTElTVF9ORVhULFxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYWNrOiB0aGlzLnRyYWNrXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy50cmFjay5wbGF5ZWRUaW1lUGVyY2VudGFnZSA9ICh0aGlzLnRyYWNrLnBsYXlUaW1lIC8gdGhpcy50cmFjay5idWZmZXIuZHVyYXRpb24pICogMTAwO1xuXG4gICAgICAgIHRoaXMuZXZlbnRzLnRyaWdnZXIoXG4gICAgICAgICAgICB0aGlzLmV2ZW50cy5jb25zdGFudHMuUExBWUVSX1BMQVlJTkdfUFJPR1JFU1MsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcGVyY2VudGFnZTogdGhpcy50cmFjay5wbGF5ZWRUaW1lUGVyY2VudGFnZSxcbiAgICAgICAgICAgICAgICB0cmFjazogdGhpcy50cmFja1xuICAgICAgICAgICAgfVxuICAgICAgICApO1xuXG4gICAgfTsqL1xuXG59XG4iXX0=

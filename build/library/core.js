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
        function PlayerCore(playerOptions) {
            // constants
            this.WHERE_IN_QUEUE_AT_END = 'append';
            this.WHERE_IN_QUEUE_AT_START = 'prepend';
            this.WHERE_IN_QUEUE_AFTER_CURRENT = 'afterCurrent';
            this.PLAY_SOUND_NEXT = 'next';
            this.PLAY_SOUND_PREVIOUS = 'previous';
            this.PLAY_SOUND_FIRST = 'first';
            this.PLAY_SOUND_LAST = 'last';
            var defaultOptions = {
                volume: 80,
                loopQueue: false,
                soundsBaseUrl: ''
            };
            var options = Object.assign({}, defaultOptions, playerOptions);
            this._volume = options.volume;
            this._soundsBaseUrl = options.soundsBaseUrl;
            this._queue = [];
            this._currentIndex = 0;
            this._initialize();
        }
        PlayerCore.prototype._initialize = function () {
            // TODO: check if web audio api is available
            var webAudioApi = true;
            // is the web audio api supported
            // if not we will use the audio element as fallback
            if (webAudioApi) {
                this._isWebAudioApiSupported = true;
            }
            else {
                // use the html5 audio element
                this._isWebAudioApiSupported = false;
            }
            // TODO: initialize the audio graph when initializing the player
            // suspend the audio context while not playing any sound?
            // player audio library instance
            this._playerAudio = new audio_1.PlayerAudio();
            // get an audio graph
            this._audioGraph = this._playerAudio.createAudioGraph({ volume: this._volume });
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
            this._audioGraph.gainNode.gain.value = volume / 100;
            // https://developer.mozilla.org/en-US/docs/Web/API/GainNode
            //this._audioGraph.gainNode.value = this._volume / 100;
        };
        PlayerCore.prototype.getVolume = function () {
            return this._volume;
        };
        PlayerCore.prototype.setProgress = function (progress) {
            this._progress = progress;
        };
        PlayerCore.prototype.getProgress = function () {
            return this._progress;
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
            // TODO: add aliases for play('next')
        };
        PlayerCore.prototype.previous = function () {
            // TODO: add aliases for play('previous')
        };
        PlayerCore.prototype.first = function () {
            // TODO: add aliases for play('first')
        };
        PlayerCore.prototype.last = function () {
            // TODO: add aliases for play('last')
        };
        return PlayerCore;
    }());
    exports.PlayerCore = PlayerCore;
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9saWJyYXJ5L2NvcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7SUFDQSxZQUFZLENBQUM7SUFFYixpQ0FBOEU7SUFDOUUsaUNBQW1EO0lBQ25ELHFDQUEwQztJQVMxQztRQW9DSSxvQkFBWSxhQUEyQjtZQVZ2QyxZQUFZO1lBQ0gsMEJBQXFCLEdBQVcsUUFBUSxDQUFDO1lBQ3pDLDRCQUF1QixHQUFXLFNBQVMsQ0FBQztZQUM1QyxpQ0FBNEIsR0FBVyxjQUFjLENBQUM7WUFFdEQsb0JBQWUsR0FBRyxNQUFNLENBQUM7WUFDekIsd0JBQW1CLEdBQUcsVUFBVSxDQUFDO1lBQ2pDLHFCQUFnQixHQUFHLE9BQU8sQ0FBQztZQUMzQixvQkFBZSxHQUFHLE1BQU0sQ0FBQztZQUk5QixJQUFJLGNBQWMsR0FBRztnQkFDakIsTUFBTSxFQUFFLEVBQUU7Z0JBQ1YsU0FBUyxFQUFFLEtBQUs7Z0JBQ2hCLGFBQWEsRUFBRSxFQUFFO2FBQ3BCLENBQUM7WUFFRixJQUFJLE9BQU8sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxjQUFjLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFFL0QsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO1lBQzlCLElBQUksQ0FBQyxjQUFjLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQztZQUM1QyxJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztZQUNqQixJQUFJLENBQUMsYUFBYSxHQUFHLENBQUMsQ0FBQztZQUV2QixJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFFdkIsQ0FBQztRQUVTLGdDQUFXLEdBQXJCO1lBRUksNENBQTRDO1lBQzVDLElBQUksV0FBVyxHQUFHLElBQUksQ0FBQztZQUV2QixpQ0FBaUM7WUFDakMsbURBQW1EO1lBQ25ELEVBQUUsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7Z0JBRWQsSUFBSSxDQUFDLHVCQUF1QixHQUFHLElB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RXpDLENBQUM7UUFFTSw2QkFBUSxHQUFmO1lBRUkseUNBQXlDO1FBRTdDLENBQUM7UUFFTSwwQkFBSyxHQUFaO1lBRUksc0NBQXNDO1FBRTFDLENBQUM7UUFFTSx5QkFBSSxHQUFYO1lBRUkscUNBQXFDO1FBRXpDLENBQUM7UUFnR0wsaUJBQUM7SUFBRCxDQTFpQkEsQUEwaUJDLElBQUE7SUExaUJZLGdDQUFVIiwiZmlsZSI6ImxpYnJhcnkvY29yZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBQbGF5ZXJTb3VuZCwgSVNvdW5kLCBJU291bmRBdHRyaWJ1dGVzLCBJU291bmRTb3VyY2UgfSBmcm9tICcuL3NvdW5kJztcbmltcG9ydCB7IFBsYXllckF1ZGlvLCBJQXVkaW9HcmFwaCB9IGZyb20gJy4vYXVkaW8nO1xuaW1wb3J0IHsgUGxheWVyUmVxdWVzdCB9IGZyb20gJy4vcmVxdWVzdCc7XG5pbXBvcnQgeyBQbGF5ZXJFcnJvciwgSVBsYXllckVycm9yIH0gZnJvbSAnLi9lcnJvcic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUNvcmVPcHRpb25zIHtcbiAgICB2b2x1bWU/OiBudW1iZXI7XG4gICAgbG9vcFF1ZXVlPzogYm9vbGVhbjtcbiAgICBzb3VuZHNCYXNlVXJsPzogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgUGxheWVyQ29yZSB7XG5cbiAgICAvLyBpcyB0aGUgd2ViIGF1ZGlvIEFQSSBzdXBwb3J0ZWRcbiAgICBwcm90ZWN0ZWQgX2lzV2ViQXVkaW9BcGlTdXBwb3J0ZWQ6IGJvb2xlYW47XG4gICAgLy8gdGhlIHNvdW5kcyBxdWV1ZVxuICAgIHByb3RlY3RlZCBfcXVldWU6IElTb3VuZFtdO1xuICAgIC8vIHRoZSBxdWV1ZSBpbmRleCBvZiB0aGUgc29uZyB0byBwbGF5IGlmIG5vbmUgZ290IGRlZmluZWQgXG4gICAgcHJvdGVjdGVkIF9xdWV1ZUluZGV4OiBudW1iZXI7XG4gICAgLy8gdGhlIHZvbHVtZSAoMCB0byAxMDApXG4gICAgcHJvdGVjdGVkIF92b2x1bWU6IG51bWJlcjtcbiAgICAvLyB0aGUgcHJvZ3Jlc3MgKHNvbmcgcGxheSB0aW1lKVxuICAgIHByb3RlY3RlZCBfcHJvZ3Jlc3M6IG51bWJlcjtcbiAgICAvLyB0aGUgYmFzZSB1cmwgdGhhdCBhbGwgc291bmRzIHdpbGwgaGF2ZSBpbiBjb21tb25cbiAgICBwcm90ZWN0ZWQgX3NvdW5kc0Jhc2VVcmw6IHN0cmluZztcbiAgICAvLyB0aGUgY3VycmVudCBzb3VuZCBpbiBxdWV1ZSBpbmRleFxuICAgIHByb3RlY3RlZCBfY3VycmVudEluZGV4OiBudW1iZXI7XG4gICAgLy8gaW5zdGFuY2Ugb2YgdGhlIGF1ZGlvIGxpYnJhcnkgY2xhc3NcbiAgICBwcm90ZWN0ZWQgX3BsYXllckF1ZGlvOiBQbGF5ZXJBdWRpbztcbiAgICAvLyBjdXN0b20gYXVkaW8gZ3JhcGhcbiAgICBwcm90ZWN0ZWQgX2F1ZGlvR3JhcGg6IElBdWRpb0dyYXBoO1xuXG4gICAgLy8gY2FsbGJhY2sgaG9va3NcbiAgICBwdWJsaWMgb25QbGF5U3RhcnQ6ICgpID0+IHZvaWQ7XG4gICAgcHVibGljIG9uUGxheWluZzogKCkgPT4gdm9pZDtcbiAgICBwdWJsaWMgb25CdWZmZXJpbmc6ICgpID0+IHZvaWQ7XG5cbiAgICAvLyBjb25zdGFudHNcbiAgICByZWFkb25seSBXSEVSRV9JTl9RVUVVRV9BVF9FTkQ6IHN0cmluZyA9ICdhcHBlbmQnO1xuICAgIHJlYWRvbmx5IFdIRVJFX0lOX1FVRVVFX0FUX1NUQVJUOiBzdHJpbmcgPSAncHJlcGVuZCc7XG4gICAgcmVhZG9ubHkgV0hFUkVfSU5fUVVFVUVfQUZURVJfQ1VSUkVOVDogc3RyaW5nID0gJ2FmdGVyQ3VycmVudCc7XG5cbiAgICByZWFkb25seSBQTEFZX1NPVU5EX05FWFQgPSAnbmV4dCc7XG4gICAgcmVhZG9ubHkgUExBWV9TT1VORF9QUkVWSU9VUyA9ICdwcmV2aW91cyc7XG4gICAgcmVhZG9ubHkgUExBWV9TT1VORF9GSVJTVCA9ICdmaXJzdCc7XG4gICAgcmVhZG9ubHkgUExBWV9TT1VORF9MQVNUID0gJ2xhc3QnO1xuXG4gICAgY29uc3RydWN0b3IocGxheWVyT3B0aW9uczogSUNvcmVPcHRpb25zKSB7XG5cbiAgICAgICAgbGV0IGRlZmF1bHRPcHRpb25zID0ge1xuICAgICAgICAgICAgdm9sdW1lOiA4MCxcbiAgICAgICAgICAgIGxvb3BRdWV1ZTogZmFsc2UsXG4gICAgICAgICAgICBzb3VuZHNCYXNlVXJsOiAnJ1xuICAgICAgICB9O1xuXG4gICAgICAgIGxldCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdE9wdGlvbnMsIHBsYXllck9wdGlvbnMpO1xuXG4gICAgICAgIHRoaXMuX3ZvbHVtZSA9IG9wdGlvbnMudm9sdW1lO1xuICAgICAgICB0aGlzLl9zb3VuZHNCYXNlVXJsID0gb3B0aW9ucy5zb3VuZHNCYXNlVXJsO1xuICAgICAgICB0aGlzLl9xdWV1ZSA9IFtdO1xuICAgICAgICB0aGlzLl9jdXJyZW50SW5kZXggPSAwO1xuXG4gICAgICAgIHRoaXMuX2luaXRpYWxpemUoKTtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfaW5pdGlhbGl6ZSgpIHtcblxuICAgICAgICAvLyBUT0RPOiBjaGVjayBpZiB3ZWIgYXVkaW8gYXBpIGlzIGF2YWlsYWJsZVxuICAgICAgICBsZXQgd2ViQXVkaW9BcGkgPSB0cnVlO1xuXG4gICAgICAgIC8vIGlzIHRoZSB3ZWIgYXVkaW8gYXBpIHN1cHBvcnRlZFxuICAgICAgICAvLyBpZiBub3Qgd2Ugd2lsbCB1c2UgdGhlIGF1ZGlvIGVsZW1lbnQgYXMgZmFsbGJhY2tcbiAgICAgICAgaWYgKHdlYkF1ZGlvQXBpKSB7XG5cbiAgICAgICAgICAgIHRoaXMuX2lzV2ViQXVkaW9BcGlTdXBwb3J0ZWQgPSB0cnVlO1xuXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgIC8vIHVzZSB0aGUgaHRtbDUgYXVkaW8gZWxlbWVudFxuICAgICAgICAgICAgdGhpcy5faXNXZWJBdWRpb0FwaVN1cHBvcnRlZCA9IGZhbHNlO1xuXG4gICAgICAgIH1cblxuICAgICAgICAvLyBUT0RPOiBpbml0aWFsaXplIHRoZSBhdWRpbyBncmFwaCB3aGVuIGluaXRpYWxpemluZyB0aGUgcGxheWVyXG4gICAgICAgIC8vIHN1c3BlbmQgdGhlIGF1ZGlvIGNvbnRleHQgd2hpbGUgbm90IHBsYXlpbmcgYW55IHNvdW5kP1xuXG4gICAgICAgIC8vIHBsYXllciBhdWRpbyBsaWJyYXJ5IGluc3RhbmNlXG4gICAgICAgIHRoaXMuX3BsYXllckF1ZGlvID0gbmV3IFBsYXllckF1ZGlvKCk7XG5cbiAgICAgICAgLy8gZ2V0IGFuIGF1ZGlvIGdyYXBoXG4gICAgICAgIHRoaXMuX2F1ZGlvR3JhcGggPSB0aGlzLl9wbGF5ZXJBdWRpby5jcmVhdGVBdWRpb0dyYXBoKHsgdm9sdW1lOiB0aGlzLl92b2x1bWUgfSk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgYWRkU291bmRUb1F1ZXVlKHNvdW5kQXR0cmlidXRlczogSVNvdW5kQXR0cmlidXRlcywgd2hlcmVJblF1ZXVlOiBzdHJpbmcgPSB0aGlzLldIRVJFX0lOX1FVRVVFX0FUX0VORCk6IElTb3VuZCB7XG5cbiAgICAgICAgbGV0IHNvdW5kOiBJU291bmQgPSBuZXcgUGxheWVyU291bmQoc291bmRBdHRyaWJ1dGVzKTtcblxuICAgICAgICAvLyBUT0RPOiBpcyBxdWV1ZSBqdXN0IGFuIGFycmF5IG9mIHNvdW5kcywgb3IgZG8gd2UgbmVlZCBzb21ldGhpbmcgbW9yZSBjb21wbGV4IHdpdGggYSBwb3NpdGlvbiB0cmFja2VyP1xuXG4gICAgICAgIC8vIFRPRE86IGFsbG93IGFycmF5IG9mIHNvdW5kQXR0cmlidXRlcyB0byBiZSBpbmplY3RlZCwgdG8gY3JlYXRlIHNldmVyYWwgYXQgb25jZSwgaWYgaW5wdXQgaXMgYW4gYXJyYXkgb3V0cHV0IHNob3VsZCBiZSB0b29cblxuICAgICAgICBzd2l0Y2ggKHdoZXJlSW5RdWV1ZSkge1xuICAgICAgICAgICAgY2FzZSB0aGlzLldIRVJFX0lOX1FVRVVFX0FUX0VORDpcbiAgICAgICAgICAgICAgICB0aGlzLl9hcHBlbmRTb3VuZFRvUXVldWUoc291bmQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSB0aGlzLldIRVJFX0lOX1FVRVVFX0FUX1NUQVJUOlxuICAgICAgICAgICAgICAgIHRoaXMuX3ByZXBlbmRTb3VuZFRvUXVldWUoc291bmQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSB0aGlzLldIRVJFX0lOX1FVRVVFX0FGVEVSX0NVUlJFTlQ6XG4gICAgICAgICAgICAgICAgdGhpcy5fcHJlcGVuZFNvdW5kVG9RdWV1ZShzb3VuZCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc291bmQ7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgX2FwcGVuZFNvdW5kVG9RdWV1ZShzb3VuZDogSVNvdW5kKTogdm9pZCB7XG5cbiAgICAgICAgdGhpcy5fcXVldWUucHVzaChzb3VuZCk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgX3ByZXBlbmRTb3VuZFRvUXVldWUoc291bmQ6IElTb3VuZCk6IHZvaWQge1xuXG4gICAgICAgIHRoaXMuX3F1ZXVlLnVuc2hpZnQoc291bmQpO1xuXG4gICAgfVxuXG4gICAgcHVibGljIF9hZGRTb3VuZFRvUXVldWVBZnRlckN1cnJlbnQoc291bmQ6IElTb3VuZCk6IHZvaWQge1xuXG4gICAgICAgIC8vIFRPRE86IGFkZCBvcHRpb24gdG8gcGxheSBhZnRlciBiZWluZyBhZGRlZCBvciB1c2VyIHVzZXMgcGxheSBtZXRob2Q/XG5cbiAgICAgICAgbGV0IGFmdGVyQ3VycmVudEluZGV4ID0gdGhpcy5fY3VycmVudEluZGV4ICsgMTtcblxuICAgICAgICB0aGlzLl9xdWV1ZS5zcGxpY2UoYWZ0ZXJDdXJyZW50SW5kZXgsIDAsIHNvdW5kKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyByZXNldFF1ZXVlKCkge1xuXG4gICAgICAgIHRoaXMuX3F1ZXVlID0gW107XG4gICAgICAgIHRoaXMuX3F1ZXVlSW5kZXggPSAwO1xuXG4gICAgICAgIC8vIFRPRE86IGNoZWNrIGlmIGEgc29uZyBpcyBnZXR0aW5nIHBsYXllZCBhbmQgc3RvcCBpdFxuXG4gICAgfVxuXG4gICAgLypwdWJsaWMgZ2V0UXVldWUoKSB7XG5cbiAgICAgICAgLy8gVE9ETzogaXMgdGhlIG5lZWRlZD9cblxuICAgICAgICByZXR1cm4gdGhpcy5fcXVldWU7XG5cbiAgICB9Ki9cblxuICAgIHB1YmxpYyBzZXRWb2x1bWUodm9sdW1lOiBudW1iZXIpOiB2b2lkIHtcblxuICAgICAgICB0aGlzLl92b2x1bWUgPSB2b2x1bWU7XG5cbiAgICAgICAgdGhpcy5fYXVkaW9HcmFwaC5nYWluTm9kZS5nYWluLnZhbHVlID0gdm9sdW1lIC8gMTAwO1xuXG4gICAgICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9HYWluTm9kZVxuXG4gICAgICAgIC8vdGhpcy5fYXVkaW9HcmFwaC5nYWluTm9kZS52YWx1ZSA9IHRoaXMuX3ZvbHVtZSAvIDEwMDtcblxuICAgIH1cblxuICAgIHB1YmxpYyBnZXRWb2x1bWUoKTogbnVtYmVyIHtcblxuICAgICAgICByZXR1cm4gdGhpcy5fdm9sdW1lO1xuXG4gICAgfVxuXG4gICAgcHVibGljIHNldFByb2dyZXNzKHByb2dyZXNzOiBudW1iZXIpOiB2b2lkIHtcblxuICAgICAgICB0aGlzLl9wcm9ncmVzcyA9IHByb2dyZXNzO1xuXG4gICAgfVxuXG4gICAgcHVibGljIGdldFByb2dyZXNzKCk6IG51bWJlciB7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX3Byb2dyZXNzO1xuXG4gICAgfVxuXG4gICAgcHVibGljIHNldFBsYXliYWNrUmF0ZShwbGF5YmFja1JhdGU6IG51bWJlcik6IHZvaWQge1xuXG4gICAgICAgIC8vIDwgMSBzbG93ZXIsID4gMSBmYXN0ZXIgcGxheWJhY2tcbiAgICAgICAgLy90aGlzLl9hdWRpb0dyYXBoLnNvdXJjZU5vZGUuc2V0UGxheWJhY2tSYXRlKHBsYXliYWNrUmF0ZSk7XG5cbiAgICB9O1xuXG4gICAgcHVibGljIGdldFBsYXliYWNrUmF0ZSgpOiBudW1iZXIge1xuXG4gICAgICAgIC8vcmV0dXJuIHRoaXMuX2F1ZGlvR3JhcGguc291cmNlTm9kZS5wbGF5YmFja1JhdGU7XG5cbiAgICAgICAgcmV0dXJuIDA7XG5cbiAgICB9O1xuXG4gICAgcHVibGljIHJlc2V0UGxheWJhY2tSYXRlKCk6IHZvaWQge1xuXG5cblxuICAgIH1cblxuICAgIHB1YmxpYyBzZXRQYW5uZXIobGVmdDogbnVtYmVyLCByaWdodDogbnVtYmVyKTogdm9pZCB7XG5cbiAgICAgICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1Bhbm5lck5vZGVcblxuICAgICAgICAvL3RoaXMuYXVkaW9HcmFwaC5wYW5uZXJOb2RlLnNldFBvc2l0aW9uKDAsIDAsIDApO1xuXG4gICAgfTtcblxuICAgIHB1YmxpYyBnZXRQYW5uZXIoKTogeyBsZWZ0OiBudW1iZXIsIHJpZ2h0OiBudW1iZXIgfSB7XG5cbiAgICAgICAgLy9yZXR1cm4gdGhpcy5hdWRpb0dyYXBoLnBhbm5lck5vZGUuZ2V0UG9zaXRpb24oKTtcblxuICAgICAgICByZXR1cm4geyBsZWZ0OiAwLCByaWdodDogMCB9O1xuXG4gICAgfTtcblxuICAgIHB1YmxpYyByZXNldFBhbm5lcigpOiB2b2lkIHtcblxuXG5cbiAgICB9XG5cbiAgICBwdWJsaWMgcGxheSh3aGljaFNvdW5kPzogbnVtYmVyIHwgc3RyaW5nIHwgdW5kZWZpbmVkKTogdm9pZCB7XG5cbiAgICAgICAgLy8gVE9ETzogY2hlY2sgdGhlIGF2YWlsYWJsZSBjb2RlY3MgYW5kIGRlZmluZWQgc291cmNlcywgcGxheSB0aGUgZmlyc3Qgb25lIHRoYXQgaGFzIG1hdGNoZXMgYW5kIGF2YWlsYWJsZSBjb2RlY1xuICAgICAgICAvLyBUT0RPOiBsZXQgdXNlciBkZWZpbmUgb3JkZXIgb2YgcHJlZmVycmVkIGNvZGVjcyBmb3IgcGxheWVyYmFja1xuXG4gICAgICAgIC8vIGNoZWNrIGlmIHRoZSBxdWV1ZSBpcyBlbXB0eVxuICAgICAgICBpZiAodGhpcy5fcXVldWUubGVuZ3RoID09PSAwKSB7XG5cbiAgICAgICAgICAgIC8vIFRPRE86IHNob3VsZCB3ZSBkbyBzb21ldGhpbmcgaWYgdGhlIHF1ZXVlIGlzIGVtcHR5PyB0aHJvdyBhbiBlcnJvciBvciBkbyBub3RoaW5nP1xuXG4gICAgICAgIH1cblxuICAgICAgICAvLyB3aGljaFNvdW5kIGlzIG9wdGlvbmFsLCBpZiBzZXQgaXQgY2FuIGJlIHRoZSBpZCBvZiB0aGUgc291bmQgb3IgbmV4dCAvIHByZXZpb3VzIC8gZmlyc3QgLyBsYXN0XG4gICAgICAgIGxldCBzb3VuZDogSVNvdW5kIHwgbnVsbCA9IHRoaXMuX2dldFNvdW5kRnJvbVF1ZXVlKHdoaWNoU291bmQpO1xuXG4gICAgICAgIC8vIGV4dHJhY3QgdGhlIHVybCBhbmQgY29kZWMgZnJvbSBzb3VyY2VzXG4gICAgICAgIGxldCB7IHVybCwgY29kZWMgPSBudWxsIH0gPSB0aGlzLl9zb3VyY2VUb1ZhcmlhYmxlcyhzb3VuZC5zb3VyY2VzKTtcblxuICAgICAgICBzb3VuZC51cmwgPSB1cmw7XG4gICAgICAgIHNvdW5kLmNvZGVjID0gY29kZWM7XG5cbiAgICAgICAgLy8gVE9ETzogd291bGQgYmUgZ29vZCB0byBjYWNoZSBidWZmZXJzLCBzbyBuZWVkIHRvIGNoZWNrIGlmIGlzIGluIGNhY2hlXG4gICAgICAgIC8vIGxldCB0aGUgdXNlciBjaG9vc2UgKGJ5IHNldHRpbmcgYW4gb3B0aW9uKSB3aGF0IGFtb3VudCBvZiBzb3VuZHMgd2lsbCBiZSBjYWNoZWRcbiAgICAgICAgLy8gYWRkIGEgY2FjaGVkIGRhdGUgLyB0aW1lc3RhbXAgdG8gYmUgYWJsZSB0byBjbGVhciBjYWNoZSBieSBvbGRlc3QgZmlyc3RcbiAgICAgICAgLy8gb3IgZXZlbiBiZXR0ZXIgYWRkIGEgcGxheWVkIGNvdW50ZXIgdG8gY2FjaGUgYnkgbGVhc3QgcGxheWVkIGFuZCBkYXRlXG5cbiAgICAgICAgaWYgKHNvdW5kLnVybCAhPT0gbnVsbCkge1xuXG4gICAgICAgICAgICBsZXQgcmVxdWVzdCA9IG5ldyBQbGF5ZXJSZXF1ZXN0KCk7XG5cbiAgICAgICAgICAgIC8vIGNoYW5nZSBidWZmZXJpbmcgc3RhdGVcbiAgICAgICAgICAgIHNvdW5kLmlzQnVmZmVyaW5nID0gdHJ1ZTtcblxuICAgICAgICAgICAgcmVxdWVzdC5nZXRBcnJheUJ1ZmZlcihzb3VuZCkudGhlbigoYXJyYXlCdWZmZXI6IEFycmF5QnVmZmVyKSA9PiB7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9wbGF5ZXJBdWRpby5kZWNvZGVBdWRpbyhhcnJheUJ1ZmZlcikudGhlbigoYXVkaW9CdWZmZXI6IEF1ZGlvQnVmZmVyKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgc291bmQuYXVkaW9CdWZmZXIgPSBhdWRpb0J1ZmZlcjtcbiAgICAgICAgICAgICAgICAgICAgc291bmQuaXNCdWZmZXJpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgc291bmQuaXNCdWZmZXJlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHNvdW5kLmF1ZGlvQnVmZmVyRGF0ZSA9IG5ldyBEYXRlKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3RhcnRQbGF5aW5nKHNvdW5kKTtcblxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKChkZWNvZGVBdWRpb0Vycm9yOiBJUGxheWVyRXJyb3IpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBoYW5kbGUgZXJyb3IgZGVjb2RlQXVkaW9FcnJvclxuXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIH0pLmNhdGNoKChyZXF1ZXN0RXJyb3I6IElQbGF5ZXJFcnJvcikgPT4ge1xuXG4gICAgICAgICAgICAgICAgLy8gVE9ETzogaGFuZGxlIGVycm9yIHJlcXVlc3RFcnJvclxuXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAvLyBUT0RPOiBoYW5kbGUgZXJyb3Igbm8gc291bmQgdXJsXG5cbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9zdGFydFBsYXlpbmcoc291bmQ6IElTb3VuZCk6IHZvaWQge1xuXG4gICAgICAgIHRoaXMuX2F1ZGlvR3JhcGguc291cmNlTm9kZS5idWZmZXIgPSBzb3VuZC5hdWRpb0J1ZmZlcjtcblxuICAgICAgICAvLyB0aGUgYXVkaW9jb250ZXh0IHRpbWUgcmlnaHQgbm93IChzaW5jZSB0aGUgYXVkaW9jb250ZXh0IGdvdCBjcmVhdGVkKVxuICAgICAgICBzb3VuZC5zdGFydFRpbWUgPSB0aGlzLl9hdWRpb0dyYXBoLnNvdXJjZU5vZGUuY29udGV4dC5jdXJyZW50VGltZTtcblxuICAgICAgICB0aGlzLl9hdWRpb0dyYXBoLnNvdXJjZU5vZGUuc3RhcnQoMCwgc291bmQucGxheVRpbWVPZmZzZXQpO1xuXG4gICAgICAgIHNvdW5kLmlzUGxheWluZyA9IHRydWU7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX2dldFNvdW5kRnJvbVF1ZXVlKHdoaWNoU291bmQ/OiBzdHJpbmcgfCBudW1iZXIpOiBJU291bmQgfCBudWxsIHtcblxuICAgICAgICBsZXQgc291bmQ6IElTb3VuZCB8IG51bGwgPSBudWxsO1xuXG4gICAgICAgIC8vIGlmIHdoaWNoIHNvbmcgdG8gcGxheSBkaWQgbm90IGdldCBzcGVjaWZpZWQsIHBsYXkgb25lIGJhc2VkIGZyb20gdGhlIHF1ZXVlIGJhc2VkIG9uIHRoZSBxdWV1ZSBpbmRleCBwb3NpdGlvbiBtYXJrZXJcbiAgICAgICAgaWYgKHdoaWNoU291bmQgPT09IHVuZGVmaW5lZCAmJiB0aGlzLl9xdWV1ZVt0aGlzLl9jdXJyZW50SW5kZXhdICE9PSB1bmRlZmluZWQpIHtcblxuICAgICAgICAgICAgc291bmQgPSB0aGlzLl9xdWV1ZVt0aGlzLl9jdXJyZW50SW5kZXhdO1xuXG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHdoaWNoU291bmQgPT09ICdudW1iZXInKSB7XG5cbiAgICAgICAgICAgIC8vIGlmIHdoaWNoIHNvbmcgdG8gcGxheSBpcyBhIHNvbmcgSURcbiAgICAgICAgICAgIGxldCBmb3VuZEluQXJyYXkgPSB0aGlzLl9xdWV1ZS5zb21lKChzb3VuZEZyb21RdWV1ZTogSVNvdW5kLCBxdWV1ZUluZGV4OiBudW1iZXIpID0+IHtcblxuICAgICAgICAgICAgICAgIGlmIChzb3VuZEZyb21RdWV1ZS5pZCA9PT0gd2hpY2hTb3VuZCkge1xuXG4gICAgICAgICAgICAgICAgICAgIHNvdW5kID0gc291bmRGcm9tUXVldWU7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRJbmRleCA9IHF1ZXVlSW5kZXg7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgIC8vIGlmIHdoaWNoIHNvbmcgdG8gcGxheSBpcyBhIGNvbnN0YW50XG4gICAgICAgICAgICBzd2l0Y2ggKHdoaWNoU291bmQpIHtcbiAgICAgICAgICAgICAgICBjYXNlIHRoaXMuUExBWV9TT1VORF9ORVhUOlxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fcXVldWVbdGhpcy5fY3VycmVudEluZGV4ICsgMV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fY3VycmVudEluZGV4ID0gdGhpcy5fY3VycmVudEluZGV4ICsgMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIHRoaXMuUExBWV9TT1VORF9QUkVWSU9VUzpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX3F1ZXVlW3RoaXMuX2N1cnJlbnRJbmRleCAtIDFdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRJbmRleCA9IHRoaXMuX2N1cnJlbnRJbmRleCArIDE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSB0aGlzLlBMQVlfU09VTkRfRklSU1Q6XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9xdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9jdXJyZW50SW5kZXggPSAwO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgdGhpcy5QTEFZX1NPVU5EX0xBU1Q6XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9xdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9jdXJyZW50SW5kZXggPSB0aGlzLl9xdWV1ZS5sZW5ndGggLSAxO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNvdW5kID0gdGhpcy5fcXVldWVbdGhpcy5fY3VycmVudEluZGV4XTtcblxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHNvdW5kO1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9zb3VyY2VUb1ZhcmlhYmxlcyhzb3VyY2VzOiAoSVNvdW5kU291cmNlIHwgc3RyaW5nKVtdKTogeyB1cmw6IHN0cmluZyB8IG51bGwsIGNvZGVjPzogc3RyaW5nIHwgbnVsbCB9IHtcblxuICAgICAgICAvLyBUT0RPOiBzb3VyY2UgY2FuIGJlIG9uIG9iamVjdCB3aGVyZSB0aGUgcHJvcGVydHkgbmFtZSBpcyB0aGUgY29kZWMgYW5kIHRoZSB2YWx1ZSBpcyB0aGUgc291bmQgdXJsXG4gICAgICAgIC8vIGlmIHNvdW5kIGlzbnQgYW4gb2JqZWN0IHRyeSB0byBkZXRlY3Qgc291bmQgc291cmNlIGV4dGVuc2lvbiBieSBmaWxlIGV4dGVudGlvbiBvciBieSBjaGVja2luZyB0aGUgZmlsZSBtaW1lIHR5cGVcblxuICAgICAgICAvLyBUT0RPOiBnZXQgYSBsaXN0IG9mIHN1cHBvcnRlZCBjb2RlY3MgYnkgdGhpcyBkZXZpY2VcblxuICAgICAgICBsZXQgZmlyc3RNYXRjaGluZ1NvdXJjZTogeyB1cmw6IHN0cmluZyB8IG51bGwsIGNvZGVjPzogc3RyaW5nIHwgbnVsbCB9ID0ge1xuICAgICAgICAgICAgdXJsOiBudWxsLFxuICAgICAgICAgICAgY29kZWM6IG51bGxcbiAgICAgICAgfTtcblxuICAgICAgICBzb3VyY2VzLmZvckVhY2goKHNvdXJjZSkgPT4ge1xuXG4gICAgICAgICAgICAvLyBUT0RPOiBmaW5kIG91dCB3aGF0IHRoZSBzb3VyY2UgY29kZWMgaXNcblxuICAgICAgICAgICAgLy8gVE9ETzogY2hlY2sgaWYgdGhlIHNvdXJjZSBjb2RlYyBpcyBhbW9uZyB0aGUgb25lcyB0aGF0IGFyZSBzdXBwb3J0ZWQgYnkgdGhpcyBkZXZpY2VcbiAgICAgICAgICAgIC8vaWYgKCkge1xuXG4gICAgICAgICAgICBsZXQgc291bmRVcmwgPSAnJztcblxuICAgICAgICAgICAgLy8gaWYgdGhlIHBsYXllciBoYWQgYXMgb3B0aW9uIGEgYmFzZVVybCBmb3Igc291bmRzIGFkZCBpdCBub3dcbiAgICAgICAgICAgIGlmICh0aGlzLl9zb3VuZHNCYXNlVXJsICE9PSAnJykge1xuICAgICAgICAgICAgICAgIHNvdW5kVXJsID0gdGhpcy5fc291bmRzQmFzZVVybDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gdHdvIGtpbmQgb2Ygc291cmNlIGFyZSBwb3NzaWJsZSwgYSBzdHJpbmcgKHRoZSB1cmwpIG9yIGFuIG9iamVjdCAoa2V5IGlzIHRoZSBjb2RlYyBhbmQgdmFsdWUgaXMgdGhlIHVybClcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc291cmNlID09PSAnc3RyaW5nJykge1xuXG4gICAgICAgICAgICAgICAgc291bmRVcmwgKz0gc291cmNlO1xuXG4gICAgICAgICAgICAgICAgZmlyc3RNYXRjaGluZ1NvdXJjZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBzb3VuZFVybFxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICBzb3VuZFVybCArPSBzb3VyY2UudXJsO1xuXG4gICAgICAgICAgICAgICAgZmlyc3RNYXRjaGluZ1NvdXJjZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBzb3VuZFVybCxcbiAgICAgICAgICAgICAgICAgICAgY29kZWM6IHNvdXJjZS5jb2RlY1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gZmlyc3RNYXRjaGluZ1NvdXJjZTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBwYXVzZSgpIHtcblxuICAgICAgICAvLyBUT0RPOiBkbyB3ZSBjdHguc3VzcGVuZCgpIGFuZCByZXN1bWUgdGhlIGNvbnRleHQgb24gcGF1c2UgdG8gZnJlZSBkZXZpY2UgcmVzb3VyY2VzP1xuXG4gICAgICAgIGxldCBzb3VuZDogSVNvdW5kIHwgbnVsbCA9IHRoaXMuX2dldFNvdW5kRnJvbVF1ZXVlKCk7XG5cbiAgICAgICAgbGV0IHRpbWVBdFBhdXNlID0gdGhpcy5fYXVkaW9HcmFwaC5zb3VyY2VOb2RlLmNvbnRleHQuY3VycmVudFRpbWU7XG5cbiAgICAgICAgc291bmQucGxheVRpbWVPZmZzZXQgKz0gdGltZUF0UGF1c2UgLSBzb3VuZC5zdGFydFRpbWU7XG5cbiAgICAgICAgdGhpcy5fc3RvcFBsYXlpbmcoKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBzdG9wKCkge1xuXG4gICAgICAgIC8vIHN0b3AgcGxhY2Vob2xkZXJcbiAgICAgICAgLy8gVE9ETzogZG8gd2UgbmVlZCBhIHN0b3AgbWV0aG9kIChvciBpcyBwYXVzZSBlbm91Z2gpXG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX3N0b3BQbGF5aW5nKCkge1xuXG4gICAgICAgIHRoaXMuX2F1ZGlvR3JhcGguc291cmNlTm9kZS5zdG9wKDApO1xuXG4gICAgfVxuXG4gICAgcHVibGljIG5leHQoKSB7XG5cbiAgICAgICAgLy8gVE9ETzogYWRkIGFsaWFzZXMgZm9yIHBsYXkoJ25leHQnKVxuXG4gICAgfVxuXG4gICAgcHVibGljIHByZXZpb3VzKCkge1xuXG4gICAgICAgIC8vIFRPRE86IGFkZCBhbGlhc2VzIGZvciBwbGF5KCdwcmV2aW91cycpXG5cbiAgICB9XG5cbiAgICBwdWJsaWMgZmlyc3QoKSB7XG5cbiAgICAgICAgLy8gVE9ETzogYWRkIGFsaWFzZXMgZm9yIHBsYXkoJ2ZpcnN0JylcblxuICAgIH1cblxuICAgIHB1YmxpYyBsYXN0KCkge1xuXG4gICAgICAgIC8vIFRPRE86IGFkZCBhbGlhc2VzIGZvciBwbGF5KCdsYXN0JylcblxuICAgIH1cblxuLypcblxuICAgIHBsYXllci5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uIHN0b3BGdW5jdGlvbigpIHtcblxuICAgICAgICBpZiAodGhpcy50cmFjayA9PT0gdW5kZWZpbmVkKSB7XG5cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcblxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLnRyYWNrLmlzUGxheWluZykge1xuXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gc3RvcCB0aGUgdHJhY2sgcGxheWJhY2tcbiAgICAgICAgdGhpcy5hdWRpb0dyYXBoLnNvdXJjZU5vZGUuc3RvcCgwKTtcblxuICAgICAgICAvLyBjaGFuZ2UgdGhlIHRyYWNrIGF0dHJpYnV0ZXNcbiAgICAgICAgdGhpcy50cmFjay5pc1BsYXlpbmcgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLnRyYWNrLnBsYXlUaW1lID0gMDtcblxuICAgICAgICAvLyBhZnRlciBhIHN0b3AgeW91IGNhbnQgY2FsbCBhIHN0YXJ0IGFnYWluLCB5b3UgbmVlZCB0byBjcmVhdGUgYSBuZXdcbiAgICAgICAgLy8gc291cmNlIG5vZGUsIHRoaXMgbWVhbnMgdGhhdCB3ZSB1bnNldCB0aGUgYXVkaW9ncmFwaCBhZnRlciBhIHN0b3BcbiAgICAgICAgLy8gc28gdGhhdCBpdCBnZXRzIHJlY3JlYXRlZCBvbiB0aGUgbmV4dCBwbGF5XG4gICAgICAgIHRoaXMuYXVkaW9HcmFwaCA9IHVuZGVmaW5lZDtcbiAgICAgICAgXG4gICAgICAgIC8vIHN0b3AgdGhlIHByb2dyZXNzIHRpbWVyXG4gICAgICAgIHN0b3BUaW1lci5jYWxsKHRoaXMpO1xuXG4gICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgfTtcblxuICAgIHBsYXllci5wcm90b3R5cGUucG9zaXRpb25DaGFuZ2UgPSBmdW5jdGlvbiBwb3NpdGlvbkNoYW5nZUZ1bmN0aW9uKHRyYWNrUG9zaXRpb25JblBlcmNlbnQpIHtcbiAgICAgICAgXG4gICAgICAgIC8vIHN0b3AgdGhlIHRyYWNrIHBsYXliYWNrXG4gICAgICAgIHRoaXMuc3RvcCgpO1xuXG4gICAgICAgIGxldCB0cmFja1Bvc2l0aW9uSW5TZWNvbmRzID0gKHRoaXMudHJhY2suYnVmZmVyLmR1cmF0aW9uIC8gMTAwKSAqIHRyYWNrUG9zaXRpb25JblBlcmNlbnQ7XG5cbiAgICAgICAgdGhpcy50cmFjay5wbGF5VGltZU9mZnNldCA9IHRyYWNrUG9zaXRpb25JblNlY29uZHM7XG5cbiAgICAgICAgLy8gc3RhcnQgdGhlIHBsYXliYWNrIGF0IHRoZSBnaXZlbiBwb3NpdGlvblxuICAgICAgICB0aGlzLnBsYXkoKTtcblxuICAgIH07XG5cbiAgICBsZXQgdHJpZ2dlclByb2dyZXNzRXZlbnQgPSBmdW5jdGlvbiB0cmlnZ2VyUHJvZ3Jlc3NFdmVudEZ1bmN0aW9uKCkge1xuXG4gICAgICAgIGxldCB0aW1lTm93ID0gdGhpcy5hdWRpb0dyYXBoLnNvdXJjZU5vZGUuY29udGV4dC5jdXJyZW50VGltZTtcblxuICAgICAgICB0aGlzLnRyYWNrLnBsYXlUaW1lID0gKHRpbWVOb3cgLSB0aGlzLnRyYWNrLnN0YXJ0VGltZSkgKyB0aGlzLnRyYWNrLnBsYXlUaW1lT2Zmc2V0O1xuXG4gICAgICAgIC8vIGlmIHRoZSBwbGF5ZXIgaXMgYXQgdGhlIGVuZCBvZiB0aGUgdHJhY2tcbiAgICAgICAgaWYgKHRoaXMudHJhY2sucGxheVRpbWUgPj0gdGhpcy50cmFjay5idWZmZXIuZHVyYXRpb24pIHtcblxuICAgICAgICAgICAgdGhpcy5zdG9wKCk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmxvb3BUcmFjaykge1xuXG4gICAgICAgICAgICAgICAgdGhpcy5wbGF5KCk7XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy50cmFjay5wbGF5bGlzdElkICE9PSBudWxsKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ldmVudHMudHJpZ2dlcihcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZXZlbnRzLmNvbnN0YW50cy5QTEFZTElTVF9ORVhULFxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYWNrOiB0aGlzLnRyYWNrXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy50cmFjay5wbGF5ZWRUaW1lUGVyY2VudGFnZSA9ICh0aGlzLnRyYWNrLnBsYXlUaW1lIC8gdGhpcy50cmFjay5idWZmZXIuZHVyYXRpb24pICogMTAwO1xuXG4gICAgICAgIHRoaXMuZXZlbnRzLnRyaWdnZXIoXG4gICAgICAgICAgICB0aGlzLmV2ZW50cy5jb25zdGFudHMuUExBWUVSX1BMQVlJTkdfUFJPR1JFU1MsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcGVyY2VudGFnZTogdGhpcy50cmFjay5wbGF5ZWRUaW1lUGVyY2VudGFnZSxcbiAgICAgICAgICAgICAgICB0cmFjazogdGhpcy50cmFja1xuICAgICAgICAgICAgfVxuICAgICAgICApO1xuXG4gICAgfTsqL1xuXG59XG4iXX0=

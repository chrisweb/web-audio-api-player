(function (dependencies, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(dependencies, factory);
    }
})(["require", "exports", "./sound", "./audio", "./request", "./error"], function (require, exports) {
    'use strict';
    var sound_1 = require("./sound");
    var audio_1 = require("./audio");
    var request_1 = require("./request");
    var error_1 = require("./error");
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
                soundsBaseUrl: '',
                playingProgressIntervalTime: 1000,
                playNextOnEnded: true
            };
            var options = Object.assign({}, defaultOptions, playerOptions);
            this._volume = options.volume;
            this._soundsBaseUrl = options.soundsBaseUrl;
            this._queue = [];
            this._currentIndex = 0;
            this._playingProgressIntervalTime = options.playingProgressIntervalTime;
            this._playNextOnEnded = options.playNextOnEnded;
            this._loopQueue = options.loopQueue;
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
            // player audio library instance
            this._playerAudio = new audio_1.PlayerAudio();
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
            // if there is no current song yet, append the song to the queue
            if (this._currentIndex === null) {
                this._appendSoundToQueue(sound);
            }
            else {
                var afterCurrentIndex = this._currentIndex + 1;
                this._queue.splice(afterCurrentIndex, 0, sound);
            }
        };
        PlayerCore.prototype.resetQueue = function () {
            this._queue = [];
            // TODO: check if a song is getting played and stop it?
        };
        PlayerCore.prototype.getQueue = function () {
            // TODO: is the needed?
            return this._queue;
        };
        PlayerCore.prototype.setVolume = function (volume) {
            this._volume = volume;
            this._playerAudio.changeGainValue(volume);
        };
        PlayerCore.prototype.getVolume = function () {
            return this._volume;
        };
        PlayerCore.prototype.mute = function () {
            this.setVolume(0);
        };
        PlayerCore.prototype.setPosition = function (soundPositionInPercent) {
            // get the current sound if any
            var currentSound = this._getSoundFromQueue();
            // if there is a sound currently being played
            if (currentSound !== null && currentSound.isPlaying) {
                // stop the track playback
                this.pause();
                var soundPositionInSeconds = (currentSound.duration / 100) * soundPositionInPercent;
                // start the playback at the given position
                this.play(currentSound.id, soundPositionInSeconds);
            }
        };
        PlayerCore.prototype._loadSound = function (sound) {
            // TODO: would be good to cache buffers, so need to check if is in cache
            // let the user choose (by setting an option) what amount of sounds will be cached
            // add a cached date / timestamp to be able to clear cache by oldest first
            // or even better add a played counter to cache by least played and date
            var _this = this;
            return new Promise(function (resolve, reject) {
                // if the sound already has an AudioBuffer
                if (sound.audioBuffer !== null) {
                    resolve(sound);
                }
                // if the sound has already an ArrayBuffer but no AudioBuffer
                if (sound.arrayBuffer !== null && sound.audioBuffer === null) {
                    return _this._decodeSound(sound, resolve, reject);
                }
                // if the sound has no ArrayBuffer and also no AudioBuffer yet
                if (sound.arrayBuffer === null && sound.audioBuffer === null) {
                    if (sound.url !== null) {
                        var request = new request_1.PlayerRequest();
                        // change buffering state
                        sound.isBuffering = true;
                        request.getArrayBuffer(sound).then(function (arrayBuffer) {
                            sound.arrayBuffer = arrayBuffer;
                            return _this._decodeSound(sound, resolve, reject);
                        }).catch(function (requestError) {
                            reject(requestError);
                        });
                    }
                    else {
                        var noUrlError = new error_1.PlayerError('sound has no url', 1);
                        reject(noUrlError);
                    }
                }
            });
        };
        PlayerCore.prototype._decodeSound = function (sound, resolve, reject) {
            var arrayBuffer = sound.arrayBuffer;
            this._playerAudio.decodeAudio(arrayBuffer).then(function (audioBuffer) {
                sound.audioBuffer = audioBuffer;
                sound.isBuffering = false;
                sound.isBuffered = true;
                sound.audioBufferDate = new Date();
                sound.duration = sound.audioBuffer.duration;
                resolve(sound);
            }).catch(function (decodeAudioError) {
                reject(decodeAudioError);
            });
        };
        PlayerCore.prototype.play = function (whichSound, playTimeOffset) {
            // TODO: check the available codecs and defined sources, play the first one that has matches and available codec
            // TODO: let user define order of preferred codecs for playerback
            var _this = this;
            // get the current sound if any
            var currentSound = this._getSoundFromQueue();
            // if there is a sound currently being played
            if (currentSound !== null && currentSound.isPlaying) {
                // stop the current sound
                this.stop();
            }
            // whichSound is optional, if set it can be the sound id or if it's a string it can be next / previous / first / last
            var sound = this._getSoundFromQueue(whichSound);
            // if there is no sound we could play, do nothing
            if (sound === null) {
                return;
            }
            // if the user wants to play the sound from a certain position
            if (playTimeOffset !== undefined) {
                sound.playTimeOffset = playTimeOffset;
            }
            // has the sound already been loaded?
            if (!sound.isBuffered) {
                // extract the url and codec from sources
                var _a = this._sourceToVariables(sound.sources), url = _a.url, _b = _a.codec, codec = _b === void 0 ? null : _b;
                sound.url = url;
                sound.codec = codec;
                this._loadSound(sound).then(function () {
                    _this._play(sound);
                }).catch(function (error) {
                    // TODO: handle error
                });
            }
            else {
                this._play(sound);
            }
        };
        PlayerCore.prototype._play = function (sound) {
            var _this = this;
            // source node options
            var sourceNodeOptions = {
                loop: sound.loop,
                onEnded: function () {
                    _this._onEnded();
                }
            };
            // create a new source node
            this._playerAudio.createSourceNode(sourceNodeOptions).then(function (sourceNode) {
                sound.isPlaying = true;
                sound.sourceNode = sourceNode;
                // add the buffer to the source node
                sourceNode.buffer = sound.audioBuffer;
                // the audiocontext time right now (since the audiocontext got created)
                sound.startTime = sourceNode.context.currentTime;
                // connect the source to the graph (destination)
                _this._playerAudio.connectSourceNodeToGraph(sourceNode);
                // start playback
                // start(when, offset, duration)
                sourceNode.start(0, sound.playTimeOffset);
                if (sound.onPlaying !== null) {
                    // at interval set playing progress
                    _this._playingTimeoutID = setInterval(function () {
                        _this._playingProgress(sound);
                    }, _this._playingProgressIntervalTime);
                }
                else {
                    _this._playingTimeoutID = null;
                }
            }).catch(function (error) {
                // TODO: handle error
            });
        };
        PlayerCore.prototype._onEnded = function () {
            // get the current sound if any
            var currentSound = this._getSoundFromQueue();
            // if there is a sound currently being played
            if (currentSound !== null && currentSound.isPlaying) {
                var updateIndex = false;
                var nextSound = this._getSoundFromQueue('next', updateIndex);
                if (currentSound.onEnded !== null) {
                    var willPlayNext = false;
                    // check if there is another sound in the queue and if playing
                    // the next one on ended is activated
                    if (nextSound !== null && this._playNextOnEnded) {
                        willPlayNext = true;
                    }
                    currentSound.onEnded(willPlayNext);
                }
                this.stop();
                if (nextSound !== null) {
                    if (this._playNextOnEnded) {
                        this.play('next');
                    }
                }
                else {
                    // we reached the end of the queue set the currentIndex back to zero
                    this._currentIndex = 0;
                    // if queue loop is active then play
                    if (this._loopQueue) {
                        this.play();
                    }
                }
            }
        };
        /**
         * whichSound is optional, if set it can be the sound id or if it's
         * a string it can be next / previous / first / last
         *
         * @param whichSound
         *
         */
        PlayerCore.prototype._getSoundFromQueue = function (whichSound, updateIndex) {
            if (updateIndex === void 0) { updateIndex = true; }
            var sound = null;
            // check if the queue is empty
            if (this._queue.length === 0) {
                return sound;
            }
            // if which song to play did not get specified, play one based from the queue based on the queue index position marker
            if (whichSound === undefined && this._queue[this._currentIndex] !== undefined) {
                sound = this._queue[this._currentIndex];
            }
            else if (typeof whichSound === 'number') {
                // if which song to play is a numeric ID
                sound = this._findSoundById(whichSound, updateIndex);
            }
            else {
                var soundIndex = null;
                // if which song to play is a constant
                switch (whichSound) {
                    case this.PLAY_SOUND_NEXT:
                        if (this._queue[this._currentIndex + 1] !== undefined) {
                            soundIndex = this._currentIndex + 1;
                            sound = this._queue[soundIndex];
                        }
                        break;
                    case this.PLAY_SOUND_PREVIOUS:
                        if (this._queue[this._currentIndex - 1] !== undefined) {
                            soundIndex = this._currentIndex - 1;
                            sound = this._queue[soundIndex];
                        }
                        break;
                    case this.PLAY_SOUND_FIRST:
                        if (this._queue.length > 0) {
                            soundIndex = 0;
                            sound = this._queue[soundIndex];
                        }
                        break;
                    case this.PLAY_SOUND_LAST:
                        if (this._queue.length > 0) {
                            soundIndex = this._queue.length - 2;
                            sound = this._queue[soundIndex];
                        }
                        break;
                    default:
                        // if which song to play is a string ID
                        sound = this._findSoundById(whichSound, updateIndex);
                }
                if (soundIndex !== null && updateIndex) {
                    this._currentIndex = soundIndex;
                }
            }
            return sound;
        };
        PlayerCore.prototype._findSoundById = function (soundId, updateIndex) {
            var _this = this;
            var sound = null;
            this._queue.some(function (soundFromQueue, queueIndex) {
                if (soundFromQueue.id === soundId) {
                    sound = soundFromQueue;
                    if (updateIndex) {
                        _this._currentIndex = queueIndex;
                    }
                    return true;
                }
            });
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
            // get the current sound
            var sound = this._getSoundFromQueue();
            if (sound === null) {
                return;
            }
            var timeAtPause = sound.sourceNode.context.currentTime;
            sound.playTimeOffset += timeAtPause - sound.startTime;
            this._stop(sound);
        };
        PlayerCore.prototype.stop = function () {
            // get the current sound
            var sound = this._getSoundFromQueue();
            if (sound === null) {
                return;
            }
            sound.playTimeOffset = 0;
            this._stop(sound);
        };
        PlayerCore.prototype._stop = function (sound) {
            // tell the sourceNode to stop playing
            sound.sourceNode.stop(0);
            // tell the sound that playing is over
            sound.isPlaying = false;
            // destroy the source node as it can anyway only get used once
            this._playerAudio.destroySourceNode(sound.sourceNode);
            sound.sourceNode = null;
            if (this._playingTimeoutID !== null) {
                // clear the playing progress setInterval
                clearInterval(this._playingTimeoutID);
            }
        };
        PlayerCore.prototype.next = function () {
            // alias for play next
            this.play('next');
        };
        PlayerCore.prototype.previous = function () {
            // alias for play previous
            this.play('previous');
        };
        PlayerCore.prototype.first = function () {
            // alias for play first
            this.play('first');
        };
        PlayerCore.prototype.last = function () {
            // alias for play last
            this.play('last');
        };
        PlayerCore.prototype._playingProgress = function (sound) {
            var timeNow = sound.sourceNode.context.currentTime;
            sound.playTime = (timeNow - sound.startTime) + sound.playTimeOffset;
            var playingPercentage = (sound.playTime / sound.audioBuffer.duration) * 100;
            sound.playedTimePercentage = playingPercentage;
            sound.onPlaying(playingPercentage, sound.audioBuffer.duration, sound.playTime);
        };
        ;
        return PlayerCore;
    }());
    exports.PlayerCore = PlayerCore;
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,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InNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBQbGF5ZXJTb3VuZCwgSVNvdW5kLCBJU291bmRBdHRyaWJ1dGVzLCBJU291bmRTb3VyY2UgfSBmcm9tICcuL3NvdW5kJztcbmltcG9ydCB7IFBsYXllckF1ZGlvIH0gZnJvbSAnLi9hdWRpbyc7XG5pbXBvcnQgeyBQbGF5ZXJSZXF1ZXN0IH0gZnJvbSAnLi9yZXF1ZXN0JztcbmltcG9ydCB7IFBsYXllckVycm9yLCBJUGxheWVyRXJyb3IgfSBmcm9tICcuL2Vycm9yJztcblxuZXhwb3J0IGludGVyZmFjZSBJQ29yZU9wdGlvbnMge1xuICAgIHZvbHVtZT86IG51bWJlcjtcbiAgICBsb29wUXVldWU/OiBib29sZWFuO1xuICAgIHNvdW5kc0Jhc2VVcmw/OiBzdHJpbmc7XG4gICAgcGxheWluZ1Byb2dyZXNzSW50ZXJ2YWxUaW1lPzogbnVtYmVyO1xufVxuXG5leHBvcnQgY2xhc3MgUGxheWVyQ29yZSB7XG5cbiAgICAvLyBpcyB0aGUgd2ViIGF1ZGlvIEFQSSBzdXBwb3J0ZWRcbiAgICBwcm90ZWN0ZWQgX2lzV2ViQXVkaW9BcGlTdXBwb3J0ZWQ6IGJvb2xlYW47XG4gICAgLy8gdGhlIHNvdW5kcyBxdWV1ZVxuICAgIHByb3RlY3RlZCBfcXVldWU6IElTb3VuZFtdO1xuICAgIC8vIHRoZSB2b2x1bWUgKDAgdG8gMTAwKVxuICAgIHByb3RlY3RlZCBfdm9sdW1lOiBudW1iZXI7XG4gICAgLy8gdGhlIGJhc2UgdXJsIHRoYXQgYWxsIHNvdW5kcyB3aWxsIGhhdmUgaW4gY29tbW9uXG4gICAgcHJvdGVjdGVkIF9zb3VuZHNCYXNlVXJsOiBzdHJpbmc7XG4gICAgLy8gdGhlIGN1cnJlbnQgc291bmQgaW4gcXVldWUgaW5kZXhcbiAgICBwcm90ZWN0ZWQgX2N1cnJlbnRJbmRleDogbnVtYmVyO1xuICAgIC8vIGluc3RhbmNlIG9mIHRoZSBhdWRpbyBsaWJyYXJ5IGNsYXNzXG4gICAgcHJvdGVjdGVkIF9wbGF5ZXJBdWRpbzogUGxheWVyQXVkaW87XG4gICAgLy8gcGxheWluZyBwcm9ncmVzcyB0aW1lIGludGVydmFsXG4gICAgcHJvdGVjdGVkIF9wbGF5aW5nUHJvZ3Jlc3NJbnRlcnZhbFRpbWU6IG51bWJlcjtcbiAgICAvLyBwbGF5aW5nIHByb2dyZXNzIHRpbWVvdXRJRFxuICAgIHByb3RlY3RlZCBfcGxheWluZ1RpbWVvdXRJRDogbnVtYmVyIHwgbnVsbDtcbiAgICAvLyB3aGVuIGEgc29uZyBmaW5pc2hlcywgYXV0b21hdGljYWxseSBwbGF5IHRoZSBuZXh0IG9uZVxuICAgIHByb3RlY3RlZCBfcGxheU5leHRPbkVuZGVkOiBib29sZWFuO1xuICAgIC8vIGRvIHdlIHN0YXJ0IG92ZXIgZ2FpbiBhdCB0aGUgZW5kIG9mIHRoZSBxdWV1ZVxuICAgIHByb3RlY3RlZCBfbG9vcFF1ZXVlOiBib29sZWFuO1xuXG4gICAgLy8gY2FsbGJhY2sgaG9va3NcbiAgICBwdWJsaWMgb25QbGF5U3RhcnQ6ICgpID0+IHZvaWQ7XG4gICAgcHVibGljIG9uUGxheWluZzogKCkgPT4gdm9pZDtcbiAgICBwdWJsaWMgb25CdWZmZXJpbmc6ICgpID0+IHZvaWQ7XG5cbiAgICAvLyBjb25zdGFudHNcbiAgICByZWFkb25seSBXSEVSRV9JTl9RVUVVRV9BVF9FTkQ6IHN0cmluZyA9ICdhcHBlbmQnO1xuICAgIHJlYWRvbmx5IFdIRVJFX0lOX1FVRVVFX0FUX1NUQVJUOiBzdHJpbmcgPSAncHJlcGVuZCc7XG4gICAgcmVhZG9ubHkgV0hFUkVfSU5fUVVFVUVfQUZURVJfQ1VSUkVOVDogc3RyaW5nID0gJ2FmdGVyQ3VycmVudCc7XG5cbiAgICByZWFkb25seSBQTEFZX1NPVU5EX05FWFQgPSAnbmV4dCc7XG4gICAgcmVhZG9ubHkgUExBWV9TT1VORF9QUkVWSU9VUyA9ICdwcmV2aW91cyc7XG4gICAgcmVhZG9ubHkgUExBWV9TT1VORF9GSVJTVCA9ICdmaXJzdCc7XG4gICAgcmVhZG9ubHkgUExBWV9TT1VORF9MQVNUID0gJ2xhc3QnO1xuXG4gICAgY29uc3RydWN0b3IocGxheWVyT3B0aW9uczogSUNvcmVPcHRpb25zKSB7XG5cbiAgICAgICAgbGV0IGRlZmF1bHRPcHRpb25zID0ge1xuICAgICAgICAgICAgdm9sdW1lOiA4MCxcbiAgICAgICAgICAgIGxvb3BRdWV1ZTogZmFsc2UsXG4gICAgICAgICAgICBzb3VuZHNCYXNlVXJsOiAnJyxcbiAgICAgICAgICAgIHBsYXlpbmdQcm9ncmVzc0ludGVydmFsVGltZTogMTAwMCxcbiAgICAgICAgICAgIHBsYXlOZXh0T25FbmRlZDogdHJ1ZVxuICAgICAgICB9O1xuXG4gICAgICAgIGxldCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdE9wdGlvbnMsIHBsYXllck9wdGlvbnMpO1xuXG4gICAgICAgIHRoaXMuX3ZvbHVtZSA9IG9wdGlvbnMudm9sdW1lO1xuICAgICAgICB0aGlzLl9zb3VuZHNCYXNlVXJsID0gb3B0aW9ucy5zb3VuZHNCYXNlVXJsO1xuICAgICAgICB0aGlzLl9xdWV1ZSA9IFtdO1xuICAgICAgICB0aGlzLl9jdXJyZW50SW5kZXggPSAwO1xuICAgICAgICB0aGlzLl9wbGF5aW5nUHJvZ3Jlc3NJbnRlcnZhbFRpbWUgPSBvcHRpb25zLnBsYXlpbmdQcm9ncmVzc0ludGVydmFsVGltZTtcbiAgICAgICAgdGhpcy5fcGxheU5leHRPbkVuZGVkID0gb3B0aW9ucy5wbGF5TmV4dE9uRW5kZWQ7XG4gICAgICAgIHRoaXMuX2xvb3BRdWV1ZSA9IG9wdGlvbnMubG9vcFF1ZXVlO1xuXG4gICAgICAgIHRoaXMuX2luaXRpYWxpemUoKTtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfaW5pdGlhbGl6ZSgpIHtcblxuICAgICAgICAvLyBUT0RPOiBjaGVjayBpZiB3ZWIgYXVkaW8gYXBpIGlzIGF2YWlsYWJsZVxuICAgICAgICBsZXQgd2ViQXVkaW9BcGkgPSB0cnVlO1xuXG4gICAgICAgIC8vIGlzIHRoZSB3ZWIgYXVkaW8gYXBpIHN1cHBvcnRlZFxuICAgICAgICAvLyBpZiBub3Qgd2Ugd2lsbCB1c2UgdGhlIGF1ZGlvIGVsZW1lbnQgYXMgZmFsbGJhY2tcbiAgICAgICAgaWYgKHdlYkF1ZGlvQXBpKSB7XG5cbiAgICAgICAgICAgIHRoaXMuX2lzV2ViQXVkaW9BcGlTdXBwb3J0ZWQgPSB0cnVlO1xuXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgIC8vIHVzZSB0aGUgaHRtbDUgYXVkaW8gZWxlbWVudFxuICAgICAgICAgICAgdGhpcy5faXNXZWJBdWRpb0FwaVN1cHBvcnRlZCA9IGZhbHNlO1xuXG4gICAgICAgIH1cblxuICAgICAgICAvLyBwbGF5ZXIgYXVkaW8gbGlicmFyeSBpbnN0YW5jZVxuICAgICAgICB0aGlzLl9wbGF5ZXJBdWRpbyA9IG5ldyBQbGF5ZXJBdWRpbygpO1xuXG4gICAgfVxuXG4gICAgcHVibGljIGFkZFNvdW5kVG9RdWV1ZShzb3VuZEF0dHJpYnV0ZXM6IElTb3VuZEF0dHJpYnV0ZXMsIHdoZXJlSW5RdWV1ZTogc3RyaW5nID0gdGhpcy5XSEVSRV9JTl9RVUVVRV9BVF9FTkQpOiBJU291bmQge1xuXG4gICAgICAgIGxldCBzb3VuZDogSVNvdW5kID0gbmV3IFBsYXllclNvdW5kKHNvdW5kQXR0cmlidXRlcyk7XG5cbiAgICAgICAgLy8gVE9ETzogaXMgcXVldWUganVzdCBhbiBhcnJheSBvZiBzb3VuZHMsIG9yIGRvIHdlIG5lZWQgc29tZXRoaW5nIG1vcmUgY29tcGxleCB3aXRoIGEgcG9zaXRpb24gdHJhY2tlcj9cblxuICAgICAgICAvLyBUT0RPOiBhbGxvdyBhcnJheSBvZiBzb3VuZEF0dHJpYnV0ZXMgdG8gYmUgaW5qZWN0ZWQsIHRvIGNyZWF0ZSBzZXZlcmFsIGF0IG9uY2UsIGlmIGlucHV0IGlzIGFuIGFycmF5IG91dHB1dCBzaG91bGQgYmUgdG9vXG5cbiAgICAgICAgc3dpdGNoICh3aGVyZUluUXVldWUpIHtcbiAgICAgICAgICAgIGNhc2UgdGhpcy5XSEVSRV9JTl9RVUVVRV9BVF9FTkQ6XG4gICAgICAgICAgICAgICAgdGhpcy5fYXBwZW5kU291bmRUb1F1ZXVlKHNvdW5kKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgdGhpcy5XSEVSRV9JTl9RVUVVRV9BVF9TVEFSVDpcbiAgICAgICAgICAgICAgICB0aGlzLl9wcmVwZW5kU291bmRUb1F1ZXVlKHNvdW5kKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgdGhpcy5XSEVSRV9JTl9RVUVVRV9BRlRFUl9DVVJSRU5UOlxuICAgICAgICAgICAgICAgIHRoaXMuX3ByZXBlbmRTb3VuZFRvUXVldWUoc291bmQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHNvdW5kO1xuXG4gICAgfVxuXG4gICAgcHVibGljIF9hcHBlbmRTb3VuZFRvUXVldWUoc291bmQ6IElTb3VuZCk6IHZvaWQge1xuXG4gICAgICAgIHRoaXMuX3F1ZXVlLnB1c2goc291bmQpO1xuXG4gICAgfVxuXG4gICAgcHVibGljIF9wcmVwZW5kU291bmRUb1F1ZXVlKHNvdW5kOiBJU291bmQpOiB2b2lkIHtcblxuICAgICAgICB0aGlzLl9xdWV1ZS51bnNoaWZ0KHNvdW5kKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBfYWRkU291bmRUb1F1ZXVlQWZ0ZXJDdXJyZW50KHNvdW5kOiBJU291bmQpOiB2b2lkIHtcblxuICAgICAgICAvLyBUT0RPOiBhZGQgb3B0aW9uIHRvIHBsYXkgYWZ0ZXIgYmVpbmcgYWRkZWQgb3IgdXNlciB1c2VzIHBsYXkgbWV0aG9kP1xuXG4gICAgICAgIC8vIGlmIHRoZXJlIGlzIG5vIGN1cnJlbnQgc29uZyB5ZXQsIGFwcGVuZCB0aGUgc29uZyB0byB0aGUgcXVldWVcbiAgICAgICAgaWYgKHRoaXMuX2N1cnJlbnRJbmRleCA9PT0gbnVsbCkge1xuXG4gICAgICAgICAgICB0aGlzLl9hcHBlbmRTb3VuZFRvUXVldWUoc291bmQpO1xuXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgIGxldCBhZnRlckN1cnJlbnRJbmRleCA9IHRoaXMuX2N1cnJlbnRJbmRleCArIDE7XG5cbiAgICAgICAgICAgIHRoaXMuX3F1ZXVlLnNwbGljZShhZnRlckN1cnJlbnRJbmRleCwgMCwgc291bmQpO1xuXG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHB1YmxpYyByZXNldFF1ZXVlKCkge1xuXG4gICAgICAgIHRoaXMuX3F1ZXVlID0gW107XG5cbiAgICAgICAgLy8gVE9ETzogY2hlY2sgaWYgYSBzb25nIGlzIGdldHRpbmcgcGxheWVkIGFuZCBzdG9wIGl0P1xuXG4gICAgfVxuXG4gICAgcHVibGljIGdldFF1ZXVlKCkge1xuXG4gICAgICAgIC8vIFRPRE86IGlzIHRoZSBuZWVkZWQ/XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX3F1ZXVlO1xuXG4gICAgfVxuXG4gICAgcHVibGljIHNldFZvbHVtZSh2b2x1bWU6IG51bWJlcik6IHZvaWQge1xuXG4gICAgICAgIHRoaXMuX3ZvbHVtZSA9IHZvbHVtZTtcblxuICAgICAgICB0aGlzLl9wbGF5ZXJBdWRpby5jaGFuZ2VHYWluVmFsdWUodm9sdW1lKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBnZXRWb2x1bWUoKTogbnVtYmVyIHtcblxuICAgICAgICByZXR1cm4gdGhpcy5fdm9sdW1lO1xuXG4gICAgfVxuXG4gICAgcHVibGljIG11dGUoKSB7XG5cbiAgICAgICAgdGhpcy5zZXRWb2x1bWUoMCk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0UG9zaXRpb24oc291bmRQb3NpdGlvbkluUGVyY2VudDogbnVtYmVyKTogdm9pZCB7XG5cbiAgICAgICAgLy8gZ2V0IHRoZSBjdXJyZW50IHNvdW5kIGlmIGFueVxuICAgICAgICBsZXQgY3VycmVudFNvdW5kID0gdGhpcy5fZ2V0U291bmRGcm9tUXVldWUoKTtcblxuICAgICAgICAvLyBpZiB0aGVyZSBpcyBhIHNvdW5kIGN1cnJlbnRseSBiZWluZyBwbGF5ZWRcbiAgICAgICAgaWYgKGN1cnJlbnRTb3VuZCAhPT0gbnVsbCAmJiBjdXJyZW50U291bmQuaXNQbGF5aW5nKSB7XG5cbiAgICAgICAgICAgIC8vIHN0b3AgdGhlIHRyYWNrIHBsYXliYWNrXG4gICAgICAgICAgICB0aGlzLnBhdXNlKCk7XG5cbiAgICAgICAgICAgIGxldCBzb3VuZFBvc2l0aW9uSW5TZWNvbmRzID0gKGN1cnJlbnRTb3VuZC5kdXJhdGlvbiAvIDEwMCkgKiBzb3VuZFBvc2l0aW9uSW5QZXJjZW50O1xuXG4gICAgICAgICAgICAvLyBzdGFydCB0aGUgcGxheWJhY2sgYXQgdGhlIGdpdmVuIHBvc2l0aW9uXG4gICAgICAgICAgICB0aGlzLnBsYXkoY3VycmVudFNvdW5kLmlkLCBzb3VuZFBvc2l0aW9uSW5TZWNvbmRzKTtcblxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX2xvYWRTb3VuZChzb3VuZDogSVNvdW5kKTogUHJvbWlzZTxJU291bmQgfCBQbGF5ZXJFcnJvcj4ge1xuXG4gICAgICAgIC8vIFRPRE86IHdvdWxkIGJlIGdvb2QgdG8gY2FjaGUgYnVmZmVycywgc28gbmVlZCB0byBjaGVjayBpZiBpcyBpbiBjYWNoZVxuICAgICAgICAvLyBsZXQgdGhlIHVzZXIgY2hvb3NlIChieSBzZXR0aW5nIGFuIG9wdGlvbikgd2hhdCBhbW91bnQgb2Ygc291bmRzIHdpbGwgYmUgY2FjaGVkXG4gICAgICAgIC8vIGFkZCBhIGNhY2hlZCBkYXRlIC8gdGltZXN0YW1wIHRvIGJlIGFibGUgdG8gY2xlYXIgY2FjaGUgYnkgb2xkZXN0IGZpcnN0XG4gICAgICAgIC8vIG9yIGV2ZW4gYmV0dGVyIGFkZCBhIHBsYXllZCBjb3VudGVyIHRvIGNhY2hlIGJ5IGxlYXN0IHBsYXllZCBhbmQgZGF0ZVxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgICAgIC8vIGlmIHRoZSBzb3VuZCBhbHJlYWR5IGhhcyBhbiBBdWRpb0J1ZmZlclxuICAgICAgICAgICAgaWYgKHNvdW5kLmF1ZGlvQnVmZmVyICE9PSBudWxsKSB7XG5cbiAgICAgICAgICAgICAgICByZXNvbHZlKHNvdW5kKTtcblxuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgIC8vIGlmIHRoZSBzb3VuZCBoYXMgYWxyZWFkeSBhbiBBcnJheUJ1ZmZlciBidXQgbm8gQXVkaW9CdWZmZXJcbiAgICAgICAgICAgIGlmIChzb3VuZC5hcnJheUJ1ZmZlciAhPT0gbnVsbCAmJiBzb3VuZC5hdWRpb0J1ZmZlciA9PT0gbnVsbCkge1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2RlY29kZVNvdW5kKHNvdW5kLCByZXNvbHZlLCByZWplY3QpO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGlmIHRoZSBzb3VuZCBoYXMgbm8gQXJyYXlCdWZmZXIgYW5kIGFsc28gbm8gQXVkaW9CdWZmZXIgeWV0XG4gICAgICAgICAgICBpZiAoc291bmQuYXJyYXlCdWZmZXIgPT09IG51bGwgJiYgc291bmQuYXVkaW9CdWZmZXIgPT09IG51bGwpIHtcblxuICAgICAgICAgICAgICAgIGlmIChzb3VuZC51cmwgIT09IG51bGwpIHtcblxuICAgICAgICAgICAgICAgICAgICBsZXQgcmVxdWVzdCA9IG5ldyBQbGF5ZXJSZXF1ZXN0KCk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gY2hhbmdlIGJ1ZmZlcmluZyBzdGF0ZVxuICAgICAgICAgICAgICAgICAgICBzb3VuZC5pc0J1ZmZlcmluZyA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdC5nZXRBcnJheUJ1ZmZlcihzb3VuZCkudGhlbigoYXJyYXlCdWZmZXI6IEFycmF5QnVmZmVyKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdW5kLmFycmF5QnVmZmVyID0gYXJyYXlCdWZmZXI7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9kZWNvZGVTb3VuZChzb3VuZCwgcmVzb2x2ZSwgcmVqZWN0KTtcblxuICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaCgocmVxdWVzdEVycm9yOiBJUGxheWVyRXJyb3IpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHJlcXVlc3RFcnJvcik7XG5cbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgICAgIGxldCBub1VybEVycm9yID0gbmV3IFBsYXllckVycm9yKCdzb3VuZCBoYXMgbm8gdXJsJywgMSk7XG5cbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KG5vVXJsRXJyb3IpO1xuXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX2RlY29kZVNvdW5kKHNvdW5kOiBJU291bmQsIHJlc29sdmU6IEZ1bmN0aW9uLCByZWplY3Q6IEZ1bmN0aW9uKSB7XG5cbiAgICAgICAgbGV0IGFycmF5QnVmZmVyID0gc291bmQuYXJyYXlCdWZmZXI7XG5cbiAgICAgICAgdGhpcy5fcGxheWVyQXVkaW8uZGVjb2RlQXVkaW8oYXJyYXlCdWZmZXIpLnRoZW4oKGF1ZGlvQnVmZmVyOiBBdWRpb0J1ZmZlcikgPT4ge1xuXG4gICAgICAgICAgICBzb3VuZC5hdWRpb0J1ZmZlciA9IGF1ZGlvQnVmZmVyO1xuICAgICAgICAgICAgc291bmQuaXNCdWZmZXJpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIHNvdW5kLmlzQnVmZmVyZWQgPSB0cnVlO1xuICAgICAgICAgICAgc291bmQuYXVkaW9CdWZmZXJEYXRlID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgIHNvdW5kLmR1cmF0aW9uID0gc291bmQuYXVkaW9CdWZmZXIuZHVyYXRpb247XG5cbiAgICAgICAgICAgIHJlc29sdmUoc291bmQpO1xuXG4gICAgICAgIH0pLmNhdGNoKChkZWNvZGVBdWRpb0Vycm9yOiBJUGxheWVyRXJyb3IpID0+IHtcblxuICAgICAgICAgICAgcmVqZWN0KGRlY29kZUF1ZGlvRXJyb3IpO1xuXG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG4gICAgcHVibGljIHBsYXkod2hpY2hTb3VuZD86IG51bWJlciB8IHN0cmluZyB8IHVuZGVmaW5lZCwgcGxheVRpbWVPZmZzZXQ/OiBudW1iZXIpOiB2b2lkIHtcblxuICAgICAgICAvLyBUT0RPOiBjaGVjayB0aGUgYXZhaWxhYmxlIGNvZGVjcyBhbmQgZGVmaW5lZCBzb3VyY2VzLCBwbGF5IHRoZSBmaXJzdCBvbmUgdGhhdCBoYXMgbWF0Y2hlcyBhbmQgYXZhaWxhYmxlIGNvZGVjXG4gICAgICAgIC8vIFRPRE86IGxldCB1c2VyIGRlZmluZSBvcmRlciBvZiBwcmVmZXJyZWQgY29kZWNzIGZvciBwbGF5ZXJiYWNrXG5cbiAgICAgICAgLy8gZ2V0IHRoZSBjdXJyZW50IHNvdW5kIGlmIGFueVxuICAgICAgICBsZXQgY3VycmVudFNvdW5kID0gdGhpcy5fZ2V0U291bmRGcm9tUXVldWUoKTtcblxuICAgICAgICAvLyBpZiB0aGVyZSBpcyBhIHNvdW5kIGN1cnJlbnRseSBiZWluZyBwbGF5ZWRcbiAgICAgICAgaWYgKGN1cnJlbnRTb3VuZCAhPT0gbnVsbCAmJiBjdXJyZW50U291bmQuaXNQbGF5aW5nKSB7XG5cbiAgICAgICAgICAgIC8vIHN0b3AgdGhlIGN1cnJlbnQgc291bmRcbiAgICAgICAgICAgIHRoaXMuc3RvcCgpO1xuXG4gICAgICAgIH1cblxuICAgICAgICAvLyB3aGljaFNvdW5kIGlzIG9wdGlvbmFsLCBpZiBzZXQgaXQgY2FuIGJlIHRoZSBzb3VuZCBpZCBvciBpZiBpdCdzIGEgc3RyaW5nIGl0IGNhbiBiZSBuZXh0IC8gcHJldmlvdXMgLyBmaXJzdCAvIGxhc3RcbiAgICAgICAgbGV0IHNvdW5kID0gdGhpcy5fZ2V0U291bmRGcm9tUXVldWUod2hpY2hTb3VuZCk7XG5cbiAgICAgICAgLy8gaWYgdGhlcmUgaXMgbm8gc291bmQgd2UgY291bGQgcGxheSwgZG8gbm90aGluZ1xuICAgICAgICBpZiAoc291bmQgPT09IG51bGwpIHtcblxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgICAgICAvLyBUT0RPOiB0aHJvdyBhbiBlcnJvcj9cblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgdGhlIHVzZXIgd2FudHMgdG8gcGxheSB0aGUgc291bmQgZnJvbSBhIGNlcnRhaW4gcG9zaXRpb25cbiAgICAgICAgaWYgKHBsYXlUaW1lT2Zmc2V0ICE9PSB1bmRlZmluZWQpIHtcblxuICAgICAgICAgICAgc291bmQucGxheVRpbWVPZmZzZXQgPSBwbGF5VGltZU9mZnNldDtcblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gaGFzIHRoZSBzb3VuZCBhbHJlYWR5IGJlZW4gbG9hZGVkP1xuICAgICAgICBpZiAoIXNvdW5kLmlzQnVmZmVyZWQpIHtcblxuICAgICAgICAgICAgLy8gZXh0cmFjdCB0aGUgdXJsIGFuZCBjb2RlYyBmcm9tIHNvdXJjZXNcbiAgICAgICAgICAgIGxldCB7IHVybCwgY29kZWMgPSBudWxsIH0gPSB0aGlzLl9zb3VyY2VUb1ZhcmlhYmxlcyhzb3VuZC5zb3VyY2VzKTtcblxuICAgICAgICAgICAgc291bmQudXJsID0gdXJsO1xuICAgICAgICAgICAgc291bmQuY29kZWMgPSBjb2RlYztcblxuICAgICAgICAgICAgdGhpcy5fbG9hZFNvdW5kKHNvdW5kKS50aGVuKCgpID0+IHtcblxuICAgICAgICAgICAgICAgIHRoaXMuX3BsYXkoc291bmQpO1xuXG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyb3IpID0+IHtcblxuICAgICAgICAgICAgICAgIC8vIFRPRE86IGhhbmRsZSBlcnJvclxuXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICB0aGlzLl9wbGF5KHNvdW5kKTtcblxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX3BsYXkoc291bmQ6IElTb3VuZCkge1xuXG4gICAgICAgIC8vIHNvdXJjZSBub2RlIG9wdGlvbnNcbiAgICAgICAgbGV0IHNvdXJjZU5vZGVPcHRpb25zID0ge1xuICAgICAgICAgICAgbG9vcDogc291bmQubG9vcCxcbiAgICAgICAgICAgIG9uRW5kZWQ6ICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9vbkVuZGVkKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gY3JlYXRlIGEgbmV3IHNvdXJjZSBub2RlXG4gICAgICAgIHRoaXMuX3BsYXllckF1ZGlvLmNyZWF0ZVNvdXJjZU5vZGUoc291cmNlTm9kZU9wdGlvbnMpLnRoZW4oKHNvdXJjZU5vZGUpID0+IHtcblxuICAgICAgICAgICAgc291bmQuaXNQbGF5aW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIHNvdW5kLnNvdXJjZU5vZGUgPSBzb3VyY2VOb2RlO1xuXG4gICAgICAgICAgICAvLyBhZGQgdGhlIGJ1ZmZlciB0byB0aGUgc291cmNlIG5vZGVcbiAgICAgICAgICAgIHNvdXJjZU5vZGUuYnVmZmVyID0gc291bmQuYXVkaW9CdWZmZXI7XG5cbiAgICAgICAgICAgIC8vIHRoZSBhdWRpb2NvbnRleHQgdGltZSByaWdodCBub3cgKHNpbmNlIHRoZSBhdWRpb2NvbnRleHQgZ290IGNyZWF0ZWQpXG4gICAgICAgICAgICBzb3VuZC5zdGFydFRpbWUgPSBzb3VyY2VOb2RlLmNvbnRleHQuY3VycmVudFRpbWU7XG5cbiAgICAgICAgICAgIC8vIGNvbm5lY3QgdGhlIHNvdXJjZSB0byB0aGUgZ3JhcGggKGRlc3RpbmF0aW9uKVxuICAgICAgICAgICAgdGhpcy5fcGxheWVyQXVkaW8uY29ubmVjdFNvdXJjZU5vZGVUb0dyYXBoKHNvdXJjZU5vZGUpO1xuXG4gICAgICAgICAgICAvLyBzdGFydCBwbGF5YmFja1xuICAgICAgICAgICAgLy8gc3RhcnQod2hlbiwgb2Zmc2V0LCBkdXJhdGlvbilcbiAgICAgICAgICAgIHNvdXJjZU5vZGUuc3RhcnQoMCwgc291bmQucGxheVRpbWVPZmZzZXQpO1xuXG4gICAgICAgICAgICBpZiAoc291bmQub25QbGF5aW5nICE9PSBudWxsKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBhdCBpbnRlcnZhbCBzZXQgcGxheWluZyBwcm9ncmVzc1xuICAgICAgICAgICAgICAgIHRoaXMuX3BsYXlpbmdUaW1lb3V0SUQgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcGxheWluZ1Byb2dyZXNzKHNvdW5kKTtcblxuICAgICAgICAgICAgICAgIH0sIHRoaXMuX3BsYXlpbmdQcm9ncmVzc0ludGVydmFsVGltZSk7XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9wbGF5aW5nVGltZW91dElEID0gbnVsbDtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0pLmNhdGNoKChlcnJvcikgPT4ge1xuXG4gICAgICAgICAgICAvLyBUT0RPOiBoYW5kbGUgZXJyb3JcblxuICAgICAgICB9KTtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfb25FbmRlZCgpIHtcblxuICAgICAgICAvLyBnZXQgdGhlIGN1cnJlbnQgc291bmQgaWYgYW55XG4gICAgICAgIGxldCBjdXJyZW50U291bmQgPSB0aGlzLl9nZXRTb3VuZEZyb21RdWV1ZSgpO1xuXG4gICAgICAgIC8vIGlmIHRoZXJlIGlzIGEgc291bmQgY3VycmVudGx5IGJlaW5nIHBsYXllZFxuICAgICAgICBpZiAoY3VycmVudFNvdW5kICE9PSBudWxsICYmIGN1cnJlbnRTb3VuZC5pc1BsYXlpbmcpIHtcblxuICAgICAgICAgICAgbGV0IHVwZGF0ZUluZGV4ID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGxldCBuZXh0U291bmQgPSB0aGlzLl9nZXRTb3VuZEZyb21RdWV1ZSgnbmV4dCcsIHVwZGF0ZUluZGV4KTtcblxuICAgICAgICAgICAgaWYgKGN1cnJlbnRTb3VuZC5vbkVuZGVkICE9PSBudWxsKSB7XG5cbiAgICAgICAgICAgICAgICBsZXQgd2lsbFBsYXlOZXh0ID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAvLyBjaGVjayBpZiB0aGVyZSBpcyBhbm90aGVyIHNvdW5kIGluIHRoZSBxdWV1ZSBhbmQgaWYgcGxheWluZ1xuICAgICAgICAgICAgICAgIC8vIHRoZSBuZXh0IG9uZSBvbiBlbmRlZCBpcyBhY3RpdmF0ZWRcbiAgICAgICAgICAgICAgICBpZiAobmV4dFNvdW5kICE9PSBudWxsICYmIHRoaXMuX3BsYXlOZXh0T25FbmRlZCkge1xuICAgICAgICAgICAgICAgICAgICB3aWxsUGxheU5leHQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGN1cnJlbnRTb3VuZC5vbkVuZGVkKHdpbGxQbGF5TmV4dCk7XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5zdG9wKCk7XG5cbiAgICAgICAgICAgIGlmIChuZXh0U291bmQgIT09IG51bGwpIHtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9wbGF5TmV4dE9uRW5kZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wbGF5KCduZXh0Jyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgLy8gd2UgcmVhY2hlZCB0aGUgZW5kIG9mIHRoZSBxdWV1ZSBzZXQgdGhlIGN1cnJlbnRJbmRleCBiYWNrIHRvIHplcm9cbiAgICAgICAgICAgICAgICB0aGlzLl9jdXJyZW50SW5kZXggPSAwO1xuXG4gICAgICAgICAgICAgICAgLy8gaWYgcXVldWUgbG9vcCBpcyBhY3RpdmUgdGhlbiBwbGF5XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2xvb3BRdWV1ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsYXkoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiB3aGljaFNvdW5kIGlzIG9wdGlvbmFsLCBpZiBzZXQgaXQgY2FuIGJlIHRoZSBzb3VuZCBpZCBvciBpZiBpdCdzXG4gICAgICogYSBzdHJpbmcgaXQgY2FuIGJlIG5leHQgLyBwcmV2aW91cyAvIGZpcnN0IC8gbGFzdFxuICAgICAqIFxuICAgICAqIEBwYXJhbSB3aGljaFNvdW5kXG4gICAgICogXG4gICAgICovXG4gICAgcHJvdGVjdGVkIF9nZXRTb3VuZEZyb21RdWV1ZSh3aGljaFNvdW5kPzogc3RyaW5nIHwgbnVtYmVyLCB1cGRhdGVJbmRleDogYm9vbGVhbiA9IHRydWUpOiBJU291bmQgfCBudWxsIHtcblxuICAgICAgICBsZXQgc291bmQgPSBudWxsO1xuXG4gICAgICAgIC8vIGNoZWNrIGlmIHRoZSBxdWV1ZSBpcyBlbXB0eVxuICAgICAgICBpZiAodGhpcy5fcXVldWUubGVuZ3RoID09PSAwKSB7XG5cbiAgICAgICAgICAgIHJldHVybiBzb3VuZDtcblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgd2hpY2ggc29uZyB0byBwbGF5IGRpZCBub3QgZ2V0IHNwZWNpZmllZCwgcGxheSBvbmUgYmFzZWQgZnJvbSB0aGUgcXVldWUgYmFzZWQgb24gdGhlIHF1ZXVlIGluZGV4IHBvc2l0aW9uIG1hcmtlclxuICAgICAgICBpZiAod2hpY2hTb3VuZCA9PT0gdW5kZWZpbmVkICYmIHRoaXMuX3F1ZXVlW3RoaXMuX2N1cnJlbnRJbmRleF0gIT09IHVuZGVmaW5lZCkge1xuXG4gICAgICAgICAgICBzb3VuZCA9IHRoaXMuX3F1ZXVlW3RoaXMuX2N1cnJlbnRJbmRleF07XG5cbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygd2hpY2hTb3VuZCA9PT0gJ251bWJlcicpIHtcblxuICAgICAgICAgICAgLy8gaWYgd2hpY2ggc29uZyB0byBwbGF5IGlzIGEgbnVtZXJpYyBJRFxuICAgICAgICAgICAgc291bmQgPSB0aGlzLl9maW5kU291bmRCeUlkKHdoaWNoU291bmQsIHVwZGF0ZUluZGV4KTtcblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICBsZXQgc291bmRJbmRleDogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG5cbiAgICAgICAgICAgIC8vIGlmIHdoaWNoIHNvbmcgdG8gcGxheSBpcyBhIGNvbnN0YW50XG4gICAgICAgICAgICBzd2l0Y2ggKHdoaWNoU291bmQpIHtcbiAgICAgICAgICAgICAgICBjYXNlIHRoaXMuUExBWV9TT1VORF9ORVhUOlxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fcXVldWVbdGhpcy5fY3VycmVudEluZGV4ICsgMV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc291bmRJbmRleCA9IHRoaXMuX2N1cnJlbnRJbmRleCArIDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VuZCA9IHRoaXMuX3F1ZXVlW3NvdW5kSW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgdGhpcy5QTEFZX1NPVU5EX1BSRVZJT1VTOlxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fcXVldWVbdGhpcy5fY3VycmVudEluZGV4IC0gMV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc291bmRJbmRleCA9IHRoaXMuX2N1cnJlbnRJbmRleCAtIDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VuZCA9IHRoaXMuX3F1ZXVlW3NvdW5kSW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgdGhpcy5QTEFZX1NPVU5EX0ZJUlNUOlxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fcXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc291bmRJbmRleCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VuZCA9IHRoaXMuX3F1ZXVlW3NvdW5kSW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgdGhpcy5QTEFZX1NPVU5EX0xBU1Q6XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9xdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VuZEluZGV4ID0gdGhpcy5fcXVldWUubGVuZ3RoIC0gMjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdW5kID0gdGhpcy5fcXVldWVbc291bmRJbmRleF07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgd2hpY2ggc29uZyB0byBwbGF5IGlzIGEgc3RyaW5nIElEXG4gICAgICAgICAgICAgICAgICAgIHNvdW5kID0gdGhpcy5fZmluZFNvdW5kQnlJZCh3aGljaFNvdW5kLCB1cGRhdGVJbmRleCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzb3VuZEluZGV4ICE9PSBudWxsICYmIHVwZGF0ZUluZGV4KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fY3VycmVudEluZGV4ID0gc291bmRJbmRleDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHNvdW5kO1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9maW5kU291bmRCeUlkKHNvdW5kSWQ6IHN0cmluZyB8IG51bWJlciwgdXBkYXRlSW5kZXg6IGJvb2xlYW4pOiBJU291bmQgfCBudWxsIHtcblxuICAgICAgICBsZXQgc291bmQgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuX3F1ZXVlLnNvbWUoKHNvdW5kRnJvbVF1ZXVlOiBJU291bmQsIHF1ZXVlSW5kZXg6IG51bWJlcikgPT4ge1xuXG4gICAgICAgICAgICBpZiAoc291bmRGcm9tUXVldWUuaWQgPT09IHNvdW5kSWQpIHtcblxuICAgICAgICAgICAgICAgIHNvdW5kID0gc291bmRGcm9tUXVldWU7XG5cbiAgICAgICAgICAgICAgICBpZiAodXBkYXRlSW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY3VycmVudEluZGV4ID0gcXVldWVJbmRleDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBzb3VuZDtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfc291cmNlVG9WYXJpYWJsZXMoc291cmNlczogKElTb3VuZFNvdXJjZSB8IHN0cmluZylbXSk6IHsgdXJsOiBzdHJpbmcgfCBudWxsLCBjb2RlYz86IHN0cmluZyB8IG51bGwgfSB7XG5cbiAgICAgICAgLy8gVE9ETzogc291cmNlIGNhbiBiZSBvbiBvYmplY3Qgd2hlcmUgdGhlIHByb3BlcnR5IG5hbWUgaXMgdGhlIGNvZGVjIGFuZCB0aGUgdmFsdWUgaXMgdGhlIHNvdW5kIHVybFxuICAgICAgICAvLyBpZiBzb3VuZCBpc250IGFuIG9iamVjdCB0cnkgdG8gZGV0ZWN0IHNvdW5kIHNvdXJjZSBleHRlbnNpb24gYnkgZmlsZSBleHRlbnRpb24gb3IgYnkgY2hlY2tpbmcgdGhlIGZpbGUgbWltZSB0eXBlXG5cbiAgICAgICAgLy8gVE9ETzogZ2V0IGEgbGlzdCBvZiBzdXBwb3J0ZWQgY29kZWNzIGJ5IHRoaXMgZGV2aWNlXG5cbiAgICAgICAgbGV0IGZpcnN0TWF0Y2hpbmdTb3VyY2U6IHsgdXJsOiBzdHJpbmcgfCBudWxsLCBjb2RlYz86IHN0cmluZyB8IG51bGwgfSA9IHtcbiAgICAgICAgICAgIHVybDogbnVsbCxcbiAgICAgICAgICAgIGNvZGVjOiBudWxsXG4gICAgICAgIH07XG5cbiAgICAgICAgc291cmNlcy5mb3JFYWNoKChzb3VyY2UpID0+IHtcblxuICAgICAgICAgICAgLy8gVE9ETzogZmluZCBvdXQgd2hhdCB0aGUgc291cmNlIGNvZGVjIGlzXG5cbiAgICAgICAgICAgIC8vIFRPRE86IGNoZWNrIGlmIHRoZSBzb3VyY2UgY29kZWMgaXMgYW1vbmcgdGhlIG9uZXMgdGhhdCBhcmUgc3VwcG9ydGVkIGJ5IHRoaXMgZGV2aWNlXG5cbiAgICAgICAgICAgIGxldCBzb3VuZFVybCA9ICcnO1xuXG4gICAgICAgICAgICAvLyBpZiB0aGUgcGxheWVyIGhhZCBhcyBvcHRpb24gYSBiYXNlVXJsIGZvciBzb3VuZHMgYWRkIGl0IG5vd1xuICAgICAgICAgICAgaWYgKHRoaXMuX3NvdW5kc0Jhc2VVcmwgIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgc291bmRVcmwgPSB0aGlzLl9zb3VuZHNCYXNlVXJsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyB0d28ga2luZCBvZiBzb3VyY2UgYXJlIHBvc3NpYmxlLCBhIHN0cmluZyAodGhlIHVybCkgb3IgYW4gb2JqZWN0IChrZXkgaXMgdGhlIGNvZGVjIGFuZCB2YWx1ZSBpcyB0aGUgdXJsKVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBzb3VyY2UgPT09ICdzdHJpbmcnKSB7XG5cbiAgICAgICAgICAgICAgICBzb3VuZFVybCArPSBzb3VyY2U7XG5cbiAgICAgICAgICAgICAgICBmaXJzdE1hdGNoaW5nU291cmNlID0ge1xuICAgICAgICAgICAgICAgICAgICB1cmw6IHNvdW5kVXJsXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgIHNvdW5kVXJsICs9IHNvdXJjZS51cmw7XG5cbiAgICAgICAgICAgICAgICBmaXJzdE1hdGNoaW5nU291cmNlID0ge1xuICAgICAgICAgICAgICAgICAgICB1cmw6IHNvdW5kVXJsLFxuICAgICAgICAgICAgICAgICAgICBjb2RlYzogc291cmNlLmNvZGVjXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBmaXJzdE1hdGNoaW5nU291cmNlO1xuXG4gICAgfVxuXG4gICAgcHVibGljIHBhdXNlKCkge1xuXG4gICAgICAgIC8vIGdldCB0aGUgY3VycmVudCBzb3VuZFxuICAgICAgICBsZXQgc291bmQ6IElTb3VuZCB8IG51bGwgPSB0aGlzLl9nZXRTb3VuZEZyb21RdWV1ZSgpO1xuXG4gICAgICAgIGlmIChzb3VuZCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHRpbWVBdFBhdXNlID0gc291bmQuc291cmNlTm9kZS5jb250ZXh0LmN1cnJlbnRUaW1lO1xuXG4gICAgICAgIHNvdW5kLnBsYXlUaW1lT2Zmc2V0ICs9IHRpbWVBdFBhdXNlIC0gc291bmQuc3RhcnRUaW1lO1xuXG4gICAgICAgIHRoaXMuX3N0b3Aoc291bmQpO1xuXG4gICAgfVxuXG4gICAgcHVibGljIHN0b3AoKSB7XG5cbiAgICAgICAgLy8gZ2V0IHRoZSBjdXJyZW50IHNvdW5kXG4gICAgICAgIGxldCBzb3VuZDogSVNvdW5kIHwgbnVsbCA9IHRoaXMuX2dldFNvdW5kRnJvbVF1ZXVlKCk7XG5cbiAgICAgICAgaWYgKHNvdW5kID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBzb3VuZC5wbGF5VGltZU9mZnNldCA9IDA7XG5cbiAgICAgICAgdGhpcy5fc3RvcChzb3VuZCk7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX3N0b3Aoc291bmQ6IElTb3VuZCkge1xuXG4gICAgICAgIC8vIHRlbGwgdGhlIHNvdXJjZU5vZGUgdG8gc3RvcCBwbGF5aW5nXG4gICAgICAgIHNvdW5kLnNvdXJjZU5vZGUuc3RvcCgwKTtcblxuICAgICAgICAvLyB0ZWxsIHRoZSBzb3VuZCB0aGF0IHBsYXlpbmcgaXMgb3ZlclxuICAgICAgICBzb3VuZC5pc1BsYXlpbmcgPSBmYWxzZTtcblxuICAgICAgICAvLyBkZXN0cm95IHRoZSBzb3VyY2Ugbm9kZSBhcyBpdCBjYW4gYW55d2F5IG9ubHkgZ2V0IHVzZWQgb25jZVxuICAgICAgICB0aGlzLl9wbGF5ZXJBdWRpby5kZXN0cm95U291cmNlTm9kZShzb3VuZC5zb3VyY2VOb2RlKTtcblxuICAgICAgICBzb3VuZC5zb3VyY2VOb2RlID0gbnVsbDtcblxuICAgICAgICBpZiAodGhpcy5fcGxheWluZ1RpbWVvdXRJRCAhPT0gbnVsbCkge1xuXG4gICAgICAgICAgICAvLyBjbGVhciB0aGUgcGxheWluZyBwcm9ncmVzcyBzZXRJbnRlcnZhbFxuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLl9wbGF5aW5nVGltZW91dElEKTtcblxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgbmV4dCgpIHtcblxuICAgICAgICAvLyBhbGlhcyBmb3IgcGxheSBuZXh0XG4gICAgICAgIHRoaXMucGxheSgnbmV4dCcpO1xuXG4gICAgfVxuXG4gICAgcHVibGljIHByZXZpb3VzKCkge1xuXG4gICAgICAgIC8vIGFsaWFzIGZvciBwbGF5IHByZXZpb3VzXG4gICAgICAgIHRoaXMucGxheSgncHJldmlvdXMnKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBmaXJzdCgpIHtcblxuICAgICAgICAvLyBhbGlhcyBmb3IgcGxheSBmaXJzdFxuICAgICAgICB0aGlzLnBsYXkoJ2ZpcnN0Jyk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgbGFzdCgpIHtcblxuICAgICAgICAvLyBhbGlhcyBmb3IgcGxheSBsYXN0XG4gICAgICAgIHRoaXMucGxheSgnbGFzdCcpO1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9wbGF5aW5nUHJvZ3Jlc3Moc291bmQ6IElTb3VuZCkge1xuXG4gICAgICAgIGxldCB0aW1lTm93ID0gc291bmQuc291cmNlTm9kZS5jb250ZXh0LmN1cnJlbnRUaW1lO1xuXG4gICAgICAgIHNvdW5kLnBsYXlUaW1lID0gKHRpbWVOb3cgLSBzb3VuZC5zdGFydFRpbWUpICsgc291bmQucGxheVRpbWVPZmZzZXQ7XG5cbiAgICAgICAgbGV0IHBsYXlpbmdQZXJjZW50YWdlID0gKHNvdW5kLnBsYXlUaW1lIC8gc291bmQuYXVkaW9CdWZmZXIuZHVyYXRpb24pICogMTAwO1xuXG4gICAgICAgIHNvdW5kLnBsYXllZFRpbWVQZXJjZW50YWdlID0gcGxheWluZ1BlcmNlbnRhZ2U7XG5cbiAgICAgICAgc291bmQub25QbGF5aW5nKHBsYXlpbmdQZXJjZW50YWdlLCBzb3VuZC5hdWRpb0J1ZmZlci5kdXJhdGlvbiwgc291bmQucGxheVRpbWUpO1xuXG4gICAgfTtcblxufVxuIl19

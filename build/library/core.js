(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./sound", "./audio", "./request", "./error"], factory);
    }
})(function (require, exports) {
    'use strict';
    Object.defineProperty(exports, "__esModule", { value: true });
    var sound_1 = require("./sound");
    var audio_1 = require("./audio");
    var request_1 = require("./request");
    var error_1 = require("./error");
    var PlayerCore = (function () {
        function PlayerCore(playerOptions) {
            if (playerOptions === void 0) { playerOptions = {}; }
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
            var _this = this;
            // get the current sound if any
            var currentSound = this._getSoundFromQueue();
            // if there is a sound currently being played
            if (currentSound !== null) {
                // check if the duration got set manually
                if (currentSound.duration === null) {
                    // the user can set the sound duration manually but if he didn't the song has to
                    // get preloaded as the duration is a property of the audioBuffer
                    this._loadSound(currentSound)
                        .then(function (sound) {
                        // calculate the position in seconds
                        var soundPositionInSeconds = (sound.duration / 100) * soundPositionInPercent;
                        _this.setPositionInSeconds(soundPositionInSeconds);
                    }).catch(function (error) {
                        // TODO: throw error???
                    });
                }
                else {
                    // calculate the position in seconds
                    var soundPositionInSeconds = (currentSound.duration / 100) * soundPositionInPercent;
                    this.setPositionInSeconds(soundPositionInSeconds);
                }
            }
            else {
                // TODO: throw error???
            }
        };
        PlayerCore.prototype.setPositionInSeconds = function (soundPositionInSeconds) {
            // get the current sound if any
            var currentSound = this._getSoundFromQueue();
            // if there is a sound currently being played
            if (currentSound !== null) {
                // is the song is being played
                if (currentSound.isPlaying) {
                    // stop the track playback
                    this.pause();
                    // start the playback at the given position
                    this.play(currentSound.id, soundPositionInSeconds);
                }
                else {
                    // only set the sound position but don't play
                    currentSound.playTimeOffset = soundPositionInSeconds;
                }
            }
            else {
                // TODO: throw error???
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
                    // extract the url and codec from sources
                    var _a = _this._sourceToVariables(sound.sources), url = _a.url, _b = _a.codec, codec = _b === void 0 ? null : _b;
                    sound.url = url;
                    sound.codec = codec;
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
                // TODO: throw an error?
            }
            // if the user wants to play the sound from a certain position
            if (playTimeOffset !== undefined) {
                sound.playTimeOffset = playTimeOffset;
            }
            // has the sound already been loaded?
            if (!sound.isBuffered) {
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
                // trigger started event
                if (sound.onStarted !== null && sound.playTimeOffset === 0) {
                    sound.onStarted();
                }
                // trigger playing event
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,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R0FBRyxpQkFBaUIsQ0FBQztZQUUvQyxLQUFLLENBQUMsU0FBUyxDQUFDLGlCQUFpQixFQUFFLEtBQUssQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUVuRixDQUFDO1FBQUEsQ0FBQztRQUVOLGlCQUFDO0lBQUQsQ0FqdUJBLEFBaXVCQyxJQUFBO0lBanVCWSxnQ0FBVSIsImZpbGUiOiJsaWJyYXJ5L2NvcmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgUGxheWVyU291bmQsIElTb3VuZCwgSVNvdW5kQXR0cmlidXRlcywgSVNvdW5kU291cmNlIH0gZnJvbSAnLi9zb3VuZCc7XG5pbXBvcnQgeyBQbGF5ZXJBdWRpbyB9IGZyb20gJy4vYXVkaW8nO1xuaW1wb3J0IHsgUGxheWVyUmVxdWVzdCB9IGZyb20gJy4vcmVxdWVzdCc7XG5pbXBvcnQgeyBQbGF5ZXJFcnJvciwgSVBsYXllckVycm9yIH0gZnJvbSAnLi9lcnJvcic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUNvcmVPcHRpb25zIHtcbiAgICB2b2x1bWU/OiBudW1iZXI7XG4gICAgbG9vcFF1ZXVlPzogYm9vbGVhbjtcbiAgICBzb3VuZHNCYXNlVXJsPzogc3RyaW5nO1xuICAgIHBsYXlpbmdQcm9ncmVzc0ludGVydmFsVGltZT86IG51bWJlcjtcbiAgICBwbGF5TmV4dE9uRW5kZWQ/OiBib29sZWFuO1xufVxuXG5leHBvcnQgY2xhc3MgUGxheWVyQ29yZSB7XG5cbiAgICAvLyBpcyB0aGUgd2ViIGF1ZGlvIEFQSSBzdXBwb3J0ZWRcbiAgICBwcm90ZWN0ZWQgX2lzV2ViQXVkaW9BcGlTdXBwb3J0ZWQ6IGJvb2xlYW47XG4gICAgLy8gdGhlIHNvdW5kcyBxdWV1ZVxuICAgIHByb3RlY3RlZCBfcXVldWU6IElTb3VuZFtdO1xuICAgIC8vIHRoZSB2b2x1bWUgKDAgdG8gMTAwKVxuICAgIHByb3RlY3RlZCBfdm9sdW1lOiBudW1iZXI7XG4gICAgLy8gdGhlIGJhc2UgdXJsIHRoYXQgYWxsIHNvdW5kcyB3aWxsIGhhdmUgaW4gY29tbW9uXG4gICAgcHJvdGVjdGVkIF9zb3VuZHNCYXNlVXJsOiBzdHJpbmc7XG4gICAgLy8gdGhlIGN1cnJlbnQgc291bmQgaW4gcXVldWUgaW5kZXhcbiAgICBwcm90ZWN0ZWQgX2N1cnJlbnRJbmRleDogbnVtYmVyO1xuICAgIC8vIGluc3RhbmNlIG9mIHRoZSBhdWRpbyBsaWJyYXJ5IGNsYXNzXG4gICAgcHJvdGVjdGVkIF9wbGF5ZXJBdWRpbzogUGxheWVyQXVkaW87XG4gICAgLy8gcGxheWluZyBwcm9ncmVzcyB0aW1lIGludGVydmFsXG4gICAgcHJvdGVjdGVkIF9wbGF5aW5nUHJvZ3Jlc3NJbnRlcnZhbFRpbWU6IG51bWJlcjtcbiAgICAvLyBwbGF5aW5nIHByb2dyZXNzIHRpbWVvdXRJRFxuICAgIHByb3RlY3RlZCBfcGxheWluZ1RpbWVvdXRJRDogbnVtYmVyIHwgbnVsbDtcbiAgICAvLyB3aGVuIGEgc29uZyBmaW5pc2hlcywgYXV0b21hdGljYWxseSBwbGF5IHRoZSBuZXh0IG9uZVxuICAgIHByb3RlY3RlZCBfcGxheU5leHRPbkVuZGVkOiBib29sZWFuO1xuICAgIC8vIGRvIHdlIHN0YXJ0IG92ZXIgZ2FpbiBhdCB0aGUgZW5kIG9mIHRoZSBxdWV1ZVxuICAgIHByb3RlY3RlZCBfbG9vcFF1ZXVlOiBib29sZWFuO1xuXG4gICAgLy8gY29uc3RhbnRzXG4gICAgcmVhZG9ubHkgV0hFUkVfSU5fUVVFVUVfQVRfRU5EOiBzdHJpbmcgPSAnYXBwZW5kJztcbiAgICByZWFkb25seSBXSEVSRV9JTl9RVUVVRV9BVF9TVEFSVDogc3RyaW5nID0gJ3ByZXBlbmQnO1xuICAgIHJlYWRvbmx5IFdIRVJFX0lOX1FVRVVFX0FGVEVSX0NVUlJFTlQ6IHN0cmluZyA9ICdhZnRlckN1cnJlbnQnO1xuXG4gICAgcmVhZG9ubHkgUExBWV9TT1VORF9ORVhUID0gJ25leHQnO1xuICAgIHJlYWRvbmx5IFBMQVlfU09VTkRfUFJFVklPVVMgPSAncHJldmlvdXMnO1xuICAgIHJlYWRvbmx5IFBMQVlfU09VTkRfRklSU1QgPSAnZmlyc3QnO1xuICAgIHJlYWRvbmx5IFBMQVlfU09VTkRfTEFTVCA9ICdsYXN0JztcblxuICAgIGNvbnN0cnVjdG9yKHBsYXllck9wdGlvbnM6IElDb3JlT3B0aW9ucyA9IHt9KSB7XG5cbiAgICAgICAgbGV0IGRlZmF1bHRPcHRpb25zID0ge1xuICAgICAgICAgICAgdm9sdW1lOiA4MCxcbiAgICAgICAgICAgIGxvb3BRdWV1ZTogZmFsc2UsXG4gICAgICAgICAgICBzb3VuZHNCYXNlVXJsOiAnJyxcbiAgICAgICAgICAgIHBsYXlpbmdQcm9ncmVzc0ludGVydmFsVGltZTogMTAwMCxcbiAgICAgICAgICAgIHBsYXlOZXh0T25FbmRlZDogdHJ1ZVxuICAgICAgICB9O1xuXG4gICAgICAgIGxldCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdE9wdGlvbnMsIHBsYXllck9wdGlvbnMpO1xuXG4gICAgICAgIHRoaXMuX3ZvbHVtZSA9IG9wdGlvbnMudm9sdW1lO1xuICAgICAgICB0aGlzLl9zb3VuZHNCYXNlVXJsID0gb3B0aW9ucy5zb3VuZHNCYXNlVXJsO1xuICAgICAgICB0aGlzLl9xdWV1ZSA9IFtdO1xuICAgICAgICB0aGlzLl9jdXJyZW50SW5kZXggPSAwO1xuICAgICAgICB0aGlzLl9wbGF5aW5nUHJvZ3Jlc3NJbnRlcnZhbFRpbWUgPSBvcHRpb25zLnBsYXlpbmdQcm9ncmVzc0ludGVydmFsVGltZTtcbiAgICAgICAgdGhpcy5fcGxheU5leHRPbkVuZGVkID0gb3B0aW9ucy5wbGF5TmV4dE9uRW5kZWQ7XG4gICAgICAgIHRoaXMuX2xvb3BRdWV1ZSA9IG9wdGlvbnMubG9vcFF1ZXVlO1xuXG4gICAgICAgIHRoaXMuX2luaXRpYWxpemUoKTtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfaW5pdGlhbGl6ZSgpIHtcblxuICAgICAgICAvLyBUT0RPOiBjaGVjayBpZiB3ZWIgYXVkaW8gYXBpIGlzIGF2YWlsYWJsZVxuICAgICAgICBsZXQgd2ViQXVkaW9BcGkgPSB0cnVlO1xuXG4gICAgICAgIC8vIGlzIHRoZSB3ZWIgYXVkaW8gYXBpIHN1cHBvcnRlZFxuICAgICAgICAvLyBpZiBub3Qgd2Ugd2lsbCB1c2UgdGhlIGF1ZGlvIGVsZW1lbnQgYXMgZmFsbGJhY2tcbiAgICAgICAgaWYgKHdlYkF1ZGlvQXBpKSB7XG5cbiAgICAgICAgICAgIHRoaXMuX2lzV2ViQXVkaW9BcGlTdXBwb3J0ZWQgPSB0cnVlO1xuXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgIC8vIHVzZSB0aGUgaHRtbDUgYXVkaW8gZWxlbWVudFxuICAgICAgICAgICAgdGhpcy5faXNXZWJBdWRpb0FwaVN1cHBvcnRlZCA9IGZhbHNlO1xuXG4gICAgICAgIH1cblxuICAgICAgICAvLyBwbGF5ZXIgYXVkaW8gbGlicmFyeSBpbnN0YW5jZVxuICAgICAgICB0aGlzLl9wbGF5ZXJBdWRpbyA9IG5ldyBQbGF5ZXJBdWRpbygpO1xuXG4gICAgfVxuXG4gICAgcHVibGljIGFkZFNvdW5kVG9RdWV1ZShzb3VuZEF0dHJpYnV0ZXM6IElTb3VuZEF0dHJpYnV0ZXMsIHdoZXJlSW5RdWV1ZTogc3RyaW5nID0gdGhpcy5XSEVSRV9JTl9RVUVVRV9BVF9FTkQpOiBJU291bmQge1xuXG4gICAgICAgIGxldCBzb3VuZDogSVNvdW5kID0gbmV3IFBsYXllclNvdW5kKHNvdW5kQXR0cmlidXRlcyk7XG5cbiAgICAgICAgLy8gVE9ETzogaXMgcXVldWUganVzdCBhbiBhcnJheSBvZiBzb3VuZHMsIG9yIGRvIHdlIG5lZWQgc29tZXRoaW5nIG1vcmUgY29tcGxleCB3aXRoIGEgcG9zaXRpb24gdHJhY2tlcj9cblxuICAgICAgICAvLyBUT0RPOiBhbGxvdyBhcnJheSBvZiBzb3VuZEF0dHJpYnV0ZXMgdG8gYmUgaW5qZWN0ZWQsIHRvIGNyZWF0ZSBzZXZlcmFsIGF0IG9uY2UsIGlmIGlucHV0IGlzIGFuIGFycmF5IG91dHB1dCBzaG91bGQgYmUgdG9vXG5cbiAgICAgICAgc3dpdGNoICh3aGVyZUluUXVldWUpIHtcbiAgICAgICAgICAgIGNhc2UgdGhpcy5XSEVSRV9JTl9RVUVVRV9BVF9FTkQ6XG4gICAgICAgICAgICAgICAgdGhpcy5fYXBwZW5kU291bmRUb1F1ZXVlKHNvdW5kKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgdGhpcy5XSEVSRV9JTl9RVUVVRV9BVF9TVEFSVDpcbiAgICAgICAgICAgICAgICB0aGlzLl9wcmVwZW5kU291bmRUb1F1ZXVlKHNvdW5kKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgdGhpcy5XSEVSRV9JTl9RVUVVRV9BRlRFUl9DVVJSRU5UOlxuICAgICAgICAgICAgICAgIHRoaXMuX3ByZXBlbmRTb3VuZFRvUXVldWUoc291bmQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHNvdW5kO1xuXG4gICAgfVxuXG4gICAgcHVibGljIF9hcHBlbmRTb3VuZFRvUXVldWUoc291bmQ6IElTb3VuZCk6IHZvaWQge1xuXG4gICAgICAgIHRoaXMuX3F1ZXVlLnB1c2goc291bmQpO1xuXG4gICAgfVxuXG4gICAgcHVibGljIF9wcmVwZW5kU291bmRUb1F1ZXVlKHNvdW5kOiBJU291bmQpOiB2b2lkIHtcblxuICAgICAgICB0aGlzLl9xdWV1ZS51bnNoaWZ0KHNvdW5kKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBfYWRkU291bmRUb1F1ZXVlQWZ0ZXJDdXJyZW50KHNvdW5kOiBJU291bmQpOiB2b2lkIHtcblxuICAgICAgICAvLyBUT0RPOiBhZGQgb3B0aW9uIHRvIHBsYXkgYWZ0ZXIgYmVpbmcgYWRkZWQgb3IgdXNlciB1c2VzIHBsYXkgbWV0aG9kP1xuXG4gICAgICAgIC8vIGlmIHRoZXJlIGlzIG5vIGN1cnJlbnQgc29uZyB5ZXQsIGFwcGVuZCB0aGUgc29uZyB0byB0aGUgcXVldWVcbiAgICAgICAgaWYgKHRoaXMuX2N1cnJlbnRJbmRleCA9PT0gbnVsbCkge1xuXG4gICAgICAgICAgICB0aGlzLl9hcHBlbmRTb3VuZFRvUXVldWUoc291bmQpO1xuXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgIGxldCBhZnRlckN1cnJlbnRJbmRleCA9IHRoaXMuX2N1cnJlbnRJbmRleCArIDE7XG5cbiAgICAgICAgICAgIHRoaXMuX3F1ZXVlLnNwbGljZShhZnRlckN1cnJlbnRJbmRleCwgMCwgc291bmQpO1xuXG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHB1YmxpYyByZXNldFF1ZXVlKCkge1xuXG4gICAgICAgIHRoaXMuX3F1ZXVlID0gW107XG5cbiAgICAgICAgLy8gVE9ETzogY2hlY2sgaWYgYSBzb25nIGlzIGdldHRpbmcgcGxheWVkIGFuZCBzdG9wIGl0P1xuXG4gICAgfVxuXG4gICAgcHVibGljIGdldFF1ZXVlKCkge1xuXG4gICAgICAgIC8vIFRPRE86IGlzIHRoZSBuZWVkZWQ/XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX3F1ZXVlO1xuXG4gICAgfVxuXG4gICAgcHVibGljIHNldFZvbHVtZSh2b2x1bWU6IG51bWJlcik6IHZvaWQge1xuXG4gICAgICAgIHRoaXMuX3ZvbHVtZSA9IHZvbHVtZTtcblxuICAgICAgICB0aGlzLl9wbGF5ZXJBdWRpby5jaGFuZ2VHYWluVmFsdWUodm9sdW1lKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBnZXRWb2x1bWUoKTogbnVtYmVyIHtcblxuICAgICAgICByZXR1cm4gdGhpcy5fdm9sdW1lO1xuXG4gICAgfVxuXG4gICAgcHVibGljIG11dGUoKSB7XG5cbiAgICAgICAgdGhpcy5zZXRWb2x1bWUoMCk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0UG9zaXRpb24oc291bmRQb3NpdGlvbkluUGVyY2VudDogbnVtYmVyKTogdm9pZCB7XG5cbiAgICAgICAgLy8gZ2V0IHRoZSBjdXJyZW50IHNvdW5kIGlmIGFueVxuICAgICAgICBsZXQgY3VycmVudFNvdW5kID0gdGhpcy5fZ2V0U291bmRGcm9tUXVldWUoKTtcblxuICAgICAgICAvLyBpZiB0aGVyZSBpcyBhIHNvdW5kIGN1cnJlbnRseSBiZWluZyBwbGF5ZWRcbiAgICAgICAgaWYgKGN1cnJlbnRTb3VuZCAhPT0gbnVsbCkge1xuXG4gICAgICAgICAgICAvLyBjaGVjayBpZiB0aGUgZHVyYXRpb24gZ290IHNldCBtYW51YWxseVxuICAgICAgICAgICAgaWYgKGN1cnJlbnRTb3VuZC5kdXJhdGlvbiA9PT0gbnVsbCkge1xuXG4gICAgICAgICAgICAgICAgLy8gdGhlIHVzZXIgY2FuIHNldCB0aGUgc291bmQgZHVyYXRpb24gbWFudWFsbHkgYnV0IGlmIGhlIGRpZG4ndCB0aGUgc29uZyBoYXMgdG9cbiAgICAgICAgICAgICAgICAvLyBnZXQgcHJlbG9hZGVkIGFzIHRoZSBkdXJhdGlvbiBpcyBhIHByb3BlcnR5IG9mIHRoZSBhdWRpb0J1ZmZlclxuICAgICAgICAgICAgICAgIHRoaXMuX2xvYWRTb3VuZChjdXJyZW50U291bmQpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKChzb3VuZDogSVNvdW5kKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNhbGN1bGF0ZSB0aGUgcG9zaXRpb24gaW4gc2Vjb25kc1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHNvdW5kUG9zaXRpb25JblNlY29uZHMgPSAoc291bmQuZHVyYXRpb24gLyAxMDApICogc291bmRQb3NpdGlvbkluUGVyY2VudDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRQb3NpdGlvbkluU2Vjb25kcyhzb3VuZFBvc2l0aW9uSW5TZWNvbmRzKTtcblxuICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyb3I6IFBsYXllckVycm9yKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IHRocm93IGVycm9yPz8/XG5cbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAvLyBjYWxjdWxhdGUgdGhlIHBvc2l0aW9uIGluIHNlY29uZHNcbiAgICAgICAgICAgICAgICBsZXQgc291bmRQb3NpdGlvbkluU2Vjb25kcyA9IChjdXJyZW50U291bmQuZHVyYXRpb24gLyAxMDApICogc291bmRQb3NpdGlvbkluUGVyY2VudDtcblxuICAgICAgICAgICAgICAgIHRoaXMuc2V0UG9zaXRpb25JblNlY29uZHMoc291bmRQb3NpdGlvbkluU2Vjb25kcyk7XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAvLyBUT0RPOiB0aHJvdyBlcnJvcj8/P1xuXG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHB1YmxpYyBzZXRQb3NpdGlvbkluU2Vjb25kcyhzb3VuZFBvc2l0aW9uSW5TZWNvbmRzOiBudW1iZXIpIHtcblxuICAgICAgICAvLyBnZXQgdGhlIGN1cnJlbnQgc291bmQgaWYgYW55XG4gICAgICAgIGxldCBjdXJyZW50U291bmQgPSB0aGlzLl9nZXRTb3VuZEZyb21RdWV1ZSgpO1xuXG4gICAgICAgIC8vIGlmIHRoZXJlIGlzIGEgc291bmQgY3VycmVudGx5IGJlaW5nIHBsYXllZFxuICAgICAgICBpZiAoY3VycmVudFNvdW5kICE9PSBudWxsKSB7XG5cbiAgICAgICAgICAgIC8vIGlzIHRoZSBzb25nIGlzIGJlaW5nIHBsYXllZFxuICAgICAgICAgICAgaWYgKGN1cnJlbnRTb3VuZC5pc1BsYXlpbmcpIHtcblxuICAgICAgICAgICAgICAgIC8vIHN0b3AgdGhlIHRyYWNrIHBsYXliYWNrXG4gICAgICAgICAgICAgICAgdGhpcy5wYXVzZSgpO1xuXG4gICAgICAgICAgICAgICAgLy8gc3RhcnQgdGhlIHBsYXliYWNrIGF0IHRoZSBnaXZlbiBwb3NpdGlvblxuICAgICAgICAgICAgICAgIHRoaXMucGxheShjdXJyZW50U291bmQuaWQsIHNvdW5kUG9zaXRpb25JblNlY29uZHMpO1xuXG4gICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgLy8gb25seSBzZXQgdGhlIHNvdW5kIHBvc2l0aW9uIGJ1dCBkb24ndCBwbGF5XG4gICAgICAgICAgICAgICAgY3VycmVudFNvdW5kLnBsYXlUaW1lT2Zmc2V0ID0gc291bmRQb3NpdGlvbkluU2Vjb25kcztcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgIC8vIFRPRE86IHRocm93IGVycm9yPz8/XG5cbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9sb2FkU291bmQoc291bmQ6IElTb3VuZCk6IFByb21pc2U8SVNvdW5kIHwgUGxheWVyRXJyb3I+IHtcblxuICAgICAgICAvLyBUT0RPOiB3b3VsZCBiZSBnb29kIHRvIGNhY2hlIGJ1ZmZlcnMsIHNvIG5lZWQgdG8gY2hlY2sgaWYgaXMgaW4gY2FjaGVcbiAgICAgICAgLy8gbGV0IHRoZSB1c2VyIGNob29zZSAoYnkgc2V0dGluZyBhbiBvcHRpb24pIHdoYXQgYW1vdW50IG9mIHNvdW5kcyB3aWxsIGJlIGNhY2hlZFxuICAgICAgICAvLyBhZGQgYSBjYWNoZWQgZGF0ZSAvIHRpbWVzdGFtcCB0byBiZSBhYmxlIHRvIGNsZWFyIGNhY2hlIGJ5IG9sZGVzdCBmaXJzdFxuICAgICAgICAvLyBvciBldmVuIGJldHRlciBhZGQgYSBwbGF5ZWQgY291bnRlciB0byBjYWNoZSBieSBsZWFzdCBwbGF5ZWQgYW5kIGRhdGVcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgICAgICAvLyBpZiB0aGUgc291bmQgYWxyZWFkeSBoYXMgYW4gQXVkaW9CdWZmZXJcbiAgICAgICAgICAgIGlmIChzb3VuZC5hdWRpb0J1ZmZlciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoc291bmQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBpZiB0aGUgc291bmQgaGFzIGFscmVhZHkgYW4gQXJyYXlCdWZmZXIgYnV0IG5vIEF1ZGlvQnVmZmVyXG4gICAgICAgICAgICBpZiAoc291bmQuYXJyYXlCdWZmZXIgIT09IG51bGwgJiYgc291bmQuYXVkaW9CdWZmZXIgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fZGVjb2RlU291bmQoc291bmQsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGlmIHRoZSBzb3VuZCBoYXMgbm8gQXJyYXlCdWZmZXIgYW5kIGFsc28gbm8gQXVkaW9CdWZmZXIgeWV0XG4gICAgICAgICAgICBpZiAoc291bmQuYXJyYXlCdWZmZXIgPT09IG51bGwgJiYgc291bmQuYXVkaW9CdWZmZXIgPT09IG51bGwpIHtcblxuICAgICAgICAgICAgICAgIC8vIGV4dHJhY3QgdGhlIHVybCBhbmQgY29kZWMgZnJvbSBzb3VyY2VzXG4gICAgICAgICAgICAgICAgbGV0IHsgdXJsLCBjb2RlYyA9IG51bGwgfSA9IHRoaXMuX3NvdXJjZVRvVmFyaWFibGVzKHNvdW5kLnNvdXJjZXMpO1xuXG4gICAgICAgICAgICAgICAgc291bmQudXJsID0gdXJsO1xuICAgICAgICAgICAgICAgIHNvdW5kLmNvZGVjID0gY29kZWM7XG5cbiAgICAgICAgICAgICAgICBpZiAoc291bmQudXJsICE9PSBudWxsKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgbGV0IHJlcXVlc3QgPSBuZXcgUGxheWVyUmVxdWVzdCgpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGNoYW5nZSBidWZmZXJpbmcgc3RhdGVcbiAgICAgICAgICAgICAgICAgICAgc291bmQuaXNCdWZmZXJpbmcgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3QuZ2V0QXJyYXlCdWZmZXIoc291bmQpLnRoZW4oKGFycmF5QnVmZmVyOiBBcnJheUJ1ZmZlcikgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VuZC5hcnJheUJ1ZmZlciA9IGFycmF5QnVmZmVyO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fZGVjb2RlU291bmQoc291bmQsIHJlc29sdmUsIHJlamVjdCk7XG5cbiAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goKHJlcXVlc3RFcnJvcjogSVBsYXllckVycm9yKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChyZXF1ZXN0RXJyb3IpO1xuXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgICAgICBsZXQgbm9VcmxFcnJvciA9IG5ldyBQbGF5ZXJFcnJvcignc291bmQgaGFzIG5vIHVybCcsIDEpO1xuXG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChub1VybEVycm9yKTtcblxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9kZWNvZGVTb3VuZChzb3VuZDogSVNvdW5kLCByZXNvbHZlOiBGdW5jdGlvbiwgcmVqZWN0OiBGdW5jdGlvbikge1xuXG4gICAgICAgIGxldCBhcnJheUJ1ZmZlciA9IHNvdW5kLmFycmF5QnVmZmVyO1xuXG4gICAgICAgIHRoaXMuX3BsYXllckF1ZGlvLmRlY29kZUF1ZGlvKGFycmF5QnVmZmVyKS50aGVuKChhdWRpb0J1ZmZlcjogQXVkaW9CdWZmZXIpID0+IHtcblxuICAgICAgICAgICAgc291bmQuYXVkaW9CdWZmZXIgPSBhdWRpb0J1ZmZlcjtcbiAgICAgICAgICAgIHNvdW5kLmlzQnVmZmVyaW5nID0gZmFsc2U7XG4gICAgICAgICAgICBzb3VuZC5pc0J1ZmZlcmVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHNvdW5kLmF1ZGlvQnVmZmVyRGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICBzb3VuZC5kdXJhdGlvbiA9IHNvdW5kLmF1ZGlvQnVmZmVyLmR1cmF0aW9uO1xuXG4gICAgICAgICAgICByZXNvbHZlKHNvdW5kKTtcblxuICAgICAgICB9KS5jYXRjaCgoZGVjb2RlQXVkaW9FcnJvcjogSVBsYXllckVycm9yKSA9PiB7XG5cbiAgICAgICAgICAgIHJlamVjdChkZWNvZGVBdWRpb0Vycm9yKTtcblxuICAgICAgICB9KTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBwbGF5KHdoaWNoU291bmQ/OiBudW1iZXIgfCBzdHJpbmcgfCB1bmRlZmluZWQsIHBsYXlUaW1lT2Zmc2V0PzogbnVtYmVyKTogdm9pZCB7XG5cbiAgICAgICAgLy8gVE9ETzogY2hlY2sgdGhlIGF2YWlsYWJsZSBjb2RlY3MgYW5kIGRlZmluZWQgc291cmNlcywgcGxheSB0aGUgZmlyc3Qgb25lIHRoYXQgaGFzIG1hdGNoZXMgYW5kIGF2YWlsYWJsZSBjb2RlY1xuICAgICAgICAvLyBUT0RPOiBsZXQgdXNlciBkZWZpbmUgb3JkZXIgb2YgcHJlZmVycmVkIGNvZGVjcyBmb3IgcGxheWVyYmFja1xuXG4gICAgICAgIC8vIGdldCB0aGUgY3VycmVudCBzb3VuZCBpZiBhbnlcbiAgICAgICAgbGV0IGN1cnJlbnRTb3VuZCA9IHRoaXMuX2dldFNvdW5kRnJvbVF1ZXVlKCk7XG5cbiAgICAgICAgLy8gaWYgdGhlcmUgaXMgYSBzb3VuZCBjdXJyZW50bHkgYmVpbmcgcGxheWVkXG4gICAgICAgIGlmIChjdXJyZW50U291bmQgIT09IG51bGwgJiYgY3VycmVudFNvdW5kLmlzUGxheWluZykge1xuXG4gICAgICAgICAgICAvLyBzdG9wIHRoZSBjdXJyZW50IHNvdW5kXG4gICAgICAgICAgICB0aGlzLnN0b3AoKTtcblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gd2hpY2hTb3VuZCBpcyBvcHRpb25hbCwgaWYgc2V0IGl0IGNhbiBiZSB0aGUgc291bmQgaWQgb3IgaWYgaXQncyBhIHN0cmluZyBpdCBjYW4gYmUgbmV4dCAvIHByZXZpb3VzIC8gZmlyc3QgLyBsYXN0XG4gICAgICAgIGxldCBzb3VuZCA9IHRoaXMuX2dldFNvdW5kRnJvbVF1ZXVlKHdoaWNoU291bmQpO1xuXG4gICAgICAgIC8vIGlmIHRoZXJlIGlzIG5vIHNvdW5kIHdlIGNvdWxkIHBsYXksIGRvIG5vdGhpbmdcbiAgICAgICAgaWYgKHNvdW5kID09PSBudWxsKSB7XG5cbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAgICAgLy8gVE9ETzogdGhyb3cgYW4gZXJyb3I/XG5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGlmIHRoZSB1c2VyIHdhbnRzIHRvIHBsYXkgdGhlIHNvdW5kIGZyb20gYSBjZXJ0YWluIHBvc2l0aW9uXG4gICAgICAgIGlmIChwbGF5VGltZU9mZnNldCAhPT0gdW5kZWZpbmVkKSB7XG5cbiAgICAgICAgICAgIHNvdW5kLnBsYXlUaW1lT2Zmc2V0ID0gcGxheVRpbWVPZmZzZXQ7XG5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGhhcyB0aGUgc291bmQgYWxyZWFkeSBiZWVuIGxvYWRlZD9cbiAgICAgICAgaWYgKCFzb3VuZC5pc0J1ZmZlcmVkKSB7XG5cbiAgICAgICAgICAgIHRoaXMuX2xvYWRTb3VuZChzb3VuZCkudGhlbigoKSA9PiB7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9wbGF5KHNvdW5kKTtcblxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBoYW5kbGUgZXJyb3JcblxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgdGhpcy5fcGxheShzb3VuZCk7XG5cbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9wbGF5KHNvdW5kOiBJU291bmQpIHtcblxuICAgICAgICAvLyBzb3VyY2Ugbm9kZSBvcHRpb25zXG4gICAgICAgIGxldCBzb3VyY2VOb2RlT3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGxvb3A6IHNvdW5kLmxvb3AsXG4gICAgICAgICAgICBvbkVuZGVkOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5fb25FbmRlZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGNyZWF0ZSBhIG5ldyBzb3VyY2Ugbm9kZVxuICAgICAgICB0aGlzLl9wbGF5ZXJBdWRpby5jcmVhdGVTb3VyY2VOb2RlKHNvdXJjZU5vZGVPcHRpb25zKS50aGVuKChzb3VyY2VOb2RlKSA9PiB7XG5cbiAgICAgICAgICAgIHNvdW5kLmlzUGxheWluZyA9IHRydWU7XG4gICAgICAgICAgICBzb3VuZC5zb3VyY2VOb2RlID0gc291cmNlTm9kZTtcblxuICAgICAgICAgICAgLy8gYWRkIHRoZSBidWZmZXIgdG8gdGhlIHNvdXJjZSBub2RlXG4gICAgICAgICAgICBzb3VyY2VOb2RlLmJ1ZmZlciA9IHNvdW5kLmF1ZGlvQnVmZmVyO1xuXG4gICAgICAgICAgICAvLyB0aGUgYXVkaW9jb250ZXh0IHRpbWUgcmlnaHQgbm93IChzaW5jZSB0aGUgYXVkaW9jb250ZXh0IGdvdCBjcmVhdGVkKVxuICAgICAgICAgICAgc291bmQuc3RhcnRUaW1lID0gc291cmNlTm9kZS5jb250ZXh0LmN1cnJlbnRUaW1lO1xuXG4gICAgICAgICAgICAvLyBjb25uZWN0IHRoZSBzb3VyY2UgdG8gdGhlIGdyYXBoIChkZXN0aW5hdGlvbilcbiAgICAgICAgICAgIHRoaXMuX3BsYXllckF1ZGlvLmNvbm5lY3RTb3VyY2VOb2RlVG9HcmFwaChzb3VyY2VOb2RlKTtcblxuICAgICAgICAgICAgLy8gc3RhcnQgcGxheWJhY2tcbiAgICAgICAgICAgIC8vIHN0YXJ0KHdoZW4sIG9mZnNldCwgZHVyYXRpb24pXG4gICAgICAgICAgICBzb3VyY2VOb2RlLnN0YXJ0KDAsIHNvdW5kLnBsYXlUaW1lT2Zmc2V0KTtcblxuICAgICAgICAgICAgLy8gdHJpZ2dlciBzdGFydGVkIGV2ZW50XG4gICAgICAgICAgICBpZiAoc291bmQub25TdGFydGVkICE9PSBudWxsICYmIHNvdW5kLnBsYXlUaW1lT2Zmc2V0ID09PSAwKSB7XG5cbiAgICAgICAgICAgICAgICBzb3VuZC5vblN0YXJ0ZWQoKTtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyB0cmlnZ2VyIHBsYXlpbmcgZXZlbnRcbiAgICAgICAgICAgIGlmIChzb3VuZC5vblBsYXlpbmcgIT09IG51bGwpIHtcblxuICAgICAgICAgICAgICAgIC8vIGF0IGludGVydmFsIHNldCBwbGF5aW5nIHByb2dyZXNzXG4gICAgICAgICAgICAgICAgdGhpcy5fcGxheWluZ1RpbWVvdXRJRCA9IHNldEludGVydmFsKCgpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wbGF5aW5nUHJvZ3Jlc3Moc291bmQpO1xuXG4gICAgICAgICAgICAgICAgfSwgdGhpcy5fcGxheWluZ1Byb2dyZXNzSW50ZXJ2YWxUaW1lKTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgIHRoaXMuX3BsYXlpbmdUaW1lb3V0SUQgPSBudWxsO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG5cbiAgICAgICAgICAgIC8vIFRPRE86IGhhbmRsZSBlcnJvclxuXG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9vbkVuZGVkKCkge1xuXG4gICAgICAgIC8vIGdldCB0aGUgY3VycmVudCBzb3VuZCBpZiBhbnlcbiAgICAgICAgbGV0IGN1cnJlbnRTb3VuZCA9IHRoaXMuX2dldFNvdW5kRnJvbVF1ZXVlKCk7XG5cbiAgICAgICAgLy8gaWYgdGhlcmUgaXMgYSBzb3VuZCBjdXJyZW50bHkgYmVpbmcgcGxheWVkXG4gICAgICAgIGlmIChjdXJyZW50U291bmQgIT09IG51bGwgJiYgY3VycmVudFNvdW5kLmlzUGxheWluZykge1xuXG4gICAgICAgICAgICBsZXQgdXBkYXRlSW5kZXggPSBmYWxzZTtcblxuICAgICAgICAgICAgbGV0IG5leHRTb3VuZCA9IHRoaXMuX2dldFNvdW5kRnJvbVF1ZXVlKCduZXh0JywgdXBkYXRlSW5kZXgpO1xuXG4gICAgICAgICAgICBpZiAoY3VycmVudFNvdW5kLm9uRW5kZWQgIT09IG51bGwpIHtcblxuICAgICAgICAgICAgICAgIGxldCB3aWxsUGxheU5leHQgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgIC8vIGNoZWNrIGlmIHRoZXJlIGlzIGFub3RoZXIgc291bmQgaW4gdGhlIHF1ZXVlIGFuZCBpZiBwbGF5aW5nXG4gICAgICAgICAgICAgICAgLy8gdGhlIG5leHQgb25lIG9uIGVuZGVkIGlzIGFjdGl2YXRlZFxuICAgICAgICAgICAgICAgIGlmIChuZXh0U291bmQgIT09IG51bGwgJiYgdGhpcy5fcGxheU5leHRPbkVuZGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHdpbGxQbGF5TmV4dCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY3VycmVudFNvdW5kLm9uRW5kZWQod2lsbFBsYXlOZXh0KTtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnN0b3AoKTtcblxuICAgICAgICAgICAgaWYgKG5leHRTb3VuZCAhPT0gbnVsbCkge1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3BsYXlOZXh0T25FbmRlZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsYXkoJ25leHQnKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAvLyB3ZSByZWFjaGVkIHRoZSBlbmQgb2YgdGhlIHF1ZXVlIHNldCB0aGUgY3VycmVudEluZGV4IGJhY2sgdG8gemVyb1xuICAgICAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRJbmRleCA9IDA7XG5cbiAgICAgICAgICAgICAgICAvLyBpZiBxdWV1ZSBsb29wIGlzIGFjdGl2ZSB0aGVuIHBsYXlcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fbG9vcFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGxheSgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHdoaWNoU291bmQgaXMgb3B0aW9uYWwsIGlmIHNldCBpdCBjYW4gYmUgdGhlIHNvdW5kIGlkIG9yIGlmIGl0J3NcbiAgICAgKiBhIHN0cmluZyBpdCBjYW4gYmUgbmV4dCAvIHByZXZpb3VzIC8gZmlyc3QgLyBsYXN0XG4gICAgICovXG4gICAgcHJvdGVjdGVkIF9nZXRTb3VuZEZyb21RdWV1ZSh3aGljaFNvdW5kPzogc3RyaW5nIHwgbnVtYmVyLCB1cGRhdGVJbmRleDogYm9vbGVhbiA9IHRydWUpOiBJU291bmQgfCBudWxsIHtcblxuICAgICAgICBsZXQgc291bmQgPSBudWxsO1xuXG4gICAgICAgIC8vIGNoZWNrIGlmIHRoZSBxdWV1ZSBpcyBlbXB0eVxuICAgICAgICBpZiAodGhpcy5fcXVldWUubGVuZ3RoID09PSAwKSB7XG5cbiAgICAgICAgICAgIHJldHVybiBzb3VuZDtcblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgd2hpY2ggc29uZyB0byBwbGF5IGRpZCBub3QgZ2V0IHNwZWNpZmllZCwgcGxheSBvbmUgYmFzZWQgZnJvbSB0aGUgcXVldWUgYmFzZWQgb24gdGhlIHF1ZXVlIGluZGV4IHBvc2l0aW9uIG1hcmtlclxuICAgICAgICBpZiAod2hpY2hTb3VuZCA9PT0gdW5kZWZpbmVkICYmIHRoaXMuX3F1ZXVlW3RoaXMuX2N1cnJlbnRJbmRleF0gIT09IHVuZGVmaW5lZCkge1xuXG4gICAgICAgICAgICBzb3VuZCA9IHRoaXMuX3F1ZXVlW3RoaXMuX2N1cnJlbnRJbmRleF07XG5cbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygd2hpY2hTb3VuZCA9PT0gJ251bWJlcicpIHtcblxuICAgICAgICAgICAgLy8gaWYgd2hpY2ggc29uZyB0byBwbGF5IGlzIGEgbnVtZXJpYyBJRFxuICAgICAgICAgICAgc291bmQgPSB0aGlzLl9maW5kU291bmRCeUlkKHdoaWNoU291bmQsIHVwZGF0ZUluZGV4KTtcblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICBsZXQgc291bmRJbmRleDogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG5cbiAgICAgICAgICAgIC8vIGlmIHdoaWNoIHNvbmcgdG8gcGxheSBpcyBhIGNvbnN0YW50XG4gICAgICAgICAgICBzd2l0Y2ggKHdoaWNoU291bmQpIHtcbiAgICAgICAgICAgICAgICBjYXNlIHRoaXMuUExBWV9TT1VORF9ORVhUOlxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fcXVldWVbdGhpcy5fY3VycmVudEluZGV4ICsgMV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc291bmRJbmRleCA9IHRoaXMuX2N1cnJlbnRJbmRleCArIDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VuZCA9IHRoaXMuX3F1ZXVlW3NvdW5kSW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgdGhpcy5QTEFZX1NPVU5EX1BSRVZJT1VTOlxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fcXVldWVbdGhpcy5fY3VycmVudEluZGV4IC0gMV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc291bmRJbmRleCA9IHRoaXMuX2N1cnJlbnRJbmRleCAtIDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VuZCA9IHRoaXMuX3F1ZXVlW3NvdW5kSW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgdGhpcy5QTEFZX1NPVU5EX0ZJUlNUOlxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fcXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc291bmRJbmRleCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VuZCA9IHRoaXMuX3F1ZXVlW3NvdW5kSW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgdGhpcy5QTEFZX1NPVU5EX0xBU1Q6XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9xdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VuZEluZGV4ID0gdGhpcy5fcXVldWUubGVuZ3RoIC0gMjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdW5kID0gdGhpcy5fcXVldWVbc291bmRJbmRleF07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgd2hpY2ggc29uZyB0byBwbGF5IGlzIGEgc3RyaW5nIElEXG4gICAgICAgICAgICAgICAgICAgIHNvdW5kID0gdGhpcy5fZmluZFNvdW5kQnlJZCh3aGljaFNvdW5kLCB1cGRhdGVJbmRleCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzb3VuZEluZGV4ICE9PSBudWxsICYmIHVwZGF0ZUluZGV4KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fY3VycmVudEluZGV4ID0gc291bmRJbmRleDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHNvdW5kO1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9maW5kU291bmRCeUlkKHNvdW5kSWQ6IHN0cmluZyB8IG51bWJlciwgdXBkYXRlSW5kZXg6IGJvb2xlYW4pOiBJU291bmQgfCBudWxsIHtcblxuICAgICAgICBsZXQgc291bmQgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuX3F1ZXVlLnNvbWUoKHNvdW5kRnJvbVF1ZXVlOiBJU291bmQsIHF1ZXVlSW5kZXg6IG51bWJlcikgPT4ge1xuXG4gICAgICAgICAgICBpZiAoc291bmRGcm9tUXVldWUuaWQgPT09IHNvdW5kSWQpIHtcblxuICAgICAgICAgICAgICAgIHNvdW5kID0gc291bmRGcm9tUXVldWU7XG5cbiAgICAgICAgICAgICAgICBpZiAodXBkYXRlSW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY3VycmVudEluZGV4ID0gcXVldWVJbmRleDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBzb3VuZDtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfc291cmNlVG9WYXJpYWJsZXMoc291cmNlczogKElTb3VuZFNvdXJjZSB8IHN0cmluZylbXSk6IHsgdXJsOiBzdHJpbmcgfCBudWxsLCBjb2RlYz86IHN0cmluZyB8IG51bGwgfSB7XG5cbiAgICAgICAgLy8gVE9ETzogc291cmNlIGNhbiBiZSBvbiBvYmplY3Qgd2hlcmUgdGhlIHByb3BlcnR5IG5hbWUgaXMgdGhlIGNvZGVjIGFuZCB0aGUgdmFsdWUgaXMgdGhlIHNvdW5kIHVybFxuICAgICAgICAvLyBpZiBzb3VuZCBpc250IGFuIG9iamVjdCB0cnkgdG8gZGV0ZWN0IHNvdW5kIHNvdXJjZSBleHRlbnNpb24gYnkgZmlsZSBleHRlbnRpb24gb3IgYnkgY2hlY2tpbmcgdGhlIGZpbGUgbWltZSB0eXBlXG5cbiAgICAgICAgLy8gVE9ETzogZ2V0IGEgbGlzdCBvZiBzdXBwb3J0ZWQgY29kZWNzIGJ5IHRoaXMgZGV2aWNlXG5cbiAgICAgICAgbGV0IGZpcnN0TWF0Y2hpbmdTb3VyY2U6IHsgdXJsOiBzdHJpbmcgfCBudWxsLCBjb2RlYz86IHN0cmluZyB8IG51bGwgfSA9IHtcbiAgICAgICAgICAgIHVybDogbnVsbCxcbiAgICAgICAgICAgIGNvZGVjOiBudWxsXG4gICAgICAgIH07XG5cbiAgICAgICAgc291cmNlcy5mb3JFYWNoKChzb3VyY2UpID0+IHtcblxuICAgICAgICAgICAgLy8gVE9ETzogZmluZCBvdXQgd2hhdCB0aGUgc291cmNlIGNvZGVjIGlzXG5cbiAgICAgICAgICAgIC8vIFRPRE86IGNoZWNrIGlmIHRoZSBzb3VyY2UgY29kZWMgaXMgYW1vbmcgdGhlIG9uZXMgdGhhdCBhcmUgc3VwcG9ydGVkIGJ5IHRoaXMgZGV2aWNlXG5cbiAgICAgICAgICAgIGxldCBzb3VuZFVybCA9ICcnO1xuXG4gICAgICAgICAgICAvLyBpZiB0aGUgcGxheWVyIGhhZCBhcyBvcHRpb24gYSBiYXNlVXJsIGZvciBzb3VuZHMgYWRkIGl0IG5vd1xuICAgICAgICAgICAgaWYgKHRoaXMuX3NvdW5kc0Jhc2VVcmwgIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgc291bmRVcmwgPSB0aGlzLl9zb3VuZHNCYXNlVXJsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyB0d28ga2luZCBvZiBzb3VyY2UgYXJlIHBvc3NpYmxlLCBhIHN0cmluZyAodGhlIHVybCkgb3IgYW4gb2JqZWN0IChrZXkgaXMgdGhlIGNvZGVjIGFuZCB2YWx1ZSBpcyB0aGUgdXJsKVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBzb3VyY2UgPT09ICdzdHJpbmcnKSB7XG5cbiAgICAgICAgICAgICAgICBzb3VuZFVybCArPSBzb3VyY2U7XG5cbiAgICAgICAgICAgICAgICBmaXJzdE1hdGNoaW5nU291cmNlID0ge1xuICAgICAgICAgICAgICAgICAgICB1cmw6IHNvdW5kVXJsXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgIHNvdW5kVXJsICs9IHNvdXJjZS51cmw7XG5cbiAgICAgICAgICAgICAgICBmaXJzdE1hdGNoaW5nU291cmNlID0ge1xuICAgICAgICAgICAgICAgICAgICB1cmw6IHNvdW5kVXJsLFxuICAgICAgICAgICAgICAgICAgICBjb2RlYzogc291cmNlLmNvZGVjXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBmaXJzdE1hdGNoaW5nU291cmNlO1xuXG4gICAgfVxuXG4gICAgcHVibGljIHBhdXNlKCkge1xuXG4gICAgICAgIC8vIGdldCB0aGUgY3VycmVudCBzb3VuZFxuICAgICAgICBsZXQgc291bmQ6IElTb3VuZCB8IG51bGwgPSB0aGlzLl9nZXRTb3VuZEZyb21RdWV1ZSgpO1xuXG4gICAgICAgIGlmIChzb3VuZCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHRpbWVBdFBhdXNlID0gc291bmQuc291cmNlTm9kZS5jb250ZXh0LmN1cnJlbnRUaW1lO1xuXG4gICAgICAgIHNvdW5kLnBsYXlUaW1lT2Zmc2V0ICs9IHRpbWVBdFBhdXNlIC0gc291bmQuc3RhcnRUaW1lO1xuXG4gICAgICAgIHRoaXMuX3N0b3Aoc291bmQpO1xuXG4gICAgfVxuXG4gICAgcHVibGljIHN0b3AoKSB7XG5cbiAgICAgICAgLy8gZ2V0IHRoZSBjdXJyZW50IHNvdW5kXG4gICAgICAgIGxldCBzb3VuZDogSVNvdW5kIHwgbnVsbCA9IHRoaXMuX2dldFNvdW5kRnJvbVF1ZXVlKCk7XG5cbiAgICAgICAgaWYgKHNvdW5kID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBzb3VuZC5wbGF5VGltZU9mZnNldCA9IDA7XG5cbiAgICAgICAgdGhpcy5fc3RvcChzb3VuZCk7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX3N0b3Aoc291bmQ6IElTb3VuZCkge1xuXG4gICAgICAgIC8vIHRlbGwgdGhlIHNvdXJjZU5vZGUgdG8gc3RvcCBwbGF5aW5nXG4gICAgICAgIHNvdW5kLnNvdXJjZU5vZGUuc3RvcCgwKTtcblxuICAgICAgICAvLyB0ZWxsIHRoZSBzb3VuZCB0aGF0IHBsYXlpbmcgaXMgb3ZlclxuICAgICAgICBzb3VuZC5pc1BsYXlpbmcgPSBmYWxzZTtcblxuICAgICAgICAvLyBkZXN0cm95IHRoZSBzb3VyY2Ugbm9kZSBhcyBpdCBjYW4gYW55d2F5IG9ubHkgZ2V0IHVzZWQgb25jZVxuICAgICAgICB0aGlzLl9wbGF5ZXJBdWRpby5kZXN0cm95U291cmNlTm9kZShzb3VuZC5zb3VyY2VOb2RlKTtcblxuICAgICAgICBzb3VuZC5zb3VyY2VOb2RlID0gbnVsbDtcblxuICAgICAgICBpZiAodGhpcy5fcGxheWluZ1RpbWVvdXRJRCAhPT0gbnVsbCkge1xuXG4gICAgICAgICAgICAvLyBjbGVhciB0aGUgcGxheWluZyBwcm9ncmVzcyBzZXRJbnRlcnZhbFxuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLl9wbGF5aW5nVGltZW91dElEKTtcblxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgbmV4dCgpIHtcblxuICAgICAgICAvLyBhbGlhcyBmb3IgcGxheSBuZXh0XG4gICAgICAgIHRoaXMucGxheSgnbmV4dCcpO1xuXG4gICAgfVxuXG4gICAgcHVibGljIHByZXZpb3VzKCkge1xuXG4gICAgICAgIC8vIGFsaWFzIGZvciBwbGF5IHByZXZpb3VzXG4gICAgICAgIHRoaXMucGxheSgncHJldmlvdXMnKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBmaXJzdCgpIHtcblxuICAgICAgICAvLyBhbGlhcyBmb3IgcGxheSBmaXJzdFxuICAgICAgICB0aGlzLnBsYXkoJ2ZpcnN0Jyk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgbGFzdCgpIHtcblxuICAgICAgICAvLyBhbGlhcyBmb3IgcGxheSBsYXN0XG4gICAgICAgIHRoaXMucGxheSgnbGFzdCcpO1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9wbGF5aW5nUHJvZ3Jlc3Moc291bmQ6IElTb3VuZCkge1xuXG4gICAgICAgIGxldCB0aW1lTm93ID0gc291bmQuc291cmNlTm9kZS5jb250ZXh0LmN1cnJlbnRUaW1lO1xuXG4gICAgICAgIHNvdW5kLnBsYXlUaW1lID0gKHRpbWVOb3cgLSBzb3VuZC5zdGFydFRpbWUpICsgc291bmQucGxheVRpbWVPZmZzZXQ7XG5cbiAgICAgICAgbGV0IHBsYXlpbmdQZXJjZW50YWdlID0gKHNvdW5kLnBsYXlUaW1lIC8gc291bmQuYXVkaW9CdWZmZXIuZHVyYXRpb24pICogMTAwO1xuXG4gICAgICAgIHNvdW5kLnBsYXllZFRpbWVQZXJjZW50YWdlID0gcGxheWluZ1BlcmNlbnRhZ2U7XG5cbiAgICAgICAgc291bmQub25QbGF5aW5nKHBsYXlpbmdQZXJjZW50YWdlLCBzb3VuZC5hdWRpb0J1ZmZlci5kdXJhdGlvbiwgc291bmQucGxheVRpbWUpO1xuXG4gICAgfTtcblxufVxuIl19

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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9saWJyYXJ5L2NvcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7SUFDQSxZQUFZLENBQUM7SUFFYixpQ0FBOEU7SUFDOUUsaUNBQXNDO0lBQ3RDLHFDQUEwQztJQUMxQyxpQ0FBb0Q7SUFVcEQ7UUFzQ0ksb0JBQVksYUFBZ0M7WUFBaEMsOEJBQUEsRUFBQSxrQkFBZ0M7WUFWNUMsWUFBWTtZQUNILDBCQUFxQixHQUFXLFFBQVEsQ0FBQztZQUN6Qyw0QkFBdUIsR0FBVyxTQUFTLENBQUM7WUFDNUMsaUNBQTRCLEdBQVcsY0FBYyxDQUFDO1lBRXRELG9CQUFlLEdBQUcsTUFBTSxDQUFDO1lBQ3pCLHdCQUFtQixHQUFHLFVBQVUsQ0FBQztZQUNqQyxxQkFBZ0IsR0FBRyxPQUFPLENBQUM7WUFDM0Isb0JBQWUsR0FBRyxNQUFNLENBQUM7WUFJOUIsSUFBSSxjQUFjLEdBQUc7Z0JBQ2pCLE1BQU0sRUFBRSxFQUFFO2dCQUNWLFNBQVMsRUFBRSxLQUFLO2dCQUNoQixhQUFhLEVBQUUsRUFBRTtnQkFDakIsMkJBQTJCLEVBQUUsSUFBSTtnQkFDakMsZUFBZSxFQUFFLElBQUk7YUFDeEIsQ0FBQztZQUVGLElBQUksT0FBTyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLGNBQWMsRUFBRSxhQUFhLENBQUMsQ0FBQztZQUUvRCxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFDOUIsSUFBSSxDQUFDLGNBQWMsR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDO1lBQzVDLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO1lBQ2pCLElBQUksQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyw0QkFBNEIsR0FBRyxPQUFPLENBQUMsMkJBQTJCLENBQUM7WUFDeEUsSUFBSSxDQUFDLGdCQUFnQixHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUM7WUFDaEQsSUFBSSxDQUFDLFVB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ZmlsZSI6ImxpYnJhcnkvY29yZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBQbGF5ZXJTb3VuZCwgSVNvdW5kLCBJU291bmRBdHRyaWJ1dGVzLCBJU291bmRTb3VyY2UgfSBmcm9tICcuL3NvdW5kJztcbmltcG9ydCB7IFBsYXllckF1ZGlvIH0gZnJvbSAnLi9hdWRpbyc7XG5pbXBvcnQgeyBQbGF5ZXJSZXF1ZXN0IH0gZnJvbSAnLi9yZXF1ZXN0JztcbmltcG9ydCB7IFBsYXllckVycm9yLCBJUGxheWVyRXJyb3IgfSBmcm9tICcuL2Vycm9yJztcblxuZXhwb3J0IGludGVyZmFjZSBJQ29yZU9wdGlvbnMge1xuICAgIHZvbHVtZT86IG51bWJlcjtcbiAgICBsb29wUXVldWU/OiBib29sZWFuO1xuICAgIHNvdW5kc0Jhc2VVcmw/OiBzdHJpbmc7XG4gICAgcGxheWluZ1Byb2dyZXNzSW50ZXJ2YWxUaW1lPzogbnVtYmVyO1xuICAgIHBsYXlOZXh0T25FbmRlZD86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBjbGFzcyBQbGF5ZXJDb3JlIHtcblxuICAgIC8vIGlzIHRoZSB3ZWIgYXVkaW8gQVBJIHN1cHBvcnRlZFxuICAgIHByb3RlY3RlZCBfaXNXZWJBdWRpb0FwaVN1cHBvcnRlZDogYm9vbGVhbjtcbiAgICAvLyB0aGUgc291bmRzIHF1ZXVlXG4gICAgcHJvdGVjdGVkIF9xdWV1ZTogSVNvdW5kW107XG4gICAgLy8gdGhlIHZvbHVtZSAoMCB0byAxMDApXG4gICAgcHJvdGVjdGVkIF92b2x1bWU6IG51bWJlcjtcbiAgICAvLyB0aGUgYmFzZSB1cmwgdGhhdCBhbGwgc291bmRzIHdpbGwgaGF2ZSBpbiBjb21tb25cbiAgICBwcm90ZWN0ZWQgX3NvdW5kc0Jhc2VVcmw6IHN0cmluZztcbiAgICAvLyB0aGUgY3VycmVudCBzb3VuZCBpbiBxdWV1ZSBpbmRleFxuICAgIHByb3RlY3RlZCBfY3VycmVudEluZGV4OiBudW1iZXI7XG4gICAgLy8gaW5zdGFuY2Ugb2YgdGhlIGF1ZGlvIGxpYnJhcnkgY2xhc3NcbiAgICBwcm90ZWN0ZWQgX3BsYXllckF1ZGlvOiBQbGF5ZXJBdWRpbztcbiAgICAvLyBwbGF5aW5nIHByb2dyZXNzIHRpbWUgaW50ZXJ2YWxcbiAgICBwcm90ZWN0ZWQgX3BsYXlpbmdQcm9ncmVzc0ludGVydmFsVGltZTogbnVtYmVyO1xuICAgIC8vIHBsYXlpbmcgcHJvZ3Jlc3MgdGltZW91dElEXG4gICAgcHJvdGVjdGVkIF9wbGF5aW5nVGltZW91dElEOiBudW1iZXIgfCBudWxsO1xuICAgIC8vIHdoZW4gYSBzb25nIGZpbmlzaGVzLCBhdXRvbWF0aWNhbGx5IHBsYXkgdGhlIG5leHQgb25lXG4gICAgcHJvdGVjdGVkIF9wbGF5TmV4dE9uRW5kZWQ6IGJvb2xlYW47XG4gICAgLy8gZG8gd2Ugc3RhcnQgb3ZlciBnYWluIGF0IHRoZSBlbmQgb2YgdGhlIHF1ZXVlXG4gICAgcHJvdGVjdGVkIF9sb29wUXVldWU6IGJvb2xlYW47XG5cbiAgICAvLyBjYWxsYmFjayBob29rc1xuICAgIHB1YmxpYyBvblBsYXlTdGFydDogKCkgPT4gdm9pZDtcbiAgICBwdWJsaWMgb25QbGF5aW5nOiAoKSA9PiB2b2lkO1xuICAgIHB1YmxpYyBvbkJ1ZmZlcmluZzogKCkgPT4gdm9pZDtcblxuICAgIC8vIGNvbnN0YW50c1xuICAgIHJlYWRvbmx5IFdIRVJFX0lOX1FVRVVFX0FUX0VORDogc3RyaW5nID0gJ2FwcGVuZCc7XG4gICAgcmVhZG9ubHkgV0hFUkVfSU5fUVVFVUVfQVRfU1RBUlQ6IHN0cmluZyA9ICdwcmVwZW5kJztcbiAgICByZWFkb25seSBXSEVSRV9JTl9RVUVVRV9BRlRFUl9DVVJSRU5UOiBzdHJpbmcgPSAnYWZ0ZXJDdXJyZW50JztcblxuICAgIHJlYWRvbmx5IFBMQVlfU09VTkRfTkVYVCA9ICduZXh0JztcbiAgICByZWFkb25seSBQTEFZX1NPVU5EX1BSRVZJT1VTID0gJ3ByZXZpb3VzJztcbiAgICByZWFkb25seSBQTEFZX1NPVU5EX0ZJUlNUID0gJ2ZpcnN0JztcbiAgICByZWFkb25seSBQTEFZX1NPVU5EX0xBU1QgPSAnbGFzdCc7XG5cbiAgICBjb25zdHJ1Y3RvcihwbGF5ZXJPcHRpb25zOiBJQ29yZU9wdGlvbnMgPSB7fSkge1xuXG4gICAgICAgIGxldCBkZWZhdWx0T3B0aW9ucyA9IHtcbiAgICAgICAgICAgIHZvbHVtZTogODAsXG4gICAgICAgICAgICBsb29wUXVldWU6IGZhbHNlLFxuICAgICAgICAgICAgc291bmRzQmFzZVVybDogJycsXG4gICAgICAgICAgICBwbGF5aW5nUHJvZ3Jlc3NJbnRlcnZhbFRpbWU6IDEwMDAsXG4gICAgICAgICAgICBwbGF5TmV4dE9uRW5kZWQ6IHRydWVcbiAgICAgICAgfTtcblxuICAgICAgICBsZXQgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRPcHRpb25zLCBwbGF5ZXJPcHRpb25zKTtcblxuICAgICAgICB0aGlzLl92b2x1bWUgPSBvcHRpb25zLnZvbHVtZTtcbiAgICAgICAgdGhpcy5fc291bmRzQmFzZVVybCA9IG9wdGlvbnMuc291bmRzQmFzZVVybDtcbiAgICAgICAgdGhpcy5fcXVldWUgPSBbXTtcbiAgICAgICAgdGhpcy5fY3VycmVudEluZGV4ID0gMDtcbiAgICAgICAgdGhpcy5fcGxheWluZ1Byb2dyZXNzSW50ZXJ2YWxUaW1lID0gb3B0aW9ucy5wbGF5aW5nUHJvZ3Jlc3NJbnRlcnZhbFRpbWU7XG4gICAgICAgIHRoaXMuX3BsYXlOZXh0T25FbmRlZCA9IG9wdGlvbnMucGxheU5leHRPbkVuZGVkO1xuICAgICAgICB0aGlzLl9sb29wUXVldWUgPSBvcHRpb25zLmxvb3BRdWV1ZTtcblxuICAgICAgICB0aGlzLl9pbml0aWFsaXplKCk7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX2luaXRpYWxpemUoKSB7XG5cbiAgICAgICAgLy8gVE9ETzogY2hlY2sgaWYgd2ViIGF1ZGlvIGFwaSBpcyBhdmFpbGFibGVcbiAgICAgICAgbGV0IHdlYkF1ZGlvQXBpID0gdHJ1ZTtcblxuICAgICAgICAvLyBpcyB0aGUgd2ViIGF1ZGlvIGFwaSBzdXBwb3J0ZWRcbiAgICAgICAgLy8gaWYgbm90IHdlIHdpbGwgdXNlIHRoZSBhdWRpbyBlbGVtZW50IGFzIGZhbGxiYWNrXG4gICAgICAgIGlmICh3ZWJBdWRpb0FwaSkge1xuXG4gICAgICAgICAgICB0aGlzLl9pc1dlYkF1ZGlvQXBpU3VwcG9ydGVkID0gdHJ1ZTtcblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAvLyB1c2UgdGhlIGh0bWw1IGF1ZGlvIGVsZW1lbnRcbiAgICAgICAgICAgIHRoaXMuX2lzV2ViQXVkaW9BcGlTdXBwb3J0ZWQgPSBmYWxzZTtcblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gcGxheWVyIGF1ZGlvIGxpYnJhcnkgaW5zdGFuY2VcbiAgICAgICAgdGhpcy5fcGxheWVyQXVkaW8gPSBuZXcgUGxheWVyQXVkaW8oKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBhZGRTb3VuZFRvUXVldWUoc291bmRBdHRyaWJ1dGVzOiBJU291bmRBdHRyaWJ1dGVzLCB3aGVyZUluUXVldWU6IHN0cmluZyA9IHRoaXMuV0hFUkVfSU5fUVVFVUVfQVRfRU5EKTogSVNvdW5kIHtcblxuICAgICAgICBsZXQgc291bmQ6IElTb3VuZCA9IG5ldyBQbGF5ZXJTb3VuZChzb3VuZEF0dHJpYnV0ZXMpO1xuXG4gICAgICAgIC8vIFRPRE86IGlzIHF1ZXVlIGp1c3QgYW4gYXJyYXkgb2Ygc291bmRzLCBvciBkbyB3ZSBuZWVkIHNvbWV0aGluZyBtb3JlIGNvbXBsZXggd2l0aCBhIHBvc2l0aW9uIHRyYWNrZXI/XG5cbiAgICAgICAgLy8gVE9ETzogYWxsb3cgYXJyYXkgb2Ygc291bmRBdHRyaWJ1dGVzIHRvIGJlIGluamVjdGVkLCB0byBjcmVhdGUgc2V2ZXJhbCBhdCBvbmNlLCBpZiBpbnB1dCBpcyBhbiBhcnJheSBvdXRwdXQgc2hvdWxkIGJlIHRvb1xuXG4gICAgICAgIHN3aXRjaCAod2hlcmVJblF1ZXVlKSB7XG4gICAgICAgICAgICBjYXNlIHRoaXMuV0hFUkVfSU5fUVVFVUVfQVRfRU5EOlxuICAgICAgICAgICAgICAgIHRoaXMuX2FwcGVuZFNvdW5kVG9RdWV1ZShzb3VuZCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIHRoaXMuV0hFUkVfSU5fUVVFVUVfQVRfU1RBUlQ6XG4gICAgICAgICAgICAgICAgdGhpcy5fcHJlcGVuZFNvdW5kVG9RdWV1ZShzb3VuZCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIHRoaXMuV0hFUkVfSU5fUVVFVUVfQUZURVJfQ1VSUkVOVDpcbiAgICAgICAgICAgICAgICB0aGlzLl9wcmVwZW5kU291bmRUb1F1ZXVlKHNvdW5kKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzb3VuZDtcblxuICAgIH1cblxuICAgIHB1YmxpYyBfYXBwZW5kU291bmRUb1F1ZXVlKHNvdW5kOiBJU291bmQpOiB2b2lkIHtcblxuICAgICAgICB0aGlzLl9xdWV1ZS5wdXNoKHNvdW5kKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBfcHJlcGVuZFNvdW5kVG9RdWV1ZShzb3VuZDogSVNvdW5kKTogdm9pZCB7XG5cbiAgICAgICAgdGhpcy5fcXVldWUudW5zaGlmdChzb3VuZCk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgX2FkZFNvdW5kVG9RdWV1ZUFmdGVyQ3VycmVudChzb3VuZDogSVNvdW5kKTogdm9pZCB7XG5cbiAgICAgICAgLy8gVE9ETzogYWRkIG9wdGlvbiB0byBwbGF5IGFmdGVyIGJlaW5nIGFkZGVkIG9yIHVzZXIgdXNlcyBwbGF5IG1ldGhvZD9cblxuICAgICAgICAvLyBpZiB0aGVyZSBpcyBubyBjdXJyZW50IHNvbmcgeWV0LCBhcHBlbmQgdGhlIHNvbmcgdG8gdGhlIHF1ZXVlXG4gICAgICAgIGlmICh0aGlzLl9jdXJyZW50SW5kZXggPT09IG51bGwpIHtcblxuICAgICAgICAgICAgdGhpcy5fYXBwZW5kU291bmRUb1F1ZXVlKHNvdW5kKTtcblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICBsZXQgYWZ0ZXJDdXJyZW50SW5kZXggPSB0aGlzLl9jdXJyZW50SW5kZXggKyAxO1xuXG4gICAgICAgICAgICB0aGlzLl9xdWV1ZS5zcGxpY2UoYWZ0ZXJDdXJyZW50SW5kZXgsIDAsIHNvdW5kKTtcblxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgcmVzZXRRdWV1ZSgpIHtcblxuICAgICAgICB0aGlzLl9xdWV1ZSA9IFtdO1xuXG4gICAgICAgIC8vIFRPRE86IGNoZWNrIGlmIGEgc29uZyBpcyBnZXR0aW5nIHBsYXllZCBhbmQgc3RvcCBpdD9cblxuICAgIH1cblxuICAgIHB1YmxpYyBnZXRRdWV1ZSgpIHtcblxuICAgICAgICAvLyBUT0RPOiBpcyB0aGUgbmVlZGVkP1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9xdWV1ZTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBzZXRWb2x1bWUodm9sdW1lOiBudW1iZXIpOiB2b2lkIHtcblxuICAgICAgICB0aGlzLl92b2x1bWUgPSB2b2x1bWU7XG5cbiAgICAgICAgdGhpcy5fcGxheWVyQXVkaW8uY2hhbmdlR2FpblZhbHVlKHZvbHVtZSk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0Vm9sdW1lKCk6IG51bWJlciB7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX3ZvbHVtZTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBtdXRlKCkge1xuXG4gICAgICAgIHRoaXMuc2V0Vm9sdW1lKDApO1xuXG4gICAgfVxuXG4gICAgcHVibGljIHNldFBvc2l0aW9uKHNvdW5kUG9zaXRpb25JblBlcmNlbnQ6IG51bWJlcik6IHZvaWQge1xuXG4gICAgICAgIC8vIGdldCB0aGUgY3VycmVudCBzb3VuZCBpZiBhbnlcbiAgICAgICAgbGV0IGN1cnJlbnRTb3VuZCA9IHRoaXMuX2dldFNvdW5kRnJvbVF1ZXVlKCk7XG5cbiAgICAgICAgLy8gaWYgdGhlcmUgaXMgYSBzb3VuZCBjdXJyZW50bHkgYmVpbmcgcGxheWVkXG4gICAgICAgIGlmIChjdXJyZW50U291bmQgIT09IG51bGwgJiYgY3VycmVudFNvdW5kLmlzUGxheWluZykge1xuXG4gICAgICAgICAgICAvLyBzdG9wIHRoZSB0cmFjayBwbGF5YmFja1xuICAgICAgICAgICAgdGhpcy5wYXVzZSgpO1xuXG4gICAgICAgICAgICBsZXQgc291bmRQb3NpdGlvbkluU2Vjb25kcyA9IChjdXJyZW50U291bmQuZHVyYXRpb24gLyAxMDApICogc291bmRQb3NpdGlvbkluUGVyY2VudDtcblxuICAgICAgICAgICAgLy8gc3RhcnQgdGhlIHBsYXliYWNrIGF0IHRoZSBnaXZlbiBwb3NpdGlvblxuICAgICAgICAgICAgdGhpcy5wbGF5KGN1cnJlbnRTb3VuZC5pZCwgc291bmRQb3NpdGlvbkluU2Vjb25kcyk7XG5cbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9sb2FkU291bmQoc291bmQ6IElTb3VuZCk6IFByb21pc2U8SVNvdW5kIHwgUGxheWVyRXJyb3I+IHtcblxuICAgICAgICAvLyBUT0RPOiB3b3VsZCBiZSBnb29kIHRvIGNhY2hlIGJ1ZmZlcnMsIHNvIG5lZWQgdG8gY2hlY2sgaWYgaXMgaW4gY2FjaGVcbiAgICAgICAgLy8gbGV0IHRoZSB1c2VyIGNob29zZSAoYnkgc2V0dGluZyBhbiBvcHRpb24pIHdoYXQgYW1vdW50IG9mIHNvdW5kcyB3aWxsIGJlIGNhY2hlZFxuICAgICAgICAvLyBhZGQgYSBjYWNoZWQgZGF0ZSAvIHRpbWVzdGFtcCB0byBiZSBhYmxlIHRvIGNsZWFyIGNhY2hlIGJ5IG9sZGVzdCBmaXJzdFxuICAgICAgICAvLyBvciBldmVuIGJldHRlciBhZGQgYSBwbGF5ZWQgY291bnRlciB0byBjYWNoZSBieSBsZWFzdCBwbGF5ZWQgYW5kIGRhdGVcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgICAgICAvLyBpZiB0aGUgc291bmQgYWxyZWFkeSBoYXMgYW4gQXVkaW9CdWZmZXJcbiAgICAgICAgICAgIGlmIChzb3VuZC5hdWRpb0J1ZmZlciAhPT0gbnVsbCkge1xuXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShzb3VuZCk7XG5cbiAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICAvLyBpZiB0aGUgc291bmQgaGFzIGFscmVhZHkgYW4gQXJyYXlCdWZmZXIgYnV0IG5vIEF1ZGlvQnVmZmVyXG4gICAgICAgICAgICBpZiAoc291bmQuYXJyYXlCdWZmZXIgIT09IG51bGwgJiYgc291bmQuYXVkaW9CdWZmZXIgPT09IG51bGwpIHtcblxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9kZWNvZGVTb3VuZChzb3VuZCwgcmVzb2x2ZSwgcmVqZWN0KTtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBpZiB0aGUgc291bmQgaGFzIG5vIEFycmF5QnVmZmVyIGFuZCBhbHNvIG5vIEF1ZGlvQnVmZmVyIHlldFxuICAgICAgICAgICAgaWYgKHNvdW5kLmFycmF5QnVmZmVyID09PSBudWxsICYmIHNvdW5kLmF1ZGlvQnVmZmVyID09PSBudWxsKSB7XG5cbiAgICAgICAgICAgICAgICBpZiAoc291bmQudXJsICE9PSBudWxsKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgbGV0IHJlcXVlc3QgPSBuZXcgUGxheWVyUmVxdWVzdCgpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGNoYW5nZSBidWZmZXJpbmcgc3RhdGVcbiAgICAgICAgICAgICAgICAgICAgc291bmQuaXNCdWZmZXJpbmcgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3QuZ2V0QXJyYXlCdWZmZXIoc291bmQpLnRoZW4oKGFycmF5QnVmZmVyOiBBcnJheUJ1ZmZlcikgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VuZC5hcnJheUJ1ZmZlciA9IGFycmF5QnVmZmVyO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fZGVjb2RlU291bmQoc291bmQsIHJlc29sdmUsIHJlamVjdCk7XG5cbiAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goKHJlcXVlc3RFcnJvcjogSVBsYXllckVycm9yKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChyZXF1ZXN0RXJyb3IpO1xuXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgICAgICBsZXQgbm9VcmxFcnJvciA9IG5ldyBQbGF5ZXJFcnJvcignc291bmQgaGFzIG5vIHVybCcsIDEpO1xuXG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChub1VybEVycm9yKTtcblxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9kZWNvZGVTb3VuZChzb3VuZDogSVNvdW5kLCByZXNvbHZlOiBGdW5jdGlvbiwgcmVqZWN0OiBGdW5jdGlvbikge1xuXG4gICAgICAgIGxldCBhcnJheUJ1ZmZlciA9IHNvdW5kLmFycmF5QnVmZmVyO1xuXG4gICAgICAgIHRoaXMuX3BsYXllckF1ZGlvLmRlY29kZUF1ZGlvKGFycmF5QnVmZmVyKS50aGVuKChhdWRpb0J1ZmZlcjogQXVkaW9CdWZmZXIpID0+IHtcblxuICAgICAgICAgICAgc291bmQuYXVkaW9CdWZmZXIgPSBhdWRpb0J1ZmZlcjtcbiAgICAgICAgICAgIHNvdW5kLmlzQnVmZmVyaW5nID0gZmFsc2U7XG4gICAgICAgICAgICBzb3VuZC5pc0J1ZmZlcmVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHNvdW5kLmF1ZGlvQnVmZmVyRGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICBzb3VuZC5kdXJhdGlvbiA9IHNvdW5kLmF1ZGlvQnVmZmVyLmR1cmF0aW9uO1xuXG4gICAgICAgICAgICByZXNvbHZlKHNvdW5kKTtcblxuICAgICAgICB9KS5jYXRjaCgoZGVjb2RlQXVkaW9FcnJvcjogSVBsYXllckVycm9yKSA9PiB7XG5cbiAgICAgICAgICAgIHJlamVjdChkZWNvZGVBdWRpb0Vycm9yKTtcblxuICAgICAgICB9KTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBwbGF5KHdoaWNoU291bmQ/OiBudW1iZXIgfCBzdHJpbmcgfCB1bmRlZmluZWQsIHBsYXlUaW1lT2Zmc2V0PzogbnVtYmVyKTogdm9pZCB7XG5cbiAgICAgICAgLy8gVE9ETzogY2hlY2sgdGhlIGF2YWlsYWJsZSBjb2RlY3MgYW5kIGRlZmluZWQgc291cmNlcywgcGxheSB0aGUgZmlyc3Qgb25lIHRoYXQgaGFzIG1hdGNoZXMgYW5kIGF2YWlsYWJsZSBjb2RlY1xuICAgICAgICAvLyBUT0RPOiBsZXQgdXNlciBkZWZpbmUgb3JkZXIgb2YgcHJlZmVycmVkIGNvZGVjcyBmb3IgcGxheWVyYmFja1xuXG4gICAgICAgIC8vIGdldCB0aGUgY3VycmVudCBzb3VuZCBpZiBhbnlcbiAgICAgICAgbGV0IGN1cnJlbnRTb3VuZCA9IHRoaXMuX2dldFNvdW5kRnJvbVF1ZXVlKCk7XG5cbiAgICAgICAgLy8gaWYgdGhlcmUgaXMgYSBzb3VuZCBjdXJyZW50bHkgYmVpbmcgcGxheWVkXG4gICAgICAgIGlmIChjdXJyZW50U291bmQgIT09IG51bGwgJiYgY3VycmVudFNvdW5kLmlzUGxheWluZykge1xuXG4gICAgICAgICAgICAvLyBzdG9wIHRoZSBjdXJyZW50IHNvdW5kXG4gICAgICAgICAgICB0aGlzLnN0b3AoKTtcblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gd2hpY2hTb3VuZCBpcyBvcHRpb25hbCwgaWYgc2V0IGl0IGNhbiBiZSB0aGUgc291bmQgaWQgb3IgaWYgaXQncyBhIHN0cmluZyBpdCBjYW4gYmUgbmV4dCAvIHByZXZpb3VzIC8gZmlyc3QgLyBsYXN0XG4gICAgICAgIGxldCBzb3VuZCA9IHRoaXMuX2dldFNvdW5kRnJvbVF1ZXVlKHdoaWNoU291bmQpO1xuXG4gICAgICAgIC8vIGlmIHRoZXJlIGlzIG5vIHNvdW5kIHdlIGNvdWxkIHBsYXksIGRvIG5vdGhpbmdcbiAgICAgICAgaWYgKHNvdW5kID09PSBudWxsKSB7XG5cbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAgICAgLy8gVE9ETzogdGhyb3cgYW4gZXJyb3I/XG5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGlmIHRoZSB1c2VyIHdhbnRzIHRvIHBsYXkgdGhlIHNvdW5kIGZyb20gYSBjZXJ0YWluIHBvc2l0aW9uXG4gICAgICAgIGlmIChwbGF5VGltZU9mZnNldCAhPT0gdW5kZWZpbmVkKSB7XG5cbiAgICAgICAgICAgIHNvdW5kLnBsYXlUaW1lT2Zmc2V0ID0gcGxheVRpbWVPZmZzZXQ7XG5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGhhcyB0aGUgc291bmQgYWxyZWFkeSBiZWVuIGxvYWRlZD9cbiAgICAgICAgaWYgKCFzb3VuZC5pc0J1ZmZlcmVkKSB7XG5cbiAgICAgICAgICAgIC8vIGV4dHJhY3QgdGhlIHVybCBhbmQgY29kZWMgZnJvbSBzb3VyY2VzXG4gICAgICAgICAgICBsZXQgeyB1cmwsIGNvZGVjID0gbnVsbCB9ID0gdGhpcy5fc291cmNlVG9WYXJpYWJsZXMoc291bmQuc291cmNlcyk7XG5cbiAgICAgICAgICAgIHNvdW5kLnVybCA9IHVybDtcbiAgICAgICAgICAgIHNvdW5kLmNvZGVjID0gY29kZWM7XG5cbiAgICAgICAgICAgIHRoaXMuX2xvYWRTb3VuZChzb3VuZCkudGhlbigoKSA9PiB7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9wbGF5KHNvdW5kKTtcblxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBoYW5kbGUgZXJyb3JcblxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgdGhpcy5fcGxheShzb3VuZCk7XG5cbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9wbGF5KHNvdW5kOiBJU291bmQpIHtcblxuICAgICAgICAvLyBzb3VyY2Ugbm9kZSBvcHRpb25zXG4gICAgICAgIGxldCBzb3VyY2VOb2RlT3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGxvb3A6IHNvdW5kLmxvb3AsXG4gICAgICAgICAgICBvbkVuZGVkOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5fb25FbmRlZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGNyZWF0ZSBhIG5ldyBzb3VyY2Ugbm9kZVxuICAgICAgICB0aGlzLl9wbGF5ZXJBdWRpby5jcmVhdGVTb3VyY2VOb2RlKHNvdXJjZU5vZGVPcHRpb25zKS50aGVuKChzb3VyY2VOb2RlKSA9PiB7XG5cbiAgICAgICAgICAgIHNvdW5kLmlzUGxheWluZyA9IHRydWU7XG4gICAgICAgICAgICBzb3VuZC5zb3VyY2VOb2RlID0gc291cmNlTm9kZTtcblxuICAgICAgICAgICAgLy8gYWRkIHRoZSBidWZmZXIgdG8gdGhlIHNvdXJjZSBub2RlXG4gICAgICAgICAgICBzb3VyY2VOb2RlLmJ1ZmZlciA9IHNvdW5kLmF1ZGlvQnVmZmVyO1xuXG4gICAgICAgICAgICAvLyB0aGUgYXVkaW9jb250ZXh0IHRpbWUgcmlnaHQgbm93IChzaW5jZSB0aGUgYXVkaW9jb250ZXh0IGdvdCBjcmVhdGVkKVxuICAgICAgICAgICAgc291bmQuc3RhcnRUaW1lID0gc291cmNlTm9kZS5jb250ZXh0LmN1cnJlbnRUaW1lO1xuXG4gICAgICAgICAgICAvLyBjb25uZWN0IHRoZSBzb3VyY2UgdG8gdGhlIGdyYXBoIChkZXN0aW5hdGlvbilcbiAgICAgICAgICAgIHRoaXMuX3BsYXllckF1ZGlvLmNvbm5lY3RTb3VyY2VOb2RlVG9HcmFwaChzb3VyY2VOb2RlKTtcblxuICAgICAgICAgICAgLy8gc3RhcnQgcGxheWJhY2tcbiAgICAgICAgICAgIC8vIHN0YXJ0KHdoZW4sIG9mZnNldCwgZHVyYXRpb24pXG4gICAgICAgICAgICBzb3VyY2VOb2RlLnN0YXJ0KDAsIHNvdW5kLnBsYXlUaW1lT2Zmc2V0KTtcblxuICAgICAgICAgICAgaWYgKHNvdW5kLm9uUGxheWluZyAhPT0gbnVsbCkge1xuXG4gICAgICAgICAgICAgICAgLy8gYXQgaW50ZXJ2YWwgc2V0IHBsYXlpbmcgcHJvZ3Jlc3NcbiAgICAgICAgICAgICAgICB0aGlzLl9wbGF5aW5nVGltZW91dElEID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3BsYXlpbmdQcm9ncmVzcyhzb3VuZCk7XG5cbiAgICAgICAgICAgICAgICB9LCB0aGlzLl9wbGF5aW5nUHJvZ3Jlc3NJbnRlcnZhbFRpbWUpO1xuXG4gICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fcGxheWluZ1RpbWVvdXRJRCA9IG51bGw7XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KS5jYXRjaCgoZXJyb3IpID0+IHtcblxuICAgICAgICAgICAgLy8gVE9ETzogaGFuZGxlIGVycm9yXG5cbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX29uRW5kZWQoKSB7XG5cbiAgICAgICAgLy8gZ2V0IHRoZSBjdXJyZW50IHNvdW5kIGlmIGFueVxuICAgICAgICBsZXQgY3VycmVudFNvdW5kID0gdGhpcy5fZ2V0U291bmRGcm9tUXVldWUoKTtcblxuICAgICAgICAvLyBpZiB0aGVyZSBpcyBhIHNvdW5kIGN1cnJlbnRseSBiZWluZyBwbGF5ZWRcbiAgICAgICAgaWYgKGN1cnJlbnRTb3VuZCAhPT0gbnVsbCAmJiBjdXJyZW50U291bmQuaXNQbGF5aW5nKSB7XG5cbiAgICAgICAgICAgIGxldCB1cGRhdGVJbmRleCA9IGZhbHNlO1xuXG4gICAgICAgICAgICBsZXQgbmV4dFNvdW5kID0gdGhpcy5fZ2V0U291bmRGcm9tUXVldWUoJ25leHQnLCB1cGRhdGVJbmRleCk7XG5cbiAgICAgICAgICAgIGlmIChjdXJyZW50U291bmQub25FbmRlZCAhPT0gbnVsbCkge1xuXG4gICAgICAgICAgICAgICAgbGV0IHdpbGxQbGF5TmV4dCA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgLy8gY2hlY2sgaWYgdGhlcmUgaXMgYW5vdGhlciBzb3VuZCBpbiB0aGUgcXVldWUgYW5kIGlmIHBsYXlpbmdcbiAgICAgICAgICAgICAgICAvLyB0aGUgbmV4dCBvbmUgb24gZW5kZWQgaXMgYWN0aXZhdGVkXG4gICAgICAgICAgICAgICAgaWYgKG5leHRTb3VuZCAhPT0gbnVsbCAmJiB0aGlzLl9wbGF5TmV4dE9uRW5kZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgd2lsbFBsYXlOZXh0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjdXJyZW50U291bmQub25FbmRlZCh3aWxsUGxheU5leHQpO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuc3RvcCgpO1xuXG4gICAgICAgICAgICBpZiAobmV4dFNvdW5kICE9PSBudWxsKSB7XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fcGxheU5leHRPbkVuZGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGxheSgnbmV4dCcpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgIC8vIHdlIHJlYWNoZWQgdGhlIGVuZCBvZiB0aGUgcXVldWUgc2V0IHRoZSBjdXJyZW50SW5kZXggYmFjayB0byB6ZXJvXG4gICAgICAgICAgICAgICAgdGhpcy5fY3VycmVudEluZGV4ID0gMDtcblxuICAgICAgICAgICAgICAgIC8vIGlmIHF1ZXVlIGxvb3AgaXMgYWN0aXZlIHRoZW4gcGxheVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9sb29wUXVldWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wbGF5KCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogd2hpY2hTb3VuZCBpcyBvcHRpb25hbCwgaWYgc2V0IGl0IGNhbiBiZSB0aGUgc291bmQgaWQgb3IgaWYgaXQnc1xuICAgICAqIGEgc3RyaW5nIGl0IGNhbiBiZSBuZXh0IC8gcHJldmlvdXMgLyBmaXJzdCAvIGxhc3RcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0gd2hpY2hTb3VuZFxuICAgICAqIFxuICAgICAqL1xuICAgIHByb3RlY3RlZCBfZ2V0U291bmRGcm9tUXVldWUod2hpY2hTb3VuZD86IHN0cmluZyB8IG51bWJlciwgdXBkYXRlSW5kZXg6IGJvb2xlYW4gPSB0cnVlKTogSVNvdW5kIHwgbnVsbCB7XG5cbiAgICAgICAgbGV0IHNvdW5kID0gbnVsbDtcblxuICAgICAgICAvLyBjaGVjayBpZiB0aGUgcXVldWUgaXMgZW1wdHlcbiAgICAgICAgaWYgKHRoaXMuX3F1ZXVlLmxlbmd0aCA9PT0gMCkge1xuXG4gICAgICAgICAgICByZXR1cm4gc291bmQ7XG5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGlmIHdoaWNoIHNvbmcgdG8gcGxheSBkaWQgbm90IGdldCBzcGVjaWZpZWQsIHBsYXkgb25lIGJhc2VkIGZyb20gdGhlIHF1ZXVlIGJhc2VkIG9uIHRoZSBxdWV1ZSBpbmRleCBwb3NpdGlvbiBtYXJrZXJcbiAgICAgICAgaWYgKHdoaWNoU291bmQgPT09IHVuZGVmaW5lZCAmJiB0aGlzLl9xdWV1ZVt0aGlzLl9jdXJyZW50SW5kZXhdICE9PSB1bmRlZmluZWQpIHtcblxuICAgICAgICAgICAgc291bmQgPSB0aGlzLl9xdWV1ZVt0aGlzLl9jdXJyZW50SW5kZXhdO1xuXG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHdoaWNoU291bmQgPT09ICdudW1iZXInKSB7XG5cbiAgICAgICAgICAgIC8vIGlmIHdoaWNoIHNvbmcgdG8gcGxheSBpcyBhIG51bWVyaWMgSURcbiAgICAgICAgICAgIHNvdW5kID0gdGhpcy5fZmluZFNvdW5kQnlJZCh3aGljaFNvdW5kLCB1cGRhdGVJbmRleCk7XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgbGV0IHNvdW5kSW5kZXg6IG51bWJlciB8IG51bGwgPSBudWxsO1xuXG4gICAgICAgICAgICAvLyBpZiB3aGljaCBzb25nIHRvIHBsYXkgaXMgYSBjb25zdGFudFxuICAgICAgICAgICAgc3dpdGNoICh3aGljaFNvdW5kKSB7XG4gICAgICAgICAgICAgICAgY2FzZSB0aGlzLlBMQVlfU09VTkRfTkVYVDpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX3F1ZXVlW3RoaXMuX2N1cnJlbnRJbmRleCArIDFdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdW5kSW5kZXggPSB0aGlzLl9jdXJyZW50SW5kZXggKyAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgc291bmQgPSB0aGlzLl9xdWV1ZVtzb3VuZEluZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIHRoaXMuUExBWV9TT1VORF9QUkVWSU9VUzpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX3F1ZXVlW3RoaXMuX2N1cnJlbnRJbmRleCAtIDFdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdW5kSW5kZXggPSB0aGlzLl9jdXJyZW50SW5kZXggLSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgc291bmQgPSB0aGlzLl9xdWV1ZVtzb3VuZEluZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIHRoaXMuUExBWV9TT1VORF9GSVJTVDpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX3F1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdW5kSW5kZXggPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgc291bmQgPSB0aGlzLl9xdWV1ZVtzb3VuZEluZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIHRoaXMuUExBWV9TT1VORF9MQVNUOlxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fcXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc291bmRJbmRleCA9IHRoaXMuX3F1ZXVlLmxlbmd0aCAtIDI7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VuZCA9IHRoaXMuX3F1ZXVlW3NvdW5kSW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIHdoaWNoIHNvbmcgdG8gcGxheSBpcyBhIHN0cmluZyBJRFxuICAgICAgICAgICAgICAgICAgICBzb3VuZCA9IHRoaXMuX2ZpbmRTb3VuZEJ5SWQod2hpY2hTb3VuZCwgdXBkYXRlSW5kZXgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoc291bmRJbmRleCAhPT0gbnVsbCAmJiB1cGRhdGVJbmRleCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRJbmRleCA9IHNvdW5kSW5kZXg7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzb3VuZDtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfZmluZFNvdW5kQnlJZChzb3VuZElkOiBzdHJpbmcgfCBudW1iZXIsIHVwZGF0ZUluZGV4OiBib29sZWFuKTogSVNvdW5kIHwgbnVsbCB7XG5cbiAgICAgICAgbGV0IHNvdW5kID0gbnVsbDtcblxuICAgICAgICB0aGlzLl9xdWV1ZS5zb21lKChzb3VuZEZyb21RdWV1ZTogSVNvdW5kLCBxdWV1ZUluZGV4OiBudW1iZXIpID0+IHtcblxuICAgICAgICAgICAgaWYgKHNvdW5kRnJvbVF1ZXVlLmlkID09PSBzb3VuZElkKSB7XG5cbiAgICAgICAgICAgICAgICBzb3VuZCA9IHNvdW5kRnJvbVF1ZXVlO1xuXG4gICAgICAgICAgICAgICAgaWYgKHVwZGF0ZUluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRJbmRleCA9IHF1ZXVlSW5kZXg7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gc291bmQ7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX3NvdXJjZVRvVmFyaWFibGVzKHNvdXJjZXM6IChJU291bmRTb3VyY2UgfCBzdHJpbmcpW10pOiB7IHVybDogc3RyaW5nIHwgbnVsbCwgY29kZWM/OiBzdHJpbmcgfCBudWxsIH0ge1xuXG4gICAgICAgIC8vIFRPRE86IHNvdXJjZSBjYW4gYmUgb24gb2JqZWN0IHdoZXJlIHRoZSBwcm9wZXJ0eSBuYW1lIGlzIHRoZSBjb2RlYyBhbmQgdGhlIHZhbHVlIGlzIHRoZSBzb3VuZCB1cmxcbiAgICAgICAgLy8gaWYgc291bmQgaXNudCBhbiBvYmplY3QgdHJ5IHRvIGRldGVjdCBzb3VuZCBzb3VyY2UgZXh0ZW5zaW9uIGJ5IGZpbGUgZXh0ZW50aW9uIG9yIGJ5IGNoZWNraW5nIHRoZSBmaWxlIG1pbWUgdHlwZVxuXG4gICAgICAgIC8vIFRPRE86IGdldCBhIGxpc3Qgb2Ygc3VwcG9ydGVkIGNvZGVjcyBieSB0aGlzIGRldmljZVxuXG4gICAgICAgIGxldCBmaXJzdE1hdGNoaW5nU291cmNlOiB7IHVybDogc3RyaW5nIHwgbnVsbCwgY29kZWM/OiBzdHJpbmcgfCBudWxsIH0gPSB7XG4gICAgICAgICAgICB1cmw6IG51bGwsXG4gICAgICAgICAgICBjb2RlYzogbnVsbFxuICAgICAgICB9O1xuXG4gICAgICAgIHNvdXJjZXMuZm9yRWFjaCgoc291cmNlKSA9PiB7XG5cbiAgICAgICAgICAgIC8vIFRPRE86IGZpbmQgb3V0IHdoYXQgdGhlIHNvdXJjZSBjb2RlYyBpc1xuXG4gICAgICAgICAgICAvLyBUT0RPOiBjaGVjayBpZiB0aGUgc291cmNlIGNvZGVjIGlzIGFtb25nIHRoZSBvbmVzIHRoYXQgYXJlIHN1cHBvcnRlZCBieSB0aGlzIGRldmljZVxuXG4gICAgICAgICAgICBsZXQgc291bmRVcmwgPSAnJztcblxuICAgICAgICAgICAgLy8gaWYgdGhlIHBsYXllciBoYWQgYXMgb3B0aW9uIGEgYmFzZVVybCBmb3Igc291bmRzIGFkZCBpdCBub3dcbiAgICAgICAgICAgIGlmICh0aGlzLl9zb3VuZHNCYXNlVXJsICE9PSAnJykge1xuICAgICAgICAgICAgICAgIHNvdW5kVXJsID0gdGhpcy5fc291bmRzQmFzZVVybDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gdHdvIGtpbmQgb2Ygc291cmNlIGFyZSBwb3NzaWJsZSwgYSBzdHJpbmcgKHRoZSB1cmwpIG9yIGFuIG9iamVjdCAoa2V5IGlzIHRoZSBjb2RlYyBhbmQgdmFsdWUgaXMgdGhlIHVybClcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc291cmNlID09PSAnc3RyaW5nJykge1xuXG4gICAgICAgICAgICAgICAgc291bmRVcmwgKz0gc291cmNlO1xuXG4gICAgICAgICAgICAgICAgZmlyc3RNYXRjaGluZ1NvdXJjZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBzb3VuZFVybFxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICBzb3VuZFVybCArPSBzb3VyY2UudXJsO1xuXG4gICAgICAgICAgICAgICAgZmlyc3RNYXRjaGluZ1NvdXJjZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBzb3VuZFVybCxcbiAgICAgICAgICAgICAgICAgICAgY29kZWM6IHNvdXJjZS5jb2RlY1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gZmlyc3RNYXRjaGluZ1NvdXJjZTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBwYXVzZSgpIHtcblxuICAgICAgICAvLyBnZXQgdGhlIGN1cnJlbnQgc291bmRcbiAgICAgICAgbGV0IHNvdW5kOiBJU291bmQgfCBudWxsID0gdGhpcy5fZ2V0U291bmRGcm9tUXVldWUoKTtcblxuICAgICAgICBpZiAoc291bmQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCB0aW1lQXRQYXVzZSA9IHNvdW5kLnNvdXJjZU5vZGUuY29udGV4dC5jdXJyZW50VGltZTtcblxuICAgICAgICBzb3VuZC5wbGF5VGltZU9mZnNldCArPSB0aW1lQXRQYXVzZSAtIHNvdW5kLnN0YXJ0VGltZTtcblxuICAgICAgICB0aGlzLl9zdG9wKHNvdW5kKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBzdG9wKCkge1xuXG4gICAgICAgIC8vIGdldCB0aGUgY3VycmVudCBzb3VuZFxuICAgICAgICBsZXQgc291bmQ6IElTb3VuZCB8IG51bGwgPSB0aGlzLl9nZXRTb3VuZEZyb21RdWV1ZSgpO1xuXG4gICAgICAgIGlmIChzb3VuZCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgc291bmQucGxheVRpbWVPZmZzZXQgPSAwO1xuXG4gICAgICAgIHRoaXMuX3N0b3Aoc291bmQpO1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9zdG9wKHNvdW5kOiBJU291bmQpIHtcblxuICAgICAgICAvLyB0ZWxsIHRoZSBzb3VyY2VOb2RlIHRvIHN0b3AgcGxheWluZ1xuICAgICAgICBzb3VuZC5zb3VyY2VOb2RlLnN0b3AoMCk7XG5cbiAgICAgICAgLy8gdGVsbCB0aGUgc291bmQgdGhhdCBwbGF5aW5nIGlzIG92ZXJcbiAgICAgICAgc291bmQuaXNQbGF5aW5nID0gZmFsc2U7XG5cbiAgICAgICAgLy8gZGVzdHJveSB0aGUgc291cmNlIG5vZGUgYXMgaXQgY2FuIGFueXdheSBvbmx5IGdldCB1c2VkIG9uY2VcbiAgICAgICAgdGhpcy5fcGxheWVyQXVkaW8uZGVzdHJveVNvdXJjZU5vZGUoc291bmQuc291cmNlTm9kZSk7XG5cbiAgICAgICAgc291bmQuc291cmNlTm9kZSA9IG51bGw7XG5cbiAgICAgICAgaWYgKHRoaXMuX3BsYXlpbmdUaW1lb3V0SUQgIT09IG51bGwpIHtcblxuICAgICAgICAgICAgLy8gY2xlYXIgdGhlIHBsYXlpbmcgcHJvZ3Jlc3Mgc2V0SW50ZXJ2YWxcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5fcGxheWluZ1RpbWVvdXRJRCk7XG5cbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgcHVibGljIG5leHQoKSB7XG5cbiAgICAgICAgLy8gYWxpYXMgZm9yIHBsYXkgbmV4dFxuICAgICAgICB0aGlzLnBsYXkoJ25leHQnKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBwcmV2aW91cygpIHtcblxuICAgICAgICAvLyBhbGlhcyBmb3IgcGxheSBwcmV2aW91c1xuICAgICAgICB0aGlzLnBsYXkoJ3ByZXZpb3VzJyk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgZmlyc3QoKSB7XG5cbiAgICAgICAgLy8gYWxpYXMgZm9yIHBsYXkgZmlyc3RcbiAgICAgICAgdGhpcy5wbGF5KCdmaXJzdCcpO1xuXG4gICAgfVxuXG4gICAgcHVibGljIGxhc3QoKSB7XG5cbiAgICAgICAgLy8gYWxpYXMgZm9yIHBsYXkgbGFzdFxuICAgICAgICB0aGlzLnBsYXkoJ2xhc3QnKTtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfcGxheWluZ1Byb2dyZXNzKHNvdW5kOiBJU291bmQpIHtcblxuICAgICAgICBsZXQgdGltZU5vdyA9IHNvdW5kLnNvdXJjZU5vZGUuY29udGV4dC5jdXJyZW50VGltZTtcblxuICAgICAgICBzb3VuZC5wbGF5VGltZSA9ICh0aW1lTm93IC0gc291bmQuc3RhcnRUaW1lKSArIHNvdW5kLnBsYXlUaW1lT2Zmc2V0O1xuXG4gICAgICAgIGxldCBwbGF5aW5nUGVyY2VudGFnZSA9IChzb3VuZC5wbGF5VGltZSAvIHNvdW5kLmF1ZGlvQnVmZmVyLmR1cmF0aW9uKSAqIDEwMDtcblxuICAgICAgICBzb3VuZC5wbGF5ZWRUaW1lUGVyY2VudGFnZSA9IHBsYXlpbmdQZXJjZW50YWdlO1xuXG4gICAgICAgIHNvdW5kLm9uUGxheWluZyhwbGF5aW5nUGVyY2VudGFnZSwgc291bmQuYXVkaW9CdWZmZXIuZHVyYXRpb24sIHNvdW5kLnBsYXlUaW1lKTtcblxuICAgIH07XG5cbn1cbiJdfQ==

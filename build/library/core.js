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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9saWJyYXJ5L2NvcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7SUFDQSxZQUFZLENBQUM7SUFFYixpQ0FBOEU7SUFDOUUsaUNBQXNDO0lBQ3RDLHFDQUEwQztJQUMxQyxpQ0FBb0Q7SUFVcEQ7UUFpQ0ksb0JBQVksYUFBZ0M7WUFBaEMsOEJBQUEsRUFBQSxrQkFBZ0M7WUFWNUMsWUFBWTtZQUNILDBCQUFxQixHQUFXLFFBQVEsQ0FBQztZQUN6Qyw0QkFBdUIsR0FBVyxTQUFTLENBQUM7WUFDNUMsaUNBQTRCLEdBQVcsY0FBYyxDQUFDO1lBRXRELG9CQUFlLEdBQUcsTUFBTSxDQUFDO1lBQ3pCLHdCQUFtQixHQUFHLFVBQVUsQ0FBQztZQUNqQyxxQkFBZ0IsR0FBRyxPQUFPLENBQUM7WUFDM0Isb0JBQWUsR0FBRyxNQUFNLENBQUM7WUFJOUIsSUFBSSxjQUFjLEdBQUc7Z0JBQ2pCLE1BQU0sRUFBRSxFQUFFO2dCQUNWLFNBQVMsRUFBRSxLQUFLO2dCQUNoQixhQUFhLEVBQUUsRUFBRTtnQkFDakIsMkJBQTJCLEVBQUUsSUFBSTtnQkFDakMsZUFBZSxFQUFFLElBQUk7YUFDeEIsQ0FBQztZQUVGLElBQUksT0FBTyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLGNBQWMsRUFBRSxhQUFhLENBQUMsQ0FBQztZQUUvRCxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFDOUIsSUFBSSxDQUFDLGNBQWMsR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDO1lBQzVDLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO1lBQ2pCLElBQUksQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyw0QkFBNEIsR0FBRyxPQUFPLENBQUMsMkJBQTJCLENBQUM7WUFDeEUsSUFBSSxDQUFDLGdCQUFnQixHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUM7WUFDaEQsSUFBSSxDQUFDLFVB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ZmlsZSI6ImxpYnJhcnkvY29yZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBQbGF5ZXJTb3VuZCwgSVNvdW5kLCBJU291bmRBdHRyaWJ1dGVzLCBJU291bmRTb3VyY2UgfSBmcm9tICcuL3NvdW5kJztcbmltcG9ydCB7IFBsYXllckF1ZGlvIH0gZnJvbSAnLi9hdWRpbyc7XG5pbXBvcnQgeyBQbGF5ZXJSZXF1ZXN0IH0gZnJvbSAnLi9yZXF1ZXN0JztcbmltcG9ydCB7IFBsYXllckVycm9yLCBJUGxheWVyRXJyb3IgfSBmcm9tICcuL2Vycm9yJztcblxuZXhwb3J0IGludGVyZmFjZSBJQ29yZU9wdGlvbnMge1xuICAgIHZvbHVtZT86IG51bWJlcjtcbiAgICBsb29wUXVldWU/OiBib29sZWFuO1xuICAgIHNvdW5kc0Jhc2VVcmw/OiBzdHJpbmc7XG4gICAgcGxheWluZ1Byb2dyZXNzSW50ZXJ2YWxUaW1lPzogbnVtYmVyO1xuICAgIHBsYXlOZXh0T25FbmRlZD86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBjbGFzcyBQbGF5ZXJDb3JlIHtcblxuICAgIC8vIGlzIHRoZSB3ZWIgYXVkaW8gQVBJIHN1cHBvcnRlZFxuICAgIHByb3RlY3RlZCBfaXNXZWJBdWRpb0FwaVN1cHBvcnRlZDogYm9vbGVhbjtcbiAgICAvLyB0aGUgc291bmRzIHF1ZXVlXG4gICAgcHJvdGVjdGVkIF9xdWV1ZTogSVNvdW5kW107XG4gICAgLy8gdGhlIHZvbHVtZSAoMCB0byAxMDApXG4gICAgcHJvdGVjdGVkIF92b2x1bWU6IG51bWJlcjtcbiAgICAvLyB0aGUgYmFzZSB1cmwgdGhhdCBhbGwgc291bmRzIHdpbGwgaGF2ZSBpbiBjb21tb25cbiAgICBwcm90ZWN0ZWQgX3NvdW5kc0Jhc2VVcmw6IHN0cmluZztcbiAgICAvLyB0aGUgY3VycmVudCBzb3VuZCBpbiBxdWV1ZSBpbmRleFxuICAgIHByb3RlY3RlZCBfY3VycmVudEluZGV4OiBudW1iZXI7XG4gICAgLy8gaW5zdGFuY2Ugb2YgdGhlIGF1ZGlvIGxpYnJhcnkgY2xhc3NcbiAgICBwcm90ZWN0ZWQgX3BsYXllckF1ZGlvOiBQbGF5ZXJBdWRpbztcbiAgICAvLyBwbGF5aW5nIHByb2dyZXNzIHRpbWUgaW50ZXJ2YWxcbiAgICBwcm90ZWN0ZWQgX3BsYXlpbmdQcm9ncmVzc0ludGVydmFsVGltZTogbnVtYmVyO1xuICAgIC8vIHBsYXlpbmcgcHJvZ3Jlc3MgdGltZW91dElEXG4gICAgcHJvdGVjdGVkIF9wbGF5aW5nVGltZW91dElEOiBudW1iZXIgfCBudWxsO1xuICAgIC8vIHdoZW4gYSBzb25nIGZpbmlzaGVzLCBhdXRvbWF0aWNhbGx5IHBsYXkgdGhlIG5leHQgb25lXG4gICAgcHJvdGVjdGVkIF9wbGF5TmV4dE9uRW5kZWQ6IGJvb2xlYW47XG4gICAgLy8gZG8gd2Ugc3RhcnQgb3ZlciBnYWluIGF0IHRoZSBlbmQgb2YgdGhlIHF1ZXVlXG4gICAgcHJvdGVjdGVkIF9sb29wUXVldWU6IGJvb2xlYW47XG5cbiAgICAvLyBjb25zdGFudHNcbiAgICByZWFkb25seSBXSEVSRV9JTl9RVUVVRV9BVF9FTkQ6IHN0cmluZyA9ICdhcHBlbmQnO1xuICAgIHJlYWRvbmx5IFdIRVJFX0lOX1FVRVVFX0FUX1NUQVJUOiBzdHJpbmcgPSAncHJlcGVuZCc7XG4gICAgcmVhZG9ubHkgV0hFUkVfSU5fUVVFVUVfQUZURVJfQ1VSUkVOVDogc3RyaW5nID0gJ2FmdGVyQ3VycmVudCc7XG5cbiAgICByZWFkb25seSBQTEFZX1NPVU5EX05FWFQgPSAnbmV4dCc7XG4gICAgcmVhZG9ubHkgUExBWV9TT1VORF9QUkVWSU9VUyA9ICdwcmV2aW91cyc7XG4gICAgcmVhZG9ubHkgUExBWV9TT1VORF9GSVJTVCA9ICdmaXJzdCc7XG4gICAgcmVhZG9ubHkgUExBWV9TT1VORF9MQVNUID0gJ2xhc3QnO1xuXG4gICAgY29uc3RydWN0b3IocGxheWVyT3B0aW9uczogSUNvcmVPcHRpb25zID0ge30pIHtcblxuICAgICAgICBsZXQgZGVmYXVsdE9wdGlvbnMgPSB7XG4gICAgICAgICAgICB2b2x1bWU6IDgwLFxuICAgICAgICAgICAgbG9vcFF1ZXVlOiBmYWxzZSxcbiAgICAgICAgICAgIHNvdW5kc0Jhc2VVcmw6ICcnLFxuICAgICAgICAgICAgcGxheWluZ1Byb2dyZXNzSW50ZXJ2YWxUaW1lOiAxMDAwLFxuICAgICAgICAgICAgcGxheU5leHRPbkVuZGVkOiB0cnVlXG4gICAgICAgIH07XG5cbiAgICAgICAgbGV0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0T3B0aW9ucywgcGxheWVyT3B0aW9ucyk7XG5cbiAgICAgICAgdGhpcy5fdm9sdW1lID0gb3B0aW9ucy52b2x1bWU7XG4gICAgICAgIHRoaXMuX3NvdW5kc0Jhc2VVcmwgPSBvcHRpb25zLnNvdW5kc0Jhc2VVcmw7XG4gICAgICAgIHRoaXMuX3F1ZXVlID0gW107XG4gICAgICAgIHRoaXMuX2N1cnJlbnRJbmRleCA9IDA7XG4gICAgICAgIHRoaXMuX3BsYXlpbmdQcm9ncmVzc0ludGVydmFsVGltZSA9IG9wdGlvbnMucGxheWluZ1Byb2dyZXNzSW50ZXJ2YWxUaW1lO1xuICAgICAgICB0aGlzLl9wbGF5TmV4dE9uRW5kZWQgPSBvcHRpb25zLnBsYXlOZXh0T25FbmRlZDtcbiAgICAgICAgdGhpcy5fbG9vcFF1ZXVlID0gb3B0aW9ucy5sb29wUXVldWU7XG5cbiAgICAgICAgdGhpcy5faW5pdGlhbGl6ZSgpO1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9pbml0aWFsaXplKCkge1xuXG4gICAgICAgIC8vIFRPRE86IGNoZWNrIGlmIHdlYiBhdWRpbyBhcGkgaXMgYXZhaWxhYmxlXG4gICAgICAgIGxldCB3ZWJBdWRpb0FwaSA9IHRydWU7XG5cbiAgICAgICAgLy8gaXMgdGhlIHdlYiBhdWRpbyBhcGkgc3VwcG9ydGVkXG4gICAgICAgIC8vIGlmIG5vdCB3ZSB3aWxsIHVzZSB0aGUgYXVkaW8gZWxlbWVudCBhcyBmYWxsYmFja1xuICAgICAgICBpZiAod2ViQXVkaW9BcGkpIHtcblxuICAgICAgICAgICAgdGhpcy5faXNXZWJBdWRpb0FwaVN1cHBvcnRlZCA9IHRydWU7XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgLy8gdXNlIHRoZSBodG1sNSBhdWRpbyBlbGVtZW50XG4gICAgICAgICAgICB0aGlzLl9pc1dlYkF1ZGlvQXBpU3VwcG9ydGVkID0gZmFsc2U7XG5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHBsYXllciBhdWRpbyBsaWJyYXJ5IGluc3RhbmNlXG4gICAgICAgIHRoaXMuX3BsYXllckF1ZGlvID0gbmV3IFBsYXllckF1ZGlvKCk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgYWRkU291bmRUb1F1ZXVlKHNvdW5kQXR0cmlidXRlczogSVNvdW5kQXR0cmlidXRlcywgd2hlcmVJblF1ZXVlOiBzdHJpbmcgPSB0aGlzLldIRVJFX0lOX1FVRVVFX0FUX0VORCk6IElTb3VuZCB7XG5cbiAgICAgICAgbGV0IHNvdW5kOiBJU291bmQgPSBuZXcgUGxheWVyU291bmQoc291bmRBdHRyaWJ1dGVzKTtcblxuICAgICAgICAvLyBUT0RPOiBpcyBxdWV1ZSBqdXN0IGFuIGFycmF5IG9mIHNvdW5kcywgb3IgZG8gd2UgbmVlZCBzb21ldGhpbmcgbW9yZSBjb21wbGV4IHdpdGggYSBwb3NpdGlvbiB0cmFja2VyP1xuXG4gICAgICAgIC8vIFRPRE86IGFsbG93IGFycmF5IG9mIHNvdW5kQXR0cmlidXRlcyB0byBiZSBpbmplY3RlZCwgdG8gY3JlYXRlIHNldmVyYWwgYXQgb25jZSwgaWYgaW5wdXQgaXMgYW4gYXJyYXkgb3V0cHV0IHNob3VsZCBiZSB0b29cblxuICAgICAgICBzd2l0Y2ggKHdoZXJlSW5RdWV1ZSkge1xuICAgICAgICAgICAgY2FzZSB0aGlzLldIRVJFX0lOX1FVRVVFX0FUX0VORDpcbiAgICAgICAgICAgICAgICB0aGlzLl9hcHBlbmRTb3VuZFRvUXVldWUoc291bmQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSB0aGlzLldIRVJFX0lOX1FVRVVFX0FUX1NUQVJUOlxuICAgICAgICAgICAgICAgIHRoaXMuX3ByZXBlbmRTb3VuZFRvUXVldWUoc291bmQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSB0aGlzLldIRVJFX0lOX1FVRVVFX0FGVEVSX0NVUlJFTlQ6XG4gICAgICAgICAgICAgICAgdGhpcy5fcHJlcGVuZFNvdW5kVG9RdWV1ZShzb3VuZCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc291bmQ7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgX2FwcGVuZFNvdW5kVG9RdWV1ZShzb3VuZDogSVNvdW5kKTogdm9pZCB7XG5cbiAgICAgICAgdGhpcy5fcXVldWUucHVzaChzb3VuZCk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgX3ByZXBlbmRTb3VuZFRvUXVldWUoc291bmQ6IElTb3VuZCk6IHZvaWQge1xuXG4gICAgICAgIHRoaXMuX3F1ZXVlLnVuc2hpZnQoc291bmQpO1xuXG4gICAgfVxuXG4gICAgcHVibGljIF9hZGRTb3VuZFRvUXVldWVBZnRlckN1cnJlbnQoc291bmQ6IElTb3VuZCk6IHZvaWQge1xuXG4gICAgICAgIC8vIFRPRE86IGFkZCBvcHRpb24gdG8gcGxheSBhZnRlciBiZWluZyBhZGRlZCBvciB1c2VyIHVzZXMgcGxheSBtZXRob2Q/XG5cbiAgICAgICAgLy8gaWYgdGhlcmUgaXMgbm8gY3VycmVudCBzb25nIHlldCwgYXBwZW5kIHRoZSBzb25nIHRvIHRoZSBxdWV1ZVxuICAgICAgICBpZiAodGhpcy5fY3VycmVudEluZGV4ID09PSBudWxsKSB7XG5cbiAgICAgICAgICAgIHRoaXMuX2FwcGVuZFNvdW5kVG9RdWV1ZShzb3VuZCk7XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgbGV0IGFmdGVyQ3VycmVudEluZGV4ID0gdGhpcy5fY3VycmVudEluZGV4ICsgMTtcblxuICAgICAgICAgICAgdGhpcy5fcXVldWUuc3BsaWNlKGFmdGVyQ3VycmVudEluZGV4LCAwLCBzb3VuZCk7XG5cbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgcHVibGljIHJlc2V0UXVldWUoKSB7XG5cbiAgICAgICAgdGhpcy5fcXVldWUgPSBbXTtcblxuICAgICAgICAvLyBUT0RPOiBjaGVjayBpZiBhIHNvbmcgaXMgZ2V0dGluZyBwbGF5ZWQgYW5kIHN0b3AgaXQ/XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0UXVldWUoKSB7XG5cbiAgICAgICAgLy8gVE9ETzogaXMgdGhlIG5lZWRlZD9cblxuICAgICAgICByZXR1cm4gdGhpcy5fcXVldWU7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0Vm9sdW1lKHZvbHVtZTogbnVtYmVyKTogdm9pZCB7XG5cbiAgICAgICAgdGhpcy5fdm9sdW1lID0gdm9sdW1lO1xuXG4gICAgICAgIHRoaXMuX3BsYXllckF1ZGlvLmNoYW5nZUdhaW5WYWx1ZSh2b2x1bWUpO1xuXG4gICAgfVxuXG4gICAgcHVibGljIGdldFZvbHVtZSgpOiBudW1iZXIge1xuXG4gICAgICAgIHJldHVybiB0aGlzLl92b2x1bWU7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgbXV0ZSgpIHtcblxuICAgICAgICB0aGlzLnNldFZvbHVtZSgwKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBzZXRQb3NpdGlvbihzb3VuZFBvc2l0aW9uSW5QZXJjZW50OiBudW1iZXIpOiB2b2lkIHtcblxuICAgICAgICAvLyBnZXQgdGhlIGN1cnJlbnQgc291bmQgaWYgYW55XG4gICAgICAgIGxldCBjdXJyZW50U291bmQgPSB0aGlzLl9nZXRTb3VuZEZyb21RdWV1ZSgpO1xuXG4gICAgICAgIC8vIGlmIHRoZXJlIGlzIGEgc291bmQgY3VycmVudGx5IGJlaW5nIHBsYXllZFxuICAgICAgICBpZiAoY3VycmVudFNvdW5kICE9PSBudWxsICYmIGN1cnJlbnRTb3VuZC5pc1BsYXlpbmcpIHtcblxuICAgICAgICAgICAgLy8gc3RvcCB0aGUgdHJhY2sgcGxheWJhY2tcbiAgICAgICAgICAgIHRoaXMucGF1c2UoKTtcblxuICAgICAgICAgICAgbGV0IHNvdW5kUG9zaXRpb25JblNlY29uZHMgPSAoY3VycmVudFNvdW5kLmR1cmF0aW9uIC8gMTAwKSAqIHNvdW5kUG9zaXRpb25JblBlcmNlbnQ7XG5cbiAgICAgICAgICAgIC8vIHN0YXJ0IHRoZSBwbGF5YmFjayBhdCB0aGUgZ2l2ZW4gcG9zaXRpb25cbiAgICAgICAgICAgIHRoaXMucGxheShjdXJyZW50U291bmQuaWQsIHNvdW5kUG9zaXRpb25JblNlY29uZHMpO1xuXG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfbG9hZFNvdW5kKHNvdW5kOiBJU291bmQpOiBQcm9taXNlPElTb3VuZCB8IFBsYXllckVycm9yPiB7XG5cbiAgICAgICAgLy8gVE9ETzogd291bGQgYmUgZ29vZCB0byBjYWNoZSBidWZmZXJzLCBzbyBuZWVkIHRvIGNoZWNrIGlmIGlzIGluIGNhY2hlXG4gICAgICAgIC8vIGxldCB0aGUgdXNlciBjaG9vc2UgKGJ5IHNldHRpbmcgYW4gb3B0aW9uKSB3aGF0IGFtb3VudCBvZiBzb3VuZHMgd2lsbCBiZSBjYWNoZWRcbiAgICAgICAgLy8gYWRkIGEgY2FjaGVkIGRhdGUgLyB0aW1lc3RhbXAgdG8gYmUgYWJsZSB0byBjbGVhciBjYWNoZSBieSBvbGRlc3QgZmlyc3RcbiAgICAgICAgLy8gb3IgZXZlbiBiZXR0ZXIgYWRkIGEgcGxheWVkIGNvdW50ZXIgdG8gY2FjaGUgYnkgbGVhc3QgcGxheWVkIGFuZCBkYXRlXG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICAgICAgLy8gaWYgdGhlIHNvdW5kIGFscmVhZHkgaGFzIGFuIEF1ZGlvQnVmZmVyXG4gICAgICAgICAgICBpZiAoc291bmQuYXVkaW9CdWZmZXIgIT09IG51bGwpIHtcblxuICAgICAgICAgICAgICAgIHJlc29sdmUoc291bmQpO1xuXG4gICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgLy8gaWYgdGhlIHNvdW5kIGhhcyBhbHJlYWR5IGFuIEFycmF5QnVmZmVyIGJ1dCBubyBBdWRpb0J1ZmZlclxuICAgICAgICAgICAgaWYgKHNvdW5kLmFycmF5QnVmZmVyICE9PSBudWxsICYmIHNvdW5kLmF1ZGlvQnVmZmVyID09PSBudWxsKSB7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fZGVjb2RlU291bmQoc291bmQsIHJlc29sdmUsIHJlamVjdCk7XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gaWYgdGhlIHNvdW5kIGhhcyBubyBBcnJheUJ1ZmZlciBhbmQgYWxzbyBubyBBdWRpb0J1ZmZlciB5ZXRcbiAgICAgICAgICAgIGlmIChzb3VuZC5hcnJheUJ1ZmZlciA9PT0gbnVsbCAmJiBzb3VuZC5hdWRpb0J1ZmZlciA9PT0gbnVsbCkge1xuXG4gICAgICAgICAgICAgICAgaWYgKHNvdW5kLnVybCAhPT0gbnVsbCkge1xuXG4gICAgICAgICAgICAgICAgICAgIGxldCByZXF1ZXN0ID0gbmV3IFBsYXllclJlcXVlc3QoKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBjaGFuZ2UgYnVmZmVyaW5nIHN0YXRlXG4gICAgICAgICAgICAgICAgICAgIHNvdW5kLmlzQnVmZmVyaW5nID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0LmdldEFycmF5QnVmZmVyKHNvdW5kKS50aGVuKChhcnJheUJ1ZmZlcjogQXJyYXlCdWZmZXIpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgc291bmQuYXJyYXlCdWZmZXIgPSBhcnJheUJ1ZmZlcjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2RlY29kZVNvdW5kKHNvdW5kLCByZXNvbHZlLCByZWplY3QpO1xuXG4gICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKChyZXF1ZXN0RXJyb3I6IElQbGF5ZXJFcnJvcikgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QocmVxdWVzdEVycm9yKTtcblxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAgICAgbGV0IG5vVXJsRXJyb3IgPSBuZXcgUGxheWVyRXJyb3IoJ3NvdW5kIGhhcyBubyB1cmwnLCAxKTtcblxuICAgICAgICAgICAgICAgICAgICByZWplY3Qobm9VcmxFcnJvcik7XG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KTtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfZGVjb2RlU291bmQoc291bmQ6IElTb3VuZCwgcmVzb2x2ZTogRnVuY3Rpb24sIHJlamVjdDogRnVuY3Rpb24pIHtcblxuICAgICAgICBsZXQgYXJyYXlCdWZmZXIgPSBzb3VuZC5hcnJheUJ1ZmZlcjtcblxuICAgICAgICB0aGlzLl9wbGF5ZXJBdWRpby5kZWNvZGVBdWRpbyhhcnJheUJ1ZmZlcikudGhlbigoYXVkaW9CdWZmZXI6IEF1ZGlvQnVmZmVyKSA9PiB7XG5cbiAgICAgICAgICAgIHNvdW5kLmF1ZGlvQnVmZmVyID0gYXVkaW9CdWZmZXI7XG4gICAgICAgICAgICBzb3VuZC5pc0J1ZmZlcmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgc291bmQuaXNCdWZmZXJlZCA9IHRydWU7XG4gICAgICAgICAgICBzb3VuZC5hdWRpb0J1ZmZlckRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgc291bmQuZHVyYXRpb24gPSBzb3VuZC5hdWRpb0J1ZmZlci5kdXJhdGlvbjtcblxuICAgICAgICAgICAgcmVzb2x2ZShzb3VuZCk7XG5cbiAgICAgICAgfSkuY2F0Y2goKGRlY29kZUF1ZGlvRXJyb3I6IElQbGF5ZXJFcnJvcikgPT4ge1xuXG4gICAgICAgICAgICByZWplY3QoZGVjb2RlQXVkaW9FcnJvcik7XG5cbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgcGxheSh3aGljaFNvdW5kPzogbnVtYmVyIHwgc3RyaW5nIHwgdW5kZWZpbmVkLCBwbGF5VGltZU9mZnNldD86IG51bWJlcik6IHZvaWQge1xuXG4gICAgICAgIC8vIFRPRE86IGNoZWNrIHRoZSBhdmFpbGFibGUgY29kZWNzIGFuZCBkZWZpbmVkIHNvdXJjZXMsIHBsYXkgdGhlIGZpcnN0IG9uZSB0aGF0IGhhcyBtYXRjaGVzIGFuZCBhdmFpbGFibGUgY29kZWNcbiAgICAgICAgLy8gVE9ETzogbGV0IHVzZXIgZGVmaW5lIG9yZGVyIG9mIHByZWZlcnJlZCBjb2RlY3MgZm9yIHBsYXllcmJhY2tcblxuICAgICAgICAvLyBnZXQgdGhlIGN1cnJlbnQgc291bmQgaWYgYW55XG4gICAgICAgIGxldCBjdXJyZW50U291bmQgPSB0aGlzLl9nZXRTb3VuZEZyb21RdWV1ZSgpO1xuXG4gICAgICAgIC8vIGlmIHRoZXJlIGlzIGEgc291bmQgY3VycmVudGx5IGJlaW5nIHBsYXllZFxuICAgICAgICBpZiAoY3VycmVudFNvdW5kICE9PSBudWxsICYmIGN1cnJlbnRTb3VuZC5pc1BsYXlpbmcpIHtcblxuICAgICAgICAgICAgLy8gc3RvcCB0aGUgY3VycmVudCBzb3VuZFxuICAgICAgICAgICAgdGhpcy5zdG9wKCk7XG5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHdoaWNoU291bmQgaXMgb3B0aW9uYWwsIGlmIHNldCBpdCBjYW4gYmUgdGhlIHNvdW5kIGlkIG9yIGlmIGl0J3MgYSBzdHJpbmcgaXQgY2FuIGJlIG5leHQgLyBwcmV2aW91cyAvIGZpcnN0IC8gbGFzdFxuICAgICAgICBsZXQgc291bmQgPSB0aGlzLl9nZXRTb3VuZEZyb21RdWV1ZSh3aGljaFNvdW5kKTtcblxuICAgICAgICAvLyBpZiB0aGVyZSBpcyBubyBzb3VuZCB3ZSBjb3VsZCBwbGF5LCBkbyBub3RoaW5nXG4gICAgICAgIGlmIChzb3VuZCA9PT0gbnVsbCkge1xuXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgICAgIC8vIFRPRE86IHRocm93IGFuIGVycm9yP1xuXG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiB0aGUgdXNlciB3YW50cyB0byBwbGF5IHRoZSBzb3VuZCBmcm9tIGEgY2VydGFpbiBwb3NpdGlvblxuICAgICAgICBpZiAocGxheVRpbWVPZmZzZXQgIT09IHVuZGVmaW5lZCkge1xuXG4gICAgICAgICAgICBzb3VuZC5wbGF5VGltZU9mZnNldCA9IHBsYXlUaW1lT2Zmc2V0O1xuXG4gICAgICAgIH1cblxuICAgICAgICAvLyBoYXMgdGhlIHNvdW5kIGFscmVhZHkgYmVlbiBsb2FkZWQ/XG4gICAgICAgIGlmICghc291bmQuaXNCdWZmZXJlZCkge1xuXG4gICAgICAgICAgICAvLyBleHRyYWN0IHRoZSB1cmwgYW5kIGNvZGVjIGZyb20gc291cmNlc1xuICAgICAgICAgICAgbGV0IHsgdXJsLCBjb2RlYyA9IG51bGwgfSA9IHRoaXMuX3NvdXJjZVRvVmFyaWFibGVzKHNvdW5kLnNvdXJjZXMpO1xuXG4gICAgICAgICAgICBzb3VuZC51cmwgPSB1cmw7XG4gICAgICAgICAgICBzb3VuZC5jb2RlYyA9IGNvZGVjO1xuXG4gICAgICAgICAgICB0aGlzLl9sb2FkU291bmQoc291bmQpLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fcGxheShzb3VuZCk7XG5cbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnJvcikgPT4ge1xuXG4gICAgICAgICAgICAgICAgLy8gVE9ETzogaGFuZGxlIGVycm9yXG5cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgIHRoaXMuX3BsYXkoc291bmQpO1xuXG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfcGxheShzb3VuZDogSVNvdW5kKSB7XG5cbiAgICAgICAgLy8gc291cmNlIG5vZGUgb3B0aW9uc1xuICAgICAgICBsZXQgc291cmNlTm9kZU9wdGlvbnMgPSB7XG4gICAgICAgICAgICBsb29wOiBzb3VuZC5sb29wLFxuICAgICAgICAgICAgb25FbmRlZDogKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuX29uRW5kZWQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvLyBjcmVhdGUgYSBuZXcgc291cmNlIG5vZGVcbiAgICAgICAgdGhpcy5fcGxheWVyQXVkaW8uY3JlYXRlU291cmNlTm9kZShzb3VyY2VOb2RlT3B0aW9ucykudGhlbigoc291cmNlTm9kZSkgPT4ge1xuXG4gICAgICAgICAgICBzb3VuZC5pc1BsYXlpbmcgPSB0cnVlO1xuICAgICAgICAgICAgc291bmQuc291cmNlTm9kZSA9IHNvdXJjZU5vZGU7XG5cbiAgICAgICAgICAgIC8vIGFkZCB0aGUgYnVmZmVyIHRvIHRoZSBzb3VyY2Ugbm9kZVxuICAgICAgICAgICAgc291cmNlTm9kZS5idWZmZXIgPSBzb3VuZC5hdWRpb0J1ZmZlcjtcblxuICAgICAgICAgICAgLy8gdGhlIGF1ZGlvY29udGV4dCB0aW1lIHJpZ2h0IG5vdyAoc2luY2UgdGhlIGF1ZGlvY29udGV4dCBnb3QgY3JlYXRlZClcbiAgICAgICAgICAgIHNvdW5kLnN0YXJ0VGltZSA9IHNvdXJjZU5vZGUuY29udGV4dC5jdXJyZW50VGltZTtcblxuICAgICAgICAgICAgLy8gY29ubmVjdCB0aGUgc291cmNlIHRvIHRoZSBncmFwaCAoZGVzdGluYXRpb24pXG4gICAgICAgICAgICB0aGlzLl9wbGF5ZXJBdWRpby5jb25uZWN0U291cmNlTm9kZVRvR3JhcGgoc291cmNlTm9kZSk7XG5cbiAgICAgICAgICAgIC8vIHN0YXJ0IHBsYXliYWNrXG4gICAgICAgICAgICAvLyBzdGFydCh3aGVuLCBvZmZzZXQsIGR1cmF0aW9uKVxuICAgICAgICAgICAgc291cmNlTm9kZS5zdGFydCgwLCBzb3VuZC5wbGF5VGltZU9mZnNldCk7XG5cbiAgICAgICAgICAgIGlmIChzb3VuZC5vblBsYXlpbmcgIT09IG51bGwpIHtcblxuICAgICAgICAgICAgICAgIC8vIGF0IGludGVydmFsIHNldCBwbGF5aW5nIHByb2dyZXNzXG4gICAgICAgICAgICAgICAgdGhpcy5fcGxheWluZ1RpbWVvdXRJRCA9IHNldEludGVydmFsKCgpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wbGF5aW5nUHJvZ3Jlc3Moc291bmQpO1xuXG4gICAgICAgICAgICAgICAgfSwgdGhpcy5fcGxheWluZ1Byb2dyZXNzSW50ZXJ2YWxUaW1lKTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgIHRoaXMuX3BsYXlpbmdUaW1lb3V0SUQgPSBudWxsO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG5cbiAgICAgICAgICAgIC8vIFRPRE86IGhhbmRsZSBlcnJvclxuXG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9vbkVuZGVkKCkge1xuXG4gICAgICAgIC8vIGdldCB0aGUgY3VycmVudCBzb3VuZCBpZiBhbnlcbiAgICAgICAgbGV0IGN1cnJlbnRTb3VuZCA9IHRoaXMuX2dldFNvdW5kRnJvbVF1ZXVlKCk7XG5cbiAgICAgICAgLy8gaWYgdGhlcmUgaXMgYSBzb3VuZCBjdXJyZW50bHkgYmVpbmcgcGxheWVkXG4gICAgICAgIGlmIChjdXJyZW50U291bmQgIT09IG51bGwgJiYgY3VycmVudFNvdW5kLmlzUGxheWluZykge1xuXG4gICAgICAgICAgICBsZXQgdXBkYXRlSW5kZXggPSBmYWxzZTtcblxuICAgICAgICAgICAgbGV0IG5leHRTb3VuZCA9IHRoaXMuX2dldFNvdW5kRnJvbVF1ZXVlKCduZXh0JywgdXBkYXRlSW5kZXgpO1xuXG4gICAgICAgICAgICBpZiAoY3VycmVudFNvdW5kLm9uRW5kZWQgIT09IG51bGwpIHtcblxuICAgICAgICAgICAgICAgIGxldCB3aWxsUGxheU5leHQgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgIC8vIGNoZWNrIGlmIHRoZXJlIGlzIGFub3RoZXIgc291bmQgaW4gdGhlIHF1ZXVlIGFuZCBpZiBwbGF5aW5nXG4gICAgICAgICAgICAgICAgLy8gdGhlIG5leHQgb25lIG9uIGVuZGVkIGlzIGFjdGl2YXRlZFxuICAgICAgICAgICAgICAgIGlmIChuZXh0U291bmQgIT09IG51bGwgJiYgdGhpcy5fcGxheU5leHRPbkVuZGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHdpbGxQbGF5TmV4dCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY3VycmVudFNvdW5kLm9uRW5kZWQod2lsbFBsYXlOZXh0KTtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnN0b3AoKTtcblxuICAgICAgICAgICAgaWYgKG5leHRTb3VuZCAhPT0gbnVsbCkge1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3BsYXlOZXh0T25FbmRlZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsYXkoJ25leHQnKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAvLyB3ZSByZWFjaGVkIHRoZSBlbmQgb2YgdGhlIHF1ZXVlIHNldCB0aGUgY3VycmVudEluZGV4IGJhY2sgdG8gemVyb1xuICAgICAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRJbmRleCA9IDA7XG5cbiAgICAgICAgICAgICAgICAvLyBpZiBxdWV1ZSBsb29wIGlzIGFjdGl2ZSB0aGVuIHBsYXlcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fbG9vcFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGxheSgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHdoaWNoU291bmQgaXMgb3B0aW9uYWwsIGlmIHNldCBpdCBjYW4gYmUgdGhlIHNvdW5kIGlkIG9yIGlmIGl0J3NcbiAgICAgKiBhIHN0cmluZyBpdCBjYW4gYmUgbmV4dCAvIHByZXZpb3VzIC8gZmlyc3QgLyBsYXN0XG4gICAgICogXG4gICAgICogQHBhcmFtIHdoaWNoU291bmRcbiAgICAgKiBcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgX2dldFNvdW5kRnJvbVF1ZXVlKHdoaWNoU291bmQ/OiBzdHJpbmcgfCBudW1iZXIsIHVwZGF0ZUluZGV4OiBib29sZWFuID0gdHJ1ZSk6IElTb3VuZCB8IG51bGwge1xuXG4gICAgICAgIGxldCBzb3VuZCA9IG51bGw7XG5cbiAgICAgICAgLy8gY2hlY2sgaWYgdGhlIHF1ZXVlIGlzIGVtcHR5XG4gICAgICAgIGlmICh0aGlzLl9xdWV1ZS5sZW5ndGggPT09IDApIHtcblxuICAgICAgICAgICAgcmV0dXJuIHNvdW5kO1xuXG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiB3aGljaCBzb25nIHRvIHBsYXkgZGlkIG5vdCBnZXQgc3BlY2lmaWVkLCBwbGF5IG9uZSBiYXNlZCBmcm9tIHRoZSBxdWV1ZSBiYXNlZCBvbiB0aGUgcXVldWUgaW5kZXggcG9zaXRpb24gbWFya2VyXG4gICAgICAgIGlmICh3aGljaFNvdW5kID09PSB1bmRlZmluZWQgJiYgdGhpcy5fcXVldWVbdGhpcy5fY3VycmVudEluZGV4XSAhPT0gdW5kZWZpbmVkKSB7XG5cbiAgICAgICAgICAgIHNvdW5kID0gdGhpcy5fcXVldWVbdGhpcy5fY3VycmVudEluZGV4XTtcblxuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB3aGljaFNvdW5kID09PSAnbnVtYmVyJykge1xuXG4gICAgICAgICAgICAvLyBpZiB3aGljaCBzb25nIHRvIHBsYXkgaXMgYSBudW1lcmljIElEXG4gICAgICAgICAgICBzb3VuZCA9IHRoaXMuX2ZpbmRTb3VuZEJ5SWQod2hpY2hTb3VuZCwgdXBkYXRlSW5kZXgpO1xuXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgIGxldCBzb3VuZEluZGV4OiBudW1iZXIgfCBudWxsID0gbnVsbDtcblxuICAgICAgICAgICAgLy8gaWYgd2hpY2ggc29uZyB0byBwbGF5IGlzIGEgY29uc3RhbnRcbiAgICAgICAgICAgIHN3aXRjaCAod2hpY2hTb3VuZCkge1xuICAgICAgICAgICAgICAgIGNhc2UgdGhpcy5QTEFZX1NPVU5EX05FWFQ6XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9xdWV1ZVt0aGlzLl9jdXJyZW50SW5kZXggKyAxXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VuZEluZGV4ID0gdGhpcy5fY3VycmVudEluZGV4ICsgMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdW5kID0gdGhpcy5fcXVldWVbc291bmRJbmRleF07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSB0aGlzLlBMQVlfU09VTkRfUFJFVklPVVM6XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9xdWV1ZVt0aGlzLl9jdXJyZW50SW5kZXggLSAxXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VuZEluZGV4ID0gdGhpcy5fY3VycmVudEluZGV4IC0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdW5kID0gdGhpcy5fcXVldWVbc291bmRJbmRleF07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSB0aGlzLlBMQVlfU09VTkRfRklSU1Q6XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9xdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VuZEluZGV4ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdW5kID0gdGhpcy5fcXVldWVbc291bmRJbmRleF07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSB0aGlzLlBMQVlfU09VTkRfTEFTVDpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX3F1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdW5kSW5kZXggPSB0aGlzLl9xdWV1ZS5sZW5ndGggLSAyO1xuICAgICAgICAgICAgICAgICAgICAgICAgc291bmQgPSB0aGlzLl9xdWV1ZVtzb3VuZEluZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAvLyBpZiB3aGljaCBzb25nIHRvIHBsYXkgaXMgYSBzdHJpbmcgSURcbiAgICAgICAgICAgICAgICAgICAgc291bmQgPSB0aGlzLl9maW5kU291bmRCeUlkKHdoaWNoU291bmQsIHVwZGF0ZUluZGV4KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHNvdW5kSW5kZXggIT09IG51bGwgJiYgdXBkYXRlSW5kZXgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9jdXJyZW50SW5kZXggPSBzb3VuZEluZGV4O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc291bmQ7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX2ZpbmRTb3VuZEJ5SWQoc291bmRJZDogc3RyaW5nIHwgbnVtYmVyLCB1cGRhdGVJbmRleDogYm9vbGVhbik6IElTb3VuZCB8IG51bGwge1xuXG4gICAgICAgIGxldCBzb3VuZCA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5fcXVldWUuc29tZSgoc291bmRGcm9tUXVldWU6IElTb3VuZCwgcXVldWVJbmRleDogbnVtYmVyKSA9PiB7XG5cbiAgICAgICAgICAgIGlmIChzb3VuZEZyb21RdWV1ZS5pZCA9PT0gc291bmRJZCkge1xuXG4gICAgICAgICAgICAgICAgc291bmQgPSBzb3VuZEZyb21RdWV1ZTtcblxuICAgICAgICAgICAgICAgIGlmICh1cGRhdGVJbmRleCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jdXJyZW50SW5kZXggPSBxdWV1ZUluZGV4O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHNvdW5kO1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9zb3VyY2VUb1ZhcmlhYmxlcyhzb3VyY2VzOiAoSVNvdW5kU291cmNlIHwgc3RyaW5nKVtdKTogeyB1cmw6IHN0cmluZyB8IG51bGwsIGNvZGVjPzogc3RyaW5nIHwgbnVsbCB9IHtcblxuICAgICAgICAvLyBUT0RPOiBzb3VyY2UgY2FuIGJlIG9uIG9iamVjdCB3aGVyZSB0aGUgcHJvcGVydHkgbmFtZSBpcyB0aGUgY29kZWMgYW5kIHRoZSB2YWx1ZSBpcyB0aGUgc291bmQgdXJsXG4gICAgICAgIC8vIGlmIHNvdW5kIGlzbnQgYW4gb2JqZWN0IHRyeSB0byBkZXRlY3Qgc291bmQgc291cmNlIGV4dGVuc2lvbiBieSBmaWxlIGV4dGVudGlvbiBvciBieSBjaGVja2luZyB0aGUgZmlsZSBtaW1lIHR5cGVcblxuICAgICAgICAvLyBUT0RPOiBnZXQgYSBsaXN0IG9mIHN1cHBvcnRlZCBjb2RlY3MgYnkgdGhpcyBkZXZpY2VcblxuICAgICAgICBsZXQgZmlyc3RNYXRjaGluZ1NvdXJjZTogeyB1cmw6IHN0cmluZyB8IG51bGwsIGNvZGVjPzogc3RyaW5nIHwgbnVsbCB9ID0ge1xuICAgICAgICAgICAgdXJsOiBudWxsLFxuICAgICAgICAgICAgY29kZWM6IG51bGxcbiAgICAgICAgfTtcblxuICAgICAgICBzb3VyY2VzLmZvckVhY2goKHNvdXJjZSkgPT4ge1xuXG4gICAgICAgICAgICAvLyBUT0RPOiBmaW5kIG91dCB3aGF0IHRoZSBzb3VyY2UgY29kZWMgaXNcblxuICAgICAgICAgICAgLy8gVE9ETzogY2hlY2sgaWYgdGhlIHNvdXJjZSBjb2RlYyBpcyBhbW9uZyB0aGUgb25lcyB0aGF0IGFyZSBzdXBwb3J0ZWQgYnkgdGhpcyBkZXZpY2VcblxuICAgICAgICAgICAgbGV0IHNvdW5kVXJsID0gJyc7XG5cbiAgICAgICAgICAgIC8vIGlmIHRoZSBwbGF5ZXIgaGFkIGFzIG9wdGlvbiBhIGJhc2VVcmwgZm9yIHNvdW5kcyBhZGQgaXQgbm93XG4gICAgICAgICAgICBpZiAodGhpcy5fc291bmRzQmFzZVVybCAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICBzb3VuZFVybCA9IHRoaXMuX3NvdW5kc0Jhc2VVcmw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHR3byBraW5kIG9mIHNvdXJjZSBhcmUgcG9zc2libGUsIGEgc3RyaW5nICh0aGUgdXJsKSBvciBhbiBvYmplY3QgKGtleSBpcyB0aGUgY29kZWMgYW5kIHZhbHVlIGlzIHRoZSB1cmwpXG4gICAgICAgICAgICBpZiAodHlwZW9mIHNvdXJjZSA9PT0gJ3N0cmluZycpIHtcblxuICAgICAgICAgICAgICAgIHNvdW5kVXJsICs9IHNvdXJjZTtcblxuICAgICAgICAgICAgICAgIGZpcnN0TWF0Y2hpbmdTb3VyY2UgPSB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogc291bmRVcmxcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgc291bmRVcmwgKz0gc291cmNlLnVybDtcblxuICAgICAgICAgICAgICAgIGZpcnN0TWF0Y2hpbmdTb3VyY2UgPSB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogc291bmRVcmwsXG4gICAgICAgICAgICAgICAgICAgIGNvZGVjOiBzb3VyY2UuY29kZWNcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGZpcnN0TWF0Y2hpbmdTb3VyY2U7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgcGF1c2UoKSB7XG5cbiAgICAgICAgLy8gZ2V0IHRoZSBjdXJyZW50IHNvdW5kXG4gICAgICAgIGxldCBzb3VuZDogSVNvdW5kIHwgbnVsbCA9IHRoaXMuX2dldFNvdW5kRnJvbVF1ZXVlKCk7XG5cbiAgICAgICAgaWYgKHNvdW5kID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgdGltZUF0UGF1c2UgPSBzb3VuZC5zb3VyY2VOb2RlLmNvbnRleHQuY3VycmVudFRpbWU7XG5cbiAgICAgICAgc291bmQucGxheVRpbWVPZmZzZXQgKz0gdGltZUF0UGF1c2UgLSBzb3VuZC5zdGFydFRpbWU7XG5cbiAgICAgICAgdGhpcy5fc3RvcChzb3VuZCk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgc3RvcCgpIHtcblxuICAgICAgICAvLyBnZXQgdGhlIGN1cnJlbnQgc291bmRcbiAgICAgICAgbGV0IHNvdW5kOiBJU291bmQgfCBudWxsID0gdGhpcy5fZ2V0U291bmRGcm9tUXVldWUoKTtcblxuICAgICAgICBpZiAoc291bmQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHNvdW5kLnBsYXlUaW1lT2Zmc2V0ID0gMDtcblxuICAgICAgICB0aGlzLl9zdG9wKHNvdW5kKTtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfc3RvcChzb3VuZDogSVNvdW5kKSB7XG5cbiAgICAgICAgLy8gdGVsbCB0aGUgc291cmNlTm9kZSB0byBzdG9wIHBsYXlpbmdcbiAgICAgICAgc291bmQuc291cmNlTm9kZS5zdG9wKDApO1xuXG4gICAgICAgIC8vIHRlbGwgdGhlIHNvdW5kIHRoYXQgcGxheWluZyBpcyBvdmVyXG4gICAgICAgIHNvdW5kLmlzUGxheWluZyA9IGZhbHNlO1xuXG4gICAgICAgIC8vIGRlc3Ryb3kgdGhlIHNvdXJjZSBub2RlIGFzIGl0IGNhbiBhbnl3YXkgb25seSBnZXQgdXNlZCBvbmNlXG4gICAgICAgIHRoaXMuX3BsYXllckF1ZGlvLmRlc3Ryb3lTb3VyY2VOb2RlKHNvdW5kLnNvdXJjZU5vZGUpO1xuXG4gICAgICAgIHNvdW5kLnNvdXJjZU5vZGUgPSBudWxsO1xuXG4gICAgICAgIGlmICh0aGlzLl9wbGF5aW5nVGltZW91dElEICE9PSBudWxsKSB7XG5cbiAgICAgICAgICAgIC8vIGNsZWFyIHRoZSBwbGF5aW5nIHByb2dyZXNzIHNldEludGVydmFsXG4gICAgICAgICAgICBjbGVhckludGVydmFsKHRoaXMuX3BsYXlpbmdUaW1lb3V0SUQpO1xuXG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHB1YmxpYyBuZXh0KCkge1xuXG4gICAgICAgIC8vIGFsaWFzIGZvciBwbGF5IG5leHRcbiAgICAgICAgdGhpcy5wbGF5KCduZXh0Jyk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgcHJldmlvdXMoKSB7XG5cbiAgICAgICAgLy8gYWxpYXMgZm9yIHBsYXkgcHJldmlvdXNcbiAgICAgICAgdGhpcy5wbGF5KCdwcmV2aW91cycpO1xuXG4gICAgfVxuXG4gICAgcHVibGljIGZpcnN0KCkge1xuXG4gICAgICAgIC8vIGFsaWFzIGZvciBwbGF5IGZpcnN0XG4gICAgICAgIHRoaXMucGxheSgnZmlyc3QnKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBsYXN0KCkge1xuXG4gICAgICAgIC8vIGFsaWFzIGZvciBwbGF5IGxhc3RcbiAgICAgICAgdGhpcy5wbGF5KCdsYXN0Jyk7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX3BsYXlpbmdQcm9ncmVzcyhzb3VuZDogSVNvdW5kKSB7XG5cbiAgICAgICAgbGV0IHRpbWVOb3cgPSBzb3VuZC5zb3VyY2VOb2RlLmNvbnRleHQuY3VycmVudFRpbWU7XG5cbiAgICAgICAgc291bmQucGxheVRpbWUgPSAodGltZU5vdyAtIHNvdW5kLnN0YXJ0VGltZSkgKyBzb3VuZC5wbGF5VGltZU9mZnNldDtcblxuICAgICAgICBsZXQgcGxheWluZ1BlcmNlbnRhZ2UgPSAoc291bmQucGxheVRpbWUgLyBzb3VuZC5hdWRpb0J1ZmZlci5kdXJhdGlvbikgKiAxMDA7XG5cbiAgICAgICAgc291bmQucGxheWVkVGltZVBlcmNlbnRhZ2UgPSBwbGF5aW5nUGVyY2VudGFnZTtcblxuICAgICAgICBzb3VuZC5vblBsYXlpbmcocGxheWluZ1BlcmNlbnRhZ2UsIHNvdW5kLmF1ZGlvQnVmZmVyLmR1cmF0aW9uLCBzb3VuZC5wbGF5VGltZSk7XG5cbiAgICB9O1xuXG59XG4iXX0=

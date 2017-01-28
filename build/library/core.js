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
                playingProgressIntervalTime: 1000
            };
            var options = Object.assign({}, defaultOptions, playerOptions);
            this._volume = options.volume;
            this._soundsBaseUrl = options.soundsBaseUrl;
            this._queue = [];
            this._currentIndex = 0;
            this._playingProgressIntervalTime = options.playingProgressIntervalTime;
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
        PlayerCore.prototype.setProgress = function (progress) {
            this._progress = progress;
        };
        PlayerCore.prototype.getProgress = function () {
            return this._progress;
        };
        PlayerCore.prototype._loadSound = function (sound) {
            // TODO: would be good to cache buffers, so need to check if is in cache
            // let the user choose (by setting an option) what amount of sounds will be cached
            // add a cached date / timestamp to be able to clear cache by oldest first
            // or even better add a played counter to cache by least played and date
            var _this = this;
            return new Promise(function (resolve, reject) {
                // if the sound already has an AudioBuffer
                if (sound.audioBuffer === null) {
                    resolve(sound);
                }
                // if the sound has already an ArrayBuffer but no AudioBuffer
                if (sound.arrayBuffer !== null && sound.audioBuffer === null) {
                    _this._decodeSound(sound, resolve, reject);
                }
                // if the sound has no ArrayBuffer and also no AudioBuffer yet
                if (sound.arrayBuffer === null && sound.audioBuffer === null) {
                    if (sound.url !== null) {
                        var request = new request_1.PlayerRequest();
                        // change buffering state
                        sound.isBuffering = true;
                        request.getArrayBuffer(sound).then(function (arrayBuffer) {
                            sound.arrayBuffer = arrayBuffer;
                            _this._decodeSound(sound, resolve, reject);
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
            // get the current song if any
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
                loop: sound.loop
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
        /**
         * whichSound is optional, if set it can be the sound id or if it's a string it can be next / previous / first / last
         * @param whichSound
         */
        PlayerCore.prototype._getSoundFromQueue = function (whichSound) {
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
                sound = this._findSoundById(whichSound);
            }
            else {
                // if which song to play is a constant
                switch (whichSound) {
                    case this.PLAY_SOUND_NEXT:
                        if (this._queue[this._currentIndex + 1] !== undefined) {
                            this._currentIndex = this._currentIndex + 1;
                            sound = this._queue[this._currentIndex];
                        }
                        break;
                    case this.PLAY_SOUND_PREVIOUS:
                        if (this._queue[this._currentIndex - 1] !== undefined) {
                            this._currentIndex = this._currentIndex - 1;
                            sound = this._queue[this._currentIndex];
                        }
                        break;
                    case this.PLAY_SOUND_FIRST:
                        if (this._queue.length > 0) {
                            this._currentIndex = 0;
                            sound = this._queue[this._currentIndex];
                        }
                        break;
                    case this.PLAY_SOUND_LAST:
                        if (this._queue.length > 0) {
                            this._currentIndex = this._queue.length - 1;
                            sound = this._queue[this._currentIndex];
                        }
                        break;
                    default:
                        // if which song to play is a string ID
                        sound = this._findSoundById(whichSound);
                }
            }
            return sound;
        };
        PlayerCore.prototype._findSoundById = function (soundId) {
            var _this = this;
            var sound = null;
            this._queue.some(function (soundFromQueue, queueIndex) {
                if (soundFromQueue.id === soundId) {
                    sound = soundFromQueue;
                    _this._currentIndex = queueIndex;
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9saWJyYXJ5L2NvcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7SUFDQSxZQUFZLENBQUM7SUFFYixpQ0FBOEU7SUFDOUUsaUNBQXNDO0lBQ3RDLHFDQUEwQztJQUMxQyxpQ0FBb0Q7SUFTcEQ7UUFvQ0ksb0JBQVksYUFBMkI7WUFWdkMsWUFBWTtZQUNILDBCQUFxQixHQUFXLFFBQVEsQ0FBQztZQUN6Qyw0QkFBdUIsR0FBVyxTQUFTLENBQUM7WUFDNUMsaUNBQTRCLEdBQVcsY0FBYyxDQUFDO1lBRXRELG9CQUFlLEdBQUcsTUFBTSxDQUFDO1lBQ3pCLHdCQUFtQixHQUFHLFVBQVUsQ0FBQztZQUNqQyxxQkFBZ0IsR0FBRyxPQUFPLENBQUM7WUFDM0Isb0JBQWUsR0FBRyxNQUFNLENBQUM7WUFJOUIsSUFBSSxjQUFjLEdBQUc7Z0JBQ2pCLE1BQU0sRUFBRSxFQUFFO2dCQUNWLFNBQVMsRUFBRSxLQUFLO2dCQUNoQixhQUFhLEVBQUUsRUFBRTtnQkFDakIsMkJBQTJCLEVBQUUsSUFBSTthQUNwQyxDQUFDO1lBRUYsSUFBSSxPQUFPLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsY0FBYyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBRS9ELElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztZQUM5QixJQUFJLENBQUMsY0FBYyxHQUFHLE9BQU8sQ0FBQyxhQUFhLENBQUM7WUFDNUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7WUFDakIsSUFBSSxDQUFDLGFBQWEsR0FBRyxDQUFDLENBQUM7WUFDdkIsSUFBSSxDQUFDLDRCQUE0QixHQUFHLE9BQU8sQ0FBQywyQkFBMkIsQ0FBQztZQUV4RSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFFdkIsQ0FBQztRQUVTLGdDQUFXLEdBQXJCO1lBRUksNENBQTRDO1lBQzVDLElBQUksV0FBVyxHQUFHLElBQUksQ0FBQztZQUV2QixpQ0FB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QyxvQkFBb0IsR0FBRyxpQkFBaUIsQ0FBQztZQUUvQyxLQUFLLENBQUMsU0FBUyxDQUFDLGlCQUFpQixFQUFFLEtBQUssQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUVuRixDQUFDO1FBQUEsQ0FBQztRQWlETixpQkFBQztJQUFELENBanBCQSxBQWlwQkMsSUFBQTtJQWpwQlksZ0NBQVUiLCJmaWxlIjoibGlicmFyeS9jb3JlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IFBsYXllclNvdW5kLCBJU291bmQsIElTb3VuZEF0dHJpYnV0ZXMsIElTb3VuZFNvdXJjZSB9IGZyb20gJy4vc291bmQnO1xuaW1wb3J0IHsgUGxheWVyQXVkaW8gfSBmcm9tICcuL2F1ZGlvJztcbmltcG9ydCB7IFBsYXllclJlcXVlc3QgfSBmcm9tICcuL3JlcXVlc3QnO1xuaW1wb3J0IHsgUGxheWVyRXJyb3IsIElQbGF5ZXJFcnJvciB9IGZyb20gJy4vZXJyb3InO1xuXG5leHBvcnQgaW50ZXJmYWNlIElDb3JlT3B0aW9ucyB7XG4gICAgdm9sdW1lPzogbnVtYmVyO1xuICAgIGxvb3BRdWV1ZT86IGJvb2xlYW47XG4gICAgc291bmRzQmFzZVVybD86IHN0cmluZztcbiAgICBwbGF5aW5nUHJvZ3Jlc3NJbnRlcnZhbFRpbWU/OiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBQbGF5ZXJDb3JlIHtcblxuICAgIC8vIGlzIHRoZSB3ZWIgYXVkaW8gQVBJIHN1cHBvcnRlZFxuICAgIHByb3RlY3RlZCBfaXNXZWJBdWRpb0FwaVN1cHBvcnRlZDogYm9vbGVhbjtcbiAgICAvLyB0aGUgc291bmRzIHF1ZXVlXG4gICAgcHJvdGVjdGVkIF9xdWV1ZTogSVNvdW5kW107XG4gICAgLy8gdGhlIHZvbHVtZSAoMCB0byAxMDApXG4gICAgcHJvdGVjdGVkIF92b2x1bWU6IG51bWJlcjtcbiAgICAvLyB0aGUgcHJvZ3Jlc3MgKHNvbmcgcGxheSB0aW1lKVxuICAgIHByb3RlY3RlZCBfcHJvZ3Jlc3M6IG51bWJlcjtcbiAgICAvLyB0aGUgYmFzZSB1cmwgdGhhdCBhbGwgc291bmRzIHdpbGwgaGF2ZSBpbiBjb21tb25cbiAgICBwcm90ZWN0ZWQgX3NvdW5kc0Jhc2VVcmw6IHN0cmluZztcbiAgICAvLyB0aGUgY3VycmVudCBzb3VuZCBpbiBxdWV1ZSBpbmRleFxuICAgIHByb3RlY3RlZCBfY3VycmVudEluZGV4OiBudW1iZXI7XG4gICAgLy8gaW5zdGFuY2Ugb2YgdGhlIGF1ZGlvIGxpYnJhcnkgY2xhc3NcbiAgICBwcm90ZWN0ZWQgX3BsYXllckF1ZGlvOiBQbGF5ZXJBdWRpbztcbiAgICAvLyBwbGF5aW5nIHByb2dyZXNzIHRpbWUgaW50ZXJ2YWxcbiAgICBwcm90ZWN0ZWQgX3BsYXlpbmdQcm9ncmVzc0ludGVydmFsVGltZTogbnVtYmVyO1xuICAgIC8vIHBsYXlpbmcgcHJvZ3Jlc3MgdGltZW91dElEXG4gICAgcHJvdGVjdGVkIF9wbGF5aW5nVGltZW91dElEOiBudW1iZXIgfCBudWxsO1xuXG4gICAgLy8gY2FsbGJhY2sgaG9va3NcbiAgICBwdWJsaWMgb25QbGF5U3RhcnQ6ICgpID0+IHZvaWQ7XG4gICAgcHVibGljIG9uUGxheWluZzogKCkgPT4gdm9pZDtcbiAgICBwdWJsaWMgb25CdWZmZXJpbmc6ICgpID0+IHZvaWQ7XG5cbiAgICAvLyBjb25zdGFudHNcbiAgICByZWFkb25seSBXSEVSRV9JTl9RVUVVRV9BVF9FTkQ6IHN0cmluZyA9ICdhcHBlbmQnO1xuICAgIHJlYWRvbmx5IFdIRVJFX0lOX1FVRVVFX0FUX1NUQVJUOiBzdHJpbmcgPSAncHJlcGVuZCc7XG4gICAgcmVhZG9ubHkgV0hFUkVfSU5fUVVFVUVfQUZURVJfQ1VSUkVOVDogc3RyaW5nID0gJ2FmdGVyQ3VycmVudCc7XG5cbiAgICByZWFkb25seSBQTEFZX1NPVU5EX05FWFQgPSAnbmV4dCc7XG4gICAgcmVhZG9ubHkgUExBWV9TT1VORF9QUkVWSU9VUyA9ICdwcmV2aW91cyc7XG4gICAgcmVhZG9ubHkgUExBWV9TT1VORF9GSVJTVCA9ICdmaXJzdCc7XG4gICAgcmVhZG9ubHkgUExBWV9TT1VORF9MQVNUID0gJ2xhc3QnO1xuXG4gICAgY29uc3RydWN0b3IocGxheWVyT3B0aW9uczogSUNvcmVPcHRpb25zKSB7XG5cbiAgICAgICAgbGV0IGRlZmF1bHRPcHRpb25zID0ge1xuICAgICAgICAgICAgdm9sdW1lOiA4MCxcbiAgICAgICAgICAgIGxvb3BRdWV1ZTogZmFsc2UsXG4gICAgICAgICAgICBzb3VuZHNCYXNlVXJsOiAnJyxcbiAgICAgICAgICAgIHBsYXlpbmdQcm9ncmVzc0ludGVydmFsVGltZTogMTAwMFxuICAgICAgICB9O1xuXG4gICAgICAgIGxldCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdE9wdGlvbnMsIHBsYXllck9wdGlvbnMpO1xuXG4gICAgICAgIHRoaXMuX3ZvbHVtZSA9IG9wdGlvbnMudm9sdW1lO1xuICAgICAgICB0aGlzLl9zb3VuZHNCYXNlVXJsID0gb3B0aW9ucy5zb3VuZHNCYXNlVXJsO1xuICAgICAgICB0aGlzLl9xdWV1ZSA9IFtdO1xuICAgICAgICB0aGlzLl9jdXJyZW50SW5kZXggPSAwO1xuICAgICAgICB0aGlzLl9wbGF5aW5nUHJvZ3Jlc3NJbnRlcnZhbFRpbWUgPSBvcHRpb25zLnBsYXlpbmdQcm9ncmVzc0ludGVydmFsVGltZTtcblxuICAgICAgICB0aGlzLl9pbml0aWFsaXplKCk7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX2luaXRpYWxpemUoKSB7XG5cbiAgICAgICAgLy8gVE9ETzogY2hlY2sgaWYgd2ViIGF1ZGlvIGFwaSBpcyBhdmFpbGFibGVcbiAgICAgICAgbGV0IHdlYkF1ZGlvQXBpID0gdHJ1ZTtcblxuICAgICAgICAvLyBpcyB0aGUgd2ViIGF1ZGlvIGFwaSBzdXBwb3J0ZWRcbiAgICAgICAgLy8gaWYgbm90IHdlIHdpbGwgdXNlIHRoZSBhdWRpbyBlbGVtZW50IGFzIGZhbGxiYWNrXG4gICAgICAgIGlmICh3ZWJBdWRpb0FwaSkge1xuXG4gICAgICAgICAgICB0aGlzLl9pc1dlYkF1ZGlvQXBpU3VwcG9ydGVkID0gdHJ1ZTtcblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAvLyB1c2UgdGhlIGh0bWw1IGF1ZGlvIGVsZW1lbnRcbiAgICAgICAgICAgIHRoaXMuX2lzV2ViQXVkaW9BcGlTdXBwb3J0ZWQgPSBmYWxzZTtcblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gcGxheWVyIGF1ZGlvIGxpYnJhcnkgaW5zdGFuY2VcbiAgICAgICAgdGhpcy5fcGxheWVyQXVkaW8gPSBuZXcgUGxheWVyQXVkaW8oKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBhZGRTb3VuZFRvUXVldWUoc291bmRBdHRyaWJ1dGVzOiBJU291bmRBdHRyaWJ1dGVzLCB3aGVyZUluUXVldWU6IHN0cmluZyA9IHRoaXMuV0hFUkVfSU5fUVVFVUVfQVRfRU5EKTogSVNvdW5kIHtcblxuICAgICAgICBsZXQgc291bmQ6IElTb3VuZCA9IG5ldyBQbGF5ZXJTb3VuZChzb3VuZEF0dHJpYnV0ZXMpO1xuXG4gICAgICAgIC8vIFRPRE86IGlzIHF1ZXVlIGp1c3QgYW4gYXJyYXkgb2Ygc291bmRzLCBvciBkbyB3ZSBuZWVkIHNvbWV0aGluZyBtb3JlIGNvbXBsZXggd2l0aCBhIHBvc2l0aW9uIHRyYWNrZXI/XG5cbiAgICAgICAgLy8gVE9ETzogYWxsb3cgYXJyYXkgb2Ygc291bmRBdHRyaWJ1dGVzIHRvIGJlIGluamVjdGVkLCB0byBjcmVhdGUgc2V2ZXJhbCBhdCBvbmNlLCBpZiBpbnB1dCBpcyBhbiBhcnJheSBvdXRwdXQgc2hvdWxkIGJlIHRvb1xuXG4gICAgICAgIHN3aXRjaCAod2hlcmVJblF1ZXVlKSB7XG4gICAgICAgICAgICBjYXNlIHRoaXMuV0hFUkVfSU5fUVVFVUVfQVRfRU5EOlxuICAgICAgICAgICAgICAgIHRoaXMuX2FwcGVuZFNvdW5kVG9RdWV1ZShzb3VuZCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIHRoaXMuV0hFUkVfSU5fUVVFVUVfQVRfU1RBUlQ6XG4gICAgICAgICAgICAgICAgdGhpcy5fcHJlcGVuZFNvdW5kVG9RdWV1ZShzb3VuZCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIHRoaXMuV0hFUkVfSU5fUVVFVUVfQUZURVJfQ1VSUkVOVDpcbiAgICAgICAgICAgICAgICB0aGlzLl9wcmVwZW5kU291bmRUb1F1ZXVlKHNvdW5kKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzb3VuZDtcblxuICAgIH1cblxuICAgIHB1YmxpYyBfYXBwZW5kU291bmRUb1F1ZXVlKHNvdW5kOiBJU291bmQpOiB2b2lkIHtcblxuICAgICAgICB0aGlzLl9xdWV1ZS5wdXNoKHNvdW5kKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBfcHJlcGVuZFNvdW5kVG9RdWV1ZShzb3VuZDogSVNvdW5kKTogdm9pZCB7XG5cbiAgICAgICAgdGhpcy5fcXVldWUudW5zaGlmdChzb3VuZCk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgX2FkZFNvdW5kVG9RdWV1ZUFmdGVyQ3VycmVudChzb3VuZDogSVNvdW5kKTogdm9pZCB7XG5cbiAgICAgICAgLy8gVE9ETzogYWRkIG9wdGlvbiB0byBwbGF5IGFmdGVyIGJlaW5nIGFkZGVkIG9yIHVzZXIgdXNlcyBwbGF5IG1ldGhvZD9cblxuICAgICAgICAvLyBpZiB0aGVyZSBpcyBubyBjdXJyZW50IHNvbmcgeWV0LCBhcHBlbmQgdGhlIHNvbmcgdG8gdGhlIHF1ZXVlXG4gICAgICAgIGlmICh0aGlzLl9jdXJyZW50SW5kZXggPT09IG51bGwpIHtcblxuICAgICAgICAgICAgdGhpcy5fYXBwZW5kU291bmRUb1F1ZXVlKHNvdW5kKTtcblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICBsZXQgYWZ0ZXJDdXJyZW50SW5kZXggPSB0aGlzLl9jdXJyZW50SW5kZXggKyAxO1xuXG4gICAgICAgICAgICB0aGlzLl9xdWV1ZS5zcGxpY2UoYWZ0ZXJDdXJyZW50SW5kZXgsIDAsIHNvdW5kKTtcblxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgcmVzZXRRdWV1ZSgpIHtcblxuICAgICAgICB0aGlzLl9xdWV1ZSA9IFtdO1xuXG4gICAgICAgIC8vIFRPRE86IGNoZWNrIGlmIGEgc29uZyBpcyBnZXR0aW5nIHBsYXllZCBhbmQgc3RvcCBpdD9cblxuICAgIH1cblxuICAgIHB1YmxpYyBnZXRRdWV1ZSgpIHtcblxuICAgICAgICAvLyBUT0RPOiBpcyB0aGUgbmVlZGVkP1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9xdWV1ZTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBzZXRWb2x1bWUodm9sdW1lOiBudW1iZXIpOiB2b2lkIHtcblxuICAgICAgICB0aGlzLl92b2x1bWUgPSB2b2x1bWU7XG5cbiAgICAgICAgdGhpcy5fcGxheWVyQXVkaW8uY2hhbmdlR2FpblZhbHVlKHZvbHVtZSk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0Vm9sdW1lKCk6IG51bWJlciB7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX3ZvbHVtZTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBtdXRlKCkge1xuXG4gICAgICAgIHRoaXMuc2V0Vm9sdW1lKDApO1xuXG4gICAgfVxuXG4gICAgcHVibGljIHNldFByb2dyZXNzKHByb2dyZXNzOiBudW1iZXIpOiB2b2lkIHtcblxuICAgICAgICB0aGlzLl9wcm9ncmVzcyA9IHByb2dyZXNzO1xuXG4gICAgfVxuXG4gICAgcHVibGljIGdldFByb2dyZXNzKCk6IG51bWJlciB7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX3Byb2dyZXNzO1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9sb2FkU291bmQoc291bmQ6IElTb3VuZCk6IFByb21pc2U8SVNvdW5kIHwgUGxheWVyRXJyb3I+IHtcblxuICAgICAgICAvLyBUT0RPOiB3b3VsZCBiZSBnb29kIHRvIGNhY2hlIGJ1ZmZlcnMsIHNvIG5lZWQgdG8gY2hlY2sgaWYgaXMgaW4gY2FjaGVcbiAgICAgICAgLy8gbGV0IHRoZSB1c2VyIGNob29zZSAoYnkgc2V0dGluZyBhbiBvcHRpb24pIHdoYXQgYW1vdW50IG9mIHNvdW5kcyB3aWxsIGJlIGNhY2hlZFxuICAgICAgICAvLyBhZGQgYSBjYWNoZWQgZGF0ZSAvIHRpbWVzdGFtcCB0byBiZSBhYmxlIHRvIGNsZWFyIGNhY2hlIGJ5IG9sZGVzdCBmaXJzdFxuICAgICAgICAvLyBvciBldmVuIGJldHRlciBhZGQgYSBwbGF5ZWQgY291bnRlciB0byBjYWNoZSBieSBsZWFzdCBwbGF5ZWQgYW5kIGRhdGVcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgICAgICAvLyBpZiB0aGUgc291bmQgYWxyZWFkeSBoYXMgYW4gQXVkaW9CdWZmZXJcbiAgICAgICAgICAgIGlmIChzb3VuZC5hdWRpb0J1ZmZlciA9PT0gbnVsbCkge1xuXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShzb3VuZCk7XG5cbiAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICAvLyBpZiB0aGUgc291bmQgaGFzIGFscmVhZHkgYW4gQXJyYXlCdWZmZXIgYnV0IG5vIEF1ZGlvQnVmZmVyXG4gICAgICAgICAgICBpZiAoc291bmQuYXJyYXlCdWZmZXIgIT09IG51bGwgJiYgc291bmQuYXVkaW9CdWZmZXIgPT09IG51bGwpIHtcblxuICAgICAgICAgICAgICAgIHRoaXMuX2RlY29kZVNvdW5kKHNvdW5kLCByZXNvbHZlLCByZWplY3QpO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGlmIHRoZSBzb3VuZCBoYXMgbm8gQXJyYXlCdWZmZXIgYW5kIGFsc28gbm8gQXVkaW9CdWZmZXIgeWV0XG4gICAgICAgICAgICBpZiAoc291bmQuYXJyYXlCdWZmZXIgPT09IG51bGwgJiYgc291bmQuYXVkaW9CdWZmZXIgPT09IG51bGwpIHtcblxuICAgICAgICAgICAgICAgIGlmIChzb3VuZC51cmwgIT09IG51bGwpIHtcblxuICAgICAgICAgICAgICAgICAgICBsZXQgcmVxdWVzdCA9IG5ldyBQbGF5ZXJSZXF1ZXN0KCk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gY2hhbmdlIGJ1ZmZlcmluZyBzdGF0ZVxuICAgICAgICAgICAgICAgICAgICBzb3VuZC5pc0J1ZmZlcmluZyA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdC5nZXRBcnJheUJ1ZmZlcihzb3VuZCkudGhlbigoYXJyYXlCdWZmZXI6IEFycmF5QnVmZmVyKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdW5kLmFycmF5QnVmZmVyID0gYXJyYXlCdWZmZXI7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2RlY29kZVNvdW5kKHNvdW5kLCByZXNvbHZlLCByZWplY3QpO1xuXG4gICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKChyZXF1ZXN0RXJyb3I6IElQbGF5ZXJFcnJvcikgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QocmVxdWVzdEVycm9yKTtcblxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAgICAgbGV0IG5vVXJsRXJyb3IgPSBuZXcgUGxheWVyRXJyb3IoJ3NvdW5kIGhhcyBubyB1cmwnLCAxKTtcblxuICAgICAgICAgICAgICAgICAgICByZWplY3Qobm9VcmxFcnJvcik7XG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KTtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfZGVjb2RlU291bmQoc291bmQ6IElTb3VuZCwgcmVzb2x2ZTogRnVuY3Rpb24sIHJlamVjdDogRnVuY3Rpb24pIHtcblxuICAgICAgICBsZXQgYXJyYXlCdWZmZXIgPSBzb3VuZC5hcnJheUJ1ZmZlcjtcblxuICAgICAgICB0aGlzLl9wbGF5ZXJBdWRpby5kZWNvZGVBdWRpbyhhcnJheUJ1ZmZlcikudGhlbigoYXVkaW9CdWZmZXI6IEF1ZGlvQnVmZmVyKSA9PiB7XG5cbiAgICAgICAgICAgIHNvdW5kLmF1ZGlvQnVmZmVyID0gYXVkaW9CdWZmZXI7XG4gICAgICAgICAgICBzb3VuZC5pc0J1ZmZlcmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgc291bmQuaXNCdWZmZXJlZCA9IHRydWU7XG4gICAgICAgICAgICBzb3VuZC5hdWRpb0J1ZmZlckRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgc291bmQuZHVyYXRpb24gPSBzb3VuZC5hdWRpb0J1ZmZlci5kdXJhdGlvbjtcblxuICAgICAgICAgICAgcmVzb2x2ZShzb3VuZCk7XG5cbiAgICAgICAgfSkuY2F0Y2goKGRlY29kZUF1ZGlvRXJyb3I6IElQbGF5ZXJFcnJvcikgPT4ge1xuXG4gICAgICAgICAgICByZWplY3QoZGVjb2RlQXVkaW9FcnJvcik7XG5cbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgcGxheSh3aGljaFNvdW5kPzogbnVtYmVyIHwgc3RyaW5nIHwgdW5kZWZpbmVkLCBwbGF5VGltZU9mZnNldD86IG51bWJlcik6IHZvaWQge1xuXG4gICAgICAgIC8vIFRPRE86IGNoZWNrIHRoZSBhdmFpbGFibGUgY29kZWNzIGFuZCBkZWZpbmVkIHNvdXJjZXMsIHBsYXkgdGhlIGZpcnN0IG9uZSB0aGF0IGhhcyBtYXRjaGVzIGFuZCBhdmFpbGFibGUgY29kZWNcbiAgICAgICAgLy8gVE9ETzogbGV0IHVzZXIgZGVmaW5lIG9yZGVyIG9mIHByZWZlcnJlZCBjb2RlY3MgZm9yIHBsYXllcmJhY2tcblxuICAgICAgICAvLyBnZXQgdGhlIGN1cnJlbnQgc29uZyBpZiBhbnlcbiAgICAgICAgbGV0IGN1cnJlbnRTb3VuZCA9IHRoaXMuX2dldFNvdW5kRnJvbVF1ZXVlKCk7XG5cblxuICAgICAgICAvLyBpZiB0aGVyZSBpcyBhIHNvdW5kIGN1cnJlbnRseSBiZWluZyBwbGF5ZWRcbiAgICAgICAgaWYgKGN1cnJlbnRTb3VuZCAhPT0gbnVsbCAmJiBjdXJyZW50U291bmQuaXNQbGF5aW5nKSB7XG5cbiAgICAgICAgICAgIC8vIHN0b3AgdGhlIGN1cnJlbnQgc291bmRcbiAgICAgICAgICAgIHRoaXMuc3RvcCgpO1xuXG4gICAgICAgIH1cblxuICAgICAgICAvLyB3aGljaFNvdW5kIGlzIG9wdGlvbmFsLCBpZiBzZXQgaXQgY2FuIGJlIHRoZSBzb3VuZCBpZCBvciBpZiBpdCdzIGEgc3RyaW5nIGl0IGNhbiBiZSBuZXh0IC8gcHJldmlvdXMgLyBmaXJzdCAvIGxhc3RcbiAgICAgICAgbGV0IHNvdW5kID0gdGhpcy5fZ2V0U291bmRGcm9tUXVldWUod2hpY2hTb3VuZCk7XG5cbiAgICAgICAgLy8gaWYgdGhlcmUgaXMgbm8gc291bmQgd2UgY291bGQgcGxheSwgZG8gbm90aGluZ1xuICAgICAgICBpZiAoc291bmQgPT09IG51bGwpIHtcblxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgICAgICAvLyBUT0RPOiB0aHJvdyBhbiBlcnJvcj9cblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgdGhlIHVzZXIgd2FudHMgdG8gcGxheSB0aGUgc291bmQgZnJvbSBhIGNlcnRhaW4gcG9zaXRpb25cbiAgICAgICAgaWYgKHBsYXlUaW1lT2Zmc2V0ICE9PSB1bmRlZmluZWQpIHtcblxuICAgICAgICAgICAgc291bmQucGxheVRpbWVPZmZzZXQgPSBwbGF5VGltZU9mZnNldDtcblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gaGFzIHRoZSBzb3VuZCBhbHJlYWR5IGJlZW4gbG9hZGVkP1xuICAgICAgICBpZiAoIXNvdW5kLmlzQnVmZmVyZWQpIHtcblxuICAgICAgICAgICAgLy8gZXh0cmFjdCB0aGUgdXJsIGFuZCBjb2RlYyBmcm9tIHNvdXJjZXNcbiAgICAgICAgICAgIGxldCB7IHVybCwgY29kZWMgPSBudWxsIH0gPSB0aGlzLl9zb3VyY2VUb1ZhcmlhYmxlcyhzb3VuZC5zb3VyY2VzKTtcblxuICAgICAgICAgICAgc291bmQudXJsID0gdXJsO1xuICAgICAgICAgICAgc291bmQuY29kZWMgPSBjb2RlYztcblxuICAgICAgICAgICAgdGhpcy5fbG9hZFNvdW5kKHNvdW5kKS50aGVuKCgpID0+IHtcblxuICAgICAgICAgICAgICAgIHRoaXMuX3BsYXkoc291bmQpO1xuXG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyb3IpID0+IHtcblxuICAgICAgICAgICAgICAgIC8vIFRPRE86IGhhbmRsZSBlcnJvclxuXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICB0aGlzLl9wbGF5KHNvdW5kKTtcblxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX3BsYXkoc291bmQ6IElTb3VuZCkge1xuXG4gICAgICAgIC8vIHNvdXJjZSBub2RlIG9wdGlvbnNcbiAgICAgICAgbGV0IHNvdXJjZU5vZGVPcHRpb25zID0ge1xuICAgICAgICAgICAgbG9vcDogc291bmQubG9vcFxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGNyZWF0ZSBhIG5ldyBzb3VyY2Ugbm9kZVxuICAgICAgICB0aGlzLl9wbGF5ZXJBdWRpby5jcmVhdGVTb3VyY2VOb2RlKHNvdXJjZU5vZGVPcHRpb25zKS50aGVuKChzb3VyY2VOb2RlKSA9PiB7XG5cbiAgICAgICAgICAgIHNvdW5kLmlzUGxheWluZyA9IHRydWU7XG4gICAgICAgICAgICBzb3VuZC5zb3VyY2VOb2RlID0gc291cmNlTm9kZTtcblxuICAgICAgICAgICAgLy8gYWRkIHRoZSBidWZmZXIgdG8gdGhlIHNvdXJjZSBub2RlXG4gICAgICAgICAgICBzb3VyY2VOb2RlLmJ1ZmZlciA9IHNvdW5kLmF1ZGlvQnVmZmVyO1xuXG4gICAgICAgICAgICAvLyB0aGUgYXVkaW9jb250ZXh0IHRpbWUgcmlnaHQgbm93IChzaW5jZSB0aGUgYXVkaW9jb250ZXh0IGdvdCBjcmVhdGVkKVxuICAgICAgICAgICAgc291bmQuc3RhcnRUaW1lID0gc291cmNlTm9kZS5jb250ZXh0LmN1cnJlbnRUaW1lO1xuXG4gICAgICAgICAgICAvLyBjb25uZWN0IHRoZSBzb3VyY2UgdG8gdGhlIGdyYXBoIChkZXN0aW5hdGlvbilcbiAgICAgICAgICAgIHRoaXMuX3BsYXllckF1ZGlvLmNvbm5lY3RTb3VyY2VOb2RlVG9HcmFwaChzb3VyY2VOb2RlKTtcblxuICAgICAgICAgICAgLy8gc3RhcnQgcGxheWJhY2tcbiAgICAgICAgICAgIC8vIHN0YXJ0KHdoZW4sIG9mZnNldCwgZHVyYXRpb24pXG4gICAgICAgICAgICBzb3VyY2VOb2RlLnN0YXJ0KDAsIHNvdW5kLnBsYXlUaW1lT2Zmc2V0KTtcblxuICAgICAgICAgICAgaWYgKHNvdW5kLm9uUGxheWluZyAhPT0gbnVsbCkge1xuXG4gICAgICAgICAgICAgICAgLy8gYXQgaW50ZXJ2YWwgc2V0IHBsYXlpbmcgcHJvZ3Jlc3NcbiAgICAgICAgICAgICAgICB0aGlzLl9wbGF5aW5nVGltZW91dElEID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3BsYXlpbmdQcm9ncmVzcyhzb3VuZCk7XG5cbiAgICAgICAgICAgICAgICB9LCB0aGlzLl9wbGF5aW5nUHJvZ3Jlc3NJbnRlcnZhbFRpbWUpO1xuXG4gICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fcGxheWluZ1RpbWVvdXRJRCA9IG51bGw7XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KS5jYXRjaCgoZXJyb3IpID0+IHtcblxuICAgICAgICAgICAgLy8gVE9ETzogaGFuZGxlIGVycm9yXG5cbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiB3aGljaFNvdW5kIGlzIG9wdGlvbmFsLCBpZiBzZXQgaXQgY2FuIGJlIHRoZSBzb3VuZCBpZCBvciBpZiBpdCdzIGEgc3RyaW5nIGl0IGNhbiBiZSBuZXh0IC8gcHJldmlvdXMgLyBmaXJzdCAvIGxhc3RcbiAgICAgKiBAcGFyYW0gd2hpY2hTb3VuZFxuICAgICAqL1xuICAgIHByb3RlY3RlZCBfZ2V0U291bmRGcm9tUXVldWUod2hpY2hTb3VuZD86IHN0cmluZyB8IG51bWJlcik6IElTb3VuZCB8IG51bGwge1xuXG4gICAgICAgIGxldCBzb3VuZCA9IG51bGw7XG5cbiAgICAgICAgLy8gY2hlY2sgaWYgdGhlIHF1ZXVlIGlzIGVtcHR5XG4gICAgICAgIGlmICh0aGlzLl9xdWV1ZS5sZW5ndGggPT09IDApIHtcblxuICAgICAgICAgICAgcmV0dXJuIHNvdW5kO1xuXG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiB3aGljaCBzb25nIHRvIHBsYXkgZGlkIG5vdCBnZXQgc3BlY2lmaWVkLCBwbGF5IG9uZSBiYXNlZCBmcm9tIHRoZSBxdWV1ZSBiYXNlZCBvbiB0aGUgcXVldWUgaW5kZXggcG9zaXRpb24gbWFya2VyXG4gICAgICAgIGlmICh3aGljaFNvdW5kID09PSB1bmRlZmluZWQgJiYgdGhpcy5fcXVldWVbdGhpcy5fY3VycmVudEluZGV4XSAhPT0gdW5kZWZpbmVkKSB7XG5cbiAgICAgICAgICAgIHNvdW5kID0gdGhpcy5fcXVldWVbdGhpcy5fY3VycmVudEluZGV4XTtcblxuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB3aGljaFNvdW5kID09PSAnbnVtYmVyJykge1xuXG4gICAgICAgICAgICAvLyBpZiB3aGljaCBzb25nIHRvIHBsYXkgaXMgYSBudW1lcmljIElEXG4gICAgICAgICAgICBzb3VuZCA9IHRoaXMuX2ZpbmRTb3VuZEJ5SWQod2hpY2hTb3VuZCk7XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgLy8gaWYgd2hpY2ggc29uZyB0byBwbGF5IGlzIGEgY29uc3RhbnRcbiAgICAgICAgICAgIHN3aXRjaCAod2hpY2hTb3VuZCkge1xuICAgICAgICAgICAgICAgIGNhc2UgdGhpcy5QTEFZX1NPVU5EX05FWFQ6XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9xdWV1ZVt0aGlzLl9jdXJyZW50SW5kZXggKyAxXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9jdXJyZW50SW5kZXggPSB0aGlzLl9jdXJyZW50SW5kZXggKyAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgc291bmQgPSB0aGlzLl9xdWV1ZVt0aGlzLl9jdXJyZW50SW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgdGhpcy5QTEFZX1NPVU5EX1BSRVZJT1VTOlxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fcXVldWVbdGhpcy5fY3VycmVudEluZGV4IC0gMV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fY3VycmVudEluZGV4ID0gdGhpcy5fY3VycmVudEluZGV4IC0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdW5kID0gdGhpcy5fcXVldWVbdGhpcy5fY3VycmVudEluZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIHRoaXMuUExBWV9TT1VORF9GSVJTVDpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX3F1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRJbmRleCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VuZCA9IHRoaXMuX3F1ZXVlW3RoaXMuX2N1cnJlbnRJbmRleF07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSB0aGlzLlBMQVlfU09VTkRfTEFTVDpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX3F1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRJbmRleCA9IHRoaXMuX3F1ZXVlLmxlbmd0aCAtIDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VuZCA9IHRoaXMuX3F1ZXVlW3RoaXMuX2N1cnJlbnRJbmRleF07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgd2hpY2ggc29uZyB0byBwbGF5IGlzIGEgc3RyaW5nIElEXG4gICAgICAgICAgICAgICAgICAgIHNvdW5kID0gdGhpcy5fZmluZFNvdW5kQnlJZCh3aGljaFNvdW5kKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHNvdW5kO1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9maW5kU291bmRCeUlkKHNvdW5kSWQ6IHN0cmluZyB8IG51bWJlcik6IElTb3VuZCB8IG51bGwge1xuXG4gICAgICAgIGxldCBzb3VuZCA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5fcXVldWUuc29tZSgoc291bmRGcm9tUXVldWU6IElTb3VuZCwgcXVldWVJbmRleDogbnVtYmVyKSA9PiB7XG5cbiAgICAgICAgICAgIGlmIChzb3VuZEZyb21RdWV1ZS5pZCA9PT0gc291bmRJZCkge1xuXG4gICAgICAgICAgICAgICAgc291bmQgPSBzb3VuZEZyb21RdWV1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLl9jdXJyZW50SW5kZXggPSBxdWV1ZUluZGV4O1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gc291bmQ7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX3NvdXJjZVRvVmFyaWFibGVzKHNvdXJjZXM6IChJU291bmRTb3VyY2UgfCBzdHJpbmcpW10pOiB7IHVybDogc3RyaW5nIHwgbnVsbCwgY29kZWM/OiBzdHJpbmcgfCBudWxsIH0ge1xuXG4gICAgICAgIC8vIFRPRE86IHNvdXJjZSBjYW4gYmUgb24gb2JqZWN0IHdoZXJlIHRoZSBwcm9wZXJ0eSBuYW1lIGlzIHRoZSBjb2RlYyBhbmQgdGhlIHZhbHVlIGlzIHRoZSBzb3VuZCB1cmxcbiAgICAgICAgLy8gaWYgc291bmQgaXNudCBhbiBvYmplY3QgdHJ5IHRvIGRldGVjdCBzb3VuZCBzb3VyY2UgZXh0ZW5zaW9uIGJ5IGZpbGUgZXh0ZW50aW9uIG9yIGJ5IGNoZWNraW5nIHRoZSBmaWxlIG1pbWUgdHlwZVxuXG4gICAgICAgIC8vIFRPRE86IGdldCBhIGxpc3Qgb2Ygc3VwcG9ydGVkIGNvZGVjcyBieSB0aGlzIGRldmljZVxuXG4gICAgICAgIGxldCBmaXJzdE1hdGNoaW5nU291cmNlOiB7IHVybDogc3RyaW5nIHwgbnVsbCwgY29kZWM/OiBzdHJpbmcgfCBudWxsIH0gPSB7XG4gICAgICAgICAgICB1cmw6IG51bGwsXG4gICAgICAgICAgICBjb2RlYzogbnVsbFxuICAgICAgICB9O1xuXG4gICAgICAgIHNvdXJjZXMuZm9yRWFjaCgoc291cmNlKSA9PiB7XG5cbiAgICAgICAgICAgIC8vIFRPRE86IGZpbmQgb3V0IHdoYXQgdGhlIHNvdXJjZSBjb2RlYyBpc1xuXG4gICAgICAgICAgICAvLyBUT0RPOiBjaGVjayBpZiB0aGUgc291cmNlIGNvZGVjIGlzIGFtb25nIHRoZSBvbmVzIHRoYXQgYXJlIHN1cHBvcnRlZCBieSB0aGlzIGRldmljZVxuICAgICAgICAgICAgLy9pZiAoKSB7XG5cbiAgICAgICAgICAgIGxldCBzb3VuZFVybCA9ICcnO1xuXG4gICAgICAgICAgICAvLyBpZiB0aGUgcGxheWVyIGhhZCBhcyBvcHRpb24gYSBiYXNlVXJsIGZvciBzb3VuZHMgYWRkIGl0IG5vd1xuICAgICAgICAgICAgaWYgKHRoaXMuX3NvdW5kc0Jhc2VVcmwgIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgc291bmRVcmwgPSB0aGlzLl9zb3VuZHNCYXNlVXJsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyB0d28ga2luZCBvZiBzb3VyY2UgYXJlIHBvc3NpYmxlLCBhIHN0cmluZyAodGhlIHVybCkgb3IgYW4gb2JqZWN0IChrZXkgaXMgdGhlIGNvZGVjIGFuZCB2YWx1ZSBpcyB0aGUgdXJsKVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBzb3VyY2UgPT09ICdzdHJpbmcnKSB7XG5cbiAgICAgICAgICAgICAgICBzb3VuZFVybCArPSBzb3VyY2U7XG5cbiAgICAgICAgICAgICAgICBmaXJzdE1hdGNoaW5nU291cmNlID0ge1xuICAgICAgICAgICAgICAgICAgICB1cmw6IHNvdW5kVXJsXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgIHNvdW5kVXJsICs9IHNvdXJjZS51cmw7XG5cbiAgICAgICAgICAgICAgICBmaXJzdE1hdGNoaW5nU291cmNlID0ge1xuICAgICAgICAgICAgICAgICAgICB1cmw6IHNvdW5kVXJsLFxuICAgICAgICAgICAgICAgICAgICBjb2RlYzogc291cmNlLmNvZGVjXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBmaXJzdE1hdGNoaW5nU291cmNlO1xuXG4gICAgfVxuXG4gICAgcHVibGljIHBhdXNlKCkge1xuXG4gICAgICAgIC8vIGdldCB0aGUgY3VycmVudCBzb3VuZFxuICAgICAgICBsZXQgc291bmQ6IElTb3VuZCB8IG51bGwgPSB0aGlzLl9nZXRTb3VuZEZyb21RdWV1ZSgpO1xuXG4gICAgICAgIGlmIChzb3VuZCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHRpbWVBdFBhdXNlID0gc291bmQuc291cmNlTm9kZS5jb250ZXh0LmN1cnJlbnRUaW1lO1xuXG4gICAgICAgIHNvdW5kLnBsYXlUaW1lT2Zmc2V0ICs9IHRpbWVBdFBhdXNlIC0gc291bmQuc3RhcnRUaW1lO1xuXG4gICAgICAgIHRoaXMuX3N0b3Aoc291bmQpO1xuXG4gICAgfVxuXG4gICAgcHVibGljIHN0b3AoKSB7XG5cbiAgICAgICAgLy8gZ2V0IHRoZSBjdXJyZW50IHNvdW5kXG4gICAgICAgIGxldCBzb3VuZDogSVNvdW5kIHwgbnVsbCA9IHRoaXMuX2dldFNvdW5kRnJvbVF1ZXVlKCk7XG5cbiAgICAgICAgaWYgKHNvdW5kID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBzb3VuZC5wbGF5VGltZU9mZnNldCA9IDA7XG5cbiAgICAgICAgdGhpcy5fc3RvcChzb3VuZCk7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX3N0b3Aoc291bmQ6IElTb3VuZCkge1xuXG4gICAgICAgIC8vIHRlbGwgdGhlIHNvdXJjZU5vZGUgdG8gc3RvcCBwbGF5aW5nXG4gICAgICAgIHNvdW5kLnNvdXJjZU5vZGUuc3RvcCgwKTtcblxuICAgICAgICAvLyB0ZWxsIHRoZSBzb3VuZCB0aGF0IHBsYXlpbmcgaXMgb3ZlclxuICAgICAgICBzb3VuZC5pc1BsYXlpbmcgPSBmYWxzZTtcblxuICAgICAgICAvLyBkZXN0cm95IHRoZSBzb3VyY2Ugbm9kZSBhcyBpdCBjYW4gYW55d2F5IG9ubHkgZ2V0IHVzZWQgb25jZVxuICAgICAgICB0aGlzLl9wbGF5ZXJBdWRpby5kZXN0cm95U291cmNlTm9kZShzb3VuZC5zb3VyY2VOb2RlKTtcblxuICAgICAgICBzb3VuZC5zb3VyY2VOb2RlID0gbnVsbDtcblxuICAgICAgICBpZiAodGhpcy5fcGxheWluZ1RpbWVvdXRJRCAhPT0gbnVsbCkge1xuXG4gICAgICAgICAgICAvLyBjbGVhciB0aGUgcGxheWluZyBwcm9ncmVzcyBzZXRJbnRlcnZhbFxuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLl9wbGF5aW5nVGltZW91dElEKTtcblxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgbmV4dCgpIHtcblxuICAgICAgICAvLyBhbGlhcyBmb3IgcGxheSBuZXh0XG4gICAgICAgIHRoaXMucGxheSgnbmV4dCcpO1xuXG4gICAgfVxuXG4gICAgcHVibGljIHByZXZpb3VzKCkge1xuXG4gICAgICAgIC8vIGFsaWFzIGZvciBwbGF5IHByZXZpb3VzXG4gICAgICAgIHRoaXMucGxheSgncHJldmlvdXMnKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBmaXJzdCgpIHtcblxuICAgICAgICAvLyBhbGlhcyBmb3IgcGxheSBmaXJzdFxuICAgICAgICB0aGlzLnBsYXkoJ2ZpcnN0Jyk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgbGFzdCgpIHtcblxuICAgICAgICAvLyBhbGlhcyBmb3IgcGxheSBsYXN0XG4gICAgICAgIHRoaXMucGxheSgnbGFzdCcpO1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9wbGF5aW5nUHJvZ3Jlc3Moc291bmQ6IElTb3VuZCkge1xuXG4gICAgICAgIGxldCB0aW1lTm93ID0gc291bmQuc291cmNlTm9kZS5jb250ZXh0LmN1cnJlbnRUaW1lO1xuXG4gICAgICAgIHNvdW5kLnBsYXlUaW1lID0gKHRpbWVOb3cgLSBzb3VuZC5zdGFydFRpbWUpICsgc291bmQucGxheVRpbWVPZmZzZXQ7XG5cbiAgICAgICAgbGV0IHBsYXlpbmdQZXJjZW50YWdlID0gKHNvdW5kLnBsYXlUaW1lIC8gc291bmQuYXVkaW9CdWZmZXIuZHVyYXRpb24pICogMTAwO1xuXG4gICAgICAgIHNvdW5kLnBsYXllZFRpbWVQZXJjZW50YWdlID0gcGxheWluZ1BlcmNlbnRhZ2U7XG5cbiAgICAgICAgc291bmQub25QbGF5aW5nKHBsYXlpbmdQZXJjZW50YWdlLCBzb3VuZC5hdWRpb0J1ZmZlci5kdXJhdGlvbiwgc291bmQucGxheVRpbWUpO1xuXG4gICAgfTtcblxuLypcblxuICAgIHBsYXllci5wcm90b3R5cGUucG9zaXRpb25DaGFuZ2UgPSBmdW5jdGlvbiBwb3NpdGlvbkNoYW5nZUZ1bmN0aW9uKHRyYWNrUG9zaXRpb25JblBlcmNlbnQpIHtcbiAgICAgICAgXG4gICAgICAgIC8vIHN0b3AgdGhlIHRyYWNrIHBsYXliYWNrXG4gICAgICAgIHRoaXMuc3RvcCgpO1xuXG4gICAgICAgIGxldCB0cmFja1Bvc2l0aW9uSW5TZWNvbmRzID0gKHRoaXMudHJhY2suYnVmZmVyLmR1cmF0aW9uIC8gMTAwKSAqIHRyYWNrUG9zaXRpb25JblBlcmNlbnQ7XG5cbiAgICAgICAgdGhpcy50cmFjay5wbGF5VGltZU9mZnNldCA9IHRyYWNrUG9zaXRpb25JblNlY29uZHM7XG5cbiAgICAgICAgLy8gc3RhcnQgdGhlIHBsYXliYWNrIGF0IHRoZSBnaXZlbiBwb3NpdGlvblxuICAgICAgICB0aGlzLnBsYXkoKTtcblxuICAgIH07XG5cbiAgICAqL1xuXG4gICAgLypcblxuICAgICAgICAgICAgLy8gaWYgdGhlIHBsYXllciBpcyBhdCB0aGUgZW5kIG9mIHRoZSB0cmFja1xuICAgICAgICBpZiAoc291bmQucGxheVRpbWUgPj0gc291bmQuYXVkaW9CdWZmZXIuZHVyYXRpb24pIHtcblxuICAgICAgICAgICAgdGhpcy5zdG9wKCk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmxvb3BUcmFjaykge1xuXG4gICAgICAgICAgICAgICAgdGhpcy5wbGF5KCk7XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy50cmFjay5wbGF5bGlzdElkICE9PSBudWxsKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ldmVudHMudHJpZ2dlcihcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZXZlbnRzLmNvbnN0YW50cy5QTEFZTElTVF9ORVhULFxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYWNrOiB0aGlzLnRyYWNrXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG4gICAgKi9cblxufVxuIl19

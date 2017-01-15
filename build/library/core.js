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
                            resolve(sound);
                        }).catch(function (decodeAudioError) {
                            reject(decodeAudioError);
                        });
                    }).catch(function (requestError) {
                        reject(requestError);
                    });
                }
                else {
                    var noUrlError = new error_1.PlayerError('sound has no url', 1);
                    reject(noUrlError);
                }
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
                // add the buffer to the source node
                sourceNode.buffer = sound.audioBuffer;
                // the audiocontext time right now (since the audiocontext got created)
                sound.startTime = sourceNode.context.currentTime;
                // connect the source to the graph (destination)
                _this._playerAudio.connectSourceNodeToGraph(sourceNode);
                // start playback
                // start(when, offset, duration)
                sourceNode.start(0, sound.playTimeOffset);
                sound.isPlaying = true;
                sound.sourceNode = sourceNode;
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
            sound.sourceNode.stop(0);
            sound.isPlaying = false;
            this._playerAudio.destroySourceNode(sound.sourceNode);
            sound.sourceNode = null;
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
        return PlayerCore;
    }());
    exports.PlayerCore = PlayerCore;
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9saWJyYXJ5L2NvcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7SUFDQSxZQUFZLENBQUM7SUFFYixpQ0FBOEU7SUFDOUUsaUNBQXNDO0lBQ3RDLHFDQUEwQztJQUMxQyxpQ0FBb0Q7SUFRcEQ7UUFnQ0ksb0JBQVksYUFBMkI7WUFWdkMsWUFBWTtZQUNILDBCQUFxQixHQUFXLFFBQVEsQ0FBQztZQUN6Qyw0QkFBdUIsR0FBVyxTQUFTLENBQUM7WUFDNUMsaUNBQTRCLEdBQVcsY0FBYyxDQUFDO1lBRXRELG9CQUFlLEdBQUcsTUFBTSxDQUFDO1lBQ3pCLHdCQUFtQixHQUFHLFVBQVUsQ0FBQztZQUNqQyxxQkFBZ0IsR0FBRyxPQUFPLENBQUM7WUFDM0Isb0JBQWUsR0FBRyxNQUFNLENBQUM7WUFJOUIsSUFBSSxjQUFjLEdBQUc7Z0JBQ2pCLE1BQU0sRUFBRSxFQUFFO2dCQUNWLFNBQVMsRUFBRSxLQUFLO2dCQUNoQixhQUFhLEVBQUUsRUFBRTthQUNwQixDQUFDO1lBRUYsSUFBSSxPQUFPLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsY0FBYyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBRS9ELElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztZQUM5QixJQUFJLENBQUMsY0FBYyxHQUFHLE9BQU8sQ0FBQyxhQUFhLENBQUM7WUFDNUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7WUFDakIsSUFBSSxDQUFDLGFBQWEsR0FBRyxDQUFDLENBQUM7WUFFdkIsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBRXZCLENBQUM7UUFFUyxnQ0FBVyxHQUFyQjtZQUVJLDRDQUE0QztZQUM1QyxJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUM7WUFFdkIsaUNBQWlDO1lBQ2pDLG1EQUFtRDtZQUNuRCxFQUFFLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO2dCQUVkLElBQUksQ0FBQyx1QkFBdUIsR0FBRyxJQUFJLENBQUM7WUFFeEMsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUVKLDhCQUE4QjtnQkFDOUIsSUFBSSxDQUFDLHVCQUF1QixHQUFHLEtBQUssQ0FBQztZQUV6QyxDQUFDO1lBRUQsZ0NBQWdDO1lBQ2hDLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxtQkFBVyxFQUFFLENBQUM7UUFFMUMsQ0FBQztRQUVNLG9DQUFlLEdBQXRCLFVBQXVCLGVBQWlDLEVBQUUsWUFBaUQ7WUFBakQsNkJBQUEsRUFBQSxlQUF1QixJQUFJLENBQUMscUJBQXFCO1lBRXZHLElBQUksS0FBSyxHQUFXLElBQUksbUJBQVcsQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUVyRCx3R0FBd0c7WUFFeEcsNEhBQTRIO1lBRTVILE1BQU0sQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7Z0JBQ25CLEtBQUssSUFBSSxDQUFDLHFCQUFxQjtvQkFDM0IsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNoQyxLQUFLLENBQUM7Z0JBQ1YsS0FBSyxJQUFJLENBQUMsdUJBQXVCO29CQUM3QixJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ2pDLEtBQUssQ0FBQztnQkFDVixLQUFLLElBQUksQ0FBQyw0QkFBNEI7b0JBQ2xDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDakMsS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUVELE1BQU0sQ0FBQyxLQUFLLENBQUM7UUFFakIsQ0FBQztRQUVNLHdDQUFtQixHQUExQixVQUEyQixLQUFhO1lBRXBDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRTVCLENBQUM7UUFFTSx5Q0FBb0IsR0FBM0IsVUFBNEIsS0FBYTtZQUVyQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUUvQixDQUFDO1FBRU0saURBQTRCLEdBQW5DLFVBQW9DLEtBQWE7WUFFN0MsdUVBQXVFO1lBRXZFLGdFQUFnRTtZQUNoRSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBRTlCLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUVwQyxDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBRUosSUFBSSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsYUFBYSxHQUFHLENBQUMsQ0FBQztnQkFFL0MsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRXBELENBQUM7UUFFTCxDQUFDO1FBRU0sK0JBQVUsR0FBakI7WUFFSSxJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztZQUVqQix1REFBdUQ7UUFFM0QsQ0FBQztRQUVNLDZCQUFRLEdBQWY7WUFFSSx1QkFBdUI7WUFFdkIsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7UUFFdkIsQ0FBQztRQUVNLDhCQUFTLEdBQWhCLFVBQWlCLE1BQWM7WUFFM0IsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7WUFFdEIsSUFBSSxDQUFDLFlBQVksQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFOUMsQ0FBQztRQUVNLDhCQUFTLEdBQWhCO1lBRUksTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7UUFFeEIsQ0FBQztRQUVNLHlCQUFJLEdBQVg7WUFFSSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRXRCLENBQUM7UUFFTSxnQ0FBVyxHQUFsQixVQUFtQixRQUFnQjtZQUUvQixJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztRQUU5QixDQUFDO1FBRU0sZ0NBQVcsR0FBbEI7WUFFSSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztRQUUxQixDQUFDO1FBRVMsK0JBQVUsR0FBcEIsVUFBcUIsS0FBYTtZQUU5Qix3RUFBd0U7WUFDeEUsa0ZBQWtGO1lBQ2xGLDBFQUEwRTtZQUMxRSx3RUFBd0U7WUFMNUUsaUJBaURDO1lBMUNHLE1BQU0sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxVQUFDLE9BQU8sRUFBRSxNQUFNO2dCQUUvQixFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUM7b0JBRXJCLElBQUksT0FBTyxHQUFHLElBQUksdUJBQWEsRUFBRSxDQUFDO29CQUVsQyx5QkFBeUI7b0JBQ3pCLEtBQUssQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO29CQUV6QixPQUFPLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFDLFdBQXdCO3dCQUV4RCxLQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBQyxXQUF3Qjs0QkFFckUsS0FBSyxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7NEJBQ2hDLEtBQUssQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDOzRCQUMxQixLQUFLLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQzs0QkFDeEIsS0FBSyxDQUFDLGVBQWUsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDOzRCQUVuQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7d0JBRW5CLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFDLGdCQUE4Qjs0QkFFcEMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUM7d0JBRTdCLENBQUMsQ0FBQyxDQUFDO29CQUVQLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFDLFlBQTBCO3dCQUVoQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7b0JBRXpCLENBQUMsQ0FBQyxDQUFDO2dCQUVQLENBQUM7Z0JBQUMsSUFBSSxDQUFDLENBQUM7b0JBRUosSUFBSSxVQUFVLEdBQUcsSUFBSSxtQkFBVyxDQUFDLGtCQUFrQixFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUV4RCxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBRXZCLENBQUM7WUFFTCxDQUFDLENBQUMsQ0FBQztRQUVQLENBQUM7UUFFTSx5QkFBSSxHQUFYLFVBQVksVUFBd0MsRUFBRSxjQUF1QjtZQUV6RSxnSEFBZ0g7WUFDaEgsaUVBQWlFO1lBSHJFLGlCQTZEQztZQXhERyw4QkFBOEI7WUFDOUIsSUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7WUFHN0MsNkNBQTZDO1lBQzdDLEVBQUUsQ0FBQyxDQUFDLFlBQVksS0FBSyxJQUFJLElBQUksWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBRWxELHlCQUF5QjtnQkFDekIsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBRWhCLENBQUM7WUFFRCxxSEFBcUg7WUFDckgsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBRWhELGlEQUFpRDtZQUNqRCxFQUFFLENBQUMsQ0FBQyxLQUFLLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFFakIsTUFBTSxDQUFDO1lBSVgsQ0FBQztZQUVELDhEQUE4RDtZQUM5RCxFQUFFLENBQUMsQ0FBQyxjQUFjLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQztnQkFFL0IsS0FBSyxDQUFDLGNBQWMsR0FBRyxjQUFjLENBQUM7WUFFMUMsQ0FBQztZQUVELHFDQUFxQztZQUNyQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUVwQix5Q0FBeUM7Z0JBQ3JDLElBQUEsMkNBQThELEVBQTVELFlBQUcsRUFBRSxhQUFZLEVBQVosaUNBQVksQ0FBNEM7Z0JBRW5FLEtBQUssQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO2dCQUNoQixLQUFLLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztnQkFFcEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUM7b0JBRXhCLEtBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBRXRCLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFDLEtBQUs7b0JBRVgscUJBQXFCO2dCQUV6QixDQUFDLENBQUMsQ0FBQztZQUVQLENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFFSixJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRXRCLENBQUM7UUFFTCxDQUFDO1FBRVMsMEJBQUssR0FBZixVQUFnQixLQUFhO1lBQTdCLGlCQWdDQztZQTlCRyxzQkFBc0I7WUFDdEIsSUFBSSxpQkFBaUIsR0FBRztnQkFDcEIsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJO2FBQ25CLENBQUM7WUFFRiwyQkFBMkI7WUFDM0IsSUFBSSxDQUFDLFlBQVksQ0FBQyxnQkFBZ0IsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFDLFVBQVU7Z0JBRWxFLG9DQUFvQztnQkFDcEMsVUFBVSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDO2dCQUV0Qyx1RUFBdUU7Z0JBQ3ZFLEtBQUssQ0FBQyxTQUFTLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUM7Z0JBRWpELGdEQUFnRDtnQkFDaEQsS0FBSSxDQUFDLFlBQVksQ0FBQyx3QkFBd0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFFdkQsaUJBQWlCO2dCQUNqQixnQ0FBZ0M7Z0JBQ2hDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQztnQkFFMUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7Z0JBQ3ZCLEtBQUssQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO1lBRWxDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFDLEtBQUs7Z0JBRVgscUJBQXFCO1lBRXpCLENBQUMsQ0FBQyxDQUFDO1FBRVAsQ0FBQztRQUVEOzs7V0FHRztRQUNPLHVDQUFrQixHQUE1QixVQUE2QixVQUE0QjtZQUVyRCxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUM7WUFFakIsOEJBQThCO1lBQzlCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRTNCLE1BQU0sQ0FBQyxLQUFLLENBQUM7WUFFakIsQ0FBQztZQUVELHNIQUFzSDtZQUN0SCxFQUFFLENBQUMsQ0FBQyxVQUFVLEtBQUssU0FBUyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBRTVFLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUU1QyxDQUFDO1lBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sVUFBVSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0JBRXhDLHdDQUF3QztnQkFDeEMsS0FBSyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFNUMsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUVKLHNDQUFzQztnQkFDdEMsTUFBTSxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztvQkFDakIsS0FBSyxJQUFJLENBQUMsZUFBZTt3QkFDckIsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxHQUFHLENBQUMsQ0FBQyxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUM7NEJBQ3BELElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLGFBQWEsR0FBRyxDQUFDLENBQUM7NEJBQzVDLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQzt3QkFDNUMsQ0FBQzt3QkFDRCxLQUFLLENBQUM7b0JBQ1YsS0FBSyxJQUFJLENBQUMsbUJBQW1CO3dCQUN6QixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQzs0QkFDcEQsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsYUFBYSxHQUFHLENBQUMsQ0FBQzs0QkFDNUMsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO3dCQUM1QyxDQUFDO3dCQUNELEtBQUssQ0FBQztvQkFDVixLQUFLLElBQUksQ0FBQyxnQkFBZ0I7d0JBQ3RCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7NEJBQ3pCLElBQUksQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDOzRCQUN2QixLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7d0JBQzVDLENBQUM7d0JBQ0QsS0FBSyxDQUFDO29CQUNWLEtBQUssSUFBSSxDQUFDLGVBQWU7d0JBQ3JCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7NEJBQ3pCLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDOzRCQUM1QyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7d0JBQzVDLENBQUM7d0JBQ0QsS0FBSyxDQUFDO29CQUNWO3dCQUNJLHVDQUF1Qzt3QkFDdkMsS0FBSyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ2hELENBQUM7WUFFTCxDQUFDO1lBRUQsTUFBTSxDQUFDLEtBQUssQ0FBQztRQUVqQixDQUFDO1FBRVMsbUNBQWMsR0FBeEIsVUFBeUIsT0FBd0I7WUFBakQsaUJBbUJDO1lBakJHLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQztZQUVqQixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFDLGNBQXNCLEVBQUUsVUFBa0I7Z0JBRXhELEVBQUUsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxFQUFFLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQztvQkFFaEMsS0FBSyxHQUFHLGNBQWMsQ0FBQztvQkFDdkIsS0FBSSxDQUFDLGFBQWEsR0FBRyxVQUFVLENBQUM7b0JBRWhDLE1BQU0sQ0FBQyxJQUFJLENBQUM7Z0JBRWhCLENBQUM7WUFFTCxDQUFDLENBQUMsQ0FBQztZQUVILE1BQU0sQ0FBQyxLQUFLLENBQUM7UUFFakIsQ0FBQztRQUVTLHVDQUFrQixHQUE1QixVQUE2QixPQUFrQztZQUUzRCxvR0FBb0c7WUFDcEcsbUhBQW1IO1lBSHZILGlCQWtEQztZQTdDRyxzREFBc0Q7WUFFdEQsSUFBSSxtQkFBbUIsR0FBa0Q7Z0JBQ3JFLEdBQUcsRUFBRSxJQUFJO2dCQUNULEtBQUssRUFBRSxJQUFJO2FBQ2QsQ0FBQztZQUVGLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBQyxNQUFNO2dCQUVuQiwwQ0FBMEM7Z0JBRTFDLHNGQUFzRjtnQkFDdEYsU0FBUztnQkFFVCxJQUFJLFFBQVEsR0FBRyxFQUFFLENBQUM7Z0JBRWxCLDhEQUE4RDtnQkFDOUQsRUFBRSxDQUFDLENBQUMsS0FBSSxDQUFDLGNBQWMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUM3QixRQUFRLEdBQUcsS0FBSSxDQUFDLGNBQWMsQ0FBQztnQkFDbkMsQ0FBQztnQkFFRCwyR0FBMkc7Z0JBQzNHLEVBQUUsQ0FBQyxDQUFDLE9BQU8sTUFBTSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7b0JBRTdCLFFBQVEsSUFBSSxNQUFNLENBQUM7b0JBRW5CLG1CQUFtQixHQUFHO3dCQUNsQixHQUFHLEVBQUUsUUFBUTtxQkFDaEIsQ0FBQztnQkFFTixDQUFDO2dCQUFDLElBQUksQ0FBQyxDQUFDO29CQUVKLFFBQVEsSUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDO29CQUV2QixtQkFBbUIsR0FBRzt3QkFDbEIsR0FBRyxFQUFFLFFBQVE7d0JBQ2IsS0FBSyxFQUFFLE1BQU0sQ0FBQyxLQUFLO3FCQUN0QixDQUFDO2dCQUVOLENBQUM7WUFFTCxDQUFDLENBQUMsQ0FBQztZQUVILE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQztRQUUvQixDQUFDO1FBRU0sMEJBQUssR0FBWjtZQUVJLHdCQUF3QjtZQUN4QixJQUFJLEtBQUssR0FBa0IsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7WUFFckQsRUFBRSxDQUFDLENBQUMsS0FBSyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ2pCLE1BQU0sQ0FBQztZQUNYLENBQUM7WUFFRCxJQUFJLFdBQVcsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUM7WUFFdkQsS0FBSyxDQUFDLGNBQWMsSUFBSSxXQUFXLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQztZQUV0RCxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRXRCLENBQUM7UUFFTSx5QkFBSSxHQUFYO1lBRUksd0JBQXdCO1lBQ3hCLElBQUksS0FBSyxHQUFrQixJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztZQUVyRCxFQUFFLENBQUMsQ0FBQyxLQUFLLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDakIsTUFBTSxDQUFDO1lBQ1gsQ0FBQztZQUVELEtBQUssQ0FBQyxjQUFjLEdBQUcsQ0FBQyxDQUFDO1lBRXpCLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFdEIsQ0FBQztRQUVTLDBCQUFLLEdBQWYsVUFBZ0IsS0FBYTtZQUV6QixLQUFLLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUV6QixLQUFLLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztZQUV4QixJQUFJLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUV0RCxLQUFLLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztRQUU1QixDQUFDO1FBRU0seUJBQUksR0FBWDtZQUVJLHNCQUFzQjtZQUN0QixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRXRCLENBQUM7UUFFTSw2QkFBUSxHQUFmO1lBRUksMEJBQTBCO1lBQzFCLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFFMUIsQ0FBQztRQUVNLDBCQUFLLEdBQVo7WUFFSSx1QkFBdUI7WUFDdkIsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUV2QixDQUFDO1FBRU0seUJBQUksR0FBWDtZQUVJLHNCQUFzQjtZQUN0QixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRXRCLENBQUM7UUFnR0wsaUJBQUM7SUFBRCxDQXBuQkEsQUFvbkJDLElBQUE7SUFwbkJZLGdDQUFVIiwiZmlsZSI6ImxpYnJhcnkvY29yZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBQbGF5ZXJTb3VuZCwgSVNvdW5kLCBJU291bmRBdHRyaWJ1dGVzLCBJU291bmRTb3VyY2UgfSBmcm9tICcuL3NvdW5kJztcbmltcG9ydCB7IFBsYXllckF1ZGlvIH0gZnJvbSAnLi9hdWRpbyc7XG5pbXBvcnQgeyBQbGF5ZXJSZXF1ZXN0IH0gZnJvbSAnLi9yZXF1ZXN0JztcbmltcG9ydCB7IFBsYXllckVycm9yLCBJUGxheWVyRXJyb3IgfSBmcm9tICcuL2Vycm9yJztcblxuZXhwb3J0IGludGVyZmFjZSBJQ29yZU9wdGlvbnMge1xuICAgIHZvbHVtZT86IG51bWJlcjtcbiAgICBsb29wUXVldWU/OiBib29sZWFuO1xuICAgIHNvdW5kc0Jhc2VVcmw/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBQbGF5ZXJDb3JlIHtcblxuICAgIC8vIGlzIHRoZSB3ZWIgYXVkaW8gQVBJIHN1cHBvcnRlZFxuICAgIHByb3RlY3RlZCBfaXNXZWJBdWRpb0FwaVN1cHBvcnRlZDogYm9vbGVhbjtcbiAgICAvLyB0aGUgc291bmRzIHF1ZXVlXG4gICAgcHJvdGVjdGVkIF9xdWV1ZTogSVNvdW5kW107XG4gICAgLy8gdGhlIHZvbHVtZSAoMCB0byAxMDApXG4gICAgcHJvdGVjdGVkIF92b2x1bWU6IG51bWJlcjtcbiAgICAvLyB0aGUgcHJvZ3Jlc3MgKHNvbmcgcGxheSB0aW1lKVxuICAgIHByb3RlY3RlZCBfcHJvZ3Jlc3M6IG51bWJlcjtcbiAgICAvLyB0aGUgYmFzZSB1cmwgdGhhdCBhbGwgc291bmRzIHdpbGwgaGF2ZSBpbiBjb21tb25cbiAgICBwcm90ZWN0ZWQgX3NvdW5kc0Jhc2VVcmw6IHN0cmluZztcbiAgICAvLyB0aGUgY3VycmVudCBzb3VuZCBpbiBxdWV1ZSBpbmRleFxuICAgIHByb3RlY3RlZCBfY3VycmVudEluZGV4OiBudW1iZXI7XG4gICAgLy8gaW5zdGFuY2Ugb2YgdGhlIGF1ZGlvIGxpYnJhcnkgY2xhc3NcbiAgICBwcm90ZWN0ZWQgX3BsYXllckF1ZGlvOiBQbGF5ZXJBdWRpbztcblxuICAgIC8vIGNhbGxiYWNrIGhvb2tzXG4gICAgcHVibGljIG9uUGxheVN0YXJ0OiAoKSA9PiB2b2lkO1xuICAgIHB1YmxpYyBvblBsYXlpbmc6ICgpID0+IHZvaWQ7XG4gICAgcHVibGljIG9uQnVmZmVyaW5nOiAoKSA9PiB2b2lkO1xuXG4gICAgLy8gY29uc3RhbnRzXG4gICAgcmVhZG9ubHkgV0hFUkVfSU5fUVVFVUVfQVRfRU5EOiBzdHJpbmcgPSAnYXBwZW5kJztcbiAgICByZWFkb25seSBXSEVSRV9JTl9RVUVVRV9BVF9TVEFSVDogc3RyaW5nID0gJ3ByZXBlbmQnO1xuICAgIHJlYWRvbmx5IFdIRVJFX0lOX1FVRVVFX0FGVEVSX0NVUlJFTlQ6IHN0cmluZyA9ICdhZnRlckN1cnJlbnQnO1xuXG4gICAgcmVhZG9ubHkgUExBWV9TT1VORF9ORVhUID0gJ25leHQnO1xuICAgIHJlYWRvbmx5IFBMQVlfU09VTkRfUFJFVklPVVMgPSAncHJldmlvdXMnO1xuICAgIHJlYWRvbmx5IFBMQVlfU09VTkRfRklSU1QgPSAnZmlyc3QnO1xuICAgIHJlYWRvbmx5IFBMQVlfU09VTkRfTEFTVCA9ICdsYXN0JztcblxuICAgIGNvbnN0cnVjdG9yKHBsYXllck9wdGlvbnM6IElDb3JlT3B0aW9ucykge1xuXG4gICAgICAgIGxldCBkZWZhdWx0T3B0aW9ucyA9IHtcbiAgICAgICAgICAgIHZvbHVtZTogODAsXG4gICAgICAgICAgICBsb29wUXVldWU6IGZhbHNlLFxuICAgICAgICAgICAgc291bmRzQmFzZVVybDogJydcbiAgICAgICAgfTtcblxuICAgICAgICBsZXQgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRPcHRpb25zLCBwbGF5ZXJPcHRpb25zKTtcblxuICAgICAgICB0aGlzLl92b2x1bWUgPSBvcHRpb25zLnZvbHVtZTtcbiAgICAgICAgdGhpcy5fc291bmRzQmFzZVVybCA9IG9wdGlvbnMuc291bmRzQmFzZVVybDtcbiAgICAgICAgdGhpcy5fcXVldWUgPSBbXTtcbiAgICAgICAgdGhpcy5fY3VycmVudEluZGV4ID0gMDtcblxuICAgICAgICB0aGlzLl9pbml0aWFsaXplKCk7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX2luaXRpYWxpemUoKSB7XG5cbiAgICAgICAgLy8gVE9ETzogY2hlY2sgaWYgd2ViIGF1ZGlvIGFwaSBpcyBhdmFpbGFibGVcbiAgICAgICAgbGV0IHdlYkF1ZGlvQXBpID0gdHJ1ZTtcblxuICAgICAgICAvLyBpcyB0aGUgd2ViIGF1ZGlvIGFwaSBzdXBwb3J0ZWRcbiAgICAgICAgLy8gaWYgbm90IHdlIHdpbGwgdXNlIHRoZSBhdWRpbyBlbGVtZW50IGFzIGZhbGxiYWNrXG4gICAgICAgIGlmICh3ZWJBdWRpb0FwaSkge1xuXG4gICAgICAgICAgICB0aGlzLl9pc1dlYkF1ZGlvQXBpU3VwcG9ydGVkID0gdHJ1ZTtcblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAvLyB1c2UgdGhlIGh0bWw1IGF1ZGlvIGVsZW1lbnRcbiAgICAgICAgICAgIHRoaXMuX2lzV2ViQXVkaW9BcGlTdXBwb3J0ZWQgPSBmYWxzZTtcblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gcGxheWVyIGF1ZGlvIGxpYnJhcnkgaW5zdGFuY2VcbiAgICAgICAgdGhpcy5fcGxheWVyQXVkaW8gPSBuZXcgUGxheWVyQXVkaW8oKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBhZGRTb3VuZFRvUXVldWUoc291bmRBdHRyaWJ1dGVzOiBJU291bmRBdHRyaWJ1dGVzLCB3aGVyZUluUXVldWU6IHN0cmluZyA9IHRoaXMuV0hFUkVfSU5fUVVFVUVfQVRfRU5EKTogSVNvdW5kIHtcblxuICAgICAgICBsZXQgc291bmQ6IElTb3VuZCA9IG5ldyBQbGF5ZXJTb3VuZChzb3VuZEF0dHJpYnV0ZXMpO1xuXG4gICAgICAgIC8vIFRPRE86IGlzIHF1ZXVlIGp1c3QgYW4gYXJyYXkgb2Ygc291bmRzLCBvciBkbyB3ZSBuZWVkIHNvbWV0aGluZyBtb3JlIGNvbXBsZXggd2l0aCBhIHBvc2l0aW9uIHRyYWNrZXI/XG5cbiAgICAgICAgLy8gVE9ETzogYWxsb3cgYXJyYXkgb2Ygc291bmRBdHRyaWJ1dGVzIHRvIGJlIGluamVjdGVkLCB0byBjcmVhdGUgc2V2ZXJhbCBhdCBvbmNlLCBpZiBpbnB1dCBpcyBhbiBhcnJheSBvdXRwdXQgc2hvdWxkIGJlIHRvb1xuXG4gICAgICAgIHN3aXRjaCAod2hlcmVJblF1ZXVlKSB7XG4gICAgICAgICAgICBjYXNlIHRoaXMuV0hFUkVfSU5fUVVFVUVfQVRfRU5EOlxuICAgICAgICAgICAgICAgIHRoaXMuX2FwcGVuZFNvdW5kVG9RdWV1ZShzb3VuZCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIHRoaXMuV0hFUkVfSU5fUVVFVUVfQVRfU1RBUlQ6XG4gICAgICAgICAgICAgICAgdGhpcy5fcHJlcGVuZFNvdW5kVG9RdWV1ZShzb3VuZCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIHRoaXMuV0hFUkVfSU5fUVVFVUVfQUZURVJfQ1VSUkVOVDpcbiAgICAgICAgICAgICAgICB0aGlzLl9wcmVwZW5kU291bmRUb1F1ZXVlKHNvdW5kKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzb3VuZDtcblxuICAgIH1cblxuICAgIHB1YmxpYyBfYXBwZW5kU291bmRUb1F1ZXVlKHNvdW5kOiBJU291bmQpOiB2b2lkIHtcblxuICAgICAgICB0aGlzLl9xdWV1ZS5wdXNoKHNvdW5kKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBfcHJlcGVuZFNvdW5kVG9RdWV1ZShzb3VuZDogSVNvdW5kKTogdm9pZCB7XG5cbiAgICAgICAgdGhpcy5fcXVldWUudW5zaGlmdChzb3VuZCk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgX2FkZFNvdW5kVG9RdWV1ZUFmdGVyQ3VycmVudChzb3VuZDogSVNvdW5kKTogdm9pZCB7XG5cbiAgICAgICAgLy8gVE9ETzogYWRkIG9wdGlvbiB0byBwbGF5IGFmdGVyIGJlaW5nIGFkZGVkIG9yIHVzZXIgdXNlcyBwbGF5IG1ldGhvZD9cblxuICAgICAgICAvLyBpZiB0aGVyZSBpcyBubyBjdXJyZW50IHNvbmcgeWV0LCBhcHBlbmQgdGhlIHNvbmcgdG8gdGhlIHF1ZXVlXG4gICAgICAgIGlmICh0aGlzLl9jdXJyZW50SW5kZXggPT09IG51bGwpIHtcblxuICAgICAgICAgICAgdGhpcy5fYXBwZW5kU291bmRUb1F1ZXVlKHNvdW5kKTtcblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICBsZXQgYWZ0ZXJDdXJyZW50SW5kZXggPSB0aGlzLl9jdXJyZW50SW5kZXggKyAxO1xuXG4gICAgICAgICAgICB0aGlzLl9xdWV1ZS5zcGxpY2UoYWZ0ZXJDdXJyZW50SW5kZXgsIDAsIHNvdW5kKTtcblxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgcmVzZXRRdWV1ZSgpIHtcblxuICAgICAgICB0aGlzLl9xdWV1ZSA9IFtdO1xuXG4gICAgICAgIC8vIFRPRE86IGNoZWNrIGlmIGEgc29uZyBpcyBnZXR0aW5nIHBsYXllZCBhbmQgc3RvcCBpdD9cblxuICAgIH1cblxuICAgIHB1YmxpYyBnZXRRdWV1ZSgpIHtcblxuICAgICAgICAvLyBUT0RPOiBpcyB0aGUgbmVlZGVkP1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9xdWV1ZTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBzZXRWb2x1bWUodm9sdW1lOiBudW1iZXIpOiB2b2lkIHtcblxuICAgICAgICB0aGlzLl92b2x1bWUgPSB2b2x1bWU7XG5cbiAgICAgICAgdGhpcy5fcGxheWVyQXVkaW8uY2hhbmdlR2FpblZhbHVlKHZvbHVtZSk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0Vm9sdW1lKCk6IG51bWJlciB7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX3ZvbHVtZTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBtdXRlKCkge1xuXG4gICAgICAgIHRoaXMuc2V0Vm9sdW1lKDApO1xuXG4gICAgfVxuXG4gICAgcHVibGljIHNldFByb2dyZXNzKHByb2dyZXNzOiBudW1iZXIpOiB2b2lkIHtcblxuICAgICAgICB0aGlzLl9wcm9ncmVzcyA9IHByb2dyZXNzO1xuXG4gICAgfVxuXG4gICAgcHVibGljIGdldFByb2dyZXNzKCk6IG51bWJlciB7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX3Byb2dyZXNzO1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9sb2FkU291bmQoc291bmQ6IElTb3VuZCk6IFByb21pc2U8SVNvdW5kIHwgUGxheWVyRXJyb3I+IHtcblxuICAgICAgICAvLyBUT0RPOiB3b3VsZCBiZSBnb29kIHRvIGNhY2hlIGJ1ZmZlcnMsIHNvIG5lZWQgdG8gY2hlY2sgaWYgaXMgaW4gY2FjaGVcbiAgICAgICAgLy8gbGV0IHRoZSB1c2VyIGNob29zZSAoYnkgc2V0dGluZyBhbiBvcHRpb24pIHdoYXQgYW1vdW50IG9mIHNvdW5kcyB3aWxsIGJlIGNhY2hlZFxuICAgICAgICAvLyBhZGQgYSBjYWNoZWQgZGF0ZSAvIHRpbWVzdGFtcCB0byBiZSBhYmxlIHRvIGNsZWFyIGNhY2hlIGJ5IG9sZGVzdCBmaXJzdFxuICAgICAgICAvLyBvciBldmVuIGJldHRlciBhZGQgYSBwbGF5ZWQgY291bnRlciB0byBjYWNoZSBieSBsZWFzdCBwbGF5ZWQgYW5kIGRhdGVcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgICAgICBpZiAoc291bmQudXJsICE9PSBudWxsKSB7XG5cbiAgICAgICAgICAgICAgICBsZXQgcmVxdWVzdCA9IG5ldyBQbGF5ZXJSZXF1ZXN0KCk7XG5cbiAgICAgICAgICAgICAgICAvLyBjaGFuZ2UgYnVmZmVyaW5nIHN0YXRlXG4gICAgICAgICAgICAgICAgc291bmQuaXNCdWZmZXJpbmcgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgcmVxdWVzdC5nZXRBcnJheUJ1ZmZlcihzb3VuZCkudGhlbigoYXJyYXlCdWZmZXI6IEFycmF5QnVmZmVyKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcGxheWVyQXVkaW8uZGVjb2RlQXVkaW8oYXJyYXlCdWZmZXIpLnRoZW4oKGF1ZGlvQnVmZmVyOiBBdWRpb0J1ZmZlcikgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VuZC5hdWRpb0J1ZmZlciA9IGF1ZGlvQnVmZmVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgc291bmQuaXNCdWZmZXJpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdW5kLmlzQnVmZmVyZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgc291bmQuYXVkaW9CdWZmZXJEYXRlID0gbmV3IERhdGUoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShzb3VuZCk7XG5cbiAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goKGRlY29kZUF1ZGlvRXJyb3I6IElQbGF5ZXJFcnJvcikgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZGVjb2RlQXVkaW9FcnJvcik7XG5cbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICB9KS5jYXRjaCgocmVxdWVzdEVycm9yOiBJUGxheWVyRXJyb3IpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICByZWplY3QocmVxdWVzdEVycm9yKTtcblxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgbGV0IG5vVXJsRXJyb3IgPSBuZXcgUGxheWVyRXJyb3IoJ3NvdW5kIGhhcyBubyB1cmwnLCAxKTtcblxuICAgICAgICAgICAgICAgIHJlamVjdChub1VybEVycm9yKTtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG4gICAgcHVibGljIHBsYXkod2hpY2hTb3VuZD86IG51bWJlciB8IHN0cmluZyB8IHVuZGVmaW5lZCwgcGxheVRpbWVPZmZzZXQ/OiBudW1iZXIpOiB2b2lkIHtcblxuICAgICAgICAvLyBUT0RPOiBjaGVjayB0aGUgYXZhaWxhYmxlIGNvZGVjcyBhbmQgZGVmaW5lZCBzb3VyY2VzLCBwbGF5IHRoZSBmaXJzdCBvbmUgdGhhdCBoYXMgbWF0Y2hlcyBhbmQgYXZhaWxhYmxlIGNvZGVjXG4gICAgICAgIC8vIFRPRE86IGxldCB1c2VyIGRlZmluZSBvcmRlciBvZiBwcmVmZXJyZWQgY29kZWNzIGZvciBwbGF5ZXJiYWNrXG5cbiAgICAgICAgLy8gZ2V0IHRoZSBjdXJyZW50IHNvbmcgaWYgYW55XG4gICAgICAgIGxldCBjdXJyZW50U291bmQgPSB0aGlzLl9nZXRTb3VuZEZyb21RdWV1ZSgpO1xuXG5cbiAgICAgICAgLy8gaWYgdGhlcmUgaXMgYSBzb3VuZCBjdXJyZW50bHkgYmVpbmcgcGxheWVkXG4gICAgICAgIGlmIChjdXJyZW50U291bmQgIT09IG51bGwgJiYgY3VycmVudFNvdW5kLmlzUGxheWluZykge1xuXG4gICAgICAgICAgICAvLyBzdG9wIHRoZSBjdXJyZW50IHNvdW5kXG4gICAgICAgICAgICB0aGlzLnN0b3AoKTtcblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gd2hpY2hTb3VuZCBpcyBvcHRpb25hbCwgaWYgc2V0IGl0IGNhbiBiZSB0aGUgc291bmQgaWQgb3IgaWYgaXQncyBhIHN0cmluZyBpdCBjYW4gYmUgbmV4dCAvIHByZXZpb3VzIC8gZmlyc3QgLyBsYXN0XG4gICAgICAgIGxldCBzb3VuZCA9IHRoaXMuX2dldFNvdW5kRnJvbVF1ZXVlKHdoaWNoU291bmQpO1xuXG4gICAgICAgIC8vIGlmIHRoZXJlIGlzIG5vIHNvdW5kIHdlIGNvdWxkIHBsYXksIGRvIG5vdGhpbmdcbiAgICAgICAgaWYgKHNvdW5kID09PSBudWxsKSB7XG5cbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAgICAgLy8gVE9ETzogdGhyb3cgYW4gZXJyb3I/XG5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGlmIHRoZSB1c2VyIHdhbnRzIHRvIHBsYXkgdGhlIHNvdW5kIGZyb20gYSBjZXJ0YWluIHBvc2l0aW9uXG4gICAgICAgIGlmIChwbGF5VGltZU9mZnNldCAhPT0gdW5kZWZpbmVkKSB7XG5cbiAgICAgICAgICAgIHNvdW5kLnBsYXlUaW1lT2Zmc2V0ID0gcGxheVRpbWVPZmZzZXQ7XG5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGhhcyB0aGUgc291bmQgYWxyZWFkeSBiZWVuIGxvYWRlZD9cbiAgICAgICAgaWYgKCFzb3VuZC5pc0J1ZmZlcmVkKSB7XG5cbiAgICAgICAgICAgIC8vIGV4dHJhY3QgdGhlIHVybCBhbmQgY29kZWMgZnJvbSBzb3VyY2VzXG4gICAgICAgICAgICBsZXQgeyB1cmwsIGNvZGVjID0gbnVsbCB9ID0gdGhpcy5fc291cmNlVG9WYXJpYWJsZXMoc291bmQuc291cmNlcyk7XG5cbiAgICAgICAgICAgIHNvdW5kLnVybCA9IHVybDtcbiAgICAgICAgICAgIHNvdW5kLmNvZGVjID0gY29kZWM7XG5cbiAgICAgICAgICAgIHRoaXMuX2xvYWRTb3VuZChzb3VuZCkudGhlbigoKSA9PiB7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9wbGF5KHNvdW5kKTtcblxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBoYW5kbGUgZXJyb3JcblxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgdGhpcy5fcGxheShzb3VuZCk7XG5cbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9wbGF5KHNvdW5kOiBJU291bmQpIHtcblxuICAgICAgICAvLyBzb3VyY2Ugbm9kZSBvcHRpb25zXG4gICAgICAgIGxldCBzb3VyY2VOb2RlT3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGxvb3A6IHNvdW5kLmxvb3BcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBjcmVhdGUgYSBuZXcgc291cmNlIG5vZGVcbiAgICAgICAgdGhpcy5fcGxheWVyQXVkaW8uY3JlYXRlU291cmNlTm9kZShzb3VyY2VOb2RlT3B0aW9ucykudGhlbigoc291cmNlTm9kZSkgPT4ge1xuXG4gICAgICAgICAgICAvLyBhZGQgdGhlIGJ1ZmZlciB0byB0aGUgc291cmNlIG5vZGVcbiAgICAgICAgICAgIHNvdXJjZU5vZGUuYnVmZmVyID0gc291bmQuYXVkaW9CdWZmZXI7XG5cbiAgICAgICAgICAgIC8vIHRoZSBhdWRpb2NvbnRleHQgdGltZSByaWdodCBub3cgKHNpbmNlIHRoZSBhdWRpb2NvbnRleHQgZ290IGNyZWF0ZWQpXG4gICAgICAgICAgICBzb3VuZC5zdGFydFRpbWUgPSBzb3VyY2VOb2RlLmNvbnRleHQuY3VycmVudFRpbWU7XG5cbiAgICAgICAgICAgIC8vIGNvbm5lY3QgdGhlIHNvdXJjZSB0byB0aGUgZ3JhcGggKGRlc3RpbmF0aW9uKVxuICAgICAgICAgICAgdGhpcy5fcGxheWVyQXVkaW8uY29ubmVjdFNvdXJjZU5vZGVUb0dyYXBoKHNvdXJjZU5vZGUpO1xuXG4gICAgICAgICAgICAvLyBzdGFydCBwbGF5YmFja1xuICAgICAgICAgICAgLy8gc3RhcnQod2hlbiwgb2Zmc2V0LCBkdXJhdGlvbilcbiAgICAgICAgICAgIHNvdXJjZU5vZGUuc3RhcnQoMCwgc291bmQucGxheVRpbWVPZmZzZXQpO1xuXG4gICAgICAgICAgICBzb3VuZC5pc1BsYXlpbmcgPSB0cnVlO1xuICAgICAgICAgICAgc291bmQuc291cmNlTm9kZSA9IHNvdXJjZU5vZGU7XG5cbiAgICAgICAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG5cbiAgICAgICAgICAgIC8vIFRPRE86IGhhbmRsZSBlcnJvclxuXG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG4gICAgLyoqXHJcbiAgICAgKiB3aGljaFNvdW5kIGlzIG9wdGlvbmFsLCBpZiBzZXQgaXQgY2FuIGJlIHRoZSBzb3VuZCBpZCBvciBpZiBpdCdzIGEgc3RyaW5nIGl0IGNhbiBiZSBuZXh0IC8gcHJldmlvdXMgLyBmaXJzdCAvIGxhc3RcclxuICAgICAqIEBwYXJhbSB3aGljaFNvdW5kXHJcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgX2dldFNvdW5kRnJvbVF1ZXVlKHdoaWNoU291bmQ/OiBzdHJpbmcgfCBudW1iZXIpOiBJU291bmQgfCBudWxsIHtcblxuICAgICAgICBsZXQgc291bmQgPSBudWxsO1xuXG4gICAgICAgIC8vIGNoZWNrIGlmIHRoZSBxdWV1ZSBpcyBlbXB0eVxuICAgICAgICBpZiAodGhpcy5fcXVldWUubGVuZ3RoID09PSAwKSB7XG5cbiAgICAgICAgICAgIHJldHVybiBzb3VuZDtcblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgd2hpY2ggc29uZyB0byBwbGF5IGRpZCBub3QgZ2V0IHNwZWNpZmllZCwgcGxheSBvbmUgYmFzZWQgZnJvbSB0aGUgcXVldWUgYmFzZWQgb24gdGhlIHF1ZXVlIGluZGV4IHBvc2l0aW9uIG1hcmtlclxuICAgICAgICBpZiAod2hpY2hTb3VuZCA9PT0gdW5kZWZpbmVkICYmIHRoaXMuX3F1ZXVlW3RoaXMuX2N1cnJlbnRJbmRleF0gIT09IHVuZGVmaW5lZCkge1xuXG4gICAgICAgICAgICBzb3VuZCA9IHRoaXMuX3F1ZXVlW3RoaXMuX2N1cnJlbnRJbmRleF07XG5cbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygd2hpY2hTb3VuZCA9PT0gJ251bWJlcicpIHtcblxuICAgICAgICAgICAgLy8gaWYgd2hpY2ggc29uZyB0byBwbGF5IGlzIGEgbnVtZXJpYyBJRFxuICAgICAgICAgICAgc291bmQgPSB0aGlzLl9maW5kU291bmRCeUlkKHdoaWNoU291bmQpO1xuXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgIC8vIGlmIHdoaWNoIHNvbmcgdG8gcGxheSBpcyBhIGNvbnN0YW50XG4gICAgICAgICAgICBzd2l0Y2ggKHdoaWNoU291bmQpIHtcbiAgICAgICAgICAgICAgICBjYXNlIHRoaXMuUExBWV9TT1VORF9ORVhUOlxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fcXVldWVbdGhpcy5fY3VycmVudEluZGV4ICsgMV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fY3VycmVudEluZGV4ID0gdGhpcy5fY3VycmVudEluZGV4ICsgMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdW5kID0gdGhpcy5fcXVldWVbdGhpcy5fY3VycmVudEluZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIHRoaXMuUExBWV9TT1VORF9QUkVWSU9VUzpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX3F1ZXVlW3RoaXMuX2N1cnJlbnRJbmRleCAtIDFdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRJbmRleCA9IHRoaXMuX2N1cnJlbnRJbmRleCAtIDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VuZCA9IHRoaXMuX3F1ZXVlW3RoaXMuX2N1cnJlbnRJbmRleF07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSB0aGlzLlBMQVlfU09VTkRfRklSU1Q6XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9xdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9jdXJyZW50SW5kZXggPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgc291bmQgPSB0aGlzLl9xdWV1ZVt0aGlzLl9jdXJyZW50SW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgdGhpcy5QTEFZX1NPVU5EX0xBU1Q6XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9xdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9jdXJyZW50SW5kZXggPSB0aGlzLl9xdWV1ZS5sZW5ndGggLSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgc291bmQgPSB0aGlzLl9xdWV1ZVt0aGlzLl9jdXJyZW50SW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIHdoaWNoIHNvbmcgdG8gcGxheSBpcyBhIHN0cmluZyBJRFxuICAgICAgICAgICAgICAgICAgICBzb3VuZCA9IHRoaXMuX2ZpbmRTb3VuZEJ5SWQod2hpY2hTb3VuZCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzb3VuZDtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfZmluZFNvdW5kQnlJZChzb3VuZElkOiBzdHJpbmcgfCBudW1iZXIpOiBJU291bmQgfCBudWxsIHtcblxuICAgICAgICBsZXQgc291bmQgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuX3F1ZXVlLnNvbWUoKHNvdW5kRnJvbVF1ZXVlOiBJU291bmQsIHF1ZXVlSW5kZXg6IG51bWJlcikgPT4ge1xuXG4gICAgICAgICAgICBpZiAoc291bmRGcm9tUXVldWUuaWQgPT09IHNvdW5kSWQpIHtcblxuICAgICAgICAgICAgICAgIHNvdW5kID0gc291bmRGcm9tUXVldWU7XG4gICAgICAgICAgICAgICAgdGhpcy5fY3VycmVudEluZGV4ID0gcXVldWVJbmRleDtcblxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHNvdW5kO1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9zb3VyY2VUb1ZhcmlhYmxlcyhzb3VyY2VzOiAoSVNvdW5kU291cmNlIHwgc3RyaW5nKVtdKTogeyB1cmw6IHN0cmluZyB8IG51bGwsIGNvZGVjPzogc3RyaW5nIHwgbnVsbCB9IHtcblxuICAgICAgICAvLyBUT0RPOiBzb3VyY2UgY2FuIGJlIG9uIG9iamVjdCB3aGVyZSB0aGUgcHJvcGVydHkgbmFtZSBpcyB0aGUgY29kZWMgYW5kIHRoZSB2YWx1ZSBpcyB0aGUgc291bmQgdXJsXG4gICAgICAgIC8vIGlmIHNvdW5kIGlzbnQgYW4gb2JqZWN0IHRyeSB0byBkZXRlY3Qgc291bmQgc291cmNlIGV4dGVuc2lvbiBieSBmaWxlIGV4dGVudGlvbiBvciBieSBjaGVja2luZyB0aGUgZmlsZSBtaW1lIHR5cGVcblxuICAgICAgICAvLyBUT0RPOiBnZXQgYSBsaXN0IG9mIHN1cHBvcnRlZCBjb2RlY3MgYnkgdGhpcyBkZXZpY2VcblxuICAgICAgICBsZXQgZmlyc3RNYXRjaGluZ1NvdXJjZTogeyB1cmw6IHN0cmluZyB8IG51bGwsIGNvZGVjPzogc3RyaW5nIHwgbnVsbCB9ID0ge1xuICAgICAgICAgICAgdXJsOiBudWxsLFxuICAgICAgICAgICAgY29kZWM6IG51bGxcbiAgICAgICAgfTtcblxuICAgICAgICBzb3VyY2VzLmZvckVhY2goKHNvdXJjZSkgPT4ge1xuXG4gICAgICAgICAgICAvLyBUT0RPOiBmaW5kIG91dCB3aGF0IHRoZSBzb3VyY2UgY29kZWMgaXNcblxuICAgICAgICAgICAgLy8gVE9ETzogY2hlY2sgaWYgdGhlIHNvdXJjZSBjb2RlYyBpcyBhbW9uZyB0aGUgb25lcyB0aGF0IGFyZSBzdXBwb3J0ZWQgYnkgdGhpcyBkZXZpY2VcbiAgICAgICAgICAgIC8vaWYgKCkge1xuXG4gICAgICAgICAgICBsZXQgc291bmRVcmwgPSAnJztcblxuICAgICAgICAgICAgLy8gaWYgdGhlIHBsYXllciBoYWQgYXMgb3B0aW9uIGEgYmFzZVVybCBmb3Igc291bmRzIGFkZCBpdCBub3dcbiAgICAgICAgICAgIGlmICh0aGlzLl9zb3VuZHNCYXNlVXJsICE9PSAnJykge1xuICAgICAgICAgICAgICAgIHNvdW5kVXJsID0gdGhpcy5fc291bmRzQmFzZVVybDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gdHdvIGtpbmQgb2Ygc291cmNlIGFyZSBwb3NzaWJsZSwgYSBzdHJpbmcgKHRoZSB1cmwpIG9yIGFuIG9iamVjdCAoa2V5IGlzIHRoZSBjb2RlYyBhbmQgdmFsdWUgaXMgdGhlIHVybClcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc291cmNlID09PSAnc3RyaW5nJykge1xuXG4gICAgICAgICAgICAgICAgc291bmRVcmwgKz0gc291cmNlO1xuXG4gICAgICAgICAgICAgICAgZmlyc3RNYXRjaGluZ1NvdXJjZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBzb3VuZFVybFxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICBzb3VuZFVybCArPSBzb3VyY2UudXJsO1xuXG4gICAgICAgICAgICAgICAgZmlyc3RNYXRjaGluZ1NvdXJjZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBzb3VuZFVybCxcbiAgICAgICAgICAgICAgICAgICAgY29kZWM6IHNvdXJjZS5jb2RlY1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gZmlyc3RNYXRjaGluZ1NvdXJjZTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBwYXVzZSgpIHtcblxuICAgICAgICAvLyBnZXQgdGhlIGN1cnJlbnQgc291bmRcbiAgICAgICAgbGV0IHNvdW5kOiBJU291bmQgfCBudWxsID0gdGhpcy5fZ2V0U291bmRGcm9tUXVldWUoKTtcblxuICAgICAgICBpZiAoc291bmQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCB0aW1lQXRQYXVzZSA9IHNvdW5kLnNvdXJjZU5vZGUuY29udGV4dC5jdXJyZW50VGltZTtcblxuICAgICAgICBzb3VuZC5wbGF5VGltZU9mZnNldCArPSB0aW1lQXRQYXVzZSAtIHNvdW5kLnN0YXJ0VGltZTtcblxuICAgICAgICB0aGlzLl9zdG9wKHNvdW5kKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBzdG9wKCkge1xuXG4gICAgICAgIC8vIGdldCB0aGUgY3VycmVudCBzb3VuZFxuICAgICAgICBsZXQgc291bmQ6IElTb3VuZCB8IG51bGwgPSB0aGlzLl9nZXRTb3VuZEZyb21RdWV1ZSgpO1xuXG4gICAgICAgIGlmIChzb3VuZCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgc291bmQucGxheVRpbWVPZmZzZXQgPSAwO1xuXG4gICAgICAgIHRoaXMuX3N0b3Aoc291bmQpO1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9zdG9wKHNvdW5kOiBJU291bmQpIHtcblxuICAgICAgICBzb3VuZC5zb3VyY2VOb2RlLnN0b3AoMCk7XG5cbiAgICAgICAgc291bmQuaXNQbGF5aW5nID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5fcGxheWVyQXVkaW8uZGVzdHJveVNvdXJjZU5vZGUoc291bmQuc291cmNlTm9kZSk7XG5cbiAgICAgICAgc291bmQuc291cmNlTm9kZSA9IG51bGw7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgbmV4dCgpIHtcblxuICAgICAgICAvLyBhbGlhcyBmb3IgcGxheSBuZXh0XG4gICAgICAgIHRoaXMucGxheSgnbmV4dCcpO1xuXG4gICAgfVxuXG4gICAgcHVibGljIHByZXZpb3VzKCkge1xuXG4gICAgICAgIC8vIGFsaWFzIGZvciBwbGF5IHByZXZpb3VzXG4gICAgICAgIHRoaXMucGxheSgncHJldmlvdXMnKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBmaXJzdCgpIHtcblxuICAgICAgICAvLyBhbGlhcyBmb3IgcGxheSBmaXJzdFxuICAgICAgICB0aGlzLnBsYXkoJ2ZpcnN0Jyk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgbGFzdCgpIHtcblxuICAgICAgICAvLyBhbGlhcyBmb3IgcGxheSBsYXN0XG4gICAgICAgIHRoaXMucGxheSgnbGFzdCcpO1xuXG4gICAgfVxuXG4vKlxuXG4gICAgcGxheWVyLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24gc3RvcEZ1bmN0aW9uKCkge1xuXG4gICAgICAgIGlmICh0aGlzLnRyYWNrID09PSB1bmRlZmluZWQpIHtcblxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMudHJhY2suaXNQbGF5aW5nKSB7XG5cbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuXG4gICAgICAgIH1cblxuICAgICAgICAvLyBzdG9wIHRoZSB0cmFjayBwbGF5YmFja1xuICAgICAgICB0aGlzLmF1ZGlvR3JhcGguc291cmNlTm9kZS5zdG9wKDApO1xuXG4gICAgICAgIC8vIGNoYW5nZSB0aGUgdHJhY2sgYXR0cmlidXRlc1xuICAgICAgICB0aGlzLnRyYWNrLmlzUGxheWluZyA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMudHJhY2sucGxheVRpbWUgPSAwO1xuXG4gICAgICAgIC8vIGFmdGVyIGEgc3RvcCB5b3UgY2FudCBjYWxsIGEgc3RhcnQgYWdhaW4sIHlvdSBuZWVkIHRvIGNyZWF0ZSBhIG5ld1xuICAgICAgICAvLyBzb3VyY2Ugbm9kZSwgdGhpcyBtZWFucyB0aGF0IHdlIHVuc2V0IHRoZSBhdWRpb2dyYXBoIGFmdGVyIGEgc3RvcFxuICAgICAgICAvLyBzbyB0aGF0IGl0IGdldHMgcmVjcmVhdGVkIG9uIHRoZSBuZXh0IHBsYXlcbiAgICAgICAgdGhpcy5hdWRpb0dyYXBoID0gdW5kZWZpbmVkO1xuICAgICAgICBcbiAgICAgICAgLy8gc3RvcCB0aGUgcHJvZ3Jlc3MgdGltZXJcbiAgICAgICAgc3RvcFRpbWVyLmNhbGwodGhpcyk7XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICB9O1xuXG4gICAgcGxheWVyLnByb3RvdHlwZS5wb3NpdGlvbkNoYW5nZSA9IGZ1bmN0aW9uIHBvc2l0aW9uQ2hhbmdlRnVuY3Rpb24odHJhY2tQb3NpdGlvbkluUGVyY2VudCkge1xuICAgICAgICBcbiAgICAgICAgLy8gc3RvcCB0aGUgdHJhY2sgcGxheWJhY2tcbiAgICAgICAgdGhpcy5zdG9wKCk7XG5cbiAgICAgICAgbGV0IHRyYWNrUG9zaXRpb25JblNlY29uZHMgPSAodGhpcy50cmFjay5idWZmZXIuZHVyYXRpb24gLyAxMDApICogdHJhY2tQb3NpdGlvbkluUGVyY2VudDtcblxuICAgICAgICB0aGlzLnRyYWNrLnBsYXlUaW1lT2Zmc2V0ID0gdHJhY2tQb3NpdGlvbkluU2Vjb25kcztcblxuICAgICAgICAvLyBzdGFydCB0aGUgcGxheWJhY2sgYXQgdGhlIGdpdmVuIHBvc2l0aW9uXG4gICAgICAgIHRoaXMucGxheSgpO1xuXG4gICAgfTtcblxuICAgIGxldCB0cmlnZ2VyUHJvZ3Jlc3NFdmVudCA9IGZ1bmN0aW9uIHRyaWdnZXJQcm9ncmVzc0V2ZW50RnVuY3Rpb24oKSB7XG5cbiAgICAgICAgbGV0IHRpbWVOb3cgPSB0aGlzLmF1ZGlvR3JhcGguc291cmNlTm9kZS5jb250ZXh0LmN1cnJlbnRUaW1lO1xuXG4gICAgICAgIHRoaXMudHJhY2sucGxheVRpbWUgPSAodGltZU5vdyAtIHRoaXMudHJhY2suc3RhcnRUaW1lKSArIHRoaXMudHJhY2sucGxheVRpbWVPZmZzZXQ7XG5cbiAgICAgICAgLy8gaWYgdGhlIHBsYXllciBpcyBhdCB0aGUgZW5kIG9mIHRoZSB0cmFja1xuICAgICAgICBpZiAodGhpcy50cmFjay5wbGF5VGltZSA+PSB0aGlzLnRyYWNrLmJ1ZmZlci5kdXJhdGlvbikge1xuXG4gICAgICAgICAgICB0aGlzLnN0b3AoKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMubG9vcFRyYWNrKSB7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnBsYXkoKTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnRyYWNrLnBsYXlsaXN0SWQgIT09IG51bGwpIHtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLmV2ZW50cy50cmlnZ2VyKFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ldmVudHMuY29uc3RhbnRzLlBMQVlMSVNUX05FWFQsXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhY2s6IHRoaXMudHJhY2tcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnRyYWNrLnBsYXllZFRpbWVQZXJjZW50YWdlID0gKHRoaXMudHJhY2sucGxheVRpbWUgLyB0aGlzLnRyYWNrLmJ1ZmZlci5kdXJhdGlvbikgKiAxMDA7XG5cbiAgICAgICAgdGhpcy5ldmVudHMudHJpZ2dlcihcbiAgICAgICAgICAgIHRoaXMuZXZlbnRzLmNvbnN0YW50cy5QTEFZRVJfUExBWUlOR19QUk9HUkVTUyxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBwZXJjZW50YWdlOiB0aGlzLnRyYWNrLnBsYXllZFRpbWVQZXJjZW50YWdlLFxuICAgICAgICAgICAgICAgIHRyYWNrOiB0aGlzLnRyYWNrXG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG5cbiAgICB9OyovXG5cbn1cbiJdfQ==

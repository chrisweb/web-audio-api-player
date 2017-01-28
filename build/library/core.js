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
                // at interval set playing progress
                _this._playingTimeoutID = setInterval(function () {
                    _this._playingProgress(sound);
                }, _this._playingProgressIntervalTime);
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
            // clear the playing progress setInterval
            clearInterval(this._playingTimeoutID);
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
            sound.onPlaying(playingPercentage);
        };
        ;
        return PlayerCore;
    }());
    exports.PlayerCore = PlayerCore;
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9saWJyYXJ5L2NvcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7SUFDQSxZQUFZLENBQUM7SUFFYixpQ0FBOEU7SUFDOUUsaUNBQXNDO0lBQ3RDLHFDQUEwQztJQUMxQyxpQ0FBb0Q7SUFTcEQ7UUFxQ0ksb0JBQVksYUFBMkI7WUFWdkMsWUFBWTtZQUNILDBCQUFxQixHQUFXLFFBQVEsQ0FBQztZQUN6Qyw0QkFBdUIsR0FBVyxTQUFTLENBQUM7WUFDNUMsaUNBQTRCLEdBQVcsY0FBYyxDQUFDO1lBRXRELG9CQUFlLEdBQUcsTUFBTSxDQUFDO1lBQ3pCLHdCQUFtQixHQUFHLFVBQVUsQ0FBQztZQUNqQyxxQkFBZ0IsR0FBRyxPQUFPLENBQUM7WUFDM0Isb0JBQWUsR0FBRyxNQUFNLENBQUM7WUFJOUIsSUFBSSxjQUFjLEdBQUc7Z0JBQ2pCLE1BQU0sRUFBRSxFQUFFO2dCQUNWLFNBQVMsRUFBRSxLQUFLO2dCQUNoQixhQUFhLEVBQUUsRUFBRTtnQkFDakIsMkJBQTJCLEVBQUUsSUFBSTthQUNwQyxDQUFDO1lBRUYsSUFBSSxPQUFPLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsY0FBYyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBRS9ELElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztZQUM5QixJQUFJLENBQUMsY0FBYyxHQUFHLE9BQU8sQ0FBQyxhQUFhLENBQUM7WUFDNUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7WUFDakIsSUFBSSxDQUFDLGFBQWEsR0FBRyxDQUFDLENBQUM7WUFDdkIsSUFBSSxDQUFDLDRCQUE0QixHQUFHLE9BQU8sQ0FBQywyQkFBMkIsQ0FBQztZQUV4RSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFFdkIsQ0FBQztRQUVTLGdDQUFXLEdBQXJCO1lBRUksNENBQTRDO1lBQzVDLElBQUksV0FBVyxHQUFHLElBQUksQ0FBQztZQUV2QixpQ0FB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NUUsS0FBSyxDQUFDLG9CQUFvQixHQUFHLGlCQUFpQixDQUFDO1lBRS9DLEtBQUssQ0FBQyxTQUFTLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUV2QyxDQUFDO1FBQUEsQ0FBQztRQWlETixpQkFBQztJQUFELENBdm1CQSxBQXVtQkMsSUFBQTtJQXZtQlksZ0NBQVUiLCJmaWxlIjoibGlicmFyeS9jb3JlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IFBsYXllclNvdW5kLCBJU291bmQsIElTb3VuZEF0dHJpYnV0ZXMsIElTb3VuZFNvdXJjZSB9IGZyb20gJy4vc291bmQnO1xuaW1wb3J0IHsgUGxheWVyQXVkaW8gfSBmcm9tICcuL2F1ZGlvJztcbmltcG9ydCB7IFBsYXllclJlcXVlc3QgfSBmcm9tICcuL3JlcXVlc3QnO1xuaW1wb3J0IHsgUGxheWVyRXJyb3IsIElQbGF5ZXJFcnJvciB9IGZyb20gJy4vZXJyb3InO1xuXG5leHBvcnQgaW50ZXJmYWNlIElDb3JlT3B0aW9ucyB7XG4gICAgdm9sdW1lPzogbnVtYmVyO1xuICAgIGxvb3BRdWV1ZT86IGJvb2xlYW47XG4gICAgc291bmRzQmFzZVVybD86IHN0cmluZztcbiAgICBwbGF5aW5nUHJvZ3Jlc3NJbnRlcnZhbFRpbWU/OiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBQbGF5ZXJDb3JlIHtcblxuICAgIC8vIGlzIHRoZSB3ZWIgYXVkaW8gQVBJIHN1cHBvcnRlZFxuICAgIHByb3RlY3RlZCBfaXNXZWJBdWRpb0FwaVN1cHBvcnRlZDogYm9vbGVhbjtcbiAgICAvLyB0aGUgc291bmRzIHF1ZXVlXG4gICAgcHJvdGVjdGVkIF9xdWV1ZTogSVNvdW5kW107XG4gICAgLy8gdGhlIHZvbHVtZSAoMCB0byAxMDApXG4gICAgcHJvdGVjdGVkIF92b2x1bWU6IG51bWJlcjtcbiAgICAvLyB0aGUgcHJvZ3Jlc3MgKHNvbmcgcGxheSB0aW1lKVxuICAgIHByb3RlY3RlZCBfcHJvZ3Jlc3M6IG51bWJlcjtcbiAgICAvLyB0aGUgYmFzZSB1cmwgdGhhdCBhbGwgc291bmRzIHdpbGwgaGF2ZSBpbiBjb21tb25cbiAgICBwcm90ZWN0ZWQgX3NvdW5kc0Jhc2VVcmw6IHN0cmluZztcbiAgICAvLyB0aGUgY3VycmVudCBzb3VuZCBpbiBxdWV1ZSBpbmRleFxuICAgIHByb3RlY3RlZCBfY3VycmVudEluZGV4OiBudW1iZXI7XG4gICAgLy8gaW5zdGFuY2Ugb2YgdGhlIGF1ZGlvIGxpYnJhcnkgY2xhc3NcbiAgICBwcm90ZWN0ZWQgX3BsYXllckF1ZGlvOiBQbGF5ZXJBdWRpbztcbiAgICAvLyBwbGF5aW5nIHByb2dyZXNzIHRpbWUgaW50ZXJ2YWxcbiAgICBwcm90ZWN0ZWQgX3BsYXlpbmdQcm9ncmVzc0ludGVydmFsVGltZTogbnVtYmVyO1xuXG4gICAgLy8gcGxheWluZyBwcm9ncmVzcyB0aW1lb3V0SURcbiAgICBwcm90ZWN0ZWQgX3BsYXlpbmdUaW1lb3V0SUQ6IG51bWJlcjtcblxuICAgIC8vIGNhbGxiYWNrIGhvb2tzXG4gICAgcHVibGljIG9uUGxheVN0YXJ0OiAoKSA9PiB2b2lkO1xuICAgIHB1YmxpYyBvblBsYXlpbmc6ICgpID0+IHZvaWQ7XG4gICAgcHVibGljIG9uQnVmZmVyaW5nOiAoKSA9PiB2b2lkO1xuXG4gICAgLy8gY29uc3RhbnRzXG4gICAgcmVhZG9ubHkgV0hFUkVfSU5fUVVFVUVfQVRfRU5EOiBzdHJpbmcgPSAnYXBwZW5kJztcbiAgICByZWFkb25seSBXSEVSRV9JTl9RVUVVRV9BVF9TVEFSVDogc3RyaW5nID0gJ3ByZXBlbmQnO1xuICAgIHJlYWRvbmx5IFdIRVJFX0lOX1FVRVVFX0FGVEVSX0NVUlJFTlQ6IHN0cmluZyA9ICdhZnRlckN1cnJlbnQnO1xuXG4gICAgcmVhZG9ubHkgUExBWV9TT1VORF9ORVhUID0gJ25leHQnO1xuICAgIHJlYWRvbmx5IFBMQVlfU09VTkRfUFJFVklPVVMgPSAncHJldmlvdXMnO1xuICAgIHJlYWRvbmx5IFBMQVlfU09VTkRfRklSU1QgPSAnZmlyc3QnO1xuICAgIHJlYWRvbmx5IFBMQVlfU09VTkRfTEFTVCA9ICdsYXN0JztcblxuICAgIGNvbnN0cnVjdG9yKHBsYXllck9wdGlvbnM6IElDb3JlT3B0aW9ucykge1xuXG4gICAgICAgIGxldCBkZWZhdWx0T3B0aW9ucyA9IHtcbiAgICAgICAgICAgIHZvbHVtZTogODAsXG4gICAgICAgICAgICBsb29wUXVldWU6IGZhbHNlLFxuICAgICAgICAgICAgc291bmRzQmFzZVVybDogJycsXG4gICAgICAgICAgICBwbGF5aW5nUHJvZ3Jlc3NJbnRlcnZhbFRpbWU6IDEwMDBcbiAgICAgICAgfTtcblxuICAgICAgICBsZXQgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRPcHRpb25zLCBwbGF5ZXJPcHRpb25zKTtcblxuICAgICAgICB0aGlzLl92b2x1bWUgPSBvcHRpb25zLnZvbHVtZTtcbiAgICAgICAgdGhpcy5fc291bmRzQmFzZVVybCA9IG9wdGlvbnMuc291bmRzQmFzZVVybDtcbiAgICAgICAgdGhpcy5fcXVldWUgPSBbXTtcbiAgICAgICAgdGhpcy5fY3VycmVudEluZGV4ID0gMDtcbiAgICAgICAgdGhpcy5fcGxheWluZ1Byb2dyZXNzSW50ZXJ2YWxUaW1lID0gb3B0aW9ucy5wbGF5aW5nUHJvZ3Jlc3NJbnRlcnZhbFRpbWU7XG5cbiAgICAgICAgdGhpcy5faW5pdGlhbGl6ZSgpO1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9pbml0aWFsaXplKCkge1xuXG4gICAgICAgIC8vIFRPRE86IGNoZWNrIGlmIHdlYiBhdWRpbyBhcGkgaXMgYXZhaWxhYmxlXG4gICAgICAgIGxldCB3ZWJBdWRpb0FwaSA9IHRydWU7XG5cbiAgICAgICAgLy8gaXMgdGhlIHdlYiBhdWRpbyBhcGkgc3VwcG9ydGVkXG4gICAgICAgIC8vIGlmIG5vdCB3ZSB3aWxsIHVzZSB0aGUgYXVkaW8gZWxlbWVudCBhcyBmYWxsYmFja1xuICAgICAgICBpZiAod2ViQXVkaW9BcGkpIHtcblxuICAgICAgICAgICAgdGhpcy5faXNXZWJBdWRpb0FwaVN1cHBvcnRlZCA9IHRydWU7XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgLy8gdXNlIHRoZSBodG1sNSBhdWRpbyBlbGVtZW50XG4gICAgICAgICAgICB0aGlzLl9pc1dlYkF1ZGlvQXBpU3VwcG9ydGVkID0gZmFsc2U7XG5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHBsYXllciBhdWRpbyBsaWJyYXJ5IGluc3RhbmNlXG4gICAgICAgIHRoaXMuX3BsYXllckF1ZGlvID0gbmV3IFBsYXllckF1ZGlvKCk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgYWRkU291bmRUb1F1ZXVlKHNvdW5kQXR0cmlidXRlczogSVNvdW5kQXR0cmlidXRlcywgd2hlcmVJblF1ZXVlOiBzdHJpbmcgPSB0aGlzLldIRVJFX0lOX1FVRVVFX0FUX0VORCk6IElTb3VuZCB7XG5cbiAgICAgICAgbGV0IHNvdW5kOiBJU291bmQgPSBuZXcgUGxheWVyU291bmQoc291bmRBdHRyaWJ1dGVzKTtcblxuICAgICAgICAvLyBUT0RPOiBpcyBxdWV1ZSBqdXN0IGFuIGFycmF5IG9mIHNvdW5kcywgb3IgZG8gd2UgbmVlZCBzb21ldGhpbmcgbW9yZSBjb21wbGV4IHdpdGggYSBwb3NpdGlvbiB0cmFja2VyP1xuXG4gICAgICAgIC8vIFRPRE86IGFsbG93IGFycmF5IG9mIHNvdW5kQXR0cmlidXRlcyB0byBiZSBpbmplY3RlZCwgdG8gY3JlYXRlIHNldmVyYWwgYXQgb25jZSwgaWYgaW5wdXQgaXMgYW4gYXJyYXkgb3V0cHV0IHNob3VsZCBiZSB0b29cblxuICAgICAgICBzd2l0Y2ggKHdoZXJlSW5RdWV1ZSkge1xuICAgICAgICAgICAgY2FzZSB0aGlzLldIRVJFX0lOX1FVRVVFX0FUX0VORDpcbiAgICAgICAgICAgICAgICB0aGlzLl9hcHBlbmRTb3VuZFRvUXVldWUoc291bmQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSB0aGlzLldIRVJFX0lOX1FVRVVFX0FUX1NUQVJUOlxuICAgICAgICAgICAgICAgIHRoaXMuX3ByZXBlbmRTb3VuZFRvUXVldWUoc291bmQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSB0aGlzLldIRVJFX0lOX1FVRVVFX0FGVEVSX0NVUlJFTlQ6XG4gICAgICAgICAgICAgICAgdGhpcy5fcHJlcGVuZFNvdW5kVG9RdWV1ZShzb3VuZCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc291bmQ7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgX2FwcGVuZFNvdW5kVG9RdWV1ZShzb3VuZDogSVNvdW5kKTogdm9pZCB7XG5cbiAgICAgICAgdGhpcy5fcXVldWUucHVzaChzb3VuZCk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgX3ByZXBlbmRTb3VuZFRvUXVldWUoc291bmQ6IElTb3VuZCk6IHZvaWQge1xuXG4gICAgICAgIHRoaXMuX3F1ZXVlLnVuc2hpZnQoc291bmQpO1xuXG4gICAgfVxuXG4gICAgcHVibGljIF9hZGRTb3VuZFRvUXVldWVBZnRlckN1cnJlbnQoc291bmQ6IElTb3VuZCk6IHZvaWQge1xuXG4gICAgICAgIC8vIFRPRE86IGFkZCBvcHRpb24gdG8gcGxheSBhZnRlciBiZWluZyBhZGRlZCBvciB1c2VyIHVzZXMgcGxheSBtZXRob2Q/XG5cbiAgICAgICAgLy8gaWYgdGhlcmUgaXMgbm8gY3VycmVudCBzb25nIHlldCwgYXBwZW5kIHRoZSBzb25nIHRvIHRoZSBxdWV1ZVxuICAgICAgICBpZiAodGhpcy5fY3VycmVudEluZGV4ID09PSBudWxsKSB7XG5cbiAgICAgICAgICAgIHRoaXMuX2FwcGVuZFNvdW5kVG9RdWV1ZShzb3VuZCk7XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgbGV0IGFmdGVyQ3VycmVudEluZGV4ID0gdGhpcy5fY3VycmVudEluZGV4ICsgMTtcblxuICAgICAgICAgICAgdGhpcy5fcXVldWUuc3BsaWNlKGFmdGVyQ3VycmVudEluZGV4LCAwLCBzb3VuZCk7XG5cbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgcHVibGljIHJlc2V0UXVldWUoKSB7XG5cbiAgICAgICAgdGhpcy5fcXVldWUgPSBbXTtcblxuICAgICAgICAvLyBUT0RPOiBjaGVjayBpZiBhIHNvbmcgaXMgZ2V0dGluZyBwbGF5ZWQgYW5kIHN0b3AgaXQ/XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0UXVldWUoKSB7XG5cbiAgICAgICAgLy8gVE9ETzogaXMgdGhlIG5lZWRlZD9cblxuICAgICAgICByZXR1cm4gdGhpcy5fcXVldWU7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0Vm9sdW1lKHZvbHVtZTogbnVtYmVyKTogdm9pZCB7XG5cbiAgICAgICAgdGhpcy5fdm9sdW1lID0gdm9sdW1lO1xuXG4gICAgICAgIHRoaXMuX3BsYXllckF1ZGlvLmNoYW5nZUdhaW5WYWx1ZSh2b2x1bWUpO1xuXG4gICAgfVxuXG4gICAgcHVibGljIGdldFZvbHVtZSgpOiBudW1iZXIge1xuXG4gICAgICAgIHJldHVybiB0aGlzLl92b2x1bWU7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgbXV0ZSgpIHtcblxuICAgICAgICB0aGlzLnNldFZvbHVtZSgwKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBzZXRQcm9ncmVzcyhwcm9ncmVzczogbnVtYmVyKTogdm9pZCB7XG5cbiAgICAgICAgdGhpcy5fcHJvZ3Jlc3MgPSBwcm9ncmVzcztcblxuICAgIH1cblxuICAgIHB1YmxpYyBnZXRQcm9ncmVzcygpOiBudW1iZXIge1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9wcm9ncmVzcztcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfbG9hZFNvdW5kKHNvdW5kOiBJU291bmQpOiBQcm9taXNlPElTb3VuZCB8IFBsYXllckVycm9yPiB7XG5cbiAgICAgICAgLy8gVE9ETzogd291bGQgYmUgZ29vZCB0byBjYWNoZSBidWZmZXJzLCBzbyBuZWVkIHRvIGNoZWNrIGlmIGlzIGluIGNhY2hlXG4gICAgICAgIC8vIGxldCB0aGUgdXNlciBjaG9vc2UgKGJ5IHNldHRpbmcgYW4gb3B0aW9uKSB3aGF0IGFtb3VudCBvZiBzb3VuZHMgd2lsbCBiZSBjYWNoZWRcbiAgICAgICAgLy8gYWRkIGEgY2FjaGVkIGRhdGUgLyB0aW1lc3RhbXAgdG8gYmUgYWJsZSB0byBjbGVhciBjYWNoZSBieSBvbGRlc3QgZmlyc3RcbiAgICAgICAgLy8gb3IgZXZlbiBiZXR0ZXIgYWRkIGEgcGxheWVkIGNvdW50ZXIgdG8gY2FjaGUgYnkgbGVhc3QgcGxheWVkIGFuZCBkYXRlXG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICAgICAgaWYgKHNvdW5kLnVybCAhPT0gbnVsbCkge1xuXG4gICAgICAgICAgICAgICAgbGV0IHJlcXVlc3QgPSBuZXcgUGxheWVyUmVxdWVzdCgpO1xuXG4gICAgICAgICAgICAgICAgLy8gY2hhbmdlIGJ1ZmZlcmluZyBzdGF0ZVxuICAgICAgICAgICAgICAgIHNvdW5kLmlzQnVmZmVyaW5nID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgIHJlcXVlc3QuZ2V0QXJyYXlCdWZmZXIoc291bmQpLnRoZW4oKGFycmF5QnVmZmVyOiBBcnJheUJ1ZmZlcikgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3BsYXllckF1ZGlvLmRlY29kZUF1ZGlvKGFycmF5QnVmZmVyKS50aGVuKChhdWRpb0J1ZmZlcjogQXVkaW9CdWZmZXIpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgc291bmQuYXVkaW9CdWZmZXIgPSBhdWRpb0J1ZmZlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdW5kLmlzQnVmZmVyaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VuZC5pc0J1ZmZlcmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdW5kLmF1ZGlvQnVmZmVyRGF0ZSA9IG5ldyBEYXRlKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoc291bmQpO1xuXG4gICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKChkZWNvZGVBdWRpb0Vycm9yOiBJUGxheWVyRXJyb3IpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGRlY29kZUF1ZGlvRXJyb3IpO1xuXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goKHJlcXVlc3RFcnJvcjogSVBsYXllckVycm9yKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHJlcXVlc3RFcnJvcik7XG5cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgIGxldCBub1VybEVycm9yID0gbmV3IFBsYXllckVycm9yKCdzb3VuZCBoYXMgbm8gdXJsJywgMSk7XG5cbiAgICAgICAgICAgICAgICByZWplY3Qobm9VcmxFcnJvcik7XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBwbGF5KHdoaWNoU291bmQ/OiBudW1iZXIgfCBzdHJpbmcgfCB1bmRlZmluZWQsIHBsYXlUaW1lT2Zmc2V0PzogbnVtYmVyKTogdm9pZCB7XG5cbiAgICAgICAgLy8gVE9ETzogY2hlY2sgdGhlIGF2YWlsYWJsZSBjb2RlY3MgYW5kIGRlZmluZWQgc291cmNlcywgcGxheSB0aGUgZmlyc3Qgb25lIHRoYXQgaGFzIG1hdGNoZXMgYW5kIGF2YWlsYWJsZSBjb2RlY1xuICAgICAgICAvLyBUT0RPOiBsZXQgdXNlciBkZWZpbmUgb3JkZXIgb2YgcHJlZmVycmVkIGNvZGVjcyBmb3IgcGxheWVyYmFja1xuXG4gICAgICAgIC8vIGdldCB0aGUgY3VycmVudCBzb25nIGlmIGFueVxuICAgICAgICBsZXQgY3VycmVudFNvdW5kID0gdGhpcy5fZ2V0U291bmRGcm9tUXVldWUoKTtcblxuXG4gICAgICAgIC8vIGlmIHRoZXJlIGlzIGEgc291bmQgY3VycmVudGx5IGJlaW5nIHBsYXllZFxuICAgICAgICBpZiAoY3VycmVudFNvdW5kICE9PSBudWxsICYmIGN1cnJlbnRTb3VuZC5pc1BsYXlpbmcpIHtcblxuICAgICAgICAgICAgLy8gc3RvcCB0aGUgY3VycmVudCBzb3VuZFxuICAgICAgICAgICAgdGhpcy5zdG9wKCk7XG5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHdoaWNoU291bmQgaXMgb3B0aW9uYWwsIGlmIHNldCBpdCBjYW4gYmUgdGhlIHNvdW5kIGlkIG9yIGlmIGl0J3MgYSBzdHJpbmcgaXQgY2FuIGJlIG5leHQgLyBwcmV2aW91cyAvIGZpcnN0IC8gbGFzdFxuICAgICAgICBsZXQgc291bmQgPSB0aGlzLl9nZXRTb3VuZEZyb21RdWV1ZSh3aGljaFNvdW5kKTtcblxuICAgICAgICAvLyBpZiB0aGVyZSBpcyBubyBzb3VuZCB3ZSBjb3VsZCBwbGF5LCBkbyBub3RoaW5nXG4gICAgICAgIGlmIChzb3VuZCA9PT0gbnVsbCkge1xuXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgICAgIC8vIFRPRE86IHRocm93IGFuIGVycm9yP1xuXG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiB0aGUgdXNlciB3YW50cyB0byBwbGF5IHRoZSBzb3VuZCBmcm9tIGEgY2VydGFpbiBwb3NpdGlvblxuICAgICAgICBpZiAocGxheVRpbWVPZmZzZXQgIT09IHVuZGVmaW5lZCkge1xuXG4gICAgICAgICAgICBzb3VuZC5wbGF5VGltZU9mZnNldCA9IHBsYXlUaW1lT2Zmc2V0O1xuXG4gICAgICAgIH1cblxuICAgICAgICAvLyBoYXMgdGhlIHNvdW5kIGFscmVhZHkgYmVlbiBsb2FkZWQ/XG4gICAgICAgIGlmICghc291bmQuaXNCdWZmZXJlZCkge1xuXG4gICAgICAgICAgICAvLyBleHRyYWN0IHRoZSB1cmwgYW5kIGNvZGVjIGZyb20gc291cmNlc1xuICAgICAgICAgICAgbGV0IHsgdXJsLCBjb2RlYyA9IG51bGwgfSA9IHRoaXMuX3NvdXJjZVRvVmFyaWFibGVzKHNvdW5kLnNvdXJjZXMpO1xuXG4gICAgICAgICAgICBzb3VuZC51cmwgPSB1cmw7XG4gICAgICAgICAgICBzb3VuZC5jb2RlYyA9IGNvZGVjO1xuXG4gICAgICAgICAgICB0aGlzLl9sb2FkU291bmQoc291bmQpLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fcGxheShzb3VuZCk7XG5cbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnJvcikgPT4ge1xuXG4gICAgICAgICAgICAgICAgLy8gVE9ETzogaGFuZGxlIGVycm9yXG5cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgIHRoaXMuX3BsYXkoc291bmQpO1xuXG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfcGxheShzb3VuZDogSVNvdW5kKSB7XG5cbiAgICAgICAgLy8gc291cmNlIG5vZGUgb3B0aW9uc1xuICAgICAgICBsZXQgc291cmNlTm9kZU9wdGlvbnMgPSB7XG4gICAgICAgICAgICBsb29wOiBzb3VuZC5sb29wXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gY3JlYXRlIGEgbmV3IHNvdXJjZSBub2RlXG4gICAgICAgIHRoaXMuX3BsYXllckF1ZGlvLmNyZWF0ZVNvdXJjZU5vZGUoc291cmNlTm9kZU9wdGlvbnMpLnRoZW4oKHNvdXJjZU5vZGUpID0+IHtcblxuICAgICAgICAgICAgLy8gYWRkIHRoZSBidWZmZXIgdG8gdGhlIHNvdXJjZSBub2RlXG4gICAgICAgICAgICBzb3VyY2VOb2RlLmJ1ZmZlciA9IHNvdW5kLmF1ZGlvQnVmZmVyO1xuXG4gICAgICAgICAgICAvLyB0aGUgYXVkaW9jb250ZXh0IHRpbWUgcmlnaHQgbm93IChzaW5jZSB0aGUgYXVkaW9jb250ZXh0IGdvdCBjcmVhdGVkKVxuICAgICAgICAgICAgc291bmQuc3RhcnRUaW1lID0gc291cmNlTm9kZS5jb250ZXh0LmN1cnJlbnRUaW1lO1xuXG4gICAgICAgICAgICAvLyBjb25uZWN0IHRoZSBzb3VyY2UgdG8gdGhlIGdyYXBoIChkZXN0aW5hdGlvbilcbiAgICAgICAgICAgIHRoaXMuX3BsYXllckF1ZGlvLmNvbm5lY3RTb3VyY2VOb2RlVG9HcmFwaChzb3VyY2VOb2RlKTtcblxuICAgICAgICAgICAgLy8gc3RhcnQgcGxheWJhY2tcbiAgICAgICAgICAgIC8vIHN0YXJ0KHdoZW4sIG9mZnNldCwgZHVyYXRpb24pXG4gICAgICAgICAgICBzb3VyY2VOb2RlLnN0YXJ0KDAsIHNvdW5kLnBsYXlUaW1lT2Zmc2V0KTtcblxuICAgICAgICAgICAgc291bmQuaXNQbGF5aW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIHNvdW5kLnNvdXJjZU5vZGUgPSBzb3VyY2VOb2RlO1xuXG4gICAgICAgICAgICAvLyBhdCBpbnRlcnZhbCBzZXQgcGxheWluZyBwcm9ncmVzc1xuICAgICAgICAgICAgdGhpcy5fcGxheWluZ1RpbWVvdXRJRCA9IHNldEludGVydmFsKCgpID0+IHtcblxuICAgICAgICAgICAgICAgIHRoaXMuX3BsYXlpbmdQcm9ncmVzcyhzb3VuZCk7XG5cbiAgICAgICAgICAgIH0sIHRoaXMuX3BsYXlpbmdQcm9ncmVzc0ludGVydmFsVGltZSk7XG5cbiAgICAgICAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG5cbiAgICAgICAgICAgIC8vIFRPRE86IGhhbmRsZSBlcnJvclxuXG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogd2hpY2hTb3VuZCBpcyBvcHRpb25hbCwgaWYgc2V0IGl0IGNhbiBiZSB0aGUgc291bmQgaWQgb3IgaWYgaXQncyBhIHN0cmluZyBpdCBjYW4gYmUgbmV4dCAvIHByZXZpb3VzIC8gZmlyc3QgLyBsYXN0XG4gICAgICogQHBhcmFtIHdoaWNoU291bmRcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgX2dldFNvdW5kRnJvbVF1ZXVlKHdoaWNoU291bmQ/OiBzdHJpbmcgfCBudW1iZXIpOiBJU291bmQgfCBudWxsIHtcblxuICAgICAgICBsZXQgc291bmQgPSBudWxsO1xuXG4gICAgICAgIC8vIGNoZWNrIGlmIHRoZSBxdWV1ZSBpcyBlbXB0eVxuICAgICAgICBpZiAodGhpcy5fcXVldWUubGVuZ3RoID09PSAwKSB7XG5cbiAgICAgICAgICAgIHJldHVybiBzb3VuZDtcblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgd2hpY2ggc29uZyB0byBwbGF5IGRpZCBub3QgZ2V0IHNwZWNpZmllZCwgcGxheSBvbmUgYmFzZWQgZnJvbSB0aGUgcXVldWUgYmFzZWQgb24gdGhlIHF1ZXVlIGluZGV4IHBvc2l0aW9uIG1hcmtlclxuICAgICAgICBpZiAod2hpY2hTb3VuZCA9PT0gdW5kZWZpbmVkICYmIHRoaXMuX3F1ZXVlW3RoaXMuX2N1cnJlbnRJbmRleF0gIT09IHVuZGVmaW5lZCkge1xuXG4gICAgICAgICAgICBzb3VuZCA9IHRoaXMuX3F1ZXVlW3RoaXMuX2N1cnJlbnRJbmRleF07XG5cbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygd2hpY2hTb3VuZCA9PT0gJ251bWJlcicpIHtcblxuICAgICAgICAgICAgLy8gaWYgd2hpY2ggc29uZyB0byBwbGF5IGlzIGEgbnVtZXJpYyBJRFxuICAgICAgICAgICAgc291bmQgPSB0aGlzLl9maW5kU291bmRCeUlkKHdoaWNoU291bmQpO1xuXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgIC8vIGlmIHdoaWNoIHNvbmcgdG8gcGxheSBpcyBhIGNvbnN0YW50XG4gICAgICAgICAgICBzd2l0Y2ggKHdoaWNoU291bmQpIHtcbiAgICAgICAgICAgICAgICBjYXNlIHRoaXMuUExBWV9TT1VORF9ORVhUOlxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fcXVldWVbdGhpcy5fY3VycmVudEluZGV4ICsgMV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fY3VycmVudEluZGV4ID0gdGhpcy5fY3VycmVudEluZGV4ICsgMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdW5kID0gdGhpcy5fcXVldWVbdGhpcy5fY3VycmVudEluZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIHRoaXMuUExBWV9TT1VORF9QUkVWSU9VUzpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX3F1ZXVlW3RoaXMuX2N1cnJlbnRJbmRleCAtIDFdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRJbmRleCA9IHRoaXMuX2N1cnJlbnRJbmRleCAtIDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VuZCA9IHRoaXMuX3F1ZXVlW3RoaXMuX2N1cnJlbnRJbmRleF07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSB0aGlzLlBMQVlfU09VTkRfRklSU1Q6XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9xdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9jdXJyZW50SW5kZXggPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgc291bmQgPSB0aGlzLl9xdWV1ZVt0aGlzLl9jdXJyZW50SW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgdGhpcy5QTEFZX1NPVU5EX0xBU1Q6XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9xdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9jdXJyZW50SW5kZXggPSB0aGlzLl9xdWV1ZS5sZW5ndGggLSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgc291bmQgPSB0aGlzLl9xdWV1ZVt0aGlzLl9jdXJyZW50SW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIHdoaWNoIHNvbmcgdG8gcGxheSBpcyBhIHN0cmluZyBJRFxuICAgICAgICAgICAgICAgICAgICBzb3VuZCA9IHRoaXMuX2ZpbmRTb3VuZEJ5SWQod2hpY2hTb3VuZCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzb3VuZDtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfZmluZFNvdW5kQnlJZChzb3VuZElkOiBzdHJpbmcgfCBudW1iZXIpOiBJU291bmQgfCBudWxsIHtcblxuICAgICAgICBsZXQgc291bmQgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuX3F1ZXVlLnNvbWUoKHNvdW5kRnJvbVF1ZXVlOiBJU291bmQsIHF1ZXVlSW5kZXg6IG51bWJlcikgPT4ge1xuXG4gICAgICAgICAgICBpZiAoc291bmRGcm9tUXVldWUuaWQgPT09IHNvdW5kSWQpIHtcblxuICAgICAgICAgICAgICAgIHNvdW5kID0gc291bmRGcm9tUXVldWU7XG4gICAgICAgICAgICAgICAgdGhpcy5fY3VycmVudEluZGV4ID0gcXVldWVJbmRleDtcblxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHNvdW5kO1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9zb3VyY2VUb1ZhcmlhYmxlcyhzb3VyY2VzOiAoSVNvdW5kU291cmNlIHwgc3RyaW5nKVtdKTogeyB1cmw6IHN0cmluZyB8IG51bGwsIGNvZGVjPzogc3RyaW5nIHwgbnVsbCB9IHtcblxuICAgICAgICAvLyBUT0RPOiBzb3VyY2UgY2FuIGJlIG9uIG9iamVjdCB3aGVyZSB0aGUgcHJvcGVydHkgbmFtZSBpcyB0aGUgY29kZWMgYW5kIHRoZSB2YWx1ZSBpcyB0aGUgc291bmQgdXJsXG4gICAgICAgIC8vIGlmIHNvdW5kIGlzbnQgYW4gb2JqZWN0IHRyeSB0byBkZXRlY3Qgc291bmQgc291cmNlIGV4dGVuc2lvbiBieSBmaWxlIGV4dGVudGlvbiBvciBieSBjaGVja2luZyB0aGUgZmlsZSBtaW1lIHR5cGVcblxuICAgICAgICAvLyBUT0RPOiBnZXQgYSBsaXN0IG9mIHN1cHBvcnRlZCBjb2RlY3MgYnkgdGhpcyBkZXZpY2VcblxuICAgICAgICBsZXQgZmlyc3RNYXRjaGluZ1NvdXJjZTogeyB1cmw6IHN0cmluZyB8IG51bGwsIGNvZGVjPzogc3RyaW5nIHwgbnVsbCB9ID0ge1xuICAgICAgICAgICAgdXJsOiBudWxsLFxuICAgICAgICAgICAgY29kZWM6IG51bGxcbiAgICAgICAgfTtcblxuICAgICAgICBzb3VyY2VzLmZvckVhY2goKHNvdXJjZSkgPT4ge1xuXG4gICAgICAgICAgICAvLyBUT0RPOiBmaW5kIG91dCB3aGF0IHRoZSBzb3VyY2UgY29kZWMgaXNcblxuICAgICAgICAgICAgLy8gVE9ETzogY2hlY2sgaWYgdGhlIHNvdXJjZSBjb2RlYyBpcyBhbW9uZyB0aGUgb25lcyB0aGF0IGFyZSBzdXBwb3J0ZWQgYnkgdGhpcyBkZXZpY2VcbiAgICAgICAgICAgIC8vaWYgKCkge1xuXG4gICAgICAgICAgICBsZXQgc291bmRVcmwgPSAnJztcblxuICAgICAgICAgICAgLy8gaWYgdGhlIHBsYXllciBoYWQgYXMgb3B0aW9uIGEgYmFzZVVybCBmb3Igc291bmRzIGFkZCBpdCBub3dcbiAgICAgICAgICAgIGlmICh0aGlzLl9zb3VuZHNCYXNlVXJsICE9PSAnJykge1xuICAgICAgICAgICAgICAgIHNvdW5kVXJsID0gdGhpcy5fc291bmRzQmFzZVVybDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gdHdvIGtpbmQgb2Ygc291cmNlIGFyZSBwb3NzaWJsZSwgYSBzdHJpbmcgKHRoZSB1cmwpIG9yIGFuIG9iamVjdCAoa2V5IGlzIHRoZSBjb2RlYyBhbmQgdmFsdWUgaXMgdGhlIHVybClcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc291cmNlID09PSAnc3RyaW5nJykge1xuXG4gICAgICAgICAgICAgICAgc291bmRVcmwgKz0gc291cmNlO1xuXG4gICAgICAgICAgICAgICAgZmlyc3RNYXRjaGluZ1NvdXJjZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBzb3VuZFVybFxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICBzb3VuZFVybCArPSBzb3VyY2UudXJsO1xuXG4gICAgICAgICAgICAgICAgZmlyc3RNYXRjaGluZ1NvdXJjZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBzb3VuZFVybCxcbiAgICAgICAgICAgICAgICAgICAgY29kZWM6IHNvdXJjZS5jb2RlY1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gZmlyc3RNYXRjaGluZ1NvdXJjZTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBwYXVzZSgpIHtcblxuICAgICAgICAvLyBnZXQgdGhlIGN1cnJlbnQgc291bmRcbiAgICAgICAgbGV0IHNvdW5kOiBJU291bmQgfCBudWxsID0gdGhpcy5fZ2V0U291bmRGcm9tUXVldWUoKTtcblxuICAgICAgICBpZiAoc291bmQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCB0aW1lQXRQYXVzZSA9IHNvdW5kLnNvdXJjZU5vZGUuY29udGV4dC5jdXJyZW50VGltZTtcblxuICAgICAgICBzb3VuZC5wbGF5VGltZU9mZnNldCArPSB0aW1lQXRQYXVzZSAtIHNvdW5kLnN0YXJ0VGltZTtcblxuICAgICAgICB0aGlzLl9zdG9wKHNvdW5kKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBzdG9wKCkge1xuXG4gICAgICAgIC8vIGdldCB0aGUgY3VycmVudCBzb3VuZFxuICAgICAgICBsZXQgc291bmQ6IElTb3VuZCB8IG51bGwgPSB0aGlzLl9nZXRTb3VuZEZyb21RdWV1ZSgpO1xuXG4gICAgICAgIGlmIChzb3VuZCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgc291bmQucGxheVRpbWVPZmZzZXQgPSAwO1xuXG4gICAgICAgIHRoaXMuX3N0b3Aoc291bmQpO1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9zdG9wKHNvdW5kOiBJU291bmQpIHtcblxuICAgICAgICAvLyB0ZWxsIHRoZSBzb3VyY2VOb2RlIHRvIHN0b3AgcGxheWluZ1xuICAgICAgICBzb3VuZC5zb3VyY2VOb2RlLnN0b3AoMCk7XG5cbiAgICAgICAgLy8gdGVsbCB0aGUgc291bmQgdGhhdCBwbGF5aW5nIGlzIG92ZXJcbiAgICAgICAgc291bmQuaXNQbGF5aW5nID0gZmFsc2U7XG5cbiAgICAgICAgLy8gZGVzdHJveSB0aGUgc291cmNlIG5vZGUgYXMgaXQgY2FuIGFueXdheSBvbmx5IGdldCB1c2VkIG9uY2VcbiAgICAgICAgdGhpcy5fcGxheWVyQXVkaW8uZGVzdHJveVNvdXJjZU5vZGUoc291bmQuc291cmNlTm9kZSk7XG5cbiAgICAgICAgc291bmQuc291cmNlTm9kZSA9IG51bGw7XG5cbiAgICAgICAgLy8gY2xlYXIgdGhlIHBsYXlpbmcgcHJvZ3Jlc3Mgc2V0SW50ZXJ2YWxcbiAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLl9wbGF5aW5nVGltZW91dElEKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBuZXh0KCkge1xuXG4gICAgICAgIC8vIGFsaWFzIGZvciBwbGF5IG5leHRcbiAgICAgICAgdGhpcy5wbGF5KCduZXh0Jyk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgcHJldmlvdXMoKSB7XG5cbiAgICAgICAgLy8gYWxpYXMgZm9yIHBsYXkgcHJldmlvdXNcbiAgICAgICAgdGhpcy5wbGF5KCdwcmV2aW91cycpO1xuXG4gICAgfVxuXG4gICAgcHVibGljIGZpcnN0KCkge1xuXG4gICAgICAgIC8vIGFsaWFzIGZvciBwbGF5IGZpcnN0XG4gICAgICAgIHRoaXMucGxheSgnZmlyc3QnKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBsYXN0KCkge1xuXG4gICAgICAgIC8vIGFsaWFzIGZvciBwbGF5IGxhc3RcbiAgICAgICAgdGhpcy5wbGF5KCdsYXN0Jyk7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX3BsYXlpbmdQcm9ncmVzcyhzb3VuZDogSVNvdW5kKSB7XG5cbiAgICAgICAgbGV0IHRpbWVOb3cgPSBzb3VuZC5zb3VyY2VOb2RlLmNvbnRleHQuY3VycmVudFRpbWU7XG5cbiAgICAgICAgc291bmQucGxheVRpbWUgPSAodGltZU5vdyAtIHNvdW5kLnN0YXJ0VGltZSkgKyBzb3VuZC5wbGF5VGltZU9mZnNldDtcblxuICAgICAgICBsZXQgcGxheWluZ1BlcmNlbnRhZ2UgPSAoc291bmQucGxheVRpbWUgLyBzb3VuZC5hdWRpb0J1ZmZlci5kdXJhdGlvbikgKiAxMDA7XG5cbiAgICAgICAgc291bmQucGxheWVkVGltZVBlcmNlbnRhZ2UgPSBwbGF5aW5nUGVyY2VudGFnZTtcblxuICAgICAgICBzb3VuZC5vblBsYXlpbmcocGxheWluZ1BlcmNlbnRhZ2UpO1xuXG4gICAgfTtcblxuLypcblxuICAgIHBsYXllci5wcm90b3R5cGUucG9zaXRpb25DaGFuZ2UgPSBmdW5jdGlvbiBwb3NpdGlvbkNoYW5nZUZ1bmN0aW9uKHRyYWNrUG9zaXRpb25JblBlcmNlbnQpIHtcbiAgICAgICAgXG4gICAgICAgIC8vIHN0b3AgdGhlIHRyYWNrIHBsYXliYWNrXG4gICAgICAgIHRoaXMuc3RvcCgpO1xuXG4gICAgICAgIGxldCB0cmFja1Bvc2l0aW9uSW5TZWNvbmRzID0gKHRoaXMudHJhY2suYnVmZmVyLmR1cmF0aW9uIC8gMTAwKSAqIHRyYWNrUG9zaXRpb25JblBlcmNlbnQ7XG5cbiAgICAgICAgdGhpcy50cmFjay5wbGF5VGltZU9mZnNldCA9IHRyYWNrUG9zaXRpb25JblNlY29uZHM7XG5cbiAgICAgICAgLy8gc3RhcnQgdGhlIHBsYXliYWNrIGF0IHRoZSBnaXZlbiBwb3NpdGlvblxuICAgICAgICB0aGlzLnBsYXkoKTtcblxuICAgIH07XG5cbiAgICAqL1xuXG4gICAgLypcblxuICAgICAgICAgICAgLy8gaWYgdGhlIHBsYXllciBpcyBhdCB0aGUgZW5kIG9mIHRoZSB0cmFja1xuICAgICAgICBpZiAoc291bmQucGxheVRpbWUgPj0gc291bmQuYXVkaW9CdWZmZXIuZHVyYXRpb24pIHtcblxuICAgICAgICAgICAgdGhpcy5zdG9wKCk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmxvb3BUcmFjaykge1xuXG4gICAgICAgICAgICAgICAgdGhpcy5wbGF5KCk7XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy50cmFjay5wbGF5bGlzdElkICE9PSBudWxsKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ldmVudHMudHJpZ2dlcihcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZXZlbnRzLmNvbnN0YW50cy5QTEFZTElTVF9ORVhULFxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYWNrOiB0aGlzLnRyYWNrXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG4gICAgKi9cblxufVxuIl19

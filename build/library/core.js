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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9saWJyYXJ5L2NvcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7SUFDQSxZQUFZLENBQUM7SUFFYixpQ0FBOEU7SUFDOUUsaUNBQXNDO0lBQ3RDLHFDQUEwQztJQUMxQyxpQ0FBb0Q7SUFTcEQ7UUFvQ0ksb0JBQVksYUFBMkI7WUFWdkMsWUFBWTtZQUNILDBCQUFxQixHQUFXLFFBQVEsQ0FBQztZQUN6Qyw0QkFBdUIsR0FBVyxTQUFTLENBQUM7WUFDNUMsaUNBQTRCLEdBQVcsY0FBYyxDQUFDO1lBRXRELG9CQUFlLEdBQUcsTUFBTSxDQUFDO1lBQ3pCLHdCQUFtQixHQUFHLFVBQVUsQ0FBQztZQUNqQyxxQkFBZ0IsR0FBRyxPQUFPLENBQUM7WUFDM0Isb0JBQWUsR0FBRyxNQUFNLENBQUM7WUFJOUIsSUFBSSxjQUFjLEdBQUc7Z0JBQ2pCLE1BQU0sRUFBRSxFQUFFO2dCQUNWLFNBQVMsRUFBRSxLQUFLO2dCQUNoQixhQUFhLEVBQUUsRUFBRTtnQkFDakIsMkJBQTJCLEVBQUUsSUFBSTthQUNwQyxDQUFDO1lBRUYsSUFBSSxPQUFPLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsY0FBYyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBRS9ELElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztZQUM5QixJQUFJLENBQUMsY0FBYyxHQUFHLE9BQU8sQ0FBQyxhQUFhLENBQUM7WUFDNUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7WUFDakIsSUFBSSxDQUFDLGFBQWEsR0FBRyxDQUFDLENBQUM7WUFDdkIsSUFBSSxDQUFDLDRCQUE0QixHQUFHLE9BQU8sQ0FBQywyQkFBMkIsQ0FBQztZQUV4RSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFFdkIsQ0FBQztRQUVTLGdDQUFXLEdBQXJCO1lBRUksNENBQTRDO1lBQzVDLElBQUksV0FBVyxHQUFHLElBQUksQ0FBQztZQUV2QixpQ0FB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LENBQUM7WUFFNUUsS0FBSyxDQUFDLG9CQUFvQixHQUFHLGlCQUFpQixDQUFDO1lBRS9DLEtBQUssQ0FBQyxTQUFTLENBQUMsaUJBQWlCLEVBQUUsS0FBSyxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRW5GLENBQUM7UUFBQSxDQUFDO1FBaUROLGlCQUFDO0lBQUQsQ0FqcEJBLEFBaXBCQyxJQUFBO0lBanBCWSxnQ0FBVSIsImZpbGUiOiJsaWJyYXJ5L2NvcmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgUGxheWVyU291bmQsIElTb3VuZCwgSVNvdW5kQXR0cmlidXRlcywgSVNvdW5kU291cmNlIH0gZnJvbSAnLi9zb3VuZCc7XG5pbXBvcnQgeyBQbGF5ZXJBdWRpbyB9IGZyb20gJy4vYXVkaW8nO1xuaW1wb3J0IHsgUGxheWVyUmVxdWVzdCB9IGZyb20gJy4vcmVxdWVzdCc7XG5pbXBvcnQgeyBQbGF5ZXJFcnJvciwgSVBsYXllckVycm9yIH0gZnJvbSAnLi9lcnJvcic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUNvcmVPcHRpb25zIHtcbiAgICB2b2x1bWU/OiBudW1iZXI7XG4gICAgbG9vcFF1ZXVlPzogYm9vbGVhbjtcbiAgICBzb3VuZHNCYXNlVXJsPzogc3RyaW5nO1xuICAgIHBsYXlpbmdQcm9ncmVzc0ludGVydmFsVGltZT86IG51bWJlcjtcbn1cblxuZXhwb3J0IGNsYXNzIFBsYXllckNvcmUge1xuXG4gICAgLy8gaXMgdGhlIHdlYiBhdWRpbyBBUEkgc3VwcG9ydGVkXG4gICAgcHJvdGVjdGVkIF9pc1dlYkF1ZGlvQXBpU3VwcG9ydGVkOiBib29sZWFuO1xuICAgIC8vIHRoZSBzb3VuZHMgcXVldWVcbiAgICBwcm90ZWN0ZWQgX3F1ZXVlOiBJU291bmRbXTtcbiAgICAvLyB0aGUgdm9sdW1lICgwIHRvIDEwMClcbiAgICBwcm90ZWN0ZWQgX3ZvbHVtZTogbnVtYmVyO1xuICAgIC8vIHRoZSBwcm9ncmVzcyAoc29uZyBwbGF5IHRpbWUpXG4gICAgcHJvdGVjdGVkIF9wcm9ncmVzczogbnVtYmVyO1xuICAgIC8vIHRoZSBiYXNlIHVybCB0aGF0IGFsbCBzb3VuZHMgd2lsbCBoYXZlIGluIGNvbW1vblxuICAgIHByb3RlY3RlZCBfc291bmRzQmFzZVVybDogc3RyaW5nO1xuICAgIC8vIHRoZSBjdXJyZW50IHNvdW5kIGluIHF1ZXVlIGluZGV4XG4gICAgcHJvdGVjdGVkIF9jdXJyZW50SW5kZXg6IG51bWJlcjtcbiAgICAvLyBpbnN0YW5jZSBvZiB0aGUgYXVkaW8gbGlicmFyeSBjbGFzc1xuICAgIHByb3RlY3RlZCBfcGxheWVyQXVkaW86IFBsYXllckF1ZGlvO1xuICAgIC8vIHBsYXlpbmcgcHJvZ3Jlc3MgdGltZSBpbnRlcnZhbFxuICAgIHByb3RlY3RlZCBfcGxheWluZ1Byb2dyZXNzSW50ZXJ2YWxUaW1lOiBudW1iZXI7XG4gICAgLy8gcGxheWluZyBwcm9ncmVzcyB0aW1lb3V0SURcbiAgICBwcm90ZWN0ZWQgX3BsYXlpbmdUaW1lb3V0SUQ6IG51bWJlciB8IG51bGw7XG5cbiAgICAvLyBjYWxsYmFjayBob29rc1xuICAgIHB1YmxpYyBvblBsYXlTdGFydDogKCkgPT4gdm9pZDtcbiAgICBwdWJsaWMgb25QbGF5aW5nOiAoKSA9PiB2b2lkO1xuICAgIHB1YmxpYyBvbkJ1ZmZlcmluZzogKCkgPT4gdm9pZDtcblxuICAgIC8vIGNvbnN0YW50c1xuICAgIHJlYWRvbmx5IFdIRVJFX0lOX1FVRVVFX0FUX0VORDogc3RyaW5nID0gJ2FwcGVuZCc7XG4gICAgcmVhZG9ubHkgV0hFUkVfSU5fUVVFVUVfQVRfU1RBUlQ6IHN0cmluZyA9ICdwcmVwZW5kJztcbiAgICByZWFkb25seSBXSEVSRV9JTl9RVUVVRV9BRlRFUl9DVVJSRU5UOiBzdHJpbmcgPSAnYWZ0ZXJDdXJyZW50JztcblxuICAgIHJlYWRvbmx5IFBMQVlfU09VTkRfTkVYVCA9ICduZXh0JztcbiAgICByZWFkb25seSBQTEFZX1NPVU5EX1BSRVZJT1VTID0gJ3ByZXZpb3VzJztcbiAgICByZWFkb25seSBQTEFZX1NPVU5EX0ZJUlNUID0gJ2ZpcnN0JztcbiAgICByZWFkb25seSBQTEFZX1NPVU5EX0xBU1QgPSAnbGFzdCc7XG5cbiAgICBjb25zdHJ1Y3RvcihwbGF5ZXJPcHRpb25zOiBJQ29yZU9wdGlvbnMpIHtcblxuICAgICAgICBsZXQgZGVmYXVsdE9wdGlvbnMgPSB7XG4gICAgICAgICAgICB2b2x1bWU6IDgwLFxuICAgICAgICAgICAgbG9vcFF1ZXVlOiBmYWxzZSxcbiAgICAgICAgICAgIHNvdW5kc0Jhc2VVcmw6ICcnLFxuICAgICAgICAgICAgcGxheWluZ1Byb2dyZXNzSW50ZXJ2YWxUaW1lOiAxMDAwXG4gICAgICAgIH07XG5cbiAgICAgICAgbGV0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0T3B0aW9ucywgcGxheWVyT3B0aW9ucyk7XG5cbiAgICAgICAgdGhpcy5fdm9sdW1lID0gb3B0aW9ucy52b2x1bWU7XG4gICAgICAgIHRoaXMuX3NvdW5kc0Jhc2VVcmwgPSBvcHRpb25zLnNvdW5kc0Jhc2VVcmw7XG4gICAgICAgIHRoaXMuX3F1ZXVlID0gW107XG4gICAgICAgIHRoaXMuX2N1cnJlbnRJbmRleCA9IDA7XG4gICAgICAgIHRoaXMuX3BsYXlpbmdQcm9ncmVzc0ludGVydmFsVGltZSA9IG9wdGlvbnMucGxheWluZ1Byb2dyZXNzSW50ZXJ2YWxUaW1lO1xuXG4gICAgICAgIHRoaXMuX2luaXRpYWxpemUoKTtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfaW5pdGlhbGl6ZSgpIHtcblxuICAgICAgICAvLyBUT0RPOiBjaGVjayBpZiB3ZWIgYXVkaW8gYXBpIGlzIGF2YWlsYWJsZVxuICAgICAgICBsZXQgd2ViQXVkaW9BcGkgPSB0cnVlO1xuXG4gICAgICAgIC8vIGlzIHRoZSB3ZWIgYXVkaW8gYXBpIHN1cHBvcnRlZFxuICAgICAgICAvLyBpZiBub3Qgd2Ugd2lsbCB1c2UgdGhlIGF1ZGlvIGVsZW1lbnQgYXMgZmFsbGJhY2tcbiAgICAgICAgaWYgKHdlYkF1ZGlvQXBpKSB7XG5cbiAgICAgICAgICAgIHRoaXMuX2lzV2ViQXVkaW9BcGlTdXBwb3J0ZWQgPSB0cnVlO1xuXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgIC8vIHVzZSB0aGUgaHRtbDUgYXVkaW8gZWxlbWVudFxuICAgICAgICAgICAgdGhpcy5faXNXZWJBdWRpb0FwaVN1cHBvcnRlZCA9IGZhbHNlO1xuXG4gICAgICAgIH1cblxuICAgICAgICAvLyBwbGF5ZXIgYXVkaW8gbGlicmFyeSBpbnN0YW5jZVxuICAgICAgICB0aGlzLl9wbGF5ZXJBdWRpbyA9IG5ldyBQbGF5ZXJBdWRpbygpO1xuXG4gICAgfVxuXG4gICAgcHVibGljIGFkZFNvdW5kVG9RdWV1ZShzb3VuZEF0dHJpYnV0ZXM6IElTb3VuZEF0dHJpYnV0ZXMsIHdoZXJlSW5RdWV1ZTogc3RyaW5nID0gdGhpcy5XSEVSRV9JTl9RVUVVRV9BVF9FTkQpOiBJU291bmQge1xuXG4gICAgICAgIGxldCBzb3VuZDogSVNvdW5kID0gbmV3IFBsYXllclNvdW5kKHNvdW5kQXR0cmlidXRlcyk7XG5cbiAgICAgICAgLy8gVE9ETzogaXMgcXVldWUganVzdCBhbiBhcnJheSBvZiBzb3VuZHMsIG9yIGRvIHdlIG5lZWQgc29tZXRoaW5nIG1vcmUgY29tcGxleCB3aXRoIGEgcG9zaXRpb24gdHJhY2tlcj9cblxuICAgICAgICAvLyBUT0RPOiBhbGxvdyBhcnJheSBvZiBzb3VuZEF0dHJpYnV0ZXMgdG8gYmUgaW5qZWN0ZWQsIHRvIGNyZWF0ZSBzZXZlcmFsIGF0IG9uY2UsIGlmIGlucHV0IGlzIGFuIGFycmF5IG91dHB1dCBzaG91bGQgYmUgdG9vXG5cbiAgICAgICAgc3dpdGNoICh3aGVyZUluUXVldWUpIHtcbiAgICAgICAgICAgIGNhc2UgdGhpcy5XSEVSRV9JTl9RVUVVRV9BVF9FTkQ6XG4gICAgICAgICAgICAgICAgdGhpcy5fYXBwZW5kU291bmRUb1F1ZXVlKHNvdW5kKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgdGhpcy5XSEVSRV9JTl9RVUVVRV9BVF9TVEFSVDpcbiAgICAgICAgICAgICAgICB0aGlzLl9wcmVwZW5kU291bmRUb1F1ZXVlKHNvdW5kKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgdGhpcy5XSEVSRV9JTl9RVUVVRV9BRlRFUl9DVVJSRU5UOlxuICAgICAgICAgICAgICAgIHRoaXMuX3ByZXBlbmRTb3VuZFRvUXVldWUoc291bmQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHNvdW5kO1xuXG4gICAgfVxuXG4gICAgcHVibGljIF9hcHBlbmRTb3VuZFRvUXVldWUoc291bmQ6IElTb3VuZCk6IHZvaWQge1xuXG4gICAgICAgIHRoaXMuX3F1ZXVlLnB1c2goc291bmQpO1xuXG4gICAgfVxuXG4gICAgcHVibGljIF9wcmVwZW5kU291bmRUb1F1ZXVlKHNvdW5kOiBJU291bmQpOiB2b2lkIHtcblxuICAgICAgICB0aGlzLl9xdWV1ZS51bnNoaWZ0KHNvdW5kKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBfYWRkU291bmRUb1F1ZXVlQWZ0ZXJDdXJyZW50KHNvdW5kOiBJU291bmQpOiB2b2lkIHtcblxuICAgICAgICAvLyBUT0RPOiBhZGQgb3B0aW9uIHRvIHBsYXkgYWZ0ZXIgYmVpbmcgYWRkZWQgb3IgdXNlciB1c2VzIHBsYXkgbWV0aG9kP1xuXG4gICAgICAgIC8vIGlmIHRoZXJlIGlzIG5vIGN1cnJlbnQgc29uZyB5ZXQsIGFwcGVuZCB0aGUgc29uZyB0byB0aGUgcXVldWVcbiAgICAgICAgaWYgKHRoaXMuX2N1cnJlbnRJbmRleCA9PT0gbnVsbCkge1xuXG4gICAgICAgICAgICB0aGlzLl9hcHBlbmRTb3VuZFRvUXVldWUoc291bmQpO1xuXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgIGxldCBhZnRlckN1cnJlbnRJbmRleCA9IHRoaXMuX2N1cnJlbnRJbmRleCArIDE7XG5cbiAgICAgICAgICAgIHRoaXMuX3F1ZXVlLnNwbGljZShhZnRlckN1cnJlbnRJbmRleCwgMCwgc291bmQpO1xuXG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHB1YmxpYyByZXNldFF1ZXVlKCkge1xuXG4gICAgICAgIHRoaXMuX3F1ZXVlID0gW107XG5cbiAgICAgICAgLy8gVE9ETzogY2hlY2sgaWYgYSBzb25nIGlzIGdldHRpbmcgcGxheWVkIGFuZCBzdG9wIGl0P1xuXG4gICAgfVxuXG4gICAgcHVibGljIGdldFF1ZXVlKCkge1xuXG4gICAgICAgIC8vIFRPRE86IGlzIHRoZSBuZWVkZWQ/XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX3F1ZXVlO1xuXG4gICAgfVxuXG4gICAgcHVibGljIHNldFZvbHVtZSh2b2x1bWU6IG51bWJlcik6IHZvaWQge1xuXG4gICAgICAgIHRoaXMuX3ZvbHVtZSA9IHZvbHVtZTtcblxuICAgICAgICB0aGlzLl9wbGF5ZXJBdWRpby5jaGFuZ2VHYWluVmFsdWUodm9sdW1lKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBnZXRWb2x1bWUoKTogbnVtYmVyIHtcblxuICAgICAgICByZXR1cm4gdGhpcy5fdm9sdW1lO1xuXG4gICAgfVxuXG4gICAgcHVibGljIG11dGUoKSB7XG5cbiAgICAgICAgdGhpcy5zZXRWb2x1bWUoMCk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0UHJvZ3Jlc3MocHJvZ3Jlc3M6IG51bWJlcik6IHZvaWQge1xuXG4gICAgICAgIHRoaXMuX3Byb2dyZXNzID0gcHJvZ3Jlc3M7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0UHJvZ3Jlc3MoKTogbnVtYmVyIHtcblxuICAgICAgICByZXR1cm4gdGhpcy5fcHJvZ3Jlc3M7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX2xvYWRTb3VuZChzb3VuZDogSVNvdW5kKTogUHJvbWlzZTxJU291bmQgfCBQbGF5ZXJFcnJvcj4ge1xuXG4gICAgICAgIC8vIFRPRE86IHdvdWxkIGJlIGdvb2QgdG8gY2FjaGUgYnVmZmVycywgc28gbmVlZCB0byBjaGVjayBpZiBpcyBpbiBjYWNoZVxuICAgICAgICAvLyBsZXQgdGhlIHVzZXIgY2hvb3NlIChieSBzZXR0aW5nIGFuIG9wdGlvbikgd2hhdCBhbW91bnQgb2Ygc291bmRzIHdpbGwgYmUgY2FjaGVkXG4gICAgICAgIC8vIGFkZCBhIGNhY2hlZCBkYXRlIC8gdGltZXN0YW1wIHRvIGJlIGFibGUgdG8gY2xlYXIgY2FjaGUgYnkgb2xkZXN0IGZpcnN0XG4gICAgICAgIC8vIG9yIGV2ZW4gYmV0dGVyIGFkZCBhIHBsYXllZCBjb3VudGVyIHRvIGNhY2hlIGJ5IGxlYXN0IHBsYXllZCBhbmQgZGF0ZVxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgICAgIC8vIGlmIHRoZSBzb3VuZCBhbHJlYWR5IGhhcyBhbiBBdWRpb0J1ZmZlclxuICAgICAgICAgICAgaWYgKHNvdW5kLmF1ZGlvQnVmZmVyICE9PSBudWxsKSB7XG5cbiAgICAgICAgICAgICAgICByZXNvbHZlKHNvdW5kKTtcblxuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgIC8vIGlmIHRoZSBzb3VuZCBoYXMgYWxyZWFkeSBhbiBBcnJheUJ1ZmZlciBidXQgbm8gQXVkaW9CdWZmZXJcbiAgICAgICAgICAgIGlmIChzb3VuZC5hcnJheUJ1ZmZlciAhPT0gbnVsbCAmJiBzb3VuZC5hdWRpb0J1ZmZlciA9PT0gbnVsbCkge1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2RlY29kZVNvdW5kKHNvdW5kLCByZXNvbHZlLCByZWplY3QpO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGlmIHRoZSBzb3VuZCBoYXMgbm8gQXJyYXlCdWZmZXIgYW5kIGFsc28gbm8gQXVkaW9CdWZmZXIgeWV0XG4gICAgICAgICAgICBpZiAoc291bmQuYXJyYXlCdWZmZXIgPT09IG51bGwgJiYgc291bmQuYXVkaW9CdWZmZXIgPT09IG51bGwpIHtcblxuICAgICAgICAgICAgICAgIGlmIChzb3VuZC51cmwgIT09IG51bGwpIHtcblxuICAgICAgICAgICAgICAgICAgICBsZXQgcmVxdWVzdCA9IG5ldyBQbGF5ZXJSZXF1ZXN0KCk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gY2hhbmdlIGJ1ZmZlcmluZyBzdGF0ZVxuICAgICAgICAgICAgICAgICAgICBzb3VuZC5pc0J1ZmZlcmluZyA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdC5nZXRBcnJheUJ1ZmZlcihzb3VuZCkudGhlbigoYXJyYXlCdWZmZXI6IEFycmF5QnVmZmVyKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdW5kLmFycmF5QnVmZmVyID0gYXJyYXlCdWZmZXI7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9kZWNvZGVTb3VuZChzb3VuZCwgcmVzb2x2ZSwgcmVqZWN0KTtcblxuICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaCgocmVxdWVzdEVycm9yOiBJUGxheWVyRXJyb3IpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHJlcXVlc3RFcnJvcik7XG5cbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgICAgIGxldCBub1VybEVycm9yID0gbmV3IFBsYXllckVycm9yKCdzb3VuZCBoYXMgbm8gdXJsJywgMSk7XG5cbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KG5vVXJsRXJyb3IpO1xuXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX2RlY29kZVNvdW5kKHNvdW5kOiBJU291bmQsIHJlc29sdmU6IEZ1bmN0aW9uLCByZWplY3Q6IEZ1bmN0aW9uKSB7XG5cbiAgICAgICAgbGV0IGFycmF5QnVmZmVyID0gc291bmQuYXJyYXlCdWZmZXI7XG5cbiAgICAgICAgdGhpcy5fcGxheWVyQXVkaW8uZGVjb2RlQXVkaW8oYXJyYXlCdWZmZXIpLnRoZW4oKGF1ZGlvQnVmZmVyOiBBdWRpb0J1ZmZlcikgPT4ge1xuXG4gICAgICAgICAgICBzb3VuZC5hdWRpb0J1ZmZlciA9IGF1ZGlvQnVmZmVyO1xuICAgICAgICAgICAgc291bmQuaXNCdWZmZXJpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIHNvdW5kLmlzQnVmZmVyZWQgPSB0cnVlO1xuICAgICAgICAgICAgc291bmQuYXVkaW9CdWZmZXJEYXRlID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgIHNvdW5kLmR1cmF0aW9uID0gc291bmQuYXVkaW9CdWZmZXIuZHVyYXRpb247XG5cbiAgICAgICAgICAgIHJlc29sdmUoc291bmQpO1xuXG4gICAgICAgIH0pLmNhdGNoKChkZWNvZGVBdWRpb0Vycm9yOiBJUGxheWVyRXJyb3IpID0+IHtcblxuICAgICAgICAgICAgcmVqZWN0KGRlY29kZUF1ZGlvRXJyb3IpO1xuXG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG4gICAgcHVibGljIHBsYXkod2hpY2hTb3VuZD86IG51bWJlciB8IHN0cmluZyB8IHVuZGVmaW5lZCwgcGxheVRpbWVPZmZzZXQ/OiBudW1iZXIpOiB2b2lkIHtcblxuICAgICAgICAvLyBUT0RPOiBjaGVjayB0aGUgYXZhaWxhYmxlIGNvZGVjcyBhbmQgZGVmaW5lZCBzb3VyY2VzLCBwbGF5IHRoZSBmaXJzdCBvbmUgdGhhdCBoYXMgbWF0Y2hlcyBhbmQgYXZhaWxhYmxlIGNvZGVjXG4gICAgICAgIC8vIFRPRE86IGxldCB1c2VyIGRlZmluZSBvcmRlciBvZiBwcmVmZXJyZWQgY29kZWNzIGZvciBwbGF5ZXJiYWNrXG5cbiAgICAgICAgLy8gZ2V0IHRoZSBjdXJyZW50IHNvbmcgaWYgYW55XG4gICAgICAgIGxldCBjdXJyZW50U291bmQgPSB0aGlzLl9nZXRTb3VuZEZyb21RdWV1ZSgpO1xuXG5cbiAgICAgICAgLy8gaWYgdGhlcmUgaXMgYSBzb3VuZCBjdXJyZW50bHkgYmVpbmcgcGxheWVkXG4gICAgICAgIGlmIChjdXJyZW50U291bmQgIT09IG51bGwgJiYgY3VycmVudFNvdW5kLmlzUGxheWluZykge1xuXG4gICAgICAgICAgICAvLyBzdG9wIHRoZSBjdXJyZW50IHNvdW5kXG4gICAgICAgICAgICB0aGlzLnN0b3AoKTtcblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gd2hpY2hTb3VuZCBpcyBvcHRpb25hbCwgaWYgc2V0IGl0IGNhbiBiZSB0aGUgc291bmQgaWQgb3IgaWYgaXQncyBhIHN0cmluZyBpdCBjYW4gYmUgbmV4dCAvIHByZXZpb3VzIC8gZmlyc3QgLyBsYXN0XG4gICAgICAgIGxldCBzb3VuZCA9IHRoaXMuX2dldFNvdW5kRnJvbVF1ZXVlKHdoaWNoU291bmQpO1xuXG4gICAgICAgIC8vIGlmIHRoZXJlIGlzIG5vIHNvdW5kIHdlIGNvdWxkIHBsYXksIGRvIG5vdGhpbmdcbiAgICAgICAgaWYgKHNvdW5kID09PSBudWxsKSB7XG5cbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAgICAgLy8gVE9ETzogdGhyb3cgYW4gZXJyb3I/XG5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGlmIHRoZSB1c2VyIHdhbnRzIHRvIHBsYXkgdGhlIHNvdW5kIGZyb20gYSBjZXJ0YWluIHBvc2l0aW9uXG4gICAgICAgIGlmIChwbGF5VGltZU9mZnNldCAhPT0gdW5kZWZpbmVkKSB7XG5cbiAgICAgICAgICAgIHNvdW5kLnBsYXlUaW1lT2Zmc2V0ID0gcGxheVRpbWVPZmZzZXQ7XG5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGhhcyB0aGUgc291bmQgYWxyZWFkeSBiZWVuIGxvYWRlZD9cbiAgICAgICAgaWYgKCFzb3VuZC5pc0J1ZmZlcmVkKSB7XG5cbiAgICAgICAgICAgIC8vIGV4dHJhY3QgdGhlIHVybCBhbmQgY29kZWMgZnJvbSBzb3VyY2VzXG4gICAgICAgICAgICBsZXQgeyB1cmwsIGNvZGVjID0gbnVsbCB9ID0gdGhpcy5fc291cmNlVG9WYXJpYWJsZXMoc291bmQuc291cmNlcyk7XG5cbiAgICAgICAgICAgIHNvdW5kLnVybCA9IHVybDtcbiAgICAgICAgICAgIHNvdW5kLmNvZGVjID0gY29kZWM7XG5cbiAgICAgICAgICAgIHRoaXMuX2xvYWRTb3VuZChzb3VuZCkudGhlbigoKSA9PiB7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9wbGF5KHNvdW5kKTtcblxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBoYW5kbGUgZXJyb3JcblxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgdGhpcy5fcGxheShzb3VuZCk7XG5cbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9wbGF5KHNvdW5kOiBJU291bmQpIHtcblxuICAgICAgICAvLyBzb3VyY2Ugbm9kZSBvcHRpb25zXG4gICAgICAgIGxldCBzb3VyY2VOb2RlT3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGxvb3A6IHNvdW5kLmxvb3BcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBjcmVhdGUgYSBuZXcgc291cmNlIG5vZGVcbiAgICAgICAgdGhpcy5fcGxheWVyQXVkaW8uY3JlYXRlU291cmNlTm9kZShzb3VyY2VOb2RlT3B0aW9ucykudGhlbigoc291cmNlTm9kZSkgPT4ge1xuXG4gICAgICAgICAgICBzb3VuZC5pc1BsYXlpbmcgPSB0cnVlO1xuICAgICAgICAgICAgc291bmQuc291cmNlTm9kZSA9IHNvdXJjZU5vZGU7XG5cbiAgICAgICAgICAgIC8vIGFkZCB0aGUgYnVmZmVyIHRvIHRoZSBzb3VyY2Ugbm9kZVxuICAgICAgICAgICAgc291cmNlTm9kZS5idWZmZXIgPSBzb3VuZC5hdWRpb0J1ZmZlcjtcblxuICAgICAgICAgICAgLy8gdGhlIGF1ZGlvY29udGV4dCB0aW1lIHJpZ2h0IG5vdyAoc2luY2UgdGhlIGF1ZGlvY29udGV4dCBnb3QgY3JlYXRlZClcbiAgICAgICAgICAgIHNvdW5kLnN0YXJ0VGltZSA9IHNvdXJjZU5vZGUuY29udGV4dC5jdXJyZW50VGltZTtcblxuICAgICAgICAgICAgLy8gY29ubmVjdCB0aGUgc291cmNlIHRvIHRoZSBncmFwaCAoZGVzdGluYXRpb24pXG4gICAgICAgICAgICB0aGlzLl9wbGF5ZXJBdWRpby5jb25uZWN0U291cmNlTm9kZVRvR3JhcGgoc291cmNlTm9kZSk7XG5cbiAgICAgICAgICAgIC8vIHN0YXJ0IHBsYXliYWNrXG4gICAgICAgICAgICAvLyBzdGFydCh3aGVuLCBvZmZzZXQsIGR1cmF0aW9uKVxuICAgICAgICAgICAgc291cmNlTm9kZS5zdGFydCgwLCBzb3VuZC5wbGF5VGltZU9mZnNldCk7XG5cbiAgICAgICAgICAgIGlmIChzb3VuZC5vblBsYXlpbmcgIT09IG51bGwpIHtcblxuICAgICAgICAgICAgICAgIC8vIGF0IGludGVydmFsIHNldCBwbGF5aW5nIHByb2dyZXNzXG4gICAgICAgICAgICAgICAgdGhpcy5fcGxheWluZ1RpbWVvdXRJRCA9IHNldEludGVydmFsKCgpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wbGF5aW5nUHJvZ3Jlc3Moc291bmQpO1xuXG4gICAgICAgICAgICAgICAgfSwgdGhpcy5fcGxheWluZ1Byb2dyZXNzSW50ZXJ2YWxUaW1lKTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgIHRoaXMuX3BsYXlpbmdUaW1lb3V0SUQgPSBudWxsO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG5cbiAgICAgICAgICAgIC8vIFRPRE86IGhhbmRsZSBlcnJvclxuXG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogd2hpY2hTb3VuZCBpcyBvcHRpb25hbCwgaWYgc2V0IGl0IGNhbiBiZSB0aGUgc291bmQgaWQgb3IgaWYgaXQncyBhIHN0cmluZyBpdCBjYW4gYmUgbmV4dCAvIHByZXZpb3VzIC8gZmlyc3QgLyBsYXN0XG4gICAgICogQHBhcmFtIHdoaWNoU291bmRcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgX2dldFNvdW5kRnJvbVF1ZXVlKHdoaWNoU291bmQ/OiBzdHJpbmcgfCBudW1iZXIpOiBJU291bmQgfCBudWxsIHtcblxuICAgICAgICBsZXQgc291bmQgPSBudWxsO1xuXG4gICAgICAgIC8vIGNoZWNrIGlmIHRoZSBxdWV1ZSBpcyBlbXB0eVxuICAgICAgICBpZiAodGhpcy5fcXVldWUubGVuZ3RoID09PSAwKSB7XG5cbiAgICAgICAgICAgIHJldHVybiBzb3VuZDtcblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgd2hpY2ggc29uZyB0byBwbGF5IGRpZCBub3QgZ2V0IHNwZWNpZmllZCwgcGxheSBvbmUgYmFzZWQgZnJvbSB0aGUgcXVldWUgYmFzZWQgb24gdGhlIHF1ZXVlIGluZGV4IHBvc2l0aW9uIG1hcmtlclxuICAgICAgICBpZiAod2hpY2hTb3VuZCA9PT0gdW5kZWZpbmVkICYmIHRoaXMuX3F1ZXVlW3RoaXMuX2N1cnJlbnRJbmRleF0gIT09IHVuZGVmaW5lZCkge1xuXG4gICAgICAgICAgICBzb3VuZCA9IHRoaXMuX3F1ZXVlW3RoaXMuX2N1cnJlbnRJbmRleF07XG5cbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygd2hpY2hTb3VuZCA9PT0gJ251bWJlcicpIHtcblxuICAgICAgICAgICAgLy8gaWYgd2hpY2ggc29uZyB0byBwbGF5IGlzIGEgbnVtZXJpYyBJRFxuICAgICAgICAgICAgc291bmQgPSB0aGlzLl9maW5kU291bmRCeUlkKHdoaWNoU291bmQpO1xuXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgIC8vIGlmIHdoaWNoIHNvbmcgdG8gcGxheSBpcyBhIGNvbnN0YW50XG4gICAgICAgICAgICBzd2l0Y2ggKHdoaWNoU291bmQpIHtcbiAgICAgICAgICAgICAgICBjYXNlIHRoaXMuUExBWV9TT1VORF9ORVhUOlxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fcXVldWVbdGhpcy5fY3VycmVudEluZGV4ICsgMV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fY3VycmVudEluZGV4ID0gdGhpcy5fY3VycmVudEluZGV4ICsgMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdW5kID0gdGhpcy5fcXVldWVbdGhpcy5fY3VycmVudEluZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIHRoaXMuUExBWV9TT1VORF9QUkVWSU9VUzpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX3F1ZXVlW3RoaXMuX2N1cnJlbnRJbmRleCAtIDFdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRJbmRleCA9IHRoaXMuX2N1cnJlbnRJbmRleCAtIDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VuZCA9IHRoaXMuX3F1ZXVlW3RoaXMuX2N1cnJlbnRJbmRleF07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSB0aGlzLlBMQVlfU09VTkRfRklSU1Q6XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9xdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9jdXJyZW50SW5kZXggPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgc291bmQgPSB0aGlzLl9xdWV1ZVt0aGlzLl9jdXJyZW50SW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgdGhpcy5QTEFZX1NPVU5EX0xBU1Q6XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9xdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9jdXJyZW50SW5kZXggPSB0aGlzLl9xdWV1ZS5sZW5ndGggLSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgc291bmQgPSB0aGlzLl9xdWV1ZVt0aGlzLl9jdXJyZW50SW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIHdoaWNoIHNvbmcgdG8gcGxheSBpcyBhIHN0cmluZyBJRFxuICAgICAgICAgICAgICAgICAgICBzb3VuZCA9IHRoaXMuX2ZpbmRTb3VuZEJ5SWQod2hpY2hTb3VuZCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzb3VuZDtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfZmluZFNvdW5kQnlJZChzb3VuZElkOiBzdHJpbmcgfCBudW1iZXIpOiBJU291bmQgfCBudWxsIHtcblxuICAgICAgICBsZXQgc291bmQgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuX3F1ZXVlLnNvbWUoKHNvdW5kRnJvbVF1ZXVlOiBJU291bmQsIHF1ZXVlSW5kZXg6IG51bWJlcikgPT4ge1xuXG4gICAgICAgICAgICBpZiAoc291bmRGcm9tUXVldWUuaWQgPT09IHNvdW5kSWQpIHtcblxuICAgICAgICAgICAgICAgIHNvdW5kID0gc291bmRGcm9tUXVldWU7XG4gICAgICAgICAgICAgICAgdGhpcy5fY3VycmVudEluZGV4ID0gcXVldWVJbmRleDtcblxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHNvdW5kO1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9zb3VyY2VUb1ZhcmlhYmxlcyhzb3VyY2VzOiAoSVNvdW5kU291cmNlIHwgc3RyaW5nKVtdKTogeyB1cmw6IHN0cmluZyB8IG51bGwsIGNvZGVjPzogc3RyaW5nIHwgbnVsbCB9IHtcblxuICAgICAgICAvLyBUT0RPOiBzb3VyY2UgY2FuIGJlIG9uIG9iamVjdCB3aGVyZSB0aGUgcHJvcGVydHkgbmFtZSBpcyB0aGUgY29kZWMgYW5kIHRoZSB2YWx1ZSBpcyB0aGUgc291bmQgdXJsXG4gICAgICAgIC8vIGlmIHNvdW5kIGlzbnQgYW4gb2JqZWN0IHRyeSB0byBkZXRlY3Qgc291bmQgc291cmNlIGV4dGVuc2lvbiBieSBmaWxlIGV4dGVudGlvbiBvciBieSBjaGVja2luZyB0aGUgZmlsZSBtaW1lIHR5cGVcblxuICAgICAgICAvLyBUT0RPOiBnZXQgYSBsaXN0IG9mIHN1cHBvcnRlZCBjb2RlY3MgYnkgdGhpcyBkZXZpY2VcblxuICAgICAgICBsZXQgZmlyc3RNYXRjaGluZ1NvdXJjZTogeyB1cmw6IHN0cmluZyB8IG51bGwsIGNvZGVjPzogc3RyaW5nIHwgbnVsbCB9ID0ge1xuICAgICAgICAgICAgdXJsOiBudWxsLFxuICAgICAgICAgICAgY29kZWM6IG51bGxcbiAgICAgICAgfTtcblxuICAgICAgICBzb3VyY2VzLmZvckVhY2goKHNvdXJjZSkgPT4ge1xuXG4gICAgICAgICAgICAvLyBUT0RPOiBmaW5kIG91dCB3aGF0IHRoZSBzb3VyY2UgY29kZWMgaXNcblxuICAgICAgICAgICAgLy8gVE9ETzogY2hlY2sgaWYgdGhlIHNvdXJjZSBjb2RlYyBpcyBhbW9uZyB0aGUgb25lcyB0aGF0IGFyZSBzdXBwb3J0ZWQgYnkgdGhpcyBkZXZpY2VcbiAgICAgICAgICAgIC8vaWYgKCkge1xuXG4gICAgICAgICAgICBsZXQgc291bmRVcmwgPSAnJztcblxuICAgICAgICAgICAgLy8gaWYgdGhlIHBsYXllciBoYWQgYXMgb3B0aW9uIGEgYmFzZVVybCBmb3Igc291bmRzIGFkZCBpdCBub3dcbiAgICAgICAgICAgIGlmICh0aGlzLl9zb3VuZHNCYXNlVXJsICE9PSAnJykge1xuICAgICAgICAgICAgICAgIHNvdW5kVXJsID0gdGhpcy5fc291bmRzQmFzZVVybDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gdHdvIGtpbmQgb2Ygc291cmNlIGFyZSBwb3NzaWJsZSwgYSBzdHJpbmcgKHRoZSB1cmwpIG9yIGFuIG9iamVjdCAoa2V5IGlzIHRoZSBjb2RlYyBhbmQgdmFsdWUgaXMgdGhlIHVybClcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc291cmNlID09PSAnc3RyaW5nJykge1xuXG4gICAgICAgICAgICAgICAgc291bmRVcmwgKz0gc291cmNlO1xuXG4gICAgICAgICAgICAgICAgZmlyc3RNYXRjaGluZ1NvdXJjZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBzb3VuZFVybFxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICBzb3VuZFVybCArPSBzb3VyY2UudXJsO1xuXG4gICAgICAgICAgICAgICAgZmlyc3RNYXRjaGluZ1NvdXJjZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBzb3VuZFVybCxcbiAgICAgICAgICAgICAgICAgICAgY29kZWM6IHNvdXJjZS5jb2RlY1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gZmlyc3RNYXRjaGluZ1NvdXJjZTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBwYXVzZSgpIHtcblxuICAgICAgICAvLyBnZXQgdGhlIGN1cnJlbnQgc291bmRcbiAgICAgICAgbGV0IHNvdW5kOiBJU291bmQgfCBudWxsID0gdGhpcy5fZ2V0U291bmRGcm9tUXVldWUoKTtcblxuICAgICAgICBpZiAoc291bmQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCB0aW1lQXRQYXVzZSA9IHNvdW5kLnNvdXJjZU5vZGUuY29udGV4dC5jdXJyZW50VGltZTtcblxuICAgICAgICBzb3VuZC5wbGF5VGltZU9mZnNldCArPSB0aW1lQXRQYXVzZSAtIHNvdW5kLnN0YXJ0VGltZTtcblxuICAgICAgICB0aGlzLl9zdG9wKHNvdW5kKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBzdG9wKCkge1xuXG4gICAgICAgIC8vIGdldCB0aGUgY3VycmVudCBzb3VuZFxuICAgICAgICBsZXQgc291bmQ6IElTb3VuZCB8IG51bGwgPSB0aGlzLl9nZXRTb3VuZEZyb21RdWV1ZSgpO1xuXG4gICAgICAgIGlmIChzb3VuZCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgc291bmQucGxheVRpbWVPZmZzZXQgPSAwO1xuXG4gICAgICAgIHRoaXMuX3N0b3Aoc291bmQpO1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9zdG9wKHNvdW5kOiBJU291bmQpIHtcblxuICAgICAgICAvLyB0ZWxsIHRoZSBzb3VyY2VOb2RlIHRvIHN0b3AgcGxheWluZ1xuICAgICAgICBzb3VuZC5zb3VyY2VOb2RlLnN0b3AoMCk7XG5cbiAgICAgICAgLy8gdGVsbCB0aGUgc291bmQgdGhhdCBwbGF5aW5nIGlzIG92ZXJcbiAgICAgICAgc291bmQuaXNQbGF5aW5nID0gZmFsc2U7XG5cbiAgICAgICAgLy8gZGVzdHJveSB0aGUgc291cmNlIG5vZGUgYXMgaXQgY2FuIGFueXdheSBvbmx5IGdldCB1c2VkIG9uY2VcbiAgICAgICAgdGhpcy5fcGxheWVyQXVkaW8uZGVzdHJveVNvdXJjZU5vZGUoc291bmQuc291cmNlTm9kZSk7XG5cbiAgICAgICAgc291bmQuc291cmNlTm9kZSA9IG51bGw7XG5cbiAgICAgICAgaWYgKHRoaXMuX3BsYXlpbmdUaW1lb3V0SUQgIT09IG51bGwpIHtcblxuICAgICAgICAgICAgLy8gY2xlYXIgdGhlIHBsYXlpbmcgcHJvZ3Jlc3Mgc2V0SW50ZXJ2YWxcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5fcGxheWluZ1RpbWVvdXRJRCk7XG5cbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgcHVibGljIG5leHQoKSB7XG5cbiAgICAgICAgLy8gYWxpYXMgZm9yIHBsYXkgbmV4dFxuICAgICAgICB0aGlzLnBsYXkoJ25leHQnKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBwcmV2aW91cygpIHtcblxuICAgICAgICAvLyBhbGlhcyBmb3IgcGxheSBwcmV2aW91c1xuICAgICAgICB0aGlzLnBsYXkoJ3ByZXZpb3VzJyk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgZmlyc3QoKSB7XG5cbiAgICAgICAgLy8gYWxpYXMgZm9yIHBsYXkgZmlyc3RcbiAgICAgICAgdGhpcy5wbGF5KCdmaXJzdCcpO1xuXG4gICAgfVxuXG4gICAgcHVibGljIGxhc3QoKSB7XG5cbiAgICAgICAgLy8gYWxpYXMgZm9yIHBsYXkgbGFzdFxuICAgICAgICB0aGlzLnBsYXkoJ2xhc3QnKTtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfcGxheWluZ1Byb2dyZXNzKHNvdW5kOiBJU291bmQpIHtcblxuICAgICAgICBsZXQgdGltZU5vdyA9IHNvdW5kLnNvdXJjZU5vZGUuY29udGV4dC5jdXJyZW50VGltZTtcblxuICAgICAgICBzb3VuZC5wbGF5VGltZSA9ICh0aW1lTm93IC0gc291bmQuc3RhcnRUaW1lKSArIHNvdW5kLnBsYXlUaW1lT2Zmc2V0O1xuXG4gICAgICAgIGxldCBwbGF5aW5nUGVyY2VudGFnZSA9IChzb3VuZC5wbGF5VGltZSAvIHNvdW5kLmF1ZGlvQnVmZmVyLmR1cmF0aW9uKSAqIDEwMDtcblxuICAgICAgICBzb3VuZC5wbGF5ZWRUaW1lUGVyY2VudGFnZSA9IHBsYXlpbmdQZXJjZW50YWdlO1xuXG4gICAgICAgIHNvdW5kLm9uUGxheWluZyhwbGF5aW5nUGVyY2VudGFnZSwgc291bmQuYXVkaW9CdWZmZXIuZHVyYXRpb24sIHNvdW5kLnBsYXlUaW1lKTtcblxuICAgIH07XG5cbi8qXG5cbiAgICBwbGF5ZXIucHJvdG90eXBlLnBvc2l0aW9uQ2hhbmdlID0gZnVuY3Rpb24gcG9zaXRpb25DaGFuZ2VGdW5jdGlvbih0cmFja1Bvc2l0aW9uSW5QZXJjZW50KSB7XG4gICAgICAgIFxuICAgICAgICAvLyBzdG9wIHRoZSB0cmFjayBwbGF5YmFja1xuICAgICAgICB0aGlzLnN0b3AoKTtcblxuICAgICAgICBsZXQgdHJhY2tQb3NpdGlvbkluU2Vjb25kcyA9ICh0aGlzLnRyYWNrLmJ1ZmZlci5kdXJhdGlvbiAvIDEwMCkgKiB0cmFja1Bvc2l0aW9uSW5QZXJjZW50O1xuXG4gICAgICAgIHRoaXMudHJhY2sucGxheVRpbWVPZmZzZXQgPSB0cmFja1Bvc2l0aW9uSW5TZWNvbmRzO1xuXG4gICAgICAgIC8vIHN0YXJ0IHRoZSBwbGF5YmFjayBhdCB0aGUgZ2l2ZW4gcG9zaXRpb25cbiAgICAgICAgdGhpcy5wbGF5KCk7XG5cbiAgICB9O1xuXG4gICAgKi9cblxuICAgIC8qXG5cbiAgICAgICAgICAgIC8vIGlmIHRoZSBwbGF5ZXIgaXMgYXQgdGhlIGVuZCBvZiB0aGUgdHJhY2tcbiAgICAgICAgaWYgKHNvdW5kLnBsYXlUaW1lID49IHNvdW5kLmF1ZGlvQnVmZmVyLmR1cmF0aW9uKSB7XG5cbiAgICAgICAgICAgIHRoaXMuc3RvcCgpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5sb29wVHJhY2spIHtcblxuICAgICAgICAgICAgICAgIHRoaXMucGxheSgpO1xuXG4gICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudHJhY2sucGxheWxpc3RJZCAhPT0gbnVsbCkge1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXZlbnRzLnRyaWdnZXIoXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmV2ZW50cy5jb25zdGFudHMuUExBWUxJU1RfTkVYVCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFjazogdGhpcy50cmFja1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuICAgICovXG5cbn1cbiJdfQ==

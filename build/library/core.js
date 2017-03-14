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
                // trigger resumed event
                if (sound.onResumed !== null && !sound.firstTimePlayed) {
                    sound.onResumed(sound.playTimeOffset);
                }
                // trigger started event
                if (sound.onStarted !== null && sound.firstTimePlayed) {
                    sound.onStarted(sound.playTimeOffset);
                    sound.firstTimePlayed = false;
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
                // reset the is first time sound is being played to true
                currentSound.firstTimePlayed = true;
                // reset the playTimeOffset
                currentSound.playTimeOffset = 0;
                this._stop(currentSound);
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
            // trigger paused event
            if (sound.onPaused !== null) {
                sound.onPaused(sound.playTimeOffset);
            }
            this._stop(sound);
        };
        PlayerCore.prototype.stop = function () {
            // get the current sound
            var sound = this._getSoundFromQueue();
            if (sound === null) {
                return;
            }
            // reset the is first time sound is being played to true
            sound.firstTimePlayed = true;
            // trigger stopped event
            if (sound.onStopped !== null) {
                sound.onStopped(sound.playTimeOffset);
            }
            // reset the playTimeOffset
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,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bmltcG9ydCB7IFBsYXllclNvdW5kLCBJU291bmQsIElTb3VuZEF0dHJpYnV0ZXMsIElTb3VuZFNvdXJjZSB9IGZyb20gJy4vc291bmQnO1xuaW1wb3J0IHsgUGxheWVyQXVkaW8gfSBmcm9tICcuL2F1ZGlvJztcbmltcG9ydCB7IFBsYXllclJlcXVlc3QgfSBmcm9tICcuL3JlcXVlc3QnO1xuaW1wb3J0IHsgUGxheWVyRXJyb3IsIElQbGF5ZXJFcnJvciB9IGZyb20gJy4vZXJyb3InO1xuXG5leHBvcnQgaW50ZXJmYWNlIElDb3JlT3B0aW9ucyB7XG4gICAgdm9sdW1lPzogbnVtYmVyO1xuICAgIGxvb3BRdWV1ZT86IGJvb2xlYW47XG4gICAgc291bmRzQmFzZVVybD86IHN0cmluZztcbiAgICBwbGF5aW5nUHJvZ3Jlc3NJbnRlcnZhbFRpbWU/OiBudW1iZXI7XG4gICAgcGxheU5leHRPbkVuZGVkPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNsYXNzIFBsYXllckNvcmUge1xuXG4gICAgLy8gaXMgdGhlIHdlYiBhdWRpbyBBUEkgc3VwcG9ydGVkXG4gICAgcHJvdGVjdGVkIF9pc1dlYkF1ZGlvQXBpU3VwcG9ydGVkOiBib29sZWFuO1xuICAgIC8vIHRoZSBzb3VuZHMgcXVldWVcbiAgICBwcm90ZWN0ZWQgX3F1ZXVlOiBJU291bmRbXTtcbiAgICAvLyB0aGUgdm9sdW1lICgwIHRvIDEwMClcbiAgICBwcm90ZWN0ZWQgX3ZvbHVtZTogbnVtYmVyO1xuICAgIC8vIHRoZSBiYXNlIHVybCB0aGF0IGFsbCBzb3VuZHMgd2lsbCBoYXZlIGluIGNvbW1vblxuICAgIHByb3RlY3RlZCBfc291bmRzQmFzZVVybDogc3RyaW5nO1xuICAgIC8vIHRoZSBjdXJyZW50IHNvdW5kIGluIHF1ZXVlIGluZGV4XG4gICAgcHJvdGVjdGVkIF9jdXJyZW50SW5kZXg6IG51bWJlcjtcbiAgICAvLyBpbnN0YW5jZSBvZiB0aGUgYXVkaW8gbGlicmFyeSBjbGFzc1xuICAgIHByb3RlY3RlZCBfcGxheWVyQXVkaW86IFBsYXllckF1ZGlvO1xuICAgIC8vIHBsYXlpbmcgcHJvZ3Jlc3MgdGltZSBpbnRlcnZhbFxuICAgIHByb3RlY3RlZCBfcGxheWluZ1Byb2dyZXNzSW50ZXJ2YWxUaW1lOiBudW1iZXI7XG4gICAgLy8gcGxheWluZyBwcm9ncmVzcyB0aW1lb3V0SURcbiAgICBwcm90ZWN0ZWQgX3BsYXlpbmdUaW1lb3V0SUQ6IG51bWJlciB8IG51bGw7XG4gICAgLy8gd2hlbiBhIHNvbmcgZmluaXNoZXMsIGF1dG9tYXRpY2FsbHkgcGxheSB0aGUgbmV4dCBvbmVcbiAgICBwcm90ZWN0ZWQgX3BsYXlOZXh0T25FbmRlZDogYm9vbGVhbjtcbiAgICAvLyBkbyB3ZSBzdGFydCBvdmVyIGdhaW4gYXQgdGhlIGVuZCBvZiB0aGUgcXVldWVcbiAgICBwcm90ZWN0ZWQgX2xvb3BRdWV1ZTogYm9vbGVhbjtcblxuICAgIC8vIGNvbnN0YW50c1xuICAgIHJlYWRvbmx5IFdIRVJFX0lOX1FVRVVFX0FUX0VORDogc3RyaW5nID0gJ2FwcGVuZCc7XG4gICAgcmVhZG9ubHkgV0hFUkVfSU5fUVVFVUVfQVRfU1RBUlQ6IHN0cmluZyA9ICdwcmVwZW5kJztcbiAgICByZWFkb25seSBXSEVSRV9JTl9RVUVVRV9BRlRFUl9DVVJSRU5UOiBzdHJpbmcgPSAnYWZ0ZXJDdXJyZW50JztcblxuICAgIHJlYWRvbmx5IFBMQVlfU09VTkRfTkVYVCA9ICduZXh0JztcbiAgICByZWFkb25seSBQTEFZX1NPVU5EX1BSRVZJT1VTID0gJ3ByZXZpb3VzJztcbiAgICByZWFkb25seSBQTEFZX1NPVU5EX0ZJUlNUID0gJ2ZpcnN0JztcbiAgICByZWFkb25seSBQTEFZX1NPVU5EX0xBU1QgPSAnbGFzdCc7XG5cbiAgICBjb25zdHJ1Y3RvcihwbGF5ZXJPcHRpb25zOiBJQ29yZU9wdGlvbnMgPSB7fSkge1xuXG4gICAgICAgIGxldCBkZWZhdWx0T3B0aW9ucyA9IHtcbiAgICAgICAgICAgIHZvbHVtZTogODAsXG4gICAgICAgICAgICBsb29wUXVldWU6IGZhbHNlLFxuICAgICAgICAgICAgc291bmRzQmFzZVVybDogJycsXG4gICAgICAgICAgICBwbGF5aW5nUHJvZ3Jlc3NJbnRlcnZhbFRpbWU6IDEwMDAsXG4gICAgICAgICAgICBwbGF5TmV4dE9uRW5kZWQ6IHRydWVcbiAgICAgICAgfTtcblxuICAgICAgICBsZXQgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRPcHRpb25zLCBwbGF5ZXJPcHRpb25zKTtcblxuICAgICAgICB0aGlzLl92b2x1bWUgPSBvcHRpb25zLnZvbHVtZTtcbiAgICAgICAgdGhpcy5fc291bmRzQmFzZVVybCA9IG9wdGlvbnMuc291bmRzQmFzZVVybDtcbiAgICAgICAgdGhpcy5fcXVldWUgPSBbXTtcbiAgICAgICAgdGhpcy5fY3VycmVudEluZGV4ID0gMDtcbiAgICAgICAgdGhpcy5fcGxheWluZ1Byb2dyZXNzSW50ZXJ2YWxUaW1lID0gb3B0aW9ucy5wbGF5aW5nUHJvZ3Jlc3NJbnRlcnZhbFRpbWU7XG4gICAgICAgIHRoaXMuX3BsYXlOZXh0T25FbmRlZCA9IG9wdGlvbnMucGxheU5leHRPbkVuZGVkO1xuICAgICAgICB0aGlzLl9sb29wUXVldWUgPSBvcHRpb25zLmxvb3BRdWV1ZTtcblxuICAgICAgICB0aGlzLl9pbml0aWFsaXplKCk7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX2luaXRpYWxpemUoKSB7XG5cbiAgICAgICAgLy8gVE9ETzogY2hlY2sgaWYgd2ViIGF1ZGlvIGFwaSBpcyBhdmFpbGFibGVcbiAgICAgICAgbGV0IHdlYkF1ZGlvQXBpID0gdHJ1ZTtcblxuICAgICAgICAvLyBpcyB0aGUgd2ViIGF1ZGlvIGFwaSBzdXBwb3J0ZWRcbiAgICAgICAgLy8gaWYgbm90IHdlIHdpbGwgdXNlIHRoZSBhdWRpbyBlbGVtZW50IGFzIGZhbGxiYWNrXG4gICAgICAgIGlmICh3ZWJBdWRpb0FwaSkge1xuXG4gICAgICAgICAgICB0aGlzLl9pc1dlYkF1ZGlvQXBpU3VwcG9ydGVkID0gdHJ1ZTtcblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAvLyB1c2UgdGhlIGh0bWw1IGF1ZGlvIGVsZW1lbnRcbiAgICAgICAgICAgIHRoaXMuX2lzV2ViQXVkaW9BcGlTdXBwb3J0ZWQgPSBmYWxzZTtcblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gcGxheWVyIGF1ZGlvIGxpYnJhcnkgaW5zdGFuY2VcbiAgICAgICAgdGhpcy5fcGxheWVyQXVkaW8gPSBuZXcgUGxheWVyQXVkaW8oKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBhZGRTb3VuZFRvUXVldWUoc291bmRBdHRyaWJ1dGVzOiBJU291bmRBdHRyaWJ1dGVzLCB3aGVyZUluUXVldWU6IHN0cmluZyA9IHRoaXMuV0hFUkVfSU5fUVVFVUVfQVRfRU5EKTogSVNvdW5kIHtcblxuICAgICAgICBsZXQgc291bmQ6IElTb3VuZCA9IG5ldyBQbGF5ZXJTb3VuZChzb3VuZEF0dHJpYnV0ZXMpO1xuXG4gICAgICAgIC8vIFRPRE86IGlzIHF1ZXVlIGp1c3QgYW4gYXJyYXkgb2Ygc291bmRzLCBvciBkbyB3ZSBuZWVkIHNvbWV0aGluZyBtb3JlIGNvbXBsZXggd2l0aCBhIHBvc2l0aW9uIHRyYWNrZXI/XG5cbiAgICAgICAgLy8gVE9ETzogYWxsb3cgYXJyYXkgb2Ygc291bmRBdHRyaWJ1dGVzIHRvIGJlIGluamVjdGVkLCB0byBjcmVhdGUgc2V2ZXJhbCBhdCBvbmNlLCBpZiBpbnB1dCBpcyBhbiBhcnJheSBvdXRwdXQgc2hvdWxkIGJlIHRvb1xuXG4gICAgICAgIHN3aXRjaCAod2hlcmVJblF1ZXVlKSB7XG4gICAgICAgICAgICBjYXNlIHRoaXMuV0hFUkVfSU5fUVVFVUVfQVRfRU5EOlxuICAgICAgICAgICAgICAgIHRoaXMuX2FwcGVuZFNvdW5kVG9RdWV1ZShzb3VuZCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIHRoaXMuV0hFUkVfSU5fUVVFVUVfQVRfU1RBUlQ6XG4gICAgICAgICAgICAgICAgdGhpcy5fcHJlcGVuZFNvdW5kVG9RdWV1ZShzb3VuZCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIHRoaXMuV0hFUkVfSU5fUVVFVUVfQUZURVJfQ1VSUkVOVDpcbiAgICAgICAgICAgICAgICB0aGlzLl9wcmVwZW5kU291bmRUb1F1ZXVlKHNvdW5kKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzb3VuZDtcblxuICAgIH1cblxuICAgIHB1YmxpYyBfYXBwZW5kU291bmRUb1F1ZXVlKHNvdW5kOiBJU291bmQpOiB2b2lkIHtcblxuICAgICAgICB0aGlzLl9xdWV1ZS5wdXNoKHNvdW5kKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBfcHJlcGVuZFNvdW5kVG9RdWV1ZShzb3VuZDogSVNvdW5kKTogdm9pZCB7XG5cbiAgICAgICAgdGhpcy5fcXVldWUudW5zaGlmdChzb3VuZCk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgX2FkZFNvdW5kVG9RdWV1ZUFmdGVyQ3VycmVudChzb3VuZDogSVNvdW5kKTogdm9pZCB7XG5cbiAgICAgICAgLy8gVE9ETzogYWRkIG9wdGlvbiB0byBwbGF5IGFmdGVyIGJlaW5nIGFkZGVkIG9yIHVzZXIgdXNlcyBwbGF5IG1ldGhvZD9cblxuICAgICAgICAvLyBpZiB0aGVyZSBpcyBubyBjdXJyZW50IHNvbmcgeWV0LCBhcHBlbmQgdGhlIHNvbmcgdG8gdGhlIHF1ZXVlXG4gICAgICAgIGlmICh0aGlzLl9jdXJyZW50SW5kZXggPT09IG51bGwpIHtcblxuICAgICAgICAgICAgdGhpcy5fYXBwZW5kU291bmRUb1F1ZXVlKHNvdW5kKTtcblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICBsZXQgYWZ0ZXJDdXJyZW50SW5kZXggPSB0aGlzLl9jdXJyZW50SW5kZXggKyAxO1xuXG4gICAgICAgICAgICB0aGlzLl9xdWV1ZS5zcGxpY2UoYWZ0ZXJDdXJyZW50SW5kZXgsIDAsIHNvdW5kKTtcblxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgcmVzZXRRdWV1ZSgpIHtcblxuICAgICAgICB0aGlzLl9xdWV1ZSA9IFtdO1xuXG4gICAgICAgIC8vIFRPRE86IGNoZWNrIGlmIGEgc29uZyBpcyBnZXR0aW5nIHBsYXllZCBhbmQgc3RvcCBpdD9cblxuICAgIH1cblxuICAgIHB1YmxpYyBnZXRRdWV1ZSgpIHtcblxuICAgICAgICAvLyBUT0RPOiBpcyB0aGUgbmVlZGVkP1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9xdWV1ZTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBzZXRWb2x1bWUodm9sdW1lOiBudW1iZXIpOiB2b2lkIHtcblxuICAgICAgICB0aGlzLl92b2x1bWUgPSB2b2x1bWU7XG5cbiAgICAgICAgdGhpcy5fcGxheWVyQXVkaW8uY2hhbmdlR2FpblZhbHVlKHZvbHVtZSk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0Vm9sdW1lKCk6IG51bWJlciB7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX3ZvbHVtZTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBtdXRlKCkge1xuXG4gICAgICAgIHRoaXMuc2V0Vm9sdW1lKDApO1xuXG4gICAgfVxuXG4gICAgcHVibGljIHNldFBvc2l0aW9uKHNvdW5kUG9zaXRpb25JblBlcmNlbnQ6IG51bWJlcik6IHZvaWQge1xuXG4gICAgICAgIC8vIGdldCB0aGUgY3VycmVudCBzb3VuZCBpZiBhbnlcbiAgICAgICAgbGV0IGN1cnJlbnRTb3VuZCA9IHRoaXMuX2dldFNvdW5kRnJvbVF1ZXVlKCk7XG5cbiAgICAgICAgLy8gaWYgdGhlcmUgaXMgYSBzb3VuZCBjdXJyZW50bHkgYmVpbmcgcGxheWVkXG4gICAgICAgIGlmIChjdXJyZW50U291bmQgIT09IG51bGwpIHtcblxuICAgICAgICAgICAgLy8gY2hlY2sgaWYgdGhlIGR1cmF0aW9uIGdvdCBzZXQgbWFudWFsbHlcbiAgICAgICAgICAgIGlmIChjdXJyZW50U291bmQuZHVyYXRpb24gPT09IG51bGwpIHtcblxuICAgICAgICAgICAgICAgIC8vIHRoZSB1c2VyIGNhbiBzZXQgdGhlIHNvdW5kIGR1cmF0aW9uIG1hbnVhbGx5IGJ1dCBpZiBoZSBkaWRuJ3QgdGhlIHNvbmcgaGFzIHRvXG4gICAgICAgICAgICAgICAgLy8gZ2V0IHByZWxvYWRlZCBhcyB0aGUgZHVyYXRpb24gaXMgYSBwcm9wZXJ0eSBvZiB0aGUgYXVkaW9CdWZmZXJcbiAgICAgICAgICAgICAgICB0aGlzLl9sb2FkU291bmQoY3VycmVudFNvdW5kKVxuICAgICAgICAgICAgICAgICAgICAudGhlbigoc291bmQ6IElTb3VuZCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjYWxjdWxhdGUgdGhlIHBvc2l0aW9uIGluIHNlY29uZHNcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBzb3VuZFBvc2l0aW9uSW5TZWNvbmRzID0gKHNvdW5kLmR1cmF0aW9uIC8gMTAwKSAqIHNvdW5kUG9zaXRpb25JblBlcmNlbnQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0UG9zaXRpb25JblNlY29uZHMoc291bmRQb3NpdGlvbkluU2Vjb25kcyk7XG5cbiAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycm9yOiBQbGF5ZXJFcnJvcikgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiB0aHJvdyBlcnJvcj8/P1xuXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgLy8gY2FsY3VsYXRlIHRoZSBwb3NpdGlvbiBpbiBzZWNvbmRzXG4gICAgICAgICAgICAgICAgbGV0IHNvdW5kUG9zaXRpb25JblNlY29uZHMgPSAoY3VycmVudFNvdW5kLmR1cmF0aW9uIC8gMTAwKSAqIHNvdW5kUG9zaXRpb25JblBlcmNlbnQ7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnNldFBvc2l0aW9uSW5TZWNvbmRzKHNvdW5kUG9zaXRpb25JblNlY29uZHMpO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgLy8gVE9ETzogdGhyb3cgZXJyb3I/Pz9cblxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0UG9zaXRpb25JblNlY29uZHMoc291bmRQb3NpdGlvbkluU2Vjb25kczogbnVtYmVyKSB7XG5cbiAgICAgICAgLy8gZ2V0IHRoZSBjdXJyZW50IHNvdW5kIGlmIGFueVxuICAgICAgICBsZXQgY3VycmVudFNvdW5kID0gdGhpcy5fZ2V0U291bmRGcm9tUXVldWUoKTtcblxuICAgICAgICAvLyBpZiB0aGVyZSBpcyBhIHNvdW5kIGN1cnJlbnRseSBiZWluZyBwbGF5ZWRcbiAgICAgICAgaWYgKGN1cnJlbnRTb3VuZCAhPT0gbnVsbCkge1xuXG4gICAgICAgICAgICAvLyBpcyB0aGUgc29uZyBpcyBiZWluZyBwbGF5ZWRcbiAgICAgICAgICAgIGlmIChjdXJyZW50U291bmQuaXNQbGF5aW5nKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBzdG9wIHRoZSB0cmFjayBwbGF5YmFja1xuICAgICAgICAgICAgICAgIHRoaXMucGF1c2UoKTtcblxuICAgICAgICAgICAgICAgIC8vIHN0YXJ0IHRoZSBwbGF5YmFjayBhdCB0aGUgZ2l2ZW4gcG9zaXRpb25cbiAgICAgICAgICAgICAgICB0aGlzLnBsYXkoY3VycmVudFNvdW5kLmlkLCBzb3VuZFBvc2l0aW9uSW5TZWNvbmRzKTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgIC8vIG9ubHkgc2V0IHRoZSBzb3VuZCBwb3NpdGlvbiBidXQgZG9uJ3QgcGxheVxuICAgICAgICAgICAgICAgIGN1cnJlbnRTb3VuZC5wbGF5VGltZU9mZnNldCA9IHNvdW5kUG9zaXRpb25JblNlY29uZHM7XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAvLyBUT0RPOiB0aHJvdyBlcnJvcj8/P1xuXG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfbG9hZFNvdW5kKHNvdW5kOiBJU291bmQpOiBQcm9taXNlPElTb3VuZCB8IFBsYXllckVycm9yPiB7XG5cbiAgICAgICAgLy8gVE9ETzogd291bGQgYmUgZ29vZCB0byBjYWNoZSBidWZmZXJzLCBzbyBuZWVkIHRvIGNoZWNrIGlmIGlzIGluIGNhY2hlXG4gICAgICAgIC8vIGxldCB0aGUgdXNlciBjaG9vc2UgKGJ5IHNldHRpbmcgYW4gb3B0aW9uKSB3aGF0IGFtb3VudCBvZiBzb3VuZHMgd2lsbCBiZSBjYWNoZWRcbiAgICAgICAgLy8gYWRkIGEgY2FjaGVkIGRhdGUgLyB0aW1lc3RhbXAgdG8gYmUgYWJsZSB0byBjbGVhciBjYWNoZSBieSBvbGRlc3QgZmlyc3RcbiAgICAgICAgLy8gb3IgZXZlbiBiZXR0ZXIgYWRkIGEgcGxheWVkIGNvdW50ZXIgdG8gY2FjaGUgYnkgbGVhc3QgcGxheWVkIGFuZCBkYXRlXG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICAgICAgLy8gaWYgdGhlIHNvdW5kIGFscmVhZHkgaGFzIGFuIEF1ZGlvQnVmZmVyXG4gICAgICAgICAgICBpZiAoc291bmQuYXVkaW9CdWZmZXIgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHNvdW5kKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gaWYgdGhlIHNvdW5kIGhhcyBhbHJlYWR5IGFuIEFycmF5QnVmZmVyIGJ1dCBubyBBdWRpb0J1ZmZlclxuICAgICAgICAgICAgaWYgKHNvdW5kLmFycmF5QnVmZmVyICE9PSBudWxsICYmIHNvdW5kLmF1ZGlvQnVmZmVyID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2RlY29kZVNvdW5kKHNvdW5kLCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBpZiB0aGUgc291bmQgaGFzIG5vIEFycmF5QnVmZmVyIGFuZCBhbHNvIG5vIEF1ZGlvQnVmZmVyIHlldFxuICAgICAgICAgICAgaWYgKHNvdW5kLmFycmF5QnVmZmVyID09PSBudWxsICYmIHNvdW5kLmF1ZGlvQnVmZmVyID09PSBudWxsKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBleHRyYWN0IHRoZSB1cmwgYW5kIGNvZGVjIGZyb20gc291cmNlc1xuICAgICAgICAgICAgICAgIGxldCB7IHVybCwgY29kZWMgPSBudWxsIH0gPSB0aGlzLl9zb3VyY2VUb1ZhcmlhYmxlcyhzb3VuZC5zb3VyY2VzKTtcblxuICAgICAgICAgICAgICAgIHNvdW5kLnVybCA9IHVybDtcbiAgICAgICAgICAgICAgICBzb3VuZC5jb2RlYyA9IGNvZGVjO1xuXG4gICAgICAgICAgICAgICAgaWYgKHNvdW5kLnVybCAhPT0gbnVsbCkge1xuXG4gICAgICAgICAgICAgICAgICAgIGxldCByZXF1ZXN0ID0gbmV3IFBsYXllclJlcXVlc3QoKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBjaGFuZ2UgYnVmZmVyaW5nIHN0YXRlXG4gICAgICAgICAgICAgICAgICAgIHNvdW5kLmlzQnVmZmVyaW5nID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0LmdldEFycmF5QnVmZmVyKHNvdW5kKS50aGVuKChhcnJheUJ1ZmZlcjogQXJyYXlCdWZmZXIpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgc291bmQuYXJyYXlCdWZmZXIgPSBhcnJheUJ1ZmZlcjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2RlY29kZVNvdW5kKHNvdW5kLCByZXNvbHZlLCByZWplY3QpO1xuXG4gICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKChyZXF1ZXN0RXJyb3I6IElQbGF5ZXJFcnJvcikgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QocmVxdWVzdEVycm9yKTtcblxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAgICAgbGV0IG5vVXJsRXJyb3IgPSBuZXcgUGxheWVyRXJyb3IoJ3NvdW5kIGhhcyBubyB1cmwnLCAxKTtcblxuICAgICAgICAgICAgICAgICAgICByZWplY3Qobm9VcmxFcnJvcik7XG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KTtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfZGVjb2RlU291bmQoc291bmQ6IElTb3VuZCwgcmVzb2x2ZTogRnVuY3Rpb24sIHJlamVjdDogRnVuY3Rpb24pIHtcblxuICAgICAgICBsZXQgYXJyYXlCdWZmZXIgPSBzb3VuZC5hcnJheUJ1ZmZlcjtcblxuICAgICAgICB0aGlzLl9wbGF5ZXJBdWRpby5kZWNvZGVBdWRpbyhhcnJheUJ1ZmZlcikudGhlbigoYXVkaW9CdWZmZXI6IEF1ZGlvQnVmZmVyKSA9PiB7XG5cbiAgICAgICAgICAgIHNvdW5kLmF1ZGlvQnVmZmVyID0gYXVkaW9CdWZmZXI7XG4gICAgICAgICAgICBzb3VuZC5pc0J1ZmZlcmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgc291bmQuaXNCdWZmZXJlZCA9IHRydWU7XG4gICAgICAgICAgICBzb3VuZC5hdWRpb0J1ZmZlckRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgc291bmQuZHVyYXRpb24gPSBzb3VuZC5hdWRpb0J1ZmZlci5kdXJhdGlvbjtcblxuICAgICAgICAgICAgcmVzb2x2ZShzb3VuZCk7XG5cbiAgICAgICAgfSkuY2F0Y2goKGRlY29kZUF1ZGlvRXJyb3I6IElQbGF5ZXJFcnJvcikgPT4ge1xuXG4gICAgICAgICAgICByZWplY3QoZGVjb2RlQXVkaW9FcnJvcik7XG5cbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgcGxheSh3aGljaFNvdW5kPzogbnVtYmVyIHwgc3RyaW5nIHwgdW5kZWZpbmVkLCBwbGF5VGltZU9mZnNldD86IG51bWJlcik6IHZvaWQge1xuXG4gICAgICAgIC8vIFRPRE86IGNoZWNrIHRoZSBhdmFpbGFibGUgY29kZWNzIGFuZCBkZWZpbmVkIHNvdXJjZXMsIHBsYXkgdGhlIGZpcnN0IG9uZSB0aGF0IGhhcyBtYXRjaGVzIGFuZCBhdmFpbGFibGUgY29kZWNcbiAgICAgICAgLy8gVE9ETzogbGV0IHVzZXIgZGVmaW5lIG9yZGVyIG9mIHByZWZlcnJlZCBjb2RlY3MgZm9yIHBsYXllcmJhY2tcblxuICAgICAgICAvLyBnZXQgdGhlIGN1cnJlbnQgc291bmQgaWYgYW55XG4gICAgICAgIGxldCBjdXJyZW50U291bmQgPSB0aGlzLl9nZXRTb3VuZEZyb21RdWV1ZSgpO1xuXG4gICAgICAgIC8vIGlmIHRoZXJlIGlzIGEgc291bmQgY3VycmVudGx5IGJlaW5nIHBsYXllZFxuICAgICAgICBpZiAoY3VycmVudFNvdW5kICE9PSBudWxsICYmIGN1cnJlbnRTb3VuZC5pc1BsYXlpbmcpIHtcblxuICAgICAgICAgICAgLy8gc3RvcCB0aGUgY3VycmVudCBzb3VuZFxuICAgICAgICAgICAgdGhpcy5zdG9wKCk7XG5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHdoaWNoU291bmQgaXMgb3B0aW9uYWwsIGlmIHNldCBpdCBjYW4gYmUgdGhlIHNvdW5kIGlkIG9yIGlmIGl0J3MgYSBzdHJpbmcgaXQgY2FuIGJlIG5leHQgLyBwcmV2aW91cyAvIGZpcnN0IC8gbGFzdFxuICAgICAgICBsZXQgc291bmQgPSB0aGlzLl9nZXRTb3VuZEZyb21RdWV1ZSh3aGljaFNvdW5kKTtcblxuICAgICAgICAvLyBpZiB0aGVyZSBpcyBubyBzb3VuZCB3ZSBjb3VsZCBwbGF5LCBkbyBub3RoaW5nXG4gICAgICAgIGlmIChzb3VuZCA9PT0gbnVsbCkge1xuXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgICAgIC8vIFRPRE86IHRocm93IGFuIGVycm9yP1xuXG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiB0aGUgdXNlciB3YW50cyB0byBwbGF5IHRoZSBzb3VuZCBmcm9tIGEgY2VydGFpbiBwb3NpdGlvblxuICAgICAgICBpZiAocGxheVRpbWVPZmZzZXQgIT09IHVuZGVmaW5lZCkge1xuXG4gICAgICAgICAgICBzb3VuZC5wbGF5VGltZU9mZnNldCA9IHBsYXlUaW1lT2Zmc2V0O1xuXG4gICAgICAgIH1cblxuICAgICAgICAvLyBoYXMgdGhlIHNvdW5kIGFscmVhZHkgYmVlbiBsb2FkZWQ/XG4gICAgICAgIGlmICghc291bmQuaXNCdWZmZXJlZCkge1xuXG4gICAgICAgICAgICB0aGlzLl9sb2FkU291bmQoc291bmQpLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fcGxheShzb3VuZCk7XG5cbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnJvcikgPT4ge1xuXG4gICAgICAgICAgICAgICAgLy8gVE9ETzogaGFuZGxlIGVycm9yXG5cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgIHRoaXMuX3BsYXkoc291bmQpO1xuXG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfcGxheShzb3VuZDogSVNvdW5kKSB7XG5cbiAgICAgICAgLy8gc291cmNlIG5vZGUgb3B0aW9uc1xuICAgICAgICBsZXQgc291cmNlTm9kZU9wdGlvbnMgPSB7XG4gICAgICAgICAgICBsb29wOiBzb3VuZC5sb29wLFxuICAgICAgICAgICAgb25FbmRlZDogKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuX29uRW5kZWQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvLyBjcmVhdGUgYSBuZXcgc291cmNlIG5vZGVcbiAgICAgICAgdGhpcy5fcGxheWVyQXVkaW8uY3JlYXRlU291cmNlTm9kZShzb3VyY2VOb2RlT3B0aW9ucykudGhlbigoc291cmNlTm9kZSkgPT4ge1xuXG4gICAgICAgICAgICBzb3VuZC5pc1BsYXlpbmcgPSB0cnVlO1xuICAgICAgICAgICAgc291bmQuc291cmNlTm9kZSA9IHNvdXJjZU5vZGU7XG5cbiAgICAgICAgICAgIC8vIGFkZCB0aGUgYnVmZmVyIHRvIHRoZSBzb3VyY2Ugbm9kZVxuICAgICAgICAgICAgc291cmNlTm9kZS5idWZmZXIgPSBzb3VuZC5hdWRpb0J1ZmZlcjtcblxuICAgICAgICAgICAgLy8gdGhlIGF1ZGlvY29udGV4dCB0aW1lIHJpZ2h0IG5vdyAoc2luY2UgdGhlIGF1ZGlvY29udGV4dCBnb3QgY3JlYXRlZClcbiAgICAgICAgICAgIHNvdW5kLnN0YXJ0VGltZSA9IHNvdXJjZU5vZGUuY29udGV4dC5jdXJyZW50VGltZTtcblxuICAgICAgICAgICAgLy8gY29ubmVjdCB0aGUgc291cmNlIHRvIHRoZSBncmFwaCAoZGVzdGluYXRpb24pXG4gICAgICAgICAgICB0aGlzLl9wbGF5ZXJBdWRpby5jb25uZWN0U291cmNlTm9kZVRvR3JhcGgoc291cmNlTm9kZSk7XG5cbiAgICAgICAgICAgIC8vIHN0YXJ0IHBsYXliYWNrXG4gICAgICAgICAgICAvLyBzdGFydCh3aGVuLCBvZmZzZXQsIGR1cmF0aW9uKVxuICAgICAgICAgICAgc291cmNlTm9kZS5zdGFydCgwLCBzb3VuZC5wbGF5VGltZU9mZnNldCk7XG5cbiAgICAgICAgICAgIC8vIHRyaWdnZXIgcmVzdW1lZCBldmVudFxuICAgICAgICAgICAgaWYgKHNvdW5kLm9uUmVzdW1lZCAhPT0gbnVsbCAmJiAhc291bmQuZmlyc3RUaW1lUGxheWVkKSB7XG4gICAgICAgICAgICAgICAgc291bmQub25SZXN1bWVkKHNvdW5kLnBsYXlUaW1lT2Zmc2V0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gdHJpZ2dlciBzdGFydGVkIGV2ZW50XG4gICAgICAgICAgICBpZiAoc291bmQub25TdGFydGVkICE9PSBudWxsICYmIHNvdW5kLmZpcnN0VGltZVBsYXllZCkge1xuXG4gICAgICAgICAgICAgICAgc291bmQub25TdGFydGVkKHNvdW5kLnBsYXlUaW1lT2Zmc2V0KTtcblxuICAgICAgICAgICAgICAgIHNvdW5kLmZpcnN0VGltZVBsYXllZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHRyaWdnZXIgcGxheWluZyBldmVudFxuICAgICAgICAgICAgaWYgKHNvdW5kLm9uUGxheWluZyAhPT0gbnVsbCkge1xuXG4gICAgICAgICAgICAgICAgLy8gYXQgaW50ZXJ2YWwgc2V0IHBsYXlpbmcgcHJvZ3Jlc3NcbiAgICAgICAgICAgICAgICB0aGlzLl9wbGF5aW5nVGltZW91dElEID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3BsYXlpbmdQcm9ncmVzcyhzb3VuZCk7XG5cbiAgICAgICAgICAgICAgICB9LCB0aGlzLl9wbGF5aW5nUHJvZ3Jlc3NJbnRlcnZhbFRpbWUpO1xuXG4gICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fcGxheWluZ1RpbWVvdXRJRCA9IG51bGw7XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KS5jYXRjaCgoZXJyb3IpID0+IHtcblxuICAgICAgICAgICAgLy8gVE9ETzogaGFuZGxlIGVycm9yXG5cbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX29uRW5kZWQoKSB7XG5cbiAgICAgICAgLy8gZ2V0IHRoZSBjdXJyZW50IHNvdW5kIGlmIGFueVxuICAgICAgICBsZXQgY3VycmVudFNvdW5kID0gdGhpcy5fZ2V0U291bmRGcm9tUXVldWUoKTtcblxuICAgICAgICAvLyBpZiB0aGVyZSBpcyBhIHNvdW5kIGN1cnJlbnRseSBiZWluZyBwbGF5ZWRcbiAgICAgICAgaWYgKGN1cnJlbnRTb3VuZCAhPT0gbnVsbCAmJiBjdXJyZW50U291bmQuaXNQbGF5aW5nKSB7XG5cbiAgICAgICAgICAgIGxldCB1cGRhdGVJbmRleCA9IGZhbHNlO1xuXG4gICAgICAgICAgICBsZXQgbmV4dFNvdW5kID0gdGhpcy5fZ2V0U291bmRGcm9tUXVldWUoJ25leHQnLCB1cGRhdGVJbmRleCk7XG5cbiAgICAgICAgICAgIGlmIChjdXJyZW50U291bmQub25FbmRlZCAhPT0gbnVsbCkge1xuXG4gICAgICAgICAgICAgICAgbGV0IHdpbGxQbGF5TmV4dCA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgLy8gY2hlY2sgaWYgdGhlcmUgaXMgYW5vdGhlciBzb3VuZCBpbiB0aGUgcXVldWUgYW5kIGlmIHBsYXlpbmdcbiAgICAgICAgICAgICAgICAvLyB0aGUgbmV4dCBvbmUgb24gZW5kZWQgaXMgYWN0aXZhdGVkXG4gICAgICAgICAgICAgICAgaWYgKG5leHRTb3VuZCAhPT0gbnVsbCAmJiB0aGlzLl9wbGF5TmV4dE9uRW5kZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgd2lsbFBsYXlOZXh0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjdXJyZW50U291bmQub25FbmRlZCh3aWxsUGxheU5leHQpO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHJlc2V0IHRoZSBpcyBmaXJzdCB0aW1lIHNvdW5kIGlzIGJlaW5nIHBsYXllZCB0byB0cnVlXG4gICAgICAgICAgICBjdXJyZW50U291bmQuZmlyc3RUaW1lUGxheWVkID0gdHJ1ZTtcblxuICAgICAgICAgICAgLy8gcmVzZXQgdGhlIHBsYXlUaW1lT2Zmc2V0XG4gICAgICAgICAgICBjdXJyZW50U291bmQucGxheVRpbWVPZmZzZXQgPSAwO1xuXG4gICAgICAgICAgICB0aGlzLl9zdG9wKGN1cnJlbnRTb3VuZCk7XG5cbiAgICAgICAgICAgIGlmIChuZXh0U291bmQgIT09IG51bGwpIHtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9wbGF5TmV4dE9uRW5kZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wbGF5KCduZXh0Jyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgLy8gd2UgcmVhY2hlZCB0aGUgZW5kIG9mIHRoZSBxdWV1ZSBzZXQgdGhlIGN1cnJlbnRJbmRleCBiYWNrIHRvIHplcm9cbiAgICAgICAgICAgICAgICB0aGlzLl9jdXJyZW50SW5kZXggPSAwO1xuXG4gICAgICAgICAgICAgICAgLy8gaWYgcXVldWUgbG9vcCBpcyBhY3RpdmUgdGhlbiBwbGF5XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2xvb3BRdWV1ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsYXkoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiB3aGljaFNvdW5kIGlzIG9wdGlvbmFsLCBpZiBzZXQgaXQgY2FuIGJlIHRoZSBzb3VuZCBpZCBvciBpZiBpdCdzXG4gICAgICogYSBzdHJpbmcgaXQgY2FuIGJlIG5leHQgLyBwcmV2aW91cyAvIGZpcnN0IC8gbGFzdFxuICAgICAqL1xuICAgIHByb3RlY3RlZCBfZ2V0U291bmRGcm9tUXVldWUod2hpY2hTb3VuZD86IHN0cmluZyB8IG51bWJlciwgdXBkYXRlSW5kZXg6IGJvb2xlYW4gPSB0cnVlKTogSVNvdW5kIHwgbnVsbCB7XG5cbiAgICAgICAgbGV0IHNvdW5kID0gbnVsbDtcblxuICAgICAgICAvLyBjaGVjayBpZiB0aGUgcXVldWUgaXMgZW1wdHlcbiAgICAgICAgaWYgKHRoaXMuX3F1ZXVlLmxlbmd0aCA9PT0gMCkge1xuXG4gICAgICAgICAgICByZXR1cm4gc291bmQ7XG5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGlmIHdoaWNoIHNvbmcgdG8gcGxheSBkaWQgbm90IGdldCBzcGVjaWZpZWQsIHBsYXkgb25lIGJhc2VkIGZyb20gdGhlIHF1ZXVlIGJhc2VkIG9uIHRoZSBxdWV1ZSBpbmRleCBwb3NpdGlvbiBtYXJrZXJcbiAgICAgICAgaWYgKHdoaWNoU291bmQgPT09IHVuZGVmaW5lZCAmJiB0aGlzLl9xdWV1ZVt0aGlzLl9jdXJyZW50SW5kZXhdICE9PSB1bmRlZmluZWQpIHtcblxuICAgICAgICAgICAgc291bmQgPSB0aGlzLl9xdWV1ZVt0aGlzLl9jdXJyZW50SW5kZXhdO1xuXG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHdoaWNoU291bmQgPT09ICdudW1iZXInKSB7XG5cbiAgICAgICAgICAgIC8vIGlmIHdoaWNoIHNvbmcgdG8gcGxheSBpcyBhIG51bWVyaWMgSURcbiAgICAgICAgICAgIHNvdW5kID0gdGhpcy5fZmluZFNvdW5kQnlJZCh3aGljaFNvdW5kLCB1cGRhdGVJbmRleCk7XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgbGV0IHNvdW5kSW5kZXg6IG51bWJlciB8IG51bGwgPSBudWxsO1xuXG4gICAgICAgICAgICAvLyBpZiB3aGljaCBzb25nIHRvIHBsYXkgaXMgYSBjb25zdGFudFxuICAgICAgICAgICAgc3dpdGNoICh3aGljaFNvdW5kKSB7XG4gICAgICAgICAgICAgICAgY2FzZSB0aGlzLlBMQVlfU09VTkRfTkVYVDpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX3F1ZXVlW3RoaXMuX2N1cnJlbnRJbmRleCArIDFdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdW5kSW5kZXggPSB0aGlzLl9jdXJyZW50SW5kZXggKyAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgc291bmQgPSB0aGlzLl9xdWV1ZVtzb3VuZEluZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIHRoaXMuUExBWV9TT1VORF9QUkVWSU9VUzpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX3F1ZXVlW3RoaXMuX2N1cnJlbnRJbmRleCAtIDFdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdW5kSW5kZXggPSB0aGlzLl9jdXJyZW50SW5kZXggLSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgc291bmQgPSB0aGlzLl9xdWV1ZVtzb3VuZEluZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIHRoaXMuUExBWV9TT1VORF9GSVJTVDpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX3F1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdW5kSW5kZXggPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgc291bmQgPSB0aGlzLl9xdWV1ZVtzb3VuZEluZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIHRoaXMuUExBWV9TT1VORF9MQVNUOlxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fcXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc291bmRJbmRleCA9IHRoaXMuX3F1ZXVlLmxlbmd0aCAtIDI7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VuZCA9IHRoaXMuX3F1ZXVlW3NvdW5kSW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIHdoaWNoIHNvbmcgdG8gcGxheSBpcyBhIHN0cmluZyBJRFxuICAgICAgICAgICAgICAgICAgICBzb3VuZCA9IHRoaXMuX2ZpbmRTb3VuZEJ5SWQod2hpY2hTb3VuZCwgdXBkYXRlSW5kZXgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoc291bmRJbmRleCAhPT0gbnVsbCAmJiB1cGRhdGVJbmRleCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRJbmRleCA9IHNvdW5kSW5kZXg7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzb3VuZDtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfZmluZFNvdW5kQnlJZChzb3VuZElkOiBzdHJpbmcgfCBudW1iZXIsIHVwZGF0ZUluZGV4OiBib29sZWFuKTogSVNvdW5kIHwgbnVsbCB7XG5cbiAgICAgICAgbGV0IHNvdW5kID0gbnVsbDtcblxuICAgICAgICB0aGlzLl9xdWV1ZS5zb21lKChzb3VuZEZyb21RdWV1ZTogSVNvdW5kLCBxdWV1ZUluZGV4OiBudW1iZXIpID0+IHtcblxuICAgICAgICAgICAgaWYgKHNvdW5kRnJvbVF1ZXVlLmlkID09PSBzb3VuZElkKSB7XG5cbiAgICAgICAgICAgICAgICBzb3VuZCA9IHNvdW5kRnJvbVF1ZXVlO1xuXG4gICAgICAgICAgICAgICAgaWYgKHVwZGF0ZUluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRJbmRleCA9IHF1ZXVlSW5kZXg7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gc291bmQ7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX3NvdXJjZVRvVmFyaWFibGVzKHNvdXJjZXM6IChJU291bmRTb3VyY2UgfCBzdHJpbmcpW10pOiB7IHVybDogc3RyaW5nIHwgbnVsbCwgY29kZWM/OiBzdHJpbmcgfCBudWxsIH0ge1xuXG4gICAgICAgIC8vIFRPRE86IHNvdXJjZSBjYW4gYmUgb24gb2JqZWN0IHdoZXJlIHRoZSBwcm9wZXJ0eSBuYW1lIGlzIHRoZSBjb2RlYyBhbmQgdGhlIHZhbHVlIGlzIHRoZSBzb3VuZCB1cmxcbiAgICAgICAgLy8gaWYgc291bmQgaXNudCBhbiBvYmplY3QgdHJ5IHRvIGRldGVjdCBzb3VuZCBzb3VyY2UgZXh0ZW5zaW9uIGJ5IGZpbGUgZXh0ZW50aW9uIG9yIGJ5IGNoZWNraW5nIHRoZSBmaWxlIG1pbWUgdHlwZVxuXG4gICAgICAgIC8vIFRPRE86IGdldCBhIGxpc3Qgb2Ygc3VwcG9ydGVkIGNvZGVjcyBieSB0aGlzIGRldmljZVxuXG4gICAgICAgIGxldCBmaXJzdE1hdGNoaW5nU291cmNlOiB7IHVybDogc3RyaW5nIHwgbnVsbCwgY29kZWM/OiBzdHJpbmcgfCBudWxsIH0gPSB7XG4gICAgICAgICAgICB1cmw6IG51bGwsXG4gICAgICAgICAgICBjb2RlYzogbnVsbFxuICAgICAgICB9O1xuXG4gICAgICAgIHNvdXJjZXMuZm9yRWFjaCgoc291cmNlKSA9PiB7XG5cbiAgICAgICAgICAgIC8vIFRPRE86IGZpbmQgb3V0IHdoYXQgdGhlIHNvdXJjZSBjb2RlYyBpc1xuXG4gICAgICAgICAgICAvLyBUT0RPOiBjaGVjayBpZiB0aGUgc291cmNlIGNvZGVjIGlzIGFtb25nIHRoZSBvbmVzIHRoYXQgYXJlIHN1cHBvcnRlZCBieSB0aGlzIGRldmljZVxuXG4gICAgICAgICAgICBsZXQgc291bmRVcmwgPSAnJztcblxuICAgICAgICAgICAgLy8gaWYgdGhlIHBsYXllciBoYWQgYXMgb3B0aW9uIGEgYmFzZVVybCBmb3Igc291bmRzIGFkZCBpdCBub3dcbiAgICAgICAgICAgIGlmICh0aGlzLl9zb3VuZHNCYXNlVXJsICE9PSAnJykge1xuICAgICAgICAgICAgICAgIHNvdW5kVXJsID0gdGhpcy5fc291bmRzQmFzZVVybDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gdHdvIGtpbmQgb2Ygc291cmNlIGFyZSBwb3NzaWJsZSwgYSBzdHJpbmcgKHRoZSB1cmwpIG9yIGFuIG9iamVjdCAoa2V5IGlzIHRoZSBjb2RlYyBhbmQgdmFsdWUgaXMgdGhlIHVybClcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc291cmNlID09PSAnc3RyaW5nJykge1xuXG4gICAgICAgICAgICAgICAgc291bmRVcmwgKz0gc291cmNlO1xuXG4gICAgICAgICAgICAgICAgZmlyc3RNYXRjaGluZ1NvdXJjZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBzb3VuZFVybFxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICBzb3VuZFVybCArPSBzb3VyY2UudXJsO1xuXG4gICAgICAgICAgICAgICAgZmlyc3RNYXRjaGluZ1NvdXJjZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBzb3VuZFVybCxcbiAgICAgICAgICAgICAgICAgICAgY29kZWM6IHNvdXJjZS5jb2RlY1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gZmlyc3RNYXRjaGluZ1NvdXJjZTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBwYXVzZSgpIHtcblxuICAgICAgICAvLyBnZXQgdGhlIGN1cnJlbnQgc291bmRcbiAgICAgICAgbGV0IHNvdW5kOiBJU291bmQgfCBudWxsID0gdGhpcy5fZ2V0U291bmRGcm9tUXVldWUoKTtcblxuICAgICAgICBpZiAoc291bmQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCB0aW1lQXRQYXVzZSA9IHNvdW5kLnNvdXJjZU5vZGUuY29udGV4dC5jdXJyZW50VGltZTtcblxuICAgICAgICBzb3VuZC5wbGF5VGltZU9mZnNldCArPSB0aW1lQXRQYXVzZSAtIHNvdW5kLnN0YXJ0VGltZTtcblxuICAgICAgICAvLyB0cmlnZ2VyIHBhdXNlZCBldmVudFxuICAgICAgICBpZiAoc291bmQub25QYXVzZWQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHNvdW5kLm9uUGF1c2VkKHNvdW5kLnBsYXlUaW1lT2Zmc2V0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3N0b3Aoc291bmQpO1xuXG4gICAgfVxuXG4gICAgcHVibGljIHN0b3AoKSB7XG5cbiAgICAgICAgLy8gZ2V0IHRoZSBjdXJyZW50IHNvdW5kXG4gICAgICAgIGxldCBzb3VuZDogSVNvdW5kIHwgbnVsbCA9IHRoaXMuX2dldFNvdW5kRnJvbVF1ZXVlKCk7XG5cbiAgICAgICAgaWYgKHNvdW5kID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyByZXNldCB0aGUgaXMgZmlyc3QgdGltZSBzb3VuZCBpcyBiZWluZyBwbGF5ZWQgdG8gdHJ1ZVxuICAgICAgICBzb3VuZC5maXJzdFRpbWVQbGF5ZWQgPSB0cnVlO1xuXG4gICAgICAgIC8vIHRyaWdnZXIgc3RvcHBlZCBldmVudFxuICAgICAgICBpZiAoc291bmQub25TdG9wcGVkICE9PSBudWxsKSB7XG4gICAgICAgICAgICBzb3VuZC5vblN0b3BwZWQoc291bmQucGxheVRpbWVPZmZzZXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcmVzZXQgdGhlIHBsYXlUaW1lT2Zmc2V0XG4gICAgICAgIHNvdW5kLnBsYXlUaW1lT2Zmc2V0ID0gMDtcblxuICAgICAgICB0aGlzLl9zdG9wKHNvdW5kKTtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfc3RvcChzb3VuZDogSVNvdW5kKSB7XG5cbiAgICAgICAgLy8gdGVsbCB0aGUgc291cmNlTm9kZSB0byBzdG9wIHBsYXlpbmdcbiAgICAgICAgc291bmQuc291cmNlTm9kZS5zdG9wKDApO1xuXG4gICAgICAgIC8vIHRlbGwgdGhlIHNvdW5kIHRoYXQgcGxheWluZyBpcyBvdmVyXG4gICAgICAgIHNvdW5kLmlzUGxheWluZyA9IGZhbHNlO1xuXG4gICAgICAgIC8vIGRlc3Ryb3kgdGhlIHNvdXJjZSBub2RlIGFzIGl0IGNhbiBhbnl3YXkgb25seSBnZXQgdXNlZCBvbmNlXG4gICAgICAgIHRoaXMuX3BsYXllckF1ZGlvLmRlc3Ryb3lTb3VyY2VOb2RlKHNvdW5kLnNvdXJjZU5vZGUpO1xuXG4gICAgICAgIHNvdW5kLnNvdXJjZU5vZGUgPSBudWxsO1xuXG4gICAgICAgIGlmICh0aGlzLl9wbGF5aW5nVGltZW91dElEICE9PSBudWxsKSB7XG5cbiAgICAgICAgICAgIC8vIGNsZWFyIHRoZSBwbGF5aW5nIHByb2dyZXNzIHNldEludGVydmFsXG4gICAgICAgICAgICBjbGVhckludGVydmFsKHRoaXMuX3BsYXlpbmdUaW1lb3V0SUQpO1xuXG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHB1YmxpYyBuZXh0KCkge1xuXG4gICAgICAgIC8vIGFsaWFzIGZvciBwbGF5IG5leHRcbiAgICAgICAgdGhpcy5wbGF5KCduZXh0Jyk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgcHJldmlvdXMoKSB7XG5cbiAgICAgICAgLy8gYWxpYXMgZm9yIHBsYXkgcHJldmlvdXNcbiAgICAgICAgdGhpcy5wbGF5KCdwcmV2aW91cycpO1xuXG4gICAgfVxuXG4gICAgcHVibGljIGZpcnN0KCkge1xuXG4gICAgICAgIC8vIGFsaWFzIGZvciBwbGF5IGZpcnN0XG4gICAgICAgIHRoaXMucGxheSgnZmlyc3QnKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBsYXN0KCkge1xuXG4gICAgICAgIC8vIGFsaWFzIGZvciBwbGF5IGxhc3RcbiAgICAgICAgdGhpcy5wbGF5KCdsYXN0Jyk7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX3BsYXlpbmdQcm9ncmVzcyhzb3VuZDogSVNvdW5kKSB7XG5cbiAgICAgICAgbGV0IHRpbWVOb3cgPSBzb3VuZC5zb3VyY2VOb2RlLmNvbnRleHQuY3VycmVudFRpbWU7XG5cbiAgICAgICAgc291bmQucGxheVRpbWUgPSAodGltZU5vdyAtIHNvdW5kLnN0YXJ0VGltZSkgKyBzb3VuZC5wbGF5VGltZU9mZnNldDtcblxuICAgICAgICBsZXQgcGxheWluZ1BlcmNlbnRhZ2UgPSAoc291bmQucGxheVRpbWUgLyBzb3VuZC5hdWRpb0J1ZmZlci5kdXJhdGlvbikgKiAxMDA7XG5cbiAgICAgICAgc291bmQucGxheWVkVGltZVBlcmNlbnRhZ2UgPSBwbGF5aW5nUGVyY2VudGFnZTtcblxuICAgICAgICBzb3VuZC5vblBsYXlpbmcocGxheWluZ1BlcmNlbnRhZ2UsIHNvdW5kLmF1ZGlvQnVmZmVyLmR1cmF0aW9uLCBzb3VuZC5wbGF5VGltZSk7XG5cbiAgICB9O1xuXG59XG4iXX0=

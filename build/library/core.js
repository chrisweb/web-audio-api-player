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
            // playing progress timeoutID
            this._playingTimeoutID = null;
            // a custon audioGraph created by the user
            this._customAudioGraph = null;
            // a custom audio context created by the user
            this._customAudioContext = null;
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
                playNextOnEnded: true,
                stopOnReset: true
            };
            var options = Object.assign({}, defaultOptions, playerOptions);
            this._volume = options.volume;
            this._soundsBaseUrl = options.soundsBaseUrl;
            this._queue = [];
            this._currentIndex = 0;
            this._playingProgressIntervalTime = options.playingProgressIntervalTime;
            this._playNextOnEnded = options.playNextOnEnded;
            this._loopQueue = options.loopQueue;
            this._stopOnReset = options.stopOnReset;
            if (typeof options.audioContext !== 'undefined') {
                this._customAudioContext = options.audioContext;
            }
            if (typeof options.audioGraph !== 'undefined') {
                this._customAudioGraph = options.audioGraph;
            }
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
            var audioOptions = {
                volume: this._volume,
                customAudioContext: this._customAudioContext,
                customAudioGraph: this._customAudioGraph
            };
            // player audio library instance
            this._playerAudio = new audio_1.PlayerAudio(audioOptions);
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
            // check if a song is getting played and stop it
            if (this._stopOnReset) {
                this.stop();
            }
            // TODO: destroy all the sounds or clear the cached buffers?
            this._queue = [];
        };
        PlayerCore.prototype.reset = function () {
            this.resetQueue();
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
                // connect the source to the graph node(s)
                _this._playerAudio.connectSourceNodeToGraphNodes(sourceNode);
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
            if (!sound.isPlaying) {
                // TODO: just return or throw an error
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
        PlayerCore.prototype.setAudioGraph = function (customAudioGraph) {
            this._playerAudio.setAudioGraph(customAudioGraph);
            this._customAudioGraph = customAudioGraph;
        };
        PlayerCore.prototype.getAudioGraph = function () {
            var _this = this;
            return new Promise(function (resolve, reject) {
                _this._playerAudio.getAudioGraph().then(function (audioGraph) {
                    _this._customAudioGraph = audioGraph;
                    resolve(audioGraph);
                }).catch(reject);
            });
        };
        PlayerCore.prototype.setAudioContext = function (customAudioContext) {
            this._playerAudio.setAudioContext(customAudioContext);
            this._customAudioContext = customAudioContext;
        };
        PlayerCore.prototype.getAudioContext = function () {
            var _this = this;
            return new Promise(function (resolve, reject) {
                _this._playerAudio.getAudioContext().then(function (audioContext) {
                    _this._customAudioContext = audioContext;
                    resolve(audioContext);
                }).catch(reject);
            });
        };
        return PlayerCore;
    }());
    exports.PlayerCore = PlayerCore;
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,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O1lBWkcsTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLFVBQUMsT0FBTyxFQUFFLE1BQU07Z0JBRS9CLEtBQUksQ0FBQyxZQUFZLENBQUMsYUFBYSxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQUMsVUFBdUI7b0JBRTNELEtBQUksQ0FBQyxpQkFBaUIsR0FBRyxVQUFVLENBQUM7b0JBRXBDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFFeEIsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRXJCLENBQUMsQ0FBQyxDQUFDO1FBRVAsQ0FBQztRQUVNLG9DQUFlLEdBQXRCLFVBQXVCLGtCQUFpQztZQUVwRCxJQUFJLENBQUMsWUFBWSxDQUFDLGVBQWUsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBRXRELElBQUksQ0FBQyxtQkFBbUIsR0FBRyxrQkFBa0IsQ0FBQztRQUVsRCxDQUFDO1FBRU0sb0NBQWUsR0FBdEI7WUFBQSxpQkFjQztZQVpHLE1BQU0sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxVQUFDLE9BQU8sRUFBRSxNQUFNO2dCQUUvQixLQUFJLENBQUMsWUFBWSxDQUFDLGVBQWUsRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFDLFlBQTJCO29CQUVqRSxLQUFJLENBQUMsbUJBQW1CLEdBQUcsWUFBWSxDQUFDO29CQUV4QyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBRTFCLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUVyQixDQUFDLENBQUMsQ0FBQztRQUVQLENBQUM7UUFFTCxpQkFBQztJQUFELENBaDFCQSxBQWcxQkMsSUFBQTtJQWgxQlksZ0NBQVUiLCJmaWxlIjoibGlicmFyeS9jb3JlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IFBsYXllclNvdW5kLCBJU291bmQsIElTb3VuZEF0dHJpYnV0ZXMsIElTb3VuZFNvdXJjZSB9IGZyb20gJy4vc291bmQnO1xuaW1wb3J0IHsgUGxheWVyQXVkaW8sIElBdWRpb0dyYXBoLCBJQXVkaW9Db250ZXh0LCBJQXVkaW9PcHRpb25zIH0gZnJvbSAnLi9hdWRpbyc7XG5pbXBvcnQgeyBQbGF5ZXJSZXF1ZXN0IH0gZnJvbSAnLi9yZXF1ZXN0JztcbmltcG9ydCB7IFBsYXllckVycm9yLCBJUGxheWVyRXJyb3IgfSBmcm9tICcuL2Vycm9yJztcblxuZXhwb3J0IGludGVyZmFjZSBJQ29yZU9wdGlvbnMge1xuICAgIHZvbHVtZT86IG51bWJlcjtcbiAgICBsb29wUXVldWU/OiBib29sZWFuO1xuICAgIHNvdW5kc0Jhc2VVcmw/OiBzdHJpbmc7XG4gICAgcGxheWluZ1Byb2dyZXNzSW50ZXJ2YWxUaW1lPzogbnVtYmVyO1xuICAgIHBsYXlOZXh0T25FbmRlZD86IGJvb2xlYW47XG4gICAgYXVkaW9HcmFwaD86IElBdWRpb0dyYXBoO1xuICAgIGF1ZGlvQ29udGV4dD86IElBdWRpb0NvbnRleHQ7XG4gICAgc3RvcE9uUmVzZXQ/OiBib29sZWFuO1xufVxuXG5leHBvcnQgY2xhc3MgUGxheWVyQ29yZSB7XG5cbiAgICAvLyBpcyB0aGUgd2ViIGF1ZGlvIEFQSSBzdXBwb3J0ZWRcbiAgICBwcm90ZWN0ZWQgX2lzV2ViQXVkaW9BcGlTdXBwb3J0ZWQ6IGJvb2xlYW47XG4gICAgLy8gdGhlIHNvdW5kcyBxdWV1ZVxuICAgIHByb3RlY3RlZCBfcXVldWU6IElTb3VuZFtdO1xuICAgIC8vIHRoZSB2b2x1bWUgKDAgdG8gMTAwKVxuICAgIHByb3RlY3RlZCBfdm9sdW1lOiBudW1iZXI7XG4gICAgLy8gdGhlIGJhc2UgdXJsIHRoYXQgYWxsIHNvdW5kcyB3aWxsIGhhdmUgaW4gY29tbW9uXG4gICAgcHJvdGVjdGVkIF9zb3VuZHNCYXNlVXJsOiBzdHJpbmc7XG4gICAgLy8gdGhlIGN1cnJlbnQgc291bmQgaW4gcXVldWUgaW5kZXhcbiAgICBwcm90ZWN0ZWQgX2N1cnJlbnRJbmRleDogbnVtYmVyO1xuICAgIC8vIGluc3RhbmNlIG9mIHRoZSBhdWRpbyBsaWJyYXJ5IGNsYXNzXG4gICAgcHJvdGVjdGVkIF9wbGF5ZXJBdWRpbzogUGxheWVyQXVkaW87XG4gICAgLy8gcGxheWluZyBwcm9ncmVzcyB0aW1lIGludGVydmFsXG4gICAgcHJvdGVjdGVkIF9wbGF5aW5nUHJvZ3Jlc3NJbnRlcnZhbFRpbWU6IG51bWJlcjtcbiAgICAvLyBwbGF5aW5nIHByb2dyZXNzIHRpbWVvdXRJRFxuICAgIHByb3RlY3RlZCBfcGxheWluZ1RpbWVvdXRJRDogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG4gICAgLy8gd2hlbiBhIHNvbmcgZmluaXNoZXMsIGF1dG9tYXRpY2FsbHkgcGxheSB0aGUgbmV4dCBvbmVcbiAgICBwcm90ZWN0ZWQgX3BsYXlOZXh0T25FbmRlZDogYm9vbGVhbjtcbiAgICAvLyBkbyB3ZSBzdGFydCBvdmVyIGdhaW4gYXQgdGhlIGVuZCBvZiB0aGUgcXVldWVcbiAgICBwcm90ZWN0ZWQgX2xvb3BRdWV1ZTogYm9vbGVhbjtcbiAgICAvLyBhIGN1c3RvbiBhdWRpb0dyYXBoIGNyZWF0ZWQgYnkgdGhlIHVzZXJcbiAgICBwcm90ZWN0ZWQgX2N1c3RvbUF1ZGlvR3JhcGg6IElBdWRpb0dyYXBoIHwgbnVsbCA9IG51bGw7XG4gICAgLy8gYSBjdXN0b20gYXVkaW8gY29udGV4dCBjcmVhdGVkIGJ5IHRoZSB1c2VyXG4gICAgcHJvdGVjdGVkIF9jdXN0b21BdWRpb0NvbnRleHQ6IElBdWRpb0NvbnRleHQgfCBudWxsID0gbnVsbDtcbiAgICAvLyBzdG9wIHRoZSBzb25nIGN1cnJlbnRseSBiZWluZyBwbGF5ZWQgb24gKHF1ZXVlKSByZXNldFxuICAgIHByb3RlY3RlZCBfc3RvcE9uUmVzZXQ6IGJvb2xlYW47XG5cbiAgICAvLyBjb25zdGFudHNcbiAgICByZWFkb25seSBXSEVSRV9JTl9RVUVVRV9BVF9FTkQ6IHN0cmluZyA9ICdhcHBlbmQnO1xuICAgIHJlYWRvbmx5IFdIRVJFX0lOX1FVRVVFX0FUX1NUQVJUOiBzdHJpbmcgPSAncHJlcGVuZCc7XG4gICAgcmVhZG9ubHkgV0hFUkVfSU5fUVVFVUVfQUZURVJfQ1VSUkVOVDogc3RyaW5nID0gJ2FmdGVyQ3VycmVudCc7XG5cbiAgICByZWFkb25seSBQTEFZX1NPVU5EX05FWFQgPSAnbmV4dCc7XG4gICAgcmVhZG9ubHkgUExBWV9TT1VORF9QUkVWSU9VUyA9ICdwcmV2aW91cyc7XG4gICAgcmVhZG9ubHkgUExBWV9TT1VORF9GSVJTVCA9ICdmaXJzdCc7XG4gICAgcmVhZG9ubHkgUExBWV9TT1VORF9MQVNUID0gJ2xhc3QnO1xuXG4gICAgY29uc3RydWN0b3IocGxheWVyT3B0aW9uczogSUNvcmVPcHRpb25zID0ge30pIHtcblxuICAgICAgICBsZXQgZGVmYXVsdE9wdGlvbnMgPSB7XG4gICAgICAgICAgICB2b2x1bWU6IDgwLFxuICAgICAgICAgICAgbG9vcFF1ZXVlOiBmYWxzZSxcbiAgICAgICAgICAgIHNvdW5kc0Jhc2VVcmw6ICcnLFxuICAgICAgICAgICAgcGxheWluZ1Byb2dyZXNzSW50ZXJ2YWxUaW1lOiAxMDAwLFxuICAgICAgICAgICAgcGxheU5leHRPbkVuZGVkOiB0cnVlLFxuICAgICAgICAgICAgc3RvcE9uUmVzZXQ6IHRydWVcbiAgICAgICAgfTtcblxuICAgICAgICBsZXQgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRPcHRpb25zLCBwbGF5ZXJPcHRpb25zKTtcblxuICAgICAgICB0aGlzLl92b2x1bWUgPSBvcHRpb25zLnZvbHVtZTtcbiAgICAgICAgdGhpcy5fc291bmRzQmFzZVVybCA9IG9wdGlvbnMuc291bmRzQmFzZVVybDtcbiAgICAgICAgdGhpcy5fcXVldWUgPSBbXTtcbiAgICAgICAgdGhpcy5fY3VycmVudEluZGV4ID0gMDtcbiAgICAgICAgdGhpcy5fcGxheWluZ1Byb2dyZXNzSW50ZXJ2YWxUaW1lID0gb3B0aW9ucy5wbGF5aW5nUHJvZ3Jlc3NJbnRlcnZhbFRpbWU7XG4gICAgICAgIHRoaXMuX3BsYXlOZXh0T25FbmRlZCA9IG9wdGlvbnMucGxheU5leHRPbkVuZGVkO1xuICAgICAgICB0aGlzLl9sb29wUXVldWUgPSBvcHRpb25zLmxvb3BRdWV1ZTtcbiAgICAgICAgdGhpcy5fc3RvcE9uUmVzZXQgPSBvcHRpb25zLnN0b3BPblJlc2V0O1xuXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5hdWRpb0NvbnRleHQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aGlzLl9jdXN0b21BdWRpb0NvbnRleHQgPSBvcHRpb25zLmF1ZGlvQ29udGV4dDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5hdWRpb0dyYXBoICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhpcy5fY3VzdG9tQXVkaW9HcmFwaCA9IG9wdGlvbnMuYXVkaW9HcmFwaDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2luaXRpYWxpemUoKTtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfaW5pdGlhbGl6ZSgpIHtcblxuICAgICAgICAvLyBUT0RPOiBjaGVjayBpZiB3ZWIgYXVkaW8gYXBpIGlzIGF2YWlsYWJsZVxuICAgICAgICBsZXQgd2ViQXVkaW9BcGkgPSB0cnVlO1xuXG4gICAgICAgIC8vIGlzIHRoZSB3ZWIgYXVkaW8gYXBpIHN1cHBvcnRlZFxuICAgICAgICAvLyBpZiBub3Qgd2Ugd2lsbCB1c2UgdGhlIGF1ZGlvIGVsZW1lbnQgYXMgZmFsbGJhY2tcbiAgICAgICAgaWYgKHdlYkF1ZGlvQXBpKSB7XG4gICAgICAgICAgICB0aGlzLl9pc1dlYkF1ZGlvQXBpU3VwcG9ydGVkID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIHVzZSB0aGUgaHRtbDUgYXVkaW8gZWxlbWVudFxuICAgICAgICAgICAgdGhpcy5faXNXZWJBdWRpb0FwaVN1cHBvcnRlZCA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGF1ZGlvT3B0aW9uczogSUF1ZGlvT3B0aW9ucyA9IHtcbiAgICAgICAgICAgIHZvbHVtZTogdGhpcy5fdm9sdW1lLFxuICAgICAgICAgICAgY3VzdG9tQXVkaW9Db250ZXh0OiB0aGlzLl9jdXN0b21BdWRpb0NvbnRleHQsXG4gICAgICAgICAgICBjdXN0b21BdWRpb0dyYXBoOiB0aGlzLl9jdXN0b21BdWRpb0dyYXBoXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gcGxheWVyIGF1ZGlvIGxpYnJhcnkgaW5zdGFuY2VcbiAgICAgICAgdGhpcy5fcGxheWVyQXVkaW8gPSBuZXcgUGxheWVyQXVkaW8oYXVkaW9PcHRpb25zKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBhZGRTb3VuZFRvUXVldWUoc291bmRBdHRyaWJ1dGVzOiBJU291bmRBdHRyaWJ1dGVzLCB3aGVyZUluUXVldWU6IHN0cmluZyA9IHRoaXMuV0hFUkVfSU5fUVVFVUVfQVRfRU5EKTogSVNvdW5kIHtcblxuICAgICAgICBsZXQgc291bmQ6IElTb3VuZCA9IG5ldyBQbGF5ZXJTb3VuZChzb3VuZEF0dHJpYnV0ZXMpO1xuXG4gICAgICAgIC8vIFRPRE86IGlzIHF1ZXVlIGp1c3QgYW4gYXJyYXkgb2Ygc291bmRzLCBvciBkbyB3ZSBuZWVkIHNvbWV0aGluZyBtb3JlIGNvbXBsZXggd2l0aCBhIHBvc2l0aW9uIHRyYWNrZXI/XG5cbiAgICAgICAgLy8gVE9ETzogYWxsb3cgYXJyYXkgb2Ygc291bmRBdHRyaWJ1dGVzIHRvIGJlIGluamVjdGVkLCB0byBjcmVhdGUgc2V2ZXJhbCBhdCBvbmNlLCBpZiBpbnB1dCBpcyBhbiBhcnJheSBvdXRwdXQgc2hvdWxkIGJlIHRvb1xuXG4gICAgICAgIHN3aXRjaCAod2hlcmVJblF1ZXVlKSB7XG4gICAgICAgICAgICBjYXNlIHRoaXMuV0hFUkVfSU5fUVVFVUVfQVRfRU5EOlxuICAgICAgICAgICAgICAgIHRoaXMuX2FwcGVuZFNvdW5kVG9RdWV1ZShzb3VuZCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIHRoaXMuV0hFUkVfSU5fUVVFVUVfQVRfU1RBUlQ6XG4gICAgICAgICAgICAgICAgdGhpcy5fcHJlcGVuZFNvdW5kVG9RdWV1ZShzb3VuZCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIHRoaXMuV0hFUkVfSU5fUVVFVUVfQUZURVJfQ1VSUkVOVDpcbiAgICAgICAgICAgICAgICB0aGlzLl9wcmVwZW5kU291bmRUb1F1ZXVlKHNvdW5kKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzb3VuZDtcblxuICAgIH1cblxuICAgIHB1YmxpYyBfYXBwZW5kU291bmRUb1F1ZXVlKHNvdW5kOiBJU291bmQpOiB2b2lkIHtcblxuICAgICAgICB0aGlzLl9xdWV1ZS5wdXNoKHNvdW5kKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBfcHJlcGVuZFNvdW5kVG9RdWV1ZShzb3VuZDogSVNvdW5kKTogdm9pZCB7XG5cbiAgICAgICAgdGhpcy5fcXVldWUudW5zaGlmdChzb3VuZCk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgX2FkZFNvdW5kVG9RdWV1ZUFmdGVyQ3VycmVudChzb3VuZDogSVNvdW5kKTogdm9pZCB7XG5cbiAgICAgICAgLy8gVE9ETzogYWRkIG9wdGlvbiB0byBwbGF5IGFmdGVyIGJlaW5nIGFkZGVkIG9yIHVzZXIgdXNlcyBwbGF5IG1ldGhvZD9cblxuICAgICAgICAvLyBpZiB0aGVyZSBpcyBubyBjdXJyZW50IHNvbmcgeWV0LCBhcHBlbmQgdGhlIHNvbmcgdG8gdGhlIHF1ZXVlXG4gICAgICAgIGlmICh0aGlzLl9jdXJyZW50SW5kZXggPT09IG51bGwpIHtcblxuICAgICAgICAgICAgdGhpcy5fYXBwZW5kU291bmRUb1F1ZXVlKHNvdW5kKTtcblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICBsZXQgYWZ0ZXJDdXJyZW50SW5kZXggPSB0aGlzLl9jdXJyZW50SW5kZXggKyAxO1xuXG4gICAgICAgICAgICB0aGlzLl9xdWV1ZS5zcGxpY2UoYWZ0ZXJDdXJyZW50SW5kZXgsIDAsIHNvdW5kKTtcblxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgcmVzZXRRdWV1ZSgpIHtcblxuICAgICAgICAvLyBjaGVjayBpZiBhIHNvbmcgaXMgZ2V0dGluZyBwbGF5ZWQgYW5kIHN0b3AgaXRcbiAgICAgICAgaWYgKHRoaXMuX3N0b3BPblJlc2V0KSB7XG5cbiAgICAgICAgICAgIHRoaXMuc3RvcCgpO1xuXG4gICAgICAgIH1cblxuICAgICAgICAvLyBUT0RPOiBkZXN0cm95IGFsbCB0aGUgc291bmRzIG9yIGNsZWFyIHRoZSBjYWNoZWQgYnVmZmVycz9cblxuICAgICAgICB0aGlzLl9xdWV1ZSA9IFtdO1xuXG4gICAgfVxuXG4gICAgcHVibGljIHJlc2V0KCkge1xuXG4gICAgICAgIHRoaXMucmVzZXRRdWV1ZSgpO1xuXG4gICAgfVxuXG4gICAgcHVibGljIGdldFF1ZXVlKCkge1xuXG4gICAgICAgIC8vIFRPRE86IGlzIHRoZSBuZWVkZWQ/XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX3F1ZXVlO1xuXG4gICAgfVxuXG4gICAgcHVibGljIHNldFZvbHVtZSh2b2x1bWU6IG51bWJlcik6IHZvaWQge1xuXG4gICAgICAgIHRoaXMuX3ZvbHVtZSA9IHZvbHVtZTtcblxuICAgICAgICB0aGlzLl9wbGF5ZXJBdWRpby5jaGFuZ2VHYWluVmFsdWUodm9sdW1lKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBnZXRWb2x1bWUoKTogbnVtYmVyIHtcblxuICAgICAgICByZXR1cm4gdGhpcy5fdm9sdW1lO1xuXG4gICAgfVxuXG4gICAgcHVibGljIG11dGUoKSB7XG5cbiAgICAgICAgdGhpcy5zZXRWb2x1bWUoMCk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0UG9zaXRpb24oc291bmRQb3NpdGlvbkluUGVyY2VudDogbnVtYmVyKTogdm9pZCB7XG5cbiAgICAgICAgLy8gZ2V0IHRoZSBjdXJyZW50IHNvdW5kIGlmIGFueVxuICAgICAgICBsZXQgY3VycmVudFNvdW5kID0gdGhpcy5fZ2V0U291bmRGcm9tUXVldWUoKTtcblxuICAgICAgICAvLyBpZiB0aGVyZSBpcyBhIHNvdW5kIGN1cnJlbnRseSBiZWluZyBwbGF5ZWRcbiAgICAgICAgaWYgKGN1cnJlbnRTb3VuZCAhPT0gbnVsbCkge1xuXG4gICAgICAgICAgICAvLyBjaGVjayBpZiB0aGUgZHVyYXRpb24gZ290IHNldCBtYW51YWxseVxuICAgICAgICAgICAgaWYgKGN1cnJlbnRTb3VuZC5kdXJhdGlvbiA9PT0gbnVsbCkge1xuXG4gICAgICAgICAgICAgICAgLy8gdGhlIHVzZXIgY2FuIHNldCB0aGUgc291bmQgZHVyYXRpb24gbWFudWFsbHkgYnV0IGlmIGhlIGRpZG4ndCB0aGUgc29uZyBoYXMgdG9cbiAgICAgICAgICAgICAgICAvLyBnZXQgcHJlbG9hZGVkIGFzIHRoZSBkdXJhdGlvbiBpcyBhIHByb3BlcnR5IG9mIHRoZSBhdWRpb0J1ZmZlclxuICAgICAgICAgICAgICAgIHRoaXMuX2xvYWRTb3VuZChjdXJyZW50U291bmQpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKChzb3VuZDogSVNvdW5kKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNhbGN1bGF0ZSB0aGUgcG9zaXRpb24gaW4gc2Vjb25kc1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHNvdW5kUG9zaXRpb25JblNlY29uZHMgPSAoc291bmQuZHVyYXRpb24gLyAxMDApICogc291bmRQb3NpdGlvbkluUGVyY2VudDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRQb3NpdGlvbkluU2Vjb25kcyhzb3VuZFBvc2l0aW9uSW5TZWNvbmRzKTtcblxuICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyb3I6IFBsYXllckVycm9yKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IHRocm93IGVycm9yPz8/XG5cbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAvLyBjYWxjdWxhdGUgdGhlIHBvc2l0aW9uIGluIHNlY29uZHNcbiAgICAgICAgICAgICAgICBsZXQgc291bmRQb3NpdGlvbkluU2Vjb25kcyA9IChjdXJyZW50U291bmQuZHVyYXRpb24gLyAxMDApICogc291bmRQb3NpdGlvbkluUGVyY2VudDtcblxuICAgICAgICAgICAgICAgIHRoaXMuc2V0UG9zaXRpb25JblNlY29uZHMoc291bmRQb3NpdGlvbkluU2Vjb25kcyk7XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAvLyBUT0RPOiB0aHJvdyBlcnJvcj8/P1xuXG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHB1YmxpYyBzZXRQb3NpdGlvbkluU2Vjb25kcyhzb3VuZFBvc2l0aW9uSW5TZWNvbmRzOiBudW1iZXIpIHtcblxuICAgICAgICAvLyBnZXQgdGhlIGN1cnJlbnQgc291bmQgaWYgYW55XG4gICAgICAgIGxldCBjdXJyZW50U291bmQgPSB0aGlzLl9nZXRTb3VuZEZyb21RdWV1ZSgpO1xuXG4gICAgICAgIC8vIGlmIHRoZXJlIGlzIGEgc291bmQgY3VycmVudGx5IGJlaW5nIHBsYXllZFxuICAgICAgICBpZiAoY3VycmVudFNvdW5kICE9PSBudWxsKSB7XG5cbiAgICAgICAgICAgIC8vIGlzIHRoZSBzb25nIGlzIGJlaW5nIHBsYXllZFxuICAgICAgICAgICAgaWYgKGN1cnJlbnRTb3VuZC5pc1BsYXlpbmcpIHtcblxuICAgICAgICAgICAgICAgIC8vIHN0b3AgdGhlIHRyYWNrIHBsYXliYWNrXG4gICAgICAgICAgICAgICAgdGhpcy5wYXVzZSgpO1xuXG4gICAgICAgICAgICAgICAgLy8gc3RhcnQgdGhlIHBsYXliYWNrIGF0IHRoZSBnaXZlbiBwb3NpdGlvblxuICAgICAgICAgICAgICAgIHRoaXMucGxheShjdXJyZW50U291bmQuaWQsIHNvdW5kUG9zaXRpb25JblNlY29uZHMpO1xuXG4gICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgLy8gb25seSBzZXQgdGhlIHNvdW5kIHBvc2l0aW9uIGJ1dCBkb24ndCBwbGF5XG4gICAgICAgICAgICAgICAgY3VycmVudFNvdW5kLnBsYXlUaW1lT2Zmc2V0ID0gc291bmRQb3NpdGlvbkluU2Vjb25kcztcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgIC8vIFRPRE86IHRocm93IGVycm9yPz8/XG5cbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9sb2FkU291bmQoc291bmQ6IElTb3VuZCk6IFByb21pc2U8SVNvdW5kIHwgUGxheWVyRXJyb3I+IHtcblxuICAgICAgICAvLyBUT0RPOiB3b3VsZCBiZSBnb29kIHRvIGNhY2hlIGJ1ZmZlcnMsIHNvIG5lZWQgdG8gY2hlY2sgaWYgaXMgaW4gY2FjaGVcbiAgICAgICAgLy8gbGV0IHRoZSB1c2VyIGNob29zZSAoYnkgc2V0dGluZyBhbiBvcHRpb24pIHdoYXQgYW1vdW50IG9mIHNvdW5kcyB3aWxsIGJlIGNhY2hlZFxuICAgICAgICAvLyBhZGQgYSBjYWNoZWQgZGF0ZSAvIHRpbWVzdGFtcCB0byBiZSBhYmxlIHRvIGNsZWFyIGNhY2hlIGJ5IG9sZGVzdCBmaXJzdFxuICAgICAgICAvLyBvciBldmVuIGJldHRlciBhZGQgYSBwbGF5ZWQgY291bnRlciB0byBjYWNoZSBieSBsZWFzdCBwbGF5ZWQgYW5kIGRhdGVcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgICAgICAvLyBpZiB0aGUgc291bmQgYWxyZWFkeSBoYXMgYW4gQXVkaW9CdWZmZXJcbiAgICAgICAgICAgIGlmIChzb3VuZC5hdWRpb0J1ZmZlciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoc291bmQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBpZiB0aGUgc291bmQgaGFzIGFscmVhZHkgYW4gQXJyYXlCdWZmZXIgYnV0IG5vIEF1ZGlvQnVmZmVyXG4gICAgICAgICAgICBpZiAoc291bmQuYXJyYXlCdWZmZXIgIT09IG51bGwgJiYgc291bmQuYXVkaW9CdWZmZXIgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fZGVjb2RlU291bmQoc291bmQsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGlmIHRoZSBzb3VuZCBoYXMgbm8gQXJyYXlCdWZmZXIgYW5kIGFsc28gbm8gQXVkaW9CdWZmZXIgeWV0XG4gICAgICAgICAgICBpZiAoc291bmQuYXJyYXlCdWZmZXIgPT09IG51bGwgJiYgc291bmQuYXVkaW9CdWZmZXIgPT09IG51bGwpIHtcblxuICAgICAgICAgICAgICAgIC8vIGV4dHJhY3QgdGhlIHVybCBhbmQgY29kZWMgZnJvbSBzb3VyY2VzXG4gICAgICAgICAgICAgICAgbGV0IHsgdXJsLCBjb2RlYyA9IG51bGwgfSA9IHRoaXMuX3NvdXJjZVRvVmFyaWFibGVzKHNvdW5kLnNvdXJjZXMpO1xuXG4gICAgICAgICAgICAgICAgc291bmQudXJsID0gdXJsO1xuICAgICAgICAgICAgICAgIHNvdW5kLmNvZGVjID0gY29kZWM7XG5cbiAgICAgICAgICAgICAgICBpZiAoc291bmQudXJsICE9PSBudWxsKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgbGV0IHJlcXVlc3QgPSBuZXcgUGxheWVyUmVxdWVzdCgpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGNoYW5nZSBidWZmZXJpbmcgc3RhdGVcbiAgICAgICAgICAgICAgICAgICAgc291bmQuaXNCdWZmZXJpbmcgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3QuZ2V0QXJyYXlCdWZmZXIoc291bmQpLnRoZW4oKGFycmF5QnVmZmVyOiBBcnJheUJ1ZmZlcikgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VuZC5hcnJheUJ1ZmZlciA9IGFycmF5QnVmZmVyO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fZGVjb2RlU291bmQoc291bmQsIHJlc29sdmUsIHJlamVjdCk7XG5cbiAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goKHJlcXVlc3RFcnJvcjogSVBsYXllckVycm9yKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChyZXF1ZXN0RXJyb3IpO1xuXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgICAgICBsZXQgbm9VcmxFcnJvciA9IG5ldyBQbGF5ZXJFcnJvcignc291bmQgaGFzIG5vIHVybCcsIDEpO1xuXG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChub1VybEVycm9yKTtcblxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9kZWNvZGVTb3VuZChzb3VuZDogSVNvdW5kLCByZXNvbHZlOiBGdW5jdGlvbiwgcmVqZWN0OiBGdW5jdGlvbikge1xuXG4gICAgICAgIGxldCBhcnJheUJ1ZmZlciA9IHNvdW5kLmFycmF5QnVmZmVyO1xuXG4gICAgICAgIHRoaXMuX3BsYXllckF1ZGlvLmRlY29kZUF1ZGlvKGFycmF5QnVmZmVyKS50aGVuKChhdWRpb0J1ZmZlcjogQXVkaW9CdWZmZXIpID0+IHtcblxuICAgICAgICAgICAgc291bmQuYXVkaW9CdWZmZXIgPSBhdWRpb0J1ZmZlcjtcbiAgICAgICAgICAgIHNvdW5kLmlzQnVmZmVyaW5nID0gZmFsc2U7XG4gICAgICAgICAgICBzb3VuZC5pc0J1ZmZlcmVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHNvdW5kLmF1ZGlvQnVmZmVyRGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICBzb3VuZC5kdXJhdGlvbiA9IHNvdW5kLmF1ZGlvQnVmZmVyLmR1cmF0aW9uO1xuXG4gICAgICAgICAgICByZXNvbHZlKHNvdW5kKTtcblxuICAgICAgICB9KS5jYXRjaCgoZGVjb2RlQXVkaW9FcnJvcjogSVBsYXllckVycm9yKSA9PiB7XG5cbiAgICAgICAgICAgIHJlamVjdChkZWNvZGVBdWRpb0Vycm9yKTtcblxuICAgICAgICB9KTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBwbGF5KHdoaWNoU291bmQ/OiBudW1iZXIgfCBzdHJpbmcgfCB1bmRlZmluZWQsIHBsYXlUaW1lT2Zmc2V0PzogbnVtYmVyKTogdm9pZCB7XG5cbiAgICAgICAgLy8gVE9ETzogY2hlY2sgdGhlIGF2YWlsYWJsZSBjb2RlY3MgYW5kIGRlZmluZWQgc291cmNlcywgcGxheSB0aGUgZmlyc3Qgb25lIHRoYXQgaGFzIG1hdGNoZXMgYW5kIGF2YWlsYWJsZSBjb2RlY1xuICAgICAgICAvLyBUT0RPOiBsZXQgdXNlciBkZWZpbmUgb3JkZXIgb2YgcHJlZmVycmVkIGNvZGVjcyBmb3IgcGxheWVyYmFja1xuXG4gICAgICAgIC8vIGdldCB0aGUgY3VycmVudCBzb3VuZCBpZiBhbnlcbiAgICAgICAgbGV0IGN1cnJlbnRTb3VuZCA9IHRoaXMuX2dldFNvdW5kRnJvbVF1ZXVlKCk7XG5cbiAgICAgICAgLy8gaWYgdGhlcmUgaXMgYSBzb3VuZCBjdXJyZW50bHkgYmVpbmcgcGxheWVkXG4gICAgICAgIGlmIChjdXJyZW50U291bmQgIT09IG51bGwgJiYgY3VycmVudFNvdW5kLmlzUGxheWluZykge1xuXG4gICAgICAgICAgICAvLyBzdG9wIHRoZSBjdXJyZW50IHNvdW5kXG4gICAgICAgICAgICB0aGlzLnN0b3AoKTtcblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gd2hpY2hTb3VuZCBpcyBvcHRpb25hbCwgaWYgc2V0IGl0IGNhbiBiZSB0aGUgc291bmQgaWQgb3IgaWYgaXQncyBhIHN0cmluZyBpdCBjYW4gYmUgbmV4dCAvIHByZXZpb3VzIC8gZmlyc3QgLyBsYXN0XG4gICAgICAgIGxldCBzb3VuZCA9IHRoaXMuX2dldFNvdW5kRnJvbVF1ZXVlKHdoaWNoU291bmQpO1xuXG4gICAgICAgIC8vIGlmIHRoZXJlIGlzIG5vIHNvdW5kIHdlIGNvdWxkIHBsYXksIGRvIG5vdGhpbmdcbiAgICAgICAgaWYgKHNvdW5kID09PSBudWxsKSB7XG5cbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAgICAgLy8gVE9ETzogdGhyb3cgYW4gZXJyb3I/XG5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGlmIHRoZSB1c2VyIHdhbnRzIHRvIHBsYXkgdGhlIHNvdW5kIGZyb20gYSBjZXJ0YWluIHBvc2l0aW9uXG4gICAgICAgIGlmIChwbGF5VGltZU9mZnNldCAhPT0gdW5kZWZpbmVkKSB7XG5cbiAgICAgICAgICAgIHNvdW5kLnBsYXlUaW1lT2Zmc2V0ID0gcGxheVRpbWVPZmZzZXQ7XG5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGhhcyB0aGUgc291bmQgYWxyZWFkeSBiZWVuIGxvYWRlZD9cbiAgICAgICAgaWYgKCFzb3VuZC5pc0J1ZmZlcmVkKSB7XG5cbiAgICAgICAgICAgIHRoaXMuX2xvYWRTb3VuZChzb3VuZCkudGhlbigoKSA9PiB7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9wbGF5KHNvdW5kKTtcblxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBoYW5kbGUgZXJyb3JcblxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgdGhpcy5fcGxheShzb3VuZCk7XG5cbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9wbGF5KHNvdW5kOiBJU291bmQpIHtcblxuICAgICAgICAvLyBzb3VyY2Ugbm9kZSBvcHRpb25zXG4gICAgICAgIGxldCBzb3VyY2VOb2RlT3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGxvb3A6IHNvdW5kLmxvb3AsXG4gICAgICAgICAgICBvbkVuZGVkOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5fb25FbmRlZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGNyZWF0ZSBhIG5ldyBzb3VyY2Ugbm9kZVxuICAgICAgICB0aGlzLl9wbGF5ZXJBdWRpby5jcmVhdGVTb3VyY2VOb2RlKHNvdXJjZU5vZGVPcHRpb25zKS50aGVuKChzb3VyY2VOb2RlKSA9PiB7XG5cbiAgICAgICAgICAgIHNvdW5kLmlzUGxheWluZyA9IHRydWU7XG4gICAgICAgICAgICBzb3VuZC5zb3VyY2VOb2RlID0gc291cmNlTm9kZTtcblxuICAgICAgICAgICAgLy8gYWRkIHRoZSBidWZmZXIgdG8gdGhlIHNvdXJjZSBub2RlXG4gICAgICAgICAgICBzb3VyY2VOb2RlLmJ1ZmZlciA9IHNvdW5kLmF1ZGlvQnVmZmVyO1xuXG4gICAgICAgICAgICAvLyB0aGUgYXVkaW9jb250ZXh0IHRpbWUgcmlnaHQgbm93IChzaW5jZSB0aGUgYXVkaW9jb250ZXh0IGdvdCBjcmVhdGVkKVxuICAgICAgICAgICAgc291bmQuc3RhcnRUaW1lID0gc291cmNlTm9kZS5jb250ZXh0LmN1cnJlbnRUaW1lO1xuXG4gICAgICAgICAgICAvLyBjb25uZWN0IHRoZSBzb3VyY2UgdG8gdGhlIGdyYXBoIG5vZGUocylcbiAgICAgICAgICAgIHRoaXMuX3BsYXllckF1ZGlvLmNvbm5lY3RTb3VyY2VOb2RlVG9HcmFwaE5vZGVzKHNvdXJjZU5vZGUpO1xuXG4gICAgICAgICAgICAvLyBzdGFydCBwbGF5YmFja1xuICAgICAgICAgICAgLy8gc3RhcnQod2hlbiwgb2Zmc2V0LCBkdXJhdGlvbilcbiAgICAgICAgICAgIHNvdXJjZU5vZGUuc3RhcnQoMCwgc291bmQucGxheVRpbWVPZmZzZXQpO1xuXG4gICAgICAgICAgICAvLyB0cmlnZ2VyIHJlc3VtZWQgZXZlbnRcbiAgICAgICAgICAgIGlmIChzb3VuZC5vblJlc3VtZWQgIT09IG51bGwgJiYgIXNvdW5kLmZpcnN0VGltZVBsYXllZCkge1xuICAgICAgICAgICAgICAgIHNvdW5kLm9uUmVzdW1lZChzb3VuZC5wbGF5VGltZU9mZnNldCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHRyaWdnZXIgc3RhcnRlZCBldmVudFxuICAgICAgICAgICAgaWYgKHNvdW5kLm9uU3RhcnRlZCAhPT0gbnVsbCAmJiBzb3VuZC5maXJzdFRpbWVQbGF5ZWQpIHtcblxuICAgICAgICAgICAgICAgIHNvdW5kLm9uU3RhcnRlZChzb3VuZC5wbGF5VGltZU9mZnNldCk7XG5cbiAgICAgICAgICAgICAgICBzb3VuZC5maXJzdFRpbWVQbGF5ZWQgPSBmYWxzZTtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyB0cmlnZ2VyIHBsYXlpbmcgZXZlbnRcbiAgICAgICAgICAgIGlmIChzb3VuZC5vblBsYXlpbmcgIT09IG51bGwpIHtcblxuICAgICAgICAgICAgICAgIC8vIGF0IGludGVydmFsIHNldCBwbGF5aW5nIHByb2dyZXNzXG4gICAgICAgICAgICAgICAgdGhpcy5fcGxheWluZ1RpbWVvdXRJRCA9IHNldEludGVydmFsKCgpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wbGF5aW5nUHJvZ3Jlc3Moc291bmQpO1xuXG4gICAgICAgICAgICAgICAgfSwgdGhpcy5fcGxheWluZ1Byb2dyZXNzSW50ZXJ2YWxUaW1lKTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgIHRoaXMuX3BsYXlpbmdUaW1lb3V0SUQgPSBudWxsO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG5cbiAgICAgICAgICAgIC8vIFRPRE86IGhhbmRsZSBlcnJvclxuXG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9vbkVuZGVkKCkge1xuXG4gICAgICAgIC8vIGdldCB0aGUgY3VycmVudCBzb3VuZCBpZiBhbnlcbiAgICAgICAgbGV0IGN1cnJlbnRTb3VuZCA9IHRoaXMuX2dldFNvdW5kRnJvbVF1ZXVlKCk7XG5cbiAgICAgICAgLy8gaWYgdGhlcmUgaXMgYSBzb3VuZCBjdXJyZW50bHkgYmVpbmcgcGxheWVkXG4gICAgICAgIGlmIChjdXJyZW50U291bmQgIT09IG51bGwgJiYgY3VycmVudFNvdW5kLmlzUGxheWluZykge1xuXG4gICAgICAgICAgICBsZXQgdXBkYXRlSW5kZXggPSBmYWxzZTtcblxuICAgICAgICAgICAgbGV0IG5leHRTb3VuZCA9IHRoaXMuX2dldFNvdW5kRnJvbVF1ZXVlKCduZXh0JywgdXBkYXRlSW5kZXgpO1xuXG4gICAgICAgICAgICBpZiAoY3VycmVudFNvdW5kLm9uRW5kZWQgIT09IG51bGwpIHtcblxuICAgICAgICAgICAgICAgIGxldCB3aWxsUGxheU5leHQgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgIC8vIGNoZWNrIGlmIHRoZXJlIGlzIGFub3RoZXIgc291bmQgaW4gdGhlIHF1ZXVlIGFuZCBpZiBwbGF5aW5nXG4gICAgICAgICAgICAgICAgLy8gdGhlIG5leHQgb25lIG9uIGVuZGVkIGlzIGFjdGl2YXRlZFxuICAgICAgICAgICAgICAgIGlmIChuZXh0U291bmQgIT09IG51bGwgJiYgdGhpcy5fcGxheU5leHRPbkVuZGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHdpbGxQbGF5TmV4dCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY3VycmVudFNvdW5kLm9uRW5kZWQod2lsbFBsYXlOZXh0KTtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyByZXNldCB0aGUgaXMgZmlyc3QgdGltZSBzb3VuZCBpcyBiZWluZyBwbGF5ZWQgdG8gdHJ1ZVxuICAgICAgICAgICAgY3VycmVudFNvdW5kLmZpcnN0VGltZVBsYXllZCA9IHRydWU7XG5cbiAgICAgICAgICAgIC8vIHJlc2V0IHRoZSBwbGF5VGltZU9mZnNldFxuICAgICAgICAgICAgY3VycmVudFNvdW5kLnBsYXlUaW1lT2Zmc2V0ID0gMDtcblxuICAgICAgICAgICAgdGhpcy5fc3RvcChjdXJyZW50U291bmQpO1xuXG4gICAgICAgICAgICBpZiAobmV4dFNvdW5kICE9PSBudWxsKSB7XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fcGxheU5leHRPbkVuZGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGxheSgnbmV4dCcpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgIC8vIHdlIHJlYWNoZWQgdGhlIGVuZCBvZiB0aGUgcXVldWUgc2V0IHRoZSBjdXJyZW50SW5kZXggYmFjayB0byB6ZXJvXG4gICAgICAgICAgICAgICAgdGhpcy5fY3VycmVudEluZGV4ID0gMDtcblxuICAgICAgICAgICAgICAgIC8vIGlmIHF1ZXVlIGxvb3AgaXMgYWN0aXZlIHRoZW4gcGxheVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9sb29wUXVldWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wbGF5KCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogd2hpY2hTb3VuZCBpcyBvcHRpb25hbCwgaWYgc2V0IGl0IGNhbiBiZSB0aGUgc291bmQgaWQgb3IgaWYgaXQnc1xuICAgICAqIGEgc3RyaW5nIGl0IGNhbiBiZSBuZXh0IC8gcHJldmlvdXMgLyBmaXJzdCAvIGxhc3RcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgX2dldFNvdW5kRnJvbVF1ZXVlKHdoaWNoU291bmQ/OiBzdHJpbmcgfCBudW1iZXIsIHVwZGF0ZUluZGV4OiBib29sZWFuID0gdHJ1ZSk6IElTb3VuZCB8IG51bGwge1xuXG4gICAgICAgIGxldCBzb3VuZCA9IG51bGw7XG5cbiAgICAgICAgLy8gY2hlY2sgaWYgdGhlIHF1ZXVlIGlzIGVtcHR5XG4gICAgICAgIGlmICh0aGlzLl9xdWV1ZS5sZW5ndGggPT09IDApIHtcblxuICAgICAgICAgICAgcmV0dXJuIHNvdW5kO1xuXG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiB3aGljaCBzb25nIHRvIHBsYXkgZGlkIG5vdCBnZXQgc3BlY2lmaWVkLCBwbGF5IG9uZSBiYXNlZCBmcm9tIHRoZSBxdWV1ZSBiYXNlZCBvbiB0aGUgcXVldWUgaW5kZXggcG9zaXRpb24gbWFya2VyXG4gICAgICAgIGlmICh3aGljaFNvdW5kID09PSB1bmRlZmluZWQgJiYgdGhpcy5fcXVldWVbdGhpcy5fY3VycmVudEluZGV4XSAhPT0gdW5kZWZpbmVkKSB7XG5cbiAgICAgICAgICAgIHNvdW5kID0gdGhpcy5fcXVldWVbdGhpcy5fY3VycmVudEluZGV4XTtcblxuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB3aGljaFNvdW5kID09PSAnbnVtYmVyJykge1xuXG4gICAgICAgICAgICAvLyBpZiB3aGljaCBzb25nIHRvIHBsYXkgaXMgYSBudW1lcmljIElEXG4gICAgICAgICAgICBzb3VuZCA9IHRoaXMuX2ZpbmRTb3VuZEJ5SWQod2hpY2hTb3VuZCwgdXBkYXRlSW5kZXgpO1xuXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgIGxldCBzb3VuZEluZGV4OiBudW1iZXIgfCBudWxsID0gbnVsbDtcblxuICAgICAgICAgICAgLy8gaWYgd2hpY2ggc29uZyB0byBwbGF5IGlzIGEgY29uc3RhbnRcbiAgICAgICAgICAgIHN3aXRjaCAod2hpY2hTb3VuZCkge1xuICAgICAgICAgICAgICAgIGNhc2UgdGhpcy5QTEFZX1NPVU5EX05FWFQ6XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9xdWV1ZVt0aGlzLl9jdXJyZW50SW5kZXggKyAxXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VuZEluZGV4ID0gdGhpcy5fY3VycmVudEluZGV4ICsgMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdW5kID0gdGhpcy5fcXVldWVbc291bmRJbmRleF07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSB0aGlzLlBMQVlfU09VTkRfUFJFVklPVVM6XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9xdWV1ZVt0aGlzLl9jdXJyZW50SW5kZXggLSAxXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VuZEluZGV4ID0gdGhpcy5fY3VycmVudEluZGV4IC0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdW5kID0gdGhpcy5fcXVldWVbc291bmRJbmRleF07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSB0aGlzLlBMQVlfU09VTkRfRklSU1Q6XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9xdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VuZEluZGV4ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdW5kID0gdGhpcy5fcXVldWVbc291bmRJbmRleF07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSB0aGlzLlBMQVlfU09VTkRfTEFTVDpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX3F1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdW5kSW5kZXggPSB0aGlzLl9xdWV1ZS5sZW5ndGggLSAyO1xuICAgICAgICAgICAgICAgICAgICAgICAgc291bmQgPSB0aGlzLl9xdWV1ZVtzb3VuZEluZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAvLyBpZiB3aGljaCBzb25nIHRvIHBsYXkgaXMgYSBzdHJpbmcgSURcbiAgICAgICAgICAgICAgICAgICAgc291bmQgPSB0aGlzLl9maW5kU291bmRCeUlkKHdoaWNoU291bmQsIHVwZGF0ZUluZGV4KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHNvdW5kSW5kZXggIT09IG51bGwgJiYgdXBkYXRlSW5kZXgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9jdXJyZW50SW5kZXggPSBzb3VuZEluZGV4O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc291bmQ7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX2ZpbmRTb3VuZEJ5SWQoc291bmRJZDogc3RyaW5nIHwgbnVtYmVyLCB1cGRhdGVJbmRleDogYm9vbGVhbik6IElTb3VuZCB8IG51bGwge1xuXG4gICAgICAgIGxldCBzb3VuZCA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5fcXVldWUuc29tZSgoc291bmRGcm9tUXVldWU6IElTb3VuZCwgcXVldWVJbmRleDogbnVtYmVyKSA9PiB7XG5cbiAgICAgICAgICAgIGlmIChzb3VuZEZyb21RdWV1ZS5pZCA9PT0gc291bmRJZCkge1xuXG4gICAgICAgICAgICAgICAgc291bmQgPSBzb3VuZEZyb21RdWV1ZTtcblxuICAgICAgICAgICAgICAgIGlmICh1cGRhdGVJbmRleCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jdXJyZW50SW5kZXggPSBxdWV1ZUluZGV4O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHNvdW5kO1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9zb3VyY2VUb1ZhcmlhYmxlcyhzb3VyY2VzOiAoSVNvdW5kU291cmNlIHwgc3RyaW5nKVtdKTogeyB1cmw6IHN0cmluZyB8IG51bGwsIGNvZGVjPzogc3RyaW5nIHwgbnVsbCB9IHtcblxuICAgICAgICAvLyBUT0RPOiBzb3VyY2UgY2FuIGJlIG9uIG9iamVjdCB3aGVyZSB0aGUgcHJvcGVydHkgbmFtZSBpcyB0aGUgY29kZWMgYW5kIHRoZSB2YWx1ZSBpcyB0aGUgc291bmQgdXJsXG4gICAgICAgIC8vIGlmIHNvdW5kIGlzbnQgYW4gb2JqZWN0IHRyeSB0byBkZXRlY3Qgc291bmQgc291cmNlIGV4dGVuc2lvbiBieSBmaWxlIGV4dGVudGlvbiBvciBieSBjaGVja2luZyB0aGUgZmlsZSBtaW1lIHR5cGVcblxuICAgICAgICAvLyBUT0RPOiBnZXQgYSBsaXN0IG9mIHN1cHBvcnRlZCBjb2RlY3MgYnkgdGhpcyBkZXZpY2VcblxuICAgICAgICBsZXQgZmlyc3RNYXRjaGluZ1NvdXJjZTogeyB1cmw6IHN0cmluZyB8IG51bGwsIGNvZGVjPzogc3RyaW5nIHwgbnVsbCB9ID0ge1xuICAgICAgICAgICAgdXJsOiBudWxsLFxuICAgICAgICAgICAgY29kZWM6IG51bGxcbiAgICAgICAgfTtcblxuICAgICAgICBzb3VyY2VzLmZvckVhY2goKHNvdXJjZSkgPT4ge1xuXG4gICAgICAgICAgICAvLyBUT0RPOiBmaW5kIG91dCB3aGF0IHRoZSBzb3VyY2UgY29kZWMgaXNcblxuICAgICAgICAgICAgLy8gVE9ETzogY2hlY2sgaWYgdGhlIHNvdXJjZSBjb2RlYyBpcyBhbW9uZyB0aGUgb25lcyB0aGF0IGFyZSBzdXBwb3J0ZWQgYnkgdGhpcyBkZXZpY2VcblxuICAgICAgICAgICAgbGV0IHNvdW5kVXJsID0gJyc7XG5cbiAgICAgICAgICAgIC8vIGlmIHRoZSBwbGF5ZXIgaGFkIGFzIG9wdGlvbiBhIGJhc2VVcmwgZm9yIHNvdW5kcyBhZGQgaXQgbm93XG4gICAgICAgICAgICBpZiAodGhpcy5fc291bmRzQmFzZVVybCAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICBzb3VuZFVybCA9IHRoaXMuX3NvdW5kc0Jhc2VVcmw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHR3byBraW5kIG9mIHNvdXJjZSBhcmUgcG9zc2libGUsIGEgc3RyaW5nICh0aGUgdXJsKSBvciBhbiBvYmplY3QgKGtleSBpcyB0aGUgY29kZWMgYW5kIHZhbHVlIGlzIHRoZSB1cmwpXG4gICAgICAgICAgICBpZiAodHlwZW9mIHNvdXJjZSA9PT0gJ3N0cmluZycpIHtcblxuICAgICAgICAgICAgICAgIHNvdW5kVXJsICs9IHNvdXJjZTtcblxuICAgICAgICAgICAgICAgIGZpcnN0TWF0Y2hpbmdTb3VyY2UgPSB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogc291bmRVcmxcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgc291bmRVcmwgKz0gc291cmNlLnVybDtcblxuICAgICAgICAgICAgICAgIGZpcnN0TWF0Y2hpbmdTb3VyY2UgPSB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogc291bmRVcmwsXG4gICAgICAgICAgICAgICAgICAgIGNvZGVjOiBzb3VyY2UuY29kZWNcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGZpcnN0TWF0Y2hpbmdTb3VyY2U7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgcGF1c2UoKSB7XG5cbiAgICAgICAgLy8gZ2V0IHRoZSBjdXJyZW50IHNvdW5kXG4gICAgICAgIGxldCBzb3VuZDogSVNvdW5kIHwgbnVsbCA9IHRoaXMuX2dldFNvdW5kRnJvbVF1ZXVlKCk7XG5cbiAgICAgICAgaWYgKHNvdW5kID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgdGltZUF0UGF1c2UgPSBzb3VuZC5zb3VyY2VOb2RlLmNvbnRleHQuY3VycmVudFRpbWU7XG5cbiAgICAgICAgc291bmQucGxheVRpbWVPZmZzZXQgKz0gdGltZUF0UGF1c2UgLSBzb3VuZC5zdGFydFRpbWU7XG5cbiAgICAgICAgLy8gdHJpZ2dlciBwYXVzZWQgZXZlbnRcbiAgICAgICAgaWYgKHNvdW5kLm9uUGF1c2VkICE9PSBudWxsKSB7XG4gICAgICAgICAgICBzb3VuZC5vblBhdXNlZChzb3VuZC5wbGF5VGltZU9mZnNldCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9zdG9wKHNvdW5kKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBzdG9wKCkge1xuXG4gICAgICAgIC8vIGdldCB0aGUgY3VycmVudCBzb3VuZFxuICAgICAgICBsZXQgc291bmQ6IElTb3VuZCB8IG51bGwgPSB0aGlzLl9nZXRTb3VuZEZyb21RdWV1ZSgpO1xuXG4gICAgICAgIGlmIChzb3VuZCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFzb3VuZC5pc1BsYXlpbmcpIHtcbiAgICAgICAgICAgIC8vIFRPRE86IGp1c3QgcmV0dXJuIG9yIHRocm93IGFuIGVycm9yXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyByZXNldCB0aGUgaXMgZmlyc3QgdGltZSBzb3VuZCBpcyBiZWluZyBwbGF5ZWQgdG8gdHJ1ZVxuICAgICAgICBzb3VuZC5maXJzdFRpbWVQbGF5ZWQgPSB0cnVlO1xuXG4gICAgICAgIC8vIHRyaWdnZXIgc3RvcHBlZCBldmVudFxuICAgICAgICBpZiAoc291bmQub25TdG9wcGVkICE9PSBudWxsKSB7XG4gICAgICAgICAgICBzb3VuZC5vblN0b3BwZWQoc291bmQucGxheVRpbWVPZmZzZXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcmVzZXQgdGhlIHBsYXlUaW1lT2Zmc2V0XG4gICAgICAgIHNvdW5kLnBsYXlUaW1lT2Zmc2V0ID0gMDtcblxuICAgICAgICB0aGlzLl9zdG9wKHNvdW5kKTtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfc3RvcChzb3VuZDogSVNvdW5kKSB7XG5cbiAgICAgICAgLy8gdGVsbCB0aGUgc291cmNlTm9kZSB0byBzdG9wIHBsYXlpbmdcbiAgICAgICAgc291bmQuc291cmNlTm9kZS5zdG9wKDApO1xuXG4gICAgICAgIC8vIHRlbGwgdGhlIHNvdW5kIHRoYXQgcGxheWluZyBpcyBvdmVyXG4gICAgICAgIHNvdW5kLmlzUGxheWluZyA9IGZhbHNlO1xuXG4gICAgICAgIC8vIGRlc3Ryb3kgdGhlIHNvdXJjZSBub2RlIGFzIGl0IGNhbiBhbnl3YXkgb25seSBnZXQgdXNlZCBvbmNlXG4gICAgICAgIHRoaXMuX3BsYXllckF1ZGlvLmRlc3Ryb3lTb3VyY2VOb2RlKHNvdW5kLnNvdXJjZU5vZGUpO1xuXG4gICAgICAgIHNvdW5kLnNvdXJjZU5vZGUgPSBudWxsO1xuXG4gICAgICAgIGlmICh0aGlzLl9wbGF5aW5nVGltZW91dElEICE9PSBudWxsKSB7XG5cbiAgICAgICAgICAgIC8vIGNsZWFyIHRoZSBwbGF5aW5nIHByb2dyZXNzIHNldEludGVydmFsXG4gICAgICAgICAgICBjbGVhckludGVydmFsKHRoaXMuX3BsYXlpbmdUaW1lb3V0SUQpO1xuXG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHB1YmxpYyBuZXh0KCkge1xuXG4gICAgICAgIC8vIGFsaWFzIGZvciBwbGF5IG5leHRcbiAgICAgICAgdGhpcy5wbGF5KCduZXh0Jyk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgcHJldmlvdXMoKSB7XG5cbiAgICAgICAgLy8gYWxpYXMgZm9yIHBsYXkgcHJldmlvdXNcbiAgICAgICAgdGhpcy5wbGF5KCdwcmV2aW91cycpO1xuXG4gICAgfVxuXG4gICAgcHVibGljIGZpcnN0KCkge1xuXG4gICAgICAgIC8vIGFsaWFzIGZvciBwbGF5IGZpcnN0XG4gICAgICAgIHRoaXMucGxheSgnZmlyc3QnKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBsYXN0KCkge1xuXG4gICAgICAgIC8vIGFsaWFzIGZvciBwbGF5IGxhc3RcbiAgICAgICAgdGhpcy5wbGF5KCdsYXN0Jyk7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX3BsYXlpbmdQcm9ncmVzcyhzb3VuZDogSVNvdW5kKSB7XG5cbiAgICAgICAgbGV0IHRpbWVOb3cgPSBzb3VuZC5zb3VyY2VOb2RlLmNvbnRleHQuY3VycmVudFRpbWU7XG5cbiAgICAgICAgc291bmQucGxheVRpbWUgPSAodGltZU5vdyAtIHNvdW5kLnN0YXJ0VGltZSkgKyBzb3VuZC5wbGF5VGltZU9mZnNldDtcblxuICAgICAgICBsZXQgcGxheWluZ1BlcmNlbnRhZ2UgPSAoc291bmQucGxheVRpbWUgLyBzb3VuZC5hdWRpb0J1ZmZlci5kdXJhdGlvbikgKiAxMDA7XG5cbiAgICAgICAgc291bmQucGxheWVkVGltZVBlcmNlbnRhZ2UgPSBwbGF5aW5nUGVyY2VudGFnZTtcblxuICAgICAgICBzb3VuZC5vblBsYXlpbmcocGxheWluZ1BlcmNlbnRhZ2UsIHNvdW5kLmF1ZGlvQnVmZmVyLmR1cmF0aW9uLCBzb3VuZC5wbGF5VGltZSk7XG5cbiAgICB9O1xuXG4gICAgcHVibGljIHNldEF1ZGlvR3JhcGgoY3VzdG9tQXVkaW9HcmFwaDogSUF1ZGlvR3JhcGgpIHtcblxuICAgICAgICB0aGlzLl9wbGF5ZXJBdWRpby5zZXRBdWRpb0dyYXBoKGN1c3RvbUF1ZGlvR3JhcGgpO1xuXG4gICAgICAgIHRoaXMuX2N1c3RvbUF1ZGlvR3JhcGggPSBjdXN0b21BdWRpb0dyYXBoO1xuXG4gICAgfVxuXG4gICAgcHVibGljIGdldEF1ZGlvR3JhcGgoKTogUHJvbWlzZTxJQXVkaW9HcmFwaD4ge1xuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgICAgIHRoaXMuX3BsYXllckF1ZGlvLmdldEF1ZGlvR3JhcGgoKS50aGVuKChhdWRpb0dyYXBoOiBJQXVkaW9HcmFwaCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fY3VzdG9tQXVkaW9HcmFwaCA9IGF1ZGlvR3JhcGg7XG5cbiAgICAgICAgICAgICAgICByZXNvbHZlKGF1ZGlvR3JhcGgpO1xuXG4gICAgICAgICAgICB9KS5jYXRjaChyZWplY3QpO1xuXG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0QXVkaW9Db250ZXh0KGN1c3RvbUF1ZGlvQ29udGV4dDogSUF1ZGlvQ29udGV4dCkge1xuXG4gICAgICAgIHRoaXMuX3BsYXllckF1ZGlvLnNldEF1ZGlvQ29udGV4dChjdXN0b21BdWRpb0NvbnRleHQpO1xuXG4gICAgICAgIHRoaXMuX2N1c3RvbUF1ZGlvQ29udGV4dCA9IGN1c3RvbUF1ZGlvQ29udGV4dDtcblxuICAgIH1cblxuICAgIHB1YmxpYyBnZXRBdWRpb0NvbnRleHQoKTogUHJvbWlzZTxJQXVkaW9Db250ZXh0PiB7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICAgICAgdGhpcy5fcGxheWVyQXVkaW8uZ2V0QXVkaW9Db250ZXh0KCkudGhlbigoYXVkaW9Db250ZXh0OiBJQXVkaW9Db250ZXh0KSA9PiB7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9jdXN0b21BdWRpb0NvbnRleHQgPSBhdWRpb0NvbnRleHQ7XG5cbiAgICAgICAgICAgICAgICByZXNvbHZlKGF1ZGlvQ29udGV4dCk7XG5cbiAgICAgICAgICAgIH0pLmNhdGNoKHJlamVjdCk7XG5cbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbn1cbiJdfQ==

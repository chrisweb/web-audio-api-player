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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9saWJyYXJ5L2NvcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0lBQ0EsWUFBWSxDQUFDOztJQUViLGlDQUE4RTtJQUM5RSxpQ0FBaUY7SUFDakYscUNBQTBDO0lBQzFDLGlDQUFvRDtJQVlwRDtRQXFDSSxvQkFBWSxhQUFnQztZQUFoQyw4QkFBQSxFQUFBLGtCQUFnQztZQXJCNUMsNkJBQTZCO1lBQ25CLHNCQUFpQixHQUFrQixJQUFJLENBQUM7WUFLbEQsMENBQTBDO1lBQ2hDLHNCQUFpQixHQUF1QixJQUFJLENBQUM7WUFDdkQsNkNBQTZDO1lBQ25DLHdCQUFtQixHQUF5QixJQUFJLENBQUM7WUFFM0QsWUFBWTtZQUNILDBCQUFxQixHQUFXLFFBQVEsQ0FBQztZQUN6Qyw0QkFBdUIsR0FBVyxTQUFTLENBQUM7WUFDNUMsaUNBQTRCLEdBQVcsY0FBYyxDQUFDO1lBRXRELG9CQUFlLEdBQUcsTUFBTSxDQUFDO1lBQ3pCLHdCQUFtQixHQUFHLFVBQVUsQ0FBQztZQUNqQyxxQkFBZ0IsR0FBRyxPQUFPLENBQUM7WUFDM0Isb0JBQWUsR0FBRyxNQUFNLENBQUM7WUFJOUIsSUFBSSxjQUFjLEdBQUc7Z0JBQ2pCLE1BQU0sRUFBRSxFQUFFO2dCQUNWLFNBQVMsRUFBRSxLQUFLO2dCQUNoQixhQUFhLEVBQUUsRUFBRTtnQkFDakIsMkJBQTJCLEVBQUUsSUFBSTtnQkFDakMsZUFBZSxFQUFFLElBQUk7YUFDeEIsQ0FBQztZQUVGLElBQUksT0FBTyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLGNBQWMsRUFBRSxhQUFhLENBQUMsQ0FBQztZQUUvRCxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFDOUIsSUFBSSxDQUFDLGNBQWMsR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDO1lBQzVDLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO1lBQ2pCLElBQUksQ0FBQyxhQUFhLEdB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QyxrQkFBa0IsQ0FBQyxDQUFDO1lBRXRELElBQUksQ0FBQyxtQkFBbUIsR0FBRyxrQkFBa0IsQ0FBQztRQUVsRCxDQUFDO1FBRU0sb0NBQWUsR0FBdEI7WUFBQSxpQkFjQztZQVpHLE1BQU0sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxVQUFDLE9BQU8sRUFBRSxNQUFNO2dCQUUvQixLQUFJLENBQUMsWUFBWSxDQUFDLGVBQWUsRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFDLFlBQTJCO29CQUVqRSxLQUFJLENBQUMsbUJBQW1CLEdBQUcsWUFBWSxDQUFDO29CQUV4QyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBRTFCLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUVyQixDQUFDLENBQUMsQ0FBQztRQUVQLENBQUM7UUFFTCxpQkFBQztJQUFELENBMXpCQSxBQTB6QkMsSUFBQTtJQTF6QlksZ0NBQVUiLCJmaWxlIjoibGlicmFyeS9jb3JlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IFBsYXllclNvdW5kLCBJU291bmQsIElTb3VuZEF0dHJpYnV0ZXMsIElTb3VuZFNvdXJjZSB9IGZyb20gJy4vc291bmQnO1xuaW1wb3J0IHsgUGxheWVyQXVkaW8sIElBdWRpb0dyYXBoLCBJQXVkaW9Db250ZXh0LCBJQXVkaW9PcHRpb25zIH0gZnJvbSAnLi9hdWRpbyc7XG5pbXBvcnQgeyBQbGF5ZXJSZXF1ZXN0IH0gZnJvbSAnLi9yZXF1ZXN0JztcbmltcG9ydCB7IFBsYXllckVycm9yLCBJUGxheWVyRXJyb3IgfSBmcm9tICcuL2Vycm9yJztcblxuZXhwb3J0IGludGVyZmFjZSBJQ29yZU9wdGlvbnMge1xuICAgIHZvbHVtZT86IG51bWJlcjtcbiAgICBsb29wUXVldWU/OiBib29sZWFuO1xuICAgIHNvdW5kc0Jhc2VVcmw/OiBzdHJpbmc7XG4gICAgcGxheWluZ1Byb2dyZXNzSW50ZXJ2YWxUaW1lPzogbnVtYmVyO1xuICAgIHBsYXlOZXh0T25FbmRlZD86IGJvb2xlYW47XG4gICAgYXVkaW9HcmFwaD86IElBdWRpb0dyYXBoO1xuICAgIGF1ZGlvQ29udGV4dD86IElBdWRpb0NvbnRleHQ7XG59XG5cbmV4cG9ydCBjbGFzcyBQbGF5ZXJDb3JlIHtcblxuICAgIC8vIGlzIHRoZSB3ZWIgYXVkaW8gQVBJIHN1cHBvcnRlZFxuICAgIHByb3RlY3RlZCBfaXNXZWJBdWRpb0FwaVN1cHBvcnRlZDogYm9vbGVhbjtcbiAgICAvLyB0aGUgc291bmRzIHF1ZXVlXG4gICAgcHJvdGVjdGVkIF9xdWV1ZTogSVNvdW5kW107XG4gICAgLy8gdGhlIHZvbHVtZSAoMCB0byAxMDApXG4gICAgcHJvdGVjdGVkIF92b2x1bWU6IG51bWJlcjtcbiAgICAvLyB0aGUgYmFzZSB1cmwgdGhhdCBhbGwgc291bmRzIHdpbGwgaGF2ZSBpbiBjb21tb25cbiAgICBwcm90ZWN0ZWQgX3NvdW5kc0Jhc2VVcmw6IHN0cmluZztcbiAgICAvLyB0aGUgY3VycmVudCBzb3VuZCBpbiBxdWV1ZSBpbmRleFxuICAgIHByb3RlY3RlZCBfY3VycmVudEluZGV4OiBudW1iZXI7XG4gICAgLy8gaW5zdGFuY2Ugb2YgdGhlIGF1ZGlvIGxpYnJhcnkgY2xhc3NcbiAgICBwcm90ZWN0ZWQgX3BsYXllckF1ZGlvOiBQbGF5ZXJBdWRpbztcbiAgICAvLyBwbGF5aW5nIHByb2dyZXNzIHRpbWUgaW50ZXJ2YWxcbiAgICBwcm90ZWN0ZWQgX3BsYXlpbmdQcm9ncmVzc0ludGVydmFsVGltZTogbnVtYmVyO1xuICAgIC8vIHBsYXlpbmcgcHJvZ3Jlc3MgdGltZW91dElEXG4gICAgcHJvdGVjdGVkIF9wbGF5aW5nVGltZW91dElEOiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgICAvLyB3aGVuIGEgc29uZyBmaW5pc2hlcywgYXV0b21hdGljYWxseSBwbGF5IHRoZSBuZXh0IG9uZVxuICAgIHByb3RlY3RlZCBfcGxheU5leHRPbkVuZGVkOiBib29sZWFuO1xuICAgIC8vIGRvIHdlIHN0YXJ0IG92ZXIgZ2FpbiBhdCB0aGUgZW5kIG9mIHRoZSBxdWV1ZVxuICAgIHByb3RlY3RlZCBfbG9vcFF1ZXVlOiBib29sZWFuO1xuICAgIC8vIGEgY3VzdG9uIGF1ZGlvR3JhcGggY3JlYXRlZCBieSB0aGUgdXNlclxuICAgIHByb3RlY3RlZCBfY3VzdG9tQXVkaW9HcmFwaDogSUF1ZGlvR3JhcGggfCBudWxsID0gbnVsbDtcbiAgICAvLyBhIGN1c3RvbSBhdWRpbyBjb250ZXh0IGNyZWF0ZWQgYnkgdGhlIHVzZXJcbiAgICBwcm90ZWN0ZWQgX2N1c3RvbUF1ZGlvQ29udGV4dDogSUF1ZGlvQ29udGV4dCB8IG51bGwgPSBudWxsO1xuXG4gICAgLy8gY29uc3RhbnRzXG4gICAgcmVhZG9ubHkgV0hFUkVfSU5fUVVFVUVfQVRfRU5EOiBzdHJpbmcgPSAnYXBwZW5kJztcbiAgICByZWFkb25seSBXSEVSRV9JTl9RVUVVRV9BVF9TVEFSVDogc3RyaW5nID0gJ3ByZXBlbmQnO1xuICAgIHJlYWRvbmx5IFdIRVJFX0lOX1FVRVVFX0FGVEVSX0NVUlJFTlQ6IHN0cmluZyA9ICdhZnRlckN1cnJlbnQnO1xuXG4gICAgcmVhZG9ubHkgUExBWV9TT1VORF9ORVhUID0gJ25leHQnO1xuICAgIHJlYWRvbmx5IFBMQVlfU09VTkRfUFJFVklPVVMgPSAncHJldmlvdXMnO1xuICAgIHJlYWRvbmx5IFBMQVlfU09VTkRfRklSU1QgPSAnZmlyc3QnO1xuICAgIHJlYWRvbmx5IFBMQVlfU09VTkRfTEFTVCA9ICdsYXN0JztcblxuICAgIGNvbnN0cnVjdG9yKHBsYXllck9wdGlvbnM6IElDb3JlT3B0aW9ucyA9IHt9KSB7XG5cbiAgICAgICAgbGV0IGRlZmF1bHRPcHRpb25zID0ge1xuICAgICAgICAgICAgdm9sdW1lOiA4MCxcbiAgICAgICAgICAgIGxvb3BRdWV1ZTogZmFsc2UsXG4gICAgICAgICAgICBzb3VuZHNCYXNlVXJsOiAnJyxcbiAgICAgICAgICAgIHBsYXlpbmdQcm9ncmVzc0ludGVydmFsVGltZTogMTAwMCxcbiAgICAgICAgICAgIHBsYXlOZXh0T25FbmRlZDogdHJ1ZVxuICAgICAgICB9O1xuXG4gICAgICAgIGxldCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdE9wdGlvbnMsIHBsYXllck9wdGlvbnMpO1xuXG4gICAgICAgIHRoaXMuX3ZvbHVtZSA9IG9wdGlvbnMudm9sdW1lO1xuICAgICAgICB0aGlzLl9zb3VuZHNCYXNlVXJsID0gb3B0aW9ucy5zb3VuZHNCYXNlVXJsO1xuICAgICAgICB0aGlzLl9xdWV1ZSA9IFtdO1xuICAgICAgICB0aGlzLl9jdXJyZW50SW5kZXggPSAwO1xuICAgICAgICB0aGlzLl9wbGF5aW5nUHJvZ3Jlc3NJbnRlcnZhbFRpbWUgPSBvcHRpb25zLnBsYXlpbmdQcm9ncmVzc0ludGVydmFsVGltZTtcbiAgICAgICAgdGhpcy5fcGxheU5leHRPbkVuZGVkID0gb3B0aW9ucy5wbGF5TmV4dE9uRW5kZWQ7XG4gICAgICAgIHRoaXMuX2xvb3BRdWV1ZSA9IG9wdGlvbnMubG9vcFF1ZXVlO1xuXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5hdWRpb0NvbnRleHQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aGlzLl9jdXN0b21BdWRpb0NvbnRleHQgPSBvcHRpb25zLmF1ZGlvQ29udGV4dDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5hdWRpb0dyYXBoICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhpcy5fY3VzdG9tQXVkaW9HcmFwaCA9IG9wdGlvbnMuYXVkaW9HcmFwaDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2luaXRpYWxpemUoKTtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfaW5pdGlhbGl6ZSgpIHtcblxuICAgICAgICAvLyBUT0RPOiBjaGVjayBpZiB3ZWIgYXVkaW8gYXBpIGlzIGF2YWlsYWJsZVxuICAgICAgICBsZXQgd2ViQXVkaW9BcGkgPSB0cnVlO1xuXG4gICAgICAgIC8vIGlzIHRoZSB3ZWIgYXVkaW8gYXBpIHN1cHBvcnRlZFxuICAgICAgICAvLyBpZiBub3Qgd2Ugd2lsbCB1c2UgdGhlIGF1ZGlvIGVsZW1lbnQgYXMgZmFsbGJhY2tcbiAgICAgICAgaWYgKHdlYkF1ZGlvQXBpKSB7XG4gICAgICAgICAgICB0aGlzLl9pc1dlYkF1ZGlvQXBpU3VwcG9ydGVkID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIHVzZSB0aGUgaHRtbDUgYXVkaW8gZWxlbWVudFxuICAgICAgICAgICAgdGhpcy5faXNXZWJBdWRpb0FwaVN1cHBvcnRlZCA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGF1ZGlvT3B0aW9uczogSUF1ZGlvT3B0aW9ucyA9IHtcbiAgICAgICAgICAgIHZvbHVtZTogdGhpcy5fdm9sdW1lLFxuICAgICAgICAgICAgY3VzdG9tQXVkaW9Db250ZXh0OiB0aGlzLl9jdXN0b21BdWRpb0NvbnRleHQsXG4gICAgICAgICAgICBjdXN0b21BdWRpb0dyYXBoOiB0aGlzLl9jdXN0b21BdWRpb0dyYXBoXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gcGxheWVyIGF1ZGlvIGxpYnJhcnkgaW5zdGFuY2VcbiAgICAgICAgdGhpcy5fcGxheWVyQXVkaW8gPSBuZXcgUGxheWVyQXVkaW8oYXVkaW9PcHRpb25zKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBhZGRTb3VuZFRvUXVldWUoc291bmRBdHRyaWJ1dGVzOiBJU291bmRBdHRyaWJ1dGVzLCB3aGVyZUluUXVldWU6IHN0cmluZyA9IHRoaXMuV0hFUkVfSU5fUVVFVUVfQVRfRU5EKTogSVNvdW5kIHtcblxuICAgICAgICBsZXQgc291bmQ6IElTb3VuZCA9IG5ldyBQbGF5ZXJTb3VuZChzb3VuZEF0dHJpYnV0ZXMpO1xuXG4gICAgICAgIC8vIFRPRE86IGlzIHF1ZXVlIGp1c3QgYW4gYXJyYXkgb2Ygc291bmRzLCBvciBkbyB3ZSBuZWVkIHNvbWV0aGluZyBtb3JlIGNvbXBsZXggd2l0aCBhIHBvc2l0aW9uIHRyYWNrZXI/XG5cbiAgICAgICAgLy8gVE9ETzogYWxsb3cgYXJyYXkgb2Ygc291bmRBdHRyaWJ1dGVzIHRvIGJlIGluamVjdGVkLCB0byBjcmVhdGUgc2V2ZXJhbCBhdCBvbmNlLCBpZiBpbnB1dCBpcyBhbiBhcnJheSBvdXRwdXQgc2hvdWxkIGJlIHRvb1xuXG4gICAgICAgIHN3aXRjaCAod2hlcmVJblF1ZXVlKSB7XG4gICAgICAgICAgICBjYXNlIHRoaXMuV0hFUkVfSU5fUVVFVUVfQVRfRU5EOlxuICAgICAgICAgICAgICAgIHRoaXMuX2FwcGVuZFNvdW5kVG9RdWV1ZShzb3VuZCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIHRoaXMuV0hFUkVfSU5fUVVFVUVfQVRfU1RBUlQ6XG4gICAgICAgICAgICAgICAgdGhpcy5fcHJlcGVuZFNvdW5kVG9RdWV1ZShzb3VuZCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIHRoaXMuV0hFUkVfSU5fUVVFVUVfQUZURVJfQ1VSUkVOVDpcbiAgICAgICAgICAgICAgICB0aGlzLl9wcmVwZW5kU291bmRUb1F1ZXVlKHNvdW5kKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzb3VuZDtcblxuICAgIH1cblxuICAgIHB1YmxpYyBfYXBwZW5kU291bmRUb1F1ZXVlKHNvdW5kOiBJU291bmQpOiB2b2lkIHtcblxuICAgICAgICB0aGlzLl9xdWV1ZS5wdXNoKHNvdW5kKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBfcHJlcGVuZFNvdW5kVG9RdWV1ZShzb3VuZDogSVNvdW5kKTogdm9pZCB7XG5cbiAgICAgICAgdGhpcy5fcXVldWUudW5zaGlmdChzb3VuZCk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgX2FkZFNvdW5kVG9RdWV1ZUFmdGVyQ3VycmVudChzb3VuZDogSVNvdW5kKTogdm9pZCB7XG5cbiAgICAgICAgLy8gVE9ETzogYWRkIG9wdGlvbiB0byBwbGF5IGFmdGVyIGJlaW5nIGFkZGVkIG9yIHVzZXIgdXNlcyBwbGF5IG1ldGhvZD9cblxuICAgICAgICAvLyBpZiB0aGVyZSBpcyBubyBjdXJyZW50IHNvbmcgeWV0LCBhcHBlbmQgdGhlIHNvbmcgdG8gdGhlIHF1ZXVlXG4gICAgICAgIGlmICh0aGlzLl9jdXJyZW50SW5kZXggPT09IG51bGwpIHtcblxuICAgICAgICAgICAgdGhpcy5fYXBwZW5kU291bmRUb1F1ZXVlKHNvdW5kKTtcblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICBsZXQgYWZ0ZXJDdXJyZW50SW5kZXggPSB0aGlzLl9jdXJyZW50SW5kZXggKyAxO1xuXG4gICAgICAgICAgICB0aGlzLl9xdWV1ZS5zcGxpY2UoYWZ0ZXJDdXJyZW50SW5kZXgsIDAsIHNvdW5kKTtcblxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgcmVzZXRRdWV1ZSgpIHtcblxuICAgICAgICB0aGlzLl9xdWV1ZSA9IFtdO1xuXG4gICAgICAgIC8vIFRPRE86IGNoZWNrIGlmIGEgc29uZyBpcyBnZXR0aW5nIHBsYXllZCBhbmQgc3RvcCBpdD9cblxuICAgIH1cblxuICAgIHB1YmxpYyBnZXRRdWV1ZSgpIHtcblxuICAgICAgICAvLyBUT0RPOiBpcyB0aGUgbmVlZGVkP1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9xdWV1ZTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBzZXRWb2x1bWUodm9sdW1lOiBudW1iZXIpOiB2b2lkIHtcblxuICAgICAgICB0aGlzLl92b2x1bWUgPSB2b2x1bWU7XG5cbiAgICAgICAgdGhpcy5fcGxheWVyQXVkaW8uY2hhbmdlR2FpblZhbHVlKHZvbHVtZSk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0Vm9sdW1lKCk6IG51bWJlciB7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX3ZvbHVtZTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBtdXRlKCkge1xuXG4gICAgICAgIHRoaXMuc2V0Vm9sdW1lKDApO1xuXG4gICAgfVxuXG4gICAgcHVibGljIHNldFBvc2l0aW9uKHNvdW5kUG9zaXRpb25JblBlcmNlbnQ6IG51bWJlcik6IHZvaWQge1xuXG4gICAgICAgIC8vIGdldCB0aGUgY3VycmVudCBzb3VuZCBpZiBhbnlcbiAgICAgICAgbGV0IGN1cnJlbnRTb3VuZCA9IHRoaXMuX2dldFNvdW5kRnJvbVF1ZXVlKCk7XG5cbiAgICAgICAgLy8gaWYgdGhlcmUgaXMgYSBzb3VuZCBjdXJyZW50bHkgYmVpbmcgcGxheWVkXG4gICAgICAgIGlmIChjdXJyZW50U291bmQgIT09IG51bGwpIHtcblxuICAgICAgICAgICAgLy8gY2hlY2sgaWYgdGhlIGR1cmF0aW9uIGdvdCBzZXQgbWFudWFsbHlcbiAgICAgICAgICAgIGlmIChjdXJyZW50U291bmQuZHVyYXRpb24gPT09IG51bGwpIHtcblxuICAgICAgICAgICAgICAgIC8vIHRoZSB1c2VyIGNhbiBzZXQgdGhlIHNvdW5kIGR1cmF0aW9uIG1hbnVhbGx5IGJ1dCBpZiBoZSBkaWRuJ3QgdGhlIHNvbmcgaGFzIHRvXG4gICAgICAgICAgICAgICAgLy8gZ2V0IHByZWxvYWRlZCBhcyB0aGUgZHVyYXRpb24gaXMgYSBwcm9wZXJ0eSBvZiB0aGUgYXVkaW9CdWZmZXJcbiAgICAgICAgICAgICAgICB0aGlzLl9sb2FkU291bmQoY3VycmVudFNvdW5kKVxuICAgICAgICAgICAgICAgICAgICAudGhlbigoc291bmQ6IElTb3VuZCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjYWxjdWxhdGUgdGhlIHBvc2l0aW9uIGluIHNlY29uZHNcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBzb3VuZFBvc2l0aW9uSW5TZWNvbmRzID0gKHNvdW5kLmR1cmF0aW9uIC8gMTAwKSAqIHNvdW5kUG9zaXRpb25JblBlcmNlbnQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0UG9zaXRpb25JblNlY29uZHMoc291bmRQb3NpdGlvbkluU2Vjb25kcyk7XG5cbiAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycm9yOiBQbGF5ZXJFcnJvcikgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiB0aHJvdyBlcnJvcj8/P1xuXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgLy8gY2FsY3VsYXRlIHRoZSBwb3NpdGlvbiBpbiBzZWNvbmRzXG4gICAgICAgICAgICAgICAgbGV0IHNvdW5kUG9zaXRpb25JblNlY29uZHMgPSAoY3VycmVudFNvdW5kLmR1cmF0aW9uIC8gMTAwKSAqIHNvdW5kUG9zaXRpb25JblBlcmNlbnQ7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnNldFBvc2l0aW9uSW5TZWNvbmRzKHNvdW5kUG9zaXRpb25JblNlY29uZHMpO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgLy8gVE9ETzogdGhyb3cgZXJyb3I/Pz9cblxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0UG9zaXRpb25JblNlY29uZHMoc291bmRQb3NpdGlvbkluU2Vjb25kczogbnVtYmVyKSB7XG5cbiAgICAgICAgLy8gZ2V0IHRoZSBjdXJyZW50IHNvdW5kIGlmIGFueVxuICAgICAgICBsZXQgY3VycmVudFNvdW5kID0gdGhpcy5fZ2V0U291bmRGcm9tUXVldWUoKTtcblxuICAgICAgICAvLyBpZiB0aGVyZSBpcyBhIHNvdW5kIGN1cnJlbnRseSBiZWluZyBwbGF5ZWRcbiAgICAgICAgaWYgKGN1cnJlbnRTb3VuZCAhPT0gbnVsbCkge1xuXG4gICAgICAgICAgICAvLyBpcyB0aGUgc29uZyBpcyBiZWluZyBwbGF5ZWRcbiAgICAgICAgICAgIGlmIChjdXJyZW50U291bmQuaXNQbGF5aW5nKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBzdG9wIHRoZSB0cmFjayBwbGF5YmFja1xuICAgICAgICAgICAgICAgIHRoaXMucGF1c2UoKTtcblxuICAgICAgICAgICAgICAgIC8vIHN0YXJ0IHRoZSBwbGF5YmFjayBhdCB0aGUgZ2l2ZW4gcG9zaXRpb25cbiAgICAgICAgICAgICAgICB0aGlzLnBsYXkoY3VycmVudFNvdW5kLmlkLCBzb3VuZFBvc2l0aW9uSW5TZWNvbmRzKTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgIC8vIG9ubHkgc2V0IHRoZSBzb3VuZCBwb3NpdGlvbiBidXQgZG9uJ3QgcGxheVxuICAgICAgICAgICAgICAgIGN1cnJlbnRTb3VuZC5wbGF5VGltZU9mZnNldCA9IHNvdW5kUG9zaXRpb25JblNlY29uZHM7XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAvLyBUT0RPOiB0aHJvdyBlcnJvcj8/P1xuXG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfbG9hZFNvdW5kKHNvdW5kOiBJU291bmQpOiBQcm9taXNlPElTb3VuZCB8IFBsYXllckVycm9yPiB7XG5cbiAgICAgICAgLy8gVE9ETzogd291bGQgYmUgZ29vZCB0byBjYWNoZSBidWZmZXJzLCBzbyBuZWVkIHRvIGNoZWNrIGlmIGlzIGluIGNhY2hlXG4gICAgICAgIC8vIGxldCB0aGUgdXNlciBjaG9vc2UgKGJ5IHNldHRpbmcgYW4gb3B0aW9uKSB3aGF0IGFtb3VudCBvZiBzb3VuZHMgd2lsbCBiZSBjYWNoZWRcbiAgICAgICAgLy8gYWRkIGEgY2FjaGVkIGRhdGUgLyB0aW1lc3RhbXAgdG8gYmUgYWJsZSB0byBjbGVhciBjYWNoZSBieSBvbGRlc3QgZmlyc3RcbiAgICAgICAgLy8gb3IgZXZlbiBiZXR0ZXIgYWRkIGEgcGxheWVkIGNvdW50ZXIgdG8gY2FjaGUgYnkgbGVhc3QgcGxheWVkIGFuZCBkYXRlXG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICAgICAgLy8gaWYgdGhlIHNvdW5kIGFscmVhZHkgaGFzIGFuIEF1ZGlvQnVmZmVyXG4gICAgICAgICAgICBpZiAoc291bmQuYXVkaW9CdWZmZXIgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHNvdW5kKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gaWYgdGhlIHNvdW5kIGhhcyBhbHJlYWR5IGFuIEFycmF5QnVmZmVyIGJ1dCBubyBBdWRpb0J1ZmZlclxuICAgICAgICAgICAgaWYgKHNvdW5kLmFycmF5QnVmZmVyICE9PSBudWxsICYmIHNvdW5kLmF1ZGlvQnVmZmVyID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2RlY29kZVNvdW5kKHNvdW5kLCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBpZiB0aGUgc291bmQgaGFzIG5vIEFycmF5QnVmZmVyIGFuZCBhbHNvIG5vIEF1ZGlvQnVmZmVyIHlldFxuICAgICAgICAgICAgaWYgKHNvdW5kLmFycmF5QnVmZmVyID09PSBudWxsICYmIHNvdW5kLmF1ZGlvQnVmZmVyID09PSBudWxsKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBleHRyYWN0IHRoZSB1cmwgYW5kIGNvZGVjIGZyb20gc291cmNlc1xuICAgICAgICAgICAgICAgIGxldCB7IHVybCwgY29kZWMgPSBudWxsIH0gPSB0aGlzLl9zb3VyY2VUb1ZhcmlhYmxlcyhzb3VuZC5zb3VyY2VzKTtcblxuICAgICAgICAgICAgICAgIHNvdW5kLnVybCA9IHVybDtcbiAgICAgICAgICAgICAgICBzb3VuZC5jb2RlYyA9IGNvZGVjO1xuXG4gICAgICAgICAgICAgICAgaWYgKHNvdW5kLnVybCAhPT0gbnVsbCkge1xuXG4gICAgICAgICAgICAgICAgICAgIGxldCByZXF1ZXN0ID0gbmV3IFBsYXllclJlcXVlc3QoKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBjaGFuZ2UgYnVmZmVyaW5nIHN0YXRlXG4gICAgICAgICAgICAgICAgICAgIHNvdW5kLmlzQnVmZmVyaW5nID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0LmdldEFycmF5QnVmZmVyKHNvdW5kKS50aGVuKChhcnJheUJ1ZmZlcjogQXJyYXlCdWZmZXIpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgc291bmQuYXJyYXlCdWZmZXIgPSBhcnJheUJ1ZmZlcjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2RlY29kZVNvdW5kKHNvdW5kLCByZXNvbHZlLCByZWplY3QpO1xuXG4gICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKChyZXF1ZXN0RXJyb3I6IElQbGF5ZXJFcnJvcikgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QocmVxdWVzdEVycm9yKTtcblxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAgICAgbGV0IG5vVXJsRXJyb3IgPSBuZXcgUGxheWVyRXJyb3IoJ3NvdW5kIGhhcyBubyB1cmwnLCAxKTtcblxuICAgICAgICAgICAgICAgICAgICByZWplY3Qobm9VcmxFcnJvcik7XG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KTtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfZGVjb2RlU291bmQoc291bmQ6IElTb3VuZCwgcmVzb2x2ZTogRnVuY3Rpb24sIHJlamVjdDogRnVuY3Rpb24pIHtcblxuICAgICAgICBsZXQgYXJyYXlCdWZmZXIgPSBzb3VuZC5hcnJheUJ1ZmZlcjtcblxuICAgICAgICB0aGlzLl9wbGF5ZXJBdWRpby5kZWNvZGVBdWRpbyhhcnJheUJ1ZmZlcikudGhlbigoYXVkaW9CdWZmZXI6IEF1ZGlvQnVmZmVyKSA9PiB7XG5cbiAgICAgICAgICAgIHNvdW5kLmF1ZGlvQnVmZmVyID0gYXVkaW9CdWZmZXI7XG4gICAgICAgICAgICBzb3VuZC5pc0J1ZmZlcmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgc291bmQuaXNCdWZmZXJlZCA9IHRydWU7XG4gICAgICAgICAgICBzb3VuZC5hdWRpb0J1ZmZlckRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgc291bmQuZHVyYXRpb24gPSBzb3VuZC5hdWRpb0J1ZmZlci5kdXJhdGlvbjtcblxuICAgICAgICAgICAgcmVzb2x2ZShzb3VuZCk7XG5cbiAgICAgICAgfSkuY2F0Y2goKGRlY29kZUF1ZGlvRXJyb3I6IElQbGF5ZXJFcnJvcikgPT4ge1xuXG4gICAgICAgICAgICByZWplY3QoZGVjb2RlQXVkaW9FcnJvcik7XG5cbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgcGxheSh3aGljaFNvdW5kPzogbnVtYmVyIHwgc3RyaW5nIHwgdW5kZWZpbmVkLCBwbGF5VGltZU9mZnNldD86IG51bWJlcik6IHZvaWQge1xuXG4gICAgICAgIC8vIFRPRE86IGNoZWNrIHRoZSBhdmFpbGFibGUgY29kZWNzIGFuZCBkZWZpbmVkIHNvdXJjZXMsIHBsYXkgdGhlIGZpcnN0IG9uZSB0aGF0IGhhcyBtYXRjaGVzIGFuZCBhdmFpbGFibGUgY29kZWNcbiAgICAgICAgLy8gVE9ETzogbGV0IHVzZXIgZGVmaW5lIG9yZGVyIG9mIHByZWZlcnJlZCBjb2RlY3MgZm9yIHBsYXllcmJhY2tcblxuICAgICAgICAvLyBnZXQgdGhlIGN1cnJlbnQgc291bmQgaWYgYW55XG4gICAgICAgIGxldCBjdXJyZW50U291bmQgPSB0aGlzLl9nZXRTb3VuZEZyb21RdWV1ZSgpO1xuXG4gICAgICAgIC8vIGlmIHRoZXJlIGlzIGEgc291bmQgY3VycmVudGx5IGJlaW5nIHBsYXllZFxuICAgICAgICBpZiAoY3VycmVudFNvdW5kICE9PSBudWxsICYmIGN1cnJlbnRTb3VuZC5pc1BsYXlpbmcpIHtcblxuICAgICAgICAgICAgLy8gc3RvcCB0aGUgY3VycmVudCBzb3VuZFxuICAgICAgICAgICAgdGhpcy5zdG9wKCk7XG5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHdoaWNoU291bmQgaXMgb3B0aW9uYWwsIGlmIHNldCBpdCBjYW4gYmUgdGhlIHNvdW5kIGlkIG9yIGlmIGl0J3MgYSBzdHJpbmcgaXQgY2FuIGJlIG5leHQgLyBwcmV2aW91cyAvIGZpcnN0IC8gbGFzdFxuICAgICAgICBsZXQgc291bmQgPSB0aGlzLl9nZXRTb3VuZEZyb21RdWV1ZSh3aGljaFNvdW5kKTtcblxuICAgICAgICAvLyBpZiB0aGVyZSBpcyBubyBzb3VuZCB3ZSBjb3VsZCBwbGF5LCBkbyBub3RoaW5nXG4gICAgICAgIGlmIChzb3VuZCA9PT0gbnVsbCkge1xuXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgICAgIC8vIFRPRE86IHRocm93IGFuIGVycm9yP1xuXG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiB0aGUgdXNlciB3YW50cyB0byBwbGF5IHRoZSBzb3VuZCBmcm9tIGEgY2VydGFpbiBwb3NpdGlvblxuICAgICAgICBpZiAocGxheVRpbWVPZmZzZXQgIT09IHVuZGVmaW5lZCkge1xuXG4gICAgICAgICAgICBzb3VuZC5wbGF5VGltZU9mZnNldCA9IHBsYXlUaW1lT2Zmc2V0O1xuXG4gICAgICAgIH1cblxuICAgICAgICAvLyBoYXMgdGhlIHNvdW5kIGFscmVhZHkgYmVlbiBsb2FkZWQ/XG4gICAgICAgIGlmICghc291bmQuaXNCdWZmZXJlZCkge1xuXG4gICAgICAgICAgICB0aGlzLl9sb2FkU291bmQoc291bmQpLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fcGxheShzb3VuZCk7XG5cbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnJvcikgPT4ge1xuXG4gICAgICAgICAgICAgICAgLy8gVE9ETzogaGFuZGxlIGVycm9yXG5cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgIHRoaXMuX3BsYXkoc291bmQpO1xuXG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfcGxheShzb3VuZDogSVNvdW5kKSB7XG5cbiAgICAgICAgLy8gc291cmNlIG5vZGUgb3B0aW9uc1xuICAgICAgICBsZXQgc291cmNlTm9kZU9wdGlvbnMgPSB7XG4gICAgICAgICAgICBsb29wOiBzb3VuZC5sb29wLFxuICAgICAgICAgICAgb25FbmRlZDogKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuX29uRW5kZWQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvLyBjcmVhdGUgYSBuZXcgc291cmNlIG5vZGVcbiAgICAgICAgdGhpcy5fcGxheWVyQXVkaW8uY3JlYXRlU291cmNlTm9kZShzb3VyY2VOb2RlT3B0aW9ucykudGhlbigoc291cmNlTm9kZSkgPT4ge1xuXG4gICAgICAgICAgICBzb3VuZC5pc1BsYXlpbmcgPSB0cnVlO1xuICAgICAgICAgICAgc291bmQuc291cmNlTm9kZSA9IHNvdXJjZU5vZGU7XG5cbiAgICAgICAgICAgIC8vIGFkZCB0aGUgYnVmZmVyIHRvIHRoZSBzb3VyY2Ugbm9kZVxuICAgICAgICAgICAgc291cmNlTm9kZS5idWZmZXIgPSBzb3VuZC5hdWRpb0J1ZmZlcjtcblxuICAgICAgICAgICAgLy8gdGhlIGF1ZGlvY29udGV4dCB0aW1lIHJpZ2h0IG5vdyAoc2luY2UgdGhlIGF1ZGlvY29udGV4dCBnb3QgY3JlYXRlZClcbiAgICAgICAgICAgIHNvdW5kLnN0YXJ0VGltZSA9IHNvdXJjZU5vZGUuY29udGV4dC5jdXJyZW50VGltZTtcblxuICAgICAgICAgICAgLy8gY29ubmVjdCB0aGUgc291cmNlIHRvIHRoZSBncmFwaCBub2RlKHMpXG4gICAgICAgICAgICB0aGlzLl9wbGF5ZXJBdWRpby5jb25uZWN0U291cmNlTm9kZVRvR3JhcGhOb2Rlcyhzb3VyY2VOb2RlKTtcblxuICAgICAgICAgICAgLy8gc3RhcnQgcGxheWJhY2tcbiAgICAgICAgICAgIC8vIHN0YXJ0KHdoZW4sIG9mZnNldCwgZHVyYXRpb24pXG4gICAgICAgICAgICBzb3VyY2VOb2RlLnN0YXJ0KDAsIHNvdW5kLnBsYXlUaW1lT2Zmc2V0KTtcblxuICAgICAgICAgICAgLy8gdHJpZ2dlciByZXN1bWVkIGV2ZW50XG4gICAgICAgICAgICBpZiAoc291bmQub25SZXN1bWVkICE9PSBudWxsICYmICFzb3VuZC5maXJzdFRpbWVQbGF5ZWQpIHtcbiAgICAgICAgICAgICAgICBzb3VuZC5vblJlc3VtZWQoc291bmQucGxheVRpbWVPZmZzZXQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyB0cmlnZ2VyIHN0YXJ0ZWQgZXZlbnRcbiAgICAgICAgICAgIGlmIChzb3VuZC5vblN0YXJ0ZWQgIT09IG51bGwgJiYgc291bmQuZmlyc3RUaW1lUGxheWVkKSB7XG5cbiAgICAgICAgICAgICAgICBzb3VuZC5vblN0YXJ0ZWQoc291bmQucGxheVRpbWVPZmZzZXQpO1xuXG4gICAgICAgICAgICAgICAgc291bmQuZmlyc3RUaW1lUGxheWVkID0gZmFsc2U7XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gdHJpZ2dlciBwbGF5aW5nIGV2ZW50XG4gICAgICAgICAgICBpZiAoc291bmQub25QbGF5aW5nICE9PSBudWxsKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBhdCBpbnRlcnZhbCBzZXQgcGxheWluZyBwcm9ncmVzc1xuICAgICAgICAgICAgICAgIHRoaXMuX3BsYXlpbmdUaW1lb3V0SUQgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcGxheWluZ1Byb2dyZXNzKHNvdW5kKTtcblxuICAgICAgICAgICAgICAgIH0sIHRoaXMuX3BsYXlpbmdQcm9ncmVzc0ludGVydmFsVGltZSk7XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9wbGF5aW5nVGltZW91dElEID0gbnVsbDtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0pLmNhdGNoKChlcnJvcikgPT4ge1xuXG4gICAgICAgICAgICAvLyBUT0RPOiBoYW5kbGUgZXJyb3JcblxuICAgICAgICB9KTtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfb25FbmRlZCgpIHtcblxuICAgICAgICAvLyBnZXQgdGhlIGN1cnJlbnQgc291bmQgaWYgYW55XG4gICAgICAgIGxldCBjdXJyZW50U291bmQgPSB0aGlzLl9nZXRTb3VuZEZyb21RdWV1ZSgpO1xuXG4gICAgICAgIC8vIGlmIHRoZXJlIGlzIGEgc291bmQgY3VycmVudGx5IGJlaW5nIHBsYXllZFxuICAgICAgICBpZiAoY3VycmVudFNvdW5kICE9PSBudWxsICYmIGN1cnJlbnRTb3VuZC5pc1BsYXlpbmcpIHtcblxuICAgICAgICAgICAgbGV0IHVwZGF0ZUluZGV4ID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGxldCBuZXh0U291bmQgPSB0aGlzLl9nZXRTb3VuZEZyb21RdWV1ZSgnbmV4dCcsIHVwZGF0ZUluZGV4KTtcblxuICAgICAgICAgICAgaWYgKGN1cnJlbnRTb3VuZC5vbkVuZGVkICE9PSBudWxsKSB7XG5cbiAgICAgICAgICAgICAgICBsZXQgd2lsbFBsYXlOZXh0ID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAvLyBjaGVjayBpZiB0aGVyZSBpcyBhbm90aGVyIHNvdW5kIGluIHRoZSBxdWV1ZSBhbmQgaWYgcGxheWluZ1xuICAgICAgICAgICAgICAgIC8vIHRoZSBuZXh0IG9uZSBvbiBlbmRlZCBpcyBhY3RpdmF0ZWRcbiAgICAgICAgICAgICAgICBpZiAobmV4dFNvdW5kICE9PSBudWxsICYmIHRoaXMuX3BsYXlOZXh0T25FbmRlZCkge1xuICAgICAgICAgICAgICAgICAgICB3aWxsUGxheU5leHQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGN1cnJlbnRTb3VuZC5vbkVuZGVkKHdpbGxQbGF5TmV4dCk7XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gcmVzZXQgdGhlIGlzIGZpcnN0IHRpbWUgc291bmQgaXMgYmVpbmcgcGxheWVkIHRvIHRydWVcbiAgICAgICAgICAgIGN1cnJlbnRTb3VuZC5maXJzdFRpbWVQbGF5ZWQgPSB0cnVlO1xuXG4gICAgICAgICAgICAvLyByZXNldCB0aGUgcGxheVRpbWVPZmZzZXRcbiAgICAgICAgICAgIGN1cnJlbnRTb3VuZC5wbGF5VGltZU9mZnNldCA9IDA7XG5cbiAgICAgICAgICAgIHRoaXMuX3N0b3AoY3VycmVudFNvdW5kKTtcblxuICAgICAgICAgICAgaWYgKG5leHRTb3VuZCAhPT0gbnVsbCkge1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3BsYXlOZXh0T25FbmRlZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsYXkoJ25leHQnKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAvLyB3ZSByZWFjaGVkIHRoZSBlbmQgb2YgdGhlIHF1ZXVlIHNldCB0aGUgY3VycmVudEluZGV4IGJhY2sgdG8gemVyb1xuICAgICAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRJbmRleCA9IDA7XG5cbiAgICAgICAgICAgICAgICAvLyBpZiBxdWV1ZSBsb29wIGlzIGFjdGl2ZSB0aGVuIHBsYXlcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fbG9vcFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGxheSgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHdoaWNoU291bmQgaXMgb3B0aW9uYWwsIGlmIHNldCBpdCBjYW4gYmUgdGhlIHNvdW5kIGlkIG9yIGlmIGl0J3NcbiAgICAgKiBhIHN0cmluZyBpdCBjYW4gYmUgbmV4dCAvIHByZXZpb3VzIC8gZmlyc3QgLyBsYXN0XG4gICAgICovXG4gICAgcHJvdGVjdGVkIF9nZXRTb3VuZEZyb21RdWV1ZSh3aGljaFNvdW5kPzogc3RyaW5nIHwgbnVtYmVyLCB1cGRhdGVJbmRleDogYm9vbGVhbiA9IHRydWUpOiBJU291bmQgfCBudWxsIHtcblxuICAgICAgICBsZXQgc291bmQgPSBudWxsO1xuXG4gICAgICAgIC8vIGNoZWNrIGlmIHRoZSBxdWV1ZSBpcyBlbXB0eVxuICAgICAgICBpZiAodGhpcy5fcXVldWUubGVuZ3RoID09PSAwKSB7XG5cbiAgICAgICAgICAgIHJldHVybiBzb3VuZDtcblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgd2hpY2ggc29uZyB0byBwbGF5IGRpZCBub3QgZ2V0IHNwZWNpZmllZCwgcGxheSBvbmUgYmFzZWQgZnJvbSB0aGUgcXVldWUgYmFzZWQgb24gdGhlIHF1ZXVlIGluZGV4IHBvc2l0aW9uIG1hcmtlclxuICAgICAgICBpZiAod2hpY2hTb3VuZCA9PT0gdW5kZWZpbmVkICYmIHRoaXMuX3F1ZXVlW3RoaXMuX2N1cnJlbnRJbmRleF0gIT09IHVuZGVmaW5lZCkge1xuXG4gICAgICAgICAgICBzb3VuZCA9IHRoaXMuX3F1ZXVlW3RoaXMuX2N1cnJlbnRJbmRleF07XG5cbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygd2hpY2hTb3VuZCA9PT0gJ251bWJlcicpIHtcblxuICAgICAgICAgICAgLy8gaWYgd2hpY2ggc29uZyB0byBwbGF5IGlzIGEgbnVtZXJpYyBJRFxuICAgICAgICAgICAgc291bmQgPSB0aGlzLl9maW5kU291bmRCeUlkKHdoaWNoU291bmQsIHVwZGF0ZUluZGV4KTtcblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICBsZXQgc291bmRJbmRleDogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG5cbiAgICAgICAgICAgIC8vIGlmIHdoaWNoIHNvbmcgdG8gcGxheSBpcyBhIGNvbnN0YW50XG4gICAgICAgICAgICBzd2l0Y2ggKHdoaWNoU291bmQpIHtcbiAgICAgICAgICAgICAgICBjYXNlIHRoaXMuUExBWV9TT1VORF9ORVhUOlxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fcXVldWVbdGhpcy5fY3VycmVudEluZGV4ICsgMV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc291bmRJbmRleCA9IHRoaXMuX2N1cnJlbnRJbmRleCArIDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VuZCA9IHRoaXMuX3F1ZXVlW3NvdW5kSW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgdGhpcy5QTEFZX1NPVU5EX1BSRVZJT1VTOlxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fcXVldWVbdGhpcy5fY3VycmVudEluZGV4IC0gMV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc291bmRJbmRleCA9IHRoaXMuX2N1cnJlbnRJbmRleCAtIDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VuZCA9IHRoaXMuX3F1ZXVlW3NvdW5kSW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgdGhpcy5QTEFZX1NPVU5EX0ZJUlNUOlxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fcXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc291bmRJbmRleCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VuZCA9IHRoaXMuX3F1ZXVlW3NvdW5kSW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgdGhpcy5QTEFZX1NPVU5EX0xBU1Q6XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9xdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VuZEluZGV4ID0gdGhpcy5fcXVldWUubGVuZ3RoIC0gMjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdW5kID0gdGhpcy5fcXVldWVbc291bmRJbmRleF07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgd2hpY2ggc29uZyB0byBwbGF5IGlzIGEgc3RyaW5nIElEXG4gICAgICAgICAgICAgICAgICAgIHNvdW5kID0gdGhpcy5fZmluZFNvdW5kQnlJZCh3aGljaFNvdW5kLCB1cGRhdGVJbmRleCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzb3VuZEluZGV4ICE9PSBudWxsICYmIHVwZGF0ZUluZGV4KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fY3VycmVudEluZGV4ID0gc291bmRJbmRleDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHNvdW5kO1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9maW5kU291bmRCeUlkKHNvdW5kSWQ6IHN0cmluZyB8IG51bWJlciwgdXBkYXRlSW5kZXg6IGJvb2xlYW4pOiBJU291bmQgfCBudWxsIHtcblxuICAgICAgICBsZXQgc291bmQgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuX3F1ZXVlLnNvbWUoKHNvdW5kRnJvbVF1ZXVlOiBJU291bmQsIHF1ZXVlSW5kZXg6IG51bWJlcikgPT4ge1xuXG4gICAgICAgICAgICBpZiAoc291bmRGcm9tUXVldWUuaWQgPT09IHNvdW5kSWQpIHtcblxuICAgICAgICAgICAgICAgIHNvdW5kID0gc291bmRGcm9tUXVldWU7XG5cbiAgICAgICAgICAgICAgICBpZiAodXBkYXRlSW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY3VycmVudEluZGV4ID0gcXVldWVJbmRleDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBzb3VuZDtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfc291cmNlVG9WYXJpYWJsZXMoc291cmNlczogKElTb3VuZFNvdXJjZSB8IHN0cmluZylbXSk6IHsgdXJsOiBzdHJpbmcgfCBudWxsLCBjb2RlYz86IHN0cmluZyB8IG51bGwgfSB7XG5cbiAgICAgICAgLy8gVE9ETzogc291cmNlIGNhbiBiZSBvbiBvYmplY3Qgd2hlcmUgdGhlIHByb3BlcnR5IG5hbWUgaXMgdGhlIGNvZGVjIGFuZCB0aGUgdmFsdWUgaXMgdGhlIHNvdW5kIHVybFxuICAgICAgICAvLyBpZiBzb3VuZCBpc250IGFuIG9iamVjdCB0cnkgdG8gZGV0ZWN0IHNvdW5kIHNvdXJjZSBleHRlbnNpb24gYnkgZmlsZSBleHRlbnRpb24gb3IgYnkgY2hlY2tpbmcgdGhlIGZpbGUgbWltZSB0eXBlXG5cbiAgICAgICAgLy8gVE9ETzogZ2V0IGEgbGlzdCBvZiBzdXBwb3J0ZWQgY29kZWNzIGJ5IHRoaXMgZGV2aWNlXG5cbiAgICAgICAgbGV0IGZpcnN0TWF0Y2hpbmdTb3VyY2U6IHsgdXJsOiBzdHJpbmcgfCBudWxsLCBjb2RlYz86IHN0cmluZyB8IG51bGwgfSA9IHtcbiAgICAgICAgICAgIHVybDogbnVsbCxcbiAgICAgICAgICAgIGNvZGVjOiBudWxsXG4gICAgICAgIH07XG5cbiAgICAgICAgc291cmNlcy5mb3JFYWNoKChzb3VyY2UpID0+IHtcblxuICAgICAgICAgICAgLy8gVE9ETzogZmluZCBvdXQgd2hhdCB0aGUgc291cmNlIGNvZGVjIGlzXG5cbiAgICAgICAgICAgIC8vIFRPRE86IGNoZWNrIGlmIHRoZSBzb3VyY2UgY29kZWMgaXMgYW1vbmcgdGhlIG9uZXMgdGhhdCBhcmUgc3VwcG9ydGVkIGJ5IHRoaXMgZGV2aWNlXG5cbiAgICAgICAgICAgIGxldCBzb3VuZFVybCA9ICcnO1xuXG4gICAgICAgICAgICAvLyBpZiB0aGUgcGxheWVyIGhhZCBhcyBvcHRpb24gYSBiYXNlVXJsIGZvciBzb3VuZHMgYWRkIGl0IG5vd1xuICAgICAgICAgICAgaWYgKHRoaXMuX3NvdW5kc0Jhc2VVcmwgIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgc291bmRVcmwgPSB0aGlzLl9zb3VuZHNCYXNlVXJsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyB0d28ga2luZCBvZiBzb3VyY2UgYXJlIHBvc3NpYmxlLCBhIHN0cmluZyAodGhlIHVybCkgb3IgYW4gb2JqZWN0IChrZXkgaXMgdGhlIGNvZGVjIGFuZCB2YWx1ZSBpcyB0aGUgdXJsKVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBzb3VyY2UgPT09ICdzdHJpbmcnKSB7XG5cbiAgICAgICAgICAgICAgICBzb3VuZFVybCArPSBzb3VyY2U7XG5cbiAgICAgICAgICAgICAgICBmaXJzdE1hdGNoaW5nU291cmNlID0ge1xuICAgICAgICAgICAgICAgICAgICB1cmw6IHNvdW5kVXJsXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgIHNvdW5kVXJsICs9IHNvdXJjZS51cmw7XG5cbiAgICAgICAgICAgICAgICBmaXJzdE1hdGNoaW5nU291cmNlID0ge1xuICAgICAgICAgICAgICAgICAgICB1cmw6IHNvdW5kVXJsLFxuICAgICAgICAgICAgICAgICAgICBjb2RlYzogc291cmNlLmNvZGVjXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBmaXJzdE1hdGNoaW5nU291cmNlO1xuXG4gICAgfVxuXG4gICAgcHVibGljIHBhdXNlKCkge1xuXG4gICAgICAgIC8vIGdldCB0aGUgY3VycmVudCBzb3VuZFxuICAgICAgICBsZXQgc291bmQ6IElTb3VuZCB8IG51bGwgPSB0aGlzLl9nZXRTb3VuZEZyb21RdWV1ZSgpO1xuXG4gICAgICAgIGlmIChzb3VuZCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHRpbWVBdFBhdXNlID0gc291bmQuc291cmNlTm9kZS5jb250ZXh0LmN1cnJlbnRUaW1lO1xuXG4gICAgICAgIHNvdW5kLnBsYXlUaW1lT2Zmc2V0ICs9IHRpbWVBdFBhdXNlIC0gc291bmQuc3RhcnRUaW1lO1xuXG4gICAgICAgIC8vIHRyaWdnZXIgcGF1c2VkIGV2ZW50XG4gICAgICAgIGlmIChzb3VuZC5vblBhdXNlZCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgc291bmQub25QYXVzZWQoc291bmQucGxheVRpbWVPZmZzZXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fc3RvcChzb3VuZCk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgc3RvcCgpIHtcblxuICAgICAgICAvLyBnZXQgdGhlIGN1cnJlbnQgc291bmRcbiAgICAgICAgbGV0IHNvdW5kOiBJU291bmQgfCBudWxsID0gdGhpcy5fZ2V0U291bmRGcm9tUXVldWUoKTtcblxuICAgICAgICBpZiAoc291bmQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHJlc2V0IHRoZSBpcyBmaXJzdCB0aW1lIHNvdW5kIGlzIGJlaW5nIHBsYXllZCB0byB0cnVlXG4gICAgICAgIHNvdW5kLmZpcnN0VGltZVBsYXllZCA9IHRydWU7XG5cbiAgICAgICAgLy8gdHJpZ2dlciBzdG9wcGVkIGV2ZW50XG4gICAgICAgIGlmIChzb3VuZC5vblN0b3BwZWQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHNvdW5kLm9uU3RvcHBlZChzb3VuZC5wbGF5VGltZU9mZnNldCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyByZXNldCB0aGUgcGxheVRpbWVPZmZzZXRcbiAgICAgICAgc291bmQucGxheVRpbWVPZmZzZXQgPSAwO1xuXG4gICAgICAgIHRoaXMuX3N0b3Aoc291bmQpO1xuXG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9zdG9wKHNvdW5kOiBJU291bmQpIHtcblxuICAgICAgICAvLyB0ZWxsIHRoZSBzb3VyY2VOb2RlIHRvIHN0b3AgcGxheWluZ1xuICAgICAgICBzb3VuZC5zb3VyY2VOb2RlLnN0b3AoMCk7XG5cbiAgICAgICAgLy8gdGVsbCB0aGUgc291bmQgdGhhdCBwbGF5aW5nIGlzIG92ZXJcbiAgICAgICAgc291bmQuaXNQbGF5aW5nID0gZmFsc2U7XG5cbiAgICAgICAgLy8gZGVzdHJveSB0aGUgc291cmNlIG5vZGUgYXMgaXQgY2FuIGFueXdheSBvbmx5IGdldCB1c2VkIG9uY2VcbiAgICAgICAgdGhpcy5fcGxheWVyQXVkaW8uZGVzdHJveVNvdXJjZU5vZGUoc291bmQuc291cmNlTm9kZSk7XG5cbiAgICAgICAgc291bmQuc291cmNlTm9kZSA9IG51bGw7XG5cbiAgICAgICAgaWYgKHRoaXMuX3BsYXlpbmdUaW1lb3V0SUQgIT09IG51bGwpIHtcblxuICAgICAgICAgICAgLy8gY2xlYXIgdGhlIHBsYXlpbmcgcHJvZ3Jlc3Mgc2V0SW50ZXJ2YWxcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5fcGxheWluZ1RpbWVvdXRJRCk7XG5cbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgcHVibGljIG5leHQoKSB7XG5cbiAgICAgICAgLy8gYWxpYXMgZm9yIHBsYXkgbmV4dFxuICAgICAgICB0aGlzLnBsYXkoJ25leHQnKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBwcmV2aW91cygpIHtcblxuICAgICAgICAvLyBhbGlhcyBmb3IgcGxheSBwcmV2aW91c1xuICAgICAgICB0aGlzLnBsYXkoJ3ByZXZpb3VzJyk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgZmlyc3QoKSB7XG5cbiAgICAgICAgLy8gYWxpYXMgZm9yIHBsYXkgZmlyc3RcbiAgICAgICAgdGhpcy5wbGF5KCdmaXJzdCcpO1xuXG4gICAgfVxuXG4gICAgcHVibGljIGxhc3QoKSB7XG5cbiAgICAgICAgLy8gYWxpYXMgZm9yIHBsYXkgbGFzdFxuICAgICAgICB0aGlzLnBsYXkoJ2xhc3QnKTtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfcGxheWluZ1Byb2dyZXNzKHNvdW5kOiBJU291bmQpIHtcblxuICAgICAgICBsZXQgdGltZU5vdyA9IHNvdW5kLnNvdXJjZU5vZGUuY29udGV4dC5jdXJyZW50VGltZTtcblxuICAgICAgICBzb3VuZC5wbGF5VGltZSA9ICh0aW1lTm93IC0gc291bmQuc3RhcnRUaW1lKSArIHNvdW5kLnBsYXlUaW1lT2Zmc2V0O1xuXG4gICAgICAgIGxldCBwbGF5aW5nUGVyY2VudGFnZSA9IChzb3VuZC5wbGF5VGltZSAvIHNvdW5kLmF1ZGlvQnVmZmVyLmR1cmF0aW9uKSAqIDEwMDtcblxuICAgICAgICBzb3VuZC5wbGF5ZWRUaW1lUGVyY2VudGFnZSA9IHBsYXlpbmdQZXJjZW50YWdlO1xuXG4gICAgICAgIHNvdW5kLm9uUGxheWluZyhwbGF5aW5nUGVyY2VudGFnZSwgc291bmQuYXVkaW9CdWZmZXIuZHVyYXRpb24sIHNvdW5kLnBsYXlUaW1lKTtcblxuICAgIH07XG5cbiAgICBwdWJsaWMgc2V0QXVkaW9HcmFwaChjdXN0b21BdWRpb0dyYXBoOiBJQXVkaW9HcmFwaCkge1xuXG4gICAgICAgIHRoaXMuX3BsYXllckF1ZGlvLnNldEF1ZGlvR3JhcGgoY3VzdG9tQXVkaW9HcmFwaCk7XG5cbiAgICAgICAgdGhpcy5fY3VzdG9tQXVkaW9HcmFwaCA9IGN1c3RvbUF1ZGlvR3JhcGg7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0QXVkaW9HcmFwaCgpOiBQcm9taXNlPElBdWRpb0dyYXBoPiB7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICAgICAgdGhpcy5fcGxheWVyQXVkaW8uZ2V0QXVkaW9HcmFwaCgpLnRoZW4oKGF1ZGlvR3JhcGg6IElBdWRpb0dyYXBoKSA9PiB7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9jdXN0b21BdWRpb0dyYXBoID0gYXVkaW9HcmFwaDtcblxuICAgICAgICAgICAgICAgIHJlc29sdmUoYXVkaW9HcmFwaCk7XG5cbiAgICAgICAgICAgIH0pLmNhdGNoKHJlamVjdCk7XG5cbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgIH1cblxuICAgIHB1YmxpYyBzZXRBdWRpb0NvbnRleHQoY3VzdG9tQXVkaW9Db250ZXh0OiBJQXVkaW9Db250ZXh0KSB7XG5cbiAgICAgICAgdGhpcy5fcGxheWVyQXVkaW8uc2V0QXVkaW9Db250ZXh0KGN1c3RvbUF1ZGlvQ29udGV4dCk7XG5cbiAgICAgICAgdGhpcy5fY3VzdG9tQXVkaW9Db250ZXh0ID0gY3VzdG9tQXVkaW9Db250ZXh0O1xuXG4gICAgfVxuXG4gICAgcHVibGljIGdldEF1ZGlvQ29udGV4dCgpOiBQcm9taXNlPElBdWRpb0NvbnRleHQ+IHtcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgICAgICB0aGlzLl9wbGF5ZXJBdWRpby5nZXRBdWRpb0NvbnRleHQoKS50aGVuKChhdWRpb0NvbnRleHQ6IElBdWRpb0NvbnRleHQpID0+IHtcblxuICAgICAgICAgICAgICAgIHRoaXMuX2N1c3RvbUF1ZGlvQ29udGV4dCA9IGF1ZGlvQ29udGV4dDtcblxuICAgICAgICAgICAgICAgIHJlc29sdmUoYXVkaW9Db250ZXh0KTtcblxuICAgICAgICAgICAgfSkuY2F0Y2gocmVqZWN0KTtcblxuICAgICAgICB9KTtcblxuICAgIH1cblxufVxuIl19

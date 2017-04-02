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
            // player audio library instance
            this._playerAudio = new audio_1.PlayerAudio(this._customAudioContext, this._customAudioGraph);
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
            this._customAudioGraph = this._playerAudio.getAudioGraph();
            return this._customAudioGraph;
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
                });
            });
        };
        return PlayerCore;
    }());
    exports.PlayerCore = PlayerCore;
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9saWJyYXJ5L2NvcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0lBQ0EsWUFBWSxDQUFDOztJQUViLGlDQUE4RTtJQUM5RSxpQ0FBa0U7SUFDbEUscUNBQTBDO0lBQzFDLGlDQUFvRDtJQVlwRDtRQXFDSSxvQkFBWSxhQUFnQztZQUFoQyw4QkFBQSxFQUFBLGtCQUFnQztZQXJCNUMsNkJBQTZCO1lBQ25CLHNCQUFpQixHQUFrQixJQUFJLENBQUM7WUFLbEQsMENBQTBDO1lBQ2hDLHNCQUFpQixHQUF1QixJQUFJLENBQUM7WUFDdkQsNkNBQTZDO1lBQ25DLHdCQUFtQixHQUF5QixJQUFJLENBQUM7WUFFM0QsWUFBWTtZQUNILDBCQUFxQixHQUFXLFFBQVEsQ0FBQztZQUN6Qyw0QkFBdUIsR0FBVyxTQUFTLENBQUM7WUFDNUMsaUNBQTRCLEdBQVcsY0FBYyxDQUFDO1lBRXRELG9CQUFlLEdBQUcsTUFBTSxDQUFDO1lBQ3pCLHdCQUFtQixHQUFHLFVBQVUsQ0FBQztZQUNqQyxxQkFBZ0IsR0FBRyxPQUFPLENBQUM7WUFDM0Isb0JBQWUsR0FBRyxNQUFNLENBQUM7WUFJOUIsSUFBSSxjQUFjLEdBQUc7Z0JBQ2pCLE1BQU0sRUFBRSxFQUFFO2dCQUNWLFNBQVMsRUFBRSxLQUFLO2dCQUNoQixhQUFhLEVBQUUsRUFBRTtnQkFDakIsMkJBQTJCLEVBQUUsSUFBSTtnQkFDakMsZUFBZSxFQUFFLElBQUk7YUFDeEIsQ0FBQztZQUVGLElBQUksT0FBTyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLGNBQWMsRUFBRSxhQUFhLENBQUMsQ0FBQztZQUUvRCxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFDOUIsSUFBSSxDQUFDLGNBQWMsR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDO1lBQzVDLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO1lBQ2pCLElBQUksQ0FBQyxhQUFhLEdB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QUMsWUFBWSxDQUFDLENBQUM7Z0JBRTFCLENBQUMsQ0FBQyxDQUFDO1lBRVAsQ0FBQyxDQUFDLENBQUM7UUFFUCxDQUFDO1FBRUwsaUJBQUM7SUFBRCxDQTV5QkEsQUE0eUJDLElBQUE7SUE1eUJZLGdDQUFVIiwiZmlsZSI6ImxpYnJhcnkvY29yZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBQbGF5ZXJTb3VuZCwgSVNvdW5kLCBJU291bmRBdHRyaWJ1dGVzLCBJU291bmRTb3VyY2UgfSBmcm9tICcuL3NvdW5kJztcbmltcG9ydCB7IFBsYXllckF1ZGlvLCBJQXVkaW9HcmFwaCwgSUF1ZGlvQ29udGV4dCB9IGZyb20gJy4vYXVkaW8nO1xuaW1wb3J0IHsgUGxheWVyUmVxdWVzdCB9IGZyb20gJy4vcmVxdWVzdCc7XG5pbXBvcnQgeyBQbGF5ZXJFcnJvciwgSVBsYXllckVycm9yIH0gZnJvbSAnLi9lcnJvcic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUNvcmVPcHRpb25zIHtcbiAgICB2b2x1bWU/OiBudW1iZXI7XG4gICAgbG9vcFF1ZXVlPzogYm9vbGVhbjtcbiAgICBzb3VuZHNCYXNlVXJsPzogc3RyaW5nO1xuICAgIHBsYXlpbmdQcm9ncmVzc0ludGVydmFsVGltZT86IG51bWJlcjtcbiAgICBwbGF5TmV4dE9uRW5kZWQ/OiBib29sZWFuO1xuICAgIGF1ZGlvR3JhcGg/OiBJQXVkaW9HcmFwaDtcbiAgICBhdWRpb0NvbnRleHQ/OiBJQXVkaW9Db250ZXh0O1xufVxuXG5leHBvcnQgY2xhc3MgUGxheWVyQ29yZSB7XG5cbiAgICAvLyBpcyB0aGUgd2ViIGF1ZGlvIEFQSSBzdXBwb3J0ZWRcbiAgICBwcm90ZWN0ZWQgX2lzV2ViQXVkaW9BcGlTdXBwb3J0ZWQ6IGJvb2xlYW47XG4gICAgLy8gdGhlIHNvdW5kcyBxdWV1ZVxuICAgIHByb3RlY3RlZCBfcXVldWU6IElTb3VuZFtdO1xuICAgIC8vIHRoZSB2b2x1bWUgKDAgdG8gMTAwKVxuICAgIHByb3RlY3RlZCBfdm9sdW1lOiBudW1iZXI7XG4gICAgLy8gdGhlIGJhc2UgdXJsIHRoYXQgYWxsIHNvdW5kcyB3aWxsIGhhdmUgaW4gY29tbW9uXG4gICAgcHJvdGVjdGVkIF9zb3VuZHNCYXNlVXJsOiBzdHJpbmc7XG4gICAgLy8gdGhlIGN1cnJlbnQgc291bmQgaW4gcXVldWUgaW5kZXhcbiAgICBwcm90ZWN0ZWQgX2N1cnJlbnRJbmRleDogbnVtYmVyO1xuICAgIC8vIGluc3RhbmNlIG9mIHRoZSBhdWRpbyBsaWJyYXJ5IGNsYXNzXG4gICAgcHJvdGVjdGVkIF9wbGF5ZXJBdWRpbzogUGxheWVyQXVkaW87XG4gICAgLy8gcGxheWluZyBwcm9ncmVzcyB0aW1lIGludGVydmFsXG4gICAgcHJvdGVjdGVkIF9wbGF5aW5nUHJvZ3Jlc3NJbnRlcnZhbFRpbWU6IG51bWJlcjtcbiAgICAvLyBwbGF5aW5nIHByb2dyZXNzIHRpbWVvdXRJRFxuICAgIHByb3RlY3RlZCBfcGxheWluZ1RpbWVvdXRJRDogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG4gICAgLy8gd2hlbiBhIHNvbmcgZmluaXNoZXMsIGF1dG9tYXRpY2FsbHkgcGxheSB0aGUgbmV4dCBvbmVcbiAgICBwcm90ZWN0ZWQgX3BsYXlOZXh0T25FbmRlZDogYm9vbGVhbjtcbiAgICAvLyBkbyB3ZSBzdGFydCBvdmVyIGdhaW4gYXQgdGhlIGVuZCBvZiB0aGUgcXVldWVcbiAgICBwcm90ZWN0ZWQgX2xvb3BRdWV1ZTogYm9vbGVhbjtcbiAgICAvLyBhIGN1c3RvbiBhdWRpb0dyYXBoIGNyZWF0ZWQgYnkgdGhlIHVzZXJcbiAgICBwcm90ZWN0ZWQgX2N1c3RvbUF1ZGlvR3JhcGg6IElBdWRpb0dyYXBoIHwgbnVsbCA9IG51bGw7XG4gICAgLy8gYSBjdXN0b20gYXVkaW8gY29udGV4dCBjcmVhdGVkIGJ5IHRoZSB1c2VyXG4gICAgcHJvdGVjdGVkIF9jdXN0b21BdWRpb0NvbnRleHQ6IElBdWRpb0NvbnRleHQgfCBudWxsID0gbnVsbDtcblxuICAgIC8vIGNvbnN0YW50c1xuICAgIHJlYWRvbmx5IFdIRVJFX0lOX1FVRVVFX0FUX0VORDogc3RyaW5nID0gJ2FwcGVuZCc7XG4gICAgcmVhZG9ubHkgV0hFUkVfSU5fUVVFVUVfQVRfU1RBUlQ6IHN0cmluZyA9ICdwcmVwZW5kJztcbiAgICByZWFkb25seSBXSEVSRV9JTl9RVUVVRV9BRlRFUl9DVVJSRU5UOiBzdHJpbmcgPSAnYWZ0ZXJDdXJyZW50JztcblxuICAgIHJlYWRvbmx5IFBMQVlfU09VTkRfTkVYVCA9ICduZXh0JztcbiAgICByZWFkb25seSBQTEFZX1NPVU5EX1BSRVZJT1VTID0gJ3ByZXZpb3VzJztcbiAgICByZWFkb25seSBQTEFZX1NPVU5EX0ZJUlNUID0gJ2ZpcnN0JztcbiAgICByZWFkb25seSBQTEFZX1NPVU5EX0xBU1QgPSAnbGFzdCc7XG5cbiAgICBjb25zdHJ1Y3RvcihwbGF5ZXJPcHRpb25zOiBJQ29yZU9wdGlvbnMgPSB7fSkge1xuXG4gICAgICAgIGxldCBkZWZhdWx0T3B0aW9ucyA9IHtcbiAgICAgICAgICAgIHZvbHVtZTogODAsXG4gICAgICAgICAgICBsb29wUXVldWU6IGZhbHNlLFxuICAgICAgICAgICAgc291bmRzQmFzZVVybDogJycsXG4gICAgICAgICAgICBwbGF5aW5nUHJvZ3Jlc3NJbnRlcnZhbFRpbWU6IDEwMDAsXG4gICAgICAgICAgICBwbGF5TmV4dE9uRW5kZWQ6IHRydWVcbiAgICAgICAgfTtcblxuICAgICAgICBsZXQgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRPcHRpb25zLCBwbGF5ZXJPcHRpb25zKTtcblxuICAgICAgICB0aGlzLl92b2x1bWUgPSBvcHRpb25zLnZvbHVtZTtcbiAgICAgICAgdGhpcy5fc291bmRzQmFzZVVybCA9IG9wdGlvbnMuc291bmRzQmFzZVVybDtcbiAgICAgICAgdGhpcy5fcXVldWUgPSBbXTtcbiAgICAgICAgdGhpcy5fY3VycmVudEluZGV4ID0gMDtcbiAgICAgICAgdGhpcy5fcGxheWluZ1Byb2dyZXNzSW50ZXJ2YWxUaW1lID0gb3B0aW9ucy5wbGF5aW5nUHJvZ3Jlc3NJbnRlcnZhbFRpbWU7XG4gICAgICAgIHRoaXMuX3BsYXlOZXh0T25FbmRlZCA9IG9wdGlvbnMucGxheU5leHRPbkVuZGVkO1xuICAgICAgICB0aGlzLl9sb29wUXVldWUgPSBvcHRpb25zLmxvb3BRdWV1ZTtcblxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMuYXVkaW9Db250ZXh0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhpcy5fY3VzdG9tQXVkaW9Db250ZXh0ID0gb3B0aW9ucy5hdWRpb0NvbnRleHQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMuYXVkaW9HcmFwaCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRoaXMuX2N1c3RvbUF1ZGlvR3JhcGggPSBvcHRpb25zLmF1ZGlvR3JhcGg7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9pbml0aWFsaXplKCk7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX2luaXRpYWxpemUoKSB7XG5cbiAgICAgICAgLy8gVE9ETzogY2hlY2sgaWYgd2ViIGF1ZGlvIGFwaSBpcyBhdmFpbGFibGVcbiAgICAgICAgbGV0IHdlYkF1ZGlvQXBpID0gdHJ1ZTtcblxuICAgICAgICAvLyBpcyB0aGUgd2ViIGF1ZGlvIGFwaSBzdXBwb3J0ZWRcbiAgICAgICAgLy8gaWYgbm90IHdlIHdpbGwgdXNlIHRoZSBhdWRpbyBlbGVtZW50IGFzIGZhbGxiYWNrXG4gICAgICAgIGlmICh3ZWJBdWRpb0FwaSkge1xuICAgICAgICAgICAgdGhpcy5faXNXZWJBdWRpb0FwaVN1cHBvcnRlZCA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyB1c2UgdGhlIGh0bWw1IGF1ZGlvIGVsZW1lbnRcbiAgICAgICAgICAgIHRoaXMuX2lzV2ViQXVkaW9BcGlTdXBwb3J0ZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHBsYXllciBhdWRpbyBsaWJyYXJ5IGluc3RhbmNlXG4gICAgICAgIHRoaXMuX3BsYXllckF1ZGlvID0gbmV3IFBsYXllckF1ZGlvKHRoaXMuX2N1c3RvbUF1ZGlvQ29udGV4dCwgdGhpcy5fY3VzdG9tQXVkaW9HcmFwaCk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgYWRkU291bmRUb1F1ZXVlKHNvdW5kQXR0cmlidXRlczogSVNvdW5kQXR0cmlidXRlcywgd2hlcmVJblF1ZXVlOiBzdHJpbmcgPSB0aGlzLldIRVJFX0lOX1FVRVVFX0FUX0VORCk6IElTb3VuZCB7XG5cbiAgICAgICAgbGV0IHNvdW5kOiBJU291bmQgPSBuZXcgUGxheWVyU291bmQoc291bmRBdHRyaWJ1dGVzKTtcblxuICAgICAgICAvLyBUT0RPOiBpcyBxdWV1ZSBqdXN0IGFuIGFycmF5IG9mIHNvdW5kcywgb3IgZG8gd2UgbmVlZCBzb21ldGhpbmcgbW9yZSBjb21wbGV4IHdpdGggYSBwb3NpdGlvbiB0cmFja2VyP1xuXG4gICAgICAgIC8vIFRPRE86IGFsbG93IGFycmF5IG9mIHNvdW5kQXR0cmlidXRlcyB0byBiZSBpbmplY3RlZCwgdG8gY3JlYXRlIHNldmVyYWwgYXQgb25jZSwgaWYgaW5wdXQgaXMgYW4gYXJyYXkgb3V0cHV0IHNob3VsZCBiZSB0b29cblxuICAgICAgICBzd2l0Y2ggKHdoZXJlSW5RdWV1ZSkge1xuICAgICAgICAgICAgY2FzZSB0aGlzLldIRVJFX0lOX1FVRVVFX0FUX0VORDpcbiAgICAgICAgICAgICAgICB0aGlzLl9hcHBlbmRTb3VuZFRvUXVldWUoc291bmQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSB0aGlzLldIRVJFX0lOX1FVRVVFX0FUX1NUQVJUOlxuICAgICAgICAgICAgICAgIHRoaXMuX3ByZXBlbmRTb3VuZFRvUXVldWUoc291bmQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSB0aGlzLldIRVJFX0lOX1FVRVVFX0FGVEVSX0NVUlJFTlQ6XG4gICAgICAgICAgICAgICAgdGhpcy5fcHJlcGVuZFNvdW5kVG9RdWV1ZShzb3VuZCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc291bmQ7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgX2FwcGVuZFNvdW5kVG9RdWV1ZShzb3VuZDogSVNvdW5kKTogdm9pZCB7XG5cbiAgICAgICAgdGhpcy5fcXVldWUucHVzaChzb3VuZCk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgX3ByZXBlbmRTb3VuZFRvUXVldWUoc291bmQ6IElTb3VuZCk6IHZvaWQge1xuXG4gICAgICAgIHRoaXMuX3F1ZXVlLnVuc2hpZnQoc291bmQpO1xuXG4gICAgfVxuXG4gICAgcHVibGljIF9hZGRTb3VuZFRvUXVldWVBZnRlckN1cnJlbnQoc291bmQ6IElTb3VuZCk6IHZvaWQge1xuXG4gICAgICAgIC8vIFRPRE86IGFkZCBvcHRpb24gdG8gcGxheSBhZnRlciBiZWluZyBhZGRlZCBvciB1c2VyIHVzZXMgcGxheSBtZXRob2Q/XG5cbiAgICAgICAgLy8gaWYgdGhlcmUgaXMgbm8gY3VycmVudCBzb25nIHlldCwgYXBwZW5kIHRoZSBzb25nIHRvIHRoZSBxdWV1ZVxuICAgICAgICBpZiAodGhpcy5fY3VycmVudEluZGV4ID09PSBudWxsKSB7XG5cbiAgICAgICAgICAgIHRoaXMuX2FwcGVuZFNvdW5kVG9RdWV1ZShzb3VuZCk7XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgbGV0IGFmdGVyQ3VycmVudEluZGV4ID0gdGhpcy5fY3VycmVudEluZGV4ICsgMTtcblxuICAgICAgICAgICAgdGhpcy5fcXVldWUuc3BsaWNlKGFmdGVyQ3VycmVudEluZGV4LCAwLCBzb3VuZCk7XG5cbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgcHVibGljIHJlc2V0UXVldWUoKSB7XG5cbiAgICAgICAgdGhpcy5fcXVldWUgPSBbXTtcblxuICAgICAgICAvLyBUT0RPOiBjaGVjayBpZiBhIHNvbmcgaXMgZ2V0dGluZyBwbGF5ZWQgYW5kIHN0b3AgaXQ/XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0UXVldWUoKSB7XG5cbiAgICAgICAgLy8gVE9ETzogaXMgdGhlIG5lZWRlZD9cblxuICAgICAgICByZXR1cm4gdGhpcy5fcXVldWU7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0Vm9sdW1lKHZvbHVtZTogbnVtYmVyKTogdm9pZCB7XG5cbiAgICAgICAgdGhpcy5fdm9sdW1lID0gdm9sdW1lO1xuXG4gICAgICAgIHRoaXMuX3BsYXllckF1ZGlvLmNoYW5nZUdhaW5WYWx1ZSh2b2x1bWUpO1xuXG4gICAgfVxuXG4gICAgcHVibGljIGdldFZvbHVtZSgpOiBudW1iZXIge1xuXG4gICAgICAgIHJldHVybiB0aGlzLl92b2x1bWU7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgbXV0ZSgpIHtcblxuICAgICAgICB0aGlzLnNldFZvbHVtZSgwKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBzZXRQb3NpdGlvbihzb3VuZFBvc2l0aW9uSW5QZXJjZW50OiBudW1iZXIpOiB2b2lkIHtcblxuICAgICAgICAvLyBnZXQgdGhlIGN1cnJlbnQgc291bmQgaWYgYW55XG4gICAgICAgIGxldCBjdXJyZW50U291bmQgPSB0aGlzLl9nZXRTb3VuZEZyb21RdWV1ZSgpO1xuXG4gICAgICAgIC8vIGlmIHRoZXJlIGlzIGEgc291bmQgY3VycmVudGx5IGJlaW5nIHBsYXllZFxuICAgICAgICBpZiAoY3VycmVudFNvdW5kICE9PSBudWxsKSB7XG5cbiAgICAgICAgICAgIC8vIGNoZWNrIGlmIHRoZSBkdXJhdGlvbiBnb3Qgc2V0IG1hbnVhbGx5XG4gICAgICAgICAgICBpZiAoY3VycmVudFNvdW5kLmR1cmF0aW9uID09PSBudWxsKSB7XG5cbiAgICAgICAgICAgICAgICAvLyB0aGUgdXNlciBjYW4gc2V0IHRoZSBzb3VuZCBkdXJhdGlvbiBtYW51YWxseSBidXQgaWYgaGUgZGlkbid0IHRoZSBzb25nIGhhcyB0b1xuICAgICAgICAgICAgICAgIC8vIGdldCBwcmVsb2FkZWQgYXMgdGhlIGR1cmF0aW9uIGlzIGEgcHJvcGVydHkgb2YgdGhlIGF1ZGlvQnVmZmVyXG4gICAgICAgICAgICAgICAgdGhpcy5fbG9hZFNvdW5kKGN1cnJlbnRTb3VuZClcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oKHNvdW5kOiBJU291bmQpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2FsY3VsYXRlIHRoZSBwb3NpdGlvbiBpbiBzZWNvbmRzXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgc291bmRQb3NpdGlvbkluU2Vjb25kcyA9IChzb3VuZC5kdXJhdGlvbiAvIDEwMCkgKiBzb3VuZFBvc2l0aW9uSW5QZXJjZW50O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFBvc2l0aW9uSW5TZWNvbmRzKHNvdW5kUG9zaXRpb25JblNlY29uZHMpO1xuXG4gICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnJvcjogUGxheWVyRXJyb3IpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogdGhyb3cgZXJyb3I/Pz9cblxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgIC8vIGNhbGN1bGF0ZSB0aGUgcG9zaXRpb24gaW4gc2Vjb25kc1xuICAgICAgICAgICAgICAgIGxldCBzb3VuZFBvc2l0aW9uSW5TZWNvbmRzID0gKGN1cnJlbnRTb3VuZC5kdXJhdGlvbiAvIDEwMCkgKiBzb3VuZFBvc2l0aW9uSW5QZXJjZW50O1xuXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRQb3NpdGlvbkluU2Vjb25kcyhzb3VuZFBvc2l0aW9uSW5TZWNvbmRzKTtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgIC8vIFRPRE86IHRocm93IGVycm9yPz8/XG5cbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgcHVibGljIHNldFBvc2l0aW9uSW5TZWNvbmRzKHNvdW5kUG9zaXRpb25JblNlY29uZHM6IG51bWJlcikge1xuXG4gICAgICAgIC8vIGdldCB0aGUgY3VycmVudCBzb3VuZCBpZiBhbnlcbiAgICAgICAgbGV0IGN1cnJlbnRTb3VuZCA9IHRoaXMuX2dldFNvdW5kRnJvbVF1ZXVlKCk7XG5cbiAgICAgICAgLy8gaWYgdGhlcmUgaXMgYSBzb3VuZCBjdXJyZW50bHkgYmVpbmcgcGxheWVkXG4gICAgICAgIGlmIChjdXJyZW50U291bmQgIT09IG51bGwpIHtcblxuICAgICAgICAgICAgLy8gaXMgdGhlIHNvbmcgaXMgYmVpbmcgcGxheWVkXG4gICAgICAgICAgICBpZiAoY3VycmVudFNvdW5kLmlzUGxheWluZykge1xuXG4gICAgICAgICAgICAgICAgLy8gc3RvcCB0aGUgdHJhY2sgcGxheWJhY2tcbiAgICAgICAgICAgICAgICB0aGlzLnBhdXNlKCk7XG5cbiAgICAgICAgICAgICAgICAvLyBzdGFydCB0aGUgcGxheWJhY2sgYXQgdGhlIGdpdmVuIHBvc2l0aW9uXG4gICAgICAgICAgICAgICAgdGhpcy5wbGF5KGN1cnJlbnRTb3VuZC5pZCwgc291bmRQb3NpdGlvbkluU2Vjb25kcyk7XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAvLyBvbmx5IHNldCB0aGUgc291bmQgcG9zaXRpb24gYnV0IGRvbid0IHBsYXlcbiAgICAgICAgICAgICAgICBjdXJyZW50U291bmQucGxheVRpbWVPZmZzZXQgPSBzb3VuZFBvc2l0aW9uSW5TZWNvbmRzO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgLy8gVE9ETzogdGhyb3cgZXJyb3I/Pz9cblxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX2xvYWRTb3VuZChzb3VuZDogSVNvdW5kKTogUHJvbWlzZTxJU291bmQgfCBQbGF5ZXJFcnJvcj4ge1xuXG4gICAgICAgIC8vIFRPRE86IHdvdWxkIGJlIGdvb2QgdG8gY2FjaGUgYnVmZmVycywgc28gbmVlZCB0byBjaGVjayBpZiBpcyBpbiBjYWNoZVxuICAgICAgICAvLyBsZXQgdGhlIHVzZXIgY2hvb3NlIChieSBzZXR0aW5nIGFuIG9wdGlvbikgd2hhdCBhbW91bnQgb2Ygc291bmRzIHdpbGwgYmUgY2FjaGVkXG4gICAgICAgIC8vIGFkZCBhIGNhY2hlZCBkYXRlIC8gdGltZXN0YW1wIHRvIGJlIGFibGUgdG8gY2xlYXIgY2FjaGUgYnkgb2xkZXN0IGZpcnN0XG4gICAgICAgIC8vIG9yIGV2ZW4gYmV0dGVyIGFkZCBhIHBsYXllZCBjb3VudGVyIHRvIGNhY2hlIGJ5IGxlYXN0IHBsYXllZCBhbmQgZGF0ZVxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgICAgIC8vIGlmIHRoZSBzb3VuZCBhbHJlYWR5IGhhcyBhbiBBdWRpb0J1ZmZlclxuICAgICAgICAgICAgaWYgKHNvdW5kLmF1ZGlvQnVmZmVyICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShzb3VuZCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGlmIHRoZSBzb3VuZCBoYXMgYWxyZWFkeSBhbiBBcnJheUJ1ZmZlciBidXQgbm8gQXVkaW9CdWZmZXJcbiAgICAgICAgICAgIGlmIChzb3VuZC5hcnJheUJ1ZmZlciAhPT0gbnVsbCAmJiBzb3VuZC5hdWRpb0J1ZmZlciA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9kZWNvZGVTb3VuZChzb3VuZCwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gaWYgdGhlIHNvdW5kIGhhcyBubyBBcnJheUJ1ZmZlciBhbmQgYWxzbyBubyBBdWRpb0J1ZmZlciB5ZXRcbiAgICAgICAgICAgIGlmIChzb3VuZC5hcnJheUJ1ZmZlciA9PT0gbnVsbCAmJiBzb3VuZC5hdWRpb0J1ZmZlciA9PT0gbnVsbCkge1xuXG4gICAgICAgICAgICAgICAgLy8gZXh0cmFjdCB0aGUgdXJsIGFuZCBjb2RlYyBmcm9tIHNvdXJjZXNcbiAgICAgICAgICAgICAgICBsZXQgeyB1cmwsIGNvZGVjID0gbnVsbCB9ID0gdGhpcy5fc291cmNlVG9WYXJpYWJsZXMoc291bmQuc291cmNlcyk7XG5cbiAgICAgICAgICAgICAgICBzb3VuZC51cmwgPSB1cmw7XG4gICAgICAgICAgICAgICAgc291bmQuY29kZWMgPSBjb2RlYztcblxuICAgICAgICAgICAgICAgIGlmIChzb3VuZC51cmwgIT09IG51bGwpIHtcblxuICAgICAgICAgICAgICAgICAgICBsZXQgcmVxdWVzdCA9IG5ldyBQbGF5ZXJSZXF1ZXN0KCk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gY2hhbmdlIGJ1ZmZlcmluZyBzdGF0ZVxuICAgICAgICAgICAgICAgICAgICBzb3VuZC5pc0J1ZmZlcmluZyA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdC5nZXRBcnJheUJ1ZmZlcihzb3VuZCkudGhlbigoYXJyYXlCdWZmZXI6IEFycmF5QnVmZmVyKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdW5kLmFycmF5QnVmZmVyID0gYXJyYXlCdWZmZXI7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9kZWNvZGVTb3VuZChzb3VuZCwgcmVzb2x2ZSwgcmVqZWN0KTtcblxuICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaCgocmVxdWVzdEVycm9yOiBJUGxheWVyRXJyb3IpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHJlcXVlc3RFcnJvcik7XG5cbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgICAgIGxldCBub1VybEVycm9yID0gbmV3IFBsYXllckVycm9yKCdzb3VuZCBoYXMgbm8gdXJsJywgMSk7XG5cbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KG5vVXJsRXJyb3IpO1xuXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX2RlY29kZVNvdW5kKHNvdW5kOiBJU291bmQsIHJlc29sdmU6IEZ1bmN0aW9uLCByZWplY3Q6IEZ1bmN0aW9uKSB7XG5cbiAgICAgICAgbGV0IGFycmF5QnVmZmVyID0gc291bmQuYXJyYXlCdWZmZXI7XG5cbiAgICAgICAgdGhpcy5fcGxheWVyQXVkaW8uZGVjb2RlQXVkaW8oYXJyYXlCdWZmZXIpLnRoZW4oKGF1ZGlvQnVmZmVyOiBBdWRpb0J1ZmZlcikgPT4ge1xuXG4gICAgICAgICAgICBzb3VuZC5hdWRpb0J1ZmZlciA9IGF1ZGlvQnVmZmVyO1xuICAgICAgICAgICAgc291bmQuaXNCdWZmZXJpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIHNvdW5kLmlzQnVmZmVyZWQgPSB0cnVlO1xuICAgICAgICAgICAgc291bmQuYXVkaW9CdWZmZXJEYXRlID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgIHNvdW5kLmR1cmF0aW9uID0gc291bmQuYXVkaW9CdWZmZXIuZHVyYXRpb247XG5cbiAgICAgICAgICAgIHJlc29sdmUoc291bmQpO1xuXG4gICAgICAgIH0pLmNhdGNoKChkZWNvZGVBdWRpb0Vycm9yOiBJUGxheWVyRXJyb3IpID0+IHtcblxuICAgICAgICAgICAgcmVqZWN0KGRlY29kZUF1ZGlvRXJyb3IpO1xuXG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG4gICAgcHVibGljIHBsYXkod2hpY2hTb3VuZD86IG51bWJlciB8IHN0cmluZyB8IHVuZGVmaW5lZCwgcGxheVRpbWVPZmZzZXQ/OiBudW1iZXIpOiB2b2lkIHtcblxuICAgICAgICAvLyBUT0RPOiBjaGVjayB0aGUgYXZhaWxhYmxlIGNvZGVjcyBhbmQgZGVmaW5lZCBzb3VyY2VzLCBwbGF5IHRoZSBmaXJzdCBvbmUgdGhhdCBoYXMgbWF0Y2hlcyBhbmQgYXZhaWxhYmxlIGNvZGVjXG4gICAgICAgIC8vIFRPRE86IGxldCB1c2VyIGRlZmluZSBvcmRlciBvZiBwcmVmZXJyZWQgY29kZWNzIGZvciBwbGF5ZXJiYWNrXG5cbiAgICAgICAgLy8gZ2V0IHRoZSBjdXJyZW50IHNvdW5kIGlmIGFueVxuICAgICAgICBsZXQgY3VycmVudFNvdW5kID0gdGhpcy5fZ2V0U291bmRGcm9tUXVldWUoKTtcblxuICAgICAgICAvLyBpZiB0aGVyZSBpcyBhIHNvdW5kIGN1cnJlbnRseSBiZWluZyBwbGF5ZWRcbiAgICAgICAgaWYgKGN1cnJlbnRTb3VuZCAhPT0gbnVsbCAmJiBjdXJyZW50U291bmQuaXNQbGF5aW5nKSB7XG5cbiAgICAgICAgICAgIC8vIHN0b3AgdGhlIGN1cnJlbnQgc291bmRcbiAgICAgICAgICAgIHRoaXMuc3RvcCgpO1xuXG4gICAgICAgIH1cblxuICAgICAgICAvLyB3aGljaFNvdW5kIGlzIG9wdGlvbmFsLCBpZiBzZXQgaXQgY2FuIGJlIHRoZSBzb3VuZCBpZCBvciBpZiBpdCdzIGEgc3RyaW5nIGl0IGNhbiBiZSBuZXh0IC8gcHJldmlvdXMgLyBmaXJzdCAvIGxhc3RcbiAgICAgICAgbGV0IHNvdW5kID0gdGhpcy5fZ2V0U291bmRGcm9tUXVldWUod2hpY2hTb3VuZCk7XG5cbiAgICAgICAgLy8gaWYgdGhlcmUgaXMgbm8gc291bmQgd2UgY291bGQgcGxheSwgZG8gbm90aGluZ1xuICAgICAgICBpZiAoc291bmQgPT09IG51bGwpIHtcblxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgICAgICAvLyBUT0RPOiB0aHJvdyBhbiBlcnJvcj9cblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgdGhlIHVzZXIgd2FudHMgdG8gcGxheSB0aGUgc291bmQgZnJvbSBhIGNlcnRhaW4gcG9zaXRpb25cbiAgICAgICAgaWYgKHBsYXlUaW1lT2Zmc2V0ICE9PSB1bmRlZmluZWQpIHtcblxuICAgICAgICAgICAgc291bmQucGxheVRpbWVPZmZzZXQgPSBwbGF5VGltZU9mZnNldDtcblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gaGFzIHRoZSBzb3VuZCBhbHJlYWR5IGJlZW4gbG9hZGVkP1xuICAgICAgICBpZiAoIXNvdW5kLmlzQnVmZmVyZWQpIHtcblxuICAgICAgICAgICAgdGhpcy5fbG9hZFNvdW5kKHNvdW5kKS50aGVuKCgpID0+IHtcblxuICAgICAgICAgICAgICAgIHRoaXMuX3BsYXkoc291bmQpO1xuXG4gICAgICAgICAgICB9KS5jYXRjaCgoZXJyb3IpID0+IHtcblxuICAgICAgICAgICAgICAgIC8vIFRPRE86IGhhbmRsZSBlcnJvclxuXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICB0aGlzLl9wbGF5KHNvdW5kKTtcblxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX3BsYXkoc291bmQ6IElTb3VuZCkge1xuXG4gICAgICAgIC8vIHNvdXJjZSBub2RlIG9wdGlvbnNcbiAgICAgICAgbGV0IHNvdXJjZU5vZGVPcHRpb25zID0ge1xuICAgICAgICAgICAgbG9vcDogc291bmQubG9vcCxcbiAgICAgICAgICAgIG9uRW5kZWQ6ICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9vbkVuZGVkKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gY3JlYXRlIGEgbmV3IHNvdXJjZSBub2RlXG4gICAgICAgIHRoaXMuX3BsYXllckF1ZGlvLmNyZWF0ZVNvdXJjZU5vZGUoc291cmNlTm9kZU9wdGlvbnMpLnRoZW4oKHNvdXJjZU5vZGUpID0+IHtcblxuICAgICAgICAgICAgc291bmQuaXNQbGF5aW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIHNvdW5kLnNvdXJjZU5vZGUgPSBzb3VyY2VOb2RlO1xuXG4gICAgICAgICAgICAvLyBhZGQgdGhlIGJ1ZmZlciB0byB0aGUgc291cmNlIG5vZGVcbiAgICAgICAgICAgIHNvdXJjZU5vZGUuYnVmZmVyID0gc291bmQuYXVkaW9CdWZmZXI7XG5cbiAgICAgICAgICAgIC8vIHRoZSBhdWRpb2NvbnRleHQgdGltZSByaWdodCBub3cgKHNpbmNlIHRoZSBhdWRpb2NvbnRleHQgZ290IGNyZWF0ZWQpXG4gICAgICAgICAgICBzb3VuZC5zdGFydFRpbWUgPSBzb3VyY2VOb2RlLmNvbnRleHQuY3VycmVudFRpbWU7XG5cbiAgICAgICAgICAgIC8vIGNvbm5lY3QgdGhlIHNvdXJjZSB0byB0aGUgZ3JhcGggbm9kZShzKVxuICAgICAgICAgICAgdGhpcy5fcGxheWVyQXVkaW8uY29ubmVjdFNvdXJjZU5vZGVUb0dyYXBoTm9kZXMoc291cmNlTm9kZSk7XG5cbiAgICAgICAgICAgIC8vIHN0YXJ0IHBsYXliYWNrXG4gICAgICAgICAgICAvLyBzdGFydCh3aGVuLCBvZmZzZXQsIGR1cmF0aW9uKVxuICAgICAgICAgICAgc291cmNlTm9kZS5zdGFydCgwLCBzb3VuZC5wbGF5VGltZU9mZnNldCk7XG5cbiAgICAgICAgICAgIC8vIHRyaWdnZXIgcmVzdW1lZCBldmVudFxuICAgICAgICAgICAgaWYgKHNvdW5kLm9uUmVzdW1lZCAhPT0gbnVsbCAmJiAhc291bmQuZmlyc3RUaW1lUGxheWVkKSB7XG4gICAgICAgICAgICAgICAgc291bmQub25SZXN1bWVkKHNvdW5kLnBsYXlUaW1lT2Zmc2V0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gdHJpZ2dlciBzdGFydGVkIGV2ZW50XG4gICAgICAgICAgICBpZiAoc291bmQub25TdGFydGVkICE9PSBudWxsICYmIHNvdW5kLmZpcnN0VGltZVBsYXllZCkge1xuXG4gICAgICAgICAgICAgICAgc291bmQub25TdGFydGVkKHNvdW5kLnBsYXlUaW1lT2Zmc2V0KTtcblxuICAgICAgICAgICAgICAgIHNvdW5kLmZpcnN0VGltZVBsYXllZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHRyaWdnZXIgcGxheWluZyBldmVudFxuICAgICAgICAgICAgaWYgKHNvdW5kLm9uUGxheWluZyAhPT0gbnVsbCkge1xuXG4gICAgICAgICAgICAgICAgLy8gYXQgaW50ZXJ2YWwgc2V0IHBsYXlpbmcgcHJvZ3Jlc3NcbiAgICAgICAgICAgICAgICB0aGlzLl9wbGF5aW5nVGltZW91dElEID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3BsYXlpbmdQcm9ncmVzcyhzb3VuZCk7XG5cbiAgICAgICAgICAgICAgICB9LCB0aGlzLl9wbGF5aW5nUHJvZ3Jlc3NJbnRlcnZhbFRpbWUpO1xuXG4gICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fcGxheWluZ1RpbWVvdXRJRCA9IG51bGw7XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KS5jYXRjaCgoZXJyb3IpID0+IHtcblxuICAgICAgICAgICAgLy8gVE9ETzogaGFuZGxlIGVycm9yXG5cbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX29uRW5kZWQoKSB7XG5cbiAgICAgICAgLy8gZ2V0IHRoZSBjdXJyZW50IHNvdW5kIGlmIGFueVxuICAgICAgICBsZXQgY3VycmVudFNvdW5kID0gdGhpcy5fZ2V0U291bmRGcm9tUXVldWUoKTtcblxuICAgICAgICAvLyBpZiB0aGVyZSBpcyBhIHNvdW5kIGN1cnJlbnRseSBiZWluZyBwbGF5ZWRcbiAgICAgICAgaWYgKGN1cnJlbnRTb3VuZCAhPT0gbnVsbCAmJiBjdXJyZW50U291bmQuaXNQbGF5aW5nKSB7XG5cbiAgICAgICAgICAgIGxldCB1cGRhdGVJbmRleCA9IGZhbHNlO1xuXG4gICAgICAgICAgICBsZXQgbmV4dFNvdW5kID0gdGhpcy5fZ2V0U291bmRGcm9tUXVldWUoJ25leHQnLCB1cGRhdGVJbmRleCk7XG5cbiAgICAgICAgICAgIGlmIChjdXJyZW50U291bmQub25FbmRlZCAhPT0gbnVsbCkge1xuXG4gICAgICAgICAgICAgICAgbGV0IHdpbGxQbGF5TmV4dCA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgLy8gY2hlY2sgaWYgdGhlcmUgaXMgYW5vdGhlciBzb3VuZCBpbiB0aGUgcXVldWUgYW5kIGlmIHBsYXlpbmdcbiAgICAgICAgICAgICAgICAvLyB0aGUgbmV4dCBvbmUgb24gZW5kZWQgaXMgYWN0aXZhdGVkXG4gICAgICAgICAgICAgICAgaWYgKG5leHRTb3VuZCAhPT0gbnVsbCAmJiB0aGlzLl9wbGF5TmV4dE9uRW5kZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgd2lsbFBsYXlOZXh0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjdXJyZW50U291bmQub25FbmRlZCh3aWxsUGxheU5leHQpO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHJlc2V0IHRoZSBpcyBmaXJzdCB0aW1lIHNvdW5kIGlzIGJlaW5nIHBsYXllZCB0byB0cnVlXG4gICAgICAgICAgICBjdXJyZW50U291bmQuZmlyc3RUaW1lUGxheWVkID0gdHJ1ZTtcblxuICAgICAgICAgICAgLy8gcmVzZXQgdGhlIHBsYXlUaW1lT2Zmc2V0XG4gICAgICAgICAgICBjdXJyZW50U291bmQucGxheVRpbWVPZmZzZXQgPSAwO1xuXG4gICAgICAgICAgICB0aGlzLl9zdG9wKGN1cnJlbnRTb3VuZCk7XG5cbiAgICAgICAgICAgIGlmIChuZXh0U291bmQgIT09IG51bGwpIHtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9wbGF5TmV4dE9uRW5kZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wbGF5KCduZXh0Jyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgLy8gd2UgcmVhY2hlZCB0aGUgZW5kIG9mIHRoZSBxdWV1ZSBzZXQgdGhlIGN1cnJlbnRJbmRleCBiYWNrIHRvIHplcm9cbiAgICAgICAgICAgICAgICB0aGlzLl9jdXJyZW50SW5kZXggPSAwO1xuXG4gICAgICAgICAgICAgICAgLy8gaWYgcXVldWUgbG9vcCBpcyBhY3RpdmUgdGhlbiBwbGF5XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2xvb3BRdWV1ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsYXkoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiB3aGljaFNvdW5kIGlzIG9wdGlvbmFsLCBpZiBzZXQgaXQgY2FuIGJlIHRoZSBzb3VuZCBpZCBvciBpZiBpdCdzXG4gICAgICogYSBzdHJpbmcgaXQgY2FuIGJlIG5leHQgLyBwcmV2aW91cyAvIGZpcnN0IC8gbGFzdFxuICAgICAqL1xuICAgIHByb3RlY3RlZCBfZ2V0U291bmRGcm9tUXVldWUod2hpY2hTb3VuZD86IHN0cmluZyB8IG51bWJlciwgdXBkYXRlSW5kZXg6IGJvb2xlYW4gPSB0cnVlKTogSVNvdW5kIHwgbnVsbCB7XG5cbiAgICAgICAgbGV0IHNvdW5kID0gbnVsbDtcblxuICAgICAgICAvLyBjaGVjayBpZiB0aGUgcXVldWUgaXMgZW1wdHlcbiAgICAgICAgaWYgKHRoaXMuX3F1ZXVlLmxlbmd0aCA9PT0gMCkge1xuXG4gICAgICAgICAgICByZXR1cm4gc291bmQ7XG5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGlmIHdoaWNoIHNvbmcgdG8gcGxheSBkaWQgbm90IGdldCBzcGVjaWZpZWQsIHBsYXkgb25lIGJhc2VkIGZyb20gdGhlIHF1ZXVlIGJhc2VkIG9uIHRoZSBxdWV1ZSBpbmRleCBwb3NpdGlvbiBtYXJrZXJcbiAgICAgICAgaWYgKHdoaWNoU291bmQgPT09IHVuZGVmaW5lZCAmJiB0aGlzLl9xdWV1ZVt0aGlzLl9jdXJyZW50SW5kZXhdICE9PSB1bmRlZmluZWQpIHtcblxuICAgICAgICAgICAgc291bmQgPSB0aGlzLl9xdWV1ZVt0aGlzLl9jdXJyZW50SW5kZXhdO1xuXG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHdoaWNoU291bmQgPT09ICdudW1iZXInKSB7XG5cbiAgICAgICAgICAgIC8vIGlmIHdoaWNoIHNvbmcgdG8gcGxheSBpcyBhIG51bWVyaWMgSURcbiAgICAgICAgICAgIHNvdW5kID0gdGhpcy5fZmluZFNvdW5kQnlJZCh3aGljaFNvdW5kLCB1cGRhdGVJbmRleCk7XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgbGV0IHNvdW5kSW5kZXg6IG51bWJlciB8IG51bGwgPSBudWxsO1xuXG4gICAgICAgICAgICAvLyBpZiB3aGljaCBzb25nIHRvIHBsYXkgaXMgYSBjb25zdGFudFxuICAgICAgICAgICAgc3dpdGNoICh3aGljaFNvdW5kKSB7XG4gICAgICAgICAgICAgICAgY2FzZSB0aGlzLlBMQVlfU09VTkRfTkVYVDpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX3F1ZXVlW3RoaXMuX2N1cnJlbnRJbmRleCArIDFdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdW5kSW5kZXggPSB0aGlzLl9jdXJyZW50SW5kZXggKyAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgc291bmQgPSB0aGlzLl9xdWV1ZVtzb3VuZEluZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIHRoaXMuUExBWV9TT1VORF9QUkVWSU9VUzpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX3F1ZXVlW3RoaXMuX2N1cnJlbnRJbmRleCAtIDFdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdW5kSW5kZXggPSB0aGlzLl9jdXJyZW50SW5kZXggLSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgc291bmQgPSB0aGlzLl9xdWV1ZVtzb3VuZEluZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIHRoaXMuUExBWV9TT1VORF9GSVJTVDpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX3F1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdW5kSW5kZXggPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgc291bmQgPSB0aGlzLl9xdWV1ZVtzb3VuZEluZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIHRoaXMuUExBWV9TT1VORF9MQVNUOlxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fcXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc291bmRJbmRleCA9IHRoaXMuX3F1ZXVlLmxlbmd0aCAtIDI7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VuZCA9IHRoaXMuX3F1ZXVlW3NvdW5kSW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIHdoaWNoIHNvbmcgdG8gcGxheSBpcyBhIHN0cmluZyBJRFxuICAgICAgICAgICAgICAgICAgICBzb3VuZCA9IHRoaXMuX2ZpbmRTb3VuZEJ5SWQod2hpY2hTb3VuZCwgdXBkYXRlSW5kZXgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoc291bmRJbmRleCAhPT0gbnVsbCAmJiB1cGRhdGVJbmRleCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRJbmRleCA9IHNvdW5kSW5kZXg7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzb3VuZDtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfZmluZFNvdW5kQnlJZChzb3VuZElkOiBzdHJpbmcgfCBudW1iZXIsIHVwZGF0ZUluZGV4OiBib29sZWFuKTogSVNvdW5kIHwgbnVsbCB7XG5cbiAgICAgICAgbGV0IHNvdW5kID0gbnVsbDtcblxuICAgICAgICB0aGlzLl9xdWV1ZS5zb21lKChzb3VuZEZyb21RdWV1ZTogSVNvdW5kLCBxdWV1ZUluZGV4OiBudW1iZXIpID0+IHtcblxuICAgICAgICAgICAgaWYgKHNvdW5kRnJvbVF1ZXVlLmlkID09PSBzb3VuZElkKSB7XG5cbiAgICAgICAgICAgICAgICBzb3VuZCA9IHNvdW5kRnJvbVF1ZXVlO1xuXG4gICAgICAgICAgICAgICAgaWYgKHVwZGF0ZUluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRJbmRleCA9IHF1ZXVlSW5kZXg7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gc291bmQ7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX3NvdXJjZVRvVmFyaWFibGVzKHNvdXJjZXM6IChJU291bmRTb3VyY2UgfCBzdHJpbmcpW10pOiB7IHVybDogc3RyaW5nIHwgbnVsbCwgY29kZWM/OiBzdHJpbmcgfCBudWxsIH0ge1xuXG4gICAgICAgIC8vIFRPRE86IHNvdXJjZSBjYW4gYmUgb24gb2JqZWN0IHdoZXJlIHRoZSBwcm9wZXJ0eSBuYW1lIGlzIHRoZSBjb2RlYyBhbmQgdGhlIHZhbHVlIGlzIHRoZSBzb3VuZCB1cmxcbiAgICAgICAgLy8gaWYgc291bmQgaXNudCBhbiBvYmplY3QgdHJ5IHRvIGRldGVjdCBzb3VuZCBzb3VyY2UgZXh0ZW5zaW9uIGJ5IGZpbGUgZXh0ZW50aW9uIG9yIGJ5IGNoZWNraW5nIHRoZSBmaWxlIG1pbWUgdHlwZVxuXG4gICAgICAgIC8vIFRPRE86IGdldCBhIGxpc3Qgb2Ygc3VwcG9ydGVkIGNvZGVjcyBieSB0aGlzIGRldmljZVxuXG4gICAgICAgIGxldCBmaXJzdE1hdGNoaW5nU291cmNlOiB7IHVybDogc3RyaW5nIHwgbnVsbCwgY29kZWM/OiBzdHJpbmcgfCBudWxsIH0gPSB7XG4gICAgICAgICAgICB1cmw6IG51bGwsXG4gICAgICAgICAgICBjb2RlYzogbnVsbFxuICAgICAgICB9O1xuXG4gICAgICAgIHNvdXJjZXMuZm9yRWFjaCgoc291cmNlKSA9PiB7XG5cbiAgICAgICAgICAgIC8vIFRPRE86IGZpbmQgb3V0IHdoYXQgdGhlIHNvdXJjZSBjb2RlYyBpc1xuXG4gICAgICAgICAgICAvLyBUT0RPOiBjaGVjayBpZiB0aGUgc291cmNlIGNvZGVjIGlzIGFtb25nIHRoZSBvbmVzIHRoYXQgYXJlIHN1cHBvcnRlZCBieSB0aGlzIGRldmljZVxuXG4gICAgICAgICAgICBsZXQgc291bmRVcmwgPSAnJztcblxuICAgICAgICAgICAgLy8gaWYgdGhlIHBsYXllciBoYWQgYXMgb3B0aW9uIGEgYmFzZVVybCBmb3Igc291bmRzIGFkZCBpdCBub3dcbiAgICAgICAgICAgIGlmICh0aGlzLl9zb3VuZHNCYXNlVXJsICE9PSAnJykge1xuICAgICAgICAgICAgICAgIHNvdW5kVXJsID0gdGhpcy5fc291bmRzQmFzZVVybDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gdHdvIGtpbmQgb2Ygc291cmNlIGFyZSBwb3NzaWJsZSwgYSBzdHJpbmcgKHRoZSB1cmwpIG9yIGFuIG9iamVjdCAoa2V5IGlzIHRoZSBjb2RlYyBhbmQgdmFsdWUgaXMgdGhlIHVybClcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc291cmNlID09PSAnc3RyaW5nJykge1xuXG4gICAgICAgICAgICAgICAgc291bmRVcmwgKz0gc291cmNlO1xuXG4gICAgICAgICAgICAgICAgZmlyc3RNYXRjaGluZ1NvdXJjZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBzb3VuZFVybFxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICBzb3VuZFVybCArPSBzb3VyY2UudXJsO1xuXG4gICAgICAgICAgICAgICAgZmlyc3RNYXRjaGluZ1NvdXJjZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBzb3VuZFVybCxcbiAgICAgICAgICAgICAgICAgICAgY29kZWM6IHNvdXJjZS5jb2RlY1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gZmlyc3RNYXRjaGluZ1NvdXJjZTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBwYXVzZSgpIHtcblxuICAgICAgICAvLyBnZXQgdGhlIGN1cnJlbnQgc291bmRcbiAgICAgICAgbGV0IHNvdW5kOiBJU291bmQgfCBudWxsID0gdGhpcy5fZ2V0U291bmRGcm9tUXVldWUoKTtcblxuICAgICAgICBpZiAoc291bmQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCB0aW1lQXRQYXVzZSA9IHNvdW5kLnNvdXJjZU5vZGUuY29udGV4dC5jdXJyZW50VGltZTtcblxuICAgICAgICBzb3VuZC5wbGF5VGltZU9mZnNldCArPSB0aW1lQXRQYXVzZSAtIHNvdW5kLnN0YXJ0VGltZTtcblxuICAgICAgICAvLyB0cmlnZ2VyIHBhdXNlZCBldmVudFxuICAgICAgICBpZiAoc291bmQub25QYXVzZWQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHNvdW5kLm9uUGF1c2VkKHNvdW5kLnBsYXlUaW1lT2Zmc2V0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3N0b3Aoc291bmQpO1xuXG4gICAgfVxuXG4gICAgcHVibGljIHN0b3AoKSB7XG5cbiAgICAgICAgLy8gZ2V0IHRoZSBjdXJyZW50IHNvdW5kXG4gICAgICAgIGxldCBzb3VuZDogSVNvdW5kIHwgbnVsbCA9IHRoaXMuX2dldFNvdW5kRnJvbVF1ZXVlKCk7XG5cbiAgICAgICAgaWYgKHNvdW5kID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyByZXNldCB0aGUgaXMgZmlyc3QgdGltZSBzb3VuZCBpcyBiZWluZyBwbGF5ZWQgdG8gdHJ1ZVxuICAgICAgICBzb3VuZC5maXJzdFRpbWVQbGF5ZWQgPSB0cnVlO1xuXG4gICAgICAgIC8vIHRyaWdnZXIgc3RvcHBlZCBldmVudFxuICAgICAgICBpZiAoc291bmQub25TdG9wcGVkICE9PSBudWxsKSB7XG4gICAgICAgICAgICBzb3VuZC5vblN0b3BwZWQoc291bmQucGxheVRpbWVPZmZzZXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcmVzZXQgdGhlIHBsYXlUaW1lT2Zmc2V0XG4gICAgICAgIHNvdW5kLnBsYXlUaW1lT2Zmc2V0ID0gMDtcblxuICAgICAgICB0aGlzLl9zdG9wKHNvdW5kKTtcblxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfc3RvcChzb3VuZDogSVNvdW5kKSB7XG5cbiAgICAgICAgLy8gdGVsbCB0aGUgc291cmNlTm9kZSB0byBzdG9wIHBsYXlpbmdcbiAgICAgICAgc291bmQuc291cmNlTm9kZS5zdG9wKDApO1xuXG4gICAgICAgIC8vIHRlbGwgdGhlIHNvdW5kIHRoYXQgcGxheWluZyBpcyBvdmVyXG4gICAgICAgIHNvdW5kLmlzUGxheWluZyA9IGZhbHNlO1xuXG4gICAgICAgIC8vIGRlc3Ryb3kgdGhlIHNvdXJjZSBub2RlIGFzIGl0IGNhbiBhbnl3YXkgb25seSBnZXQgdXNlZCBvbmNlXG4gICAgICAgIHRoaXMuX3BsYXllckF1ZGlvLmRlc3Ryb3lTb3VyY2VOb2RlKHNvdW5kLnNvdXJjZU5vZGUpO1xuXG4gICAgICAgIHNvdW5kLnNvdXJjZU5vZGUgPSBudWxsO1xuXG4gICAgICAgIGlmICh0aGlzLl9wbGF5aW5nVGltZW91dElEICE9PSBudWxsKSB7XG5cbiAgICAgICAgICAgIC8vIGNsZWFyIHRoZSBwbGF5aW5nIHByb2dyZXNzIHNldEludGVydmFsXG4gICAgICAgICAgICBjbGVhckludGVydmFsKHRoaXMuX3BsYXlpbmdUaW1lb3V0SUQpO1xuXG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHB1YmxpYyBuZXh0KCkge1xuXG4gICAgICAgIC8vIGFsaWFzIGZvciBwbGF5IG5leHRcbiAgICAgICAgdGhpcy5wbGF5KCduZXh0Jyk7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgcHJldmlvdXMoKSB7XG5cbiAgICAgICAgLy8gYWxpYXMgZm9yIHBsYXkgcHJldmlvdXNcbiAgICAgICAgdGhpcy5wbGF5KCdwcmV2aW91cycpO1xuXG4gICAgfVxuXG4gICAgcHVibGljIGZpcnN0KCkge1xuXG4gICAgICAgIC8vIGFsaWFzIGZvciBwbGF5IGZpcnN0XG4gICAgICAgIHRoaXMucGxheSgnZmlyc3QnKTtcblxuICAgIH1cblxuICAgIHB1YmxpYyBsYXN0KCkge1xuXG4gICAgICAgIC8vIGFsaWFzIGZvciBwbGF5IGxhc3RcbiAgICAgICAgdGhpcy5wbGF5KCdsYXN0Jyk7XG5cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX3BsYXlpbmdQcm9ncmVzcyhzb3VuZDogSVNvdW5kKSB7XG5cbiAgICAgICAgbGV0IHRpbWVOb3cgPSBzb3VuZC5zb3VyY2VOb2RlLmNvbnRleHQuY3VycmVudFRpbWU7XG5cbiAgICAgICAgc291bmQucGxheVRpbWUgPSAodGltZU5vdyAtIHNvdW5kLnN0YXJ0VGltZSkgKyBzb3VuZC5wbGF5VGltZU9mZnNldDtcblxuICAgICAgICBsZXQgcGxheWluZ1BlcmNlbnRhZ2UgPSAoc291bmQucGxheVRpbWUgLyBzb3VuZC5hdWRpb0J1ZmZlci5kdXJhdGlvbikgKiAxMDA7XG5cbiAgICAgICAgc291bmQucGxheWVkVGltZVBlcmNlbnRhZ2UgPSBwbGF5aW5nUGVyY2VudGFnZTtcblxuICAgICAgICBzb3VuZC5vblBsYXlpbmcocGxheWluZ1BlcmNlbnRhZ2UsIHNvdW5kLmF1ZGlvQnVmZmVyLmR1cmF0aW9uLCBzb3VuZC5wbGF5VGltZSk7XG5cbiAgICB9O1xuXG4gICAgcHVibGljIHNldEF1ZGlvR3JhcGgoY3VzdG9tQXVkaW9HcmFwaDogSUF1ZGlvR3JhcGgpIHtcblxuICAgICAgICB0aGlzLl9wbGF5ZXJBdWRpby5zZXRBdWRpb0dyYXBoKGN1c3RvbUF1ZGlvR3JhcGgpO1xuXG4gICAgICAgIHRoaXMuX2N1c3RvbUF1ZGlvR3JhcGggPSBjdXN0b21BdWRpb0dyYXBoO1xuXG4gICAgfVxuXG4gICAgcHVibGljIGdldEF1ZGlvR3JhcGgoKTogSUF1ZGlvR3JhcGgge1xuXG4gICAgICAgIHRoaXMuX2N1c3RvbUF1ZGlvR3JhcGggPSB0aGlzLl9wbGF5ZXJBdWRpby5nZXRBdWRpb0dyYXBoKCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX2N1c3RvbUF1ZGlvR3JhcGg7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0QXVkaW9Db250ZXh0KGN1c3RvbUF1ZGlvQ29udGV4dDogSUF1ZGlvQ29udGV4dCkge1xuXG4gICAgICAgIHRoaXMuX3BsYXllckF1ZGlvLnNldEF1ZGlvQ29udGV4dChjdXN0b21BdWRpb0NvbnRleHQpO1xuXG4gICAgICAgIHRoaXMuX2N1c3RvbUF1ZGlvQ29udGV4dCA9IGN1c3RvbUF1ZGlvQ29udGV4dDtcblxuICAgIH1cblxuICAgIHB1YmxpYyBnZXRBdWRpb0NvbnRleHQoKTogUHJvbWlzZTxJQXVkaW9Db250ZXh0PiB7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICAgICAgdGhpcy5fcGxheWVyQXVkaW8uZ2V0QXVkaW9Db250ZXh0KCkudGhlbigoYXVkaW9Db250ZXh0OiBJQXVkaW9Db250ZXh0KSA9PiB7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9jdXN0b21BdWRpb0NvbnRleHQgPSBhdWRpb0NvbnRleHQ7XG5cbiAgICAgICAgICAgICAgICByZXNvbHZlKGF1ZGlvQ29udGV4dCk7XG5cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG59XG4iXX0=

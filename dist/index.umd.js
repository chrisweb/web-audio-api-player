(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = global || self, factory(global['web-audio-api-player'] = {}));
}(this, function (exports) { 'use strict';

    var PlayerSound = /** @class */ (function () {
        function PlayerSound(soundAttributes) {
            // user provided values
            if (typeof soundAttributes.sources === 'string') {
                this.sources = [soundAttributes.sources];
            }
            else {
                this.sources = soundAttributes.sources;
            }
            this.id = soundAttributes.id;
            this.playlistId = soundAttributes.playlistId || null;
            this.loop = soundAttributes.loop || false;
            // the user can set the duration manually
            // this is usefull if we need to convert the position percentage into seconds but don't want to preload the song
            // to get the duration the song has to get preloaded as the duration is a property of the audioBuffer
            this.duration = soundAttributes.duration || null;
            this.firstTimePlayed = true;
            if (typeof soundAttributes.onLoading === 'function') {
                this.onLoading = soundAttributes.onLoading;
            }
            else {
                this.onLoading = null;
            }
            if (typeof soundAttributes.onPlaying === 'function') {
                this.onPlaying = soundAttributes.onPlaying;
            }
            else {
                this.onPlaying = null;
            }
            if (typeof soundAttributes.onStarted === 'function') {
                this.onStarted = soundAttributes.onStarted;
            }
            else {
                this.onStarted = null;
            }
            if (typeof soundAttributes.onEnded === 'function') {
                this.onEnded = soundAttributes.onEnded;
            }
            else {
                this.onEnded = null;
            }
            if (typeof soundAttributes.onStopped === 'function') {
                this.onStopped = soundAttributes.onStopped;
            }
            else {
                this.onStopped = null;
            }
            if (typeof soundAttributes.onPaused === 'function') {
                this.onPaused = soundAttributes.onPaused;
            }
            else {
                this.onPaused = null;
            }
            if (typeof soundAttributes.onResumed === 'function') {
                this.onResumed = soundAttributes.onResumed;
            }
            else {
                this.onResumed = null;
            }
            var arrayBufferType = typeof soundAttributes.arrayBuffer;
            if (arrayBufferType === 'ArrayBuffer') {
                this.arrayBuffer = soundAttributes.arrayBuffer;
            }
            else {
                this.arrayBuffer = null;
            }
            var audioBufferType = typeof soundAttributes.audioBuffer;
            if (audioBufferType === 'AudioBuffer') {
                this.audioBuffer = soundAttributes.audioBuffer;
                this.audioBufferDate = new Date();
            }
            else {
                this.audioBuffer = null;
                this.audioBufferDate = null;
            }
            // default values
            this.sourceNode = null;
            this.isBuffered = false;
            this.isBuffering = false;
            this.playTimeOffset = 0;
            this.startTime = 0;
            this.playTime = 0;
            this.playedTimePercentage = 0;
            this.isPlaying = false;
        }
        return PlayerSound;
    }());

    var PlayerAudio = /** @class */ (function () {
        function PlayerAudio(options) {
            var _this = this;
            this._audioContext = null;
            this._audioGraph = null;
            // initial context state is still "closed"
            this._contextState = 'closed';
            this._volume = options.volume;
            if ('customAudioContext' in options
                && options.customAudioContext !== null
                && options.customAudioContext !== undefined) {
                this.setAudioContext(options.customAudioContext);
            }
            else {
                this._audioContext = this._createAudioContext();
            }
            if ('customAudioGraph' in options
                && options.customAudioGraph !== null
                && options.customAudioGraph !== undefined) {
                this.setAudioGraph(options.customAudioGraph);
            }
            else {
                this._createAudioGraph()
                    .then(function (audioGraph) {
                    _this._audioGraph = audioGraph;
                });
            }
            // TODO: to speed up things would it be better to create a context in the constructor?
            // and suspend the context upon creating it until it gets used?
        }
        PlayerAudio.prototype.decodeAudio = function (arrayBuffer) {
            return this.getAudioContext().then(function (audioContext) {
                // Note to self:
                // newer decodeAudioData returns promise, older accept as second
                // and third parameter a success and an error callback funtion
                // https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/decodeAudioData
                var audioBufferPromise = audioContext.decodeAudioData(arrayBuffer);
                // decodeAudioData returns a promise of type PromiseLike
                // using resolve to return a promise of type Promise
                return Promise.resolve(audioBufferPromise);
            });
        };
        /*interface IWindow {
            AudioContext: typeof AudioContext;
            webkitAudioContext: typeof AudioContext;
        }*/
        //declare var window: Window;
        PlayerAudio.prototype._createAudioContext = function () {
            var MyAudioContext = window.AudioContext || window.webkitAudioContext;
            // initialize the audio context
            var audioContext = new MyAudioContext();
            // bind the listener for the context state changes
            this._bindContextStateListener(audioContext);
            // set the "initial" state to running
            this._contextState = 'running';
            return audioContext;
        };
        PlayerAudio.prototype._bindContextStateListener = function (audioContext) {
            var _this = this;
            audioContext.onstatechange = function () {
                _this._contextState = audioContext.state;
                if (_this._contextState === 'closed') {
                    _this._audioContext = null;
                }
            };
        };
        PlayerAudio.prototype.getAudioContext = function () {
            var _this = this;
            return new Promise(function (resolve, reject) {
                if (_this._contextState === 'closed') {
                    var audioContext = _this._createAudioContext();
                    _this._audioContext = audioContext;
                    resolve(audioContext);
                }
                else if (_this._contextState === 'suspended') {
                    _this._unfreezeAudioContext().then(function () {
                        resolve(_this._audioContext);
                    });
                }
                else {
                    resolve(_this._audioContext);
                }
            });
        };
        PlayerAudio.prototype.setAudioContext = function (audioContext) {
            var _this = this;
            if (this._audioContext !== null) {
                this._destroyAudioContext().then(function () {
                    _this._setAudioContext(audioContext);
                });
            }
            else {
                this._setAudioContext(audioContext);
            }
        };
        PlayerAudio.prototype._setAudioContext = function (audioContext) {
            this._audioContext = audioContext;
            this._bindContextStateListener(audioContext);
        };
        PlayerAudio.prototype._destroyAudioContext = function () {
            var _this = this;
            return this._audioContext.close().then(function () {
                _this._audioContext = null;
            });
        };
        PlayerAudio.prototype._unfreezeAudioContext = function () {
            // did resume get implemented
            if (typeof this._audioContext.suspend === 'undefined') {
                // this browser does not support resume
                // just send back a promise as resume would do
                return Promise.resolve();
            }
            else {
                // resume the audio hardware access
                // audio context resume returns a promise
                // https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/resume
                return this._audioContext.resume();
            }
        };
        PlayerAudio.prototype._freezeAudioContext = function () {
            // did suspend get implemented
            if (typeof this._audioContext.suspend === 'undefined') {
                return Promise.resolve();
            }
            else {
                // halt the audio hardware access temporarily to reduce CPU and battery usage
                return this._audioContext.suspend();
            }
        };
        PlayerAudio.prototype.setAudioGraph = function (audioGraph) {
            var _this = this;
            if (this._audioGraph !== null) {
                this._destroyAudioGraph();
            }
            // check if there is gain node
            if (!('gainNode' in audioGraph)
                || audioGraph.gainNode === null
                || audioGraph.gainNode === undefined) {
                this.getAudioContext().then(function (audioContext) {
                    audioGraph.gainNode = audioContext.createGain();
                    _this._audioGraph = audioGraph;
                });
            }
            else {
                this._audioGraph = audioGraph;
            }
        };
        PlayerAudio.prototype.getAudioGraph = function () {
            var _this = this;
            return new Promise(function (resolve, reject) {
                if (_this._audioGraph !== null) {
                    resolve(_this._audioGraph);
                }
                else {
                    _this._createAudioGraph()
                        .then(function (audioGraph) {
                        _this._audioGraph = audioGraph;
                        resolve(audioGraph);
                    }).catch(reject);
                }
            });
        };
        PlayerAudio.prototype._createAudioGraph = function () {
            var _this = this;
            return new Promise(function (resolve, reject) {
                _this.getAudioContext().then(function (audioContext) {
                    if (!_this._audioGraph) {
                        _this._audioGraph = {
                            gainNode: audioContext.createGain()
                        };
                    }
                    // connect the gain node to the destination (speakers)
                    // https://developer.mozilla.org/en-US/docs/Web/API/AudioDestinationNode
                    _this._audioGraph.gainNode.connect(audioContext.destination);
                    // update volume
                    _this.changeGainValue(_this._volume);
                    resolve(_this._audioGraph);
                });
            });
        };
        PlayerAudio.prototype._destroyAudioGraph = function () {
            this._audioGraph.gainNode.disconnect();
            // TODO: disconnect other nodes!?
            this._audioGraph = null;
        };
        PlayerAudio.prototype.createSourceNode = function (sourceNodeOptions) {
            return this.getAudioContext().then(function (audioContext) {
                var sourceNode = audioContext.createBufferSource();
                // do we loop this song
                sourceNode.loop = sourceNodeOptions.loop;
                // if the song ends destroy it's audioGraph as the source can't be reused anyway
                // NOTE: the onended handler won't have any effect if the loop property is set to
                // true, as the audio won't stop playing. To see the effect in this case you'd
                // have to use AudioBufferSourceNode.stop()
                sourceNode.onended = function () {
                    sourceNodeOptions.onEnded();
                    sourceNode.disconnect();
                    sourceNode = null;
                };
                return sourceNode;
            });
        };
        PlayerAudio.prototype.connectSourceNodeToGraphNodes = function (sourceNode) {
            sourceNode.connect(this._audioGraph.gainNode);
            if ('analyserNode' in this._audioGraph
                && this._audioGraph.analyserNode !== null
                && this._audioGraph.analyserNode !== undefined) {
                sourceNode.connect(this._audioGraph.analyserNode);
            }
            if ('delayNode' in this._audioGraph
                && this._audioGraph.delayNode !== null
                && this._audioGraph.delayNode !== undefined) {
                sourceNode.connect(this._audioGraph.delayNode);
            }
            // TODO: handle other types of nodes as well
            // do it recursivly!?
        };
        PlayerAudio.prototype.destroySourceNode = function (sourceNode) {
            sourceNode.disconnect();
            sourceNode = null;
            return sourceNode;
        };
        PlayerAudio.prototype.changeGainValue = function (volume) {
            this.getAudioGraph().then(function (audioGraph) {
                audioGraph.gainNode.gain.value = volume / 100;
            });
        };
        return PlayerAudio;
    }());

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    // https://github.com/Microsoft/TypeScript/issues/12123
    var PlayerError = /** @class */ (function (_super) {
        __extends(PlayerError, _super);
        function PlayerError(message, code) {
            var _this = _super.call(this, message) || this;
            _this.code = code || null;
            // Set the prototype explictilly
            Object.setPrototypeOf(_this, PlayerError.prototype);
            return _this;
        }
        return PlayerError;
    }(Error));

    var PlayerRequest = /** @class */ (function () {
        function PlayerRequest() {
        }
        // TODO: add possibility to abort http request
        PlayerRequest.prototype.getArrayBuffer = function (requested) {
            return new Promise(function (resolve, reject) {
                var xhr = new XMLHttpRequest();
                // TODO: abort the request?
                // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/abort
                // thirs parameter is for "async", default true but who knows if prefer to explicitly set it just in case
                xhr.open('GET', requested.url, true);
                // set the expected response type from the server to arraybuffer
                xhr.responseType = 'arraybuffer';
                xhr.onload = function () {
                    // gets called even on for example 404, so check the status
                    if (xhr.status === 200) {
                        // successful request so now we can resolve the promise
                        resolve(xhr.response);
                    }
                    else {
                        // something went wrong so we reject with an error
                        reject(new PlayerError(xhr.statusText, xhr.status));
                    }
                };
                xhr.onprogress = function (event) {
                    var percentage = 100 / (event.total / event.loaded);
                    // update value on sound object
                    requested.loadingProgress = percentage;
                    if (requested.onLoading !== null) {
                        requested.onLoading(percentage, event.total, event.loaded);
                    }
                };
                // also reject for any kind of network errors
                xhr.onerror = function () {
                    reject(new PlayerError('xhr network error'));
                };
                // now make the request
                xhr.send();
            });
        };
        return PlayerRequest;
    }());

    var PlayerCore = /** @class */ (function () {
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
            // is the web audio api supported
            // if not we will use the audio element as fallback
            {
                this._isWebAudioApiSupported = true;
            }
            var audioOptions = {
                volume: this._volume,
                customAudioContext: this._customAudioContext,
                customAudioGraph: this._customAudioGraph
            };
            // player audio library instance
            this._playerAudio = new PlayerAudio(audioOptions);
        };
        PlayerCore.prototype.addSoundToQueue = function (soundAttributes, whereInQueue) {
            if (whereInQueue === void 0) { whereInQueue = this.WHERE_IN_QUEUE_AT_END; }
            var sound = new PlayerSound(soundAttributes);
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
                        var request = new PlayerRequest();
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
                        var noUrlError = new PlayerError('sound has no url', 1);
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
            var _this = this;
            return new Promise(function (resolve, reject) {
                // TODO: check the available codecs and defined sources, play the first one that has matches and available codec
                // TODO: let user define order of preferred codecs for playerback
                // get the current sound if any
                var currentSound = _this._getSoundFromQueue();
                // if there is a sound currently being played
                if (currentSound !== null && currentSound.isPlaying) {
                    // stop the current sound
                    _this.stop();
                }
                // whichSound is optional, if set it can be the sound id or if it's a string it can be next / previous / first / last
                var sound = _this._getSoundFromQueue(whichSound);
                // if there is no sound we could play, do nothing
                if (sound === null) {
                    throw new Error('no more sounds in array');
                    // TODO: throw an error?
                }
                // if the user wants to play the sound from a certain position
                if (playTimeOffset !== undefined) {
                    sound.playTimeOffset = playTimeOffset;
                }
                // has the sound already been loaded?
                if (!sound.isBuffered) {
                    _this._loadSound(sound).then(function () {
                        return _this._play(sound).then(resolve).catch(reject);
                    }).catch(reject);
                }
                else {
                    _this._play(sound).then(resolve).catch(reject);
                }
            });
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
            return this._playerAudio.createSourceNode(sourceNodeOptions).then(function (sourceNode) {
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
                    _this._playingTimeoutID = window.setInterval(function () {
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
    exports.PlayerSound = PlayerSound;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=index.umd.js.map

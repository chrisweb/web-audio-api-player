/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

var SOUND_STATE_STOPPED = 'sound_state_stopped';
var PlayerSound = /** @class */ (function () {
    function PlayerSound(soundAttributes) {
        this.url = null;
        this.codec = null;
        this.audioBufferSourceNode = null;
        this.mediaElementAudioSourceNode = null;
        this.isReadyToPLay = false;
        this.isBuffered = false;
        this.isBuffering = false;
        this.audioElement = null;
        this.audioBuffer = null;
        this.arrayBuffer = null;
        this.audioBufferDate = null;
        this.playTimeOffset = 0;
        this.startTime = 0;
        this.playTime = 0;
        this.playedTimePercentage = 0;
        this.state = SOUND_STATE_STOPPED;
        this.loadingProgress = 0;
        this.duration = null;
        this.firstTimePlayed = true;
        // user provided values
        if (!Array.isArray(soundAttributes.source)) {
            this.source = [soundAttributes.source];
        }
        else {
            this.source = soundAttributes.source;
        }
        this.id = soundAttributes.id;
        this.loop = soundAttributes.loop || false;
        // the user can set the duration manually
        // this is usefull if we need to convert the position percentage into seconds but don't want to preload the song
        // to get the duration the song has to get preloaded as the duration is a property of the audioBuffer
        this.duration = soundAttributes.duration || null;
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
        // if the arrayBufferType is injected through the sound attributes
        var arrayBufferType = typeof soundAttributes.arrayBuffer;
        if (arrayBufferType === 'ArrayBuffer') {
            this.arrayBuffer = soundAttributes.arrayBuffer;
        }
        // if the audioBuffer is injected through the sound attributes
        var audioBufferType = typeof soundAttributes.audioBuffer;
        if (audioBufferType === 'AudioBuffer') {
            this.audioBuffer = soundAttributes.audioBuffer;
            this.isBuffering = false;
            this.isBuffered = true;
            this.audioBufferDate = new Date();
            this.duration = this.getDuration();
        }
    }
    PlayerSound.prototype.getCurrentTime = function () {
        var currentTime;
        if (this.audioBufferSourceNode !== null) {
            currentTime = this.audioBufferSourceNode.context.currentTime;
        }
        else if (this.mediaElementAudioSourceNode !== null) {
            currentTime = this.audioElement.currentTime;
        }
        return currentTime;
    };
    PlayerSound.prototype.getDuration = function () {
        var duration;
        if (this.audioBufferSourceNode !== null) {
            duration = this.audioBufferSourceNode.buffer.duration;
        }
        else if (this.mediaElementAudioSourceNode !== null) {
            duration = this.audioElement.duration;
        }
        return duration;
    };
    // static constants
    PlayerSound.SOUND_STATE_STOPPED = 'sound_state_stopped';
    PlayerSound.SOUND_STATE_PAUSED = 'sound_state_paused';
    PlayerSound.SOUND_STATE_PLAYING = 'sound_state_playing';
    return PlayerSound;
}());

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

var PlayerAudio = /** @class */ (function () {
    function PlayerAudio(options) {
        this._audioContext = null;
        this._audioGraph = null;
        this.setPersistVolume(options.persistVolume);
        this._setAutoCreateContextOnFirstTouch(options.createAudioContextOnFirstUserInteraction);
        this.setLoadPlayerMode(options.loadPlayerMode);
        this.setAudioContext(options.customAudioContext);
        if (options.customAudioContext === null) {
            this._autoCreateAudioContextOnFirstUserInteraction();
        }
        if (!this._createAudioContextOnFirstUserInteraction) {
            // if the autdioContext shouldn't be created on first user
            // interaction, we create it during initialization
            this.getAudioContext().catch(function () {
                throw new PlayerError('audio context setup failed');
            });
        }
        this.setAudioGraph(options.customAudioGraph);
    }
    PlayerAudio.prototype.decodeAudio = function (arrayBuffer) {
        return __awaiter(this, void 0, void 0, function () {
            var audioContext, audioBufferPromise;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getAudioContext()];
                    case 1:
                        audioContext = _a.sent();
                        audioBufferPromise = audioContext.decodeAudioData(arrayBuffer);
                        // decodeAudioData returns a promise of type PromiseLike
                        // using resolve to return a promise of type Promise
                        return [2 /*return*/, Promise.resolve(audioBufferPromise)];
                }
            });
        });
    };
    PlayerAudio.prototype._createAudioContext = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            var MyAudioContext = window.AudioContext || window.webkitAudioContext;
            // initialize the audio context
            try {
                _this._audioContext = new MyAudioContext();
                resolve();
            }
            catch (error) {
                reject(error);
            }
        });
    };
    PlayerAudio.prototype._autoCreateAudioContextRemoveListener = function () {
        document.removeEventListener('touchstart', this._autoCreateAudioContextRemoveListener.bind(this), false);
        document.removeEventListener('touchend', this._autoCreateAudioContextRemoveListener.bind(this), false);
        document.removeEventListener('mousedown', this._autoCreateAudioContextRemoveListener.bind(this), false);
        this.getAudioContext().catch(function () {
            throw new PlayerError('audio context setup failed');
        });
    };
    PlayerAudio.prototype._autoCreateAudioContextOnFirstUserInteraction = function () {
        if (this._createAudioContextOnFirstUserInteraction) {
            document.addEventListener('touchstart', this._autoCreateAudioContextRemoveListener.bind(this), false);
            document.addEventListener('touchend', this._autoCreateAudioContextRemoveListener.bind(this), false);
            document.addEventListener('mousedown', this._autoCreateAudioContextRemoveListener.bind(this), false);
        }
    };
    PlayerAudio.prototype.getAudioContext = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this._audioContext === null) {
                _this._createAudioContext().then(function () {
                    resolve(_this._audioContext);
                }).catch(reject);
            }
            else if (_this._audioContext.state === 'suspended') {
                _this._unfreezeAudioContext().then(function () {
                    resolve(_this._audioContext);
                });
            }
            else if (_this._audioContext.state === 'running') {
                resolve(_this._audioContext);
            }
            else {
                // TODO: are other states possible?
                console.log('audioContext.state: ', _this._audioContext.state);
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
    };
    PlayerAudio.prototype._destroyAudioContext = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._audioContext.close()];
                    case 1:
                        _a.sent();
                        this._audioContext = null;
                        return [2 /*return*/];
                }
            });
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
        if (audioGraph !== null &&
            (!('gainNode' in audioGraph)
                || audioGraph.gainNode === null
                || audioGraph.gainNode === undefined)) {
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
                // update the gainValue (volume)
                var gainValue = _this._volume / 100;
                _this._changeGainValue(gainValue);
                // resolve
                resolve(_this._audioGraph);
            }).catch(reject);
        });
    };
    PlayerAudio.prototype._destroyAudioGraph = function () {
        if (this._audioGraph !== null) {
            this._audioGraph.gainNode.disconnect();
        }
        // TODO: disconnect other nodes!?
        this._audioGraph = null;
    };
    PlayerAudio.prototype.createAudioBufferSourceNode = function (audioBufferSourceOptions, sound) {
        return __awaiter(this, void 0, void 0, function () {
            var audioContext, audioBufferSourceNode;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getAudioContext()];
                    case 1:
                        audioContext = _a.sent();
                        audioBufferSourceNode = audioContext.createBufferSource();
                        sound.audioBufferSourceNode = audioBufferSourceNode;
                        // do we loop this song
                        audioBufferSourceNode.loop = audioBufferSourceOptions.loop;
                        // if the song ends destroy it's audioGraph as the source can't be reused anyway
                        // NOTE: the onended handler won't have any effect if the loop property is set to
                        // true, as the audio won't stop playing. To see the effect in this case you'd
                        // have to use AudioBufferSourceNode.stop()
                        audioBufferSourceNode.onended = function (event) {
                            audioBufferSourceOptions.onEnded(event);
                            _this.destroySourceNode(sound);
                        };
                        return [2 /*return*/];
                }
            });
        });
    };
    PlayerAudio.prototype.createMediaElementSourceNode = function (sourceNodeOptions, sound) {
        return __awaiter(this, void 0, void 0, function () {
            var audioContext, mediaElementAudioSourceNode;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getAudioContext()];
                    case 1:
                        audioContext = _a.sent();
                        try {
                            mediaElementAudioSourceNode = audioContext.createMediaElementSource(sourceNodeOptions.mediaElement);
                        }
                        catch (error) {
                            throw new PlayerError(error);
                        }
                        sound.mediaElementAudioSourceNode = mediaElementAudioSourceNode;
                        // do we loop this song
                        mediaElementAudioSourceNode.loop = sourceNodeOptions.loop;
                        // ??? no onEnded on MediaElementSource: https://developer.mozilla.org/en-US/docs/Web/API/AudioScheduledSourceNode/onended
                        // ??? mediaElementAudioSourceNode.mediaElement.ended
                        // if the song ends destroy it's audioGraph as the source can't be reused anyway
                        // NOTE: the onEnded handler won't have any effect if the loop property is set to
                        // true, as the audio won't stop playing. To see the effect in this case you'd
                        // have to use AudioBufferSourceNode.stop()
                        mediaElementAudioSourceNode.onended = function () {
                            _this.destroySourceNode(sound);
                            // TODO on end destroy the audio element, probably not if loop enabled, but if loop
                            // is disabled, maybe still a good idea to keep it (cache?), but not all audio elements
                            // because of memory consumption if suddenly hundreds of audio elements in one page
                        };
                        return [2 /*return*/];
                }
            });
        });
    };
    PlayerAudio.prototype.connectSourceNodeToGraphNodes = function (sourceNode) {
        // audio routing graph
        this.getAudioGraph().then(function (audioGraph) {
            // https://developer.mozilla.org/en-US/docs/Web/API/GainNode
            sourceNode.connect(audioGraph.gainNode);
            // https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode
            if ('analyserNode' in audioGraph
                && audioGraph.analyserNode !== null
                && audioGraph.analyserNode !== undefined) {
                sourceNode.connect(audioGraph.analyserNode);
            }
            // https://developer.mozilla.org/en-US/docs/Web/API/DelayNode
            if ('delayNode' in audioGraph
                && audioGraph.delayNode !== null
                && audioGraph.delayNode !== undefined) {
                sourceNode.connect(audioGraph.delayNode);
            }
            // https://developer.mozilla.org/en-US/docs/Web/API/PannerNode
            if ('pannerNode' in audioGraph
                && audioGraph.pannerNode !== null
                && audioGraph.pannerNode !== undefined) {
                sourceNode.connect(audioGraph.pannerNode);
            }
            // https://developer.mozilla.org/en-US/docs/Web/API/StereoPannerNode
            // TODO: handle other types of nodes as well
            // https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode
            // https://developer.mozilla.org/en-US/docs/Web/API/ChannelMergerNode
            // https://developer.mozilla.org/en-US/docs/Web/API/ChannelSplitterNode
            // https://developer.mozilla.org/en-US/docs/Web/API/ConvolverNode
            // https://developer.mozilla.org/en-US/docs/Web/API/DynamicsCompressorNode
            // https://developer.mozilla.org/en-US/docs/Web/API/IIRFilterNode
            // https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode
            // https://developer.mozilla.org/en-US/docs/Web/API/WaveShaperNode
            // do it recursivly!?
            // let the user chose the order in which they get connected?
        });
    };
    PlayerAudio.prototype.destroySourceNode = function (sound) {
        // destroy the source node
        if (sound.audioBufferSourceNode !== null) {
            sound.audioBufferSourceNode.disconnect();
        }
        else if (sound.mediaElementAudioSourceNode !== null) {
            sound.mediaElementAudioSourceNode.disconnect();
        }
        else {
            throw new PlayerError('can\'t destroy as no source node in sound');
        }
        // the audio buffer source node we set it to null, to let it get destroyed
        // by the garbage collector as you can't reuse an audio buffer source node
        // (after it got stopped) as specified in the specs
        sound.audioBufferSourceNode = null;
        // an media element source node can be reused (there is no stop method, only
        // a pause method) so we don't set it to null
        //sound.mediaElementAudioSourceNode = null;
    };
    PlayerAudio.prototype.changeVolume = function (_a) {
        var volume = _a.volume, _b = _a.sound, sound = _b === void 0 ? null : _b, _c = _a.forceUpdateUserVolume, forceUpdateUserVolume = _c === void 0 ? true : _c;
        if (this._persistVolume) {
            var userVolume = parseInt(localStorage.getItem('WebAudioAPIPlayerVolume'));
            // we sometimes change the volume, for a fade in/out or when muting, but
            // in this cases we don't want to update the user's persisted volume, in
            // which case forceUpdateUserVolume is false else it would be true
            if (!isNaN(userVolume) && !forceUpdateUserVolume) {
                volume = userVolume;
            }
            else {
                if (forceUpdateUserVolume) {
                    localStorage.setItem('WebAudioAPIPlayerVolume', volume.toString());
                }
            }
        }
        // update the player volume / gain value
        var volumeLevel = volume / 100;
        if (sound !== null) {
            sound.audioElement.volume = volumeLevel;
        }
        else {
            this._changeGainValue(volumeLevel);
        }
        this._volume = volume;
        return volume;
    };
    PlayerAudio.prototype._changeGainValue = function (gainValue) {
        this.getAudioGraph().then(function (audioGraph) {
            audioGraph.gainNode.gain.value = gainValue;
        });
    };
    PlayerAudio.prototype._setAutoCreateContextOnFirstTouch = function (autoCreate) {
        // protected as this can only be used during initialization, if false
        // the audioContext is created by default during Initialization and this
        // can't be undone or changed later on
        this._createAudioContextOnFirstUserInteraction = autoCreate;
    };
    PlayerAudio.prototype.setPersistVolume = function (persistVolume) {
        this._persistVolume = persistVolume;
    };
    PlayerAudio.prototype.getPersistVolume = function () {
        return this._persistVolume;
    };
    PlayerAudio.prototype.setLoadPlayerMode = function (loadPlayerMode) {
        this._loadPlayerMode = loadPlayerMode;
    };
    PlayerAudio.prototype.getLoadPlayerMode = function () {
        return this._loadPlayerMode;
    };
    return PlayerAudio;
}());

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

var PLAYER_MODE_AUDIO = 'player_mode_audio';
var PlayerCore = /** @class */ (function () {
    function PlayerCore(playerOptions) {
        if (playerOptions === void 0) { playerOptions = {}; }
        // playing progress timeoutID
        this._playingTimeoutID = null;
        // a custon audioGraph created by the user
        this._customAudioGraph = null;
        // a custom audio context created by the user
        this._customAudioContext = null;
        // the volume level before we muted
        this._postMuteVolume = null;
        // is muted?
        this._isMuted = false;
        var defaultOptions = {
            volume: 80,
            loopQueue: false,
            loopSong: false,
            soundsBaseUrl: '',
            playingProgressIntervalTime: 1000,
            playNextOnEnded: true,
            audioGraph: null,
            audioContext: null,
            stopOnReset: true,
            visibilityAutoMute: false,
            createAudioContextOnFirstUserInteraction: true,
            persistVolume: true,
            loadPlayerMode: PLAYER_MODE_AUDIO
        };
        var options = Object.assign({}, defaultOptions, playerOptions);
        this._volume = options.volume;
        this._soundsBaseUrl = options.soundsBaseUrl;
        this._queue = [];
        this._currentIndex = 0;
        this._playingProgressIntervalTime = options.playingProgressIntervalTime;
        this._playNextOnEnded = options.playNextOnEnded;
        this._loopQueue = options.loopQueue;
        this._loopSong = options.loopSong;
        this._stopOnReset = options.stopOnReset;
        this._visibilityAutoMute = options.visibilityAutoMute;
        this._createAudioContextOnFirstUserInteraction = options.createAudioContextOnFirstUserInteraction;
        this._persistVolume = options.persistVolume;
        this._loadPlayerMode = options.loadPlayerMode;
        if (typeof options.audioContext !== 'undefined') {
            this._customAudioContext = options.audioContext;
        }
        if (typeof options.audioGraph !== 'undefined') {
            this._customAudioGraph = options.audioGraph;
        }
        this._initialize();
    }
    PlayerCore.prototype._initialize = function () {
        var audioOptions;
        switch (this._loadPlayerMode) {
            case PlayerCore.PLAYER_MODE_AUDIO:
                if (!this._detectAudioContextSupport()) {
                    throw new PlayerError('audio context is not supported by this device');
                }
                audioOptions = this._webAudioApiOptions();
                break;
            case PlayerCore.PLAYER_MODE_AJAX:
                if (!this._detectAudioElementSupport()) {
                    throw new PlayerError('audio context is not supported by this device');
                }
                audioOptions = this._webAudioElementOptions();
                break;
        }
        // player audio library instance
        this._playerAudio = new PlayerAudio(audioOptions);
    };
    PlayerCore.prototype._webAudioApiOptions = function () {
        var webAudioApiOptions = {
            customAudioContext: this._customAudioContext,
            customAudioGraph: this._customAudioGraph,
            createAudioContextOnFirstUserInteraction: this._createAudioContextOnFirstUserInteraction,
            persistVolume: this._persistVolume,
            loadPlayerMode: this._loadPlayerMode
        };
        return webAudioApiOptions;
    };
    PlayerCore.prototype._webAudioElementOptions = function () {
        var webAudioElementOptions = {
            customAudioContext: null,
            customAudioGraph: null,
            createAudioContextOnFirstUserInteraction: false,
            persistVolume: this._persistVolume,
            loadPlayerMode: this._loadPlayerMode
        };
        return webAudioElementOptions;
    };
    PlayerCore.prototype._detectAudioContextSupport = function () {
        // basic audio context detection
        var audioContextSupported = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (typeof window.webkitAudioContext !== 'undefined') {
            audioContextSupported = true;
        }
        else if (typeof AudioContext !== 'undefined') {
            audioContextSupported = true;
        }
        return audioContextSupported;
    };
    PlayerCore.prototype._detectAudioElementSupport = function () {
        // basic audio element detection
        return !!document.createElement('audio').canPlayType;
    };
    PlayerCore.prototype.addSoundToQueue = function (_a) {
        var soundAttributes = _a.soundAttributes, _b = _a.whereInQueue, whereInQueue = _b === void 0 ? PlayerCore.WHERE_IN_QUEUE_AT_END : _b;
        var sound = new PlayerSound(soundAttributes);
        // TODO: is queue just an array of sounds, or do we need something more complex with a position tracker?
        // TODO: allow array of soundAttributes to be injected, to create several at once, if input is an array output should be too
        switch (whereInQueue) {
            case PlayerCore.WHERE_IN_QUEUE_AT_END:
                this._appendSoundToQueue(sound);
                break;
            case PlayerCore.WHERE_IN_QUEUE_AT_START:
                this._prependSoundToQueue(sound);
                break;
            case PlayerCore.WHERE_IN_QUEUE_AFTER_CURRENT:
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
        // TODO: is this needed?
        return this._queue;
    };
    PlayerCore.prototype.setVolume = function (volume) {
        this._volume = volume;
        this._isMuted = false;
        // get the current sound if any
        var currentSound = this._getSoundFromQueue();
        // if there is a sound currently being played
        if (currentSound !== null && currentSound.state === PlayerSound.SOUND_STATE_PLAYING) {
            this._playerAudio.changeVolume({ volume: volume, sound: currentSound, forceUpdateUserVolume: true });
        }
    };
    PlayerCore.prototype.getVolume = function () {
        return this._volume;
    };
    PlayerCore.prototype.mute = function () {
        var currentVolume = this.getVolume();
        this._postMuteVolume = currentVolume;
        // get the current sound if any
        var currentSound = this._getSoundFromQueue();
        // if there is a sound currently being played
        if (currentSound !== null && currentSound.state === PlayerSound.SOUND_STATE_PLAYING) {
            this._playerAudio.changeVolume({ volume: 0, sound: currentSound, forceUpdateUserVolume: false });
        }
        this._isMuted = true;
    };
    PlayerCore.prototype.unMute = function () {
        // get the current sound if any
        var currentSound = this._getSoundFromQueue();
        // if there is a sound currently being played
        if (currentSound !== null && currentSound.state === PlayerSound.SOUND_STATE_PLAYING) {
            this._playerAudio.changeVolume({ volume: this._postMuteVolume, sound: currentSound, forceUpdateUserVolume: false });
        }
        this._isMuted = false;
    };
    PlayerCore.prototype.isMuted = function () {
        return this._isMuted;
    };
    PlayerCore.prototype.setPosition = function (soundPositionInPercent) {
        var _this = this;
        // get the current sound if any
        var currentSound = this._getSoundFromQueue();
        // if there is a sound currently being played
        if (currentSound !== null) {
            // check if the duration got set manually
            if (currentSound.duration === null || isNaN(currentSound.duration)) {
                // the user can set the sound duration manually but if he didn't the song has to
                // get preloaded as the duration is a property of the audioBuffer
                this._loadSound(currentSound)
                    .then(function (sound) {
                    // calculate the position in seconds
                    var soundPositionInSeconds = (sound.duration / 100) * soundPositionInPercent;
                    _this.setPositionInSeconds(soundPositionInSeconds);
                }).catch(function (error) {
                    throw error;
                });
            }
            else {
                // calculate the position in seconds
                var soundPositionInSeconds = (currentSound.duration / 100) * soundPositionInPercent;
                this.setPositionInSeconds(soundPositionInSeconds);
            }
        }
        else {
            throw new PlayerError('position change called, but no current sound found');
        }
    };
    PlayerCore.prototype.setPositionInSeconds = function (soundPositionInSeconds) {
        // get the current sound if any
        var currentSound = this._getSoundFromQueue();
        // if there is a sound currently being played
        if (currentSound !== null) {
            // is the song is being played
            if (currentSound.state === PlayerSound.SOUND_STATE_PLAYING) {
                // stop the track playback
                this.pause();
                // start the playback at the given position
                this.play({ whichSound: currentSound.id, playTimeOffset: soundPositionInSeconds });
            }
            else {
                // only set the sound position but don't play
                currentSound.playTimeOffset = soundPositionInSeconds;
            }
        }
        else {
            throw new PlayerError('position change called, but no current sound found');
        }
    };
    PlayerCore.prototype._loadSound = function (sound) {
        var loadSoundPromise;
        var notImplementedError;
        switch (this._loadPlayerMode) {
            case PlayerCore.PLAYER_MODE_AUDIO:
                loadSoundPromise = this._loadSoundUsingAudioElement(sound);
                break;
            case PlayerCore.PLAYER_MODE_AJAX:
                loadSoundPromise = this._loadSoundUsingRequest(sound);
                break;
            case PlayerCore.PLAYER_MODE_FETCH:
                // TODO: implement fetch
                notImplementedError = new PlayerError(PlayerCore.PLAYER_MODE_FETCH + ' is not implemented yet', 1);
                loadSoundPromise = Promise.reject(notImplementedError);
                break;
        }
        return loadSoundPromise;
    };
    PlayerCore.prototype._loadSoundUsingAudioElement = function (sound) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            // extract the url and codec from sources
            var _a = _this._findBestSource(sound.source), url = _a.url, _b = _a.codec, codec = _b === void 0 ? null : _b;
            sound.url = url;
            sound.codec = codec;
            sound.arrayBuffer = null;
            if (sound.url !== null) {
                var audioElement = new Audio();
                // in chrome you will get this error message in the console:
                // "MediaElementAudioSource outputs zeroes due to CORS access restrictions"
                // to fix this put crossOrigin to anonymous or change the cors
                // Access-Control-Allow-Origin header of the server to *
                // "crossOrigin" has to be set before "src"
                audioElement.crossOrigin = 'anonymous';
                audioElement.src = sound.url;
                audioElement.controls = false;
                audioElement.autoplay = false;
                document.body.appendChild(audioElement);
                sound.audioElement = audioElement;
                sound.duration = audioElement.duration;
                sound.isReadyToPLay = true;
                _this._initializeAudioElementListeners(sound);
                sound.audioElement.addEventListener('canplaythrough', function () {
                    //console.log('BBBBBBBBBBBB', event, sound);
                    resolve(sound);
                });
                sound.audioElement.addEventListener('error', function () {
                    //console.log('CCCCCCCCCCCC', event, sound);
                    var soundLoadingError = new PlayerError('loading sound failed');
                    reject(soundLoadingError);
                });
            }
            else {
                var noUrlError = new PlayerError('sound has no url', 1);
                reject(noUrlError);
            }
        });
    };
    PlayerCore.prototype._loadSoundUsingRequest = function (sound) {
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
                _this._decodeSound({ sound: sound }).then(function (sound) {
                    resolve(sound);
                }).catch(reject);
            }
            // if the sound has no ArrayBuffer and also no AudioBuffer yet
            if (sound.arrayBuffer === null && sound.audioBuffer === null) {
                // extract the url and codec from sources
                var _a = _this._findBestSource(sound.source), url = _a.url, _b = _a.codec, codec = _b === void 0 ? null : _b;
                sound.url = url;
                sound.codec = codec;
                if (sound.url !== null) {
                    var request = new PlayerRequest();
                    // change buffering state
                    sound.isBuffering = true;
                    request.getArrayBuffer(sound).then(function (arrayBuffer) {
                        sound.arrayBuffer = arrayBuffer;
                        _this._decodeSound({ sound: sound }).then(function (sound) {
                            resolve(sound);
                        }).catch(reject);
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
    PlayerCore.prototype._initializeAudioElementListeners = function (sound) {
        // TODO: use the events to change isReadyToPLay to true? like canplaythrough?
        // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio#Events
        // abort
        // canplaythrough
        // error
        // loadeddata
        // loadstart
        // play
        // playing
        // progress
        // timeupdate
        // volumechange
        // waiting
        // see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/canplaythrough_event
        // TODO: how does canplaythrough behave if the source is a stream?
        sound.audioElement.addEventListener('progress', function () {
            //console.log('AAAAAAAAAAA', event, sound.audioElement.buffered.length, sound.audioElement.duration);
            /*for (let i = 0; i < sound.audioElement.buffered.length; i++) {
                console.log('********buffered', sound.audioElement.buffered.start(i), sound.audioElement.buffered.end(i));
            }*/
            /*if (sound.audioElement.buffered.length > 0
                && !isNaN(sound.audioElement.duration)) {
                    const endBuf = sound.audioElement.buffered.end(0);
                    const soFar = ((endBuf / sound.audioElement.duration) * 100);
                    console.log('********buffered222222 soFar', soFar);
            }*/
            sound.loadingProgress = sound.audioElement.duration;
        });
        sound.audioElement.addEventListener('timeupdate', function () {
            sound.duration = sound.audioElement.duration;
        });
    };
    PlayerCore.prototype._decodeSound = function (_a) {
        var sound = _a.sound;
        var arrayBuffer = sound.arrayBuffer;
        return this._playerAudio.decodeAudio(arrayBuffer).then(function (audioBuffer) {
            sound.audioBuffer = audioBuffer;
            sound.isBuffering = false;
            sound.isBuffered = true;
            sound.audioBufferDate = new Date();
            sound.duration = sound.audioBuffer.duration;
            sound.isReadyToPLay = true;
            return sound;
        }).catch(function (decodeAudioError) {
            throw decodeAudioError;
        });
    };
    PlayerCore.prototype.play = function (_a) {
        var _this = this;
        var _b = _a === void 0 ? {} : _a, whichSound = _b.whichSound, playTimeOffset = _b.playTimeOffset;
        return new Promise(function (resolve, reject) {
            // TODO: check the available codecs and defined sources, play the first one that has matches and available codec
            // TODO: let user define order of preferred codecs for playerback
            // get the current sound if any
            var currentSound = _this._getSoundFromQueue();
            // if there is a sound currently being played, stop the current sound
            if (currentSound !== null && currentSound.state === PlayerSound.SOUND_STATE_PLAYING) {
                _this.stop();
            }
            // whichSound is optional, if set it can be the sound id or if it's a string it can be next / previous / first / last
            var sound = _this._getSoundFromQueue({ whichSound: whichSound });
            // if there is no sound we could play, do nothing
            if (sound === null) {
                throw new Error('no more sounds in array');
            }
            // if the user wants to play the sound from a certain position
            if (playTimeOffset !== undefined) {
                sound.playTimeOffset = playTimeOffset;
            }
            // has the sound already been loaded?
            if (!sound.isReadyToPLay) {
                _this._loadSound(sound).then(function () {
                    _this._play(sound).then(resolve).catch(reject);
                }).catch(reject);
            }
            else {
                _this._play(sound).then(resolve).catch(reject);
            }
        });
    };
    PlayerCore.prototype._play = function (sound) {
        return __awaiter(this, void 0, void 0, function () {
            var volume;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        volume = this._volume;
                        if (this._isMuted) {
                            volume = 0;
                        }
                        this._volume = this._playerAudio.changeVolume({ volume: volume, sound: sound, forceUpdateUserVolume: false });
                        if (!(sound.audioBuffer !== null)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this._playAudioBuffer(sound)];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, this._playMediaElementAudio(sound)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        // state is now playing
                        sound.state = PlayerSound.SOUND_STATE_PLAYING;
                        // the audiocontext time right now (since the audiocontext got created)
                        sound.startTime = sound.getCurrentTime();
                        sound = this._setupSoundEvents(sound);
                        return [2 /*return*/];
                }
            });
        });
    };
    PlayerCore.prototype._playAudioBuffer = function (sound) {
        return __awaiter(this, void 0, void 0, function () {
            var sourceOptions, error_1, audioBufferSourceNode;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(sound.audioBufferSourceNode === null)) return [3 /*break*/, 4];
                        sourceOptions = {
                            loop: sound.loop,
                            onEnded: function (event) {
                                console.log('AudioBufferSourceNode ended', event);
                            }
                        };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this._playerAudio.createAudioBufferSourceNode(sourceOptions, sound)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        throw new PlayerError(error_1);
                    case 4:
                        audioBufferSourceNode = sound.audioBufferSourceNode;
                        // add the buffer to the source node
                        audioBufferSourceNode.buffer = sound.audioBuffer;
                        // connect the source to the graph node(s)
                        this._playerAudio.connectSourceNodeToGraphNodes(audioBufferSourceNode);
                        // start playback
                        // start(when, offset, duration)
                        try {
                            if (sound.playTimeOffset !== undefined) {
                                audioBufferSourceNode.start(0, sound.playTimeOffset);
                            }
                            else {
                                audioBufferSourceNode.start();
                            }
                        }
                        catch (error) {
                            throw new PlayerError(error);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    PlayerCore.prototype._playMediaElementAudio = function (sound) {
        return __awaiter(this, void 0, void 0, function () {
            var sourceOptions, error_2, mediaElementAudioSourceNode;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(sound.mediaElementAudioSourceNode === null)) return [3 /*break*/, 4];
                        sourceOptions = {
                            loop: sound.loop,
                            onEnded: function (event) {
                                console.log('MediaElementSourceNode ended', event);
                            },
                            mediaElement: sound.audioElement
                        };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this._playerAudio.createMediaElementSourceNode(sourceOptions, sound)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        throw new PlayerError(error_2);
                    case 4:
                        mediaElementAudioSourceNode = sound.mediaElementAudioSourceNode;
                        // connect the source to the graph node(s)
                        this._playerAudio.connectSourceNodeToGraphNodes(mediaElementAudioSourceNode);
                        // if an offset is defined use to play from a defined position
                        if (sound.playTimeOffset !== undefined && !isNaN(sound.playTimeOffset)) {
                            // TODO: problem if sound has not loaded until for example 90% but position gets set to 90%
                            // the position will jump back
                            // need to wait for sound to have loaded that part, use events???
                            sound.audioElement.currentTime = sound.playTimeOffset;
                        }
                        try {
                            mediaElementAudioSourceNode.mediaElement.play();
                        }
                        catch (error) {
                            throw new PlayerError(error);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    PlayerCore.prototype._setupSoundEvents = function (sound) {
        var _this = this;
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
            this._playingTimeoutID = window.setInterval(function () {
                _this._playingProgress(sound);
            }, this._playingProgressIntervalTime);
        }
        else {
            this._playingTimeoutID = null;
        }
        return sound;
    };
    PlayerCore.prototype._onEnded = function () {
        // get the current sound if any
        var currentSound = this._getSoundFromQueue();
        // if there is a sound currently being played
        if (currentSound !== null && currentSound.state === PlayerSound.SOUND_STATE_PLAYING) {
            var updateIndex = false;
            var nextSound = this._getSoundFromQueue({ whichSound: 'next', updateIndex: updateIndex });
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
            this._stop(currentSound, PlayerSound.SOUND_STATE_STOPPED);
            if (nextSound !== null) {
                if (this._playNextOnEnded) {
                    this.play({ whichSound: 'next' });
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
    PlayerCore.prototype._getSoundFromQueue = function (_a) {
        var _b = _a === void 0 ? {} : _a, whichSound = _b.whichSound, _c = _b.updateIndex, updateIndex = _c === void 0 ? true : _c;
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
            // if "which sound to play" (soundId) is a numeric ID
            // the case where soundId is a string is handled below
            sound = this._findSoundById({ soundId: whichSound, updateIndex: updateIndex });
        }
        else {
            var soundIndex = null;
            // if which song to play is a constant
            switch (whichSound) {
                case PlayerCore.PLAY_SOUND_NEXT:
                    if (this._queue[this._currentIndex + 1] !== undefined) {
                        soundIndex = this._currentIndex + 1;
                        sound = this._queue[soundIndex];
                    }
                    break;
                case PlayerCore.PLAY_SOUND_PREVIOUS:
                    if (this._queue[this._currentIndex - 1] !== undefined) {
                        soundIndex = this._currentIndex - 1;
                        sound = this._queue[soundIndex];
                    }
                    break;
                case PlayerCore.PLAY_SOUND_FIRST:
                    if (this._queue.length > 0) {
                        soundIndex = 0;
                        sound = this._queue[soundIndex];
                    }
                    break;
                case PlayerCore.PLAY_SOUND_LAST:
                    if (this._queue.length > 0) {
                        soundIndex = this._queue.length - 2;
                        sound = this._queue[soundIndex];
                    }
                    break;
                default:
                    // if "which sound to play" (soundId) is a string
                    sound = this._findSoundById({ soundId: whichSound, updateIndex: updateIndex });
            }
            if (soundIndex !== null && updateIndex) {
                this._currentIndex = soundIndex;
            }
        }
        return sound;
    };
    PlayerCore.prototype._findSoundById = function (_a) {
        var _this = this;
        var soundId = _a.soundId, updateIndex = _a.updateIndex;
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
    PlayerCore.prototype._findBestSource = function (soundSource) {
        var _this = this;
        var bestSource = {
            url: null,
            codec: null
        };
        var sources;
        // if the source is not an array but a single source object
        // we first transform it into an array
        if (!Array.isArray(soundSource)) {
            sources = [soundSource];
        }
        else {
            sources = soundSource;
        }
        sources.forEach(function (source) {
            var soundUrl = '';
            // if the player had as option a baseUrl for sounds add it now
            if (_this._soundsBaseUrl !== '') {
                soundUrl = _this._soundsBaseUrl;
            }
            soundUrl += source.url;
            // check if the codec (if any got specified) is supported
            // by the device
            var isCodecSupported = true;
            if (source.codec !== null) {
                isCodecSupported = _this._checkCodecSupport(source.codec);
            }
            // only if the codec of the source is supported
            if (isCodecSupported)
                if (bestSource.url !== null && source.isPreferred) {
                    // if multiple sources but this one if preferred and if previous
                    // sources also had a supported codec we still overwrite the
                    // previous match
                    bestSource.url = soundUrl;
                    bestSource.codec = source.codec;
                }
                else {
                    // if no best source has been found so far, we don't
                    // care if it's preferred it's automatically chosen
                    // as best
                    bestSource.url = soundUrl;
                    bestSource.codec = source.codec;
                }
        });
        return bestSource;
    };
    PlayerCore.prototype._checkCodecSupport = function (codec) {
        var mediaMimeTypes;
        var error = '';
        switch (codec) {
            case 'ogg':
                mediaMimeTypes = ['audio/ogg; codecs="vorbis"'];
                break;
            case 'oga':
                mediaMimeTypes = ['audio/ogg; codecs="vorbis"'];
                break;
            case 'mp3':
                mediaMimeTypes = ['audio/mpeg; codecs="mp3"'];
                break;
            case 'opus':
                mediaMimeTypes = ['audio/ogg; codecs="opus"', 'audio/webm; codecs="opus"'];
                break;
            case 'wav':
                mediaMimeTypes = ['audio/wav; codecs="1"'];
                break;
            case 'm4a':
                mediaMimeTypes = ['audio/m4a;', 'audio/x-m4a;'];
                break;
            case 'm4p':
                mediaMimeTypes = ['audio/m4p;', 'audio/x-m4p;'];
                break;
            case 'caf':
                mediaMimeTypes = ['audio/x-caf;'];
                break;
            case 'aac':
                mediaMimeTypes = ['audio/aac;'];
                break;
            case 'weba':
            case 'webm':
                mediaMimeTypes = ['audio/webm; codecs="vorbis"'];
                break;
            case 'flac':
                mediaMimeTypes = ['audio/flac;', 'audio/x-flac;'];
                break;
            default:
                error = 'unrecognised codec';
                break;
        }
        if (error) {
            throw new PlayerError(error);
        }
        return this._checkMimeTypesSupport(mediaMimeTypes);
    };
    PlayerCore.prototype._checkMimeTypesSupport = function (mediaMimeTypes) {
        var deviceAudio = new Audio();
        var isSupported = false;
        mediaMimeTypes.forEach(function (mediaMimeType) {
            var isMediaTypeSupported = deviceAudio.canPlayType(mediaMimeType).replace(/^no$/, '');
            if (isMediaTypeSupported) {
                isSupported = true;
            }
        });
        return isSupported;
    };
    PlayerCore.prototype.pause = function () {
        // get the current sound
        var sound = this._getSoundFromQueue();
        if (sound === null) {
            return;
        }
        if (sound.state === PlayerSound.SOUND_STATE_PAUSED) {
            // TODO: just return or throw an error
            return;
        }
        var timeAtPause = sound.getCurrentTime();
        sound.playTimeOffset += timeAtPause - sound.startTime;
        // trigger paused event
        if (sound.onPaused !== null) {
            sound.onPaused(sound.playTimeOffset);
        }
        // using stop here as even if it is a pause you can't call play again
        // re-using an audio buffer source node is not allowed, so no matter what
        // we will have to create a new one
        this._stop(sound, PlayerSound.SOUND_STATE_PAUSED);
    };
    PlayerCore.prototype.stop = function () {
        // get the current sound
        var sound = this._getSoundFromQueue();
        if (sound === null) {
            return;
        }
        if (sound.state === PlayerSound.SOUND_STATE_STOPPED) {
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
        this._stop(sound, PlayerSound.SOUND_STATE_STOPPED);
    };
    PlayerCore.prototype._stop = function (sound, soundState) {
        // tell the source node to stop playing
        if (sound.audioBufferSourceNode !== null) {
            // to stop playing if using the AudioBufferSourceNode use the stop method
            sound.audioBufferSourceNode.stop(0);
        }
        else if (sound.mediaElementAudioSourceNode !== null) {
            // to stop playing if using the MediaElementAudioSourceNode use the pause method
            sound.mediaElementAudioSourceNode.mediaElement.pause();
        }
        else {
            throw new PlayerError('can\'t stop as no source node in sound');
        }
        // destroy the audio buffer source node as it can anyway only get used once
        this._playerAudio.destroySourceNode(sound);
        // state is now stopped
        sound.state = soundState;
        if (this._playingTimeoutID !== null) {
            // clear the playing progress setInterval
            clearInterval(this._playingTimeoutID);
        }
    };
    PlayerCore.prototype.next = function () {
        // alias for play next
        this.play({ whichSound: 'next' });
    };
    PlayerCore.prototype.previous = function () {
        // alias for play previous
        this.play({ whichSound: 'previous' });
    };
    PlayerCore.prototype.first = function () {
        // alias for play first
        this.play({ whichSound: 'first' });
    };
    PlayerCore.prototype.last = function () {
        // alias for play last
        this.play({ whichSound: 'last' });
    };
    PlayerCore.prototype._playingProgress = function (sound) {
        var timeNow = sound.getCurrentTime();
        sound.playTime = (timeNow - sound.startTime) + sound.playTimeOffset;
        var duration = sound.getDuration();
        var playingPercentage = (sound.playTime / duration) * 100;
        sound.playedTimePercentage = playingPercentage;
        sound.onPlaying(playingPercentage, duration, sound.playTime);
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
    PlayerCore.prototype.setVisibilityAutoMute = function (visibilityAutoMute) {
        this._visibilityAutoMute = visibilityAutoMute;
        if (visibilityAutoMute) {
            document.addEventListener('visibilitychange', this._handleVisibilityChange.bind(this), false);
        }
        else {
            document.removeEventListener('visibilitychange', this._handleVisibilityChange.bind(this), false);
        }
    };
    PlayerCore.prototype.getVisibilityAutoMute = function () {
        return this._visibilityAutoMute;
    };
    PlayerCore.prototype._handleVisibilityChange = function () {
        var hiddenKeyword;
        if (typeof document.hidden !== 'undefined') { // Opera 12.10 and Firefox 18 and later support
            hiddenKeyword = 'hidden';
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }
        else if (typeof document.msHidden !== 'undefined') {
            hiddenKeyword = 'msHidden';
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }
        else if (typeof document.webkitHidden !== 'undefined') {
            hiddenKeyword = 'webkitHidden';
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (document[hiddenKeyword]) {
            this.mute();
        }
        else {
            this.unMute();
        }
    };
    // constants
    PlayerCore.WHERE_IN_QUEUE_AT_END = 'append';
    PlayerCore.WHERE_IN_QUEUE_AT_START = 'prepend';
    PlayerCore.WHERE_IN_QUEUE_AFTER_CURRENT = 'afterCurrent';
    PlayerCore.PLAY_SOUND_NEXT = 'next';
    PlayerCore.PLAY_SOUND_PREVIOUS = 'previous';
    PlayerCore.PLAY_SOUND_FIRST = 'first';
    PlayerCore.PLAY_SOUND_LAST = 'last';
    PlayerCore.PLAYER_MODE_AUDIO = 'player_mode_audio';
    PlayerCore.PLAYER_MODE_AJAX = 'player_mode_ajax';
    PlayerCore.PLAYER_MODE_FETCH = 'player_mode_fetch';
    return PlayerCore;
}());

export { PlayerCore, PlayerSound };
//# sourceMappingURL=index.js.map

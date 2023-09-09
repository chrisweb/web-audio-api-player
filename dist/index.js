/******************************************************************************
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
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
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
var PlayerSound = (function () {
    function PlayerSound(soundAttributes) {
        this.url = null;
        this.codec = null;
        this.sourceNode = null;
        this.gainNode = null;
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
        if (!Array.isArray(soundAttributes.source)) {
            this.source = [soundAttributes.source];
        }
        else {
            this.source = soundAttributes.source;
        }
        if (typeof soundAttributes.id !== 'undefined') {
            this.id = soundAttributes.id;
        }
        else {
            this.id = this._generateSoundId();
        }
        this.loop = soundAttributes.loop || false;
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
        if (soundAttributes.arrayBuffer instanceof ArrayBuffer) {
            this.arrayBuffer = soundAttributes.arrayBuffer;
        }
        if (soundAttributes.audioBuffer instanceof AudioBuffer) {
            this.audioBuffer = soundAttributes.audioBuffer;
            this.isBuffering = false;
            this.isBuffered = true;
            this.audioBufferDate = new Date();
            this.duration = this.getDuration();
        }
    }
    PlayerSound.prototype.getCurrentTime = function () {
        var currentTime;
        if (this.sourceNode !== null) {
            if (this.sourceNode instanceof AudioBufferSourceNode) {
                currentTime = this.sourceNode.context.currentTime;
            }
            else if (this.sourceNode instanceof MediaElementAudioSourceNode) {
                currentTime = this.audioElement.currentTime;
            }
        }
        return currentTime;
    };
    PlayerSound.prototype.getDuration = function () {
        var duration;
        if (this.sourceNode !== null) {
            if (this.sourceNode instanceof AudioBufferSourceNode) {
                duration = this.sourceNode.buffer.duration;
            }
            else if (this.sourceNode instanceof MediaElementAudioSourceNode) {
                duration = this.audioElement.duration;
            }
        }
        return duration;
    };
    PlayerSound.prototype._generateSoundId = function () {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    };
    PlayerSound.SOUND_STATE_STOPPED = 'sound_state_stopped';
    PlayerSound.SOUND_STATE_PAUSED = 'sound_state_paused';
    PlayerSound.SOUND_STATE_PLAYING = 'sound_state_playing';
    return PlayerSound;
}());

var PlayerError = (function (_super) {
    __extends(PlayerError, _super);
    function PlayerError(message, code) {
        var _this = _super.call(this, message) || this;
        _this.code = code || null;
        Object.setPrototypeOf(_this, PlayerError.prototype);
        return _this;
    }
    return PlayerError;
}(Error));

var PlayerAudio = (function () {
    function PlayerAudio(options) {
        this._audioContext = null;
        this._volume = null;
        this._audioNodes = {
            gainNode: null,
        };
        this._options = options;
        this._initialize();
    }
    PlayerAudio.prototype._initialize = function () {
        if (this._options.createAudioContextOnFirstUserInteraction) {
            this._addAutoCreateAudioContextOnFirstUserInteractionEventListeners();
        }
    };
    PlayerAudio.prototype.decodeAudio = function (arrayBuffer) {
        return __awaiter(this, void 0, void 0, function () {
            var audioContext, audioBufferPromise;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.getAudioContext()];
                    case 1:
                        audioContext = _a.sent();
                        return [4, audioContext.decodeAudioData(arrayBuffer)];
                    case 2:
                        audioBufferPromise = _a.sent();
                        return [2, Promise.resolve(audioBufferPromise)];
                }
            });
        });
    };
    PlayerAudio.prototype._createAudioContext = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this._audioContext instanceof AudioContext) {
                resolve();
            }
            var WebAudioContext = window.AudioContext || window.webkitAudioContext;
            try {
                if (_this._options.audioContext !== null) {
                    _this._audioContext = _this._options.audioContext;
                }
                else {
                    _this._audioContext = new WebAudioContext();
                }
                resolve();
            }
            catch (error) {
                reject(error);
            }
        });
    };
    PlayerAudio.prototype._addAutoCreateAudioContextOnFirstUserInteractionEventListeners = function () {
        if (this._options.createAudioContextOnFirstUserInteraction) {
            document.addEventListener('touchstart', this.getAudioContext.bind(this));
            document.addEventListener('touchend', this.getAudioContext.bind(this));
            document.addEventListener('mousedown', this.getAudioContext.bind(this));
        }
    };
    PlayerAudio.prototype._removeAutoCreateAudioContextOnFirstUserInteractionEventListeners = function () {
        if (this._options.createAudioContextOnFirstUserInteraction) {
            document.removeEventListener('touchstart', this.getAudioContext.bind(this));
            document.removeEventListener('touchend', this.getAudioContext.bind(this));
            document.removeEventListener('mousedown', this.getAudioContext.bind(this));
        }
    };
    PlayerAudio.prototype.getAudioContext = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this._audioContext === null)) return [3, 2];
                        return [4, this._createAudioContext()];
                    case 1:
                        _a.sent();
                        return [3, 4];
                    case 2:
                        if (!(this._audioContext.state === 'suspended')) return [3, 4];
                        return [4, this._unfreezeAudioContext()];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2, this._audioContext];
                }
            });
        });
    };
    PlayerAudio.prototype._unfreezeAudioContext = function () {
        if (typeof this._audioContext.suspend === 'undefined') {
            return Promise.resolve();
        }
        else {
            return this._audioContext.resume();
        }
    };
    PlayerAudio.prototype.freezeAudioContext = function () {
        if (typeof this._audioContext.suspend === 'undefined') {
            return Promise.resolve();
        }
        else {
            return this._audioContext.suspend();
        }
    };
    PlayerAudio.prototype.detectAudioContextSupport = function () {
        var audioContextSupported = false;
        if (typeof window.webkitAudioContext !== 'undefined') {
            audioContextSupported = true;
        }
        else if (typeof AudioContext !== 'undefined') {
            audioContextSupported = true;
        }
        return audioContextSupported;
    };
    PlayerAudio.prototype.detectAudioElementSupport = function () {
        return !!document.createElement('audio').canPlayType;
    };
    PlayerAudio.prototype.shutDown = function (songsQueue) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this._removeAutoCreateAudioContextOnFirstUserInteractionEventListeners();
                        songsQueue.forEach(function (sound) {
                            if (sound.sourceNode instanceof MediaElementAudioSourceNode) {
                                if (typeof sound.sourceNode.mediaElement !== 'undefined') {
                                    sound.sourceNode.mediaElement.remove();
                                }
                            }
                            else if (sound.sourceNode instanceof AudioBufferSourceNode) ;
                        });
                        this._disconnectPlayerGainNode();
                        return [4, this._destroyAudioContext()];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        });
    };
    PlayerAudio.prototype._destroyAudioContext = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this._audioContext !== null)) return [3, 2];
                        return [4, this._audioContext.close()];
                    case 1:
                        _a.sent();
                        this._audioContext = null;
                        _a.label = 2;
                    case 2: return [2];
                }
            });
        });
    };
    PlayerAudio.prototype.createAudioBufferSourceNode = function (audioBufferSourceOptions, sound) {
        return __awaiter(this, void 0, void 0, function () {
            var audioContext, audioBufferSourceNode;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.getAudioContext()];
                    case 1:
                        audioContext = _a.sent();
                        audioBufferSourceNode = audioContext.createBufferSource();
                        sound.sourceNode = audioBufferSourceNode;
                        audioBufferSourceNode.loop = audioBufferSourceOptions.loop;
                        sound.gainNode = audioBufferSourceNode.context.createGain();
                        sound.gainNode.gain.value = 1;
                        audioBufferSourceNode.connect(sound.gainNode);
                        audioBufferSourceNode.onended = function (event) {
                            audioBufferSourceOptions.onSourceNodeEnded(event);
                        };
                        return [2];
                }
            });
        });
    };
    PlayerAudio.prototype.createMediaElementSourceNode = function (sourceNodeOptions, sound) {
        return __awaiter(this, void 0, void 0, function () {
            var mediaElementAudioSourceNode, audioContext;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(sound.sourceNode === null)) return [3, 2];
                        return [4, this.getAudioContext()];
                    case 1:
                        audioContext = _a.sent();
                        try {
                            mediaElementAudioSourceNode = audioContext.createMediaElementSource(sourceNodeOptions.mediaElement);
                        }
                        catch (error) {
                            throw new PlayerError(error);
                        }
                        mediaElementAudioSourceNode.mediaElement.loop = sourceNodeOptions.loop;
                        sound.gainNode = mediaElementAudioSourceNode.context.createGain();
                        sound.gainNode.gain.value = 1;
                        mediaElementAudioSourceNode.connect(sound.gainNode);
                        mediaElementAudioSourceNode.mediaElement.onended = function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                sourceNodeOptions.onSourceNodeEnded();
                                return [2];
                            });
                        }); };
                        sound.sourceNode = mediaElementAudioSourceNode;
                        _a.label = 2;
                    case 2: return [2];
                }
            });
        });
    };
    PlayerAudio.prototype._getPlayerGainNode = function () {
        return __awaiter(this, void 0, void 0, function () {
            var gainNode, audioContext;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this._audioNodes.gainNode instanceof GainNode)) return [3, 1];
                        gainNode = this._audioNodes.gainNode;
                        return [3, 3];
                    case 1: return [4, this.getAudioContext()];
                    case 2:
                        audioContext = _a.sent();
                        gainNode = audioContext.createGain();
                        gainNode.connect(audioContext.destination);
                        this._audioNodes.gainNode = gainNode;
                        _a.label = 3;
                    case 3:
                        this._initializeVolume();
                        return [2, gainNode];
                }
            });
        });
    };
    PlayerAudio.prototype._disconnectPlayerGainNode = function () {
        this._audioNodes.gainNode.disconnect();
        this._audioNodes.gainNode = null;
    };
    PlayerAudio.prototype.connectSound = function (sound) {
        return __awaiter(this, void 0, void 0, function () {
            var playerGainNode, soundGainNode;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this._getPlayerGainNode()];
                    case 1:
                        playerGainNode = _a.sent();
                        soundGainNode = sound.gainNode;
                        if (soundGainNode !== null) {
                            soundGainNode.connect(playerGainNode);
                        }
                        return [2];
                }
            });
        });
    };
    PlayerAudio.prototype.disconnectSound = function (sound) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (sound.gainNode !== null) ;
                else {
                    throw new PlayerError('can\'t destroy as no source node in sound');
                }
                if (sound.sourceNode instanceof AudioBufferSourceNode) {
                    sound.sourceNode = null;
                }
                return [2];
            });
        });
    };
    PlayerAudio.prototype._changePlayerGainValue = function (gainValue) {
        if (this._audioNodes.gainNode instanceof GainNode) {
            this._audioNodes.gainNode.gain.value = gainValue;
        }
    };
    PlayerAudio.prototype._roundGainTwoDecimals = function (rawGainValue) {
        return Math.round((rawGainValue + Number.EPSILON) * 100) / 100;
    };
    PlayerAudio.prototype.setVolume = function (volume, forceUpdateUserVolume) {
        if (forceUpdateUserVolume === void 0) { forceUpdateUserVolume = true; }
        if (this._options.persistVolume && forceUpdateUserVolume) {
            localStorage.setItem('WebAudioAPIPlayerVolume', volume.toString());
        }
        var gainValue = volume / 100;
        if (this._audioNodes.gainNode instanceof GainNode) {
            var roundedGain = this._roundGainTwoDecimals(this._audioNodes.gainNode.gain.value);
            if (roundedGain !== this._volume) {
                this._changePlayerGainValue(gainValue);
            }
        }
        this._volume = volume;
    };
    PlayerAudio.prototype.getVolume = function () {
        var volume;
        if (this._volume !== null) {
            volume = this._volume;
        }
        else {
            if (this._options.persistVolume) {
                var userVolumeInPercent = parseInt(localStorage.getItem('WebAudioAPIPlayerVolume'));
                if (!isNaN(userVolumeInPercent)) {
                    volume = userVolumeInPercent;
                }
            }
            if (typeof volume === 'undefined') {
                volume = this._options.volume;
            }
        }
        return volume;
    };
    PlayerAudio.prototype._initializeVolume = function () {
        if (this._options.persistVolume) {
            var userVolumeInPercent = parseInt(localStorage.getItem('WebAudioAPIPlayerVolume'));
            if (!isNaN(userVolumeInPercent)) {
                this.setVolume(userVolumeInPercent, false);
            }
        }
        if (this._volume === null) {
            this.setVolume(this._options.volume, false);
        }
    };
    return PlayerAudio;
}());

var PlayerRequest = (function () {
    function PlayerRequest() {
    }
    PlayerRequest.prototype.getArrayBuffer = function (requested) {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', requested.url, true);
            xhr.responseType = 'arraybuffer';
            xhr.onload = function () {
                if (xhr.status === 200) {
                    resolve(xhr.response);
                }
                else {
                    reject(new PlayerError(xhr.statusText, xhr.status));
                }
            };
            xhr.onprogress = function (event) {
                var percentage = 100 / (event.total / event.loaded);
                requested.loadingProgress = percentage;
                if (requested.onLoading !== null) {
                    requested.onLoading(percentage, event.total, event.loaded);
                }
            };
            xhr.onerror = function () {
                reject(new PlayerError('xhr network error'));
            };
            xhr.send();
        });
    };
    return PlayerRequest;
}());

var PLAYER_MODE_AUDIO = 'player_mode_audio';
var WHERE_IN_QUEUE_AT_END = 'append';
var PlayerCore = (function () {
    function PlayerCore(playerOptions) {
        var _this = this;
        if (playerOptions === void 0) { playerOptions = {}; }
        this._playingProgressRequestId = null;
        this._playingProgressPreviousTimestamp = 0;
        this._progressTrigger = function (sound, timestamp) {
            if ((timestamp - _this._playingProgressPreviousTimestamp) >= _this._options.playingProgressIntervalTime) {
                _this._playingProgress(sound);
                _this._playingProgressPreviousTimestamp = timestamp;
            }
            _this._playingProgressRequestId = window.requestAnimationFrame(function (timestamp) {
                _this._progressTrigger(sound, timestamp);
            });
        };
        var defaultOptions = {
            volume: 80,
            loopQueue: false,
            loopSong: false,
            soundsBaseUrl: '',
            playingProgressIntervalTime: 200,
            playNextOnEnded: true,
            stopOnReset: true,
            visibilityAutoMute: false,
            createAudioContextOnFirstUserInteraction: true,
            persistVolume: true,
            loadPlayerMode: PLAYER_MODE_AUDIO,
            audioContext: null,
        };
        var options = Object.assign({}, defaultOptions, playerOptions);
        this._queue = [];
        this._currentIndex = null;
        this._options = options;
        this._initialize();
    }
    PlayerCore.prototype._initialize = function () {
        var audioOptions = this._audioOptions();
        this._playerAudio = new PlayerAudio(audioOptions);
        switch (this._options.loadPlayerMode) {
            case PlayerCore.PLAYER_MODE_AUDIO:
                if (!this._playerAudio.detectAudioContextSupport()) {
                    throw new PlayerError('audio context is not supported by this device');
                }
                if (!this._playerAudio.detectAudioElementSupport()) {
                    throw new PlayerError('audio element is not supported by this device');
                }
                break;
            case PlayerCore.PLAYER_MODE_AJAX:
                if (!this._playerAudio.detectAudioContextSupport()) {
                    throw new PlayerError('audio context is not supported by this device');
                }
                break;
        }
    };
    PlayerCore.prototype._audioOptions = function () {
        var audioOptions = {
            audioContext: this._options.audioContext,
            createAudioContextOnFirstUserInteraction: this._options.createAudioContextOnFirstUserInteraction,
            volume: this._options.volume,
            persistVolume: this._options.persistVolume,
        };
        return audioOptions;
    };
    PlayerCore.prototype.addSoundToQueue = function (_a) {
        var soundAttributes = _a.soundAttributes, _b = _a.whereInQueue, whereInQueue = _b === void 0 ? WHERE_IN_QUEUE_AT_END : _b;
        var sound = new PlayerSound(soundAttributes);
        switch (whereInQueue) {
            case PlayerCore.WHERE_IN_QUEUE_AT_END:
                this._appendSoundToQueue(sound);
                break;
            case PlayerCore.WHERE_IN_QUEUE_AT_START:
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
    PlayerCore.prototype.resetQueue = function () {
        if (this._options.stopOnReset) {
            this.stop();
        }
        this._queue = [];
    };
    PlayerCore.prototype.reset = function () {
        this.resetQueue();
    };
    PlayerCore.prototype.getQueue = function () {
        return this._queue;
    };
    PlayerCore.prototype.setVolume = function (volume) {
        this._playerAudio.setVolume(volume);
    };
    PlayerCore.prototype.getVolume = function () {
        return this._playerAudio.getVolume();
    };
    PlayerCore.prototype.setLoopQueue = function (loppQueue) {
        this._options.loopQueue = loppQueue;
    };
    PlayerCore.prototype.getLoopQueue = function () {
        return this._options.loopQueue;
    };
    PlayerCore.prototype.mute = function () {
        var currentVolume = this.getVolume();
        this._postMuteVolume = currentVolume;
        this._playerAudio.setVolume(0, false);
    };
    PlayerCore.prototype.unMute = function () {
        this._playerAudio.setVolume(this._postMuteVolume, false);
        this._postMuteVolume = null;
    };
    PlayerCore.prototype.isMuted = function () {
        return this._postMuteVolume === null ? true : false;
    };
    PlayerCore.prototype.setPosition = function (soundPositionInPercent) {
        var _this = this;
        var currentSound = this._getSoundFromQueue({ whichSound: PlayerCore.CURRENT_SOUND });
        if (currentSound !== null) {
            if (currentSound.duration === null || isNaN(currentSound.duration)) {
                this._loadSound(currentSound)
                    .then(function (sound) {
                    var soundPositionInSeconds = (sound.duration / 100) * soundPositionInPercent;
                    _this.setPositionInSeconds(soundPositionInSeconds);
                }).catch(function (error) {
                    throw error;
                });
            }
            else {
                var soundPositionInSeconds = (currentSound.duration / 100) * soundPositionInPercent;
                this.setPositionInSeconds(soundPositionInSeconds);
            }
        }
    };
    PlayerCore.prototype.setPositionInSeconds = function (soundPositionInSeconds) {
        var currentSound = this._getSoundFromQueue({ whichSound: PlayerCore.CURRENT_SOUND });
        if (currentSound !== null) {
            if (currentSound.state === PlayerSound.SOUND_STATE_PLAYING) {
                this.play({ whichSound: currentSound.id, playTimeOffset: soundPositionInSeconds });
            }
            else {
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
        switch (this._options.loadPlayerMode) {
            case PlayerCore.PLAYER_MODE_AUDIO:
                loadSoundPromise = this._loadSoundUsingAudioElement(sound);
                break;
            case PlayerCore.PLAYER_MODE_AJAX:
                loadSoundPromise = this._loadSoundUsingRequest(sound);
                break;
            case PlayerCore.PLAYER_MODE_FETCH:
                notImplementedError = new PlayerError(PlayerCore.PLAYER_MODE_FETCH + ' is not implemented yet', 1);
                loadSoundPromise = Promise.reject(notImplementedError);
                break;
        }
        return loadSoundPromise;
    };
    PlayerCore.prototype._loadSoundUsingAudioElement = function (sound) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var _a = _this._findBestSource(sound.source), url = _a.url, _b = _a.codec, codec = _b === void 0 ? null : _b;
            sound.url = url;
            sound.codec = codec;
            sound.arrayBuffer = null;
            if (sound.url !== null) {
                var audioElement_1 = new Audio();
                audioElement_1.crossOrigin = 'anonymous';
                audioElement_1.src = sound.url;
                audioElement_1.controls = false;
                audioElement_1.autoplay = false;
                audioElement_1.id = 'web_audio_api_player_sound_' + sound.id.toString();
                document.body.appendChild(audioElement_1);
                sound.audioElement = audioElement_1;
                sound.isReadyToPLay = true;
                _this._initializeAudioElementListeners(sound);
                var canplaythroughListener_1 = function () {
                    sound.audioElement.removeEventListener('canplaythrough', canplaythroughListener_1);
                    if (!isNaN(audioElement_1.duration)) {
                        sound.duration = audioElement_1.duration;
                    }
                    resolve(sound);
                };
                sound.audioElement.addEventListener('canplaythrough', canplaythroughListener_1);
                var errorListener_1 = function () {
                    sound.audioElement.removeEventListener('error', errorListener_1);
                    var soundLoadingError = new PlayerError('loading sound failed');
                    reject(soundLoadingError);
                };
                sound.audioElement.addEventListener('error', errorListener_1);
            }
            else {
                var noUrlError = new PlayerError('sound has no url', 1);
                reject(noUrlError);
            }
        });
    };
    PlayerCore.prototype._loadSoundUsingRequest = function (sound) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var _a = _this._findBestSource(sound.source), url = _a.url, _b = _a.codec, codec = _b === void 0 ? null : _b;
            sound.url = url;
            sound.codec = codec;
            if (sound.url !== null) {
                var request = new PlayerRequest();
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
        });
    };
    PlayerCore.prototype._initializeAudioElementListeners = function (sound) {
        sound.audioElement.addEventListener('progress', function () {
            sound.loadingProgress = sound.audioElement.duration;
        });
        sound.audioElement.addEventListener('timeupdate', function () {
            sound.duration = sound.audioElement.duration;
        });
    };
    PlayerCore.prototype._decodeSound = function (_a) {
        var sound = _a.sound;
        return this._playerAudio.decodeAudio(sound.arrayBuffer).then(function (audioBuffer) {
            sound.audioBuffer = audioBuffer;
            sound.isBuffering = false;
            sound.isBuffered = true;
            sound.audioBufferDate = new Date();
            sound.duration = audioBuffer.duration;
            sound.isReadyToPLay = true;
            return sound;
        }).catch(function (decodeAudioError) {
            throw decodeAudioError;
        });
    };
    PlayerCore.prototype._cloneAudioBuffer = function (fromAudioBuffer) {
        var audioBuffer = new AudioBuffer({
            length: fromAudioBuffer.length,
            numberOfChannels: fromAudioBuffer.numberOfChannels,
            sampleRate: fromAudioBuffer.sampleRate
        });
        for (var channelI = 0; channelI < audioBuffer.numberOfChannels; ++channelI) {
            var samples = fromAudioBuffer.getChannelData(channelI);
            audioBuffer.copyToChannel(samples, channelI);
        }
        return audioBuffer;
    };
    PlayerCore.prototype.play = function (_a) {
        var _this = this;
        var _b = _a === void 0 ? {} : _a, whichSound = _b.whichSound, playTimeOffset = _b.playTimeOffset;
        return new Promise(function (resolve, reject) {
            var currentSound = _this._getSoundFromQueue({ whichSound: PlayerCore.CURRENT_SOUND });
            var sound = _this._getSoundFromQueue({ whichSound: whichSound, updateIndex: true });
            if (sound === null) {
                throw new Error('no more sounds in array');
            }
            if (currentSound !== null
                && (currentSound.state === PlayerSound.SOUND_STATE_PLAYING || currentSound.state === PlayerSound.SOUND_STATE_PAUSED)
                && (currentSound.id !== sound.id)) {
                _this._stop(currentSound, PlayerSound.SOUND_STATE_STOPPED);
            }
            if (currentSound !== null
                && (currentSound.state === PlayerSound.SOUND_STATE_PLAYING)
                && (currentSound.id === sound.id)) {
                _this._stop(currentSound, PlayerSound.SOUND_STATE_PAUSED);
            }
            if (currentSound === null || (currentSound !== null && (currentSound.id !== sound.id))) {
                sound.firstTimePlayed = true;
            }
            else {
                sound.firstTimePlayed = false;
            }
            if (playTimeOffset !== undefined) {
                sound.playTimeOffset = playTimeOffset;
            }
            if (!sound.isReadyToPLay) {
                _this._loadSound(sound).then(function () {
                    _this._play(sound).then(resolve).catch(reject);
                }).catch(reject);
            }
            else {
                if (sound.audioBuffer !== null) {
                    sound.audioBuffer = _this._cloneAudioBuffer(sound.audioBuffer);
                }
                _this._play(sound).then(resolve).catch(reject);
            }
        });
    };
    PlayerCore.prototype._play = function (sound) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(sound.audioBuffer !== null)) return [3, 2];
                        return [4, this._playAudioBuffer(sound)];
                    case 1:
                        _a.sent();
                        return [3, 4];
                    case 2: return [4, this._playMediaElementAudio(sound)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        sound.state = PlayerSound.SOUND_STATE_PLAYING;
                        sound.startTime = sound.getCurrentTime();
                        sound = this._triggerSoundCallbacks(sound);
                        return [2];
                }
            });
        });
    };
    PlayerCore.prototype._playAudioBuffer = function (sound) {
        return __awaiter(this, void 0, void 0, function () {
            var sourceOptions, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(sound.sourceNode === null)) return [3, 4];
                        sourceOptions = {
                            loop: sound.loop,
                            onSourceNodeEnded: function () {
                                _this._onEnded();
                            }
                        };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4, this._playerAudio.createAudioBufferSourceNode(sourceOptions, sound)];
                    case 2:
                        _a.sent();
                        return [3, 4];
                    case 3:
                        error_1 = _a.sent();
                        throw new PlayerError(error_1);
                    case 4:
                        if (!(sound.sourceNode instanceof AudioBufferSourceNode)) return [3, 6];
                        sound.sourceNode.buffer = sound.audioBuffer;
                        return [4, this._playerAudio.connectSound(sound)];
                    case 5:
                        _a.sent();
                        try {
                            if (sound.playTimeOffset !== undefined) {
                                sound.sourceNode.start(0, sound.playTimeOffset);
                            }
                            else {
                                sound.sourceNode.start();
                            }
                        }
                        catch (error) {
                            throw new PlayerError(error);
                        }
                        _a.label = 6;
                    case 6: return [2];
                }
            });
        });
    };
    PlayerCore.prototype._playMediaElementAudio = function (sound) {
        return __awaiter(this, void 0, void 0, function () {
            var sourceOptions, error_2;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(sound.sourceNode === null)) return [3, 4];
                        sourceOptions = {
                            loop: sound.loop,
                            onSourceNodeEnded: function () {
                                _this._onEnded();
                            },
                            mediaElement: sound.audioElement
                        };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4, this._playerAudio.createMediaElementSourceNode(sourceOptions, sound)];
                    case 2:
                        _a.sent();
                        return [3, 4];
                    case 3:
                        error_2 = _a.sent();
                        throw new PlayerError(error_2);
                    case 4:
                        if (!(sound.sourceNode instanceof MediaElementAudioSourceNode)) return [3, 6];
                        return [4, this._playerAudio.connectSound(sound)];
                    case 5:
                        _a.sent();
                        if (sound.playTimeOffset !== undefined && !isNaN(sound.playTimeOffset)) {
                            sound.audioElement.currentTime = sound.playTimeOffset;
                        }
                        try {
                            sound.sourceNode.mediaElement.play();
                        }
                        catch (error) {
                            throw new PlayerError(error);
                        }
                        _a.label = 6;
                    case 6: return [2];
                }
            });
        });
    };
    PlayerCore.prototype._triggerSoundCallbacks = function (sound) {
        var _this = this;
        if (sound.onResumed !== null && !sound.firstTimePlayed) {
            sound.onResumed(sound.playTimeOffset);
        }
        if (sound.onStarted !== null && sound.firstTimePlayed) {
            sound.onStarted(sound.playTimeOffset);
        }
        if (sound.onPlaying !== null) {
            this._playingProgressRequestId = window.requestAnimationFrame(function (timestamp) {
                _this._progressTrigger(sound, timestamp);
            });
        }
        else {
            this._playingProgressRequestId = null;
        }
        return sound;
    };
    PlayerCore.prototype._onEnded = function () {
        var currentSound = this._getSoundFromQueue({ whichSound: PlayerCore.CURRENT_SOUND });
        if (currentSound !== null && currentSound.state === PlayerSound.SOUND_STATE_PLAYING) {
            var nextSound = this._getSoundFromQueue({ whichSound: PlayerCore.PLAY_SOUND_NEXT, updateIndex: true });
            if (currentSound.onEnded !== null) {
                var willPlayNext = false;
                if (nextSound !== null && this._options.playNextOnEnded) {
                    willPlayNext = true;
                }
                if (this._options.loopQueue) {
                    willPlayNext = true;
                }
                if (!willPlayNext) {
                    this._playerAudio.freezeAudioContext();
                }
                currentSound.onEnded(willPlayNext);
            }
            currentSound.firstTimePlayed = true;
            currentSound.playTimeOffset = 0;
            this._stop(currentSound, PlayerSound.SOUND_STATE_STOPPED);
            if (nextSound !== null) {
                if (this._options.playNextOnEnded) {
                    this.play({ whichSound: PlayerCore.PLAY_SOUND_NEXT });
                }
            }
            else {
                this._currentIndex = 0;
                if (this._options.loopQueue) {
                    this.play();
                }
            }
        }
    };
    PlayerCore.prototype._getSoundFromQueue = function (_a) {
        var _b;
        var _c = _a === void 0 ? {} : _a, whichSound = _c.whichSound, _d = _c.updateIndex, updateIndex = _d === void 0 ? false : _d;
        var sound = null;
        var soundIndex = null;
        if (this._queue.length === 0) {
            return sound;
        }
        if (whichSound === undefined) {
            soundIndex = 0;
            if (this._currentIndex !== null) {
                soundIndex = this._currentIndex;
            }
            sound = this._queue[soundIndex];
        }
        else {
            switch (whichSound) {
                case PlayerCore.CURRENT_SOUND:
                    if (this._currentIndex !== null) {
                        sound = this._queue[this._currentIndex];
                    }
                    break;
                case PlayerCore.PLAY_SOUND_NEXT:
                    if (this._queue[this._currentIndex + 1] !== undefined) {
                        soundIndex = this._currentIndex + 1;
                        sound = this._queue[soundIndex];
                    }
                    else if (this._options.loopQueue) {
                        soundIndex = 0;
                        sound = this._queue[soundIndex];
                    }
                    break;
                case PlayerCore.PLAY_SOUND_PREVIOUS:
                    if (this._queue[this._currentIndex - 1] !== undefined) {
                        soundIndex = this._currentIndex - 1;
                        sound = this._queue[soundIndex];
                    }
                    else if (this._options.loopQueue) {
                        soundIndex = this._queue.length - 1;
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
                        soundIndex = this._queue.length - 1;
                        sound = this._queue[soundIndex];
                    }
                    break;
                default:
                    _b = this._findSoundById({ soundId: whichSound }), sound = _b[0], soundIndex = _b[1];
            }
        }
        if (soundIndex !== null && updateIndex) {
            this._currentIndex = soundIndex;
        }
        return sound;
    };
    PlayerCore.prototype._findSoundById = function (_a) {
        var soundId = _a.soundId;
        var sound = null;
        var soundIndex = 0;
        this._queue.some(function (soundFromQueue, index) {
            if (soundFromQueue.id === soundId) {
                sound = soundFromQueue;
                soundIndex = index;
                return true;
            }
        });
        return [sound, soundIndex];
    };
    PlayerCore.prototype._findBestSource = function (soundSource) {
        var bestSource = {
            url: null,
            codec: null
        };
        var sources;
        if (!Array.isArray(soundSource)) {
            sources = [soundSource];
        }
        else {
            sources = soundSource;
        }
        var i = 0;
        while (i < sources.length) {
            var source = sources[i];
            var soundUrl = '';
            if (this._options.soundsBaseUrl !== '') {
                soundUrl = this._options.soundsBaseUrl;
            }
            soundUrl += source.url;
            var isCodecSupported = true;
            if (source.codec !== null) {
                isCodecSupported = this._checkCodecSupport(source.codec);
            }
            if (isCodecSupported) {
                if (source.isPreferred) {
                    bestSource.url = soundUrl;
                    bestSource.codec = source.codec;
                    break;
                }
                else {
                    bestSource.url = soundUrl;
                    bestSource.codec = source.codec;
                }
            }
            i++;
        }
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
        var currentSound = this._getSoundFromQueue({ whichSound: PlayerCore.CURRENT_SOUND });
        if (currentSound === null) {
            return;
        }
        if (currentSound.state === PlayerSound.SOUND_STATE_PAUSED) {
            return;
        }
        var timeAtPause = currentSound.getCurrentTime();
        currentSound.playTimeOffset += timeAtPause - currentSound.startTime;
        if (currentSound.onPaused !== null) {
            currentSound.onPaused(currentSound.playTimeOffset);
        }
        this._stop(currentSound, PlayerSound.SOUND_STATE_PAUSED);
    };
    PlayerCore.prototype.stop = function () {
        var currentSound = this._getSoundFromQueue({ whichSound: PlayerCore.CURRENT_SOUND });
        if (currentSound === null) {
            return;
        }
        if (currentSound.state === PlayerSound.SOUND_STATE_STOPPED) {
            return;
        }
        this._playerAudio.freezeAudioContext();
        var timeAtStop = currentSound.getCurrentTime();
        currentSound.playTimeOffset += timeAtStop - currentSound.startTime;
        if (currentSound.onStopped !== null) {
            currentSound.onStopped(currentSound.playTimeOffset);
        }
        this._stop(currentSound, PlayerSound.SOUND_STATE_STOPPED);
    };
    PlayerCore.prototype._stop = function (sound, soundState) {
        if (soundState === PlayerSound.SOUND_STATE_STOPPED) {
            sound.playTimeOffset = 0;
            sound.firstTimePlayed = true;
        }
        if (sound.sourceNode !== null) {
            if (sound.sourceNode instanceof AudioBufferSourceNode) {
                sound.sourceNode.stop(0);
            }
            else if (sound.sourceNode instanceof MediaElementAudioSourceNode) {
                sound.sourceNode.mediaElement.pause();
            }
            this._playerAudio.disconnectSound(sound);
            sound.state = soundState;
            if (this._playingProgressRequestId !== null) {
                cancelAnimationFrame(this._playingProgressRequestId);
                this._playingProgressPreviousTimestamp = 0;
            }
        }
    };
    PlayerCore.prototype.next = function () {
        this.play({ whichSound: PlayerCore.PLAY_SOUND_NEXT });
    };
    PlayerCore.prototype.previous = function () {
        this.play({ whichSound: PlayerCore.PLAY_SOUND_PREVIOUS });
    };
    PlayerCore.prototype.first = function () {
        this.play({ whichSound: PlayerCore.PLAY_SOUND_FIRST });
    };
    PlayerCore.prototype.last = function () {
        this.play({ whichSound: PlayerCore.PLAY_SOUND_LAST });
    };
    PlayerCore.prototype._playingProgress = function (sound) {
        var timeNow = sound.getCurrentTime();
        sound.playTime = (timeNow - sound.startTime) + sound.playTimeOffset;
        var duration = sound.getDuration();
        var playingPercentage = (sound.playTime / duration) * 100;
        sound.playedTimePercentage = playingPercentage;
        sound.onPlaying(playingPercentage, duration, sound.playTime);
    };
    PlayerCore.prototype.setVisibilityAutoMute = function (visibilityAutoMute) {
        this._options.visibilityAutoMute = visibilityAutoMute;
        if (visibilityAutoMute) {
            document.addEventListener('visibilitychange', this._handleVisibilityChange.bind(this), false);
        }
        else {
            document.removeEventListener('visibilitychange', this._handleVisibilityChange.bind(this), false);
        }
    };
    PlayerCore.prototype.getVisibilityAutoMute = function () {
        return this._options.visibilityAutoMute;
    };
    PlayerCore.prototype._handleVisibilityChange = function () {
        var hiddenKeyword;
        if (typeof document.hidden !== 'undefined') {
            hiddenKeyword = 'hidden';
        }
        else if (typeof document.msHidden !== 'undefined') {
            hiddenKeyword = 'msHidden';
        }
        else if (typeof document.webkitHidden !== 'undefined') {
            hiddenKeyword = 'webkitHidden';
        }
        if (document[hiddenKeyword]) {
            this.mute();
        }
        else {
            this.unMute();
        }
    };
    PlayerCore.prototype.disconnect = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this._playerAudio.shutDown(this._queue)];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        });
    };
    PlayerCore.prototype.getAudioContext = function () {
        return __awaiter(this, void 0, void 0, function () {
            var audioContext;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this._playerAudio.getAudioContext()];
                    case 1:
                        audioContext = _a.sent();
                        return [2, audioContext];
                }
            });
        });
    };
    PlayerCore.WHERE_IN_QUEUE_AT_END = 'append';
    PlayerCore.WHERE_IN_QUEUE_AT_START = 'prepend';
    PlayerCore.PLAY_SOUND_NEXT = 'next';
    PlayerCore.PLAY_SOUND_PREVIOUS = 'previous';
    PlayerCore.PLAY_SOUND_FIRST = 'first';
    PlayerCore.PLAY_SOUND_LAST = 'last';
    PlayerCore.CURRENT_SOUND = 'current';
    PlayerCore.PLAYER_MODE_AUDIO = 'player_mode_audio';
    PlayerCore.PLAYER_MODE_AJAX = 'player_mode_ajax';
    PlayerCore.PLAYER_MODE_FETCH = 'player_mode_fetch';
    return PlayerCore;
}());

export { PlayerCore, PlayerSound };
//# sourceMappingURL=index.js.map

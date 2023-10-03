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
/* global Reflect, Promise, SuppressedError, Symbol */


function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

const SOUND_STATE_STOPPED = 'sound_state_stopped';
class PlayerSound {
    constructor(soundAttributes) {
        this.url = null;
        this.codec = null;
        this.loop = false;
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
        this.elapsedPlayTime = 0;
        this.playTime = 0;
        this.playedTimePercentage = 0;
        this.state = SOUND_STATE_STOPPED;
        this.loadingProgress = 0;
        this.duration = null;
        this.firstTimePlayed = true;
        this.isConnectToPlayerGain = false;
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
        if (typeof soundAttributes.onSeeking === 'function') {
            this.onSeeking = soundAttributes.onSeeking;
        }
        else {
            this.onSeeking = null;
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
    getCurrentTime() {
        let currentTime;
        if (this.sourceNode !== null) {
            if (this.sourceNode instanceof AudioBufferSourceNode) {
                currentTime = (this.sourceNode.context.currentTime - this.startTime) + this.elapsedPlayTime;
            }
            else if (this.sourceNode instanceof MediaElementAudioSourceNode) {
                currentTime = this.audioElement.currentTime;
            }
        }
        const currentTimeRounded = Math.round((currentTime + Number.EPSILON) * 100) / 100;
        return currentTimeRounded;
    }
    getDuration() {
        let duration;
        if (this.sourceNode !== null) {
            if (this.sourceNode instanceof AudioBufferSourceNode) {
                duration = this.audioBuffer.duration;
            }
            else if (this.sourceNode instanceof MediaElementAudioSourceNode) {
                duration = this.audioElement.duration;
            }
        }
        const durationRounded = Math.round((duration + Number.EPSILON) * 100) / 100;
        return durationRounded;
    }
    _generateSoundId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
}
PlayerSound.SOUND_STATE_STOPPED = 'sound_state_stopped';
PlayerSound.SOUND_STATE_PAUSED = 'sound_state_paused';
PlayerSound.SOUND_STATE_PLAYING = 'sound_state_playing';
PlayerSound.SOUND_STATE_SEEKING = 'sound_state_seeking';

class PlayerAudio {
    constructor(options) {
        this._audioContext = null;
        this._volume = null;
        this._audioNodes = {
            gainNode: null,
        };
        this._audioElement = null;
        this._mediaElementAudioSourceNode = null;
        this._isAudioUnlocked = false;
        this._isAudioUnlocking = false;
        this._options = options;
        this._initialize();
    }
    _initialize() {
        if (this._options.unlockAudioOnFirstUserInteraction) {
            this._addFirstUserInteractionEventListeners();
        }
    }
    getAudioNodes() {
        return this._audioNodes;
    }
    decodeAudio(arrayBuffer) {
        return __awaiter(this, void 0, void 0, function* () {
            const audioContext = yield this.getAudioContext();
            return yield audioContext.decodeAudioData(arrayBuffer);
        });
    }
    _createAudioContext() {
        if (this._audioContext instanceof AudioContext) {
            return;
        }
        const WebAudioContext = window.AudioContext || window.webkitAudioContext;
        if (this._options.audioContext !== null) {
            this._audioContext = this._options.audioContext;
        }
        else {
            this._audioContext = new WebAudioContext();
        }
    }
    _addFirstUserInteractionEventListeners() {
        if (this._options.unlockAudioOnFirstUserInteraction) {
            document.addEventListener('keydown', this.unlockAudio.bind(this));
            document.addEventListener('mousedown', this.unlockAudio.bind(this));
            document.addEventListener('pointerdown', this.unlockAudio.bind(this));
            document.addEventListener('pointerup', this.unlockAudio.bind(this));
            document.addEventListener('touchend', this.unlockAudio.bind(this));
        }
    }
    _removeFirstUserInteractionEventListeners() {
        if (this._options.unlockAudioOnFirstUserInteraction) {
            document.removeEventListener('keydown', this.unlockAudio.bind(this));
            document.removeEventListener('mousedown', this.unlockAudio.bind(this));
            document.removeEventListener('pointerdown', this.unlockAudio.bind(this));
            document.removeEventListener('pointerup', this.unlockAudio.bind(this));
            document.removeEventListener('touchend', this.unlockAudio.bind(this));
        }
    }
    unlockAudio() {
        return new Promise((resolve, reject) => {
            if (this._isAudioUnlocking) {
                return resolve();
            }
            if (this._isAudioUnlocked) {
                return resolve();
            }
            this._isAudioUnlocking = true;
            if (this._options.loadPlayerMode === 'player_mode_audio') {
                const forceCreate = true;
                this._createAudioElement(forceCreate).catch((error) => {
                    console.error(error);
                    this._isAudioUnlocking = false;
                    return reject();
                });
            }
            this.getAudioContext().then(() => {
                const placeholderBuffer = this._audioContext.createBuffer(1, 1, 22050);
                let bufferSource = this._audioContext.createBufferSource();
                bufferSource.onended = () => {
                    bufferSource.disconnect(0);
                    this._removeFirstUserInteractionEventListeners();
                    bufferSource.disconnect(0);
                    bufferSource.buffer = null;
                    bufferSource = null;
                    this._isAudioUnlocked = true;
                    this._isAudioUnlocking = false;
                    return resolve();
                };
                bufferSource.buffer = placeholderBuffer;
                bufferSource.connect(this._audioContext.destination);
                bufferSource.start(0);
            }).catch((error) => {
                console.error(error);
                this._isAudioUnlocking = false;
                return reject();
            });
        });
    }
    _createAudioElementAndSource() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._createAudioElement();
            yield this._createMediaElementAudioSourceNode();
        });
    }
    _createAudioElement(forceCreate) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._audioElement === null || forceCreate === true) {
                const audioElement = new Audio();
                audioElement.controls = false;
                audioElement.autoplay = false;
                audioElement.preload = 'metadata';
                audioElement.volume = 1;
                audioElement.id = 'web-audio-api-player';
                this._audioElement = audioElement;
                if (this._options.addAudioElementsToDom) {
                    document.body.appendChild(audioElement);
                }
            }
        });
    }
    getAudioElement() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._audioElement === null) {
                yield this._createAudioElementAndSource();
            }
            return this._audioElement;
        });
    }
    getAudioContext() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._audioContext === null || this._audioContext.state === 'closed') {
                yield this._createAudioContext();
            }
            else if (this._audioContext.state === 'suspended') {
                yield this.unfreezeAudioContext();
            }
            return this._audioContext;
        });
    }
    unfreezeAudioContext() {
        if (typeof this._audioContext.resume === 'undefined') {
            return Promise.resolve();
        }
        else {
            return this._audioContext.resume();
        }
    }
    freezeAudioContext() {
        if (typeof this._audioContext.suspend === 'undefined') {
            return Promise.resolve();
        }
        else {
            return this._audioContext.suspend();
        }
    }
    isAudioContextFrozen() {
        return this._audioContext.state === 'suspended' ? true : false;
    }
    detectAudioContextSupport() {
        let audioContextSupported = false;
        if (typeof window.webkitAudioContext !== 'undefined') {
            audioContextSupported = true;
        }
        else if (typeof AudioContext !== 'undefined') {
            audioContextSupported = true;
        }
        return audioContextSupported;
    }
    detectAudioElementSupport() {
        return !!document.createElement('audio').canPlayType;
    }
    _createAudioBufferSourceNode() {
        return __awaiter(this, void 0, void 0, function* () {
            const audioContext = yield this.getAudioContext();
            return audioContext.createBufferSource();
        });
    }
    _createMediaElementAudioSourceNode() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._mediaElementAudioSourceNode === null && this._audioElement !== null) {
                const audioContext = yield this.getAudioContext();
                this._mediaElementAudioSourceNode = audioContext.createMediaElementSource(this._audioElement);
            }
        });
    }
    _destroyMediaElementAudioSourceNode() {
        if (this._mediaElementAudioSourceNode !== null) {
            if (typeof this._mediaElementAudioSourceNode.mediaElement !== 'undefined') {
                this._mediaElementAudioSourceNode.mediaElement.remove();
            }
            this._mediaElementAudioSourceNode.disconnect();
            this._mediaElementAudioSourceNode = null;
        }
    }
    _destroyAudioBufferSourceNode() {
        if (this._mediaElementAudioSourceNode !== null) {
            this._mediaElementAudioSourceNode.disconnect();
        }
    }
    _destroyAudioContext() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._audioContext !== null && this._audioContext.state !== 'closed') {
                yield this._audioContext.close();
                this._audioContext = null;
            }
        });
    }
    shutDown(songsQueue) {
        return __awaiter(this, void 0, void 0, function* () {
            this._removeFirstUserInteractionEventListeners();
            songsQueue.forEach((sound) => {
                this.disconnectSound(sound);
            });
            this._destroyMediaElementAudioSourceNode();
            this._destroyAudioBufferSourceNode();
            this._disconnectPlayerGainNode();
            yield this._destroyAudioContext();
        });
    }
    _getPlayerGainNode() {
        return __awaiter(this, void 0, void 0, function* () {
            let gainNode;
            if (this._audioNodes.gainNode instanceof GainNode) {
                gainNode = this._audioNodes.gainNode;
            }
            else {
                const audioContext = yield this.getAudioContext();
                gainNode = audioContext.createGain();
                this._initializeVolume(gainNode);
                gainNode.connect(audioContext.destination);
                this._audioNodes.gainNode = gainNode;
            }
            return gainNode;
        });
    }
    _disconnectPlayerGainNode() {
        if (this._audioNodes.gainNode !== null) {
            this._audioNodes.gainNode.disconnect();
            this._audioNodes.gainNode = null;
        }
    }
    connectSound(sound, onEndedCallback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (sound.isConnectToPlayerGain) {
                return;
            }
            if (this._options.loadPlayerMode === 'player_mode_ajax') {
                const audioBufferSourceNode = yield this._createAudioBufferSourceNode();
                sound.gainNode = audioBufferSourceNode.context.createGain();
                audioBufferSourceNode.connect(sound.gainNode);
                audioBufferSourceNode.loop = sound.loop;
                audioBufferSourceNode.onended = onEndedCallback;
                sound.sourceNode = audioBufferSourceNode;
            }
            else if (this._options.loadPlayerMode === 'player_mode_audio') {
                yield this._createAudioElementAndSource();
                sound.gainNode = this._mediaElementAudioSourceNode.context.createGain();
                this._mediaElementAudioSourceNode.connect(sound.gainNode);
                this._mediaElementAudioSourceNode.mediaElement.loop = sound.loop;
                this._mediaElementAudioSourceNode.mediaElement.onended = onEndedCallback;
                sound.sourceNode = this._mediaElementAudioSourceNode;
            }
            sound.gainNode.gain.value = 1;
            const playerGainNode = yield this._getPlayerGainNode();
            sound.gainNode.connect(playerGainNode);
            sound.isConnectToPlayerGain = true;
        });
    }
    disconnectSound(sound) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!sound.isConnectToPlayerGain) {
                return;
            }
            if (sound.sourceNode !== null) {
                sound.sourceNode.disconnect();
                sound.sourceNode = null;
            }
            if (sound.gainNode !== null) {
                sound.gainNode.disconnect();
                sound.gainNode = null;
                sound.isConnectToPlayerGain = false;
            }
            if (sound.audioElement !== null) {
                sound.audioElement = null;
            }
        });
    }
    _changePlayerGainValue(gainValue) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._audioNodes.gainNode instanceof GainNode) {
                const audioContext = yield this.getAudioContext();
                this._audioNodes.gainNode.gain.setTargetAtTime(gainValue, audioContext.currentTime, 0.1);
            }
        });
    }
    setVolume(volume, forceUpdateUserVolume = true) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._options.persistVolume && forceUpdateUserVolume) {
                localStorage.setItem('WebAudioAPIPlayerVolume', volume.toString());
            }
            const newGainValue = volume / 100;
            if (this._audioNodes.gainNode instanceof GainNode) {
                const currentGainRounded = Math.round((this._audioNodes.gainNode.gain.value + Number.EPSILON) * 100) / 100;
                if (newGainValue !== currentGainRounded) {
                    yield this._changePlayerGainValue(newGainValue);
                }
            }
            this._volume = volume;
            return volume;
        });
    }
    getVolume() {
        let volume;
        if (this._volume !== null) {
            volume = this._volume;
        }
        else {
            if (this._options.persistVolume) {
                const userVolumeInPercent = parseInt(localStorage.getItem('WebAudioAPIPlayerVolume'));
                if (!isNaN(userVolumeInPercent)) {
                    volume = userVolumeInPercent;
                }
            }
            if (typeof volume === 'undefined') {
                volume = this._options.volume;
            }
            this._volume = volume;
        }
        return volume;
    }
    _initializeVolume(gainNode) {
        if (this._options.persistVolume) {
            const userVolumeInPercent = parseInt(localStorage.getItem('WebAudioAPIPlayerVolume'));
            const gainValue = userVolumeInPercent / 100;
            if (!isNaN(userVolumeInPercent)) {
                gainNode.gain.value = gainValue;
            }
            this._volume = userVolumeInPercent;
        }
        if (this._volume === null) {
            const gainValue = this._options.volume / 100;
            gainNode.gain.value = gainValue;
            this._volume = this._options.volume;
        }
    }
}

class PlayerRequest {
    getArrayBuffer(requested) {
        return new Promise(function (resolve, reject) {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', requested.url, true);
            xhr.responseType = 'arraybuffer';
            xhr.onload = function () {
                if (xhr.status >= 200 && xhr.status <= 299) {
                    resolve(xhr.response);
                }
                else {
                    reject(new Error(xhr.statusText + '(status:' + xhr.status + ')'));
                }
            };
            xhr.onprogress = function (event) {
                const loadingPercentageRaw = 100 / (event.total / event.loaded);
                const loadingPercentage = Math.round(loadingPercentageRaw);
                requested.loadingProgress = loadingPercentage;
                if (requested.onLoading !== null) {
                    requested.onLoading(loadingPercentage, event.total, event.loaded);
                }
            };
            xhr.onerror = function (error) {
                reject(error);
            };
            xhr.send();
        });
    }
}

const PLAYER_MODE_AUDIO = 'player_mode_audio';
const WHERE_IN_QUEUE_AT_END = 'append';
class PlayerCore {
    constructor(playerOptions = {}) {
        this._playingProgressRequestId = null;
        this._postMuteVolume = null;
        this._progressTrigger = (sound, timestamp) => {
            const currentSound = this._getSoundFromQueue({ whichSound: PlayerCore.CURRENT_SOUND });
            if (sound.id !== currentSound.id || currentSound.state !== PlayerSound.SOUND_STATE_PLAYING) {
                return;
            }
            if ((timestamp - this._playingProgressPreviousTimestamp) >= this._options.playingProgressIntervalTime) {
                const currentTime = sound.getCurrentTime();
                const duration = sound.getDuration();
                if (!isNaN(currentTime) && !isNaN(duration)) {
                    let playingPercentage = 0;
                    if (currentTime !== 0) {
                        const playingPercentageRaw = (currentTime / duration) * 100;
                        playingPercentage = Math.round(playingPercentageRaw);
                    }
                    sound.playedTimePercentage = playingPercentage;
                    sound.playTime = currentTime;
                    sound.onPlaying(playingPercentage, duration, currentTime);
                    this._playingProgressPreviousTimestamp = timestamp;
                }
            }
            this._playingProgressRequestId = window.requestAnimationFrame((timestamp) => {
                this._progressTrigger(sound, timestamp);
            });
        };
        const defaultOptions = {
            volume: 80,
            loopQueue: false,
            loopSong: false,
            soundsBaseUrl: '',
            playingProgressIntervalTime: 200,
            playNextOnEnded: true,
            stopOnReset: true,
            visibilityAutoMute: false,
            unlockAudioOnFirstUserInteraction: false,
            persistVolume: true,
            loadPlayerMode: PLAYER_MODE_AUDIO,
            audioContext: null,
            addAudioElementsToDom: false,
        };
        const options = Object.assign({}, defaultOptions, playerOptions);
        this._queue = [];
        this._currentIndex = 0;
        this._options = options;
        this._playingProgressPreviousTimestamp = 0;
        this._initialize();
    }
    _initialize() {
        const audioOptions = this._audioOptions();
        this._playerAudio = new PlayerAudio(audioOptions);
        switch (this._options.loadPlayerMode) {
            case PlayerCore.PLAYER_MODE_AUDIO:
                if (!this._playerAudio.detectAudioContextSupport()) {
                    throw new Error('audio context is not supported by this device');
                }
                if (!this._playerAudio.detectAudioElementSupport()) {
                    throw new Error('audio element is not supported by this device');
                }
                break;
            case PlayerCore.PLAYER_MODE_AJAX:
                if (!this._playerAudio.detectAudioContextSupport()) {
                    throw new Error('audio context is not supported by this device');
                }
                break;
        }
    }
    _audioOptions() {
        const audioOptions = {
            audioContext: this._options.audioContext,
            unlockAudioOnFirstUserInteraction: this._options.unlockAudioOnFirstUserInteraction,
            volume: this._options.volume,
            persistVolume: this._options.persistVolume,
            loadPlayerMode: this._options.loadPlayerMode,
            addAudioElementsToDom: this._options.addAudioElementsToDom,
        };
        return audioOptions;
    }
    addSoundToQueue({ soundAttributes, whereInQueue = WHERE_IN_QUEUE_AT_END }) {
        const sound = new PlayerSound(soundAttributes);
        switch (whereInQueue) {
            case PlayerCore.WHERE_IN_QUEUE_AT_END:
                this._appendSoundToQueue(sound);
                break;
            case PlayerCore.WHERE_IN_QUEUE_AT_START:
                this._prependSoundToQueue(sound);
                break;
        }
        return sound;
    }
    _appendSoundToQueue(sound) {
        this._queue.push(sound);
    }
    _prependSoundToQueue(sound) {
        this._queue.unshift(sound);
    }
    resetQueue() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._options.stopOnReset) {
                yield this.stop();
            }
            this._queue.forEach((sound) => {
                this._playerAudio.disconnectSound(sound);
            });
            this._queue = [];
        });
    }
    reset() {
        this.resetQueue().catch((error) => {
            console.error(error);
        });
    }
    getQueue() {
        return this._queue;
    }
    setVolume(volume) {
        this._playerAudio.setVolume(volume).catch((error) => {
            console.error(error);
        });
    }
    getVolume() {
        return this._playerAudio.getVolume();
    }
    setLoopQueue(loppQueue) {
        this._options.loopQueue = loppQueue;
    }
    getLoopQueue() {
        return this._options.loopQueue;
    }
    mute() {
        const currentVolume = this.getVolume();
        this._playerAudio.setVolume(0, false).catch((error) => {
            console.error(error);
        });
        this._postMuteVolume = currentVolume;
    }
    unMute() {
        this._playerAudio.setVolume(this._postMuteVolume, false).catch((error) => {
            console.error(error);
        });
        this._postMuteVolume = null;
    }
    isMuted() {
        return this._postMuteVolume === null ? false : true;
    }
    setPosition(soundPositionInPercent) {
        return __awaiter(this, void 0, void 0, function* () {
            if (soundPositionInPercent < 0 || soundPositionInPercent > 100) {
                throw new Error('soundPositionInPercent must be a number >= 0 and <= 100');
            }
            const currentSound = this._getSoundFromQueue({ whichSound: PlayerCore.CURRENT_SOUND });
            if (currentSound !== null) {
                let duration = currentSound.getDuration();
                if (duration === null || isNaN(duration)) {
                    yield this._loadSound(currentSound);
                    duration = currentSound.getDuration();
                }
                const soundPositionInSeconds = (duration / 100) * soundPositionInPercent;
                this.setPositionInSeconds(soundPositionInSeconds);
            }
        });
    }
    setPositionInSeconds(soundPositionInSeconds) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentSound = this._getSoundFromQueue({ whichSound: PlayerCore.CURRENT_SOUND });
            if (currentSound !== null) {
                if (!isNaN(currentSound.duration) && (soundPositionInSeconds > currentSound.duration)) {
                    console.warn('soundPositionInSeconds > sound duration');
                }
                if (currentSound.onSeeking !== null) {
                    const playTime = soundPositionInSeconds;
                    const duration = currentSound.getDuration();
                    const seekingPercentageRaw = (playTime / duration) * 100;
                    const seekingPercentage = Math.round(seekingPercentageRaw);
                    currentSound.onSeeking(seekingPercentage, duration, playTime);
                }
                if (currentSound.state === PlayerSound.SOUND_STATE_PLAYING) {
                    currentSound.playTime = soundPositionInSeconds;
                    if (this._options.loadPlayerMode === PlayerCore.PLAYER_MODE_AJAX) {
                        currentSound.elapsedPlayTime = soundPositionInSeconds;
                        yield this._stop(currentSound, PlayerSound.SOUND_STATE_SEEKING);
                    }
                    else if (this._options.loadPlayerMode === PlayerCore.PLAYER_MODE_AUDIO) {
                        currentSound.state = PlayerSound.SOUND_STATE_SEEKING;
                        yield this._play(currentSound);
                    }
                }
                else {
                    currentSound.playTime = soundPositionInSeconds;
                    currentSound.state = PlayerSound.SOUND_STATE_SEEKING;
                }
            }
        });
    }
    _loadSound(sound) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (this._options.loadPlayerMode) {
                case PlayerCore.PLAYER_MODE_AUDIO:
                    yield this._loadSoundUsingAudioElement(sound);
                    break;
                case PlayerCore.PLAYER_MODE_AJAX:
                    yield this._loadSoundUsingRequest(sound);
                    break;
                case PlayerCore.PLAYER_MODE_FETCH:
                    console.warn(PlayerCore.PLAYER_MODE_FETCH + ' is not implemented yet');
            }
        });
    }
    _loadSoundUsingAudioElement(sound) {
        return new Promise((resolve, reject) => {
            const { url, codec = null } = this._findBestSource(sound.source);
            sound.url = url;
            sound.codec = codec;
            if (sound.url !== null) {
                this._playerAudio.getAudioElement().then((audioElement) => {
                    sound.audioElement = audioElement;
                    const canPlayThroughHandler = () => __awaiter(this, void 0, void 0, function* () {
                        sound.audioElement.removeEventListener('canplaythrough', canPlayThroughHandler);
                        sound.isReadyToPLay = true;
                        if (!isNaN(sound.audioElement.duration)) {
                            sound.duration = sound.audioElement.duration;
                        }
                        return resolve();
                    });
                    sound.audioElement.addEventListener('canplaythrough', canPlayThroughHandler);
                    sound.audioElement.onprogress = () => {
                        if (sound.audioElement.buffered.length) {
                            const duration = sound.getDuration();
                            const buffered = sound.audioElement.buffered.end(0);
                            const loadingPercentageRaw = 100 / (duration / buffered);
                            const loadingPercentage = Math.round(loadingPercentageRaw);
                            sound.loadingProgress = loadingPercentage;
                            if (sound.onLoading !== null) {
                                sound.onLoading(loadingPercentage, duration, buffered);
                            }
                            sound.duration = sound.audioElement.duration;
                            if (loadingPercentage === 100) {
                                sound.isBuffering = false;
                                sound.isBuffered = true;
                                sound.audioBufferDate = new Date();
                            }
                        }
                    };
                    sound.audioElement.crossOrigin = 'anonymous';
                    sound.audioElement.src = sound.url;
                    sound.audioElement.load();
                }).catch(reject);
            }
            else {
                reject(new Error('sound has no url'));
            }
        });
    }
    _loadSoundUsingRequest(sound) {
        return __awaiter(this, void 0, void 0, function* () {
            if (sound.arrayBuffer !== null) {
                return yield this._decodeSound({ sound });
            }
            const { url, codec = null } = this._findBestSource(sound.source);
            sound.url = url;
            sound.codec = codec;
            if (sound.url !== null) {
                const request = new PlayerRequest();
                sound.isBuffering = true;
                const arrayBuffer = yield request.getArrayBuffer(sound);
                sound.arrayBuffer = arrayBuffer;
                yield this._decodeSound({ sound });
            }
            else {
                throw new Error('sound has no url');
            }
        });
    }
    _decodeSound({ sound }) {
        return __awaiter(this, void 0, void 0, function* () {
            const arrayBufferCopy = sound.arrayBuffer.slice(0);
            const audioBuffer = yield this._playerAudio.decodeAudio(arrayBufferCopy);
            sound.audioBuffer = audioBuffer;
            sound.isBuffering = false;
            sound.isBuffered = true;
            sound.audioBufferDate = new Date();
            sound.duration = audioBuffer.duration;
            sound.isReadyToPLay = true;
        });
    }
    manuallyUnlockAudio() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._playerAudio.unlockAudio();
        });
    }
    play({ whichSound, playTimeOffset } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentSound = this._getSoundFromQueue({ whichSound: PlayerCore.CURRENT_SOUND });
            const sound = this._getSoundFromQueue({ whichSound, updateIndex: true });
            if (sound === null) {
                console.warn('no more sounds in array');
                return sound;
            }
            if (currentSound !== null
                && (currentSound.state === PlayerSound.SOUND_STATE_PLAYING)
                && (currentSound.id === sound.id)) {
                if (!isNaN(playTimeOffset)) {
                    this.setPositionInSeconds(playTimeOffset);
                    return sound;
                }
                else {
                    return sound;
                }
            }
            if (currentSound !== null
                && (currentSound.state === PlayerSound.SOUND_STATE_PLAYING || currentSound.state === PlayerSound.SOUND_STATE_PAUSED)
                && (currentSound.id !== sound.id)) {
                yield this._stop(currentSound, PlayerSound.SOUND_STATE_STOPPED);
            }
            if (!isNaN(playTimeOffset)) {
                sound.playTimeOffset = playTimeOffset;
            }
            else {
                sound.playTimeOffset = 0;
            }
            if (sound.sourceNode === null) {
                yield this._playerAudio.connectSound(sound, () => {
                    this._onEnded();
                });
            }
            if (!sound.isReadyToPLay) {
                yield this._loadSound(sound);
                yield this._play(sound);
            }
            else {
                yield this._play(sound);
            }
            return sound;
        });
    }
    _play(sound) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._playerAudio.isAudioContextFrozen()) {
                yield this._playerAudio.unfreezeAudioContext();
            }
            if (sound.playTimeOffset > 0) {
                sound.playTime = sound.playTimeOffset;
            }
            if (this._options.loadPlayerMode === PlayerCore.PLAYER_MODE_AJAX) {
                yield this._playAudioBuffer(sound);
            }
            else if (this._options.loadPlayerMode === PlayerCore.PLAYER_MODE_AUDIO) {
                yield this._playMediaElementAudio(sound);
            }
            sound.state = PlayerSound.SOUND_STATE_PLAYING;
            this._triggerSoundCallbacks(sound);
        });
    }
    _playAudioBuffer(sound) {
        return __awaiter(this, void 0, void 0, function* () {
            if (sound.sourceNode instanceof AudioBufferSourceNode) {
                sound.startTime = sound.sourceNode.context.currentTime;
                sound.sourceNode.buffer = sound.audioBuffer;
                try {
                    if (sound.state === PlayerSound.SOUND_STATE_SEEKING) {
                        sound.sourceNode.start(0, sound.playTime);
                    }
                    else if (sound.state === PlayerSound.SOUND_STATE_PAUSED && sound.playTimeOffset === 0) {
                        sound.sourceNode.start(0, sound.playTime);
                    }
                    else {
                        if (sound.playTimeOffset > 0) {
                            if (sound.playTimeOffset > sound.duration) {
                                console.warn('playTimeOffset > sound duration');
                            }
                            sound.elapsedPlayTime = sound.playTimeOffset;
                            sound.sourceNode.start(0, sound.playTimeOffset);
                        }
                        else {
                            sound.sourceNode.start();
                        }
                    }
                }
                catch (error) {
                    throw new Error(error);
                }
            }
        });
    }
    _playMediaElementAudio(sound) {
        return __awaiter(this, void 0, void 0, function* () {
            if (sound.sourceNode instanceof MediaElementAudioSourceNode) {
                if (sound.state === PlayerSound.SOUND_STATE_SEEKING) {
                    sound.audioElement.currentTime = sound.playTime;
                }
                else if (sound.state === PlayerSound.SOUND_STATE_PAUSED && sound.playTimeOffset === 0) {
                    sound.audioElement.currentTime = sound.playTime;
                }
                else {
                    if (sound.playTimeOffset > 0) {
                        if (sound.playTimeOffset > sound.duration) {
                            console.warn('playTimeOffset > duration');
                        }
                        sound.audioElement.currentTime = sound.playTimeOffset;
                    }
                    else {
                        sound.audioElement.currentTime = 0;
                    }
                }
                return yield sound.audioElement.play();
            }
        });
    }
    _triggerSoundCallbacks(sound) {
        if (sound.onResumed !== null && !sound.firstTimePlayed) {
            sound.onResumed(sound.playTime);
        }
        if (sound.onStarted !== null && sound.firstTimePlayed) {
            sound.firstTimePlayed = false;
            sound.onStarted(sound.playTimeOffset);
        }
        if (sound.onPlaying !== null) {
            this._playingProgressPreviousTimestamp = 0;
            this._progressTrigger(sound, 0);
        }
        else {
            this._playingProgressRequestId = null;
        }
        return;
    }
    _onEnded() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._options.playNextOnEnded) {
                const currentSound = this._getSoundFromQueue({ whichSound: PlayerCore.CURRENT_SOUND });
                if (currentSound !== null) {
                    if (this._options.loadPlayerMode === PlayerCore.PLAYER_MODE_AUDIO ||
                        (this._options.loadPlayerMode === PlayerCore.PLAYER_MODE_AJAX && currentSound.state === PlayerSound.SOUND_STATE_PLAYING)) {
                        const nextSound = this._getSoundFromQueue({ whichSound: PlayerCore.PLAY_SOUND_NEXT });
                        let willPlayNext = false;
                        if (nextSound !== null) {
                            willPlayNext = true;
                        }
                        if (!willPlayNext) {
                            yield this._playerAudio.freezeAudioContext();
                        }
                        if (currentSound.onEnded !== null) {
                            currentSound.onEnded(willPlayNext);
                        }
                        try {
                            yield this.next();
                        }
                        catch (error) {
                            console.error(error);
                        }
                    }
                    if (this._options.loadPlayerMode === PlayerCore.PLAYER_MODE_AJAX && currentSound.state === PlayerSound.SOUND_STATE_SEEKING) {
                        try {
                            yield this.play(currentSound);
                        }
                        catch (error) {
                            console.error(error);
                        }
                    }
                }
            }
        });
    }
    _getSoundFromQueue({ whichSound, updateIndex = false } = {}) {
        let sound = null;
        let soundIndex = null;
        if (this._queue.length === 0) {
            return sound;
        }
        if (typeof whichSound === 'undefined') {
            whichSound = PlayerCore.CURRENT_SOUND;
        }
        switch (whichSound) {
            case PlayerCore.CURRENT_SOUND:
                soundIndex = this._currentIndex;
                sound = this._queue[soundIndex];
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
                [sound, soundIndex] = this._findSoundById({ soundId: whichSound });
        }
        if (soundIndex !== null && updateIndex) {
            this._currentIndex = soundIndex;
        }
        return sound;
    }
    _findSoundById({ soundId }) {
        let sound = null;
        let soundIndex = 0;
        this._queue.some((soundFromQueue, index) => {
            if (soundFromQueue.id === soundId) {
                sound = soundFromQueue;
                soundIndex = index;
                return true;
            }
        });
        return [sound, soundIndex];
    }
    _findBestSource(soundSource) {
        const bestSource = {
            url: null,
            codec: null
        };
        let sources;
        if (!Array.isArray(soundSource)) {
            sources = [soundSource];
        }
        else {
            sources = soundSource;
        }
        let i = 0;
        while (i < sources.length) {
            const source = sources[i];
            let soundUrl = '';
            if (this._options.soundsBaseUrl !== '') {
                soundUrl = this._options.soundsBaseUrl;
            }
            soundUrl += source.url;
            let isCodecSupported = true;
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
    }
    _checkCodecSupport(codec) {
        let mediaMimeTypes;
        let error = '';
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
            throw new Error(error);
        }
        return this._checkMimeTypesSupport(mediaMimeTypes);
    }
    _checkMimeTypesSupport(mediaMimeTypes) {
        const deviceAudio = new Audio();
        let isSupported = false;
        mediaMimeTypes.forEach((mediaMimeType) => {
            const isMediaTypeSupported = deviceAudio.canPlayType(mediaMimeType).replace(/^no$/, '');
            if (isMediaTypeSupported) {
                isSupported = true;
            }
        });
        return isSupported;
    }
    pause() {
        return __awaiter(this, void 0, void 0, function* () {
            const currentSound = this._getSoundFromQueue({ whichSound: PlayerCore.CURRENT_SOUND });
            if (currentSound === null) {
                return;
            }
            if (currentSound.state === PlayerSound.SOUND_STATE_PAUSED) {
                return;
            }
            const currentTime = currentSound.getCurrentTime();
            currentSound.playTime = currentTime;
            if (this._options.loadPlayerMode === PlayerCore.PLAYER_MODE_AJAX) {
                currentSound.elapsedPlayTime = currentTime;
            }
            if (currentSound.onPaused !== null) {
                currentSound.onPaused(currentSound.playTime);
            }
            yield this._stop(currentSound, PlayerSound.SOUND_STATE_PAUSED);
            return currentSound;
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            const currentSound = this._getSoundFromQueue({ whichSound: PlayerCore.CURRENT_SOUND });
            if (currentSound === null) {
                return;
            }
            if (currentSound.state === PlayerSound.SOUND_STATE_STOPPED) {
                return;
            }
            yield this._playerAudio.freezeAudioContext();
            if (currentSound.onStopped !== null) {
                currentSound.onStopped(currentSound.playTime);
            }
            yield this._stop(currentSound, PlayerSound.SOUND_STATE_STOPPED);
            return currentSound;
        });
    }
    _stop(sound, soundState) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._playingProgressRequestId !== null) {
                cancelAnimationFrame(this._playingProgressRequestId);
                this._playingProgressRequestId = null;
            }
            sound.state = soundState;
            if (sound.sourceNode !== null) {
                if (sound.sourceNode instanceof AudioBufferSourceNode) {
                    sound.sourceNode.stop(0);
                    yield this._playerAudio.disconnectSound(sound);
                }
                if (sound.sourceNode instanceof MediaElementAudioSourceNode) {
                    sound.audioElement.pause();
                }
            }
            if (soundState === PlayerSound.SOUND_STATE_STOPPED) {
                sound.isReadyToPLay = false;
                sound.firstTimePlayed = true;
                sound.startTime = 0;
                sound.elapsedPlayTime = 0;
                sound.playTime = 0;
                sound.playedTimePercentage = 0;
                yield this._playerAudio.disconnectSound(sound);
            }
        });
    }
    next() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.play({ whichSound: PlayerCore.PLAY_SOUND_NEXT });
        });
    }
    previous() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.play({ whichSound: PlayerCore.PLAY_SOUND_PREVIOUS });
        });
    }
    first() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.play({ whichSound: PlayerCore.PLAY_SOUND_FIRST });
        });
    }
    last() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.play({ whichSound: PlayerCore.PLAY_SOUND_LAST });
        });
    }
    setVisibilityAutoMute(visibilityAutoMute) {
        this._options.visibilityAutoMute = visibilityAutoMute;
        if (visibilityAutoMute) {
            document.addEventListener('visibilitychange', this._handleVisibilityChange.bind(this), false);
        }
        else {
            document.removeEventListener('visibilitychange', this._handleVisibilityChange.bind(this), false);
        }
    }
    getVisibilityAutoMute() {
        return this._options.visibilityAutoMute;
    }
    _handleVisibilityChange() {
        let hiddenKeyword;
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
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._playingProgressRequestId !== null) {
                cancelAnimationFrame(this._playingProgressRequestId);
                this._playingProgressRequestId = null;
            }
            yield this._playerAudio.shutDown(this._queue);
        });
    }
    getAudioContext() {
        return __awaiter(this, void 0, void 0, function* () {
            const audioContext = yield this._playerAudio.getAudioContext();
            return audioContext;
        });
    }
}
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

export { PlayerCore, PlayerSound };
//# sourceMappingURL=index.js.map

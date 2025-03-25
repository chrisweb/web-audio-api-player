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
        this.playTime = 0;
        this.playedTimePercentage = 0;
        this.state = SOUND_STATE_STOPPED;
        this.loadingProgress = 0;
        this.duration = null;
        this.durationSetManually = false;
        this.firstTimePlayed = true;
        this.isConnectToPlayerGain = false;
        // elapsedPlayTime is used to adjust the playtime
        // when playing audio buffers
        // on seek, pause or when there is a playTimeOffset
        // see getCurrentTime function
        this.elapsedPlayTime = 0;
        // the percentage to seek to
        this.seekPercentage = 0;
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
        this.seekPercentage = soundAttributes.seekPercentage || 0;
        // the user can set the duration manually
        // this is usefull if we need to convert the position percentage into seconds but don't want to preload the song
        // to get the duration the song has to get preloaded as the duration is a property of the audioBuffer
        if (!isNaN(soundAttributes.duration)) {
            this.duration = soundAttributes.duration;
            this.durationSetManually = true;
        }
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
            // only update duration if it did not get set manually
            if (!this.durationSetManually) {
                this.duration = this.audioBuffer.duration;
            }
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
        return currentTime;
    }
    getDuration() {
        return this.duration;
    }
    setDuration(duration) {
        if (!isNaN(duration)) {
            this.duration = duration;
            this.durationSetManually = true;
        }
    }
    setLoop(loop) {
        this.loop = loop;
        if (this.state === PlayerSound.SOUND_STATE_PLAYING) {
            if (this.sourceNode !== null) {
                if (this.sourceNode instanceof AudioBufferSourceNode) {
                    this.sourceNode.loop = loop;
                }
                else if (this.sourceNode instanceof MediaElementAudioSourceNode) {
                    this.sourceNode.mediaElement.loop = loop;
                }
            }
        }
    }
    getLoop() {
        return this.loop;
    }
    _generateSoundId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
}
// static constants
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
        // I was planning on using the "first user interaction hack" only (on mobile)
        // to check if the autoplay policy prevents me from playing a sound
        // programmatically (without user click)
        // https://developer.mozilla.org/en-US/docs/Web/API/Navigator/getAutoplayPolicy
        // but this feature is only implemented on firefox (as of 19.09.2023)
        if (this._options.unlockAudioOnFirstUserInteraction) {
            this._addFirstUserInteractionEventListeners();
        }
    }
    getAudioNodes() {
        return this._audioNodes;
    }
    async decodeAudio(arrayBuffer) {
        const audioContext = await this.getAudioContext();
        // Note to self:
        // the new decodeAudioData returns a promise, older versions accept as second
        // and third parameter, which are a success and an error callback function
        // https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/decodeAudioData
        return await audioContext.decodeAudioData(arrayBuffer);
    }
    _createAudioContext() {
        if (this._audioContext instanceof AudioContext) {
            return Promise.resolve();
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const WebAudioContext = window.AudioContext || window.webkitAudioContext;
        // initialize the audio context
        if (this._options.audioContext !== null) {
            this._audioContext = this._options.audioContext;
        }
        else {
            this._audioContext = new WebAudioContext();
        }
        return Promise.resolve();
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
            // it is important to create the audio element before attempting
            // to play the empty buffer, if creation is done after the
            // element will get created but as no sound has been played
            // it will not get unlocked
            // meaning to unlock an audio element it is not enough to create
            // one on user interaction but you also need to play a sound
            if (this._options.loadPlayerMode === 'player_mode_audio') {
                // force the creation to be sure we have a new audio element
                // and don't use one that got created previously
                const forceCreate = true;
                // on iOS (mobile) the audio element you want to use needs to have been created
                // as a direct result of an user interaction
                // after it got unlocked we re-use that element for all sounds
                this._createAudioElement(forceCreate).catch((error) => {
                    console.error(error);
                    this._isAudioUnlocking = false;
                    return reject();
                });
            }
            // make sure the audio context is not suspended
            // on android this is what unlocks audio
            this.getAudioContext().then(() => {
                // create an (empty) buffer
                const placeholderBuffer = this._audioContext.createBuffer(1, 1, 22050);
                // https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/createBufferSource
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
                // attempt to play the empty buffer to check if there is an error
                // or if it can be played, in which case audio is unlocked
                bufferSource.start(0);
            }).catch((error) => {
                console.error(error);
                this._isAudioUnlocking = false;
                return reject();
            });
        });
    }
    async _createAudioElementAndSource() {
        await this._createAudioElement();
        await this._createMediaElementAudioSourceNode();
    }
    async _createAudioElement(forceCreate) {
        if (this._audioElement === null || forceCreate === true) {
            const audioElement = new Audio();
            audioElement.controls = false;
            audioElement.autoplay = false;
            audioElement.preload = 'auto';
            audioElement.volume = 1;
            audioElement.id = 'web-audio-api-player';
            this._audioElement = audioElement;
            if (this._options.addAudioElementsToDom) {
                document.body.appendChild(audioElement);
            }
        }
    }
    async getAudioElement() {
        if (this._audioElement === null) {
            await this._createAudioElementAndSource();
        }
        return this._audioElement;
    }
    async getAudioContext() {
        if (this._audioContext === null || this._audioContext.state === 'closed') {
            await this._createAudioContext();
        }
        else if (this._audioContext.state === 'suspended') {
            await this.unfreezeAudioContext();
        }
        return this._audioContext;
    }
    unfreezeAudioContext() {
        // did resume get implemented
        if (typeof this._audioContext.resume === 'undefined') {
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
    }
    freezeAudioContext() {
        // did suspend get implemented
        if (typeof this._audioContext.suspend === 'undefined') {
            return Promise.resolve();
        }
        else {
            // halt the audio hardware access temporarily to reduce CPU and battery usage
            // especially useful on mobile to prevent battery drain
            return this._audioContext.suspend();
        }
    }
    isAudioContextFrozen() {
        return this._audioContext.state === 'suspended' ? true : false;
    }
    detectAudioContextSupport() {
        // basic audio context detection
        let audioContextSupported = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (typeof window.webkitAudioContext !== 'undefined') {
            audioContextSupported = true;
        }
        else if (typeof AudioContext !== 'undefined') {
            audioContextSupported = true;
        }
        return audioContextSupported;
    }
    detectAudioElementSupport() {
        // basic audio element detection
        return !!document.createElement('audio').canPlayType;
    }
    async _createAudioBufferSourceNode() {
        const audioContext = await this.getAudioContext();
        return audioContext.createBufferSource();
    }
    async _createMediaElementAudioSourceNode() {
        if (this._mediaElementAudioSourceNode === null && this._audioElement !== null) {
            const audioContext = await this.getAudioContext();
            // createMediaElementSource: https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createMediaElementSource
            this._mediaElementAudioSourceNode = audioContext.createMediaElementSource(this._audioElement);
        }
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
    async _destroyAudioContext() {
        if (this._audioContext !== null && this._audioContext.state !== 'closed') {
            await this._audioContext.close();
            this._audioContext = null;
        }
    }
    async shutDown(songsQueue) {
        this._removeFirstUserInteractionEventListeners();
        songsQueue.forEach((sound) => {
            this.disconnectSound(sound);
        });
        this._destroyMediaElementAudioSourceNode();
        this._destroyAudioBufferSourceNode();
        this._disconnectPlayerGainNode();
        await this._destroyAudioContext();
    }
    async _getPlayerGainNode() {
        // the player (master) gain node
        let gainNode;
        if (this._audioNodes.gainNode instanceof GainNode) {
            gainNode = this._audioNodes.gainNode;
        }
        else {
            const audioContext = await this.getAudioContext();
            // Note: a volume control (GainNode) should always
            // be the last node that gets connected
            // so that volume changes take immediate effect
            gainNode = audioContext.createGain();
            this._initializeVolume(gainNode);
            // final audio graph step: connect the gain node to the audio destination node
            gainNode.connect(audioContext.destination);
            this._audioNodes.gainNode = gainNode;
        }
        return gainNode;
    }
    _disconnectPlayerGainNode() {
        if (this._audioNodes.gainNode !== null) {
            this._audioNodes.gainNode.disconnect();
            this._audioNodes.gainNode = null;
        }
    }
    async connectSound(sound, onEndedCallback) {
        if (sound.isConnectToPlayerGain) {
            return;
        }
        if (this._options.loadPlayerMode === 'player_mode_ajax') {
            // get a new audio buffer source node
            // Note: remember these are "one use" only
            // https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode
            const audioBufferSourceNode = await this._createAudioBufferSourceNode();
            // create the sound gain node
            sound.gainNode = audioBufferSourceNode.context.createGain();
            // connect the source to the sound gain node
            audioBufferSourceNode.connect(sound.gainNode);
            // do we loop this song?
            audioBufferSourceNode.loop = sound.loop;
            // NOTE: the source nodes onended handler won't have any effect if the loop property
            // is set to true, as the audio won't stop playing
            audioBufferSourceNode.onended = onEndedCallback;
            sound.sourceNode = audioBufferSourceNode;
        }
        else if (this._options.loadPlayerMode === 'player_mode_audio') {
            await this._createAudioElementAndSource();
            // create the sound gain node
            sound.gainNode = this._mediaElementAudioSourceNode.context.createGain();
            // connect the source to the sound gain node
            this._mediaElementAudioSourceNode.connect(sound.gainNode);
            // do we loop this song
            this._mediaElementAudioSourceNode.mediaElement.loop = sound.loop;
            // NOTE: the source nodes onended handler won't have any effect if the loop property
            // is set to true, as the audio won't stop playing
            this._mediaElementAudioSourceNode.mediaElement.onended = onEndedCallback;
            sound.sourceNode = this._mediaElementAudioSourceNode;
        }
        // set the gain by default always to 1
        sound.gainNode.gain.value = 1;
        const playerGainNode = await this._getPlayerGainNode();
        sound.gainNode.connect(playerGainNode);
        sound.isConnectToPlayerGain = true;
    }
    async disconnectSound(sound) {
        if (!sound.isConnectToPlayerGain) {
            return;
        }
        if (sound.sourceNode !== null) {
            sound.sourceNode.disconnect();
            // we set the source node to null, so that it can get garbage collected
            // as specified in the specs: you can't reuse an audio buffer source node,
            // after it got stopped
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
    }
    async _changePlayerGainValue(gainValue) {
        if (this._audioNodes.gainNode instanceof GainNode) {
            const audioContext = await this.getAudioContext();
            const timeConstantInMilliseconds = (!isNaN(this._options.volumeTransitionTime) && this._options.volumeTransitionTime > 0) ? this._options.volumeTransitionTime : 100;
            const timeConstantInSeconds = timeConstantInMilliseconds / 1000;
            try {
                this._audioNodes.gainNode.gain.setTargetAtTime(gainValue, audioContext.currentTime, timeConstantInSeconds);
            }
            catch (error) {
                console.error('gainValue: ' + gainValue + ' ' + error);
            }
        }
    }
    async setVolume(volume, forceUpdateUserVolume = true) {
        // we sometimes change the volume, for a fade in/out or when muting, but
        // in this cases we don't want to update the user's persisted volume, in
        // which case forceUpdateUserVolume is false else it would be true
        if (this._options.persistVolume && forceUpdateUserVolume) {
            localStorage.setItem('WebAudioAPIPlayerVolume', volume.toString());
        }
        // the gain values we use range from 0 to 1
        // so we need to divide the volume (in percent) by 100 to get the gain value
        const newGainValue = volume / 100;
        if (this._audioNodes.gainNode instanceof GainNode) {
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/EPSILON
            const currentGainRounded = Math.round((this._audioNodes.gainNode.gain.value + Number.EPSILON) * 100) / 100;
            // check if the volume changed
            if (newGainValue !== currentGainRounded) {
                // Note to self: the gain value changes the amplitude of the sound wave
                // a gain value set to 1 does nothing
                // values between 0 and 1 reduce the loudness, above 1 they amplify the loudness
                // negative values work too, but they invert the waveform
                // so -1 is as loud as 1 but with -1 the waveform is inverted
                await this._changePlayerGainValue(newGainValue);
            }
        }
        this._volume = volume;
        return volume;
    }
    getVolume() {
        let volume;
        // check if volume has already been set
        if (this._volume !== null) {
            volume = this._volume;
        }
        else if (this._options.persistVolume) {
            // if persist volume is enabled
            // check if there already is a user volume in localstorage
            const userVolumeInPercent = parseInt(localStorage.getItem('WebAudioAPIPlayerVolume'));
            volume = userVolumeInPercent;
        }
        // if still no value, fallback to default options value
        if (typeof volume === 'undefined' || isNaN(volume)) {
            if (!isNaN(this._options.volume)) {
                volume = this._options.volume;
            }
            else {
                volume = 80;
                console.error('player options volume is not a number');
            }
        }
        this._volume = volume;
        return volume;
    }
    _initializeVolume(gainNode) {
        if (this._options.persistVolume) {
            // if persist volume is enabled
            // check if there already is a user volume in localstorage
            const userVolumeInPercent = parseInt(localStorage.getItem('WebAudioAPIPlayerVolume'));
            const gainValue = userVolumeInPercent / 100;
            if (!isNaN(userVolumeInPercent)) {
                gainNode.gain.value = gainValue;
            }
            this._volume = userVolumeInPercent;
        }
        // if no "user volume" got found
        // take the default options volume
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
            // third parameter is for "async", should already be "true" by default
            // but who knows maybe a browser vendor decides to change it
            // so I prefer to explicitly set it to "true" just in case
            xhr.open('GET', requested.url, true);
            // set the expected response type from the server to arraybuffer
            xhr.responseType = 'arraybuffer';
            xhr.onload = function () {
                // gets called even for example a code 404, so check the status is in the 2xx range
                if (xhr.status >= 200 && xhr.status <= 299) {
                    resolve(xhr.response);
                }
                else {
                    // status code is not 2xx, reject with an error
                    reject(new Error(xhr.statusText + '(status:' + xhr.status + ')'));
                }
            };
            xhr.onprogress = function (event) {
                const loadingPercentageRaw = 100 / (event.total / event.loaded);
                const loadingPercentage = Math.round(loadingPercentageRaw);
                // update value on sound object
                requested.loadingProgress = loadingPercentage;
                if (requested.onLoading !== null) {
                    requested.onLoading(loadingPercentage, event.total, event.loaded);
                }
            };
            // also reject for any kind of network errors
            xhr.onerror = function (error) {
                reject(error);
            };
            xhr.send();
        });
    }
}

const PLAYER_MODE_AUDIO = 'player_mode_audio';
const WHERE_IN_QUEUE_AT_END = 'append';
const VISIBILITY_HIDDEN_ACTION_PAUSE = 'visibility_hidden_action_pause';
class PlayerCore {
    constructor(playerOptions = {}) {
        // playing progress animation frame request id
        this._playingProgressRequestId = null;
        // value of the volume before it got muted
        this._postMuteVolume = null;
        // is playing before visibility is hidden event
        this._postVisibilityHiddenPlaying = null;
        this._progressTrigger = (sound, timestamp) => {
            const currentSound = this._getSoundFromQueue({ whichSound: PlayerCore.CURRENT_SOUND });
            // I had a lot of trouble cancelling the animation frame
            // this is why I added this check
            // often onended would get called by even though I do
            // a cancel in _stop() the animation frame would still repeat
            if (sound.id !== currentSound.id || currentSound.state !== PlayerSound.SOUND_STATE_PLAYING) {
                return;
            }
            // throttle requests, use time set in options and
            // make sure that at least that amount is elapsed 
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
                    // execute playing progress callback
                    sound.onPlaying(playingPercentage, duration, currentTime);
                    this._playingProgressPreviousTimestamp = timestamp;
                }
            }
            // request animation frame loop
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
            visibilityWatch: false,
            visibilityHiddenAction: VISIBILITY_HIDDEN_ACTION_PAUSE,
            unlockAudioOnFirstUserInteraction: false,
            persistVolume: true,
            loadPlayerMode: PLAYER_MODE_AUDIO,
            audioContext: null,
            addAudioElementsToDom: false,
            volumeTransitionTime: 100,
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
            volumeTransitionTime: this._options.volumeTransitionTime,
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
    async resetQueue() {
        if (this._options.stopOnReset) {
            await this.stop();
        }
        this._queue.forEach((sound) => {
            this._playerAudio.disconnectSound(sound);
        });
        this._queue = [];
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
    setLoopQueue(loopQueue) {
        this._options.loopQueue = loopQueue;
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
    async setPosition(soundPositionInPercent) {
        if (soundPositionInPercent < 0 || soundPositionInPercent > 100) {
            throw new Error('soundPositionInPercent must be a number >= 0 and <= 100');
        }
        const currentSound = this._getSoundFromQueue({ whichSound: PlayerCore.CURRENT_SOUND });
        if (currentSound !== null) {
            currentSound.seekPercentage = Math.round(soundPositionInPercent);
            const duration = currentSound.getDuration();
            // if the duration did not get set manually or is not a number
            if (duration === null || isNaN(duration)) {
                // the user can set the sound duration manually but if he didn't the sound
                // needs to get loaded first, to be able to know the duration it has
                await this.loadSound(currentSound, PlayerCore.AFTER_LOADING_SEEK);
            }
            else {
                this._setPosition(currentSound);
            }
        }
    }
    _setPosition(sound) {
        const duration = sound.getDuration();
        // calculate the position in seconds
        const soundPositionInSeconds = (duration / 100) * sound.seekPercentage;
        this.setPositionInSeconds(soundPositionInSeconds, sound);
    }
    async setPositionInSeconds(soundPositionInSeconds, sound) {
        let currentSound = null;
        if (typeof sound !== 'undefined') {
            currentSound = sound;
        }
        else {
            currentSound = this._getSoundFromQueue({ whichSound: PlayerCore.CURRENT_SOUND });
        }
        if (currentSound !== null) {
            // if the given position > duration, set position to duration
            if (!isNaN(currentSound.duration) && (soundPositionInSeconds >= currentSound.duration)) {
                // duration - 0.1 because in safari if currentTime = duration
                // the onended event does not get triggered
                soundPositionInSeconds = currentSound.duration - 0.1;
            }
            const previousState = currentSound.state;
            currentSound.state = PlayerSound.SOUND_STATE_SEEKING;
            if (currentSound.onSeeking !== null) {
                const playTime = soundPositionInSeconds;
                const duration = currentSound.getDuration();
                const seekingPercentageRaw = (playTime / duration) * 100;
                const seekingPercentage = Math.round(seekingPercentageRaw);
                currentSound.onSeeking(seekingPercentage, duration, playTime);
            }
            if (previousState === PlayerSound.SOUND_STATE_PLAYING) {
                // already playing so just change the position
                currentSound.playTime = soundPositionInSeconds;
                if (this._options.loadPlayerMode === PlayerCore.PLAYER_MODE_AJAX) {
                    // in ajax mode (when source is AudioBufferSourceNode) we
                    // need to stop the song and start again at new position
                    currentSound.elapsedPlayTime = soundPositionInSeconds;
                    await this._stop(currentSound);
                }
                else if (this._options.loadPlayerMode === PlayerCore.PLAYER_MODE_AUDIO) {
                    // in audio (element) mode it is easier we can just change the position
                    await this._play(currentSound);
                }
            }
            else {
                // setPositionInSeconds got called and sound is currently not playing
                // only set the sound position but don't play
                currentSound.playTime = soundPositionInSeconds;
            }
        }
    }
    async loadSound(sound, afterLoadingAction) {
        switch (this._options.loadPlayerMode) {
            case PlayerCore.PLAYER_MODE_AUDIO:
                await this._loadSoundUsingAudioElement(sound, afterLoadingAction);
                break;
            case PlayerCore.PLAYER_MODE_AJAX:
                await this._loadSoundUsingRequest(sound, afterLoadingAction);
                break;
            case PlayerCore.PLAYER_MODE_FETCH:
                // TODO: implement fetch (?)
                console.warn(PlayerCore.PLAYER_MODE_FETCH + ' is not implemented yet');
                break;
        }
        return sound;
    }
    async _loadSoundUsingAudioElement(sound, afterLoadingAction) {
        // extract the url and codec from sources
        const { url, codec = null } = this._findBestSource(sound.source);
        sound.url = url;
        sound.codec = codec;
        if (sound.url !== null) {
            sound.audioElement = await this._playerAudio.getAudioElement();
            // loading progress
            // https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/progress_event
            sound.audioElement.onprogress = () => {
                // if for some external reason the audio element
                // has disappeared, then we exit early 
                if (!sound.audioElement) {
                    return;
                }
                if (sound.audioElement.buffered.length) {
                    let loadingPercentage;
                    const buffered = sound.audioElement.buffered.end(0);
                    const duration = sound.getDuration();
                    if (typeof duration !== 'undefined') {
                        const loadingPercentageRaw = 100 / (duration / buffered);
                        loadingPercentage = Math.round(loadingPercentageRaw);
                    }
                    sound.loadingProgress = loadingPercentage;
                    if (sound.onLoading !== null) {
                        sound.onLoading(loadingPercentage, duration, buffered);
                    }
                    if (loadingPercentage === 100) {
                        sound.isBuffering = false;
                        sound.isBuffered = true;
                        sound.audioBufferDate = new Date();
                    }
                }
            };
            const canPlayThroughHandler = async () => {
                // if for some external reason the audio element
                // has disappeared, then we exit early 
                if (!sound.audioElement) {
                    return;
                }
                // we don't need the listener anymore
                sound.audioElement.removeEventListener('canplaythrough', canPlayThroughHandler);
                sound.isReadyToPLay = true;
                // duration should now be available
                // if it got set manually don't overwrite it
                if (!isNaN(sound.audioElement.duration) && !sound.durationSetManually) {
                    sound.duration = sound.audioElement.duration;
                }
                switch (afterLoadingAction) {
                    case PlayerCore.AFTER_LOADING_SEEK:
                        this._setPosition(sound);
                        break;
                    case PlayerCore.AFTER_LOADING_PLAY:
                        this._play(sound);
                        break;
                }
            };
            sound.audioElement.addEventListener('canplaythrough', canPlayThroughHandler);
            // in chrome you will get this error message in the console:
            // "MediaElementAudioSource outputs zeroes due to CORS access restrictions"
            // to fix this put crossOrigin to anonymous or change the cors
            // Access-Control-Allow-Origin header of the server to *
            // "crossOrigin" has to be set before "src"
            sound.audioElement.crossOrigin = 'anonymous';
            sound.audioElement.src = sound.url;
            // https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/load
            sound.audioElement.load();
        }
        else {
            //reject(new Error('sound has no url'));
            throw new Error('sound has no url');
        }
    }
    async _loadSoundUsingRequest(sound, afterLoadingAction) {
        // check for audio buffer before array buffer, because if one exist the other
        // should exist too and is better for performance to reuse audio buffer
        // decoding an array buffer is an expensive task even on modern hardware
        // TODO: commented out for now, there is a weird bug when reusing the
        // audio buffer, somehow the onended callback gets triggered in a loop
        /*if (sound.audioBuffer !== null) {
            return;
        }*/
        // user provided array buffer
        if (sound.arrayBuffer !== null) {
            return await this._decodeSound(sound);
        }
        // extract the url and codec from sources
        const { url, codec = null } = this._findBestSource(sound.source);
        sound.url = url;
        sound.codec = codec;
        if (sound.url !== null) {
            const request = new PlayerRequest();
            sound.isBuffering = true;
            const arrayBuffer = await request.getArrayBuffer(sound);
            sound.arrayBuffer = arrayBuffer;
            await this._decodeSound(sound, afterLoadingAction);
        }
        else {
            throw new Error('sound has no url');
        }
    }
    async _decodeSound(sound, afterLoadingAction) {
        // make a copy of the array buffer first
        // because the decoding will detach the array buffer
        // https://github.com/WebAudio/web-audio-api/issues/1175
        const arrayBufferCopy = sound.arrayBuffer.slice(0);
        const audioBuffer = await this._playerAudio.decodeAudio(arrayBufferCopy);
        // duration should now be available
        // if it got set manually don't overwrite it
        if (!isNaN(audioBuffer.duration) && !sound.durationSetManually) {
            sound.duration = audioBuffer.duration;
        }
        sound.audioBuffer = audioBuffer;
        sound.isBuffering = false;
        sound.isBuffered = true;
        sound.audioBufferDate = new Date();
        sound.isReadyToPLay = true;
        switch (afterLoadingAction) {
            case PlayerCore.AFTER_LOADING_SEEK:
                this._setPosition(sound);
                break;
            case PlayerCore.AFTER_LOADING_PLAY:
                this._play(sound);
                break;
        }
    }
    async play({ whichSound, playTimeOffset } = {}) {
        const currentSound = this._getSoundFromQueue({ whichSound: PlayerCore.CURRENT_SOUND });
        // whichSound is optional, if set it can be the sound id (string or number)
        // or it can be these 4 constants: PLAY_SOUND_NEXT, PLAY_SOUND_PREVIOUS,
        // PLAY_SOUND_FIRST, PLAY_SOUND_LAST
        const sound = this._getSoundFromQueue({ whichSound, updateIndex: true });
        // if there is no sound we could play, do nothing
        if (sound === null) {
            return sound;
        }
        // if there is a sound currently being played
        // AND the current sound is the same sound as the one that will now be played
        if (currentSound !== null
            && (currentSound.state === PlayerSound.SOUND_STATE_PLAYING)
            && (currentSound.id === sound.id)) {
            if (!isNaN(playTimeOffset)) {
                // sound is already playing but a playTimeOffset got set
                // so we just need to seek
                this.setPositionInSeconds(playTimeOffset);
                return sound;
            }
            else {
                // sound is already playing, do nothing
                return sound;
            }
        }
        // if there is a sound currently being played OR paused
        // AND the current sound is NOT the same sound as the one that will now be played
        if (currentSound !== null
            && (currentSound.state === PlayerSound.SOUND_STATE_PLAYING || currentSound.state === PlayerSound.SOUND_STATE_PAUSED)
            && (currentSound.id !== sound.id)) {
            // stop the current sound
            currentSound.state = PlayerSound.SOUND_STATE_STOPPED;
            await this._stop(currentSound);
        }
        // if the user wants to play the sound from a certain position
        // then playTimeOffset should be a number and not undefined
        if (!isNaN(playTimeOffset)) {
            sound.playTimeOffset = playTimeOffset;
        }
        else {
            sound.playTimeOffset = 0;
        }
        if (sound.sourceNode === null) {
            // connect the source to the gain (graph) node
            await this._playerAudio.connectSound(sound, () => {
                this._onEnded();
            });
        }
        if (!sound.isReadyToPLay) {
            await this.loadSound(sound, PlayerCore.AFTER_LOADING_PLAY);
        }
        else {
            await this._play(sound);
        }
        return sound;
    }
    async _play(sound) {
        if (sound.state === PlayerSound.SOUND_STATE_PLAYING) {
            return;
        }
        if (this._playerAudio.isAudioContextFrozen()) {
            await this._playerAudio.unfreezeAudioContext();
        }
        if (sound.playTimeOffset > 0) {
            sound.playTime = sound.playTimeOffset;
        }
        if (this._options.loadPlayerMode === PlayerCore.PLAYER_MODE_AJAX) {
            await this._playAudioBuffer(sound);
        }
        else if (this._options.loadPlayerMode === PlayerCore.PLAYER_MODE_AUDIO) {
            await this._playMediaElementAudio(sound);
        }
        // the AudioBufferSourceNode does not have events (other than onended)
        // the playbackState got removed:
        // https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Migrating_from_webkitAudioContext#changes_to_determining_playback_state
        // for the AudioElement we could use the play event to trigger the next two lines!?
        // https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement#events
        sound.state = PlayerSound.SOUND_STATE_PLAYING;
        this._triggerSoundCallbacks(sound);
    }
    async _playAudioBuffer(sound) {
        // AudioBufferSourceNode type guard
        if (sound.sourceNode instanceof AudioBufferSourceNode) {
            // on play, seek, pause, always reset the sound startTime (current context time)
            sound.startTime = sound.sourceNode.context.currentTime;
            // add the audio buffer to the source node
            sound.sourceNode.buffer = sound.audioBuffer;
            // start playback
            // start(when, offset, duration)
            try {
                if (sound.state === PlayerSound.SOUND_STATE_SEEKING) {
                    sound.sourceNode.start(0, sound.playTime);
                }
                else if (sound.state === PlayerSound.SOUND_STATE_PAUSED && sound.playTimeOffset === 0) {
                    sound.sourceNode.start(0, sound.playTime);
                }
                else {
                    if (sound.playTimeOffset > 0) {
                        // round duration up as numbers are not integers
                        // so sometimes it is a tiny bit above
                        if (sound.playTimeOffset > Math.ceil(sound.duration)) {
                            console.warn('playTimeOffset > sound duration');
                        }
                        // if an offset is defined start playing at that position
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
    }
    async _playMediaElementAudio(sound) {
        // MediaElementAudioSourceNode type guard
        if (sound.sourceNode instanceof MediaElementAudioSourceNode) {
            if (sound.state === PlayerSound.SOUND_STATE_SEEKING) {
                sound.audioElement.currentTime = sound.playTime;
            }
            else if (sound.state === PlayerSound.SOUND_STATE_PAUSED && sound.playTimeOffset === 0) {
                sound.audioElement.currentTime = sound.playTime;
            }
            else {
                // if an offset is defined start playing at that position
                if (sound.playTimeOffset > 0) {
                    // round duration up as numbers are not integers
                    // so sometimes it is a tiny bit above
                    if (sound.playTimeOffset > Math.ceil(sound.duration)) {
                        console.warn('playTimeOffset > duration');
                    }
                    sound.audioElement.currentTime = sound.playTimeOffset;
                }
                else {
                    sound.audioElement.currentTime = 0;
                }
            }
            return await sound.audioElement.play();
        }
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
            // reset progress timestamp
            this._playingProgressPreviousTimestamp = 0;
            // "request animation frame" callback has an argument, which
            // is the timestamp when the callback gets called
            // as this is the first call set timestamp manually to zero
            this._progressTrigger(sound, 0);
        }
        else {
            this._playingProgressRequestId = null;
        }
        return;
    }
    async _onEnded() {
        if (this._options.playNextOnEnded) {
            const currentSound = this._getSoundFromQueue({ whichSound: PlayerCore.CURRENT_SOUND });
            if (currentSound !== null) {
                // when we set the sound to paused...
                // audio buffer will trigger onEnded because we actually stop the song
                // audio element will not trigger onEnded as we pause the song
                // this is why, for audio buffer (ajax) sounds we check if they have
                // the playing state before triggering the next sound
                // if stopped, seeking or pause we do nothing
                if (this._options.loadPlayerMode === PlayerCore.PLAYER_MODE_AUDIO ||
                    (this._options.loadPlayerMode === PlayerCore.PLAYER_MODE_AJAX && currentSound.state === PlayerSound.SOUND_STATE_PLAYING)) {
                    const nextSound = this._getSoundFromQueue({ whichSound: PlayerCore.PLAY_SOUND_NEXT });
                    let willPlayNext = false;
                    // check if there is another sound in the queue
                    if (nextSound !== null) {
                        willPlayNext = true;
                    }
                    if (!willPlayNext) {
                        await this._playerAudio.freezeAudioContext();
                    }
                    if (currentSound.onEnded !== null) {
                        currentSound.onEnded(willPlayNext);
                    }
                    try {
                        if (willPlayNext) {
                            await this.next();
                        }
                    }
                    catch (error) {
                        console.error(error);
                    }
                }
                if (this._options.loadPlayerMode === PlayerCore.PLAYER_MODE_AJAX && currentSound.state === PlayerSound.SOUND_STATE_SEEKING) {
                    try {
                        // audio buffer source nodes get destroyed on stop
                        // this is why in ajax mode we need to do a fresh start when seeking
                        await this.play(currentSound);
                    }
                    catch (error) {
                        console.error(error);
                    }
                }
            }
        }
    }
    _getSoundFromQueue({ whichSound, updateIndex = false } = {}) {
        let sound = null;
        let soundIndex = null;
        // check if the queue is empty
        if (this._queue.length === 0) {
            return sound;
        }
        // if which sound to play did not get specified
        // we set it to the current sound by default
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
                    // if last sound is playing and loop queue is enabled
                    // then on onEnded we go from last to first sound
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
                    // if first sound of the queue is playing and loop queue is enabled
                    // then if previous() gets used, we jump to last sound in queue
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
                // if "which sound to play" is a soundId
                // Note: soundId can be a string or number
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
            else {
                return false;
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
        // if the source is not an array but a single source object
        // we first transform it into an array
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
            // if the player has set the baseUrl option for sounds, use it now
            if (this._options.soundsBaseUrl !== '') {
                soundUrl = this._options.soundsBaseUrl;
            }
            soundUrl += source.url;
            // check if the codec (if any got specified) is supported
            // by the device
            let isCodecSupported = true;
            if (source.codec !== null) {
                isCodecSupported = this._checkCodecSupport(source.codec);
            }
            if (isCodecSupported) {
                if (source.isPreferred) {
                    // if multiple sources but this one if preferred and if previous
                    // sources also had a supported codec we still overwrite the
                    // previous match
                    bestSource.url = soundUrl;
                    bestSource.codec = source.codec;
                    // as the source is marked as preferred and it is supported
                    // so we can exit early
                    break;
                }
                else {
                    // if no best source has been found so far, we don't
                    // care if it's preferred it's automatically chosen
                    // as being the best
                    bestSource.url = soundUrl;
                    bestSource.codec = source.codec;
                    // source is supported, but maybe there is preferred & supported
                    // so we don't exit the loop just yet and continue searching
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
                error = 'unrecognized codec';
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
    async pause() {
        const currentSound = this._getSoundFromQueue({ whichSound: PlayerCore.CURRENT_SOUND });
        if (currentSound === null) {
            return currentSound;
        }
        if (currentSound.state === PlayerSound.SOUND_STATE_PAUSED) {
            return currentSound;
        }
        const currentTime = currentSound.getCurrentTime();
        currentSound.playTime = currentTime;
        if (this._options.loadPlayerMode === PlayerCore.PLAYER_MODE_AJAX) {
            currentSound.elapsedPlayTime = currentTime;
        }
        if (currentSound.onPaused !== null) {
            currentSound.onPaused(currentSound.playTime);
        }
        currentSound.state = PlayerSound.SOUND_STATE_PAUSED;
        await this._stop(currentSound);
        return currentSound;
    }
    async stop() {
        const currentSound = this._getSoundFromQueue({ whichSound: PlayerCore.CURRENT_SOUND });
        if (currentSound === null) {
            return currentSound;
        }
        if (currentSound.state === PlayerSound.SOUND_STATE_STOPPED) {
            return currentSound;
        }
        // on stop we freeze the audio context
        // as we assume it won't be needed right away
        await this._playerAudio.freezeAudioContext();
        if (currentSound.onStopped !== null) {
            currentSound.onStopped(currentSound.playTime);
        }
        currentSound.state = PlayerSound.SOUND_STATE_STOPPED;
        await this._stop(currentSound);
        return currentSound;
    }
    async _stop(sound) {
        if (this._playingProgressRequestId !== null) {
            cancelAnimationFrame(this._playingProgressRequestId);
            this._playingProgressRequestId = null;
        }
        if (sound.sourceNode !== null) {
            if (sound.sourceNode instanceof AudioBufferSourceNode) {
                // if using the AudioBufferSourceNode use the stop method
                sound.sourceNode.stop(0);
                // the "audio buffer" CAN be reused for multiple plays
                // however the "audio buffer source" CAN NOT, so we disconnect
                await this._playerAudio.disconnectSound(sound);
            }
            if (sound.sourceNode instanceof MediaElementAudioSourceNode) {
                // if using the MediaElementAudioSourceNode use the pause method
                sound.audioElement.pause();
            }
        }
        // if it is fully stopped, not just paused (or seeking)
        if (sound.state === PlayerSound.SOUND_STATE_STOPPED) {
            // reset sound values
            sound.isReadyToPLay = false;
            sound.firstTimePlayed = true;
            sound.startTime = 0;
            sound.elapsedPlayTime = 0;
            sound.playTime = 0;
            sound.playedTimePercentage = 0;
            // disconnect the sound
            await this._playerAudio.disconnectSound(sound);
        }
    }
    async next() {
        return await this.play({ whichSound: PlayerCore.PLAY_SOUND_NEXT });
    }
    async previous() {
        return await this.play({ whichSound: PlayerCore.PLAY_SOUND_PREVIOUS });
    }
    async first() {
        return await this.play({ whichSound: PlayerCore.PLAY_SOUND_FIRST });
    }
    async last() {
        return await this.play({ whichSound: PlayerCore.PLAY_SOUND_LAST });
    }
    setVisibilityWatch(visibilityWatch) {
        this._options.visibilityWatch = visibilityWatch;
        if (visibilityWatch) {
            document.addEventListener('visibilitychange', this._handleVisibilityChange.bind(this), false);
        }
        else {
            document.removeEventListener('visibilitychange', this._handleVisibilityChange.bind(this), false);
        }
    }
    getVisibilityWatch() {
        return this._options.visibilityWatch;
    }
    setVisibilityHiddenAction(visibilityHiddenAction) {
        this._options.visibilityHiddenAction = visibilityHiddenAction;
    }
    getVisibilityHiddenAction() {
        return this._options.visibilityHiddenAction;
    }
    _handleVisibilityChange() {
        let hiddenKeyword;
        if (typeof document.hidden !== 'undefined') {
            // Opera 12.10 and Firefox 18 and later support
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
            if (this._options.visibilityHiddenAction === PlayerCore.VISIBILITY_HIDDEN_ACTION_PAUSE) {
                const currentSound = this._getSoundFromQueue({ whichSound: PlayerCore.CURRENT_SOUND });
                if (currentSound === null) {
                    return;
                }
                if (currentSound.state === PlayerSound.SOUND_STATE_PLAYING) {
                    this.pause();
                    this._postVisibilityHiddenPlaying = true;
                }
                else {
                    this._postVisibilityHiddenPlaying = false;
                }
            }
            else if (this._options.visibilityHiddenAction === PlayerCore.VISIBILITY_HIDDEN_ACTION_MUTE) {
                this.mute();
            }
        }
        else {
            if (this._options.visibilityHiddenAction === PlayerCore.VISIBILITY_HIDDEN_ACTION_PAUSE && this._postVisibilityHiddenPlaying === true) {
                this.play();
            }
            else if (this._options.visibilityHiddenAction === PlayerCore.VISIBILITY_HIDDEN_ACTION_MUTE) {
                this.unMute();
            }
        }
    }
    async manuallyUnlockAudio() {
        await this._playerAudio.unlockAudio();
    }
    async disconnect() {
        // adding another check here to cancel animation frame because:
        // a player can be disconnect while song is paused or playing
        // which means the cancelAnimationFrame in _stop would never get triggered
        if (this._playingProgressRequestId !== null) {
            cancelAnimationFrame(this._playingProgressRequestId);
            this._playingProgressRequestId = null;
        }
        await this._playerAudio.shutDown(this._queue);
    }
    async getAudioContext() {
        const audioContext = await this._playerAudio.getAudioContext();
        return audioContext;
    }
    getCurrentSound() {
        return this._getSoundFromQueue({ whichSound: PlayerCore.CURRENT_SOUND });
    }
}
// constants
PlayerCore.WHERE_IN_QUEUE_AT_END = 'append';
PlayerCore.WHERE_IN_QUEUE_AT_START = 'prepend';
PlayerCore.AFTER_LOADING_SEEK = 'after_loading_seek';
PlayerCore.AFTER_LOADING_PLAY = 'after_loading_play';
PlayerCore.PLAY_SOUND_NEXT = 'next';
PlayerCore.PLAY_SOUND_PREVIOUS = 'previous';
PlayerCore.PLAY_SOUND_FIRST = 'first';
PlayerCore.PLAY_SOUND_LAST = 'last';
PlayerCore.CURRENT_SOUND = 'current';
PlayerCore.PLAYER_MODE_AUDIO = 'player_mode_audio';
PlayerCore.PLAYER_MODE_AJAX = 'player_mode_ajax';
PlayerCore.PLAYER_MODE_FETCH = 'player_mode_fetch';
PlayerCore.VISIBILITY_HIDDEN_ACTION_MUTE = 'visibility_hidden_action_mute';
PlayerCore.VISIBILITY_HIDDEN_ACTION_PAUSE = 'visibility_hidden_action_pause';

export { PlayerCore, PlayerSound };
//# sourceMappingURL=index.js.map

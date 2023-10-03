import { ISound } from './sound';

type OnEndedCallbackType = (event: Event) => void

export interface IAudioOptions {
    audioContext: AudioContext;
    unlockAudioOnFirstUserInteraction: boolean;
    volume: number;
    persistVolume: boolean;
    loadPlayerMode: string;
    addAudioElementsToDom: boolean;
}

// https://developer.mozilla.org/en-US/docs/Web/API/AudioNode
export interface IAudioNodes {
    // https://developer.mozilla.org/en-US/docs/Web/API/GainNode
    gainNode: GainNode;
    // https://developer.mozilla.org/en-US/docs/Web/API/PannerNode
    pannerNode?: PannerNode;
    // https://developer.mozilla.org/en-US/docs/Web/API/StereoPannerNode
    stereoPannerNode?: StereoPannerNode;
    // https://developer.mozilla.org/en-US/docs/Web/API/DelayNode
    delayNode?: DelayNode;
    // https://developer.mozilla.org/en-US/docs/Web/API/ScriptProcessorNode
    scriptProcessorNode?: ScriptProcessorNode;
    // https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode
    analyserNode?: AnalyserNode;
    // https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode
    biquadFilterNode?: BiquadFilterNode;
    // https://developer.mozilla.org/en-US/docs/Web/API/ChannelMergerNode
    channelMergeNode?: ChannelMergerNode;
    // https://developer.mozilla.org/en-US/docs/Web/API/ChannelSplitterNode
    channelSplitterNode?: ChannelSplitterNode;
    // https://developer.mozilla.org/en-US/docs/Web/API/ConvolverNode
    convolverNode?: ConvolverNode;
    // https://developer.mozilla.org/en-US/docs/Web/API/DynamicsCompressorNode
    dynamicCompressorNode?: DynamicsCompressorNode;
    // https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode
    oscillatorNode?: OscillatorNode;
    // https://developer.mozilla.org/en-US/docs/Web/API/WaveShaperNode
    waveShaperNode?: WaveShaperNode;
}

export class PlayerAudio {

    protected _options;
    protected _audioContext: AudioContext = null;
    protected _volume: number = null;
    protected _audioNodes: IAudioNodes = {
        gainNode: null,
    };
    protected _audioElement: HTMLAudioElement = null;
    protected _mediaElementAudioSourceNode: MediaElementAudioSourceNode = null;
    protected _isAudioUnlocked: boolean = false;
    protected _isAudioUnlocking: boolean = false;

    constructor(options: IAudioOptions) {

        this._options = options;

        this._initialize();

    }

    protected _initialize(): void {

        // I was planning on using the "first user interaction hack" only (on mobile)
        // to check if the autoplay policy prevents me from playing a sound
        // programmatically (without user click)
        // https://developer.mozilla.org/en-US/docs/Web/API/Navigator/getAutoplayPolicy
        // but this feature is only implemented on firefox (as of 19.09.2023)

        if (this._options.unlockAudioOnFirstUserInteraction) {
            this._addFirstUserInteractionEventListeners();
        }

    }

    public getAudioNodes() {
        return this._audioNodes;
    }

    public async decodeAudio(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {

        const audioContext = await this.getAudioContext();

        // Note to self:
        // the new decodeAudioData returns a promise, older versions accept as second
        // and third parameter, which are a success and an error callback funtion
        // https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/decodeAudioData

        return await audioContext.decodeAudioData(arrayBuffer);

    }

    protected _createAudioContext(): Promise<void> {

        if (this._audioContext instanceof AudioContext) {
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const WebAudioContext: typeof AudioContext = window.AudioContext || (window as any).webkitAudioContext;

        // initialize the audio context
        if (this._options.audioContext !== null) {
            this._audioContext = this._options.audioContext;
        } else {
            this._audioContext = new WebAudioContext();
        }

    }

    protected _addFirstUserInteractionEventListeners(): void {

        if (this._options.unlockAudioOnFirstUserInteraction) {
            document.addEventListener('keydown', this.unlockAudio.bind(this));
            document.addEventListener('mousedown', this.unlockAudio.bind(this));
            document.addEventListener('pointerdown', this.unlockAudio.bind(this));
            document.addEventListener('pointerup', this.unlockAudio.bind(this));
            document.addEventListener('touchend', this.unlockAudio.bind(this));
        }

    }

    protected _removeFirstUserInteractionEventListeners(): void {

        if (this._options.unlockAudioOnFirstUserInteraction) {
            document.removeEventListener('keydown', this.unlockAudio.bind(this));
            document.removeEventListener('mousedown', this.unlockAudio.bind(this));
            document.removeEventListener('pointerdown', this.unlockAudio.bind(this));
            document.removeEventListener('pointerup', this.unlockAudio.bind(this));
            document.removeEventListener('touchend', this.unlockAudio.bind(this));
        }

    }

    public unlockAudio(): Promise<void> {

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

    protected async _createAudioElementAndSource(): Promise<void> {

        await this._createAudioElement();

        await this._createMediaElementAudioSourceNode();

    }

    protected async _createAudioElement(forceCreate?: boolean): Promise<void> {

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

    }

    public async getAudioElement(): Promise<HTMLAudioElement> {

        if (this._audioElement === null) {
            await this._createAudioElementAndSource();
        }

        return this._audioElement;

    }

    public async getAudioContext(): Promise<AudioContext> {

        if (this._audioContext === null || this._audioContext.state === 'closed') {
            await this._createAudioContext();
        } else if (this._audioContext.state === 'suspended') {
            await this.unfreezeAudioContext();
        }

        return this._audioContext;

    }

    public unfreezeAudioContext(): Promise<void> {

        // did resume get implemented
        if (typeof this._audioContext.resume === 'undefined') {

            // this browser does not support resume
            // just send back a promise as resume would do
            return Promise.resolve();

        } else {

            // resume the audio hardware access
            // audio context resume returns a promise
            // https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/resume
            return this._audioContext.resume();

        }

    }

    public freezeAudioContext(): Promise<void> {

        // did suspend get implemented
        if (typeof this._audioContext.suspend === 'undefined') {

            return Promise.resolve();

        } else {

            // halt the audio hardware access temporarily to reduce CPU and battery usage
            // especially useful on mobile to prevent battery drain
            return this._audioContext.suspend();

        }

    }

    public isAudioContextFrozen(): boolean {

        return this._audioContext.state === 'suspended' ? true : false;

    }

    public detectAudioContextSupport(): boolean {

        // basic audio context detection
        let audioContextSupported = false;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (typeof (window as any).webkitAudioContext !== 'undefined') {
            audioContextSupported = true;
        } else if (typeof AudioContext !== 'undefined') {
            audioContextSupported = true;
        }

        return audioContextSupported;

    }

    public detectAudioElementSupport(): boolean {

        // basic audio element detection
        return !!document.createElement('audio').canPlayType;

    }

    protected async _createAudioBufferSourceNode(): Promise<AudioBufferSourceNode> {

        const audioContext = await this.getAudioContext();

        return audioContext.createBufferSource();

    }

    protected async _createMediaElementAudioSourceNode(): Promise<void> {

        if (this._mediaElementAudioSourceNode === null && this._audioElement !== null) {

            const audioContext = await this.getAudioContext();

            // createMediaElementSource: https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createMediaElementSource
            this._mediaElementAudioSourceNode = audioContext.createMediaElementSource(this._audioElement);

        }

    }

    protected _destroyMediaElementAudioSourceNode(): void {

        if (this._mediaElementAudioSourceNode !== null) {

            if (typeof this._mediaElementAudioSourceNode.mediaElement !== 'undefined') {
                this._mediaElementAudioSourceNode.mediaElement.remove();
            }

            this._mediaElementAudioSourceNode.disconnect();
            this._mediaElementAudioSourceNode = null;
        }

    }

    protected _destroyAudioBufferSourceNode(): void {

        if (this._mediaElementAudioSourceNode !== null) {

            this._mediaElementAudioSourceNode.disconnect();

        }

    }

    protected async _destroyAudioContext(): Promise<void> {

        if (this._audioContext !== null && this._audioContext.state !== 'closed') {
            await this._audioContext.close();
            this._audioContext = null;
        }

    }

    public async shutDown(songsQueue: ISound[]): Promise<void> {

        this._removeFirstUserInteractionEventListeners();

        songsQueue.forEach((sound) => {
            this.disconnectSound(sound);
        });

        this._destroyMediaElementAudioSourceNode();
        this._destroyAudioBufferSourceNode();

        this._disconnectPlayerGainNode();

        await this._destroyAudioContext();

    }


    protected async _getPlayerGainNode(): Promise<GainNode> {

        // the player (master) gain node
        let gainNode: GainNode;

        if (this._audioNodes.gainNode instanceof GainNode) {

            gainNode = this._audioNodes.gainNode;

        } else {

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

    protected _disconnectPlayerGainNode(): void {

        if (this._audioNodes.gainNode !== null) {
            this._audioNodes.gainNode.disconnect();
            this._audioNodes.gainNode = null;
        }

    }

    public async connectSound(sound: ISound, onEndedCallback: OnEndedCallbackType): Promise<void> {

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

        } else if (this._options.loadPlayerMode === 'player_mode_audio') {

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

    public async disconnectSound(sound: ISound): Promise<void> {

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

    protected async _changePlayerGainValue(gainValue: number): Promise<void> {

        if (this._audioNodes.gainNode instanceof GainNode) {
            const audioContext = await this.getAudioContext();
            this._audioNodes.gainNode.gain.setTargetAtTime(gainValue, audioContext.currentTime, 0.1);
        }

    }

    public async setVolume(volume: number, forceUpdateUserVolume = true): Promise<number> {

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

    public getVolume(): number {

        let volume: number;

        // check if volume has already been set
        if (this._volume !== null) {
            volume = this._volume;
        } else {
            if (this._options.persistVolume) {
                // if persist volume is enabled
                // check if there already is a user volume in localstorage
                const userVolumeInPercent = parseInt(localStorage.getItem('WebAudioAPIPlayerVolume'));

                if (!isNaN(userVolumeInPercent)) {
                    volume = userVolumeInPercent;
                }
            }

            // if volume is not persisted
            // or the persited value has not been set yet
            if (typeof volume === 'undefined') {
                volume = this._options.volume;
            }
            this._volume = volume;
        }

        return volume;

    }

    protected _initializeVolume(gainNode: GainNode): void {

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

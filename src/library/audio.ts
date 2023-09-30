import { ISound } from './sound';

type OnEndedCallbackType = (event: Event) => void

export interface IAudioOptions {
    audioContext: AudioContext;
    createAudioContextOnFirstUserInteraction: boolean;
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

    constructor(options: IAudioOptions) {

        this._options = options;

        this._initialize();

    }

    protected _initialize(): void {

        // I was planning on using the "first user interaction hack" only (on mobile)
        // for this I would have checked the if the autoplay policy prevents me
        // from playing a sound programmatically (without user click)
        // https://developer.mozilla.org/en-US/docs/Web/API/Navigator/getAutoplayPolicy
        // but this feature is only implemented on firefox (as of 19.09.2023)

        if (this._options.createAudioContextOnFirstUserInteraction) {
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

        console.log('>>> _createAudioContext()')

        if (this._audioContext instanceof AudioContext) {
            // if already created, no need to create a new one
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

        if (this._options.createAudioContextOnFirstUserInteraction) {
            document.addEventListener('touchstart', this.unlockAudio.bind(this));
            document.addEventListener('touchend', this.unlockAudio.bind(this));
            document.addEventListener('mousedown', this.unlockAudio.bind(this));
        }

    }

    protected _removeFirstUserInteractionEventListeners(): void {

        if (this._options.createAudioContextOnFirstUserInteraction) {
            document.removeEventListener('touchstart', this.unlockAudio.bind(this));
            document.removeEventListener('touchend', this.unlockAudio.bind(this));
            document.removeEventListener('mousedown', this.unlockAudio.bind(this));
        }

    }

    public unlockAudio(): Promise<void> {

        return new Promise((resolve, reject) => {

            console.log('>>> unlockAudio()')

            console.log('this._isAudioUnlocked: ', this._isAudioUnlocked)

            if (this._isAudioUnlocked) {
                resolve();
            }

            // make sure the audio context is not suspended
            // on android this is what unlocks audio
            this.getAudioContext().then(() => {

                console.log('### this.getAudioContext().then()')

                // create an (empty) buffer
                const placeholderBuffer = this._audioContext.createBuffer(1, 1, 22050);

                // https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/createBufferSource
                let bufferSource = this._audioContext.createBufferSource();

                bufferSource.onended = () => {

                    console.log('### bufferSource.onended()')

                    bufferSource.disconnect(0);

                    this._removeFirstUserInteractionEventListeners();

                    bufferSource.disconnect(0);

                    bufferSource.buffer = null;
                    bufferSource = null;

                    if (this._options.loadPlayerMode === 'player_mode_audio') {

                        // on iOS (mobile) the audio element you want to use needs to have been created
                        // as a direct result of an user interaction
                        // after it got unlocked we re-use that element for all sounds
                        this._createAudioElementAndSource().then(() => {

                            console.log('### this._createAudioElementAndSource().then()')

                            this._isAudioUnlocked = true;
                            resolve();
                        }).catch(reject);

                    } else if (this._options.loadPlayerMode === 'player_mode_ajax') {
                        this._isAudioUnlocked = true;
                        resolve();
                    }

                };

                bufferSource.buffer = placeholderBuffer;
                bufferSource.connect(this._audioContext.destination);
                bufferSource.start(0);

                console.log('### bufferSource.start(0)')

            }).catch(reject);

        });

    }

    protected async _createAudioElementAndSource(): Promise<void> {

        await this._createAudioElement();

        await this._createMediaElementAudioSourceNode();

    }

    protected async _createAudioElement(): Promise<void> {

        if (this._audioElement === null) {

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

    public getAudioElement(): HTMLAudioElement {

        return this._audioElement;

    }

    public async getAudioContext(): Promise<AudioContext> {

        console.log('>>> getAudioContext()')

        if (this._audioContext === null || this._audioContext.state === 'closed') {
            await this._createAudioContext();
        } else if (this._audioContext.state === 'suspended') {
            await this.unfreezeAudioContext();
        }

        return this._audioContext;

    }

    public unfreezeAudioContext(): Promise<void> {

        console.log('>>> unfreezeAudioContext()')

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

        if (this._mediaElementAudioSourceNode === null) {

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

            // final step: connect the gain node to the audio destination node
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
            // Note: remember these are one use only
            // https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode
            const audioBufferSourceNode = await this._createAudioBufferSourceNode();

            // create the sound gain node
            sound.gainNode = audioBufferSourceNode.context.createGain();

            // connect the source to the sound gain node
            audioBufferSourceNode.connect(sound.gainNode);

            // do we loop this song
            audioBufferSourceNode.loop = sound.loop;

            // NOTE: the source nodes onended handler won't have any effect if the loop property
            // is set to true, as the audio won't stop playing
            audioBufferSourceNode.onended = onEndedCallback;

            sound.sourceNode = audioBufferSourceNode;

        } else if (this._options.loadPlayerMode === 'player_mode_audio') {

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
        // TODO: allow user to define a gain value for each sound via sound options
        // this allows to normalize the gain of all sounds in a playlist
        // TODO: in future allow a sound gain to be faded in or out
        // without having to change the main player gain
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

                // the gain value changes the amplitude of the sound wave
                // a gain value of one does nothing
                // values between 0 and 1 reduce the loudness, above one they amplify the loudness
                // negative values work too, but they invert the waveform, so -1 is as loud as 1
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
                // if persist volume is enabled, check if there is a user volume in localstorage
                const userVolumeInPercent = parseInt(localStorage.getItem('WebAudioAPIPlayerVolume'));

                if (!isNaN(userVolumeInPercent)) {
                    volume = userVolumeInPercent;
                }
            }

            // if volume is not persisted or persited value not yet set
            if (typeof volume === 'undefined') {
                volume = this._options.volume;
            }
            this._volume = volume;
        }

        return volume;

    }

    protected _initializeVolume(gainNode: GainNode): void {

        if (this._options.persistVolume) {
            // if persist volume is enabled, check if there is a user volume in localstorage
            const userVolumeInPercent = parseInt(localStorage.getItem('WebAudioAPIPlayerVolume'));
            const gainValue = userVolumeInPercent / 100;

            if (!isNaN(userVolumeInPercent)) {
                gainNode.gain.value = gainValue;
            }

            this._volume = userVolumeInPercent;
        }


        // if no user volume take the default options volume
        if (this._volume === null) {
            const gainValue = this._options.volume / 100;
            gainNode.gain.value = gainValue;
            this._volume = this._options.volume;
        }

    }

}

import { ISound } from './sound';
import { PlayerError } from './error';

export interface IAudioOptions {
    audioContext: AudioContext;
    createAudioContextOnFirstUserInteraction: boolean;
    volume: number;
    persistVolume: boolean;
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

interface IOnSourceNodeEnded {
    (event?: Event): void
}

export interface IAudioBufferSourceOptions extends AudioBufferSourceOptions {
    onSourceNodeEnded: IOnSourceNodeEnded;
}

export interface IMediaElementAudioSourceOptions extends MediaElementAudioSourceOptions {
    onSourceNodeEnded: IOnSourceNodeEnded;
    // add a loop here to match AudioBufferSourceOptions which has a loop
    loop: boolean;
}

export class PlayerAudio {

    protected _options;
    protected _audioContext: AudioContext = null;
    protected _volume: number = null;
    protected _audioNodes: IAudioNodes = {
        gainNode: null,
    };

    constructor(options: IAudioOptions) {

        this._options = options;

        this._initialize();

    }

    protected _initialize(): void {

        if (this._options.createAudioContextOnFirstUserInteraction) {
            this._addAutoCreateAudioContextOnFirstUserInteractionEventListeners();
        }

    }

    public async decodeAudio(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {

        const audioContext = await this.getAudioContext();

        // Note to self:
        // newer decodeAudioData returns promise, older accept as second
        // and third parameter a success and an error callback funtion
        // https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/decodeAudioData

        const audioBufferPromise = await audioContext.decodeAudioData(arrayBuffer);

        // decodeAudioData returns a promise of type PromiseLike
        // using resolve to return a promise of type Promise
        return Promise.resolve(audioBufferPromise);

    }

    protected _createAudioContext(): Promise<void> {

        return new Promise((resolve, reject) => {

            // check if we already have an audio context
            if (this._audioContext instanceof AudioContext) {
                // if we do, no need to create a new one
                resolve();
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const WebAudioContext: typeof AudioContext = window.AudioContext || (window as any).webkitAudioContext;

            // initialize the audio context
            try {
                if (this._options.audioContext !== null) {
                    this._audioContext = this._options.audioContext;
                } else {
                    this._audioContext = new WebAudioContext();
                }
                resolve();
            } catch (error) {
                reject(error);
            }

        });

    }

    protected _addAutoCreateAudioContextOnFirstUserInteractionEventListeners(): void {

        if (this._options.createAudioContextOnFirstUserInteraction) {
            document.addEventListener('touchstart', this.getAudioContext.bind(this));
            document.addEventListener('touchend', this.getAudioContext.bind(this));
            document.addEventListener('mousedown', this.getAudioContext.bind(this));
        }

    }

    protected _removeAutoCreateAudioContextOnFirstUserInteractionEventListeners(): void {

        if (this._options.createAudioContextOnFirstUserInteraction) {
            document.removeEventListener('touchstart', this.getAudioContext.bind(this));
            document.removeEventListener('touchend', this.getAudioContext.bind(this));
            document.removeEventListener('mousedown', this.getAudioContext.bind(this));
        }

    }

    public async getAudioContext(): Promise<AudioContext> {

        if (this._audioContext === null) {
            await this._createAudioContext();
        } else if (this._audioContext.state === 'suspended') {
            await this._unfreezeAudioContext();
        }

        return this._audioContext;

    }

    protected _unfreezeAudioContext(): Promise<void> {

        // did resume get implemented
        if (typeof this._audioContext.suspend === 'undefined') {

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

    public async shutDown(songsQueue: ISound[]): Promise<void> {

        this._removeAutoCreateAudioContextOnFirstUserInteractionEventListeners();

        // if media element source also destroy the media element? (for each song?)
        songsQueue.forEach((sound) => {
            if (sound.sourceNode instanceof MediaElementAudioSourceNode) {
                if (typeof sound.sourceNode.mediaElement !== 'undefined') {
                    // clone the element to remove all listeners
                    // commented out remove listeners as media element is removed, so if there
                    // is no reference to it, the listeners should get removed too
                    //sound.sourceNode.mediaElement.replaceWith(sound.sourceNode.mediaElement.cloneNode(true));
                    // call its own remove method
                    sound.sourceNode.mediaElement.remove();
                }
            } else if (sound.sourceNode instanceof AudioBufferSourceNode) {
                // 
            }
        });

        this._disconnectPlayerGainNode();

        await this._destroyAudioContext();

    }

    protected async _destroyAudioContext(): Promise<void> {

        if (this._audioContext !== null) {
            await this._audioContext.close();
            this._audioContext = null;
        }

    }

    public async createAudioBufferSourceNode(audioBufferSourceOptions: IAudioBufferSourceOptions, sound: ISound): Promise<void> {

        const audioContext = await this.getAudioContext();

        const audioBufferSourceNode: AudioBufferSourceNode = audioContext.createBufferSource();

        sound.sourceNode = audioBufferSourceNode;

        // do we loop this song
        audioBufferSourceNode.loop = audioBufferSourceOptions.loop;

        // create the sound gain node
        sound.gainNode = audioBufferSourceNode.context.createGain();

        // set the gain by default always to 1
        // TODO: allow user to define a gain value for each sound via sound options
        // TODO: future allow a sound gain to be faded out at end
        // (faded in at start) without changing the main player gain
        sound.gainNode.gain.value = 1;

        // connect the source to the sound gain node
        audioBufferSourceNode.connect(sound.gainNode);

        // if the song ends destroy it's audioGraph as the source can't be reused anyway
        // NOTE: the source nodes onended handler won't have any effect if the loop property is set to
        // true, as the audio won't stop playing. To see the effect in this case you'd
        // have to use AudioBufferSourceNode.stop()
        audioBufferSourceNode.onended = (event: Event): void => {
            audioBufferSourceOptions.onSourceNodeEnded(event);
        };

    }

    public async createMediaElementSourceNode(sourceNodeOptions: IMediaElementAudioSourceOptions, sound: ISound): Promise<void> {

        let mediaElementAudioSourceNode: MediaElementAudioSourceNode;

        if (sound.sourceNode === null) {

            const audioContext = await this.getAudioContext();

            try {
                // createMediaElementSource: https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createMediaElementSource
                mediaElementAudioSourceNode = audioContext.createMediaElementSource(sourceNodeOptions.mediaElement) as MediaElementAudioSourceNode;
            } catch (error) {
                throw new PlayerError(error);
            }

            // do we loop this song
            mediaElementAudioSourceNode.mediaElement.loop = sourceNodeOptions.loop;

            // create the sound gain node
            sound.gainNode = mediaElementAudioSourceNode.context.createGain();

            sound.gainNode.gain.value = 1;

            // connect the source to the sound gain node
            mediaElementAudioSourceNode.connect(sound.gainNode);

            // MediaElementSource: https://developer.mozilla.org/en-US/docs/Web/API/MediaElementAudioSourceNode/mediaElement

            // NOTE: the source nodes onended handler won't have any effect if the loop property is set to
            // true, as the audio won't stop playing. To see the effect in this case you'd
            // have to use AudioBufferSourceNode.stop()
            mediaElementAudioSourceNode.mediaElement.onended = async (): Promise<void> => {
                sourceNodeOptions.onSourceNodeEnded();
            };

            sound.sourceNode = mediaElementAudioSourceNode;

        }

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

            // final step: connect the gain node to the audio destination node
            gainNode.connect(audioContext.destination);

            this._audioNodes.gainNode = gainNode;

        }

        this._initializeVolume()

        return gainNode;

    }

    protected _disconnectPlayerGainNode(): void {

        this._audioNodes.gainNode.disconnect();

        this._audioNodes.gainNode = null;

    }

    public async connectSound(sound: ISound): Promise<void> {

        const playerGainNode = await this._getPlayerGainNode();
        const soundGainNode = sound.gainNode;

        if (soundGainNode !== null) {
            soundGainNode.connect(playerGainNode);
        }

    }

    public async disconnectSound(sound: ISound): Promise<void> {

        if (sound.gainNode !== null) {
            //sound.gainNode.disconnect();
        } else {
            throw new PlayerError('can\'t destroy as no source node in sound');
        }

        if (sound.sourceNode instanceof AudioBufferSourceNode) {
            // the audio buffer source node we set it to undefined, to let it get destroyed
            // by the garbage collector as you can't reuse an audio buffer source node
            // (after it got stopped) as specified in the specs
            sound.sourceNode = null;
        }

    }

    protected _changePlayerGainValue(gainValue: number): void {

        if (this._audioNodes.gainNode instanceof GainNode) {
            this._audioNodes.gainNode.gain.value = gainValue;
        }

    }

    protected _roundGainTwoDecimals(rawGainValue: number): number {

        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/EPSILON
        return Math.round((rawGainValue + Number.EPSILON) * 100) / 100

    }

    public setVolume(volume: number, forceUpdateUserVolume = true) {

        // we sometimes change the volume, for a fade in/out or when muting, but
        // in this cases we don't want to update the user's persisted volume, in
        // which case forceUpdateUserVolume is false else it would be true
        if (this._options.persistVolume && forceUpdateUserVolume) {
            localStorage.setItem('WebAudioAPIPlayerVolume', volume.toString());
        }

        // the gain values we use range from 0 to 1
        // so we need to divide the volume (in percent) by 100 to get the gain value
        const gainValue = volume / 100;

        if (this._audioNodes.gainNode instanceof GainNode) {

            const roundedGain = this._roundGainTwoDecimals(this._audioNodes.gainNode.gain.value)

            // check if the volume changed
            if (roundedGain !== this._volume) {

                // the gain value changes the amplitude of the sound wave
                // a gain value of one does nothing
                // values between 0 and 1 reduce the loudness, above one they amplify the loudness
                // negative values work too, but they invert the waveform, so -1 is as loud as 1
                this._changePlayerGainValue(gainValue);

            }

        }

        this._volume = volume;

    }

    public getVolume(): number {

        let volume: number

        // check if volume has already been set
        if (this._volume !== null) {
            volume = this._volume
        } else {
            if (this._options.persistVolume) {
                // if persist volume is enabled, check if there is a user volume in localstorage
                const userVolumeInPercent = parseInt(localStorage.getItem('WebAudioAPIPlayerVolume'));
    
                if (!isNaN(userVolumeInPercent)) {
                    volume = userVolumeInPercent
                }
            }

            // if volume is not persisted or persited value not yet set
            if (typeof volume === 'undefined') {
                volume = this._options.volume
            }
        }

        return volume

    }

    protected _initializeVolume(): void {

        if (this._options.persistVolume) {
            // if persist volume is enabled, check if there is a user volume in localstorage
            const userVolumeInPercent = parseInt(localStorage.getItem('WebAudioAPIPlayerVolume'));

            if (!isNaN(userVolumeInPercent)) {
                this.setVolume(userVolumeInPercent, false);
            }
        }

        // if no user volume take the default options volume
        if (this._volume === null) {
            this.setVolume(this._options.volume, false);
        }

    }

}

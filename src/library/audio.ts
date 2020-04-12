import { typeSoundModes } from './core';
import { ISound } from './sound';
import { PlayerError } from './error';

// Note to self: AudioGraph documentation
// https://developer.mozilla.org/en-US/docs/Web/API/AudioNode

interface IAudioGraph {
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

interface IAudioOptions {
    customAudioContext?: AudioContext;
    customAudioGraph?: IAudioGraph;
    createAudioContextOnFirstUserInteraction?: boolean;
    persistVolume: boolean;
    loadSoundMode: typeSoundModes;
}

interface IAudioBufferSourceOptions extends AudioBufferSourceOptions {
    onEnded: Function;
    /* AudioBufferSourceOptions:
    AudioBuffer? buffer;
    float detune = 0;
    boolean loop = false;
    double loopEnd = 0;
    double loopStart = 0;
    float playbackRate = 1;
    */
}

interface IMediaElementAudioSourceOptions extends MediaElementAudioSourceOptions {
    onEnded: Function;
    /* MediaElementAudioSourceOptions:
    required HTMLMediaElement mediaElement;
    */
   loop: boolean;
}

interface IMediaElementAudioSourceNode extends MediaElementAudioSourceNode {
    onended: Function;
    loop: boolean;
}

export interface IChangeVolumeOptions { 
    volume: number;
    sound?: ISound;
    forceUpdateUserVolume?: boolean;
}

class PlayerAudio {

    protected _volume: number;
    protected _audioContext: AudioContext | null = null;
    protected _audioGraph: IAudioGraph | null = null;
    protected _createAudioContextOnFirstUserInteraction: boolean;
    protected _persistVolume: boolean;
    protected _loadSoundMode: typeSoundModes;

    constructor(options: IAudioOptions) {

        this.setPersistVolume(options.persistVolume);
        this._setAutoCreateContextOnFirstTouch(options.createAudioContextOnFirstUserInteraction);
        this.setLoadSoundMode(options.loadSoundMode);

        this.setAudioContext(options.customAudioContext);

        if (options.customAudioContext === null) {
            this._autoCreateAudioContextOnFirstUserInteraction();
        }

        if (!this._createAudioContextOnFirstUserInteraction) {
            // if the autdioContext shouldn't be created on first user
            // interaction, we create it during initialization
            this.getAudioContext().catch(() => {
                throw new PlayerError('audio context setup failed');
            });
        }

        this.setAudioGraph(options.customAudioGraph);

    }

    public async decodeAudio(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {

        const audioContext = await this.getAudioContext();

        // Note to self:
        // newer decodeAudioData returns promise, older accept as second
        // and third parameter a success and an error callback funtion
        // https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/decodeAudioData

        const audioBufferPromise = audioContext.decodeAudioData(arrayBuffer);

        // decodeAudioData returns a promise of type PromiseLike
        // using resolve to return a promise of type Promise
        return Promise.resolve(audioBufferPromise);

    }

    protected _createAudioContext(): Promise<void> {

        return new Promise((resolve, reject) => {

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const MyAudioContext: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;

            // initialize the audio context
            try {
                this._audioContext = new MyAudioContext();
                resolve();
            } catch (error) {
                reject(error);
            }

        });

    }

    protected _autoCreateAudioContextRemoveListener(): void {

        document.removeEventListener('touchstart', this._autoCreateAudioContextRemoveListener.bind(this), false);
        document.removeEventListener('touchend', this._autoCreateAudioContextRemoveListener.bind(this), false);
        document.removeEventListener('mousedown', this._autoCreateAudioContextRemoveListener.bind(this), false);

        this.getAudioContext().catch(() => {
            throw new PlayerError('audio context setup failed');
        });

    }

    protected _autoCreateAudioContextOnFirstUserInteraction(): void {

        if (this._createAudioContextOnFirstUserInteraction) {
            document.addEventListener('touchstart', this._autoCreateAudioContextRemoveListener.bind(this), false);
            document.addEventListener('touchend', this._autoCreateAudioContextRemoveListener.bind(this), false);
            document.addEventListener('mousedown', this._autoCreateAudioContextRemoveListener.bind(this), false);
        }

    }

    public getAudioContext(): Promise<AudioContext> {

        return new Promise((resolve, reject) => {

            if (this._audioContext === null) {

                this._createAudioContext().then(() => {
                    resolve(this._audioContext);
                }).catch(reject);

            } else if (this._audioContext.state === 'suspended') {

                this._unfreezeAudioContext().then(() => {
                    resolve(this._audioContext);
                });

            } else if (this._audioContext.state === 'running') {

                resolve(this._audioContext);

            } else {
                // TODO: are other states possible?
                console.log('audioContext.state: ', this._audioContext.state);
            }

        });

    }

    public setAudioContext(audioContext: AudioContext): void {

        if (this._audioContext !== null) {

            this._destroyAudioContext().then(() => {

                this._setAudioContext(audioContext);

            });

        } else {

            this._setAudioContext(audioContext);

        }

    }

    protected _setAudioContext(audioContext: AudioContext): void {

        this._audioContext = audioContext;

    }

    protected async _destroyAudioContext(): Promise<void> {

        await this._audioContext.close();

        this._audioContext = null;

    }

    public _unfreezeAudioContext(): Promise<void> {

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

    public _freezeAudioContext(): Promise<void> {

        // did suspend get implemented
        if (typeof this._audioContext.suspend === 'undefined') {

            return Promise.resolve();

        } else {

            // halt the audio hardware access temporarily to reduce CPU and battery usage
            return this._audioContext.suspend();

        }

    }

    public setAudioGraph(audioGraph: IAudioGraph): void {

        if (this._audioGraph !== null) {
            this._destroyAudioGraph();
        }

        // check if there is gain node
        if (audioGraph !== null &&
            (!('gainNode' in audioGraph)
                || audioGraph.gainNode === null
                || audioGraph.gainNode === undefined)
        ) {

            this.getAudioContext().then((audioContext: AudioContext) => {

                audioGraph.gainNode = audioContext.createGain();

                this._audioGraph = audioGraph;

            });

        } else {

            this._audioGraph = audioGraph;

        }

    }

    public getAudioGraph(): Promise<IAudioGraph> {

        return new Promise((resolve, reject) => {

            if (this._audioGraph !== null) {

                resolve(this._audioGraph);

            } else {

                this._createAudioGraph()
                    .then((audioGraph: IAudioGraph) => {

                        this._audioGraph = audioGraph;

                        resolve(audioGraph);

                    }).catch(reject);

            }

        });

    }

    protected _createAudioGraph(): Promise<IAudioGraph> {

        return new Promise((resolve, reject) => {

            this.getAudioContext().then((audioContext: AudioContext) => {

                if (!this._audioGraph) {

                    this._audioGraph = {
                        gainNode: audioContext.createGain()
                    };

                }

                // connect the gain node to the destination (speakers)
                // https://developer.mozilla.org/en-US/docs/Web/API/AudioDestinationNode
                this._audioGraph.gainNode.connect(audioContext.destination);

                // update the gainValue (volume)
                const gainValue = this._volume / 100;

                this._changeGainValue(gainValue);

                // resolve
                resolve(this._audioGraph);

            }).catch(reject);

        });

    }

    protected _destroyAudioGraph(): void {

        if (this._audioGraph !== null) {
            this._audioGraph.gainNode.disconnect();
        }

        // TODO: disconnect other nodes!?

        this._audioGraph = null;

    }

    public async createAudioBufferSourceNode(audioBufferSourceOptions: IAudioBufferSourceOptions, sound: ISound): Promise<void> {

        const audioContext = await this.getAudioContext();

        const audioBufferSourceNode: AudioBufferSourceNode = audioContext.createBufferSource();

        sound.audioBufferSourceNode = audioBufferSourceNode;

        // do we loop this song
        audioBufferSourceNode.loop = audioBufferSourceOptions.loop;

        // if the song ends destroy it's audioGraph as the source can't be reused anyway
        // NOTE: the onended handler won't have any effect if the loop property is set to
        // true, as the audio won't stop playing. To see the effect in this case you'd
        // have to use AudioBufferSourceNode.stop()
        audioBufferSourceNode.onended = (event: Event): void => {
            audioBufferSourceOptions.onEnded(event);
            this.destroySourceNode(sound);
        };

    }

    public async createMediaElementSourceNode(sourceNodeOptions: IMediaElementAudioSourceOptions, sound: ISound): Promise<void> {

        const audioContext = await this.getAudioContext();
        let mediaElementAudioSourceNode: IMediaElementAudioSourceNode;

        try {
            mediaElementAudioSourceNode = audioContext.createMediaElementSource(sourceNodeOptions.mediaElement) as IMediaElementAudioSourceNode;
        } catch (error) {
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
        mediaElementAudioSourceNode.onended = (): void => {
            this.destroySourceNode(sound);
            // TODO on end destroy the audio element, probably not if loop enabled, but if loop
            // is disabled, maybe still a good idea to keep it (cache?), but not all audio elements
            // because of memory consumption if suddenly hundreds of audio elements in one page
        };

    }

    public connectSourceNodeToGraphNodes(sourceNode: AudioBufferSourceNode | IMediaElementAudioSourceNode): void {

        // audio routing graph
        this.getAudioGraph().then((audioGraph: IAudioGraph) => {

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

    }

    public destroySourceNode(sound: ISound): void {

        // destroy the source node
        if (sound.audioBufferSourceNode !== null) {

            sound.audioBufferSourceNode.disconnect();

        } else if (sound.mediaElementAudioSourceNode !== null) {

            sound.mediaElementAudioSourceNode.disconnect();

        } else {
            throw new PlayerError('can\'t destroy as no source node in sound');
        }

        // the audio buffer source node we set it to null, to let it get destroyed
        // by the garbage collector as you can't reuse an audio buffer source node
        // (after it got stopped) as specified in the specs
        sound.audioBufferSourceNode = null;

        // an media element source node can be reused (there is no stop method, only
        // a pause method) so we don't set it to null
        //sound.mediaElementAudioSourceNode = null;

    }

    public changeVolume({ volume, sound = null, forceUpdateUserVolume = true }: IChangeVolumeOptions): number {

        if (this._persistVolume) {

            const userVolume = parseInt(localStorage.getItem('WebAudioAPIPlayerVolume'));

            // we sometimes change the volume, for a fade in/out or when muting, but
            // in this cases we don't want to update the user's persisted volume, in
            // which case forceUpdateUserVolume is false else it would be true
            if (!isNaN(userVolume) && !forceUpdateUserVolume) {
                volume = userVolume;
            } else {
                if (forceUpdateUserVolume) {
                    localStorage.setItem('WebAudioAPIPlayerVolume', volume.toString());
                }
            }

        }

        // update the player volume / gain value
        const volumeLevel = volume / 100;

        if (sound !== null) {
            sound.audioElement.volume = volumeLevel;
        } else {
            this._changeGainValue(volumeLevel);
        }

        this._volume = volume;

        return volume;

    }

    protected _changeGainValue(gainValue: number): void {

        this.getAudioGraph().then((audioGraph: IAudioGraph) => {

            audioGraph.gainNode.gain.value = gainValue;

        });

    }

    protected _setAutoCreateContextOnFirstTouch(autoCreate: boolean): void {

        // protected as this can only be used during initialization, if false
        // the audioContext is created by default during Initialization and this
        // can't be undone or changed later on
        this._createAudioContextOnFirstUserInteraction = autoCreate;

    }

    public setPersistVolume(persistVolume: boolean): void {

        this._persistVolume = persistVolume;

    }

    public getPersistVolume(): boolean {

        return this._persistVolume;

    }

    public setLoadSoundMode(loadSoundMode: typeSoundModes): void {

        this._loadSoundMode = loadSoundMode;

    }

    public getLoadSoundMode(): typeSoundModes {

        return this._loadSoundMode;

    }

}

export { PlayerAudio, IAudioGraph, IAudioOptions, IAudioBufferSourceOptions, IMediaElementAudioSourceOptions, IMediaElementAudioSourceNode };

import { ISound } from './sound';
export interface IAudioOptions {
    audioContext: AudioContext;
    createAudioContextOnFirstUserInteraction: boolean;
    volume: number;
    persistVolume: boolean;
}
export interface IAudioNodes {
    gainNode: GainNode;
    pannerNode?: PannerNode;
    stereoPannerNode?: StereoPannerNode;
    delayNode?: DelayNode;
    scriptProcessorNode?: ScriptProcessorNode;
    analyserNode?: AnalyserNode;
    biquadFilterNode?: BiquadFilterNode;
    channelMergeNode?: ChannelMergerNode;
    channelSplitterNode?: ChannelSplitterNode;
    convolverNode?: ConvolverNode;
    dynamicCompressorNode?: DynamicsCompressorNode;
    oscillatorNode?: OscillatorNode;
    waveShaperNode?: WaveShaperNode;
}
interface IOnSourceNodeEnded {
    (event?: Event): void;
}
export interface IAudioBufferSourceOptions extends AudioBufferSourceOptions {
    onSourceNodeEnded: IOnSourceNodeEnded;
}
export interface IMediaElementAudioSourceOptions extends MediaElementAudioSourceOptions {
    onSourceNodeEnded: IOnSourceNodeEnded;
    loop: boolean;
}
export declare class PlayerAudio {
    protected _options: IAudioOptions;
    protected _audioContext: AudioContext;
    protected _volume: number;
    protected _audioNodes: IAudioNodes;
    constructor(options: IAudioOptions);
    protected _initialize(): void;
    decodeAudio(arrayBuffer: ArrayBuffer): Promise<AudioBuffer>;
    protected _createAudioContext(): Promise<void>;
    protected _addAutoCreateAudioContextOnFirstUserInteractionEventListeners(): void;
    protected _removeAutoCreateAudioContextOnFirstUserInteractionEventListeners(): void;
    getAudioContext(): Promise<AudioContext>;
    protected _unfreezeAudioContext(): Promise<void>;
    freezeAudioContext(): Promise<void>;
    detectAudioContextSupport(): boolean;
    detectAudioElementSupport(): boolean;
    shutDown(songsQueue: ISound[]): Promise<void>;
    protected _destroyAudioContext(): Promise<void>;
    createAudioBufferSourceNode(audioBufferSourceOptions: IAudioBufferSourceOptions, sound: ISound): Promise<void>;
    createMediaElementSourceNode(sourceNodeOptions: IMediaElementAudioSourceOptions, sound: ISound): Promise<void>;
    protected _getPlayerGainNode(): Promise<GainNode>;
    protected _disconnectPlayerGainNode(): void;
    connectSound(sound: ISound): Promise<void>;
    disconnectSound(sound: ISound): Promise<void>;
    protected _changePlayerGainValue(gainValue: number): void;
    protected _roundGainTwoDecimals(rawGainValue: number): number;
    setVolume(volume: number, forceUpdateUserVolume?: boolean): void;
    getVolume(): number;
    protected _initializeVolume(): void;
}
export {};

import { ISound } from './sound';
type OnEndedCallbackType = (event: Event) => void;
export interface IAudioOptions {
    audioContext: AudioContext;
    createAudioContextOnFirstUserInteraction: boolean;
    volume: number;
    persistVolume: boolean;
    loadPlayerMode: string;
    addAudioElementsToDom: boolean;
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
export declare class PlayerAudio {
    protected _options: IAudioOptions;
    protected _audioContext: AudioContext;
    protected _volume: number;
    protected _audioNodes: IAudioNodes;
    protected _audioElement: HTMLAudioElement;
    protected _mediaElementAudioSourceNode: MediaElementAudioSourceNode;
    protected _isAudioUnlocked: boolean;
    constructor(options: IAudioOptions);
    protected _initialize(): void;
    getAudioNodes(): IAudioNodes;
    decodeAudio(arrayBuffer: ArrayBuffer): Promise<AudioBuffer>;
    protected _createAudioContext(): Promise<void>;
    protected _addFirstUserInteractionEventListeners(): void;
    protected _removeFirstUserInteractionEventListeners(): void;
    unlockAudio(): Promise<void>;
    protected _createAudioElementAndSource(): Promise<void>;
    protected _createAudioElement(): Promise<void>;
    getAudioElement(): Promise<HTMLAudioElement>;
    getAudioContext(): Promise<AudioContext>;
    unfreezeAudioContext(): Promise<void>;
    freezeAudioContext(): Promise<void>;
    isAudioContextFrozen(): boolean;
    detectAudioContextSupport(): boolean;
    detectAudioElementSupport(): boolean;
    protected _createAudioBufferSourceNode(): Promise<AudioBufferSourceNode>;
    protected _createMediaElementAudioSourceNode(): Promise<void>;
    protected _destroyMediaElementAudioSourceNode(): void;
    protected _destroyAudioBufferSourceNode(): void;
    protected _destroyAudioContext(): Promise<void>;
    shutDown(songsQueue: ISound[]): Promise<void>;
    protected _getPlayerGainNode(): Promise<GainNode>;
    protected _disconnectPlayerGainNode(): void;
    connectSound(sound: ISound, onEndedCallback: OnEndedCallbackType): Promise<void>;
    disconnectSound(sound: ISound): Promise<void>;
    protected _changePlayerGainValue(gainValue: number): Promise<void>;
    setVolume(volume: number, forceUpdateUserVolume?: boolean): Promise<number>;
    getVolume(): number;
    protected _initializeVolume(gainNode: GainNode): void;
}
export {};

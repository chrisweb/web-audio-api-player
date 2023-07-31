import { typePlayerModes } from './core';
import { ISound } from './sound';
interface IAudioGraph {
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
interface IOnEnded {
    (event?: Event): void;
}
interface IAudioOptions {
    customAudioContext?: AudioContext;
    customAudioGraph?: IAudioGraph;
    createAudioContextOnFirstUserInteraction?: boolean;
    persistVolume: boolean;
    loadPlayerMode: typePlayerModes;
}
interface IAudioBufferSourceOptions extends AudioBufferSourceOptions {
    onEnded: IOnEnded;
}
interface IMediaElementAudioSourceOptions extends MediaElementAudioSourceOptions {
    onEnded: IOnEnded;
    loop: boolean;
}
export interface IChangeVolumeOptions {
    volume: number;
    sound?: ISound;
    forceUpdateUserVolume?: boolean;
}
declare class PlayerAudio {
    protected _volume: number;
    protected _audioContext: AudioContext | null;
    protected _audioGraph: IAudioGraph | null;
    protected _createAudioContextOnFirstUserInteraction: boolean;
    protected _persistVolume: boolean;
    protected _loadPlayerMode: typePlayerModes;
    constructor(options: IAudioOptions);
    decodeAudio(arrayBuffer: ArrayBuffer): Promise<AudioBuffer>;
    protected _createAudioContext(): Promise<void>;
    protected _autoCreateAudioContextRemoveListener(): void;
    protected _autoCreateAudioContextOnFirstUserInteraction(): void;
    getAudioContext(): Promise<AudioContext>;
    setAudioContext(audioContext: AudioContext): void;
    protected _setAudioContext(audioContext: AudioContext): void;
    protected _destroyAudioContext(): Promise<void>;
    _unfreezeAudioContext(): Promise<void>;
    _freezeAudioContext(): Promise<void>;
    setAudioGraph(audioGraph: IAudioGraph): void;
    getAudioGraph(): Promise<IAudioGraph>;
    protected _createAudioGraph(): Promise<IAudioGraph>;
    protected _destroyAudioGraph(): void;
    createAudioBufferSourceNode(audioBufferSourceOptions: IAudioBufferSourceOptions, sound: ISound): Promise<void>;
    createMediaElementSourceNode(sourceNodeOptions: IMediaElementAudioSourceOptions, sound: ISound): Promise<void>;
    connectSourceNodeToGraphNodes(sourceNode: AudioBufferSourceNode | MediaElementAudioSourceNode): void;
    destroySourceNode(sound: ISound): void;
    changeVolume({ volume, sound, forceUpdateUserVolume }: IChangeVolumeOptions): number;
    protected _changeGainValue(gainValue: number): void;
    protected _setAutoCreateContextOnFirstTouch(autoCreate: boolean): void;
    setPersistVolume(persistVolume: boolean): void;
    getPersistVolume(): boolean;
    setLoadPlayerMode(loadPlayerMode: typePlayerModes): void;
    getLoadPlayerMode(): typePlayerModes;
}
export { PlayerAudio, IAudioGraph, IAudioOptions, IAudioBufferSourceOptions, IMediaElementAudioSourceOptions };

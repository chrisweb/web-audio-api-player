import { typeSoundModes } from './core';
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
interface IAudioOptions {
    customAudioContext?: AudioContext;
    customAudioGraph?: IAudioGraph;
    createAudioContextOnFirstUserInteraction?: boolean;
    persistVolume: boolean;
    loadSoundMode: typeSoundModes;
}
interface IAudioBufferSourceOptions extends AudioBufferSourceOptions {
    onEnded: Function;
}
interface IMediaElementAudioSourceOptions extends MediaElementAudioSourceOptions {
    onEnded: Function;
    loop: boolean;
}
interface IMediaElementAudioSourceNode extends MediaElementAudioSourceNode {
    onended: Function;
    loop: boolean;
}
declare class PlayerAudio {
    protected _volume: number;
    protected _audioContext: AudioContext | null;
    protected _audioGraph: IAudioGraph | null;
    protected _createAudioContextOnFirstUserInteraction: boolean;
    protected _persistVolume: boolean;
    protected _loadSoundMode: typeSoundModes;
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
    connectSourceNodeToGraphNodes(sourceNode: AudioBufferSourceNode | IMediaElementAudioSourceNode): void;
    destroySourceNode(sound: ISound): void;
    changeVolume({ volume, sound, forceUpdateUserVolume }: {
        volume: number;
        sound?: ISound;
        forceUpdateUserVolume?: boolean;
    }): number;
    protected _changeGainValue(gainValue: number): void;
    protected _setAutoCreateContextOnFirstTouch(autoCreate: boolean): void;
    setPersistVolume(persistVolume: boolean): void;
    getPersistVolume(): boolean;
    setLoadSoundMode(loadSoundMode: typeSoundModes): void;
    getLoadSoundMode(): typeSoundModes;
}
export { PlayerAudio, IAudioGraph, IAudioOptions, IAudioBufferSourceOptions, IMediaElementAudioSourceOptions, IMediaElementAudioSourceNode };

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
    volume: number;
    customAudioContext?: AudioContext;
    customAudioGraph?: IAudioGraph;
}
interface ISourceNodeOptions {
    loop: boolean;
    onEnded: Function;
}
declare class PlayerAudio {
    protected _volume: number;
    protected _audioContext: AudioContext | null;
    protected _contextState: string;
    protected _audioGraph: IAudioGraph | null;
    constructor(options?: IAudioOptions);
    decodeAudio(arrayBuffer: ArrayBuffer): Promise<AudioBuffer>;
    protected _createAudioContext(): AudioContext;
    protected _bindContextStateListener(audioContext: AudioContext): void;
    getAudioContext(): Promise<AudioContext>;
    setAudioContext(audioContext: AudioContext): void;
    protected _setAudioContext(audioContext: AudioContext): void;
    protected _destroyAudioContext(): Promise<void>;
    protected _unfreezeAudioContext(): Promise<void>;
    protected _freezeAudioContext(): Promise<void>;
    setAudioGraph(audioGraph: IAudioGraph): void;
    getAudioGraph(): Promise<IAudioGraph>;
    protected _createAudioGraph(): Promise<IAudioGraph>;
    protected _destroyAudioGraph(): void;
    createSourceNode(sourceNodeOptions: ISourceNodeOptions): Promise<AudioBufferSourceNode>;
    connectSourceNodeToGraphNodes(sourceNode: AudioBufferSourceNode): void;
    destroySourceNode(sourceNode: AudioBufferSourceNode): AudioBufferSourceNode;
    changeGainValue(volume: number): void;
}
export { PlayerAudio, IAudioGraph, IAudioOptions };

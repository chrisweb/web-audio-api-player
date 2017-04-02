/// <reference types="webaudioapi" />
export interface IWaveTable {
}
export interface IAudioContext {
    destination: AudioDestinationNode;
    sampleRate: number;
    currentTime: number;
    listener: AudioListener;
    activeSourceCount: number;
    state: string;
    createBuffer(numberOfChannels: number, length: number, sampleRate: number): AudioBuffer;
    createBuffer(buffer: ArrayBuffer, mixToMono: boolean): AudioBuffer;
    decodeAudioData(audioData: ArrayBuffer, decodeSuccessCallback?: Function, decodeErrorCallback?: Function): void;
    createBufferSource(): AudioBufferSourceNode;
    createMediaElementSource(mediaElement: HTMLMediaElement): MediaElementAudioSourceNode;
    createMediaStreamSource(mediaStreamMediaStream: MediaStream): MediaStreamAudioSourceNode;
    createMediaStreamDestination(): MediaStreamAudioDestinationNode;
    createScriptProcessor(bufferSize: number, numberOfInputChannels?: number, numberOfOutputChannels?: number): ScriptProcessorNode;
    createAnalyser(): AnalyserNode;
    createGain(): GainNode;
    createDelay(maxDelayTime?: number): DelayNode;
    createBiquadFilter(): BiquadFilterNode;
    createWaveShaper(): WaveShaperNode;
    createPanner(): PannerNode;
    createConvolver(): ConvolverNode;
    createChannelSplitter(numberOfOutputs?: number): ChannelSplitterNode;
    createChannelMerger(numberOfInputs?: number): ChannelMergerNode;
    createDynamicsCompressor(): DynamicsCompressorNode;
    createOscillator(): OscillatorNode;
    createWaveTable(real: Float32Array, imag: Float32Array): IWaveTable;
    onstatechange(): void;
    close(): Promise<void>;
    suspend(): Promise<void>;
    resume(): Promise<void>;
}
export interface IAudioGraph {
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
export interface IAudioGraphOptions {
    volume: number;
}
export interface ISourceNodeOptions {
    loop: boolean;
    onEnded: Function;
}
export declare class PlayerAudio {
    protected _audioContext: IAudioContext | null;
    protected _contextState: string;
    protected _audioGraph: IAudioGraph | null;
    constructor(customAudioContext?: IAudioContext, customAudioGraph?: IAudioGraph);
    decodeAudio(arrayBuffer: ArrayBuffer): Promise<AudioBuffer>;
    protected _createAudioContext(): IAudioContext;
    protected _bindContextStateListener(audioContext: IAudioContext): void;
    getAudioContext(): Promise<{}>;
    setAudioContext(audioContext: IAudioContext): void;
    protected _destroyAudioContext(): void;
    protected _unfreezeAudioContext(): Promise<void>;
    protected _freezeAudioContext(): Promise<void>;
    setAudioGraph(audioGraph: IAudioGraph): void;
    getAudioGraph(): IAudioGraph;
    createSourceNode(sourceNodeOptions: ISourceNodeOptions): Promise<AudioBufferSourceNode>;
    connectSourceNodeToGraphNodes(sourceNode: AudioBufferSourceNode): void;
    protected _createAudioGraph(): void;
    protected _destroyAudioGraph(): void;
    destroySourceNode(sourceNode: AudioBufferSourceNode): AudioBufferSourceNode;
    changeGainValue(volume: number): void;
}

export interface IAudioGraph {
    gainNode: GainNode;
    pannerNode?: PannerNode;
    stereoPannerNode?: StereoPannerNode;
}
export interface IAudioGraphOptions {
    volume: number;
}
export interface ISourceNodeOptions {
    loop: boolean;
}
export declare class PlayerAudio {
    protected _context: AudioContext;
    protected _contextState: string;
    protected _audioGraph: IAudioGraph;
    constructor();
    decodeAudio(arrayBuffer: ArrayBuffer): Promise<AudioBuffer>;
    protected _getAudioContext(): Promise<{}>;
    protected _destroyAudioContext(): void;
    protected _unfreezeAudioContext(): Promise<void>;
    protected _freezeAudioContext(): Promise<void>;
    protected _createAudioGraph(): void;
    setAudioGraph(audioGraph: IAudioGraph): void;
    getAudioGraph(): IAudioGraph;
    createSourceNode(sourceNodeOptions: ISourceNodeOptions): Promise<AudioBufferSourceNode>;
    connectSourceNodeToGraph(sourceNode: AudioBufferSourceNode): void;
    protected _destroyAudioGraph(): void;
    destroySourceNode(sourceNode: AudioBufferSourceNode): AudioBufferSourceNode;
    changeGainValue(volume: number): void;
}

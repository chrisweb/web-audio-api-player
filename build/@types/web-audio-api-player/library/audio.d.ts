export interface IAudioGraph {
    sourceNode: AudioBufferSourceNode;
    gainNode: GainNode;
    pannerNode: PannerNode;
}
export declare class PlayerAudio {
    protected _context: AudioContext;
    protected _contextState: string;
    constructor();
    decodeAudio(arrayBuffer: ArrayBuffer): Promise<AudioBuffer>;
    protected _createContext(): void;
    protected _destroyAudioContext(): void;
    protected _freezeAudioContext(): Promise<void>;
    protected _unfreezeAudioContext(): Promise<void>;
    createAudioGraph(): IAudioGraph;
    protected _createAudioGraph(): IAudioGraph;
}

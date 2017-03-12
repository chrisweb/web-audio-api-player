import { IRequested } from './request';
export interface ISoundSource {
    url: string;
    codec?: string;
}
export interface IOnProgress {
    (progress: number, maximumValue: number, currentValue: number): void;
}
export interface IOnEnded {
    (willPlayNext: boolean): void;
}
export interface IOnStarted {
    (): void;
}
export interface ISoundAttributes {
    sources?: (ISoundSource | string)[] | string;
    id: number;
    playlistId?: number | null;
    loop?: boolean;
    onLoading?: IOnProgress;
    onPlaying?: IOnProgress;
    onEnded?: IOnEnded;
    onStarted?: IOnStarted;
    audioBuffer?: AudioBuffer | null;
    arrayBuffer?: ArrayBuffer | null;
    duration?: number | null;
}
export interface ISound extends ISoundAttributes, IRequested {
    sourceNode: AudioBufferSourceNode | null;
    isBuffered: boolean;
    isBuffering: boolean;
    audioBuffer: AudioBuffer | null;
    arrayBuffer: ArrayBuffer | null;
    audioBufferDate: Date | null;
    playTimeOffset: number;
    startTime: number;
    playTime: number;
    playedTimePercentage: number;
    isPlaying: boolean;
    sources: (ISoundSource | string)[];
    codec: string | null;
    duration: number | null;
}
export interface IOptions {
}
export declare class PlayerSound implements ISound {
    sources: (ISoundSource | string)[];
    id: number;
    playlistId: number | null;
    loop: boolean;
    url: string;
    sourceNode: AudioBufferSourceNode | null;
    isBuffered: boolean;
    isBuffering: boolean;
    audioBuffer: AudioBuffer | null;
    arrayBuffer: ArrayBuffer | null;
    audioBufferDate: Date | null;
    playTimeOffset: number;
    startTime: number;
    playTime: number;
    playedTimePercentage: number;
    isPlaying: boolean;
    loadingProgress: number;
    codec: string;
    duration: number | null;
    onLoading: IOnProgress;
    onPlaying: IOnProgress;
    onStarted: IOnStarted;
    onEnded: IOnEnded;
    constructor(soundAttributes: ISoundAttributes);
}

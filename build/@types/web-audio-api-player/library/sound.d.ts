import { IRequested } from './request';
export interface ISoundSource {
    url: string;
    codec?: string;
}
export interface IOnProgress {
    (progress: number, maximumValue: number, currentValue: number): void;
}
export interface ISoundAttributes {
    sources: (ISoundSource | string)[] | string;
    id: number;
    playlistId?: number | null;
    loop?: boolean;
    onLoading?: IOnProgress;
    onPlaying?: IOnProgress;
    audioBuffer?: AudioBuffer | null;
    arrayBuffer?: ArrayBuffer | null;
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
    duration: number;
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
    duration: number;
    onLoading: IOnProgress;
    onPlaying: IOnProgress;
    constructor(soundAttributes: ISoundAttributes);
}

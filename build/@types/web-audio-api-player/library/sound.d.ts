import { IRequested } from './request';
export interface ISoundSource {
    url: string;
    codec?: string;
}
export interface ISoundAttributes {
    sources: (ISoundSource | string)[] | string;
    id: number;
    playlistId?: number | null;
    loop?: boolean;
}
export interface ISound extends IRequested, ISoundAttributes {
    sourceNode: AudioBufferSourceNode | null;
    isBuffered: boolean;
    isBuffering: boolean;
    audioBuffer: AudioBuffer | null;
    audioBufferDate: Date | null;
    playTimeOffset: number;
    startTime: number;
    playTime: number;
    playedTimePercentage: number;
    isPlaying: boolean;
    sources: (ISoundSource | string)[];
    codec: string | null;
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
    audioBufferDate: Date | null;
    playTimeOffset: number;
    startTime: number;
    playTime: number;
    playedTimePercentage: number;
    isPlaying: boolean;
    loadingProgress: number;
    codec: string;
    constructor(soundAttributes: ISoundAttributes);
}

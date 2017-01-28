
'use strict';

import { IRequested } from './request';
import { PlayerError, IPlayerError } from './error';
import { IAudioGraph } from './audio';

export interface ISoundSource {
    url: string;
    codec?: string;
}

export interface IOnProgress {
    (progress: number): void;
}

export interface ISoundAttributes {
    sources: (ISoundSource | string)[] | string;
    id: number;
    playlistId?: number | null;
    loop?: boolean;
    onLoading: IOnProgress;
    onPlaying: IOnProgress;
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

export class PlayerSound implements ISound {

    public sources: (ISoundSource | string)[];
    public id: number;
    public playlistId: number | null;
    public loop: boolean;
    public url: string;

    public sourceNode: AudioBufferSourceNode | null;
    public isBuffered: boolean;
    public isBuffering: boolean;
    public audioBuffer: AudioBuffer | null;
    public audioBufferDate: Date | null;
    public playTimeOffset: number;
    public startTime: number;
    public playTime: number;
    public playedTimePercentage: number;
    public isPlaying: boolean;
    public loadingProgress: number;
    public codec: string;

    public onLoading: IOnProgress;
    public onPlaying: IOnProgress;

    constructor(soundAttributes: ISoundAttributes) {

        // user provided values
        if (typeof soundAttributes.sources === 'string') {
            this.sources = [soundAttributes.sources];
        } else {
            this.sources = soundAttributes.sources;
        }

        this.id = soundAttributes.id;
        this.playlistId = soundAttributes.playlistId || null;
        this.loop = soundAttributes.loop || false;

        if (typeof soundAttributes.onLoading === 'function') {
            this.onLoading = soundAttributes.onLoading;
        }

        if (typeof soundAttributes.onPlaying === 'function') {
            this.onPlaying = soundAttributes.onPlaying;
        }

        // default values
        this.sourceNode = null;
        this.isBuffered = false;
        this.isBuffering = false;
        this.audioBuffer = null;
        this.audioBufferDate = null;
        this.playTimeOffset = 0;
        this.startTime = 0;
        this.playTime = 0;
        this.playedTimePercentage = 0;
        this.isPlaying = false;

    }

}

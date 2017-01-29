
'use strict';

import { IRequested } from './request';
import { PlayerError, IPlayerError } from './error';
import { IAudioGraph } from './audio';

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

export interface ISoundAttributes {
    sources: (ISoundSource | string)[] | string;
    id: number;
    playlistId?: number | null;
    loop?: boolean;
    onLoading?: IOnProgress;
    onPlaying?: IOnProgress;
    onEnded?: IOnEnded;
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
    public arrayBuffer: ArrayBuffer | null;
    public audioBufferDate: Date | null;
    public playTimeOffset: number;
    public startTime: number;
    public playTime: number;
    public playedTimePercentage: number;
    public isPlaying: boolean;
    public loadingProgress: number;
    public codec: string;
    public duration: number;

    public onLoading: IOnProgress;
    public onPlaying: IOnProgress;
    public onEnded: IOnEnded;

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
        } else {
            this.onLoading = null;
        }

        if (typeof soundAttributes.onPlaying === 'function') {
            this.onPlaying = soundAttributes.onPlaying;
        } else {
            this.onPlaying = null;
        }

        if (typeof soundAttributes.onEnded === 'function') {
            this.onEnded = soundAttributes.onEnded;
        } else {
            this.onEnded = null;
        }

        if (typeof soundAttributes.arrayBuffer === 'ArrayBuffer') {
            this.arrayBuffer = soundAttributes.arrayBuffer;
        } else {
            this.arrayBuffer = null;
        }

        if (typeof soundAttributes.audioBuffer === 'AudioBuffer') {
            this.audioBuffer = soundAttributes.audioBuffer;
            this.audioBufferDate = new Date();
        } else {
            this.audioBuffer = null;
            this.audioBufferDate = null;
        }

        // default values
        this.sourceNode = null;
        this.isBuffered = false;
        this.isBuffering = false;
        this.playTimeOffset = 0;
        this.startTime = 0;
        this.playTime = 0;
        this.playedTimePercentage = 0;
        this.isPlaying = false;

    }

}

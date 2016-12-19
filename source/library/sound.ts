
'use strict';

import { IRequested } from './request';

export interface ISoundAttributes {
    sources: string[] | string;
    id: number;
    playlistId?: number | null;
    loop?: boolean;
}

export interface ISound extends IRequested, ISoundAttributes {
    isBuffered: boolean;
    isBuffering: boolean;
    audioBuffer: AudioBuffer | null;
    playTimeOffset: number;
    startTime: number;
    playTime: number;
    playedTimePercentage: number;
    isPlaying: boolean;
}

export interface IOptions {

}

export class Sound implements ISound {

    public isBuffered: boolean;
    public isBuffering: boolean;
    public audioBuffer: AudioBuffer | null;
    public sources: string[];
    public playTimeOffset: number;
    public startTime: number;
    public playTime: number;
    public playedTimePercentage: number;
    public isPlaying: boolean;
    public id: number;
    public playlistId: number | null;
    public loop: boolean;
    public url: string;
    public loadingProgress: number;

    constructor(soundAttributes: ISoundAttributes) {

        if (typeof soundAttributes.sources === 'string') {
            this.sources = [soundAttributes.sources];
        } else {
            this.sources = soundAttributes.sources;
        }

        this.id = soundAttributes.id;
        this.playlistId = soundAttributes.playlistId || null;
        this.loop = soundAttributes.loop || false;

        // default values
        this.isBuffered = false;
        this.isBuffering = false;
        this.audioBuffer = null;
        this.playTimeOffset = 0;
        this.startTime = 0;
        this.playTime = 0;
        this.playedTimePercentage = 0;
        this.isPlaying = false;

    }
    
}
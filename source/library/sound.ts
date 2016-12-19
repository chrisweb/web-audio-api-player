
'use strict';

import { IRequested } from './request';

export interface ISound extends IRequested {
    isBuffered: boolean;
    isBuffering: boolean;
    audioBuffer: AudioBuffer | null;
    sources: string[];
    playTimeOffset: number;
    startTime: number;
    playTime: number;
    playedTimePercentage: number;
    isPlaying: boolean;
    id: number;
    playlistId: number | null;
    loop: boolean;
}

export interface ISoundAttribtes {
    sources: string[] | string;
    id: number;
    playlistId?: number | null;
    loop?: boolean;
}

export interface IOptions {

}

export class Sound {

    private sound: ISound;

    constructor() {
        
    }

    public create(soundAttributes: ISoundAttribtes) {

        if (typeof soundAttributes.sources === 'string') {
            this.sound.sources = [soundAttributes.sources];
        } else {
            this.sound.sources = soundAttributes.sources;
        }

        this.sound.id = soundAttributes.id;
        this.sound.playlistId = soundAttributes.playlistId || null;
        this.sound.loop = soundAttributes.loop || false;

        // default values
        this.sound.isBuffered = false;
        this.sound.isBuffering = false;
        this.sound.audioBuffer = null;
        this.sound.playTimeOffset = 0;
        this.sound.startTime = 0;
        this.sound.playTime = 0;
        this.sound.playedTimePercentage = 0;
        this.sound.isPlaying = false;

        return this.sound;

    }
    
}

'use strict';

export interface ISource {
    url: string;
}

export interface ISound {
    buffered: boolean;
    isBuffering: boolean;
    buffer: AudioBuffer;
    sources: ISource[];
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
    sources: ISource[];
    id: number;
    playlistId?: number | null;
    loop?: boolean;
}

export interface IOptions {

}

export class Sound {

    private sound: ISound;

    constructor(soundAttributes: ISoundAttribtes) {

        if (typeof soundAttributes.sources === 'string') {
            this.sound.sources = [soundAttributes.sources];
        } else {
            this.sound.sources = soundAttributes.sources;
        }

        this.sound.id = soundAttributes.id;
        this.sound.playlistId = soundAttributes.playlistId || null;
        this.sound.loop = soundAttributes.loop || false;

    }



}
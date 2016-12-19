
'use strict';

import { IRequested } from './request';
import { PlayerError, IPlayerError } from './error';

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
    isBuffered: boolean;
    isBuffering: boolean;
    audioBuffer: AudioBuffer | null;
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

export class Sound implements ISound {

    public sources: (ISoundSource | string)[];
    public id: number;
    public playlistId: number | null;
    public loop: boolean;
    public url: string;

    protected _isBuffered: boolean;
    protected _isBuffering: boolean;
    protected _audioBuffer: AudioBuffer | null;
    protected _playTimeOffset: number;
    protected _startTime: number;
    protected _playTime: number;
    protected _playedTimePercentage: number;
    protected _isPlaying: boolean;
    protected _loadingProgress: number;
    protected _codec: string;

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

        // default (readonly values) values
        this._isBuffered = false;
        this._isBuffering = false;
        this._audioBuffer = null;
        this._playTimeOffset = 0;
        this._startTime = 0;
        this._playTime = 0;
        this._playedTimePercentage = 0;
        this._isPlaying = false;

    }

    // getters for readonly properties
    get isBuffered() {
        return this._isBuffered;
    }

    get isBuffering() {
        return this._isBuffering;
    }

    get audioBuffer() {
        return this._audioBuffer;
    }

    get playTimeOffset() {
        return this._playTimeOffset;
    }

    get startTime() {
        return this._startTime;
    }

    get playTime() {
        return this._playTime;
    }

    get playedTimePercentage() {
        return this._playedTimePercentage;
    }

    get isPlaying() {
        return this._isPlaying;
    }

    get loadingProgress() {
        return this._loadingProgress;
    }

    get codec() {
        return this._codec;
    }
    
}
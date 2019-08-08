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

export interface IOnAnyAction {
    (playTimeOffset: number): void;
}

export interface ISoundAttributes {
    // sources are not mandatory as user can provide an arrayBuffer
    // and / or audioBuffer in which case the source url is not needed
    sources?: (ISoundSource | string)[] | string;
    id: number;
    loop?: boolean;
    audioBuffer?: AudioBuffer | null;
    arrayBuffer?: ArrayBuffer | null;
    duration?: number | null;

    // events
    onLoading?: IOnProgress;
    onPlaying?: IOnProgress;
    onEnded?: IOnEnded;
    onStarted?: IOnAnyAction;
    onStopped?: IOnAnyAction;
    onPaused?: IOnAnyAction;
    onResumed?: IOnAnyAction;
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
    firstTimePlayed: boolean;
}

export interface IOptions {

}

export class PlayerSound implements ISound {

    public sources: (ISoundSource | string)[];
    public id: number;
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
    public duration: number | null;
    public firstTimePlayed: boolean;

    // callbacks
    public onLoading: IOnProgress;
    public onPlaying: IOnProgress;
    public onEnded: IOnEnded;
    public onStarted: IOnAnyAction;
    public onStopped: IOnAnyAction;
    public onPaused: IOnAnyAction;
    public onResumed: IOnAnyAction;

    constructor(soundAttributes: ISoundAttributes) {

        // user provided values
        if (typeof soundAttributes.sources === 'string') {
            this.sources = [soundAttributes.sources];
        } else {
            this.sources = soundAttributes.sources;
        }

        this.id = soundAttributes.id;
        this.loop = soundAttributes.loop || false;

        // the user can set the duration manually
        // this is usefull if we need to convert the position percentage into seconds but don't want to preload the song
        // to get the duration the song has to get preloaded as the duration is a property of the audioBuffer
        this.duration = soundAttributes.duration || null;

        this.firstTimePlayed = true;

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

        if (typeof soundAttributes.onStarted === 'function') {
            this.onStarted = soundAttributes.onStarted;
        } else {
            this.onStarted = null;
        }

        if (typeof soundAttributes.onEnded === 'function') {
            this.onEnded = soundAttributes.onEnded;
        } else {
            this.onEnded = null;
        }

        if (typeof soundAttributes.onStopped === 'function') {
            this.onStopped = soundAttributes.onStopped;
        } else {
            this.onStopped = null;
        }

        if (typeof soundAttributes.onPaused === 'function') {
            this.onPaused = soundAttributes.onPaused;
        } else {
            this.onPaused = null;
        }

        if (typeof soundAttributes.onResumed === 'function') {
            this.onResumed = soundAttributes.onResumed;
        } else {
            this.onResumed = null;
        }

        let arrayBufferType: string = typeof soundAttributes.arrayBuffer;

        if (arrayBufferType === 'ArrayBuffer') {
            this.arrayBuffer = soundAttributes.arrayBuffer;
        } else {
            this.arrayBuffer = null;
        }

        let audioBufferType: string = typeof soundAttributes.audioBuffer;

        if (audioBufferType === 'AudioBuffer') {
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

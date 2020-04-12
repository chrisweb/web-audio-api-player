export interface ISoundSource {
    url: string;
    codec?: string;
    isPreferred?: boolean;
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
    // source(s) are NOT mandatory as user can provide an arrayBuffer
    // and / or audioBuffer in which case the source url is not needed
    source?: (ISoundSource)[] | ISoundSource;
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

export interface ISound extends ISoundAttributes, ISoundSource {
    audioBufferSourceNode: AudioBufferSourceNode | null;
    mediaElementAudioSourceNode: MediaElementAudioSourceNode | null;
    isReadyToPLay: boolean;
    isBuffered: boolean;
    isBuffering: boolean;
    audioBuffer: AudioBuffer | null;
    arrayBuffer: ArrayBuffer | null;
    audioBufferDate: Date | null;
    loadingProgress: number;
    playTimeOffset: number;
    startTime: number;
    playTime: number;
    playedTimePercentage: number;
    isPlaying: boolean;
    source: (ISoundSource)[] | ISoundSource;
    url: string | null;
    codec: string | null;
    duration: number | null;
    firstTimePlayed: boolean;
    audioElement: HTMLAudioElement | null;
    getCurrentTime(): number;
    getDuration(): number;
}

export class PlayerSound implements ISound {

    public source: (ISoundSource)[] | ISoundSource;
    public url: string | null = null;
    public codec: string | null = null;
    public id: number;
    public loop: boolean;
    public audioBufferSourceNode: AudioBufferSourceNode | null = null;
    public mediaElementAudioSourceNode: MediaElementAudioSourceNode | null = null;
    public isReadyToPLay = false;
    public isBuffered = false;
    public isBuffering = false;
    public audioElement: HTMLAudioElement | null = null;
    public audioBuffer: AudioBuffer | null = null;
    public arrayBuffer: ArrayBuffer | null = null;
    public audioBufferDate: Date | null = null;
    public playTimeOffset = 0;
    public startTime = 0;
    public playTime = 0;
    public playedTimePercentage = 0;
    public isPlaying = false;
    public loadingProgress = 0;
    public duration: number | null = null;
    public firstTimePlayed = true;

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
        if (!Array.isArray(soundAttributes.source)) {
            this.source = [soundAttributes.source];
        } else {
            this.source = soundAttributes.source;
        }

        this.id = soundAttributes.id;
        this.loop = soundAttributes.loop || false;

        // the user can set the duration manually
        // this is usefull if we need to convert the position percentage into seconds but don't want to preload the song
        // to get the duration the song has to get preloaded as the duration is a property of the audioBuffer
        this.duration = soundAttributes.duration || null;

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

        // if the arrayBufferType is injected through the sound attributes
        const arrayBufferType: string = typeof soundAttributes.arrayBuffer;

        if (arrayBufferType === 'ArrayBuffer') {
            this.arrayBuffer = soundAttributes.arrayBuffer;
        }

        // if the audioBuffer is injected through the sound attributes
        const audioBufferType: string = typeof soundAttributes.audioBuffer;

        if (audioBufferType === 'AudioBuffer') {
            this.audioBuffer = soundAttributes.audioBuffer;
            this.isBuffering = false;
            this.isBuffered = true;
            this.audioBufferDate = new Date();
            this.duration = this.getDuration();
        }

    }

    public getCurrentTime(): number {

        let currentTime: number;

        if (this.audioBufferSourceNode !== null) {
            currentTime = this.audioBufferSourceNode.context.currentTime;
        } else if (this.mediaElementAudioSourceNode !== null) {
            currentTime = this.audioElement.currentTime;
        }

        return currentTime;

    }

    public getDuration(): number {

        let duration: number;

        if (this.audioBufferSourceNode !== null) {
            duration = this.audioBufferSourceNode.buffer.duration;
        } else if (this.mediaElementAudioSourceNode !== null) {
            duration = this.audioElement.duration;
        }

        return duration;

    }

}

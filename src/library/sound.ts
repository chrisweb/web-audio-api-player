const SOUND_STATE_STOPPED = 'sound_state_stopped';
const SOUND_STATE_PAUSED = 'sound_state_paused';
const SOUND_STATE_PLAYING = 'sound_state_playing';

export type typeSoundStates = typeof SOUND_STATE_STOPPED | typeof SOUND_STATE_PAUSED | typeof SOUND_STATE_PLAYING;

export interface IOnProgress {
    (progress: number, maximumValue: number, currentValue: number): void;
}

export interface IOnEnded {
    (willPlayNext: boolean): void;
}

export interface IOnAnyAction {
    (playTimeOffset: number): void;
}

export interface ISoundSource {
    url: string;
    codec?: string;
    isPreferred?: boolean;
}

export interface ISoundAttributes {
    // source(s) are NOT mandatory as user can provide an arrayBuffer
    // and / or audioBuffer in which case the source url is not needed
    source?: (ISoundSource)[] | ISoundSource;
    id?: number | string;
    loop?: boolean;
    audioBuffer?: AudioBuffer;
    arrayBuffer?: ArrayBuffer;
    duration?: number;

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
    sourceNode: AudioBufferSourceNode | MediaElementAudioSourceNode;
    gainNode: GainNode;
    isReadyToPLay: boolean;
    isBuffered: boolean;
    isBuffering: boolean;
    audioElement: HTMLAudioElement;
    audioBufferDate: Date;
    playTimeOffset: number;
    startTime: number;
    playTime: number;
    playedTimePercentage: number;
    state: typeSoundStates;
    loadingProgress: number;
    firstTimePlayed: boolean;
    getCurrentTime(): number;
    getDuration(): number;
}

export class PlayerSound implements ISound {

    // static constants
    static readonly SOUND_STATE_STOPPED = 'sound_state_stopped';
    static readonly SOUND_STATE_PAUSED = 'sound_state_paused';
    static readonly SOUND_STATE_PLAYING = 'sound_state_playing';

    // properties
    public source: (ISoundSource)[] | ISoundSource;
    public url: string = null;
    public codec: string = null;
    public id: number | string;
    public loop: boolean;
    public sourceNode: AudioBufferSourceNode | MediaElementAudioSourceNode = null;
    public gainNode: GainNode = null;
    public isReadyToPLay = false;
    public isBuffered = false;
    public isBuffering = false;
    public audioElement: HTMLAudioElement = null;
    public audioBuffer: AudioBuffer = null;
    public arrayBuffer: ArrayBuffer = null;
    public audioBufferDate: Date = null;
    public playTimeOffset = 0;
    public startTime = 0;
    public playTime = 0;
    public playedTimePercentage = 0;
    public state: typeSoundStates = SOUND_STATE_STOPPED;
    public loadingProgress = 0;
    public duration: number = null;
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

        if (typeof soundAttributes.id !== 'undefined') {
            this.id = soundAttributes.id;
        } else {
            this.id = this._generateSoundId()
        }

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

        if (soundAttributes.arrayBuffer instanceof ArrayBuffer) {
            this.arrayBuffer = soundAttributes.arrayBuffer;
        }

        if (soundAttributes.audioBuffer instanceof AudioBuffer) {
            this.audioBuffer = soundAttributes.audioBuffer;
            this.isBuffering = false;
            this.isBuffered = true;
            this.audioBufferDate = new Date();
            this.duration = this.getDuration();
        }

    }

    public getCurrentTime(): number {

        let currentTime: number;

        if (this.sourceNode !== null) {
            if (this.sourceNode instanceof AudioBufferSourceNode) {
                currentTime = this.sourceNode.context.currentTime;
            } else if (this.sourceNode instanceof MediaElementAudioSourceNode) {
                currentTime = this.audioElement.currentTime;
            }
        }

        return currentTime;

    }

    public getDuration(): number {

        let duration: number;

        if (this.sourceNode !== null) {
            if (this.sourceNode instanceof AudioBufferSourceNode) {
                duration = this.sourceNode.buffer.duration;
            } else if (this.sourceNode instanceof MediaElementAudioSourceNode) {
                duration = this.audioElement.duration;
            }
        }

        return duration;

    }

    protected _generateSoundId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2)
    }

}

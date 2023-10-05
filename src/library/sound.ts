const SOUND_STATE_STOPPED = 'sound_state_stopped';
const SOUND_STATE_PAUSED = 'sound_state_paused';
const SOUND_STATE_PLAYING = 'sound_state_playing';
const SOUND_STATE_SEEKING = 'sound_state_seeking';

export type typeSoundStates = typeof SOUND_STATE_STOPPED | typeof SOUND_STATE_PAUSED | typeof SOUND_STATE_PLAYING | typeof SOUND_STATE_SEEKING;

export interface IOnProgress {
    (playingPercentage: number, duration: number, playTime: number): void;
}

export interface IOnEnded {
    (willPlayNext: boolean): void;
}

export interface IOnStarted {
    (playTimeOffset: number): void;
}

export interface IOnPaused {
    (playTime: number): void;
}

export interface IOnResumed {
    (playTime: number): void;
}

export interface IOnStopped {
    (playTime: number): void;
}

export interface IOnSeeking {
    (seekingPercentage: number, duration: number, playTime: number): void;
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
    onStarted?: IOnStarted;
    onStopped?: IOnStopped;
    onPaused?: IOnPaused;
    onResumed?: IOnResumed;
    onSeeking?: IOnSeeking;
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
    elapsedPlayTime: number;
    playedTimePercentage: number;
    state: typeSoundStates;
    loadingProgress: number;
    firstTimePlayed: boolean;
    isConnectToPlayerGain: boolean;
    durationSetManually: boolean;
    getCurrentTime(): number;
    getDuration(): number;
    setDuration(duration: number): void;
    setLoop(loop: boolean): void;
    getLoop(): boolean;
}

export class PlayerSound implements ISound {

    // static constants
    static readonly SOUND_STATE_STOPPED = 'sound_state_stopped';
    static readonly SOUND_STATE_PAUSED = 'sound_state_paused';
    static readonly SOUND_STATE_PLAYING = 'sound_state_playing';
    static readonly SOUND_STATE_SEEKING = 'sound_state_seeking';

    // properties
    public source: (ISoundSource)[] | ISoundSource;
    public url: string = null;
    public codec: string = null;
    public id: number | string;
    public loop: boolean = false;
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
    // elapsedPlayTime is used to adjust the playtime
    // when playing audio buffers
    // on seek, pause or when there is a playTimeOffset
    // see getCurrentTime function
    public elapsedPlayTime = 0;
    public playTime = 0;
    public playedTimePercentage = 0;
    public state: typeSoundStates = SOUND_STATE_STOPPED;
    public loadingProgress = 0;
    public duration: number = null;
    public durationSetManually: boolean = false;
    public firstTimePlayed = true;
    public isConnectToPlayerGain = false;

    // callbacks
    public onLoading: IOnProgress;
    public onPlaying: IOnProgress;
    public onEnded: IOnEnded;
    public onStarted: IOnStarted;
    public onStopped: IOnStopped;
    public onPaused: IOnPaused;
    public onResumed: IOnResumed;
    public onSeeking?: IOnSeeking;

    constructor(soundAttributes: ISoundAttributes) {

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
        if (!isNaN(soundAttributes.duration)) {
            this.duration = soundAttributes.duration;
            this.durationSetManually = true;
        }

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

        if (typeof soundAttributes.onSeeking === 'function') {
            this.onSeeking = soundAttributes.onSeeking;
        } else {
            this.onSeeking = null;
        }

        if (soundAttributes.arrayBuffer instanceof ArrayBuffer) {
            this.arrayBuffer = soundAttributes.arrayBuffer;
        }

        if (soundAttributes.audioBuffer instanceof AudioBuffer) {
            this.audioBuffer = soundAttributes.audioBuffer;
            this.isBuffering = false;
            this.isBuffered = true;
            this.audioBufferDate = new Date();
            // only update duration if it did not get set manually
            if (!this.durationSetManually) {
                this.duration = this.audioBuffer.duration;
            }
        }

    }

    public getCurrentTime(): number {

        let currentTime: number;

        if (this.sourceNode !== null) {
            if (this.sourceNode instanceof AudioBufferSourceNode) {
                currentTime = (this.sourceNode.context.currentTime - this.startTime) + this.elapsedPlayTime;
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
                duration = this.audioBuffer.duration;
            } else if (this.sourceNode instanceof MediaElementAudioSourceNode) {
                duration = this.audioElement.duration;
            }
        }

        return duration;

    }

    public setDuration(duration: number): void {

        if (!isNaN(duration)) {
            this.duration = duration;
            this.durationSetManually = true;
        }

    }

    public setLoop(loop: boolean): void {

        this.loop = loop;

        if (this.state === PlayerSound.SOUND_STATE_PLAYING) {

            if (this.sourceNode !== null) {
                if (this.sourceNode instanceof AudioBufferSourceNode) {
                    this.sourceNode.loop = loop;
                } else if (this.sourceNode instanceof MediaElementAudioSourceNode) {
                    this.sourceNode.mediaElement.loop = loop;
                }
            }

        }

    }

    public getLoop(): boolean {

        return this.loop;

    }

    protected _generateSoundId() {

        return Date.now().toString(36) + Math.random().toString(36).substring(2)

    }

}

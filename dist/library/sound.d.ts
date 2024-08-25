export declare const SOUND_STATE_STOPPED = "sound_state_stopped";
export declare const SOUND_STATE_PAUSED = "sound_state_paused";
export declare const SOUND_STATE_PLAYING = "sound_state_playing";
export declare const SOUND_STATE_SEEKING = "sound_state_seeking";
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
    source?: (ISoundSource)[] | ISoundSource;
    id?: number | string;
    loop?: boolean;
    audioBuffer?: AudioBuffer;
    arrayBuffer?: ArrayBuffer;
    duration?: number;
    seekPercentage?: number;
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
    playedTimePercentage: number;
    state: typeSoundStates;
    loadingProgress: number;
    firstTimePlayed: boolean;
    isConnectToPlayerGain: boolean;
    durationSetManually: boolean;
    elapsedPlayTime: number;
    getCurrentTime(): number;
    getDuration(): number;
    setDuration(duration: number): void;
    setLoop(loop: boolean): void;
    getLoop(): boolean;
}
export declare class PlayerSound implements ISound {
    static readonly SOUND_STATE_STOPPED = "sound_state_stopped";
    static readonly SOUND_STATE_PAUSED = "sound_state_paused";
    static readonly SOUND_STATE_PLAYING = "sound_state_playing";
    static readonly SOUND_STATE_SEEKING = "sound_state_seeking";
    source: (ISoundSource)[] | ISoundSource;
    url: string;
    codec: string;
    id: number | string;
    loop: boolean;
    sourceNode: AudioBufferSourceNode | MediaElementAudioSourceNode;
    gainNode: GainNode;
    isReadyToPLay: boolean;
    isBuffered: boolean;
    isBuffering: boolean;
    audioElement: HTMLAudioElement;
    audioBuffer: AudioBuffer;
    arrayBuffer: ArrayBuffer;
    audioBufferDate: Date;
    playTimeOffset: number;
    startTime: number;
    playTime: number;
    playedTimePercentage: number;
    state: typeSoundStates;
    loadingProgress: number;
    duration: number;
    durationSetManually: boolean;
    firstTimePlayed: boolean;
    isConnectToPlayerGain: boolean;
    elapsedPlayTime: number;
    seekPercentage: number;
    onLoading: IOnProgress;
    onPlaying: IOnProgress;
    onEnded: IOnEnded;
    onStarted: IOnStarted;
    onStopped: IOnStopped;
    onPaused: IOnPaused;
    onResumed: IOnResumed;
    onSeeking?: IOnSeeking;
    constructor(soundAttributes: ISoundAttributes);
    getCurrentTime(): number;
    getDuration(): number;
    setDuration(duration: number): void;
    setLoop(loop: boolean): void;
    getLoop(): boolean;
    protected _generateSoundId(): string;
}

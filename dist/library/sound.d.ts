declare const SOUND_STATE_STOPPED = "sound_state_stopped";
declare const SOUND_STATE_PAUSED = "sound_state_paused";
declare const SOUND_STATE_PLAYING = "sound_state_playing";
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
    source?: (ISoundSource)[] | ISoundSource;
    id?: number | string;
    loop?: boolean;
    audioBuffer?: AudioBuffer;
    arrayBuffer?: ArrayBuffer;
    duration?: number;
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
export declare class PlayerSound implements ISound {
    static readonly SOUND_STATE_STOPPED = "sound_state_stopped";
    static readonly SOUND_STATE_PAUSED = "sound_state_paused";
    static readonly SOUND_STATE_PLAYING = "sound_state_playing";
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
    firstTimePlayed: boolean;
    onLoading: IOnProgress;
    onPlaying: IOnProgress;
    onEnded: IOnEnded;
    onStarted: IOnAnyAction;
    onStopped: IOnAnyAction;
    onPaused: IOnAnyAction;
    onResumed: IOnAnyAction;
    constructor(soundAttributes: ISoundAttributes);
    getCurrentTime(): number;
    getDuration(): number;
    protected _generateSoundId(): string;
}
export {};

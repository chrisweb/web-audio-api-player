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
    source?: (ISoundSource)[] | ISoundSource;
    id: number;
    loop?: boolean;
    audioBuffer?: AudioBuffer | null;
    arrayBuffer?: ArrayBuffer | null;
    duration?: number | null;
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
export declare class PlayerSound implements ISound {
    source: (ISoundSource)[] | ISoundSource;
    url: string | null;
    codec: string | null;
    id: number;
    loop: boolean;
    audioBufferSourceNode: AudioBufferSourceNode | null;
    mediaElementAudioSourceNode: MediaElementAudioSourceNode | null;
    isReadyToPLay: boolean;
    isBuffered: boolean;
    isBuffering: boolean;
    audioElement: HTMLAudioElement | null;
    audioBuffer: AudioBuffer | null;
    arrayBuffer: ArrayBuffer | null;
    audioBufferDate: Date | null;
    playTimeOffset: number;
    startTime: number;
    playTime: number;
    playedTimePercentage: number;
    isPlaying: boolean;
    loadingProgress: number;
    duration: number | null;
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
}

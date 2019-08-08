import { ISound, ISoundAttributes, ISoundSource } from './sound';
import { PlayerAudio, IAudioGraph } from './audio';
import { PlayerError } from './error';
export interface ICoreOptions {
    volume?: number;
    loopQueue?: boolean;
    soundsBaseUrl?: string;
    playingProgressIntervalTime?: number;
    playNextOnEnded?: boolean;
    audioGraph?: IAudioGraph;
    audioContext?: AudioContext;
    stopOnReset?: boolean;
}
export declare class PlayerCore {
    protected _isWebAudioApiSupported: boolean;
    protected _queue: ISound[];
    protected _volume: number;
    protected _soundsBaseUrl: string;
    protected _currentIndex: number;
    protected _playerAudio: PlayerAudio;
    protected _playingProgressIntervalTime: number;
    protected _playingTimeoutID: number | null;
    protected _playNextOnEnded: boolean;
    protected _loopQueue: boolean;
    protected _customAudioGraph: IAudioGraph | null;
    protected _customAudioContext: AudioContext | null;
    protected _stopOnReset: boolean;
    protected _postMuteVolume: number;
    protected _isMuted: boolean;
    protected _visibilityAutoMute: boolean;
    readonly WHERE_IN_QUEUE_AT_END: string;
    readonly WHERE_IN_QUEUE_AT_START: string;
    readonly WHERE_IN_QUEUE_AFTER_CURRENT: string;
    readonly PLAY_SOUND_NEXT = "next";
    readonly PLAY_SOUND_PREVIOUS = "previous";
    readonly PLAY_SOUND_FIRST = "first";
    readonly PLAY_SOUND_LAST = "last";
    constructor(playerOptions?: ICoreOptions);
    protected _initialize(): void;
    addSoundToQueue(soundAttributes: ISoundAttributes, whereInQueue?: string): ISound;
    _appendSoundToQueue(sound: ISound): void;
    _prependSoundToQueue(sound: ISound): void;
    _addSoundToQueueAfterCurrent(sound: ISound): void;
    resetQueue(): void;
    reset(): void;
    getQueue(): ISound[];
    setVolume(volume: number): void;
    getVolume(): number;
    mute(): void;
    unMute(): void;
    setPosition(soundPositionInPercent: number): void;
    setPositionInSeconds(soundPositionInSeconds: number): void;
    protected _loadSound(sound: ISound): Promise<ISound | PlayerError>;
    protected _decodeSound(sound: ISound, resolve: Function, reject: Function): void;
    play(whichSound?: number | string | undefined, playTimeOffset?: number): Promise<void>;
    protected _play(sound: ISound): Promise<void>;
    protected _onEnded(): void;
    /**
     * whichSound is optional, if set it can be the sound id or if it's
     * a string it can be next / previous / first / last
     */
    protected _getSoundFromQueue(whichSound?: string | number, updateIndex?: boolean): ISound | null;
    protected _findSoundById(soundId: string | number, updateIndex: boolean): ISound | null;
    protected _sourceToVariables(sources: (ISoundSource | string)[]): {
        url: string | null;
        codec?: string | null;
    };
    pause(): void;
    stop(): void;
    protected _stop(sound: ISound): void;
    next(): void;
    previous(): void;
    first(): void;
    last(): void;
    protected _playingProgress(sound: ISound): void;
    setAudioGraph(customAudioGraph: IAudioGraph): void;
    getAudioGraph(): Promise<IAudioGraph>;
    setAudioContext(customAudioContext: AudioContext): void;
    getAudioContext(): Promise<AudioContext>;
    setAutoCreateContextOnFirstTouch(autoCreate: boolean): void;
    getAutoCreateContextOnFirstTouch(): boolean;
    setVisibilityAutoMute(visibilityAutoMute: boolean): void;
    getVisibilityAutoMute(): boolean;
    protected _handleVisibilityChange(): void;
}

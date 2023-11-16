import { ISound, ISoundAttributes, ISoundSource } from './sound';
import { PlayerAudio, IAudioOptions } from './audio';
declare const PLAYER_MODE_AUDIO = "player_mode_audio";
declare const PLAYER_MODE_AJAX = "player_mode_ajax";
declare const PLAYER_MODE_FETCH = "player_mode_fetch";
declare const WHERE_IN_QUEUE_AT_START = "prepend";
declare const WHERE_IN_QUEUE_AT_END = "append";
type typePlayerMode = typeof PLAYER_MODE_AUDIO | typeof PLAYER_MODE_AJAX | typeof PLAYER_MODE_FETCH;
type typeWhereInQueue = typeof WHERE_IN_QUEUE_AT_START | typeof WHERE_IN_QUEUE_AT_END;
export interface ICoreOptions {
    volume?: number;
    loopQueue?: boolean;
    loopSong?: boolean;
    soundsBaseUrl?: string;
    playingProgressIntervalTime?: number;
    playNextOnEnded?: boolean;
    stopOnReset?: boolean;
    visibilityAutoMute?: boolean;
    unlockAudioOnFirstUserInteraction?: boolean;
    persistVolume?: boolean;
    loadPlayerMode?: typePlayerMode;
    audioContext?: AudioContext;
    addAudioElementsToDom?: boolean;
    volumeTransitionTime?: number;
}
export interface ISoundsQueueOptions {
    soundAttributes: ISoundAttributes;
    whereInQueue?: typeWhereInQueue;
}
export interface IPlayOptions {
    whichSound?: number | string | undefined;
    playTimeOffset?: number;
}
interface IFindSoundById {
    soundId: string | number;
}
interface IFindBestSourceResponse {
    url: string;
    codec?: string;
}
interface IGetSoundFromQueue {
    whichSound?: string | number;
    updateIndex?: boolean;
}
export declare class PlayerCore {
    protected _queue: ISound[];
    protected _currentIndex: number;
    protected _playerAudio: PlayerAudio;
    protected _playingProgressRequestId: number;
    protected _playingProgressPreviousTimestamp: DOMHighResTimeStamp;
    protected _postMuteVolume: number;
    protected _options: ICoreOptions;
    static readonly WHERE_IN_QUEUE_AT_END = "append";
    static readonly WHERE_IN_QUEUE_AT_START = "prepend";
    static readonly PLAY_SOUND_NEXT = "next";
    static readonly PLAY_SOUND_PREVIOUS = "previous";
    static readonly PLAY_SOUND_FIRST = "first";
    static readonly PLAY_SOUND_LAST = "last";
    static readonly CURRENT_SOUND = "current";
    static readonly PLAYER_MODE_AUDIO = "player_mode_audio";
    static readonly PLAYER_MODE_AJAX = "player_mode_ajax";
    static readonly PLAYER_MODE_FETCH = "player_mode_fetch";
    constructor(playerOptions?: ICoreOptions);
    protected _initialize(): void;
    protected _audioOptions(): IAudioOptions;
    addSoundToQueue({ soundAttributes, whereInQueue }: ISoundsQueueOptions): ISound;
    protected _appendSoundToQueue(sound: ISound): void;
    protected _prependSoundToQueue(sound: ISound): void;
    resetQueue(): Promise<void>;
    reset(): void;
    getQueue(): ISound[];
    setVolume(volume: number): void;
    getVolume(): number;
    setLoopQueue(loppQueue: boolean): void;
    getLoopQueue(): boolean;
    mute(): void;
    unMute(): void;
    isMuted(): boolean;
    setPosition(soundPositionInPercent: number): Promise<void>;
    protected _setPosition(sound: ISound): void;
    setPositionInSeconds(soundPositionInSeconds: number): Promise<void>;
    loadSound(sound: ISound): Promise<ISound>;
    protected _loadSoundUsingAudioElement(sound: ISound): Promise<void>;
    protected _loadSoundUsingRequest(sound: ISound): Promise<void>;
    protected _decodeSound(sound: ISound): Promise<void>;
    play({ whichSound, playTimeOffset }?: IPlayOptions): Promise<ISound>;
    protected _play(sound: ISound): Promise<void>;
    protected _playAudioBuffer(sound: ISound): Promise<void>;
    protected _playMediaElementAudio(sound: ISound): Promise<void>;
    protected _triggerSoundCallbacks(sound: ISound): void;
    protected _progressTrigger: (sound: ISound, timestamp: DOMHighResTimeStamp) => void;
    protected _onEnded(): Promise<void>;
    protected _getSoundFromQueue({ whichSound, updateIndex }?: IGetSoundFromQueue): ISound;
    protected _findSoundById({ soundId }: IFindSoundById): [ISound, number];
    protected _findBestSource(soundSource: (ISoundSource)[] | ISoundSource): IFindBestSourceResponse;
    protected _checkCodecSupport(codec: string): boolean;
    protected _checkMimeTypesSupport(mediaMimeTypes: string[]): boolean;
    pause(): Promise<ISound>;
    stop(): Promise<ISound>;
    protected _stop(sound: ISound): Promise<void>;
    next(): Promise<ISound>;
    previous(): Promise<ISound>;
    first(): Promise<ISound>;
    last(): Promise<ISound>;
    setVisibilityAutoMute(visibilityAutoMute: boolean): void;
    getVisibilityAutoMute(): boolean;
    protected _handleVisibilityChange(): void;
    manuallyUnlockAudio(): Promise<void>;
    disconnect(): Promise<void>;
    getAudioContext(): Promise<AudioContext>;
    getCurrentSound(): ISound;
}
export {};

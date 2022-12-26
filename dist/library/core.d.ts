import { ISound, ISoundAttributes, ISoundSource, typeSoundStates } from './sound';
import { PlayerAudio, IAudioGraph, IAudioOptions } from './audio';
import { PlayerError } from './error';
declare const PLAYER_MODE_AUDIO = "player_mode_audio";
declare const PLAYER_MODE_AJAX = "player_mode_ajax";
declare const PLAYER_MODE_FETCH = "player_mode_fetch";
export type typePlayerModes = typeof PLAYER_MODE_AUDIO | typeof PLAYER_MODE_AJAX | typeof PLAYER_MODE_FETCH;
export interface ICoreOptions {
    volume?: number;
    loopQueue?: boolean;
    loopSong?: boolean;
    soundsBaseUrl?: string;
    playingProgressIntervalTime?: number;
    playNextOnEnded?: boolean;
    audioGraph?: IAudioGraph;
    audioContext?: AudioContext;
    stopOnReset?: boolean;
    visibilityAutoMute?: boolean;
    createAudioContextOnFirstUserInteraction?: boolean;
    persistVolume?: boolean;
    loadPlayerMode?: typePlayerModes;
}
interface ISoundsQueueOptions {
    soundAttributes: ISoundAttributes;
    whereInQueue?: string;
}
interface IDecodeSoundOptions {
    sound: ISound;
}
interface IPlayOptions {
    whichSound?: number | string | undefined;
    playTimeOffset?: number;
}
interface IFindSoundById {
    soundId: string | number;
    updateIndex: boolean;
}
interface IFindBestSourceResponse {
    url: string | null;
    codec?: string | null;
}
interface IGetSoundFromQueue {
    whichSound?: string | number;
    updateIndex?: boolean;
}
export declare class PlayerCore {
    protected _queue: ISound[];
    protected _volume: number;
    protected _soundsBaseUrl: string;
    protected _currentIndex: number;
    protected _playerAudio: PlayerAudio;
    protected _playingProgressIntervalTime: number;
    protected _playingTimeoutID: number | null;
    protected _playNextOnEnded: boolean;
    protected _loopQueue: boolean;
    protected _loopSong: boolean;
    protected _customAudioGraph: IAudioGraph | null;
    protected _customAudioContext: AudioContext | null;
    protected _stopOnReset: boolean;
    protected _postMuteVolume: number;
    protected _isMuted: boolean;
    protected _visibilityAutoMute: boolean;
    protected _createAudioContextOnFirstUserInteraction: boolean;
    protected _persistVolume: boolean;
    protected _loadPlayerMode: typePlayerModes;
    static readonly WHERE_IN_QUEUE_AT_END: string;
    static readonly WHERE_IN_QUEUE_AT_START: string;
    static readonly WHERE_IN_QUEUE_AFTER_CURRENT: string;
    static readonly PLAY_SOUND_NEXT = "next";
    static readonly PLAY_SOUND_PREVIOUS = "previous";
    static readonly PLAY_SOUND_FIRST = "first";
    static readonly PLAY_SOUND_LAST = "last";
    static readonly PLAYER_MODE_AUDIO = "player_mode_audio";
    static readonly PLAYER_MODE_AJAX = "player_mode_ajax";
    static readonly PLAYER_MODE_FETCH = "player_mode_fetch";
    constructor(playerOptions?: ICoreOptions);
    protected _initialize(): void;
    protected _webAudioApiOptions(): IAudioOptions;
    protected _webAudioElementOptions(): IAudioOptions;
    protected _detectAudioContextSupport(): boolean;
    protected _detectAudioElementSupport(): boolean;
    addSoundToQueue({ soundAttributes, whereInQueue }: ISoundsQueueOptions): ISound;
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
    isMuted(): boolean;
    setPosition(soundPositionInPercent: number): void;
    setPositionInSeconds(soundPositionInSeconds: number): void;
    protected _loadSound(sound: ISound): Promise<ISound | PlayerError>;
    protected _loadSoundUsingAudioElement(sound: ISound): Promise<ISound | PlayerError>;
    protected _loadSoundUsingRequest(sound: ISound): Promise<ISound | PlayerError>;
    protected _initializeAudioElementListeners(sound: ISound): void;
    protected _decodeSound({ sound }: IDecodeSoundOptions): Promise<ISound>;
    play({ whichSound, playTimeOffset }?: IPlayOptions): Promise<void>;
    protected _play(sound: ISound): Promise<void>;
    protected _playAudioBuffer(sound: ISound): Promise<void>;
    protected _playMediaElementAudio(sound: ISound): Promise<void>;
    protected _setupSoundEvents(sound: ISound): ISound;
    protected _onEnded(): void;
    /**
     * whichSound is optional, if set it can be the sound id or if it's
     * a string it can be next / previous / first / last
     */
    protected _getSoundFromQueue({ whichSound, updateIndex }?: IGetSoundFromQueue): ISound | null;
    protected _findSoundById({ soundId, updateIndex }: IFindSoundById): ISound | null;
    protected _findBestSource(soundSource: (ISoundSource)[] | ISoundSource): IFindBestSourceResponse;
    protected _checkCodecSupport(codec: string): boolean;
    protected _checkMimeTypesSupport(mediaMimeTypes: string[]): boolean;
    pause(): void;
    stop(): void;
    protected _stop(sound: ISound, soundState: typeSoundStates): void;
    next(): void;
    previous(): void;
    first(): void;
    last(): void;
    protected _playingProgress(sound: ISound): void;
    setAudioGraph(customAudioGraph: IAudioGraph): void;
    getAudioGraph(): Promise<IAudioGraph>;
    setAudioContext(customAudioContext: AudioContext): void;
    getAudioContext(): Promise<AudioContext>;
    setVisibilityAutoMute(visibilityAutoMute: boolean): void;
    getVisibilityAutoMute(): boolean;
    protected _handleVisibilityChange(): void;
}
export {};

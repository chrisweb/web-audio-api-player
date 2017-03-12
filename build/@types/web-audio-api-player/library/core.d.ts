import { ISound, ISoundAttributes, ISoundSource } from './sound';
import { PlayerAudio } from './audio';
import { PlayerError } from './error';
export interface ICoreOptions {
    volume?: number;
    loopQueue?: boolean;
    soundsBaseUrl?: string;
    playingProgressIntervalTime?: number;
    playNextOnEnded?: boolean;
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
    readonly WHERE_IN_QUEUE_AT_END: string;
    readonly WHERE_IN_QUEUE_AT_START: string;
    readonly WHERE_IN_QUEUE_AFTER_CURRENT: string;
    readonly PLAY_SOUND_NEXT: string;
    readonly PLAY_SOUND_PREVIOUS: string;
    readonly PLAY_SOUND_FIRST: string;
    readonly PLAY_SOUND_LAST: string;
    constructor(playerOptions?: ICoreOptions);
    protected _initialize(): void;
    addSoundToQueue(soundAttributes: ISoundAttributes, whereInQueue?: string): ISound;
    _appendSoundToQueue(sound: ISound): void;
    _prependSoundToQueue(sound: ISound): void;
    _addSoundToQueueAfterCurrent(sound: ISound): void;
    resetQueue(): void;
    getQueue(): ISound[];
    setVolume(volume: number): void;
    getVolume(): number;
    mute(): void;
    setPosition(soundPositionInPercent: number): void;
    protected _loadSound(sound: ISound): Promise<ISound | PlayerError>;
    protected _decodeSound(sound: ISound, resolve: Function, reject: Function): void;
    play(whichSound?: number | string | undefined, playTimeOffset?: number): void;
    protected _play(sound: ISound): void;
    protected _onEnded(): void;
    /**
     * whichSound is optional, if set it can be the sound id or if it's
     * a string it can be next / previous / first / last
     *
     * @param whichSound
     *
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
}

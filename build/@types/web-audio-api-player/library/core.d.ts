import { ISound, ISoundAttributes, ISoundSource } from './sound';
import { PlayerAudio, IAudioGraph } from './audio';
export interface ICoreOptions {
    volume?: number;
    loopQueue?: boolean;
    soundsBaseUrl?: string;
}
export declare class PlayerCore {
    protected _isWebAudioApiSupported: boolean;
    protected _queue: ISound[];
    protected _queueIndex: number;
    protected _volume: number;
    protected _soundsBaseUrl: string;
    protected _currentIndex: number;
    protected _playerAudio: PlayerAudio;
    protected _audioGraph: IAudioGraph;
    onPlayStart: () => void;
    onPlaying: () => void;
    onBuffering: () => void;
    readonly WHERE_IN_QUEUE_AT_END: string;
    readonly WHERE_IN_QUEUE_AT_START: string;
    readonly WHERE_IN_QUEUE_AFTER_CURRENT: string;
    readonly PLAY_SOUND_NEXT: string;
    readonly PLAY_SOUND_PREVIOUS: string;
    readonly PLAY_SOUND_FIRST: string;
    readonly PLAY_SOUND_LAST: string;
    constructor(options?: ICoreOptions);
    protected _initialize(): void;
    addSoundToQueue(soundAttributes: ISoundAttributes, whereInQueue?: string): ISound;
    _appendSoundToQueue(sound: ISound): void;
    _prependSoundToQueue(sound: ISound): void;
    _addSoundToQueueAfterCurrent(sound: ISound): void;
    resetQueue(): void;
    setVolume(volume: number): void;
    getVolume(): number;
    setPlaybackRate(playbackRate: number): void;
    getPlaybackRate(): number;
    resetPlaybackRate(): void;
    setPanner(left: number, right: number): void;
    getPanner(): {
        left: number;
        right: number;
    };
    resetPanner(): void;
    play(whichSound?: number | string | undefined): void;
    protected _startPlaying(sound: ISound): void;
    protected _getSoundFromQueue(whichSound?: string | number): ISound | null;
    protected _sourceToVariables(sources: (ISoundSource | string)[]): {
        url: string | null;
        codec?: string | null;
    };
    pause(): void;
    stop(): void;
    protected _stopPlaying(): void;
    next(): void;
}

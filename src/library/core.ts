import { PlayerSound, ISound, ISoundAttributes, ISoundSource } from './sound';
import {
    PlayerAudio,
    IAudioOptions,
} from './audio';
import { PlayerRequest } from './request';

export const PLAYER_MODE_AUDIO = 'player_mode_audio';
export const PLAYER_MODE_AJAX = 'player_mode_ajax';
export const PLAYER_MODE_FETCH = 'player_mode_fetch';

export const WHERE_IN_QUEUE_AT_START = 'prepend';
export const WHERE_IN_QUEUE_AT_END = 'append';

export const AFTER_LOADING_SEEK = 'after_loading_seek';
export const AFTER_LOADING_PLAY = 'after_loading_play';

export const VISIBILITY_HIDDEN_ACTION_MUTE = 'visibility_hidden_action_mute';
export const VISIBILITY_HIDDEN_ACTION_PAUSE = 'visibility_hidden_action_pause';

type typePlayerMode = typeof PLAYER_MODE_AUDIO | typeof PLAYER_MODE_AJAX | typeof PLAYER_MODE_FETCH;
type typeWhereInQueue = typeof WHERE_IN_QUEUE_AT_START | typeof WHERE_IN_QUEUE_AT_END;
type typeAfterLoadingAction = typeof AFTER_LOADING_SEEK | typeof AFTER_LOADING_PLAY;
type typeVisibilityHiddenAction = typeof VISIBILITY_HIDDEN_ACTION_MUTE | typeof VISIBILITY_HIDDEN_ACTION_PAUSE;

export interface ICoreOptions {
    volume?: number;
    loopQueue?: boolean;
    loopSong?: boolean;
    soundsBaseUrl?: string;
    playingProgressIntervalTime?: number;
    playNextOnEnded?: boolean;
    stopOnReset?: boolean;
    visibilityWatch?: boolean;
    visibilityHiddenAction?: typeVisibilityHiddenAction;
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

interface IBestSource {
    url: string;
    codec?: string;
}

export class PlayerCore {

    // the sounds queue
    protected _queue: ISound[];
    // the queue index of the current sound
    protected _currentIndex: number;
    // instance of the audio library class
    protected _playerAudio: PlayerAudio;
    // playing progress animation frame request id
    protected _playingProgressRequestId: number = null;
    // time in milliseconds
    protected _playingProgressPreviousTimestamp: DOMHighResTimeStamp;
    // value of the volume before it got muted
    protected _postMuteVolume: number = null;
    // is playing before visibility is hidden event
    protected _postVisibilityHiddenPlaying: boolean = null;
    // user player options
    protected _options: ICoreOptions;

    // constants
    static readonly WHERE_IN_QUEUE_AT_END = 'append';
    static readonly WHERE_IN_QUEUE_AT_START = 'prepend';

    static readonly AFTER_LOADING_SEEK = 'after_loading_seek';
    static readonly AFTER_LOADING_PLAY = 'after_loading_play';

    static readonly PLAY_SOUND_NEXT = 'next';
    static readonly PLAY_SOUND_PREVIOUS = 'previous';
    static readonly PLAY_SOUND_FIRST = 'first';
    static readonly PLAY_SOUND_LAST = 'last';

    static readonly CURRENT_SOUND = 'current';

    static readonly PLAYER_MODE_AUDIO = 'player_mode_audio';
    static readonly PLAYER_MODE_AJAX = 'player_mode_ajax';
    static readonly PLAYER_MODE_FETCH = 'player_mode_fetch';

    static readonly VISIBILITY_HIDDEN_ACTION_MUTE = 'visibility_hidden_action_mute';
    static readonly VISIBILITY_HIDDEN_ACTION_PAUSE = 'visibility_hidden_action_pause';

    constructor(playerOptions: ICoreOptions = {}) {

        const defaultOptions: ICoreOptions = {
            volume: 80,
            loopQueue: false,
            loopSong: false,
            soundsBaseUrl: '',
            playingProgressIntervalTime: 200,
            playNextOnEnded: true,
            stopOnReset: true,
            visibilityWatch: false,
            visibilityHiddenAction: VISIBILITY_HIDDEN_ACTION_PAUSE,
            unlockAudioOnFirstUserInteraction: false,
            persistVolume: true,
            loadPlayerMode: PLAYER_MODE_AUDIO,
            audioContext: null,
            addAudioElementsToDom: false,
            volumeTransitionTime: 100,
        };

        const options = Object.assign({}, defaultOptions, playerOptions);

        this._queue = [];
        this._currentIndex = 0;
        this._options = options;
        this._playingProgressPreviousTimestamp = 0;

        this._initialize();

    }

    protected _initialize(): void {

        const audioOptions = this._audioOptions();

        this._playerAudio = new PlayerAudio(audioOptions);

        switch (this._options.loadPlayerMode) {
            case PlayerCore.PLAYER_MODE_AUDIO:
                if (!this._playerAudio.detectAudioContextSupport()) {
                    throw new Error('audio context is not supported by this device');
                }
                if (!this._playerAudio.detectAudioElementSupport()) {
                    throw new Error('audio element is not supported by this device');
                }
                break;
            case PlayerCore.PLAYER_MODE_AJAX:
                if (!this._playerAudio.detectAudioContextSupport()) {
                    throw new Error('audio context is not supported by this device');
                }
                break;
        }

    }

    protected _audioOptions(): IAudioOptions {

        const audioOptions: IAudioOptions = {
            audioContext: this._options.audioContext,
            unlockAudioOnFirstUserInteraction: this._options.unlockAudioOnFirstUserInteraction,
            volume: this._options.volume,
            persistVolume: this._options.persistVolume,
            loadPlayerMode: this._options.loadPlayerMode,
            addAudioElementsToDom: this._options.addAudioElementsToDom,
            volumeTransitionTime: this._options.volumeTransitionTime,
        };

        return audioOptions;

    }

    public addSoundToQueue({ soundAttributes, whereInQueue = WHERE_IN_QUEUE_AT_END }: ISoundsQueueOptions): ISound {

        const sound: ISound = new PlayerSound(soundAttributes);

        switch (whereInQueue) {
            case PlayerCore.WHERE_IN_QUEUE_AT_END:
                this._appendSoundToQueue(sound);
                break;
            case PlayerCore.WHERE_IN_QUEUE_AT_START:
                this._prependSoundToQueue(sound);
                break;
        }

        return sound;

    }

    protected _appendSoundToQueue(sound: ISound): void {

        this._queue.push(sound);

    }

    protected _prependSoundToQueue(sound: ISound): void {

        this._queue.unshift(sound);

    }

    public async resetQueue(): Promise<void> {

        if (this._options.stopOnReset) {
            await this.stop();
        }

        this._queue.forEach((sound) => {
            this._playerAudio.disconnectSound(sound);
        });

        this._queue = [];

    }

    public reset(): void {

        this.resetQueue().catch((error) => {
            console.error(error);
        });

    }

    public getQueue(): ISound[] {

        return this._queue;

    }

    public setVolume(volume: number): void {

        this._playerAudio.setVolume(volume).catch((error) => {
            console.error(error);
        })

    }

    public getVolume(): number {

        return this._playerAudio.getVolume();

    }

    public setLoopQueue(loopQueue: boolean): void {

        this._options.loopQueue = loopQueue;

    }

    public getLoopQueue(): boolean {

        return this._options.loopQueue;

    }

    public mute(): void {

        const currentVolume = this.getVolume();

        this._playerAudio.setVolume(0, false).catch((error) => {
            console.error(error);
        })

        this._postMuteVolume = currentVolume;

    }

    public unMute(): void {

        this._playerAudio.setVolume(this._postMuteVolume, false).catch((error) => {
            console.error(error);
        })

        this._postMuteVolume = null;

    }

    public isMuted(): boolean {

        return this._postMuteVolume === null ? false : true;

    }

    public async setPosition(soundPositionInPercent: number): Promise<void> {

        if (soundPositionInPercent < 0 || soundPositionInPercent > 100) {
            throw new Error('soundPositionInPercent must be a number >= 0 and <= 100');
        }

        const currentSound = this._getSoundFromQueue({ whichSound: PlayerCore.CURRENT_SOUND });

        if (currentSound !== null) {

            currentSound.seekPercentage = Math.round(soundPositionInPercent);

            const duration = currentSound.getDuration();

            // if the duration did not get set manually or is not a number
            if (duration === null || isNaN(duration)) {

                // the user can set the sound duration manually but if he didn't the sound
                // needs to get loaded first, to be able to know the duration it has
                await this.loadSound(currentSound, PlayerCore.AFTER_LOADING_SEEK);

            } else {

                this._setPosition(currentSound);

            }

        }

    }

    protected _setPosition(sound: ISound): void {

        const duration = sound.getDuration();

        // calculate the position in seconds
        const soundPositionInSeconds = (duration / 100) * sound.seekPercentage;

        this.setPositionInSeconds(soundPositionInSeconds, sound);

    }

    public async setPositionInSeconds(soundPositionInSeconds: number, sound?: ISound): Promise<void> {

        let currentSound: ISound = null;

        if (typeof sound !== 'undefined') {
            currentSound = sound;
        } else {
            currentSound = this._getSoundFromQueue({ whichSound: PlayerCore.CURRENT_SOUND });
        }

        if (currentSound !== null) {

            // if the given position > duration, set position to duration
            if (!isNaN(currentSound.duration) && (soundPositionInSeconds >= currentSound.duration)) {
                // duration - 0.1 because in safari if currentTime = duration
                // the onended event does not get triggered
                soundPositionInSeconds = currentSound.duration - 0.1
            }

            const previousState = currentSound.state;

            currentSound.state = PlayerSound.SOUND_STATE_SEEKING;

            if (currentSound.onSeeking !== null) {

                const playTime = soundPositionInSeconds;
                const duration = currentSound.getDuration();
                const seekingPercentageRaw = (playTime / duration) * 100;
                const seekingPercentage = Math.round(seekingPercentageRaw);

                currentSound.onSeeking(seekingPercentage, duration, playTime);

            }

            if (previousState === PlayerSound.SOUND_STATE_PLAYING) {

                // already playing so just change the position
                currentSound.playTime = soundPositionInSeconds;

                if (this._options.loadPlayerMode === PlayerCore.PLAYER_MODE_AJAX) {
                    // in ajax mode (when source is AudioBufferSourceNode) we
                    // need to stop the song and start again at new position
                    currentSound.elapsedPlayTime = soundPositionInSeconds;
                    await this._stop(currentSound);
                } else if (this._options.loadPlayerMode === PlayerCore.PLAYER_MODE_AUDIO) {
                    // in audio (element) mode it is easier we can just change the position
                    await this._play(currentSound);
                }

            } else {

                // setPositionInSeconds got called and sound is currently not playing
                // only set the sound position but don't play
                currentSound.playTime = soundPositionInSeconds;

            }

        }

    }

    public async loadSound(sound: ISound, afterLoadingAction?: typeAfterLoadingAction): Promise<ISound> {

        switch (this._options.loadPlayerMode) {
            case PlayerCore.PLAYER_MODE_AUDIO:
                await this._loadSoundUsingAudioElement(sound, afterLoadingAction);
                break;
            case PlayerCore.PLAYER_MODE_AJAX:
                await this._loadSoundUsingRequest(sound, afterLoadingAction);
                break;
            case PlayerCore.PLAYER_MODE_FETCH:
                // TODO: implement fetch (?)
                console.warn(PlayerCore.PLAYER_MODE_FETCH + ' is not implemented yet');
                break;
        }

        return sound;

    }

    protected async _loadSoundUsingAudioElement(sound: ISound, afterLoadingAction?: typeAfterLoadingAction): Promise<void> {

        // extract the url and codec from sources
        const { url, codec = null } = this._findBestSource(sound.source);

        sound.url = url;
        sound.codec = codec;

        if (sound.url !== null) {

            sound.audioElement = await this._playerAudio.getAudioElement();

            // loading progress
            // https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/progress_event
            sound.audioElement.onprogress = () => {

                // if for some external reason the audio element
                // has disappeared, then we exit early 
                if (!sound.audioElement) {
                    return
                }

                if (sound.audioElement.buffered.length) {

                    let loadingPercentage: number;

                    const buffered = sound.audioElement.buffered.end(0);
                    const duration = sound.getDuration();

                    if (typeof duration !== 'undefined') {
                        const loadingPercentageRaw = 100 / (duration / buffered);
                        loadingPercentage = Math.round(loadingPercentageRaw);
                    }

                    sound.loadingProgress = loadingPercentage;

                    if (sound.onLoading !== null) {
                        sound.onLoading(loadingPercentage, duration, buffered);
                    }

                    if (loadingPercentage === 100) {
                        sound.isBuffering = false;
                        sound.isBuffered = true;
                        sound.audioBufferDate = new Date();
                    }

                }

            }

            const canPlayThroughHandler = async () => {

                // if for some external reason the audio element
                // has disappeared, then we exit early 
                if (!sound.audioElement) {
                    return
                }

                // we don't need the listener anymore
                sound.audioElement.removeEventListener('canplaythrough', canPlayThroughHandler);
                sound.isReadyToPLay = true;
                // duration should now be available
                // if it got set manually don't overwrite it
                if (!isNaN(sound.audioElement.duration) && !sound.durationSetManually) {
                    sound.duration = sound.audioElement.duration;
                }

                switch (afterLoadingAction) {
                    case PlayerCore.AFTER_LOADING_SEEK:
                        this._setPosition(sound)
                        break;
                    case PlayerCore.AFTER_LOADING_PLAY:
                        this._play(sound);
                        break;
                }
                
            }

            sound.audioElement.addEventListener('canplaythrough', canPlayThroughHandler);

            // in chrome you will get this error message in the console:
            // "MediaElementAudioSource outputs zeroes due to CORS access restrictions"
            // to fix this put crossOrigin to anonymous or change the cors
            // Access-Control-Allow-Origin header of the server to *
            // "crossOrigin" has to be set before "src"
            sound.audioElement.crossOrigin = 'anonymous';

            sound.audioElement.src = sound.url;

            // https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/load
            sound.audioElement.load();

        } else {

            //reject(new Error('sound has no url'));
            throw new Error('sound has no url');

        }

    }

    protected async _loadSoundUsingRequest(sound: ISound, afterLoadingAction?: typeAfterLoadingAction): Promise<void> {

        // check for audio buffer before array buffer, because if one exist the other
        // should exist too and is better for performance to reuse audio buffer
        // decoding an array buffer is an expensive task even on modern hardware
        // TODO: commented out for now, there is a weird bug when reusing the
        // audio buffer, somehow the onended callback gets triggered in a loop
        /*if (sound.audioBuffer !== null) {
            return;
        }*/

        // user provided array buffer
        if (sound.arrayBuffer !== null) {
            return await this._decodeSound(sound);
        }

        // extract the url and codec from sources
        const { url, codec = null } = this._findBestSource(sound.source);

        sound.url = url;
        sound.codec = codec;

        if (sound.url !== null) {

            const request = new PlayerRequest();

            sound.isBuffering = true;
            const arrayBuffer = await request.getArrayBuffer(sound);
            sound.arrayBuffer = arrayBuffer;

            await this._decodeSound(sound, afterLoadingAction);

        } else {

            throw new Error('sound has no url');

        }

    }

    protected async _decodeSound(sound: ISound, afterLoadingAction?: typeAfterLoadingAction): Promise<void> {

        // make a copy of the array buffer first
        // because the decoding will detach the array buffer
        // https://github.com/WebAudio/web-audio-api/issues/1175
        const arrayBufferCopy = sound.arrayBuffer.slice(0);

        const audioBuffer = await this._playerAudio.decodeAudio(arrayBufferCopy);

        // duration should now be available
        // if it got set manually don't overwrite it
        if (!isNaN(audioBuffer.duration) && !sound.durationSetManually) {
            sound.duration = audioBuffer.duration;
        }

        sound.audioBuffer = audioBuffer;
        sound.isBuffering = false;
        sound.isBuffered = true;
        sound.audioBufferDate = new Date();
        sound.isReadyToPLay = true;

        switch (afterLoadingAction) {
            case PlayerCore.AFTER_LOADING_SEEK:
                this._setPosition(sound)
                break;
            case PlayerCore.AFTER_LOADING_PLAY:
                this._play(sound);
                break;
        }

    }

    public async play({ whichSound, playTimeOffset }: IPlayOptions = {}): Promise<ISound> {

        const currentSound = this._getSoundFromQueue({ whichSound: PlayerCore.CURRENT_SOUND });

        // whichSound is optional, if set it can be the sound id (string or number)
        // or it can be these 4 constants: PLAY_SOUND_NEXT, PLAY_SOUND_PREVIOUS,
        // PLAY_SOUND_FIRST, PLAY_SOUND_LAST
        const sound = this._getSoundFromQueue({ whichSound, updateIndex: true });

        // if there is no sound we could play, do nothing
        if (sound === null) {
            return sound;
        }

        // if there is a sound currently being played
        // AND the current sound is the same sound as the one that will now be played
        if (
            currentSound !== null
            && (currentSound.state === PlayerSound.SOUND_STATE_PLAYING)
            && (currentSound.id === sound.id)
        ) {
            if (!isNaN(playTimeOffset)) {
                // sound is already playing but a playTimeOffset got set
                // so we just need to seek
                this.setPositionInSeconds(playTimeOffset);
                return sound;
            } else {
                // sound is already playing, do nothing
                return sound;
            }
        }

        // if there is a sound currently being played OR paused
        // AND the current sound is NOT the same sound as the one that will now be played
        if (
            currentSound !== null
            && (currentSound.state === PlayerSound.SOUND_STATE_PLAYING || currentSound.state === PlayerSound.SOUND_STATE_PAUSED)
            && (currentSound.id !== sound.id)
        ) {
            // stop the current sound
            currentSound.state = PlayerSound.SOUND_STATE_STOPPED;
            await this._stop(currentSound);
        }

        // if the user wants to play the sound from a certain position
        // then playTimeOffset should be a number and not undefined
        if (!isNaN(playTimeOffset)) {
            sound.playTimeOffset = playTimeOffset;
        } else {
            sound.playTimeOffset = 0;
        }

        if (sound.sourceNode === null) {
            // connect the source to the gain (graph) node
            await this._playerAudio.connectSound(sound, () => {
                this._onEnded();
            });
        }

        if (!sound.isReadyToPLay) {

            await this.loadSound(sound, PlayerCore.AFTER_LOADING_PLAY);

        } else {

            await this._play(sound);

        }

        return sound;

    }

    protected async _play(sound: ISound): Promise<void> {

        if (sound.state === PlayerSound.SOUND_STATE_PLAYING) {
            return;
        }

        if (this._playerAudio.isAudioContextFrozen()) {
            await this._playerAudio.unfreezeAudioContext();
        }

        if (sound.playTimeOffset > 0) {
            sound.playTime = sound.playTimeOffset;
        }

        if (this._options.loadPlayerMode === PlayerCore.PLAYER_MODE_AJAX) {
            await this._playAudioBuffer(sound);
        } else if (this._options.loadPlayerMode === PlayerCore.PLAYER_MODE_AUDIO) {
            await this._playMediaElementAudio(sound);
        }

        // the AudioBufferSourceNode does not have events (other than onended)
        // the playbackState got removed:
        // https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Migrating_from_webkitAudioContext#changes_to_determining_playback_state
        // for the AudioElement we could use the play event to trigger the next two lines!?
        // https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement#events
        sound.state = PlayerSound.SOUND_STATE_PLAYING;

        this._triggerSoundCallbacks(sound);

    }

    protected async _playAudioBuffer(sound: ISound): Promise<void> {

        // AudioBufferSourceNode type guard
        if (sound.sourceNode instanceof AudioBufferSourceNode) {

            // on play, seek, pause, always reset the sound startTime (current context time)
            sound.startTime = sound.sourceNode.context.currentTime;

            // add the audio buffer to the source node
            sound.sourceNode.buffer = sound.audioBuffer;

            // start playback
            // start(when, offset, duration)
            try {
                if (sound.state === PlayerSound.SOUND_STATE_SEEKING) {
                    sound.sourceNode.start(0, sound.playTime);
                } else if (sound.state === PlayerSound.SOUND_STATE_PAUSED && sound.playTimeOffset === 0) {
                    sound.sourceNode.start(0, sound.playTime);
                } else {
                    if (sound.playTimeOffset > 0) {
                        // round duration up as numbers are not integers
                        // so sometimes it is a tiny bit above
                        if (sound.playTimeOffset > Math.ceil(sound.duration)) {
                            console.warn('playTimeOffset > sound duration');
                        }
                        // if an offset is defined start playing at that position
                        sound.elapsedPlayTime = sound.playTimeOffset;
                        sound.sourceNode.start(0, sound.playTimeOffset);
                    } else {
                        sound.sourceNode.start();
                    }
                }

            } catch (error) {
                throw new Error(error);
            }
        }

    }

    protected async _playMediaElementAudio(sound: ISound): Promise<void> {

        // MediaElementAudioSourceNode type guard
        if (sound.sourceNode instanceof MediaElementAudioSourceNode) {

            if (sound.state === PlayerSound.SOUND_STATE_SEEKING) {
                sound.audioElement.currentTime = sound.playTime;
            } else if (sound.state === PlayerSound.SOUND_STATE_PAUSED && sound.playTimeOffset === 0) {
                sound.audioElement.currentTime = sound.playTime;
            } else {
                // if an offset is defined start playing at that position
                if (sound.playTimeOffset > 0) {
                    // round duration up as numbers are not integers
                    // so sometimes it is a tiny bit above
                    if (sound.playTimeOffset > Math.ceil(sound.duration)) {
                        console.warn('playTimeOffset > duration');
                    }
                    sound.audioElement.currentTime = sound.playTimeOffset;
                } else {
                    sound.audioElement.currentTime = 0;
                }
            }

            return await sound.audioElement.play();

        }

    }

    protected _triggerSoundCallbacks(sound: ISound) {

        if (sound.onResumed !== null && !sound.firstTimePlayed) {
            sound.onResumed(sound.playTime);
        }

        if (sound.onStarted !== null && sound.firstTimePlayed) {
            sound.firstTimePlayed = false;
            sound.onStarted(sound.playTimeOffset);
        }

        if (sound.onPlaying !== null) {
            // reset progress timestamp
            this._playingProgressPreviousTimestamp = 0;
            // "request animation frame" callback has an argument, which
            // is the timestamp when the callback gets called
            // as this is the first call set timestamp manually to zero
            this._progressTrigger(sound, 0);
        } else {
            this._playingProgressRequestId = null;
        }

        return;

    }

    protected _progressTrigger = (sound: ISound, timestamp: DOMHighResTimeStamp) => {

        const currentSound = this._getSoundFromQueue({ whichSound: PlayerCore.CURRENT_SOUND });

        // I had a lot of trouble cancelling the animation frame
        // this is why I added this check
        // often onended would get called by even though I do
        // a cancel in _stop() the animation frame would still repeat
        if (sound.id !== currentSound.id || currentSound.state !== PlayerSound.SOUND_STATE_PLAYING) {
            return;
        }

        // throttle requests, use time set in options and
        // make sure that at least that amount is elapsed 
        if ((timestamp - this._playingProgressPreviousTimestamp) >= this._options.playingProgressIntervalTime) {

            const currentTime = sound.getCurrentTime();
            const duration = sound.getDuration();

            if (!isNaN(currentTime) && !isNaN(duration)) {

                let playingPercentage = 0;

                if (currentTime !== 0) {
                    const playingPercentageRaw = (currentTime / duration) * 100;
                    playingPercentage = Math.round(playingPercentageRaw);
                }

                sound.playedTimePercentage = playingPercentage;
                sound.playTime = currentTime;

                // execute playing progress callback
                sound.onPlaying(playingPercentage, duration, currentTime);

                this._playingProgressPreviousTimestamp = timestamp;
            }

        }

        // request animation frame loop
        this._playingProgressRequestId = window.requestAnimationFrame((timestamp) => {
            this._progressTrigger(sound, timestamp);
        });

    }

    protected async _onEnded(): Promise<void> {

        if (this._options.playNextOnEnded) {

            const currentSound = this._getSoundFromQueue({ whichSound: PlayerCore.CURRENT_SOUND });

            if (currentSound !== null) {

                // when we set the sound to paused...
                // audio buffer will trigger onEnded because we actually stop the song
                // audio element will not trigger onEnded as we pause the song
                // this is why, for audio buffer (ajax) sounds we check if they have
                // the playing state before triggering the next sound
                // if stopped, seeking or pause we do nothing
                if (
                    this._options.loadPlayerMode === PlayerCore.PLAYER_MODE_AUDIO ||
                    (this._options.loadPlayerMode === PlayerCore.PLAYER_MODE_AJAX && currentSound.state === PlayerSound.SOUND_STATE_PLAYING)
                ) {

                    const nextSound = this._getSoundFromQueue({ whichSound: PlayerCore.PLAY_SOUND_NEXT });

                    let willPlayNext = false;

                    // check if there is another sound in the queue
                    if (nextSound !== null) {
                        willPlayNext = true;
                    }

                    if (!willPlayNext) {
                        await this._playerAudio.freezeAudioContext();
                    }

                    if (currentSound.onEnded !== null) {
                        currentSound.onEnded(willPlayNext);
                    }

                    try {
                        if (willPlayNext) {
                            await this.next();
                        }
                    } catch (error) {
                        console.error(error)
                    }

                }

                if (this._options.loadPlayerMode === PlayerCore.PLAYER_MODE_AJAX && currentSound.state === PlayerSound.SOUND_STATE_SEEKING) {
                    try {
                        // audio buffer source nodes get destroyed on stop
                        // this is why in ajax mode we need to do a fresh start when seeking
                        await this.play(currentSound);
                    } catch (error) {
                        console.error(error)
                    }
                }

            }

        }

    }

    protected _getSoundFromQueue({ whichSound, updateIndex = false }: IGetSoundFromQueue = {}): ISound {

        let sound = null;
        let soundIndex: number = null;

        // check if the queue is empty
        if (this._queue.length === 0) {
            return sound;
        }

        // if which sound to play did not get specified
        // we set it to the current sound by default
        if (typeof whichSound === 'undefined') {
            whichSound = PlayerCore.CURRENT_SOUND;
        }

        switch (whichSound) {
            case PlayerCore.CURRENT_SOUND:
                soundIndex = this._currentIndex
                sound = this._queue[soundIndex];
                break;
            case PlayerCore.PLAY_SOUND_NEXT:
                if (this._queue[this._currentIndex + 1] !== undefined) {
                    soundIndex = this._currentIndex + 1;
                    sound = this._queue[soundIndex];
                } else if (this._options.loopQueue) {
                    // if last sound is playing and loop queue is enabled
                    // then on onEnded we go from last to first sound
                    soundIndex = 0;
                    sound = this._queue[soundIndex];
                }
                break;
            case PlayerCore.PLAY_SOUND_PREVIOUS:
                if (this._queue[this._currentIndex - 1] !== undefined) {
                    soundIndex = this._currentIndex - 1;
                    sound = this._queue[soundIndex];
                } else if (this._options.loopQueue) {
                    // if first sound of the queue is playing and loop queue is enabled
                    // then if previous() gets used, we jump to last sound in queue
                    soundIndex = this._queue.length - 1;
                    sound = this._queue[soundIndex];
                }
                break;
            case PlayerCore.PLAY_SOUND_FIRST:
                if (this._queue.length > 0) {
                    soundIndex = 0;
                    sound = this._queue[soundIndex];
                }
                break;
            case PlayerCore.PLAY_SOUND_LAST:
                if (this._queue.length > 0) {
                    soundIndex = this._queue.length - 1;
                    sound = this._queue[soundIndex];
                }
                break;
            default:
                // if "which sound to play" is a soundId
                // Note: soundId can be a string or number
                [sound, soundIndex] = this._findSoundById({ soundId: whichSound });
        }

        if (soundIndex !== null && updateIndex) {
            this._currentIndex = soundIndex;
        }

        return sound;

    }

    protected _findSoundById({ soundId }: IFindSoundById): [ISound, number] {

        let sound: ISound = null;
        let soundIndex = 0;

        this._queue.some((soundFromQueue, index) => {
            if (soundFromQueue.id === soundId) {
                sound = soundFromQueue;
                soundIndex = index;
                return true;
            } else {
                return false;
            }
        });

        return [sound, soundIndex];

    }

    protected _findBestSource(soundSource: (ISoundSource)[] | ISoundSource): IFindBestSourceResponse {

        const bestSource: IBestSource = {
            url: null,
            codec: null
        };

        let sources: (ISoundSource)[];

        // if the source is not an array but a single source object
        // we first transform it into an array
        if (!Array.isArray(soundSource)) {
            sources = [soundSource];
        } else {
            sources = soundSource;
        }

        let i = 0;

        while (i < sources.length) {

            const source = sources[i]
            let soundUrl = '';

            // if the player has set the baseUrl option for sounds, use it now
            if (this._options.soundsBaseUrl !== '') {
                soundUrl = this._options.soundsBaseUrl;
            }

            soundUrl += source.url;

            // check if the codec (if any got specified) is supported
            // by the device
            let isCodecSupported = true;

            if (source.codec !== null) {
                isCodecSupported = this._checkCodecSupport(source.codec);
            }

            if (isCodecSupported) {

                if (source.isPreferred) {
                    // if multiple sources but this one if preferred and if previous
                    // sources also had a supported codec we still overwrite the
                    // previous match
                    bestSource.url = soundUrl;
                    bestSource.codec = source.codec;
                    // as the source is marked as preferred and it is supported
                    // so we can exit early
                    break;
                } else {
                    // if no best source has been found so far, we don't
                    // care if it's preferred it's automatically chosen
                    // as being the best
                    bestSource.url = soundUrl;
                    bestSource.codec = source.codec;
                    // source is supported, but maybe there is preferred & supported
                    // so we don't exit the loop just yet and continue searching
                }

            }

            i++;

        }

        return bestSource;

    }

    protected _checkCodecSupport(codec: string): boolean {

        let mediaMimeTypes: string[];
        let error = '';

        switch (codec) {
            case 'ogg':
                mediaMimeTypes = ['audio/ogg; codecs="vorbis"'];
                break;
            case 'oga':
                mediaMimeTypes = ['audio/ogg; codecs="vorbis"'];
                break;
            case 'mp3':
                mediaMimeTypes = ['audio/mpeg; codecs="mp3"'];
                break;
            case 'opus':
                mediaMimeTypes = ['audio/ogg; codecs="opus"', 'audio/webm; codecs="opus"'];
                break;
            case 'wav':
                mediaMimeTypes = ['audio/wav; codecs="1"'];
                break;
            case 'm4a':
                mediaMimeTypes = ['audio/m4a;', 'audio/x-m4a;'];
                break;
            case 'm4p':
                mediaMimeTypes = ['audio/m4p;', 'audio/x-m4p;'];
                break;
            case 'caf':
                mediaMimeTypes = ['audio/x-caf;'];
                break;
            case 'aac':
                mediaMimeTypes = ['audio/aac;'];
                break;
            case 'weba':
            case 'webm':
                mediaMimeTypes = ['audio/webm; codecs="vorbis"'];
                break;
            case 'flac':
                mediaMimeTypes = ['audio/flac;', 'audio/x-flac;'];
                break;
            default:
                error = 'unrecognized codec';
                break;
        }

        if (error) {
            throw new Error(error);
        }

        return this._checkMimeTypesSupport(mediaMimeTypes);

    }

    protected _checkMimeTypesSupport(mediaMimeTypes: string[]): boolean {

        const deviceAudio = new Audio();

        let isSupported = false;

        mediaMimeTypes.forEach((mediaMimeType) => {

            const isMediaTypeSupported: string = deviceAudio.canPlayType(mediaMimeType).replace(/^no$/, '');

            if (isMediaTypeSupported) {
                isSupported = true;
            }

        });

        return isSupported;

    }

    public async pause(): Promise<ISound> {

        const currentSound = this._getSoundFromQueue({ whichSound: PlayerCore.CURRENT_SOUND });

        if (currentSound === null) {
            return currentSound;
        }

        if (currentSound.state === PlayerSound.SOUND_STATE_PAUSED) {
            return currentSound;
        }

        const currentTime = currentSound.getCurrentTime();

        currentSound.playTime = currentTime;

        if (this._options.loadPlayerMode === PlayerCore.PLAYER_MODE_AJAX) {
            currentSound.elapsedPlayTime = currentTime;
        }

        if (currentSound.onPaused !== null) {
            currentSound.onPaused(currentSound.playTime);
        }

        currentSound.state = PlayerSound.SOUND_STATE_PAUSED;

        await this._stop(currentSound);

        return currentSound;

    }

    public async stop(): Promise<ISound> {

        const currentSound = this._getSoundFromQueue({ whichSound: PlayerCore.CURRENT_SOUND });

        if (currentSound === null) {
            return currentSound;
        }

        if (currentSound.state === PlayerSound.SOUND_STATE_STOPPED) {
            return currentSound;
        }

        // on stop we freeze the audio context
        // as we assume it won't be needed right away
        await this._playerAudio.freezeAudioContext();

        if (currentSound.onStopped !== null) {
            currentSound.onStopped(currentSound.playTime);
        }

        currentSound.state = PlayerSound.SOUND_STATE_STOPPED;

        await this._stop(currentSound);

        return currentSound;

    }

    protected async _stop(sound: ISound): Promise<void> {

        if (this._playingProgressRequestId !== null) {
            cancelAnimationFrame(this._playingProgressRequestId);
            this._playingProgressRequestId = null;
        }

        if (sound.sourceNode !== null) {

            if (sound.sourceNode instanceof AudioBufferSourceNode) {
                // if using the AudioBufferSourceNode use the stop method
                sound.sourceNode.stop(0);
                // the "audio buffer" CAN be reused for multiple plays
                // however the "audio buffer source" CAN NOT, so we disconnect
                await this._playerAudio.disconnectSound(sound);
            }

            if (sound.sourceNode instanceof MediaElementAudioSourceNode) {
                // if using the MediaElementAudioSourceNode use the pause method
                sound.audioElement.pause();
            }

        }

        // if it is fully stopped, not just paused (or seeking)
        if (sound.state === PlayerSound.SOUND_STATE_STOPPED) {
            // reset sound values
            sound.isReadyToPLay = false;
            sound.firstTimePlayed = true;
            sound.startTime = 0;
            sound.elapsedPlayTime = 0;
            sound.playTime = 0;
            sound.playedTimePercentage = 0;
            // disconnect the sound
            await this._playerAudio.disconnectSound(sound);
        }

    }

    public async next(): Promise<ISound> {

        return await this.play({ whichSound: PlayerCore.PLAY_SOUND_NEXT });

    }

    public async previous(): Promise<ISound> {

        return await this.play({ whichSound: PlayerCore.PLAY_SOUND_PREVIOUS });

    }

    public async first(): Promise<ISound> {

        return await this.play({ whichSound: PlayerCore.PLAY_SOUND_FIRST });

    }

    public async last(): Promise<ISound> {

        return await this.play({ whichSound: PlayerCore.PLAY_SOUND_LAST });

    }

    public setVisibilityWatch(visibilityWatch: boolean): void {

        this._options.visibilityWatch = visibilityWatch;

        if (visibilityWatch) {
            document.addEventListener('visibilitychange', this._handleVisibilityChange.bind(this), false);
        } else {
            document.removeEventListener('visibilitychange', this._handleVisibilityChange.bind(this), false);
        }

    }

    public getVisibilityWatch(): boolean {
        return this._options.visibilityWatch;
    }

    public setVisibilityHiddenAction(visibilityHiddenAction: typeVisibilityHiddenAction): void {
        this._options.visibilityHiddenAction = visibilityHiddenAction;
    }

    public getVisibilityHiddenAction(): typeVisibilityHiddenAction {
        return this._options.visibilityHiddenAction;
    }

    protected _handleVisibilityChange(): void {

        let hiddenKeyword: string;

        if (typeof document.hidden !== 'undefined') {
            // Opera 12.10 and Firefox 18 and later support
            hiddenKeyword = 'hidden';

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } else if (typeof (document as any).msHidden !== 'undefined') {
            hiddenKeyword = 'msHidden';

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } else if (typeof (document as any).webkitHidden !== 'undefined') {
            hiddenKeyword = 'webkitHidden';
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((document as any)[hiddenKeyword]) {

            if (this._options.visibilityHiddenAction === PlayerCore.VISIBILITY_HIDDEN_ACTION_PAUSE) {

                const currentSound = this._getSoundFromQueue({ whichSound: PlayerCore.CURRENT_SOUND });

                if (currentSound === null) {
                    return;
                }
        
                if (currentSound.state === PlayerSound.SOUND_STATE_PLAYING) {
                    this.pause();
                    this._postVisibilityHiddenPlaying = true;
                } else {
                    this._postVisibilityHiddenPlaying = false;
                }

            } else if (this._options.visibilityHiddenAction === PlayerCore.VISIBILITY_HIDDEN_ACTION_MUTE) {
                this.mute();
            }
        } else {
            if (this._options.visibilityHiddenAction === PlayerCore.VISIBILITY_HIDDEN_ACTION_PAUSE && this._postVisibilityHiddenPlaying === true) {
                this.play();
            } else if (this._options.visibilityHiddenAction === PlayerCore.VISIBILITY_HIDDEN_ACTION_MUTE) {
                this.unMute();
            }
        }

    }

    public async manuallyUnlockAudio() {

        await this._playerAudio.unlockAudio();

    }

    public async disconnect(): Promise<void> {

        // adding another check here to cancel animation frame because:
        // a player can be disconnect while song is paused or playing
        // which means the cancelAnimationFrame in _stop would never get triggered
        if (this._playingProgressRequestId !== null) {
            cancelAnimationFrame(this._playingProgressRequestId);
            this._playingProgressRequestId = null;
        }

        await this._playerAudio.shutDown(this._queue);

    }

    public async getAudioContext(): Promise<AudioContext> {

        const audioContext = await this._playerAudio.getAudioContext();

        return audioContext;

    }

    public getCurrentSound(): ISound {

        return this._getSoundFromQueue({ whichSound: PlayerCore.CURRENT_SOUND });

    }

}

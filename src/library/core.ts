import { PlayerSound, ISound, ISoundAttributes, ISoundSource, typeSoundStates } from './sound';
import {
    PlayerAudio,
    IAudioGraph,
    IAudioOptions,
    IAudioBufferSourceOptions,
    IMediaElementAudioSourceOptions,
    IMediaElementAudioSourceNode
} from './audio';
import { PlayerRequest } from './request';
import { PlayerError, IPlayerError } from './error';

const PLAYER_MODE_AUDIO = 'player_mode_audio';
const PLAYER_MODE_AJAX = 'player_mode_ajax';
const PLAYER_MODE_FETCH = 'player_mode_fetch';

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

interface IBestSource {
    url: string | null;
    codec?: string;
}

export class PlayerCore {

    // the sounds queue
    protected _queue: ISound[];
    // the volume (0 to 100)
    protected _volume: number;
    // the base url that all sounds will have in common
    protected _soundsBaseUrl: string;
    // the current sound in queue index
    protected _currentIndex: number;
    // instance of the audio library class
    protected _playerAudio: PlayerAudio;
    // playing progress time interval
    protected _playingProgressIntervalTime: number;
    // playing progress timeoutID
    protected _playingTimeoutID: number | null = null;
    // when a song finishes, automatically play the next one
    protected _playNextOnEnded: boolean;
    // do we start over again at the end of the queue
    protected _loopQueue: boolean;
    // do we start over again at the end of the song
    protected _loopSong: boolean;
    // a custon audioGraph created by the user
    protected _customAudioGraph: IAudioGraph | null = null;
    // a custom audio context created by the user
    protected _customAudioContext: AudioContext | null = null;
    // stop the song currently being played on (queue) reset
    protected _stopOnReset: boolean;
    // the volume level before we muted
    protected _postMuteVolume: number = null;
    // is muted?
    protected _isMuted = false;
    // automatically mute if visibility changes to invisible
    protected _visibilityAutoMute: boolean;
    // auto create audiocontext on first touch / click
    protected _createAudioContextOnFirstUserInteraction: boolean;
    // save the volume value in localstorage
    protected _persistVolume: boolean;
    // mode used to load songs
    protected _loadPlayerMode: typePlayerModes;

    // constants
    static readonly WHERE_IN_QUEUE_AT_END: string = 'append';
    static readonly WHERE_IN_QUEUE_AT_START: string = 'prepend';
    static readonly WHERE_IN_QUEUE_AFTER_CURRENT: string = 'afterCurrent';

    static readonly PLAY_SOUND_NEXT = 'next';
    static readonly PLAY_SOUND_PREVIOUS = 'previous';
    static readonly PLAY_SOUND_FIRST = 'first';
    static readonly PLAY_SOUND_LAST = 'last';

    static readonly PLAYER_MODE_AUDIO = 'player_mode_audio';
    static readonly PLAYER_MODE_AJAX = 'player_mode_ajax';
    static readonly PLAYER_MODE_FETCH = 'player_mode_fetch';

    constructor(playerOptions: ICoreOptions = {}) {

        const defaultOptions: ICoreOptions = {
            volume: 80,
            loopQueue: false,
            loopSong: false,
            soundsBaseUrl: '',
            playingProgressIntervalTime: 1000,
            playNextOnEnded: true,
            audioGraph: null,
            audioContext: null,
            stopOnReset: true,
            visibilityAutoMute: false,
            createAudioContextOnFirstUserInteraction: true,
            persistVolume: true,
            loadPlayerMode: PLAYER_MODE_AUDIO
        };

        const options = Object.assign({}, defaultOptions, playerOptions);

        this._volume = options.volume;
        this._soundsBaseUrl = options.soundsBaseUrl;
        this._queue = [];
        this._currentIndex = 0;
        this._playingProgressIntervalTime = options.playingProgressIntervalTime;
        this._playNextOnEnded = options.playNextOnEnded;
        this._loopQueue = options.loopQueue;
        this._loopSong = options.loopSong;
        this._stopOnReset = options.stopOnReset;
        this._visibilityAutoMute = options.visibilityAutoMute;
        this._createAudioContextOnFirstUserInteraction = options.createAudioContextOnFirstUserInteraction;
        this._persistVolume = options.persistVolume;
        this._loadPlayerMode = options.loadPlayerMode;

        if (typeof options.audioContext !== 'undefined') {
            this._customAudioContext = options.audioContext;
        }

        if (typeof options.audioGraph !== 'undefined') {
            this._customAudioGraph = options.audioGraph;
        }

        this._initialize();

    }

    protected _initialize(): void {

        let audioOptions: IAudioOptions;

        switch (this._loadPlayerMode) {
            case PlayerCore.PLAYER_MODE_AUDIO:

                if (!this._detectAudioContextSupport()) {
                    throw new PlayerError('audio context is not supported by this device');
                }

                audioOptions = this._webAudioApiOptions();
                break;
            case PlayerCore.PLAYER_MODE_AJAX:

                if (!this._detectAudioElementSupport()) {
                    throw new PlayerError('audio context is not supported by this device');
                }

                audioOptions = this._webAudioElementOptions();
                break;
        }

        // player audio library instance
        this._playerAudio = new PlayerAudio(audioOptions);

    }

    protected _webAudioApiOptions(): IAudioOptions {

        const webAudioApiOptions: IAudioOptions = {
            customAudioContext: this._customAudioContext,
            customAudioGraph: this._customAudioGraph,
            createAudioContextOnFirstUserInteraction: this._createAudioContextOnFirstUserInteraction,
            persistVolume: this._persistVolume,
            loadPlayerMode: this._loadPlayerMode
        };

        return webAudioApiOptions;

    }

    protected _webAudioElementOptions(): IAudioOptions {

        const webAudioElementOptions: IAudioOptions = {
            customAudioContext: null,
            customAudioGraph: null,
            createAudioContextOnFirstUserInteraction: false,
            persistVolume: this._persistVolume,
            loadPlayerMode: this._loadPlayerMode
        };

        return webAudioElementOptions;

    }

    protected _detectAudioContextSupport(): boolean {

        // basic audio context detection
        let audioContextSupported = false;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (typeof (window as any).webkitAudioContext !== 'undefined') {
            audioContextSupported = true;
        } else if (typeof AudioContext !== 'undefined') {
            audioContextSupported = true;
        }

        return audioContextSupported;

    }

    protected _detectAudioElementSupport(): boolean {

        // basic audio element detection
        return !!document.createElement('audio').canPlayType;

    }

    public addSoundToQueue({ soundAttributes, whereInQueue = PlayerCore.WHERE_IN_QUEUE_AT_END }: ISoundsQueueOptions): ISound {

        const sound: ISound = new PlayerSound(soundAttributes);

        // TODO: is queue just an array of sounds, or do we need something more complex with a position tracker?

        // TODO: allow array of soundAttributes to be injected, to create several at once, if input is an array output should be too

        switch (whereInQueue) {
            case PlayerCore.WHERE_IN_QUEUE_AT_END:
                this._appendSoundToQueue(sound);
                break;
            case PlayerCore.WHERE_IN_QUEUE_AT_START:
                this._prependSoundToQueue(sound);
                break;
            case PlayerCore.WHERE_IN_QUEUE_AFTER_CURRENT:
                this._prependSoundToQueue(sound);
                break;
        }

        return sound;

    }

    public _appendSoundToQueue(sound: ISound): void {

        this._queue.push(sound);

    }

    public _prependSoundToQueue(sound: ISound): void {

        this._queue.unshift(sound);

    }

    public _addSoundToQueueAfterCurrent(sound: ISound): void {

        // TODO: add option to play after being added or user uses play method?

        // if there is no current song yet, append the song to the queue
        if (this._currentIndex === null) {

            this._appendSoundToQueue(sound);

        } else {

            const afterCurrentIndex = this._currentIndex + 1;

            this._queue.splice(afterCurrentIndex, 0, sound);

        }

    }

    public resetQueue(): void {

        // check if a song is getting played and stop it
        if (this._stopOnReset) {
            this.stop();
        }

        // TODO: destroy all the sounds or clear the cached buffers?

        this._queue = [];

    }

    public reset(): void {

        this.resetQueue();

    }

    public getQueue(): ISound[] {

        // TODO: is this needed?

        return this._queue;

    }

    public setVolume(volume: number): void {

        this._volume = volume;
        this._isMuted = false;

        // get the current sound if any
        const currentSound = this._getSoundFromQueue();

        // if there is a sound currently being played
        if (currentSound !== null && currentSound.state === PlayerSound.SOUND_STATE_PLAYING) {
            this._playerAudio.changeVolume({ volume: volume, sound: currentSound, forceUpdateUserVolume: true });
        }

    }

    public getVolume(): number {

        return this._volume;

    }

    public mute(): void {

        const currentVolume = this.getVolume();

        this._postMuteVolume = currentVolume;

        // get the current sound if any
        const currentSound = this._getSoundFromQueue();

        // if there is a sound currently being played
        if (currentSound !== null && currentSound.state === PlayerSound.SOUND_STATE_PLAYING) {
            this._playerAudio.changeVolume({ volume: 0, sound: currentSound, forceUpdateUserVolume: false });
        }

        this._isMuted = true;

    }

    public unMute(): void {

        // get the current sound if any
        const currentSound = this._getSoundFromQueue();

        // if there is a sound currently being played
        if (currentSound !== null && currentSound.state === PlayerSound.SOUND_STATE_PLAYING) {
            this._playerAudio.changeVolume({ volume: this._postMuteVolume, sound: currentSound, forceUpdateUserVolume: false });
        }

        this._isMuted = false;

    }

    public isMuted(): boolean {

        return this._isMuted;

    }

    public setPosition(soundPositionInPercent: number): void {

        // get the current sound if any
        const currentSound = this._getSoundFromQueue();

        // if there is a sound currently being played
        if (currentSound !== null) {

            // check if the duration got set manually
            if (currentSound.duration === null || isNaN(currentSound.duration)) {

                // the user can set the sound duration manually but if he didn't the song has to
                // get preloaded as the duration is a property of the audioBuffer
                this._loadSound(currentSound)
                    .then((sound: ISound) => {

                        // calculate the position in seconds
                        const soundPositionInSeconds = (sound.duration / 100) * soundPositionInPercent;

                        this.setPositionInSeconds(soundPositionInSeconds);

                    }).catch((error: PlayerError) => {

                        throw error;

                    });

            } else {

                // calculate the position in seconds
                const soundPositionInSeconds = (currentSound.duration / 100) * soundPositionInPercent;

                this.setPositionInSeconds(soundPositionInSeconds);

            }

        } else {

            throw new PlayerError('position change called, but no current sound found');

        }

    }

    public setPositionInSeconds(soundPositionInSeconds: number): void {

        // get the current sound if any
        const currentSound = this._getSoundFromQueue();

        // if there is a sound currently being played
        if (currentSound !== null) {

            // is the song is being played
            if (currentSound.state === PlayerSound.SOUND_STATE_PLAYING) {

                // stop the track playback
                this.pause();

                // start the playback at the given position
                this.play({ whichSound: currentSound.id, playTimeOffset: soundPositionInSeconds });

            } else {

                // only set the sound position but don't play
                currentSound.playTimeOffset = soundPositionInSeconds;

            }

        } else {

            throw new PlayerError('position change called, but no current sound found');

        }

    }

    protected _loadSound(sound: ISound): Promise<ISound | PlayerError> {

        let loadSoundPromise;
        let notImplementedError;

        switch (this._loadPlayerMode) {
            case PlayerCore.PLAYER_MODE_AUDIO:
                loadSoundPromise = this._loadSoundUsingAudioElement(sound);
                break;
            case PlayerCore.PLAYER_MODE_AJAX:
                loadSoundPromise = this._loadSoundUsingRequest(sound);
                break;
            case PlayerCore.PLAYER_MODE_FETCH:

                // TODO: implement fetch

                notImplementedError = new PlayerError(PlayerCore.PLAYER_MODE_FETCH + ' is not implemented yet', 1);

                loadSoundPromise = Promise.reject(notImplementedError);

                break;
        }

        return loadSoundPromise;

    }

    protected _loadSoundUsingAudioElement(sound: ISound): Promise<ISound | PlayerError> {

        return new Promise((resolve, reject) => {

            // extract the url and codec from sources
            const { url, codec = null } = this._findBestSource(sound.source);

            sound.url = url;
            sound.codec = codec;
            sound.arrayBuffer = null;

            if (sound.url !== null) {

                const audioElement = new Audio();

                // in chrome you will get this error message in the console:
                // "MediaElementAudioSource outputs zeroes due to CORS access restrictions"
                // to fix this put crossOrigin to anonymous or change the cors
                // Access-Control-Allow-Origin header of the server to *
                // "crossOrigin" has to be set before "src"
                audioElement.crossOrigin = 'anonymous';

                audioElement.src = sound.url;
                audioElement.controls = false;
                audioElement.autoplay = false;

                document.body.appendChild(audioElement);

                sound.audioElement = audioElement;
                sound.duration = audioElement.duration;
                sound.isReadyToPLay = true;

                this._initializeAudioElementListeners(sound);

                sound.audioElement.addEventListener('canplaythrough', () => {
                    //console.log('BBBBBBBBBBBB', event, sound);
                    resolve(sound);
                });

                sound.audioElement.addEventListener('error', () => {
                    //console.log('CCCCCCCCCCCC', event, sound);
                    const soundLoadingError = new PlayerError('loading sound failed');
                    reject(soundLoadingError);
                });

            } else {

                const noUrlError = new PlayerError('sound has no url', 1);

                reject(noUrlError);

            }

        });

    }

    protected _loadSoundUsingRequest(sound: ISound): Promise<ISound | PlayerError> {

        // TODO: would be good to cache buffers, so need to check if is in cache
        // let the user choose (by setting an option) what amount of sounds will be cached
        // add a cached date / timestamp to be able to clear cache by oldest first
        // or even better add a played counter to cache by least played and date

        return new Promise((resolve, reject) => {

            // if the sound already has an AudioBuffer
            if (sound.audioBuffer !== null) {
                resolve(sound);
            }

            // if the sound has already an ArrayBuffer but no AudioBuffer
            if (sound.arrayBuffer !== null && sound.audioBuffer === null) {

                this._decodeSound({ sound }).then((sound: ISound) => {
                    resolve(sound);
                }).catch(reject)

            }

            // if the sound has no ArrayBuffer and also no AudioBuffer yet
            if (sound.arrayBuffer === null && sound.audioBuffer === null) {

                // extract the url and codec from sources
                const { url, codec = null } = this._findBestSource(sound.source);

                sound.url = url;
                sound.codec = codec;

                if (sound.url !== null) {

                    const request = new PlayerRequest();

                    // change buffering state
                    sound.isBuffering = true;

                    request.getArrayBuffer(sound).then((arrayBuffer: ArrayBuffer) => {

                        sound.arrayBuffer = arrayBuffer;

                        this._decodeSound({ sound }).then((sound: ISound) => {
                            resolve(sound);
                        }).catch(reject)

                    }).catch((requestError: IPlayerError) => {

                        reject(requestError);

                    });

                } else {

                    const noUrlError = new PlayerError('sound has no url', 1);

                    reject(noUrlError);

                }

            }

        });

    }

    protected _initializeAudioElementListeners(sound: ISound): void {

        // TODO: use the events to change isReadyToPLay to true? like canplaythrough?
        // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio#Events
        // abort
        // canplaythrough
        // error
        // loadeddata
        // loadstart
        // play
        // playing
        // progress
        // timeupdate
        // volumechange
        // waiting
        // see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/canplaythrough_event
        // TODO: how does canplaythrough behave if the source is a stream?

        sound.audioElement.addEventListener('progress', () => {

            //console.log('AAAAAAAAAAA', event, sound.audioElement.buffered.length, sound.audioElement.duration);

            /*for (let i = 0; i < sound.audioElement.buffered.length; i++) {
                console.log('********buffered', sound.audioElement.buffered.start(i), sound.audioElement.buffered.end(i));
            }*/

            /*if (sound.audioElement.buffered.length > 0
                && !isNaN(sound.audioElement.duration)) {
                    const endBuf = sound.audioElement.buffered.end(0);
                    const soFar = ((endBuf / sound.audioElement.duration) * 100);
                    console.log('********buffered222222 soFar', soFar);
            }*/

            sound.loadingProgress = sound.audioElement.duration;

        });

        sound.audioElement.addEventListener('timeupdate', () => {
            sound.duration = sound.audioElement.duration;
        });

    }

    protected _decodeSound({ sound }: IDecodeSoundOptions): Promise<ISound> {

        const arrayBuffer = sound.arrayBuffer;

        return this._playerAudio.decodeAudio(arrayBuffer).then((audioBuffer: AudioBuffer) => {

            sound.audioBuffer = audioBuffer;
            sound.isBuffering = false;
            sound.isBuffered = true;
            sound.audioBufferDate = new Date();
            sound.duration = sound.audioBuffer.duration;
            sound.isReadyToPLay = true;

            return sound;

        }).catch((decodeAudioError: IPlayerError) => {

            throw decodeAudioError;

        });

    }

    public play({ whichSound, playTimeOffset }: IPlayOptions = {}): Promise<void> {

        return new Promise((resolve, reject) => {

            // TODO: check the available codecs and defined sources, play the first one that has matches and available codec
            // TODO: let user define order of preferred codecs for playerback

            // get the current sound if any
            const currentSound = this._getSoundFromQueue();

            // if there is a sound currently being played, stop the current sound
            if (currentSound !== null && currentSound.state === PlayerSound.SOUND_STATE_PLAYING) {
                this.stop();
            }

            // whichSound is optional, if set it can be the sound id or if it's a string it can be next / previous / first / last
            const sound = this._getSoundFromQueue({ whichSound });

            // if there is no sound we could play, do nothing
            if (sound === null) {
                throw new Error('no more sounds in array');
            }

            // if the user wants to play the sound from a certain position
            if (playTimeOffset !== undefined) {
                sound.playTimeOffset = playTimeOffset;
            }

            // has the sound already been loaded?
            if (!sound.isReadyToPLay) {

                this._loadSound(sound).then(() => {

                    this._play(sound).then(resolve).catch(reject);

                }).catch(reject);

            } else {

                this._play(sound).then(resolve).catch(reject);

            }

        });

    }

    protected async _play(sound: ISound): Promise<void> {

        // update the volume
        let volume = this._volume;

        if (this._isMuted) {
            volume = 0;
        }

        this._volume = this._playerAudio.changeVolume({ volume: volume, sound: sound, forceUpdateUserVolume: false });

        // start playing
        if (sound.audioBuffer !== null) {
            await this._playAudioBuffer(sound);
        } else {
            await this._playMediaElementAudio(sound);
        }

        // state is now playing
        sound.state = PlayerSound.SOUND_STATE_PLAYING;

        // the audiocontext time right now (since the audiocontext got created)
        sound.startTime = sound.getCurrentTime();

        sound = this._setupSoundEvents(sound);

    }

    protected async _playAudioBuffer(sound: ISound): Promise<void> {

        if (sound.audioBufferSourceNode === null) {

            // source node options
            const sourceOptions: IAudioBufferSourceOptions = {
                loop: sound.loop,
                onEnded: (event: Event) => {
                    console.log('AudioBufferSourceNode ended', event);
                }
            };

            // create an audio buffer source node
            try {
                await this._playerAudio.createAudioBufferSourceNode(sourceOptions, sound);
            } catch (error) {
                throw new PlayerError(error);
            }

        }

        const audioBufferSourceNode: AudioBufferSourceNode = sound.audioBufferSourceNode;

        // add the buffer to the source node
        audioBufferSourceNode.buffer = sound.audioBuffer;

        // connect the source to the graph node(s)
        this._playerAudio.connectSourceNodeToGraphNodes(audioBufferSourceNode);

        // start playback
        // start(when, offset, duration)
        try {
            if (sound.playTimeOffset !== undefined) {
                audioBufferSourceNode.start(0, sound.playTimeOffset);
            } else {
                audioBufferSourceNode.start();
            }
        } catch (error) {
            throw new PlayerError(error);
        }

    }

    protected async _playMediaElementAudio(sound: ISound): Promise<void> {

        if (sound.mediaElementAudioSourceNode === null) {

            // source node options
            const sourceOptions: IMediaElementAudioSourceOptions = {
                loop: sound.loop,
                onEnded: (event: Event) => {
                    console.log('MediaElementSourceNode ended', event);
                },
                mediaElement: sound.audioElement
            };

            // create an media element audio source node
            try {
                await this._playerAudio.createMediaElementSourceNode(sourceOptions, sound);
            } catch (error) {
                throw new PlayerError(error);
            }

        }

        const mediaElementAudioSourceNode: IMediaElementAudioSourceNode = sound.mediaElementAudioSourceNode as IMediaElementAudioSourceNode;

        // connect the source to the graph node(s)
        this._playerAudio.connectSourceNodeToGraphNodes(mediaElementAudioSourceNode);

        // if an offset is defined use to play from a defined position
        if (sound.playTimeOffset !== undefined && !isNaN(sound.playTimeOffset)) {

            // TODO: problem if sound has not loaded until for example 90% but position gets set to 90%
            // the position will jump back
            // need to wait for sound to have loaded that part, use events???

            sound.audioElement.currentTime = sound.playTimeOffset;
        }

        try {
            mediaElementAudioSourceNode.mediaElement.play();
        } catch (error) {
            throw new PlayerError(error);
        }

    }

    protected _setupSoundEvents(sound: ISound): ISound {

        // trigger resumed event
        if (sound.onResumed !== null && !sound.firstTimePlayed) {
            sound.onResumed(sound.playTimeOffset);
        }

        // trigger started event
        if (sound.onStarted !== null && sound.firstTimePlayed) {

            sound.onStarted(sound.playTimeOffset);
            sound.firstTimePlayed = false;

        }

        // trigger playing event
        if (sound.onPlaying !== null) {

            // at interval set playing progress
            this._playingTimeoutID = window.setInterval(() => {
                this._playingProgress(sound);
            }, this._playingProgressIntervalTime);

        } else {

            this._playingTimeoutID = null;

        }

        return sound;

    }

    protected _onEnded(): void {

        // get the current sound if any
        const currentSound = this._getSoundFromQueue();

        // if there is a sound currently being played
        if (currentSound !== null && currentSound.state === PlayerSound.SOUND_STATE_PLAYING) {

            const updateIndex = false;

            const nextSound = this._getSoundFromQueue({ whichSound: 'next', updateIndex });

            if (currentSound.onEnded !== null) {

                let willPlayNext = false;

                // check if there is another sound in the queue and if playing
                // the next one on ended is activated
                if (nextSound !== null && this._playNextOnEnded) {
                    willPlayNext = true;
                }

                currentSound.onEnded(willPlayNext);

            }

            // reset the is first time sound is being played to true
            currentSound.firstTimePlayed = true;

            // reset the playTimeOffset
            currentSound.playTimeOffset = 0;

            this._stop(currentSound, PlayerSound.SOUND_STATE_STOPPED);

            if (nextSound !== null) {

                if (this._playNextOnEnded) {
                    this.play({ whichSound: 'next' });
                }

            } else {

                // we reached the end of the queue set the currentIndex back to zero
                this._currentIndex = 0;

                // if queue loop is active then play
                if (this._loopQueue) {
                    this.play();
                }

            }

        }

    }

    /**
     * whichSound is optional, if set it can be the sound id or if it's
     * a string it can be next / previous / first / last
     */
    protected _getSoundFromQueue({ whichSound, updateIndex = true }: IGetSoundFromQueue = {}): ISound | null {

        let sound = null;

        // check if the queue is empty
        if (this._queue.length === 0) {
            return sound;
        }

        // if which song to play did not get specified, play one based from the queue based on the queue index position marker
        if (whichSound === undefined && this._queue[this._currentIndex] !== undefined) {

            sound = this._queue[this._currentIndex];

        } else if (typeof whichSound === 'number') {

            // if "which sound to play" (soundId) is a numeric ID
            // the case where soundId is a string is handled below
            sound = this._findSoundById({ soundId: whichSound, updateIndex });

        } else {

            let soundIndex: number | null = null;

            // if which song to play is a constant
            switch (whichSound) {
                case PlayerCore.PLAY_SOUND_NEXT:
                    if (this._queue[this._currentIndex + 1] !== undefined) {
                        soundIndex = this._currentIndex + 1;
                        sound = this._queue[soundIndex];
                    }
                    break;
                case PlayerCore.PLAY_SOUND_PREVIOUS:
                    if (this._queue[this._currentIndex - 1] !== undefined) {
                        soundIndex = this._currentIndex - 1;
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
                        soundIndex = this._queue.length - 2;
                        sound = this._queue[soundIndex];
                    }
                    break;
                default:
                    // if "which sound to play" (soundId) is a string
                    sound = this._findSoundById({ soundId: whichSound, updateIndex });
            }

            if (soundIndex !== null && updateIndex) {
                this._currentIndex = soundIndex;
            }

        }

        return sound;

    }

    protected _findSoundById({ soundId, updateIndex }: IFindSoundById): ISound | null {

        let sound = null;

        this._queue.some((soundFromQueue: ISound, queueIndex: number) => {

            if (soundFromQueue.id === soundId) {

                sound = soundFromQueue;

                if (updateIndex) {
                    this._currentIndex = queueIndex;
                }

                return true;

            }

        });

        return sound;

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

        sources.forEach((source) => {

            let soundUrl = '';

            // if the player had as option a baseUrl for sounds add it now
            if (this._soundsBaseUrl !== '') {
                soundUrl = this._soundsBaseUrl;
            }

            soundUrl += source.url;

            // check if the codec (if any got specified) is supported
            // by the device
            let isCodecSupported = true;

            if (source.codec !== null) {
                isCodecSupported = this._checkCodecSupport(source.codec);
            }

            // only if the codec of the source is supported
            if (isCodecSupported)

            if (bestSource.url !== null && source.isPreferred) {

                // if multiple sources but this one if preferred and if previous
                // sources also had a supported codec we still overwrite the
                // previous match
                bestSource.url = soundUrl;
                bestSource.codec = source.codec;

            } else {

                // if no best source has been found so far, we don't
                // care if it's preferred it's automatically chosen
                // as best
                bestSource.url = soundUrl;
                bestSource.codec = source.codec;

            }

        });

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
                error = 'unrecognised codec';
                break;
        }

        if (error) {
            throw new PlayerError(error);
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

    public pause(): void {

        // get the current sound
        const sound: ISound | null = this._getSoundFromQueue();

        if (sound === null) {
            return;
        }

        if (sound.state === PlayerSound.SOUND_STATE_PAUSED) {
            // TODO: just return or throw an error
            return;
        }

        const timeAtPause = sound.getCurrentTime();

        sound.playTimeOffset += timeAtPause - sound.startTime;

        // trigger paused event
        if (sound.onPaused !== null) {
            sound.onPaused(sound.playTimeOffset);
        }

        // using stop here as even if it is a pause you can't call play again
        // re-using an audio buffer source node is not allowed, so no matter what
        // we will have to create a new one
        this._stop(sound, PlayerSound.SOUND_STATE_PAUSED);

    }

    public stop(): void {

        // get the current sound
        const sound: ISound | null = this._getSoundFromQueue();

        if (sound === null) {
            return;
        }

        if (sound.state === PlayerSound.SOUND_STATE_STOPPED) {
            // TODO: just return or throw an error
            return;
        }

        // reset the is first time sound is being played to true
        sound.firstTimePlayed = true;

        // trigger stopped event
        if (sound.onStopped !== null) {
            sound.onStopped(sound.playTimeOffset);
        }

        // reset the playTimeOffset
        sound.playTimeOffset = 0;

        this._stop(sound, PlayerSound.SOUND_STATE_STOPPED);

    }

    protected _stop(sound: ISound, soundState: typeSoundStates): void {

        // tell the source node to stop playing
        if (sound.audioBufferSourceNode !== null) {

            // to stop playing if using the AudioBufferSourceNode use the stop method
            sound.audioBufferSourceNode.stop(0);

        } else if (sound.mediaElementAudioSourceNode !== null) {

            // to stop playing if using the MediaElementAudioSourceNode use the pause method
            sound.mediaElementAudioSourceNode.mediaElement.pause();

        } else {
            throw new PlayerError('can\'t stop as no source node in sound');
        }

        // destroy the audio buffer source node as it can anyway only get used once
        this._playerAudio.destroySourceNode(sound);

        // state is now stopped
        sound.state = soundState;

        if (this._playingTimeoutID !== null) {

            // clear the playing progress setInterval
            clearInterval(this._playingTimeoutID);

        }

    }

    public next(): void {

        // alias for play next
        this.play({ whichSound: 'next' });

    }

    public previous(): void {

        // alias for play previous
        this.play({ whichSound: 'previous' });

    }

    public first(): void {

        // alias for play first
        this.play({ whichSound: 'first' });

    }

    public last(): void {

        // alias for play last
        this.play({ whichSound: 'last' });

    }

    protected _playingProgress(sound: ISound): void {

        const timeNow = sound.getCurrentTime();

        sound.playTime = (timeNow - sound.startTime) + sound.playTimeOffset;

        const duration = sound.getDuration();
        const playingPercentage = (sound.playTime / duration) * 100;

        sound.playedTimePercentage = playingPercentage;

        sound.onPlaying(playingPercentage, duration, sound.playTime);

    }

    public setAudioGraph(customAudioGraph: IAudioGraph): void {

        this._playerAudio.setAudioGraph(customAudioGraph);

        this._customAudioGraph = customAudioGraph;

    }

    public getAudioGraph(): Promise<IAudioGraph> {

        return new Promise((resolve, reject) => {

            this._playerAudio.getAudioGraph().then((audioGraph: IAudioGraph) => {

                this._customAudioGraph = audioGraph;

                resolve(audioGraph);

            }).catch(reject);

        });

    }

    public setAudioContext(customAudioContext: AudioContext): void {

        this._playerAudio.setAudioContext(customAudioContext);

        this._customAudioContext = customAudioContext;

    }

    public getAudioContext(): Promise<AudioContext> {

        return new Promise((resolve, reject) => {

            this._playerAudio.getAudioContext().then((audioContext: AudioContext) => {

                this._customAudioContext = audioContext;

                resolve(audioContext);

            }).catch(reject);

        });

    }

    public setVisibilityAutoMute(visibilityAutoMute: boolean): void {

        this._visibilityAutoMute = visibilityAutoMute;

        if (visibilityAutoMute) {
            document.addEventListener('visibilitychange', this._handleVisibilityChange.bind(this), false);
        } else {
            document.removeEventListener('visibilitychange', this._handleVisibilityChange.bind(this), false);
        }

    }

    public getVisibilityAutoMute(): boolean {
        return this._visibilityAutoMute;
    }

    protected _handleVisibilityChange(): void {

        let hiddenKeyword: string;

        if (typeof document.hidden !== 'undefined') { // Opera 12.10 and Firefox 18 and later support
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
            this.mute();
        } else {
            this.unMute();
        }
    }

}

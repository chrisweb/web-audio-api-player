import { PlayerSound, ISound, ISoundAttributes, ISoundSource, typeSoundStates } from './sound';
import {
    PlayerAudio,
    IAudioOptions,
    IAudioBufferSourceOptions,
    IMediaElementAudioSourceOptions,
} from './audio';
import { PlayerRequest } from './request';
import { PlayerError, IPlayerError } from './error';

const PLAYER_MODE_AUDIO = 'player_mode_audio';
const PLAYER_MODE_AJAX = 'player_mode_ajax';
const PLAYER_MODE_FETCH = 'player_mode_fetch';

const WHERE_IN_QUEUE_AT_START = 'prepend';
const WHERE_IN_QUEUE_AT_END = 'append';

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
    createAudioContextOnFirstUserInteraction?: boolean;
    persistVolume?: boolean;
    loadPlayerMode?: typePlayerMode;
    audioContext?: AudioContext;
}

export interface ISoundsQueueOptions {
    soundAttributes: ISoundAttributes;
    whereInQueue?: typeWhereInQueue;
}

interface IDecodeSoundOptions {
    sound: ISound;
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
    // the current sound in queue index
    protected _currentIndex: number;
    // instance of the audio library class
    protected _playerAudio: PlayerAudio;
    // playing progress animation frame request id
    protected _playingProgressRequestId: number = null;
    // playing progress animation frame previous timestamp
    protected _playingProgressPreviousTimestamp: DOMHighResTimeStamp = 0;
    // value of the volume before we muted
    protected _postMuteVolume: number
    // user player options
    protected _options: ICoreOptions;

    // constants
    static readonly WHERE_IN_QUEUE_AT_END = 'append';
    static readonly WHERE_IN_QUEUE_AT_START = 'prepend';

    static readonly PLAY_SOUND_NEXT = 'next';
    static readonly PLAY_SOUND_PREVIOUS = 'previous';
    static readonly PLAY_SOUND_FIRST = 'first';
    static readonly PLAY_SOUND_LAST = 'last';

    static readonly CURRENT_SOUND = 'current';

    static readonly PLAYER_MODE_AUDIO = 'player_mode_audio';
    static readonly PLAYER_MODE_AJAX = 'player_mode_ajax';
    static readonly PLAYER_MODE_FETCH = 'player_mode_fetch';

    constructor(playerOptions: ICoreOptions = {}) {

        const defaultOptions: ICoreOptions = {
            volume: 80,
            loopQueue: false,
            loopSong: false,
            soundsBaseUrl: '',
            playingProgressIntervalTime: 200,
            playNextOnEnded: true,
            stopOnReset: true,
            visibilityAutoMute: false,
            createAudioContextOnFirstUserInteraction: true,
            persistVolume: true,
            loadPlayerMode: PLAYER_MODE_AUDIO,
            audioContext: null,
        };

        const options = Object.assign({}, defaultOptions, playerOptions);

        this._queue = [];
        this._currentIndex = null;
        this._options = options;

        this._initialize();

    }

    protected _initialize(): void {

        const audioOptions = this._audioOptions();

        // player audio library instance
        this._playerAudio = new PlayerAudio(audioOptions);

        switch (this._options.loadPlayerMode) {
            case PlayerCore.PLAYER_MODE_AUDIO:
                if (!this._playerAudio.detectAudioContextSupport()) {
                    throw new PlayerError('audio context is not supported by this device');
                }
                if (!this._playerAudio.detectAudioElementSupport()) {
                    throw new PlayerError('audio element is not supported by this device');
                }
                break;
            case PlayerCore.PLAYER_MODE_AJAX:
                if (!this._playerAudio.detectAudioContextSupport()) {
                    throw new PlayerError('audio context is not supported by this device');
                }
                break;
        }

    }

    protected _audioOptions(): IAudioOptions {

        const audioOptions: IAudioOptions = {
            audioContext: this._options.audioContext,
            createAudioContextOnFirstUserInteraction: this._options.createAudioContextOnFirstUserInteraction,
            volume: this._options.volume,
            persistVolume: this._options.persistVolume,
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

    public _appendSoundToQueue(sound: ISound): void {

        this._queue.push(sound);

    }

    public _prependSoundToQueue(sound: ISound): void {

        this._queue.unshift(sound);

    }

    public resetQueue(): void {

        // check if sound should be stopped on reset
        if (this._options.stopOnReset) {
            this.stop();
        }

        // TODO: destroy all the sounds or clear the cached buffers manually
        // or will garbage collector do it?

        this._queue = [];

    }

    public reset(): void {

        this.resetQueue();

    }

    public getQueue(): ISound[] {
        
        return this._queue;

    }

    public setVolume(volume: number): void {

        this._playerAudio.setVolume(volume)

    }

    public getVolume(): number {

        return this._playerAudio.getVolume();

    }

    public setLoopQueue(loppQueue: boolean): void {

        this._options.loopQueue = loppQueue;

    }

    public getLoopQueue(): boolean {

        return this._options.loopQueue;

    }

    public mute(): void {

        const currentVolume = this.getVolume();

        this._postMuteVolume = currentVolume;

        this._playerAudio.setVolume(0, false);

    }

    public unMute(): void {

        this._playerAudio.setVolume(this._postMuteVolume, false);

        this._postMuteVolume = null;

    }

    public isMuted(): boolean {

        return this._postMuteVolume === null ? true : false;

    }

    public setPosition(soundPositionInPercent: number): void {

        // get the current sound if any
        const currentSound = this._getSoundFromQueue({ whichSound: PlayerCore.CURRENT_SOUND });

        // if there is a sound currently being played
        if (currentSound !== null) {

            // if the duration did not get set manually
            if (currentSound.duration === null || isNaN(currentSound.duration)) {

                // the user can set the sound duration manually but if he didn't the sound has to
                // get loaded as the duration is a property of the audioBuffer
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

        }

    }

    public setPositionInSeconds(soundPositionInSeconds: number): void {

        // get the current sound if any
        const currentSound = this._getSoundFromQueue({ whichSound: PlayerCore.CURRENT_SOUND });

        // if there is a sound currently being played
        if (currentSound !== null) {

            // is the sound is being played
            if (currentSound.state === PlayerSound.SOUND_STATE_PLAYING) {
                // resume the playback at the given position
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

        switch (this._options.loadPlayerMode) {
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

            // if the audio element has already been created
            // we are ready to play
            /*if (sound.audioElement !== null) {
                sound.isReadyToPLay = true;
                resolve(sound);
            }*/

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
                audioElement.id = 'web_audio_api_player_sound_' + sound.id.toString();

                document.body.appendChild(audioElement);

                sound.audioElement = audioElement;
                sound.isReadyToPLay = true;

                this._initializeAudioElementListeners(sound);

                const canplaythroughListener = () => {
                    // we don't need the listener anymore
                    sound.audioElement.removeEventListener('canplaythrough', canplaythroughListener);
                    // duration should now be available as the sound has been fully loaded
                    if (!isNaN(audioElement.duration)) {
                        sound.duration = audioElement.duration;
                    }
                    resolve(sound);
                };

                sound.audioElement.addEventListener('canplaythrough', canplaythroughListener);

                const errorListener = () => {
                    sound.audioElement.removeEventListener('error', errorListener);
                    const soundLoadingError = new PlayerError('loading sound failed');
                    reject(soundLoadingError);
                };

                sound.audioElement.addEventListener('error', errorListener);

            } else {

                const noUrlError = new PlayerError('sound has no url', 1);

                reject(noUrlError);

            }

        });

    }

    protected _loadSoundUsingRequest(sound: ISound): Promise<ISound | PlayerError> {

        return new Promise((resolve, reject) => {

            // extract the url and codec from sources
            const { url, codec = null } = this._findBestSource(sound.source);

            sound.url = url;
            sound.codec = codec;

            if (sound.url !== null) {

                const request = new PlayerRequest();

                // change buffering state
                sound.isBuffering = true;

                request.getArrayBuffer(sound).then((arrayBuffer) => {

                    sound.arrayBuffer = arrayBuffer;

                    this._decodeSound({ sound }).then((sound: ISound) => {
                        resolve(sound);
                    }).catch(reject)

                }).catch((requestError) => {

                    reject(requestError);

                });

            } else {

                const noUrlError = new PlayerError('sound has no url', 1);

                reject(noUrlError);

            }

        });

    }

    protected _initializeAudioElementListeners(sound: ISound): void {

        sound.audioElement.addEventListener('progress', () => {
            sound.loadingProgress = sound.audioElement.duration;
        });

        sound.audioElement.addEventListener('timeupdate', () => {
            sound.duration = sound.audioElement.duration;
        });

    }

    protected _decodeSound({ sound }: IDecodeSoundOptions): Promise<ISound> {

        return this._playerAudio.decodeAudio(sound.arrayBuffer).then((audioBuffer) => {

            sound.audioBuffer = audioBuffer;
            sound.isBuffering = false;
            sound.isBuffered = true;
            sound.audioBufferDate = new Date();
            sound.duration = audioBuffer.duration;
            sound.isReadyToPLay = true;

            return sound;

        }).catch((decodeAudioError: IPlayerError) => {

            throw decodeAudioError;

        });

    }

    // source: https://stackoverflow.com/questions/43655953/web-audio-api-cloning-an-audiobuffer
    protected _cloneAudioBuffer(fromAudioBuffer: AudioBuffer) {
        const audioBuffer = new AudioBuffer({
            length: fromAudioBuffer.length,
            numberOfChannels: fromAudioBuffer.numberOfChannels,
            sampleRate: fromAudioBuffer.sampleRate
        });
        for (let channelI = 0; channelI < audioBuffer.numberOfChannels; ++channelI) {
            const samples = fromAudioBuffer.getChannelData(channelI);
            audioBuffer.copyToChannel(samples, channelI);
        }
        return audioBuffer;
    }

    public play({ whichSound, playTimeOffset }: IPlayOptions = {}): Promise<void> {

        return new Promise((resolve, reject) => {

            // get the current sound if any
            const currentSound = this._getSoundFromQueue({ whichSound: PlayerCore.CURRENT_SOUND });

            // whichSound is optional, if set it can be the sound id or if it's a string it can be next / previous / first / last
            const sound = this._getSoundFromQueue({ whichSound, updateIndex: true });

            // if there is no sound we could play, do nothing
            if (sound === null) {
                throw new Error('no more sounds in array');
            }

            // if there is a sound currently being played OR paused
            // AND the current sound is NOT the same sound as the one that will now be played
            // STOP the current sound
            if (
                currentSound !== null
                && (currentSound.state === PlayerSound.SOUND_STATE_PLAYING || currentSound.state === PlayerSound.SOUND_STATE_PAUSED)
                && (currentSound.id !== sound.id)
            ) {
                this._stop(currentSound, PlayerSound.SOUND_STATE_STOPPED);
            }

            // if there is a sound currently being played
            // AND the current sound is the same sound as the one that will now be played
            // PAUSE the current sound
            if (
                currentSound !== null
                && (currentSound.state === PlayerSound.SOUND_STATE_PLAYING)
                && (currentSound.id === sound.id)
            ) {
                this._stop(currentSound, PlayerSound.SOUND_STATE_PAUSED);
            }

            // if the current sound and the next one are not the same sound
            // we set the firstTimePlayed to true to indicate it is a fresh start and not a resume after a pause
            if (currentSound === null || (currentSound !== null && (currentSound.id !== sound.id))) {
                sound.firstTimePlayed = true;
            } else {
                sound.firstTimePlayed = false;
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

                // avoid refetching the sound (getting the array buffer)
                // by using a clone we avoid having to do the decoding again
                if (sound.audioBuffer !== null) {
                    sound.audioBuffer = this._cloneAudioBuffer(sound.audioBuffer)
                }

                this._play(sound).then(resolve).catch(reject);

            }

        });

    }

    protected async _play(sound: ISound): Promise<void> {

        // start playing
        if (sound.audioBuffer !== null) {
            await this._playAudioBuffer(sound);
        } else {
            await this._playMediaElementAudio(sound);
        }

        // state is now playing
        sound.state = PlayerSound.SOUND_STATE_PLAYING;

        // the audio context time right now (since the audiocontext got created)
        sound.startTime = sound.getCurrentTime();

        sound = this._triggerSoundCallbacks(sound);

    }

    protected async _playAudioBuffer(sound: ISound): Promise<void> {

        if (sound.sourceNode === null) {

            // source node options
            const sourceOptions: IAudioBufferSourceOptions = {
                loop: sound.loop,
                onSourceNodeEnded: (/*event: Event*/) => {
                    this._onEnded()
                }
            };

            try {
                await this._playerAudio.createAudioBufferSourceNode(sourceOptions, sound);
            } catch (error) {
                throw new PlayerError(error);
            }

        }

        // AudioBufferSourceNode type guard
        if (sound.sourceNode instanceof AudioBufferSourceNode) {

            // add the buffer to the source node
            sound.sourceNode.buffer = sound.audioBuffer;

            // connect the source to the graph node(s)
            await this._playerAudio.connectSound(sound);

            // start playback
            // start(when, offset, duration)
            try {
                if (sound.playTimeOffset !== undefined) {
                    sound.sourceNode.start(0, sound.playTimeOffset);
                } else {
                    sound.sourceNode.start();
                }
            } catch (error) {
                throw new PlayerError(error);
            }
        }

    }

    protected async _playMediaElementAudio(sound: ISound): Promise<void> {

        if (sound.sourceNode === null) {

            // source node options
            const sourceOptions: IMediaElementAudioSourceOptions = {
                loop: sound.loop,
                onSourceNodeEnded: (/**event: Event*/) => {
                    this._onEnded()
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

        // MediaElementAudioSourceNode type guard
        if (sound.sourceNode instanceof MediaElementAudioSourceNode) {

            // connect the source to the graph node(s)
            await this._playerAudio.connectSound(sound);

            // if an offset is defined use to play from a defined position
            if (sound.playTimeOffset !== undefined && !isNaN(sound.playTimeOffset)) {

                // TODO: problem if sound has not loaded until for example 90% but position gets set to 90%
                // the position will jump back
                // need to wait for sound to have loaded that part, use events???

                sound.audioElement.currentTime = sound.playTimeOffset;
            }

            try {
                sound.sourceNode.mediaElement.play();
            } catch (error) {
                throw new PlayerError(error);
            }

        }

    }

    protected _triggerSoundCallbacks(sound: ISound): ISound {

        // if there is an onResumed callback for the sound, trigger it
        if (sound.onResumed !== null && !sound.firstTimePlayed) {
            sound.onResumed(sound.playTimeOffset);
        }

        // if there is an onStarted callback for the sound, trigger it
        if (sound.onStarted !== null && sound.firstTimePlayed) {
            sound.onStarted(sound.playTimeOffset);
        }

        // if there is an onPlaying callback for the sound, trigger it
        if (sound.onPlaying !== null) {
            // on request animation frame callback set playing progress
            // request animation frame callback has a argument, which
            // is the timestamp when the callback gets called
            this._playingProgressRequestId = window.requestAnimationFrame((timestamp) => {
                this._progressTrigger(sound, timestamp)
            });
        } else {
            this._playingProgressRequestId = null;
        }

        return sound;

    }

    protected _progressTrigger = (sound: ISound, timestamp: DOMHighResTimeStamp) => {
        // throttle requests to not more than once every 200ms 
        if ((timestamp - this._playingProgressPreviousTimestamp) >= this._options.playingProgressIntervalTime) {
            // execute playing progress callback
            this._playingProgress(sound);
            this._playingProgressPreviousTimestamp = timestamp;
        }
        // request animation frame loop
        this._playingProgressRequestId = window.requestAnimationFrame((timestamp) => {
            this._progressTrigger(sound, timestamp);
        });
    };

    protected _onEnded(): void {

        // get the current sound if any
        const currentSound = this._getSoundFromQueue({ whichSound: PlayerCore.CURRENT_SOUND });

        // if there is a sound currently being played
        if (currentSound !== null && currentSound.state === PlayerSound.SOUND_STATE_PLAYING) {

            const nextSound = this._getSoundFromQueue({ whichSound: PlayerCore.PLAY_SOUND_NEXT, updateIndex: false });

            if (currentSound.onEnded !== null) {

                let willPlayNext = false;

                // check if there is another sound in the queue and if playing
                // the next one on ended is activated
                if (nextSound !== null && this._options.playNextOnEnded) {
                    willPlayNext = true;
                }

                // if loopQueue is enabled then willPlayNext is always true
                if (this._options.loopQueue) {
                    willPlayNext = true;
                }

                if (!willPlayNext) {
                    this._playerAudio.freezeAudioContext();
                }

                currentSound.onEnded(willPlayNext);

            }

            // reset "first time played"
            currentSound.firstTimePlayed = true;

            // reset the "play time offset"
            currentSound.playTimeOffset = 0;

            this._stop(currentSound, PlayerSound.SOUND_STATE_STOPPED);

            if (nextSound !== null) {

                if (this._options.playNextOnEnded) {
                    this.play({ whichSound: PlayerCore.PLAY_SOUND_NEXT });
                }

            } else {

                // we reached the end of the queue set the currentIndex back to zero
                this._currentIndex = 0;

                // if queue loop is active then play
                if (this._options.loopQueue) {
                    this.play();
                }

            }

        }

    }

    /**
     * whichSound is optional, if set it can be the sound id or if it's
     * a string it can be next / previous / first / last
     */
    protected _getSoundFromQueue({ whichSound, updateIndex = false }: IGetSoundFromQueue = {}): ISound {

        let sound = null;
        let soundIndex: number = null;

        // check if the queue is empty
        if (this._queue.length === 0) {
            return sound;
        }

        // if which sound to play did not get specified
        if (whichSound === undefined) {
            // if whichSound is not defined
            // AND the currentIndex is null
            // we set it to first sound in queue
            soundIndex = 0

            // else we use currentIndex (so the current sound)
            if (this._currentIndex !== null) {
                soundIndex = this._currentIndex
            }
            sound = this._queue[soundIndex];
        } else {
            // if which sound to play is a constant
            switch (whichSound) {
                case PlayerCore.CURRENT_SOUND:
                    if (this._currentIndex !== null) {
                        sound = this._queue[this._currentIndex];
                    }
                    break;
                case PlayerCore.PLAY_SOUND_NEXT:
                    if (this._queue[this._currentIndex + 1] !== undefined) {
                        soundIndex = this._currentIndex + 1;
                        sound = this._queue[soundIndex];
                    } else if (this._options.loopQueue) {
                        // if last sound is playing and loop is enabled
                        // on next we jump to first sound
                        soundIndex = 0;
                        sound = this._queue[soundIndex];
                    }
                    break;
                case PlayerCore.PLAY_SOUND_PREVIOUS:
                    if (this._queue[this._currentIndex - 1] !== undefined) {
                        soundIndex = this._currentIndex - 1;
                        sound = this._queue[soundIndex];
                    } else if (this._options.loopQueue) {
                        // if first sound is playing and loop is enabled
                        // on previous we jump to last sound
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
                    // if "which sound to play" (soundId) is a string or number
                    [sound, soundIndex] = this._findSoundById({ soundId: whichSound });
            }
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

            // if the player had as option a baseUrl for sounds add it now
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

            // only if the codec of the source is supported
            if (isCodecSupported) {

                if (source.isPreferred) {
                    // if multiple sources but this one if preferred and if previous
                    // sources also had a supported codec we still overwrite the
                    // previous match
                    bestSource.url = soundUrl;
                    bestSource.codec = source.codec;
                    // so the source is preferred and supported so we can exit early
                    break;
                } else {
                    // if no best source has been found so far, we don't
                    // care if it's preferred it's automatically chosen
                    // as best
                    bestSource.url = soundUrl;
                    bestSource.codec = source.codec;
                    // source is supported, but maybe there is preferred & supported
                    // so we don't exit the loop just yet
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
        const currentSound = this._getSoundFromQueue({ whichSound: PlayerCore.CURRENT_SOUND });

        if (currentSound === null) {
            return;
        }

        if (currentSound.state === PlayerSound.SOUND_STATE_PAUSED) {
            // TODO: just return or throw an error
            return;
        }

        const timeAtPause = currentSound.getCurrentTime();

        currentSound.playTimeOffset += timeAtPause - currentSound.startTime;

        // trigger paused event
        if (currentSound.onPaused !== null) {
            currentSound.onPaused(currentSound.playTimeOffset);
        }

        this._stop(currentSound, PlayerSound.SOUND_STATE_PAUSED);

    }

    public stop(): void {

        // get the current sound
        const currentSound = this._getSoundFromQueue({ whichSound: PlayerCore.CURRENT_SOUND });

        if (currentSound === null) {
            return;
        }

        // check if sound is already stopped
        if (currentSound.state === PlayerSound.SOUND_STATE_STOPPED) {
            // TODO: just return or throw an error
            return;
        }

        // freeze the audio context
        this._playerAudio.freezeAudioContext();

        const timeAtStop = currentSound.getCurrentTime();

        currentSound.playTimeOffset += timeAtStop - currentSound.startTime;

        // trigger stopped event
        if (currentSound.onStopped !== null) {
            currentSound.onStopped(currentSound.playTimeOffset);
        }

        this._stop(currentSound, PlayerSound.SOUND_STATE_STOPPED);

    }

    protected _stop(sound: ISound, soundState: typeSoundStates): void {

        // if it is fully stopped, not just paused
        if (soundState === PlayerSound.SOUND_STATE_STOPPED) {
            // reset the playTimeOffset
            sound.playTimeOffset = 0;
            // reset the "is ready to pLay"
            //sound.isReadyToPLay = false;
            // reset "first time played"
            sound.firstTimePlayed = true;
        }

        if (sound.sourceNode !== null) {

            if (sound.sourceNode instanceof AudioBufferSourceNode) {
                // to stop playing if using the AudioBufferSourceNode use the stop method
                sound.sourceNode.stop(0);
            } else if (sound.sourceNode instanceof MediaElementAudioSourceNode) {
                // to stop playing if using the MediaElementAudioSourceNode use the pause method
                sound.sourceNode.mediaElement.pause();
            }

            this._playerAudio.cleanUpAudiBufferSourceNode(sound);

            // state is now stopped
            sound.state = soundState;

            if (this._playingProgressRequestId !== null) {
                cancelAnimationFrame(this._playingProgressRequestId);
                this._playingProgressPreviousTimestamp = 0;
            }

        }

    }

    public next(): void {

        // alias for play next
        this.play({ whichSound: PlayerCore.PLAY_SOUND_NEXT });

    }

    public previous(): void {

        // alias for play previous
        this.play({ whichSound: PlayerCore.PLAY_SOUND_PREVIOUS });

    }

    public first(): void {

        // alias for play first
        this.play({ whichSound: PlayerCore.PLAY_SOUND_FIRST });

    }

    public last(): void {

        // alias for play last
        this.play({ whichSound: PlayerCore.PLAY_SOUND_LAST });

    }

    protected _playingProgress(sound: ISound): void {

        const timeNow = sound.getCurrentTime();

        sound.playTime = (timeNow - sound.startTime) + sound.playTimeOffset;

        const duration = sound.getDuration();
        const playingPercentage = (sound.playTime / duration) * 100;

        sound.playedTimePercentage = playingPercentage;

        sound.onPlaying(playingPercentage, duration, sound.playTime);

    }

    public setVisibilityAutoMute(visibilityAutoMute: boolean): void {

        this._options.visibilityAutoMute = visibilityAutoMute;

        if (visibilityAutoMute) {
            document.addEventListener('visibilitychange', this._handleVisibilityChange.bind(this), false);
        } else {
            document.removeEventListener('visibilitychange', this._handleVisibilityChange.bind(this), false);
        }

    }

    public getVisibilityAutoMute(): boolean {
        return this._options.visibilityAutoMute;
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

    public async disconnect(): Promise<void> {

        // adding another check here to cancel animation frame because:
        // a player can be disconnect while song is paused or playing
        // which means the cancelAnimationFrame in _stop would never get triggered
        if (this._playingProgressRequestId !== null) {
            cancelAnimationFrame(this._playingProgressRequestId);
        }

        await this._playerAudio.shutDown(this._queue);

    }

    public async getAudioContext(): Promise<AudioContext> {

        const audioContext = await this._playerAudio.getAudioContext();

        return audioContext;

    }

}

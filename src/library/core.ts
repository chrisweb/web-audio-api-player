import { PlayerSound, ISound, ISoundAttributes, ISoundSource } from './sound';
import { PlayerAudio, IAudioGraph, IAudioOptions } from './audio';
import { PlayerRequest } from './request';
import { PlayerError, IPlayerError } from './error';

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

export class PlayerCore {

    // is the web audio API supported
    protected _isWebAudioApiSupported: boolean;
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
    // do we start over gain at the end of the queue
    protected _loopQueue: boolean;
    // a custon audioGraph created by the user
    protected _customAudioGraph: IAudioGraph | null = null;
    // a custom audio context created by the user
    protected _customAudioContext: AudioContext | null = null;
    // stop the song currently being played on (queue) reset
    protected _stopOnReset: boolean;
    // the volume level before we muted
    protected _postMuteVolume: number = null;
    // is muted?
    protected _isMuted: boolean = false;

    // constants
    readonly WHERE_IN_QUEUE_AT_END: string = 'append';
    readonly WHERE_IN_QUEUE_AT_START: string = 'prepend';
    readonly WHERE_IN_QUEUE_AFTER_CURRENT: string = 'afterCurrent';

    readonly PLAY_SOUND_NEXT = 'next';
    readonly PLAY_SOUND_PREVIOUS = 'previous';
    readonly PLAY_SOUND_FIRST = 'first';
    readonly PLAY_SOUND_LAST = 'last';

    constructor(playerOptions: ICoreOptions = {}) {

        let defaultOptions = {
            volume: 80,
            loopQueue: false,
            soundsBaseUrl: '',
            playingProgressIntervalTime: 1000,
            playNextOnEnded: true,
            stopOnReset: true
        };

        let options = Object.assign({}, defaultOptions, playerOptions);

        this._volume = options.volume;
        this._soundsBaseUrl = options.soundsBaseUrl;
        this._queue = [];
        this._currentIndex = 0;
        this._playingProgressIntervalTime = options.playingProgressIntervalTime;
        this._playNextOnEnded = options.playNextOnEnded;
        this._loopQueue = options.loopQueue;
        this._stopOnReset = options.stopOnReset;

        if (typeof options.audioContext !== 'undefined') {
            this._customAudioContext = options.audioContext;
        }

        if (typeof options.audioGraph !== 'undefined') {
            this._customAudioGraph = options.audioGraph;
        }

        this._initialize();

    }

    protected _initialize() {

        // TODO: check if web audio api is available
        let webAudioApi = true;

        // is the web audio api supported
        // if not we will use the audio element as fallback
        if (webAudioApi) {
            this._isWebAudioApiSupported = true;
        } else {
            // use the html5 audio element
            this._isWebAudioApiSupported = false;
        }

        let audioOptions: IAudioOptions = {
            volume: this._volume,
            customAudioContext: this._customAudioContext,
            customAudioGraph: this._customAudioGraph
        };

        // player audio library instance
        this._playerAudio = new PlayerAudio(audioOptions);

    }

    public addSoundToQueue(soundAttributes: ISoundAttributes, whereInQueue: string = this.WHERE_IN_QUEUE_AT_END): ISound {

        let sound: ISound = new PlayerSound(soundAttributes);

        // TODO: is queue just an array of sounds, or do we need something more complex with a position tracker?

        // TODO: allow array of soundAttributes to be injected, to create several at once, if input is an array output should be too

        switch (whereInQueue) {
            case this.WHERE_IN_QUEUE_AT_END:
                this._appendSoundToQueue(sound);
                break;
            case this.WHERE_IN_QUEUE_AT_START:
                this._prependSoundToQueue(sound);
                break;
            case this.WHERE_IN_QUEUE_AFTER_CURRENT:
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

            let afterCurrentIndex = this._currentIndex + 1;

            this._queue.splice(afterCurrentIndex, 0, sound);

        }

    }

    public resetQueue() {

        // check if a song is getting played and stop it
        if (this._stopOnReset) {

            this.stop();

        }

        // TODO: destroy all the sounds or clear the cached buffers?

        this._queue = [];

    }

    public reset() {

        this.resetQueue();

    }

    public getQueue() {

        // TODO: is the needed?

        return this._queue;

    }

    public setVolume(volume: number): void {

        this._volume = volume;

        this._playerAudio.changeVolume(volume);

        this._isMuted = false;

    }

    public getVolume(): number {

        return this._volume;

    }

    public mute() {

        this._postMuteVolume = this.getVolume();

        this.setVolume(0);

        this._isMuted = true;

    }

    public unMute() {

        this.setVolume(this._postMuteVolume);

    }

    public setPosition(soundPositionInPercent: number): void {

        // get the current sound if any
        let currentSound = this._getSoundFromQueue();

        // if there is a sound currently being played
        if (currentSound !== null) {

            // check if the duration got set manually
            if (currentSound.duration === null) {

                // the user can set the sound duration manually but if he didn't the song has to
                // get preloaded as the duration is a property of the audioBuffer
                this._loadSound(currentSound)
                    .then((sound: ISound) => {

                        // calculate the position in seconds
                        let soundPositionInSeconds = (sound.duration / 100) * soundPositionInPercent;

                        this.setPositionInSeconds(soundPositionInSeconds);

                    }).catch((error: PlayerError) => {

                        // TODO: throw error???

                    });

            } else {

                // calculate the position in seconds
                let soundPositionInSeconds = (currentSound.duration / 100) * soundPositionInPercent;

                this.setPositionInSeconds(soundPositionInSeconds);

            }

        } else {

            // TODO: throw error???

        }

    }

    public setPositionInSeconds(soundPositionInSeconds: number) {

        // get the current sound if any
        let currentSound = this._getSoundFromQueue();

        // if there is a sound currently being played
        if (currentSound !== null) {

            // is the song is being played
            if (currentSound.isPlaying) {

                // stop the track playback
                this.pause();

                // start the playback at the given position
                this.play(currentSound.id, soundPositionInSeconds);

            } else {

                // only set the sound position but don't play
                currentSound.playTimeOffset = soundPositionInSeconds;

            }

        } else {

            // TODO: throw error???

        }

    }

    protected _loadSound(sound: ISound): Promise<ISound | PlayerError> {

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
                return this._decodeSound(sound, resolve, reject);
            }

            // if the sound has no ArrayBuffer and also no AudioBuffer yet
            if (sound.arrayBuffer === null && sound.audioBuffer === null) {

                // extract the url and codec from sources
                let { url, codec = null } = this._sourceToVariables(sound.sources);

                sound.url = url;
                sound.codec = codec;

                if (sound.url !== null) {

                    let request = new PlayerRequest();

                    // change buffering state
                    sound.isBuffering = true;

                    request.getArrayBuffer(sound).then((arrayBuffer: ArrayBuffer) => {

                        sound.arrayBuffer = arrayBuffer;

                        return this._decodeSound(sound, resolve, reject);

                    }).catch((requestError: IPlayerError) => {

                        reject(requestError);

                    });

                } else {

                    let noUrlError = new PlayerError('sound has no url', 1);

                    reject(noUrlError);

                }

            }

        });

    }

    protected _decodeSound(sound: ISound, resolve: Function, reject: Function) {

        let arrayBuffer = sound.arrayBuffer;

        this._playerAudio.decodeAudio(arrayBuffer).then((audioBuffer: AudioBuffer) => {

            sound.audioBuffer = audioBuffer;
            sound.isBuffering = false;
            sound.isBuffered = true;
            sound.audioBufferDate = new Date();
            sound.duration = sound.audioBuffer.duration;

            resolve(sound);

        }).catch((decodeAudioError: IPlayerError) => {

            reject(decodeAudioError);

        });

    }

    public play(whichSound?: number | string | undefined, playTimeOffset?: number): Promise<void> {

        return new Promise((resolve, reject) => {

            // TODO: check the available codecs and defined sources, play the first one that has matches and available codec
            // TODO: let user define order of preferred codecs for playerback

            // get the current sound if any
            let currentSound = this._getSoundFromQueue();

            // if there is a sound currently being played
            if (currentSound !== null && currentSound.isPlaying) {

                // stop the current sound
                this.stop();

            }

            // whichSound is optional, if set it can be the sound id or if it's a string it can be next / previous / first / last
            let sound = this._getSoundFromQueue(whichSound);

            // if there is no sound we could play, do nothing
            if (sound === null) {

                throw new Error('no more sounds in array');

                // TODO: throw an error?

            }

            // if the user wants to play the sound from a certain position
            if (playTimeOffset !== undefined) {

                sound.playTimeOffset = playTimeOffset;

            }

            // has the sound already been loaded?
            if (!sound.isBuffered) {

                this._loadSound(sound).then(() => {

                    return this._play(sound).then(resolve).catch(reject);

                }).catch(reject);

            } else {

                this._play(sound).then(resolve).catch(reject);

            }

        });

    }

    protected _play(sound: ISound): Promise<void> {

        // source node options
        let sourceNodeOptions = {
            loop: sound.loop,
            onEnded: () => {
                this._onEnded();
            }
        };

        // create a new source node
        return this._playerAudio.createSourceNode(sourceNodeOptions).then((sourceNode) => {

            sound.isPlaying = true;
            sound.sourceNode = sourceNode;

            // add the buffer to the source node
            sourceNode.buffer = sound.audioBuffer;

            // the audiocontext time right now (since the audiocontext got created)
            sound.startTime = sourceNode.context.currentTime;

            // connect the source to the graph node(s)
            this._playerAudio.connectSourceNodeToGraphNodes(sourceNode);

            // start playback
            // start(when, offset, duration)
            sourceNode.start(0, sound.playTimeOffset);

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

        }).catch((error) => {

            // TODO: handle error

        });

    }

    protected _onEnded() {

        // get the current sound if any
        let currentSound = this._getSoundFromQueue();

        // if there is a sound currently being played
        if (currentSound !== null && currentSound.isPlaying) {

            let updateIndex = false;

            let nextSound = this._getSoundFromQueue('next', updateIndex);

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

            this._stop(currentSound);

            if (nextSound !== null) {

                if (this._playNextOnEnded) {
                    this.play('next');
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
    protected _getSoundFromQueue(whichSound?: string | number, updateIndex: boolean = true): ISound | null {

        let sound = null;

        // check if the queue is empty
        if (this._queue.length === 0) {

            return sound;

        }

        // if which song to play did not get specified, play one based from the queue based on the queue index position marker
        if (whichSound === undefined && this._queue[this._currentIndex] !== undefined) {

            sound = this._queue[this._currentIndex];

        } else if (typeof whichSound === 'number') {

            // if which song to play is a numeric ID
            sound = this._findSoundById(whichSound, updateIndex);

        } else {

            let soundIndex: number | null = null;

            // if which song to play is a constant
            switch (whichSound) {
                case this.PLAY_SOUND_NEXT:
                    if (this._queue[this._currentIndex + 1] !== undefined) {
                        soundIndex = this._currentIndex + 1;
                        sound = this._queue[soundIndex];
                    }
                    break;
                case this.PLAY_SOUND_PREVIOUS:
                    if (this._queue[this._currentIndex - 1] !== undefined) {
                        soundIndex = this._currentIndex - 1;
                        sound = this._queue[soundIndex];
                    }
                    break;
                case this.PLAY_SOUND_FIRST:
                    if (this._queue.length > 0) {
                        soundIndex = 0;
                        sound = this._queue[soundIndex];
                    }
                    break;
                case this.PLAY_SOUND_LAST:
                    if (this._queue.length > 0) {
                        soundIndex = this._queue.length - 2;
                        sound = this._queue[soundIndex];
                    }
                    break;
                default:
                    // if which song to play is a string ID
                    sound = this._findSoundById(whichSound, updateIndex);
            }

            if (soundIndex !== null && updateIndex) {
                this._currentIndex = soundIndex;
            }

        }

        return sound;

    }

    protected _findSoundById(soundId: string | number, updateIndex: boolean): ISound | null {

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

    protected _sourceToVariables(sources: (ISoundSource | string)[]): { url: string | null, codec?: string | null } {

        // TODO: source can be on object where the property name is the codec and the value is the sound url
        // if sound isnt an object try to detect sound source extension by file extention or by checking the file mime type

        // TODO: get a list of supported codecs by this device

        let firstMatchingSource: { url: string | null, codec?: string | null } = {
            url: null,
            codec: null
        };

        sources.forEach((source) => {

            // TODO: find out what the source codec is

            // TODO: check if the source codec is among the ones that are supported by this device

            let soundUrl = '';

            // if the player had as option a baseUrl for sounds add it now
            if (this._soundsBaseUrl !== '') {
                soundUrl = this._soundsBaseUrl;
            }

            // two kind of source are possible, a string (the url) or an object (key is the codec and value is the url)
            if (typeof source === 'string') {

                soundUrl += source;

                firstMatchingSource = {
                    url: soundUrl
                };

            } else {

                soundUrl += source.url;

                firstMatchingSource = {
                    url: soundUrl,
                    codec: source.codec
                };

            }

        });

        return firstMatchingSource;

    }

    public pause() {

        // get the current sound
        let sound: ISound | null = this._getSoundFromQueue();

        if (sound === null) {
            return;
        }

        let timeAtPause = sound.sourceNode.context.currentTime;

        sound.playTimeOffset += timeAtPause - sound.startTime;

        // trigger paused event
        if (sound.onPaused !== null) {
            sound.onPaused(sound.playTimeOffset);
        }

        this._stop(sound);

    }

    public stop() {

        // get the current sound
        let sound: ISound | null = this._getSoundFromQueue();

        if (sound === null) {
            return;
        }

        if (!sound.isPlaying) {
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

        this._stop(sound);

    }

    protected _stop(sound: ISound) {

        // tell the sourceNode to stop playing
        sound.sourceNode.stop(0);

        // tell the sound that playing is over
        sound.isPlaying = false;

        // destroy the source node as it can anyway only get used once
        this._playerAudio.destroySourceNode(sound.sourceNode);

        sound.sourceNode = null;

        if (this._playingTimeoutID !== null) {

            // clear the playing progress setInterval
            clearInterval(this._playingTimeoutID);

        }

    }

    public next() {

        // alias for play next
        this.play('next');

    }

    public previous() {

        // alias for play previous
        this.play('previous');

    }

    public first() {

        // alias for play first
        this.play('first');

    }

    public last() {

        // alias for play last
        this.play('last');

    }

    protected _playingProgress(sound: ISound) {

        let timeNow = sound.sourceNode.context.currentTime;

        sound.playTime = (timeNow - sound.startTime) + sound.playTimeOffset;

        let playingPercentage = (sound.playTime / sound.audioBuffer.duration) * 100;

        sound.playedTimePercentage = playingPercentage;

        sound.onPlaying(playingPercentage, sound.audioBuffer.duration, sound.playTime);

    }

    public setAudioGraph(customAudioGraph: IAudioGraph) {

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

    public setAudioContext(customAudioContext: AudioContext) {

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

}

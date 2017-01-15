
'use strict';

import { PlayerSound, ISound, ISoundAttributes, ISoundSource } from './sound';
import { PlayerAudio } from './audio';
import { PlayerRequest } from './request';
import { PlayerError, IPlayerError } from './error';

export interface ICoreOptions {
    volume?: number;
    loopQueue?: boolean;
    soundsBaseUrl?: string;
}

export class PlayerCore {

    // is the web audio API supported
    protected _isWebAudioApiSupported: boolean;
    // the sounds queue
    protected _queue: ISound[];
    // the volume (0 to 100)
    protected _volume: number;
    // the progress (song play time)
    protected _progress: number;
    // the base url that all sounds will have in common
    protected _soundsBaseUrl: string;
    // the current sound in queue index
    protected _currentIndex: number;
    // instance of the audio library class
    protected _playerAudio: PlayerAudio;

    // callback hooks
    public onPlayStart: () => void;
    public onPlaying: () => void;
    public onBuffering: () => void;

    // constants
    readonly WHERE_IN_QUEUE_AT_END: string = 'append';
    readonly WHERE_IN_QUEUE_AT_START: string = 'prepend';
    readonly WHERE_IN_QUEUE_AFTER_CURRENT: string = 'afterCurrent';

    readonly PLAY_SOUND_NEXT = 'next';
    readonly PLAY_SOUND_PREVIOUS = 'previous';
    readonly PLAY_SOUND_FIRST = 'first';
    readonly PLAY_SOUND_LAST = 'last';

    constructor(playerOptions: ICoreOptions) {

        let defaultOptions = {
            volume: 80,
            loopQueue: false,
            soundsBaseUrl: ''
        };

        let options = Object.assign({}, defaultOptions, playerOptions);

        this._volume = options.volume;
        this._soundsBaseUrl = options.soundsBaseUrl;
        this._queue = [];
        this._currentIndex = 0;

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

        // player audio library instance
        this._playerAudio = new PlayerAudio();

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

        this._queue = [];

        // TODO: check if a song is getting played and stop it?

    }

    public getQueue() {

        // TODO: is the needed?

        return this._queue;

    }

    public setVolume(volume: number): void {

        this._volume = volume;

        this._playerAudio.changeGainValue(volume);

    }

    public getVolume(): number {

        return this._volume;

    }

    public mute() {

        this.setVolume(0);

    }

    public setProgress(progress: number): void {

        this._progress = progress;

    }

    public getProgress(): number {

        return this._progress;

    }

    protected _loadSound(sound: ISound): Promise<ISound | PlayerError> {

        // TODO: would be good to cache buffers, so need to check if is in cache
        // let the user choose (by setting an option) what amount of sounds will be cached
        // add a cached date / timestamp to be able to clear cache by oldest first
        // or even better add a played counter to cache by least played and date

        return new Promise((resolve, reject) => {

            if (sound.url !== null) {

                let request = new PlayerRequest();

                // change buffering state
                sound.isBuffering = true;

                request.getArrayBuffer(sound).then((arrayBuffer: ArrayBuffer) => {

                    this._playerAudio.decodeAudio(arrayBuffer).then((audioBuffer: AudioBuffer) => {

                        sound.audioBuffer = audioBuffer;
                        sound.isBuffering = false;
                        sound.isBuffered = true;
                        sound.audioBufferDate = new Date();

                        resolve(sound);

                    }).catch((decodeAudioError: IPlayerError) => {

                        reject(decodeAudioError);

                    });

                }).catch((requestError: IPlayerError) => {

                    reject(requestError);

                });

            } else {

                let noUrlError = new PlayerError('sound has no url', 1);

                reject(noUrlError);

            }

        });

    }

    public play(whichSound?: number | string | undefined, playTimeOffset?: number): void {

        // TODO: check the available codecs and defined sources, play the first one that has matches and available codec
        // TODO: let user define order of preferred codecs for playerback

        // get the current song if any
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

            return;

            // TODO: throw an error?

        }

        // if the user wants to play the sound from a certain position
        if (playTimeOffset !== undefined) {

            sound.playTimeOffset = playTimeOffset;

        }

        // has the sound already been loaded?
        if (!sound.isBuffered) {

            // extract the url and codec from sources
            let { url, codec = null } = this._sourceToVariables(sound.sources);

            sound.url = url;
            sound.codec = codec;

            this._loadSound(sound).then(() => {

                this._play(sound);

            }).catch((error) => {

                // TODO: handle error

            });

        } else {

            this._play(sound);

        }

    }

    protected _play(sound: ISound) {

        // source node options
        let sourceNodeOptions = {
            loop: sound.loop
        };

        // create a new source node
        this._playerAudio.createSourceNode(sourceNodeOptions).then((sourceNode) => {

            // add the buffer to the source node
            sourceNode.buffer = sound.audioBuffer;

            // the audiocontext time right now (since the audiocontext got created)
            sound.startTime = sourceNode.context.currentTime;

            // connect the source to the graph (destination)
            this._playerAudio.connectSourceNodeToGraph(sourceNode);

            // start playback
            // start(when, offset, duration)
            sourceNode.start(0, sound.playTimeOffset);

            sound.isPlaying = true;
            sound.sourceNode = sourceNode;

        }).catch((error) => {

            // TODO: handle error

        });

    }

    /**
     * whichSound is optional, if set it can be the sound id or if it's a string it can be next / previous / first / last
     * @param whichSound
     */
    protected _getSoundFromQueue(whichSound?: string | number): ISound | null {

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
            sound = this._findSoundById(whichSound);

        } else {

            // if which song to play is a constant
            switch (whichSound) {
                case this.PLAY_SOUND_NEXT:
                    if (this._queue[this._currentIndex + 1] !== undefined) {
                        this._currentIndex = this._currentIndex + 1;
                        sound = this._queue[this._currentIndex];
                    }
                    break;
                case this.PLAY_SOUND_PREVIOUS:
                    if (this._queue[this._currentIndex - 1] !== undefined) {
                        this._currentIndex = this._currentIndex - 1;
                        sound = this._queue[this._currentIndex];
                    }
                    break;
                case this.PLAY_SOUND_FIRST:
                    if (this._queue.length > 0) {
                        this._currentIndex = 0;
                        sound = this._queue[this._currentIndex];
                    }
                    break;
                case this.PLAY_SOUND_LAST:
                    if (this._queue.length > 0) {
                        this._currentIndex = this._queue.length - 1;
                        sound = this._queue[this._currentIndex];
                    }
                    break;
                default:
                    // if which song to play is a string ID
                    sound = this._findSoundById(whichSound);
            }

        }

        return sound;

    }

    protected _findSoundById(soundId: string | number): ISound | null {

        let sound = null;

        this._queue.some((soundFromQueue: ISound, queueIndex: number) => {

            if (soundFromQueue.id === soundId) {

                sound = soundFromQueue;
                this._currentIndex = queueIndex;

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
            //if () {

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

        this._stop(sound);

    }

    public stop() {

        // get the current sound
        let sound: ISound | null = this._getSoundFromQueue();

        if (sound === null) {
            return;
        }

        sound.playTimeOffset = 0;

        this._stop(sound);

    }

    protected _stop(sound: ISound) {

        sound.sourceNode.stop(0);

        sound.isPlaying = false;

        this._playerAudio.destroySourceNode(sound.sourceNode);

        sound.sourceNode = null;

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

/*

    player.prototype.stop = function stopFunction() {

        if (this.track === undefined) {

            return false;

        }

        if (!this.track.isPlaying) {

            return null;

        }

        // stop the track playback
        this.audioGraph.sourceNode.stop(0);

        // change the track attributes
        this.track.isPlaying = false;

        this.track.playTime = 0;

        // after a stop you cant call a start again, you need to create a new
        // source node, this means that we unset the audiograph after a stop
        // so that it gets recreated on the next play
        this.audioGraph = undefined;
        
        // stop the progress timer
        stopTimer.call(this);

        return true;

    };

    player.prototype.positionChange = function positionChangeFunction(trackPositionInPercent) {
        
        // stop the track playback
        this.stop();

        let trackPositionInSeconds = (this.track.buffer.duration / 100) * trackPositionInPercent;

        this.track.playTimeOffset = trackPositionInSeconds;

        // start the playback at the given position
        this.play();

    };

    let triggerProgressEvent = function triggerProgressEventFunction() {

        let timeNow = this.audioGraph.sourceNode.context.currentTime;

        this.track.playTime = (timeNow - this.track.startTime) + this.track.playTimeOffset;

        // if the player is at the end of the track
        if (this.track.playTime >= this.track.buffer.duration) {

            this.stop();

            if (this.loopTrack) {

                this.play();

            } else {

                if (this.track.playlistId !== null) {

                    this.events.trigger(
                        this.events.constants.PLAYLIST_NEXT,
                        {
                            track: this.track
                        }
                    );

                }

            }

        }

        this.track.playedTimePercentage = (this.track.playTime / this.track.buffer.duration) * 100;

        this.events.trigger(
            this.events.constants.PLAYER_PLAYING_PROGRESS,
            {
                percentage: this.track.playedTimePercentage,
                track: this.track
            }
        );

    };*/

}

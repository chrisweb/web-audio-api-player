
'use strict';

import { PlayerSound, ISound, ISoundAttributes, ISoundSource } from './sound';
import { PlayerAudio, IAudioGraph } from './audio';
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
    // the queue index of the song to play if none got defined 
    protected _queueIndex: number;
    // the volume (0 to 100)
    protected _volume: number;
    // the base url that all sounds will have in common
    protected _soundsBaseUrl: string;
    // the current sound in queue index
    protected _currentIndex: number;
    // instance of the audio library class
    protected _playerAudio: PlayerAudio;
    // custom audio graph
    protected _audioGraph: IAudioGraph;

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

    constructor(options: ICoreOptions = {
        volume: 80,
        loopQueue: false,
        soundsBaseUrl: ''
    }) {

        this._volume = options.volume;
        this._soundsBaseUrl = options.soundsBaseUrl;
        this._queue = [];
        this._currentIndex = 0;

        this._initialize();

    }

    protected _initialize() {

        // TODO: check if web audio api is available
        let webAudioApi = true;

        if (webAudioApi) {

            this._isWebAudioApiSupported = true;

        } else {

            // use the html5 audio element
            this._isWebAudioApiSupported = false;

        }

        // TODO: initialize the audio graph when initializing the player
        // suspend the audio context while not playing any sound?

        this._playerAudio = new PlayerAudio();

        this._audioGraph = this._playerAudio.createAudioGraph();

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

        let afterCurrentIndex = this._currentIndex + 1;

        this._queue.splice(afterCurrentIndex, 0, sound);

    }

    public resetQueue() {

        this._queue = [];
        this._queueIndex = 0;

        // TODO: check if a song is getting played and stop it

    }

    /*public getQueue() {

        // TODO: is the needed?

        return this._queue;

    }*/

    public setVolume(volume: number): void {

        this._volume = volume;

        // https://developer.mozilla.org/en-US/docs/Web/API/GainNode

        //this._audioGraph.gainNode.value = this._volume / 100;

    }

    public getVolume(): number {

        return this._volume;

    }


    public setPlaybackRate(playbackRate: number): void {

        // < 1 slower, > 1 faster playback
        //this._audioGraph.sourceNode.setPlaybackRate(playbackRate);

    };

    public getPlaybackRate(): number {

        //return this._audioGraph.sourceNode.playbackRate;

        return 0;

    };

    public resetPlaybackRate(): void {



    }

    public setPanner(left: number, right: number): void {

        // https://developer.mozilla.org/en-US/docs/Web/API/PannerNode

        //this.audioGraph.pannerNode.setPosition(0, 0, 0);

    };

    public getPanner(): { left: number, right: number } {

        //return this.audioGraph.pannerNode.getPosition();

        return { left: 0, right: 0 };

    };

    public resetPanner(): void {



    }

    public play(whichSound?: number | string | undefined): void {

        // TODO: check the available codecs and defined sources, play the first one that has matches and available codec
        // TODO: let user define order of preferred codecs for playerback

        // check if the queue is empty
        if (this._queue.length === 0) {

            // TODO: should we do something if the queue is empty? throw an error or do nothing?

        }

        // whichSound is optional, if set it can be the id of the sound or next / previous / first / last
        let sound: ISound | null = this._getSoundFromQueue(whichSound);

        // extract the url and codec from sources
        let { url, codec = null } = this._sourceToVariables(sound.sources);

        sound.url = url;
        sound.codec = codec;

        // TODO: would be good to cache buffers, so need to check if is in cache
        // let the user choose (by setting an option) what amount of sounds will be cached
        // add a cached date / timestamp to be able to clear cache by oldest first
        // or even better add a played counter to cache by least played and date

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

                    this._startPlaying(sound);

                }).catch((decodeAudioError: IPlayerError) => {

                    // TODO: handle error decodeAudioError

                });

            }).catch((requestError: IPlayerError) => {

                // TODO: handle error requestError

            });

        } else {

            // TODO: handle error no sound url

        }

    }

    protected _startPlaying(sound: ISound): void {

        this._audioGraph.sourceNode.buffer = sound.audioBuffer;

        // the audiocontext time right now (since the audiocontext got created)
        sound.startTime = this._audioGraph.sourceNode.context.currentTime;

        this._audioGraph.sourceNode.start(0, sound.playTimeOffset);

        sound.isPlaying = true;

    }

    protected _getSoundFromQueue(whichSound?: string | number): ISound | null {

        let sound: ISound | null = null;

        // if which song to play did not get specified, play one based from the queue based on the queue index position marker
        if (whichSound === undefined && this._queue[this._currentIndex] !== undefined) {

            sound = this._queue[this._currentIndex];

        } else if (typeof whichSound === 'number') {

            // if which song to play is a song ID
            let foundInArray = this._queue.some((soundFromQueue: ISound, queueIndex: number) => {

                if (soundFromQueue.id === whichSound) {

                    sound = soundFromQueue;
                    this._currentIndex = queueIndex;

                    return true;

                }

            });

        } else {

            // if which song to play is a constant
            switch (whichSound) {
                case this.PLAY_SOUND_NEXT:
                    if (this._queue[this._currentIndex + 1] !== undefined) {
                        this._currentIndex = this._currentIndex + 1;
                    }
                    break;
                case this.PLAY_SOUND_PREVIOUS:
                    if (this._queue[this._currentIndex - 1] !== undefined) {
                        this._currentIndex = this._currentIndex + 1;
                    }
                    break;
                case this.PLAY_SOUND_FIRST:
                    if (this._queue.length > 0) {
                        this._currentIndex = 0;
                    }
                    break;
                case this.PLAY_SOUND_LAST:
                    if (this._queue.length > 0) {
                        this._currentIndex = this._queue.length - 1;
                    }
                    break;

            }

            sound = this._queue[this._currentIndex];

        }

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

        // TODO: do we ctx.suspend() and resume the context on pause to free device resources?

        let sound: ISound | null = this._getSoundFromQueue();

        let timeAtPause = this._audioGraph.sourceNode.context.currentTime;

        sound.playTimeOffset += timeAtPause - sound.startTime;

        this._stopPlaying();

    }

    public stop() {

        // stop placeholder
        // TODO: do we need a stop method (or is pause enough)

    }

    protected _stopPlaying() {

        this._audioGraph.sourceNode.stop(0);

    }

    public next() {

        // TODO: add aliases for play('next') / previous / first / last?

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

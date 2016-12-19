
'use strict';

import { Sound, ISound, ISoundAttributes, ISoundSource } from './sound';
import { Audio } from './audio';
import { Request } from './request';
import { PlayerError, IPlayerError } from './error';

export interface ICoreOptions {
    volume?: number;
    loopQueue?: boolean;
    soundsBaseUrl?: string;
}

export class Core {

    // private bufferingTimeoutHandler;

    protected isWebAudioApiSupported: boolean;
    protected queue: ISound[] | null;
    protected volume: number;
    protected loopQueue: boolean;
    protected soundsBaseUrl: string;
    // make public to allow injection of external audioContext?
    protected audioContext: AudioContext;

    // callback hooks
    public onPlayStart: () => void;
    public onPlaying: () => void;
    public onBuffering: () => void;

    constructor(options: ICoreOptions = {
        volume: 80,
        loopQueue: false,
        soundsBaseUrl: '.'
    }) {

        this.volume = options.volume;
        this.loopQueue = options.loopQueue;
        this.soundsBaseUrl = options.soundsBaseUrl;

        this._initialize();

    }

    protected _initialize() {

        // TODO: check if web audio api is available
        let webAudioApi = true;

        if (webAudioApi) {

            this.isWebAudioApiSupported = true;

        } else {

            // use the html5 audio element
            this.isWebAudioApiSupported = false;

        }

    }

    public addSoundToQueue(soundAttributes: ISoundAttributes): ISound {

        let sound: ISound = new Sound(soundAttributes);

        this.queue.push(sound);

        //this.queue.push(sound.create(soundAttributes));

        // TODO: is queue just an array of sounds, or do we need something more complex with a position tracker?

        return sound;

    }

    public resetQueue() {

        this.queue = null;

        // TODO: check if a song is getting played and stop it

    }

    public setVolume(volume: number): void {

        this.volume = volume;

    }

    public getVolume(): number {

        return this.volume;

    }

    public play(whichSound?: number | string): void {

        // TODO: whichSound is optional, if set it can be the id of the sound or next / previous / first / last

        // TODO: check the available codecs and defined sources, play the first one that has matches and available codec
        // TODO: let user define order of preferred codecs for playerback

        // if whichSound is undefined we take the first song in the queue
        if (whichSound === undefined && this.queue.length > 0) {

            // TODO: should I do something if the queue is empty? throw an error or do nothing?

            let sound: ISound = this.queue[0];
            
            let { url, codec = null } = this._sourceToVariables(sound.sources);

            sound.url = url;
            sound.codec = codec;

            // TODO: would be good to cache buffers, so need to check if is in cache, let user choose through options the amount of cached sounds

            if (sound.url !== null) {

                let request = new Request();

                request.getArrayBuffer(sound).then((arrayBuffer: ArrayBuffer) => {

                    let audio = new Audio();

                    audio.decodeAudio(arrayBuffer).then((audioBuffer: AudioBuffer) => {

                        sound.audioBuffer = audioBuffer;

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

            // two kind of source are possible, a string (the url) or an object (key is the codec and value is the url)
            if (typeof source === 'string') {

                firstMatchingSource = {
                    url: source
                };

            } else {

                firstMatchingSource = {
                    url: source.url,
                    codec: source.codec
                };

            }

        });

        return firstMatchingSource;

    }

    public pause() {

        // TODO: do we ctx.suspend() and resume the context on pause to free device resources?

    }

    public stop() {

        // stop placeholder
        // TODO: do we need a stop method (or is pause enough)

    }

    public next() {

        // TODO: add aliases for play('next') / previous / first / last?

    }

/*

    player.prototype.play = function playFunction(attributes) {



        if (attributes !== undefined) {

            this.setupTrack(attributes);

        }

        // clear the previous timeout handler if one exists
        if (bufferingTimeoutHandler !== undefined) {

            clearTimeout(bufferingTimeoutHandler);

        }

        if (this.track.isBuffering) {

            var that = this;

            bufferingTimeoutHandler = setTimeout(function () {

                that.play();

            }, 500);

            return;

        }

        if (this.track.buffer === null) {

            var playOnceBuffered = true;
            var silenceEvents = false;

            var that = this;

            this.loadTrack(playOnceBuffered, silenceEvents);

            return;

        }

        if (this.audioGraph === undefined) {

            this.createAudioGraph();

        }

        if (this.audioGraph.sourceNode.buffer === null) {

            // add a buffered song to the source node
            this.audioGraph.sourceNode.buffer = this.track.buffer;

        }

        // the time right now (since the this.audiocontext got created)
        this.track.startTime = this.audioGraph.sourceNode.context.currentTime;

        this.audioGraph.sourceNode.start(0, this.track.playTimeOffset);

        startTimer.call(this);

        this.track.isPlaying = true;

        return true;

    };



    player.prototype.pause = function pauseFunction() {

        if (this.track === undefined) {

            return false;

        }

        if (!this.track.isPlaying) {

            return null;

        }

        var timeAtPause = this.audioGraph.sourceNode.context.currentTime;

        this.track.playTimeOffset += timeAtPause - this.track.startTime;

        this.stop();

        return true;

    };

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

    player.prototype.createAudioContext = function createAudioContextFunction() {

        this.audioContext = AudioContextManager.getContext();

    };

    player.prototype.setAudioContext = function setAudioContextFunction(audioContext) {

        if (audioContext !== undefined) {

            this.audioContext = audioContext;

        } else {

            throw 'audioContext is undefined';

        }

    };

    player.prototype.getAudioContext = function getAudioContextFunction() {

        return this.audioContext;

    };

    player.prototype.setLoopTrack = function setLoopTrackFunction(loopTrack) {

        this.loopTrack = loopTrack;

    };

    player.prototype.getLoopTrack = function () {

        return this.loopTrack;

    };

    player.prototype.setLoopPlaylist = function setLoopPlaylistFunction(loopPlaylist) {

        this.loopPlaylist = loopPlaylist;

    };

    player.prototype.getLoopPlaylist = function getLoopPlaylistFunction() {

        return this.loopPlaylist;

    };

    player.prototype.setupTrack = function setupTrackFunction(oneOrMoreTrackAttributes) {

        if (oneOrMoreTrackAttributes instanceof Array) {

            var i;

            for (i = 0; i < oneOrMoreTrackAttributes.length; i++) {

                var attribute = oneOrMoreTrackAttributes[i];
                
                this.setTrackAttribute(attribute);

            }

        } else {

            var attribute = oneOrMoreTrackAttributes;

            this.setTrackAttribute(attribute);

        }

    };
    
    player.prototype.setTrackAttribute = function setTrackAttributeFunction(attribute) {
        
        var attributeKey;

        for (attributeKey in attribute) {

            this.track[attributeKey] = attribute[attributeKey];

        }
        
    };

    player.prototype.getTrackSetup = function getTrackSetupFunction() {

        return this.track;

    };

    player.prototype.createAudioGraph = function createAudioGraphFunction() {

        if (this.audioContext === undefined) {

            this.createAudioContext();

        }

        this.audioGraph = {};

        // create an audio buffer source node
        this.audioGraph.sourceNode = this.audioContext.createBufferSource();

        // create a gain node
        this.audioGraph.gainNode = this.audioContext.createGain();

        // connect the source node to the gain node
        this.audioGraph.sourceNode.connect(this.audioGraph.gainNode);

        // create a panner node
        this.audioGraph.pannerNode = this.audioContext.createPanner();

        // connect the gain node to the panner node
        this.audioGraph.gainNode.connect(this.audioGraph.pannerNode);

        // connect to the panner node to the destination (speakers)
        this.audioGraph.pannerNode.connect(this.audioContext.destination);

    };

    player.prototype.setAudioGraph = function setAudioGraphFunction(audioGraph) {

        this.audioGraph = audioGraph;

    };

    player.prototype.setBuffer = function setBufferFunction(buffer) {

        this.track.isBuffering = false;

        this.track.buffer = buffer;

    };

    player.prototype.playbackRateChange = function playbackRateChangeFunction(playbackRate) {

        // < 1 slower, > 1 faster playback
        this.audioGraph.sourceNode.playbackRate = playbackRate;

    };

    player.prototype.pannerChange = function pannerChangeFunction(left, right) {

        // https://developer.mozilla.org/en-US/docs/Web/API/PannerNode

        this.audioGraph.pannerNode.setPosition(0, 0, 0);

    };

    player.prototype.volumeChange = function volumeChangeFunction(volumeInPercent) {

        // https://developer.mozilla.org/en-US/docs/Web/API/GainNode

        this.audioGraph.gainNode.value = volumeInPercent / 100;

    };

    player.prototype.positionChange = function positionChangeFunction(trackPositionInPercent) {
        
        // stop the track playback
        this.stop();

        var trackPositionInSeconds = (this.track.buffer.duration / 100) * trackPositionInPercent;

        this.track.playTimeOffset = trackPositionInSeconds;

        // start the playback at the given position
        this.play();

    };

    var startTimer = function startTimerFunction() {

        var triggerProgressEventBinded = triggerProgressEvent.bind(this);

        this.progressIntervalHandler = setInterval(triggerProgressEventBinded, 200);

    };

    var stopTimer = function stopTimerFunction() {

        clearInterval(this.progressIntervalHandler);

    };

    var triggerProgressEvent = function triggerProgressEventFunction() {

        var timeNow = this.audioGraph.sourceNode.context.currentTime;

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
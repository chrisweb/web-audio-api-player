/**
 * 
 * player
 * 
 * @param {type} EventsManager
 * @param {type} AudioContextManager
 * @param {type} AjaxManager
 * 
 * @returns {player_L7.player}
 */
define([
    'library.events',
    'chrisweb.player.audio',
    'chrisweb.player.ajax'

], function (
    EventsManager,
    AudioContextManager,
    AjaxManager
) {

    'use strict';

    var playerInstance;
    
    var bufferingTimeoutHandler;

    /**
     * 
     * player constructor
     * 
     * @returns {player_L9.player}
     */
    var player = function playerConstructor() {

        this.audioContext;
        this.audioGraph;
        this.progressIntervalHandler;

        // loop single track
        this.loopTrack = false;

        // loop playlist
        this.loopPlaylist = false;

        // create a new track
        this.track = createTrack();

        // make the eventsmanager available everywhere
        this.events = EventsManager;

        // start listening for events
        this.startListening();

    };

    /**
     * 
     * create a track
     * 
     * @returns {undefined}
     */
    var createTrack = function createTrackFunction() {

        // create a new track object
        var track = {
            url: null,
            playTimeOffset: 0,
            currentTime: 0,
            buffer: null,
            isBuffering: false,
            startTime: 0,
            playTime: 0,
            playedTimePercentage: 0,
            isPlaying: false,
            id: null,
            playlistId: null
        };

        return track;

    };

    /**
     * 
     * setup the player
     * 
     * @param {type} oneOrMorePlayerOptions
     * @returns {undefined}
     */
    player.prototype.setup = function setupFunction(oneOrMorePlayerOptions) {

        // handle options
        if (oneOrMorePlayerOptions !== undefined) {

            if (oneOrMorePlayerOptions instanceof Array) {

                var i;

                for (i = 0; i < oneOrMorePlayerOptions.length; i++) {

                    var option = oneOrMorePlayerOptions[i];

                    this.setOption(option);

                }

            } else {

                var option = oneOrMorePlayerOptions;

                this.setOption(option);

            }

        }

    };

    /**
     * 
     * set an option
     * 
     * @param {type} option
     * @returns {undefined}set an option
     */
    player.prototype.setOption = function setOptionFunction(option) {

        var optionKey;

        for (optionKey in option) {

            switch (optionKey) {
                case 'audioContext':
                    this.setAudioContext(option[optionKey]);
                    break;
                case 'loopTrack':
                    this.setLoopTrack(option[optionKey]);
                    break;
                case 'loopPlaylist':
                    this.setLoopPlaylist(option[optionKey]);
                    break;
                default:
                    throw 'unknown option "' + optionKey + '"';
            }

        }

    };

    /**
     * 
     * play
     * 
     * @param {type} attributes
     * 
     * @returns {Boolean}
     */
    player.prototype.play = function playFunction(attributes) {

        if (!this.hasOwnProperty('track')) {

            throw 'run, forest run!';

        }

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

    /**
     * 
     * load a track
     * 
     * @param {type} playOnceBuffered
     * @param {type} silenceEvents
     * @param {type} callback
     * 
     * @returns {undefined}
     */
    player.prototype.loadTrack = function loadTrackFunction(playOnceBuffered, silenceEvents, callback) {
        
        // check if we have a track url
        if (this.track.url === null) {

            var error = 'error: track url not found';

            if (callback !== undefined) {

                callback(error);

            } else {

                return error;

            }

        }
        
        // set buffering mode to true
        this.track.isBuffering = true;

        if (playOnceBuffered === undefined) {

            playOnceBuffered = false;

        }

        if (this.audioContext === undefined) {

            this.createAudioContext();

        }

        var that = this;

        // load the array buffer
        AjaxManager.getAudioBuffer(this.track.url, this.audioContext, silenceEvents, function (error, trackBuffer) {

            if (!error) {

                that.setBuffer(trackBuffer);

                if (playOnceBuffered) {

                    that.play();

                }

                if (callback !== undefined) {

                    callback(false, trackBuffer);

                }

            } else {
                
                if (callback !== undefined) {
                    
                    callback(error);
                    
                } else {

                    throw error;
                    
                }

            }

        });

    };

    /**
     * 
     * pause
     * 
     * @returns {undefined}
     */
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

    /**
     * 
     * stop
     * 
     * @returns {undefined}
     */
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

    /**
     * 
     * create a new audio context
     * 
     * @returns {undefined}
     */
    player.prototype.createAudioContext = function createAudioContextFunction() {

        this.audioContext = AudioContextManager.getContext();

    };

    /**
     * 
     * set audio context
     * 
     * @param {type} audioContext
     * @returns {undefined}
     */
    player.prototype.setAudioContext = function setAudioContextFunction(audioContext) {

        if (audioContext !== undefined) {

            this.audioContext = audioContext;

        } else {

            throw 'audioContext is undefined';

        }

    };

    /**
     * 
     * get audio context
     * 
     * @returns {core_L16.player.audioContext}
     */
    player.prototype.getAudioContext = function getAudioContextFunction() {

        return this.audioContext;

    };

    /**
     * 
     * set the loop track option
     * 
     * @param {type} loopTrack
     * @returns {undefined}
     */
    player.prototype.setLoopTrack = function setLoopTrackFunction(loopTrack) {

        this.loopTrack = loopTrack;

    };

    /**
     * 
     * get the loop track option
     * 
     * @returns {core_L16.player.loopTrack}
     */
    player.prototype.getLoopTrack = function () {

        return this.loopTrack;

    };

    /**
     * 
     * set the loop playlist option
     * 
     * @param {type} loopPlaylist
     * @returns {undefined}
     */
    player.prototype.setLoopPlaylist = function setLoopPlaylistFunction(loopPlaylist) {

        this.loopPlaylist = loopPlaylist;

    };

    /**
     * 
     * get the loop playlist option
     * 
     * @returns {type}
     */
    player.prototype.getLoopPlaylist = function getLoopPlaylistFunction() {

        return this.loopPlaylist;

    };

    /**
     * 
     * set one or more track attribute(s)
     * 
     * @param {type} oneOrMoreTrackAttributes
     * 
     * @returns {undefined}
     */
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
    
    /**
     * 
     * set a track attribute
     * 
     * @param {type} attribute
     * @returns {undefined}
     */
    player.prototype.setTrackAttribute = function setTrackAttributeFunction(attribute) {
        
        var attributeKey;

        for (attributeKey in attribute) {

            this.track[attributeKey] = attribute[attributeKey];

        }
        
    };
    
    /**
     * 
     * get track
     * 
     * @returns {core_L16.player.track.url}
     */
    player.prototype.getTrackSetup = function getTrackSetupFunction() {

        return this.track;

    };

    /**
     * 
     * create an audio graph
     * 
     * @returns {undefined}
     */
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

    /**
     * 
     * set an external audio graph
     * 
     * @param {type} audioGraph
     * @returns {undefined}
     */
    player.prototype.setAudioGraph = function setAudioGraphFunction(audioGraph) {

        this.audioGraph = audioGraph;

    };

    /**
     * 
     * set buffer
     * 
     * @param {type} buffer
     * 
     * @returns {undefined}
     */
    player.prototype.setBuffer = function setBufferFunction(buffer) {

        this.track.isBuffering = false;

        this.track.buffer = buffer;

    };

    /**
     * 
     * change the playback rate
     * 
     * @param {type} playbackRate
     * @returns {undefined}
     */
    player.prototype.playbackRateChange = function playbackRateChangeFunction(playbackRate) {

        // < 1 slower, > 1 faster playback
        this.audioGraph.sourceNode.playbackRate = playbackRate;

    };

    /**
     * 
     * panner node change
     * 
     * @param {type} left
     * @param {type} right
     * @returns {undefined}
     */
    player.prototype.pannerChange = function pannerChangeFunction(left, right) {

        // https://developer.mozilla.org/en-US/docs/Web/API/PannerNode

        this.audioGraph.pannerNode.setPosition(0, 0, 0);

    };

    /**
     * 
     * gain node volume change
     * 
     * @param {type} volumeInPercent
     * @returns {undefined}
     */
    player.prototype.volumeChange = function volumeChangeFunction(volumeInPercent) {

        // https://developer.mozilla.org/en-US/docs/Web/API/GainNode

        this.audioGraph.gainNode.value = volumeInPercent / 100;

    };

    /**
     * 
     * position change
     * 
     * @param {type} trackPositionInPercent
     * @returns {undefined}
     */
    player.prototype.positionChange = function positionChangeFunction(trackPositionInPercent) {
        
        // stop the track playback
        this.stop();

        var trackPositionInSeconds = (this.track.buffer.duration / 100) * trackPositionInPercent;

        this.track.playTimeOffset = trackPositionInSeconds;

        // start the playback at the given position
        this.play();

    };

    /**
     * 
     * start listening for events
     * 
     * @returns {undefined}
     */
    player.prototype.startListening = function startListeningFunction() {
        
        var that = this;
        
        // remove the previous listeners
        this.stopListening();
        
        this.events.on(this.events.constants.PLAYER_POSITION_CHANGE, function (attributes) {
            
            var trackPositionInPercent = attributes.percentage;
            
            that.positionChange(trackPositionInPercent);
            
        });
        
        this.events.on(this.events.constants.PLAYER_PLAY, function (attributes) {
            
            that.play(attributes);
            
        });
        
        this.events.on(this.events.constants.PLAYER_PAUSE, function () {
            
            that.pause();
            
        });
        
        this.events.on(this.events.constants.PLAYER_STOP, function () {
            
            that.stop();
            
        });
        
    };

    /**
     * 
     * stop listening for events
     * 
     * @returns {undefined}
     */
    player.prototype.stopListening = function stopListeningFunction() {

        this.events.off(this.events.constants.PLAYER_POSITION_CHANGE);

        this.events.off(this.events.constants.PLAYER_PLAY);

        this.events.off(this.events.constants.PLAYER_PAUSE);

        this.events.off(this.events.constants.PLAYER_STOP);

    };

    /**
     * 
     * starts the timer that triggers the progress events
     * 
     * @returns {undefined}
     */
    var startTimer = function startTimerFunction() {

        var triggerProgressEventBinded = triggerProgressEvent.bind(this);

        this.progressIntervalHandler = setInterval(triggerProgressEventBinded, 200);

    };

    /**
     * 
     * stops the timer that triggers the progress events
     * 
     * @returns {undefined}
     */
    var stopTimer = function stopTimerFunction() {

        clearInterval(this.progressIntervalHandler);

    };

    /**
     * 
     * trigger progress event
     * 
     * @returns {undefined}
     */
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

    };

    /**
     * 
     * get a player instance
     * 
     * @returns {core_L16.playerInstance}
     */
    var getPlayerInstance = function getPlayerInstanceFunction() {

        if (playerInstance === undefined) {

            playerInstance = new player();

        }

        return playerInstance;

    };

    /**
     * public functions
     */
    return getPlayerInstance();

});
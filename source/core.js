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
    'event',
    'player.audio',
    'player.ajax'
    
], function (
    EventsManager,
    AudioContextManager,
    AjaxManager
) {

    'use strict';

    /**
     * 
     * player constructor
     * 
     * @param {type} options
     * @returns {player_L9.player}
     */
    var player = function playerConstructor(options) {
        
        this.audioContext;
        this.audioGraph;
        this.track;
        this.progressIntervalHandler;
        
        this.createTrack();
        
        // handle options
        if (options !== undefined) {
            
            if (options.audioContext !== undefined) {
                
                this.setAudioContext(options.audioContext);
                
            }
            
            if (options.trackBuffer !== undefined) {
                
                this.setBuffer(options.trackBuffer);
                
            }
            
            if (options.trackUrl !== undefined) {
                
                this.setTrackUrl(options.trackUrl);
                
            }
            
        }
        
        this.events = new EventsManager();
        
    };
    
    /**
     * 
     * create a track
     * 
     * @returns {undefined}
     */
    player.prototype.createTrack = function createTrackFunction() {
        
        // create a new track object
        this.track = {
            url: null,
            playTimeOffset: 0,
            currentTime: 0,
            buffer: null,
            isBuffering: false,
            startTime: 0,
            playTime: 0,
            playedTimePercentage: 0,
            isPlaying: false
        };
        
    };
    
    var bufferingTimeoutHandler;
    
    /**
     * 
     * play
     * 
     * @param {type} trackUrl
     * 
     * @returns {Boolean}
     */
    player.prototype.play = function playFunction(trackUrl) {

        // if the track is already playing do nothing
        if (this.track.isPlaying) {
            
            return null;
            
        }
        
        // clear the previous timeout handler if one exists
        if (bufferingTimeoutHandler !== undefined) {
            
            clearTimeout(bufferingTimeoutHandler);
            
        }
        
        if (this.track.isBuffering) {
            
            var that = this;
            
            bufferingTimeoutHandler = setTimeout(function() {
                
                that.play();
                
            }, 500);
            
            return;
            
        }
        
        if (this.track.buffer === null) {
            
            var playOnceBuffered = true;
            var silenceEvents = false;
            
            var that = this;
            
            this.loadTrack(trackUrl, playOnceBuffered, silenceEvents);
            
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
     * @param {type} trackUrl
     * @param {type} playOnceBuffered
     * @param {type} silenceEvents
     * @param {type} callback
     * 
     * @returns {undefined}
     */
    player.prototype.loadTrack = function loadTrackFunction(trackUrl, playOnceBuffered, silenceEvents, callback) {
        
        // set buffering mode to true
        this.track.isBuffering = true;
        
        // check if we have a track url
        if (trackUrl === undefined || trackUrl === '') {
            
            if (this.track.url === null) {
                
                var error = 'error: track url not found';
                
                if (callback !== undefined) {
                    
                    callback(error);
                    
                } else {
                
                    console.log(error);
                    
                }
                
            }
            
        } else {
            
            this.setTrackUrl(trackUrl);
            
        }
        
        if (playOnceBuffered === undefined) {
            
            playOnceBuffered = false;
            
        }
        
        if (this.audioContext === undefined) {
            
            this.createAudioContext();
            
        }
        
        var that = this;
        
        // load the array buffer
        AjaxManager.getAudioBuffer(this.track.url, this.audioContext, silenceEvents, function(error, trackBuffer) {
            
            if (!error) {
                
                that.setBuffer(trackBuffer);
                
                if (playOnceBuffered) {
                    
                    that.play();
                    
                }
                
                if (callback !== undefined) {
                    
                    callback(false, trackBuffer);
                    
                }
                
            } else {
                
                console.log(error);
                
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
        
        stopTimer.call(this);
        
        this.track.isPlaying = false;
        
        // after a stop you cant call a start again, you need to create a new
        // source node, this means that we unset the audiograph after a stop
        // so that it gets recreated on the next play
        this.audioGraph = undefined;
        
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
            
            console.log('audioContext is undefined');
            
        }
        
    };
    
    /**
     * 
     * get audio context
     * 
     * @returns {core_L16.player.audioContext}
     */
    player.prototype.getAudioContext = function () {
        
        return this.audioContext;
        
    };
    
    /**
     * 
     * set track url
     * 
     * @param {type} trackUrl
     * 
     * @returns {undefined}
     */
    player.prototype.setTrackUrl = function (trackUrl) {

        if (trackUrl !== undefined) {
        
            this.track.url = trackUrl;
            
        } else {
            
            console.log('trackUrl is undefined');
            
        }
        
    };
    
    /**
     * 
     * get track url
     * 
     * @returns {core_L16.player.track.url}
     */
    player.prototype.getTrackUrl = function () {
        
        return this.track.url;
        
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
        
        //console.log(trackPositionInPercent);

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
        
        this.events.on(this.events.constants.positionEvent, function(trackPositionInPercent) {
            
            that.positionChange(trackPositionInPercent);
            
        });
        
        this.events.on(this.events.constants.playEvent, function() {
            
            that.play();
            
        });
        
        this.events.on(this.events.constants.pauseEvent, function() {
            
            that.pause();
            
        });
        
        this.events.on(this.events.constants.stopEvent, function() {
            
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
        
        this.events.off(this.events.constants.positionEvent);
        
        this.events.off(this.events.constants.playEvent);
        
        this.events.off(this.events.constants.pauseEvent);
        
        this.events.off(this.events.constants.stopEvent);
        
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
        
        this.track.playedTimePercentage = (this.track.playTime / this.track.buffer.duration) * 100;
        
        this.events.trigger(this.events.constants.progressEvent, this.track.playedTimePercentage);
        
    };

    /**
     * public functions
     */
    return player;

});
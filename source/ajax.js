/**
 * 
 * ajax
 * 
 * @param {type} $
 * @param {type} EventsManager
 * 
 * @returns {ajax_L7.ajaxAnonym$1}
 */
define([
    'jquery',
    'library.eventsManager'
    
], function (
    $,
    EventsManager
) {

    'use strict';
    
    /**
     * 
     * getAudioBuffer
     * 
     * @param {type} trackUrl
     * @param {type} audioContext
     * @param {type} silenceEvents
     * @param {type} callback
     * @returns {undefined}
     */
    var getAudioBuffer = function (trackUrl, audioContext, silenceEvents, callback) {
        
        if (silenceEvents === undefined) {
            
            silenceEvents = false;
            
        }
        
        var xhr = new XMLHttpRequest();
        
        xhr.open('GET', trackUrl, true);
        xhr.responseType = 'arraybuffer';
        xhr.send();
        
        xhr.onerror = function(event) {
            
            console.log(event);
            
            // TODO
            
        };
        
        xhr.onprogress = function(event) {
            
            if (!silenceEvents) {
            
                EventsManager.trigger(EventsManager.constants.bufferingEvent, event);
                
            }
            
        };
        
        xhr.onload = function() {
        
            audioContext.decodeAudioData(xhr.response, function onSuccess(decodedBuffer) {
                
                callback(false, decodedBuffer);
                
            }, function onFailure() {
                
                callback('decoding the buffer failed');
                
            });
            
        };

    };
    
    /**
     * public functions
     */
    return {
        getAudioBuffer: getAudioBuffer
    };

});
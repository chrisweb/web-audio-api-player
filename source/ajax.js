/**
 * 
 * ajax
 * 
 * @param {type} $
 * @returns {ajax_L7.ajaxAnonym$1}
 */
define([
    'jquery'
    
], function (
    $
) {

    'use strict';
    
    /**
     * 
     * getAudioBuffer
     * 
     * @param {type} trackUrl
     * @param {type} audioContext
     * @param {type} callback
     * @returns {undefined}
     */
    var getAudioBuffer = function (trackUrl, audioContext, callback) {
        
        var xhr = new XMLHttpRequest();
        
        xhr.open('GET', trackUrl, true);
        xhr.responseType = 'arraybuffer';
        xhr.send();
        
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

'use strict';
    
/*
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
                
            var percentage = 100/(event.total/event.loaded);
            
            EventsManager.trigger(
                EventsManager.constants.TRACK_LOADING_PROGRESS,
                {
                    originalEvent: event,
                    percentage: percentage
                }
            );
                
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
*/
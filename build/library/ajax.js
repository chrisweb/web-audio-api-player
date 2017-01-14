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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9saWJyYXJ5L2FqYXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsWUFBWSxDQUFDO0FBRWI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0VBd0RFIiwiZmlsZSI6ImxpYnJhcnkvYWpheC5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnO1xuICAgIFxuLypcbnZhciBnZXRBdWRpb0J1ZmZlciA9IGZ1bmN0aW9uICh0cmFja1VybCwgYXVkaW9Db250ZXh0LCBzaWxlbmNlRXZlbnRzLCBjYWxsYmFjaykge1xuICAgICAgICBcbiAgICBpZiAoc2lsZW5jZUV2ZW50cyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgc2lsZW5jZUV2ZW50cyA9IGZhbHNlO1xuICAgICAgICAgICAgXG4gICAgfVxuICAgICAgICBcbiAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgIFxuICAgIHhoci5vcGVuKCdHRVQnLCB0cmFja1VybCwgdHJ1ZSk7XG4gICAgeGhyLnJlc3BvbnNlVHlwZSA9ICdhcnJheWJ1ZmZlcic7XG4gICAgeGhyLnNlbmQoKTtcbiAgICAgICAgXG4gICAgeGhyLm9uZXJyb3IgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgXG4gICAgICAgIGNvbnNvbGUubG9nKGV2ZW50KTtcbiAgICAgICAgICAgIFxuICAgICAgICAvLyBUT0RPXG4gICAgICAgICAgICBcbiAgICB9O1xuICAgICAgICBcbiAgICB4aHIub25wcm9ncmVzcyA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBcbiAgICAgICAgaWYgKCFzaWxlbmNlRXZlbnRzKSB7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgcGVyY2VudGFnZSA9IDEwMC8oZXZlbnQudG90YWwvZXZlbnQubG9hZGVkKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgRXZlbnRzTWFuYWdlci50cmlnZ2VyKFxuICAgICAgICAgICAgICAgIEV2ZW50c01hbmFnZXIuY29uc3RhbnRzLlRSQUNLX0xPQURJTkdfUFJPR1JFU1MsXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBvcmlnaW5hbEV2ZW50OiBldmVudCxcbiAgICAgICAgICAgICAgICAgICAgcGVyY2VudGFnZTogcGVyY2VudGFnZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgIH07XG4gICAgICAgIFxuICAgIHhoci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgXG4gICAgICAgIGF1ZGlvQ29udGV4dC5kZWNvZGVBdWRpb0RhdGEoeGhyLnJlc3BvbnNlLCBmdW5jdGlvbiBvblN1Y2Nlc3MoZGVjb2RlZEJ1ZmZlcikge1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgY2FsbGJhY2soZmFsc2UsIGRlY29kZWRCdWZmZXIpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICB9LCBmdW5jdGlvbiBvbkZhaWx1cmUoKSB7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBjYWxsYmFjaygnZGVjb2RpbmcgdGhlIGJ1ZmZlciBmYWlsZWQnKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgfSk7XG4gICAgICAgICAgICBcbiAgICB9O1xuXG59O1xuKi8iXX0=

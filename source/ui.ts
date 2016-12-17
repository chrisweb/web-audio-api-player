
'use strict';

/*
var playerUI = function playerUIConstructor(options) {
        
    // player html element
    this.$element;
        
    if (options !== undefined) {
        
        if (options.$element !== undefined) {

            this.setPlayerElement(options.$element);

        }
            
    }
        
    // events manager
    this.events = new EventsManager();
        
};
    
playerUI.prototype.createPlayPauseButton = function playPauseButtonFunction() {
        
    var $playPauseButton = $('<button>');
        
    $playPauseButton.text('play').addClass('play');
        
    this.$element.append($playPauseButton);
        
    var that = this;
        
    $playPauseButton.on('click', function(event) {
            
        event.preventDefault();
            
        if ($playPauseButton.hasClass('play')) {
            
            that.events.trigger(that.events.constants.playEvent);
                
            $playPauseButton.text('pause').removeClass('play').addClass('pause');
                
        } else {
                
            that.events.trigger(that.events.constants.pauseEvent);
                
            $playPauseButton.text('play').removeClass('pause').addClass('play');
                
        }
            
    });
        
};
    

playerUI.prototype.setPlayerElement = function setPlayerElementFunction($element) {
        
    this.$element = $element;
        
};
*/
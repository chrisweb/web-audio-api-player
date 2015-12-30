/**
 * 
 * player ui
 * 
 * @param {type} EventsManager
 * @returns {ui_L7.playerUI}
 */
define([
    'library.events'
    
], function (
    EventsManager
) {

    'use strict';

    /**
     * 
     * player ui constructor
     * 
     * @param {type} options
     * @returns {ui_L7.playerUI}
     */
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
    
    /**
     * 
     * play / pause button
     * 
     * @returns {undefined}
     */
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
    
    /**
     * 
     * set player main node
     * 
     * @param {type} $element
     * @returns {undefined}
     */
    playerUI.prototype.setPlayerElement = function setPlayerElementFunction($element) {
        
        this.$element = $element;
        
    };
    
    /**
     * public functions
     */
    return playerUI;

});

'use strict';

/**
 * 
 * http://requirejs.org/
 * 
 * require configuration
 * 
 */
require.config({
    baseUrl: 'scripts',
    paths: {
        // vendor scripts
        'jquery': 'vendor/jquery/dist/jquery',
        'player.core': '../../../source/core',
        'player.ajax': '../../../source/ajax',
        'player.audio': '../../../source/audio',
        'player.ui': '../../../source/ui',
        
        // own small event manager for this example
        'event': 'library/event'
    }
    
});

/**
 * 
 * main require
 * 
 * @param {type} $
 * @param {type} PlayerCore
 * @param {type} PlayerUI
 * 
 * @returns {undefined}
 */
require([
    'jquery',
    'player.core',
    'player.ui'
    
], function ($, PlayerCore, PlayerUI) {
    
    // on dom load
    $(function() {

        var $playerElement = $('#player');

        var playerUI = new PlayerUI({ $element: $playerElement });
        
        playerUI.createPlayPauseButton();
        
        var playerCore = new PlayerCore();
        
        playerCore.startListening();
        
        //var trackUrl = 'https://storage-new.newjamendo.com?trackid=1100511&format=mp31';
        var trackUrl = 'https://storage-new.newjamendo.com/download/track/1100511/mp32';
        
        var playOnceBuffered = false;
        
        playerCore.loadTrack(trackUrl, playOnceBuffered);
        
    });
        
});
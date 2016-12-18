
'use strict';

// vendor (node_modules)
import * as $ from 'jquery';

// player build
import { Core, ICoreOptions, Sound, ISoundAttribtes } from 'web-audio-api-player';

$(function () {

    let options: ICoreOptions = {

    };

    let player = new Core(options);

    let soundAttributes: ISoundAttribtes = {
        sources: 'https://mp3l.jamendo.com/?trackid=1214935&format=mp31',
        id: 1214935,
        playlistId: 0
    }

    player.addSoundToQueue(soundAttributes);

    player.setVolume(volume: number);

});

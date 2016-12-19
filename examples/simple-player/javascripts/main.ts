
'use strict';

// vendor (node_modules)
import * as $ from 'jquery';

// player build
import { Core, ICoreOptions, Sound, ISoundAttributes } from 'web-audio-api-player';

$(function () {

    let options: ICoreOptions = {

    };

    let player = new Core(options);

    let firstSoundAttributes: ISoundAttributes = {
        sources: 'https://mp3l.jamendo.com/?trackid=1314412&format=mp31',
        id: 1314412,
        playlistId: 0
    };

    // add the first song to queue
    let firstSound = player.addSoundToQueue(firstSoundAttributes);

    let secondSoundAttributes: ISoundAttributes = {
        sources: 'https://mp3l.jamendo.com/?trackid=1214935&format=ogg1',
        id: 1214935,
        playlistId: 0
    };

    // add another song
    let secondSound = player.addSoundToQueue(secondSoundAttributes);

    let volume = 90;

    player.setVolume(volume);

    // play first song in the queue
    player.play();

    // play next song
    player.play();

});

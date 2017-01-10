
'use strict';

// vendor (node_modules)
import * as $ from 'jquery';

// player build
import { PlayerCore, ICoreOptions, PlayerSound, ISoundAttributes } from 'web-audio-api-player';

$(function () {

    let options: ICoreOptions = {
        soundsBaseUrl: 'https://mp3l.jamendo.com/?trackid='
    };

    let player = new PlayerCore(options);

    let firstSoundAttributes: ISoundAttributes = {
        sources: '1314412&format=mp31',
        id: 1314412,
        playlistId: 0
    };

    // add the first song to queue
    //let firstSound = player.addSoundToQueue(firstSoundAttributes);

    let secondSoundAttributes: ISoundAttributes = {
        sources: '1214935&format=ogg1',
        id: 1214935,
        playlistId: 0
    };

    // add another song
    let secondSound = player.addSoundToQueue(secondSoundAttributes);

    //let volume = 90;

    //player.setVolume(volume);

    // play first song in the queue
    player.play();

    // play next song
    //player.play(player.PLAY_SOUND_NEXT);

    // TODO: use the sound to display the loading progress

    // TODO: add two sounds, then play the second one by passing it's id, queue should get rid of first song and immediatly play the second one

    // TODO: add a playlist of multiple songs at once, play some song (not the first one), again queue up until that song should get wiped, then play any previous song by id
    // but as queue won't know that song, we need to trigger some error
    // do this again but this time reset queue and repopulate it, then play the previous song
    // TODO: can we add some playlist support to avoid that the user manually needs to manage the queue? especially to avoid having to reset it when playing earlier song and then rebuild himself?

    // TODO: autoplay next song, add two songs, play first one, when ended next one should get played

    // TODO: can we by using the sound, cache its buffer and then re-inject it before playing so that it does get re-loaded/buffered by player

    // TODO: try out playing songs by using play('next / previous / first / last')

    // TODO: add methods to move songs in queue? or remove songs from queue

    // TODO: add history feature and keep track of songs that have been played

    // TODO: can sounds be destroyed? what happens to history if the have been played and get destroyed, what happens if song is in queue or even if song is being played or is buffering when it gets destroyed

    // TODO: test the songs buffer cache, set through options amount of buffers to keep in cache and then check if ajax request is done or not when playing song multiple times
    // TODO: cache buffer in indexed db or just keep "in memory"?

});

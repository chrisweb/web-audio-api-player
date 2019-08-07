
'use strict';

// player build
import { PlayerCore, ISoundAttributes, ICoreOptions } from '../../../../dist/index.js';

// library
import { PlayerUI } from './library/player/ui.js';

let options: ICoreOptions = {
    soundsBaseUrl: 'https://mp3l.jamendo.com/?trackid=',
    playingProgressIntervalTime: 500
};

let player = new PlayerCore(options);
let playerUI = new PlayerUI(player);

let firstSoundAttributes: ISoundAttributes = {
    sources: '1314412&format=mp31',
    id: 1314412,
    playlistId: 0,
    onLoading: (loadingProgress, maximumValue, currentValue) => {
        console.log('loading: ', loadingProgress, maximumValue, currentValue);
        playerUI.changeLoadingProgress(loadingProgress);
    },
    onPlaying: (playingProgress, maximumValue, currentValue) => {
        console.log('playing: ', playingProgress, maximumValue, currentValue);
        playerUI.changePlayingProgress(playingProgress);
        console.log(firstSound);
    },
    onStarted: (playTimeOffset) => {
        console.log('started', playTimeOffset);
    },
    onPaused: (playTimeOffset) => {
        console.log('paused', playTimeOffset);
    },
    onStopped: (playTimeOffset) => {
        console.log('stopped', playTimeOffset);
    },
    onResumed: (playTimeOffset) => {
        console.log('resumed', playTimeOffset);
    },
    onEnded: (willPlayNext) => {
        console.log('ended', willPlayNext);
        if (!willPlayNext) {
            playerUI.resetUI();
        }
    }
};

// add the first song to queue
let firstSound = player.addSoundToQueue(firstSoundAttributes);

console.log(firstSound);

let secondSoundAttributes: ISoundAttributes = {
    sources: '1214935&format=ogg1',
    id: 1214935,
    playlistId: 0,
    onLoading: (loadingProgress, maximumValue, currentValue) => {
        console.log('loading: ', loadingProgress, maximumValue, currentValue);
        playerUI.changeLoadingProgress(loadingProgress);
    },
    onPlaying: (playingProgress, maximumValue, currentValue) => {
        console.log('playing: ', playingProgress, maximumValue, currentValue);
        playerUI.changePlayingProgress(playingProgress);
    },
    onStarted: (playTimeOffset) => {
        console.log('started', playTimeOffset);
    },
    onPaused: (playTimeOffset) => {
        console.log('paused', playTimeOffset);
    },
    onStopped: (playTimeOffset) => {
        console.log('stopped', playTimeOffset);
    },
    onResumed: (playTimeOffset) => {
        console.log('resumed', playTimeOffset);
    },
    onEnded: (willPlayNext) => {
        console.log('ended', willPlayNext);
        if (!willPlayNext) {
            playerUI.resetUI();
        }
    }
};

// add another song
let secondSound = player.addSoundToQueue(secondSoundAttributes);

console.log(secondSound);

// halt the audio hardware access temporarily to reduce CPU and battery usage
/*player.getAudioContext().then((audioContext) => {
    audioContext.suspend();
    console.log(audioContext.state);
});*/

//let volume = 90;

//player.setVolume(volume);

// play first song in the queue
//player.play();

// play next song
//player.play(player.PLAY_SOUND_NEXT);
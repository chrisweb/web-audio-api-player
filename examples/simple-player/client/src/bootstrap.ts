/* eslint-disable @typescript-eslint/no-use-before-define */
'use strict'

// player build
import { PlayerCore, ISoundAttributes, ICoreOptions, ISoundsQueueOptions } from '../../../../dist/index.js'

// library
import { PlayerUI } from './library/player/ui.js'

// set some options of the player
// there are two different sound modes
// !!! for some details about the differencies of the two MODES
// check out the documentation part of the readme
const options: ICoreOptions = {
    soundsBaseUrl: 'https://mp3l.jamendo.com/?trackid=',
    loadPlayerMode: PlayerCore.PLAYER_MODE_AUDIO,
    loopQueue: true,
}

// create an instance of the player
const player = new PlayerCore(options)

// create an instance of a basic UI we created for this example
// as the player does not come with an UI you need to create
// your own
const playerUI = new PlayerUI(player)

// create a first sound
// all you need is to define a source and give each source an ID
// using any of the callbacks is optional
const firstSoundAttributes: ISoundAttributes = {
    source: [{ url: '1314412&format=mp31', codec: 'mp3' }, { url: '1314412&format=ogg1', codec: 'ogg', isPreferred: true }],
    id: 1314412,
    onLoading: (loadingProgress, maximumValue, currentValue) => {
        console.log('SONG 1 - onLoading (loadingProgress, maximumValue, currentValue): ', loadingProgress, maximumValue, currentValue)
        playerUI.changeLoadingProgress(loadingProgress)
    },
    onPlaying: (playingProgress/*, maximumValue, currentValue*/) => {
        //console.log('SONG 1 - onPlaying (playingProgress, maximumValue, currentValue): ', playingProgress, maximumValue, currentValue)
        playerUI.changePlayingProgress(playingProgress)
        //console.log(firstSound)
        //console.log('firstSound.duration: ', firstSound.duration)
    },
    onStarted: (playTimeOffset) => {
        console.log('SONG 1 - onStarted (playTimeOffset): ', playTimeOffset)
        playerUI.setToPlay()
    },
    onPaused: (playTimeOffset) => {
        console.log('SONG 1 - onPaused (playTimeOffset): ', playTimeOffset)
        playerUI.setToStop()
    },
    onStopped: (playTimeOffset) => {
        console.log('SONG 1 - onStopped (playTimeOffset): ', playTimeOffset)
        playerUI.setToStop()
    },
    onResumed: (playTimeOffset) => {
        console.log('SONG 1 - onResumed (playTimeOffset): ', playTimeOffset)
        playerUI.setToPlay()
    },
    onEnded: (willPlayNext) => {
        console.log('SONG 1 - onEnded (willPlayNext): ', willPlayNext)
        if (!willPlayNext) {
            playerUI.setToStop()
        }
    }
}

// add the first to the songs (sounds) queue
const firstSoundQueueOptions: ISoundsQueueOptions = {
    soundAttributes: firstSoundAttributes,
    whereInQueue: PlayerCore.WHERE_IN_QUEUE_AT_END
}

const firstSound = player.addSoundToQueue(firstSoundQueueOptions)

console.log('firstSound: ', firstSound)

// create a second sound
const secondSoundAttributes: ISoundAttributes = {
    source: [{ url: '1214935&format=mp31', codec: 'mp3' }, { url: '1214935&format=ogg1', codec: 'ogg', isPreferred: true }],
    id: 1214935,
    onLoading: (loadingProgress, maximumValue, currentValue) => {
        console.log('SONG 2 - onLoading (loadingProgress, maximumValue, currentValue): ', loadingProgress, maximumValue, currentValue)
        playerUI.changeLoadingProgress(loadingProgress)
    },
    onPlaying: (playingProgress/*, maximumValue, currentValue*/) => {
        //console.log('SONG 2 - onPlaying (playingProgress, maximumValue, currentValue): ', playingProgress, maximumValue, currentValue)
        playerUI.changePlayingProgress(playingProgress)
        //console.log(firstSound)
        //console.log('firstSound.duration: ', firstSound.duration)
    },
    onStarted: (playTimeOffset) => {
        console.log('SONG 2 - onStarted (playTimeOffset): ', playTimeOffset)
        playerUI.setToPlay()
    },
    onPaused: (playTimeOffset) => {
        console.log('SONG 2 - onPaused (playTimeOffset): ', playTimeOffset)
        playerUI.setToStop()
    },
    onStopped: (playTimeOffset) => {
        console.log('SONG 2 - onStopped (playTimeOffset): ', playTimeOffset)
        playerUI.setToStop()
    },
    onResumed: (playTimeOffset) => {
        console.log('SONG 2 - onResumed (playTimeOffset): ', playTimeOffset)
        playerUI.setToPlay()
    },
    onEnded: (willPlayNext) => {
        console.log('SONG 2 - onEnded (willPlayNext): ', willPlayNext)
        if (!willPlayNext) {
            playerUI.setToStop()
        }
    }
}

// add the second song (sound) to the queue
const secondSoundQueueOptions: ISoundsQueueOptions = {
    soundAttributes: secondSoundAttributes,
    whereInQueue: PlayerCore.WHERE_IN_QUEUE_AT_END
}

const secondSound = player.addSoundToQueue(secondSoundQueueOptions)

console.log('secondSound: ', secondSound)

// turn the automute feature on/off: if page becomes invisible auto mute, unmute when page becomes visible again
player.setVisibilityAutoMute(true)

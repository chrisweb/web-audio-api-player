/* eslint-disable @typescript-eslint/no-use-before-define */
'use strict'

// player build
import { PlayerCore, ISoundAttributes, ICoreOptions } from '../../../../dist/index.js'

// library
import { PlayerUI } from './library/player/ui.js'

// set some options of the player
// there are two different sound modes:
// PLAYER_MODE_AUDIO: uses an audio element to load the
// sound (which allows you to load files but also audio streams)
// PLAYER_MODE_FETCH: uses fetch to get the sound and
// then uses the web audio API to play it (the web audio API
// does only support loading files, no streams)
// !!! for some details about the differencies of the two MODES
// check out the documentation part of the readme
const options: ICoreOptions = {
    soundsBaseUrl: 'https://mp3l.jamendo.com/?trackid=',
    playingProgressIntervalTime: 500,
    loadPlayerMode: PlayerCore.PLAYER_MODE_AUDIO,
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
        console.log('loading: ', loadingProgress, maximumValue, currentValue)
        playerUI.changeLoadingProgress(loadingProgress)
    },
    onPlaying: (playingProgress, maximumValue, currentValue) => {
        console.log('playing: ', playingProgress, maximumValue, currentValue)
        playerUI.changePlayingProgress(playingProgress)
        console.log(firstSound)
        console.log('firstSound.duration: ', firstSound.duration)
    },
    onStarted: (playTimeOffset) => {
        console.log('started', playTimeOffset)
    },
    onPaused: (playTimeOffset) => {
        console.log('paused', playTimeOffset)
    },
    onStopped: (playTimeOffset) => {
        console.log('stopped', playTimeOffset)
    },
    onResumed: (playTimeOffset) => {
        console.log('resumed', playTimeOffset)
    },
    onEnded: (willPlayNext) => {
        console.log('ended', willPlayNext)
        if (!willPlayNext) {
            playerUI.resetUI()
        }
    }
}

// add the first to the songs (sounds) queue
const firstSound = player.addSoundToQueue({ soundAttributes: firstSoundAttributes })

console.log(firstSound)

// create a second sound
const secondSoundAttributes: ISoundAttributes = {
    source: [{ url: '1214935&format=mp31', codec: 'mp3' }, { url: '1214935&format=ogg1', codec: 'ogg', isPreferred: true }],
    id: 1214935,
    onLoading: (loadingProgress, maximumValue, currentValue) => {
        console.log('loading: ', loadingProgress, maximumValue, currentValue)
        playerUI.changeLoadingProgress(loadingProgress)
    },
    onPlaying: (playingProgress, maximumValue, currentValue) => {
        console.log('playing: ', playingProgress, maximumValue, currentValue)
        playerUI.changePlayingProgress(playingProgress)
    },
    onStarted: (playTimeOffset) => {
        console.log('started', playTimeOffset)
    },
    onPaused: (playTimeOffset) => {
        console.log('paused', playTimeOffset)
    },
    onStopped: (playTimeOffset) => {
        console.log('stopped', playTimeOffset)
    },
    onResumed: (playTimeOffset) => {
        console.log('resumed', playTimeOffset)
    },
    onEnded: (willPlayNext) => {
        console.log('ended', willPlayNext)
        if (!willPlayNext) {
            playerUI.resetUI()
        }
    }
}

// add the second song (sound) to the queue
const secondSound = player.addSoundToQueue({ soundAttributes: secondSoundAttributes })

console.log(secondSound)

// turn the automute feature on/off: if page becomes invisible auto mute, unmute when page becomes visible again
player.setVisibilityAutoMute(true)

// halt the audio hardware access temporarily to reduce CPU and battery usage
/*player.getAudioContext().then((audioContext) => {
    audioContext.suspend()
    console.log(audioContext.state)
})*/

//let volume = 90

//player.setVolume(volume)

// play first song in the queue
//player.play()

// play next song
//player.play(player.PLAY_SOUND_NEXT)

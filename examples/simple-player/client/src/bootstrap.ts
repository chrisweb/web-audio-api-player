/* eslint-disable @typescript-eslint/no-use-before-define */
'use strict'

// player build
import { PlayerCore/*, ISound*/, ISoundAttributes, ICoreOptions, ISoundsQueueOptions } from '../../../../dist/index.js'

// library
import { PlayerUI } from './library/player/ui.js'

// set some options of the player
// there are two different sound modes
// !!! for some details about the differencies of the two MODES
// check out the documentation part of the readme
const options: ICoreOptions = {
    soundsBaseUrl: 'https://prod-1.storage.jamendo.com/',
    loadPlayerMode: PlayerCore.PLAYER_MODE_AUDIO,
    loopQueue: true,
    addAudioElementsToDom: true,
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
    source: [{ url: '?trackid=1314412&format=mp31', codec: 'mp3' }, { url: '?trackid=1314412&format=ogg', codec: 'ogg' }],
    id: 1314412,
    onLoading: (loadingProgress, maximumValue, currentValue) => {
        console.log('SONG 1 - onLoading (loadingProgress, maximumValue, currentValue): ', loadingProgress, maximumValue, currentValue)
        playerUI.changeLoadingProgress(loadingProgress);
    },
    onPlaying: (playingPercentage, duration, playTime) => {
        //console.log('SONG 1 - onPlaying (playingPercentage, duration, playTime): ', playingPercentage, duration, playTime)
        playerUI.changePlayingProgress(playingPercentage, playTime)
    },
    onSeeking: (seekingPercentage, duration, playTime) => {
        console.log('SONG 1 - onSeeking (seekingPercentage, duration, playTime): ', seekingPercentage, duration, playTime)
        playerUI.changePlayingProgress(seekingPercentage, playTime)
    },
    onStarted: (playTimeOffset) => {
        console.log('SONG 1 - onStarted (playTimeOffset): ', playTimeOffset)
        playerUI.setToPlay(firstSound.duration)
    },
    onPaused: (playTime) => {
        console.log('SONG 1 - onPaused (playTime): ', playTime)
        playerUI.setToStop()
    },
    onStopped: (playTime) => {
        console.log('SONG 1 - onStopped (playTime): ', playTime)
        playerUI.setToStop()
    },
    onResumed: (playTime) => {
        console.log('SONG 1 - onResumed (playTime): ', playTime)
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
    source: [{ url: '?trackid=1214935&format=mp31', codec: 'mp3' }, { url: '?trackid=1214935&format=ogg', codec: 'ogg' }],
    id: 1214935,
    onLoading: (loadingProgress, maximumValue, currentValue) => {
        console.log('SONG 2 - onLoading (loadingProgress, maximumValue, currentValue): ', loadingProgress, maximumValue, currentValue)
        playerUI.changeLoadingProgress(loadingProgress)
    },
    onPlaying: (playingPercentage, duration, playTime) => {
        //console.log('SONG 2 - onPlaying (playingPercentage, duration, playTime): ', playingPercentage, duration, playTime)
        playerUI.changePlayingProgress(playingPercentage, playTime)
    },
    onSeeking: (seekingPercentage, duration, playTime) => {
        console.log('SONG 2 - onSeeking (seekPercentage, duration, playTime): ', seekingPercentage, duration, playTime)
        playerUI.changePlayingProgress(seekingPercentage, playTime)
    },
    onStarted: (playTimeOffset) => {
        console.log('SONG 2 - onStarted (playTimeOffset): ', playTimeOffset)
        playerUI.setToPlay(secondSound.duration)
    },
    onPaused: (playTime) => {
        console.log('SONG 2 - onPaused (playTime): ', playTime)
        playerUI.setToStop()
    },
    onStopped: (playTime) => {
        console.log('SONG 2 - onStopped (playTime): ', playTime)
        playerUI.setToStop()
    },
    onResumed: (playTime) => {
        console.log('SONG 2 - onResumed (playTime): ', playTime)
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

/*const moreSoundsAttributes = [{
    source: [{ url: '?trackid=1120088&format=ogg', codec: 'ogg' }],
}, {
    source: [{ url: '?trackid=1075892&format=ogg', codec: 'ogg' }],
}, {
    source: [{ url: '?trackid=1083756&format=ogg', codec: 'ogg' }],
}, {
    source: [{ url: '?trackid=1077679&format=ogg', codec: 'ogg' }],
}, {
    source: [{ url: '?trackid=1014955&format=ogg', codec: 'ogg' }],
}];

const moreSounds: ISound[] = []

moreSoundsAttributes.forEach((mySoundAttributes) => {
    const sound = player.addSoundToQueue({ soundAttributes: mySoundAttributes })
    moreSounds.push(sound)
})

console.log('moreSounds: ', moreSounds)*/

// turn the automute feature on/off: if page becomes invisible auto mute, unmute when page becomes visible again
player.setVisibilityAutoMute(true)

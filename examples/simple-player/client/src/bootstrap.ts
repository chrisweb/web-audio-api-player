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
    soundsBaseUrl: 'http://127.0.0.1:35000/music/',
    loadPlayerMode: PlayerCore.PLAYER_MODE_AUDIO,
    addAudioElementsToDom: true,
}
/*const options: ICoreOptions = {
    soundsBaseUrl: 'http://127.0.0.1:35000/music/',
    loadPlayerMode: PlayerCore.PLAYER_MODE_AJAX,
}*/

// create an instance of the player
const player = new PlayerCore(options)

// several functions are available to change options even after the player got initialized
// for example here we turn the visibility watch feature on (if the browser (app) is put in the background, the player will get paused or muted and when it comes back the player will start playing again or be unmuted)  
player.setVisibilityWatch(true)
// we can also change what action gets performed (pausing the song or just muting the player) when the visibility api detects that the player is hidden
player.setVisibilityHiddenAction(PlayerCore.VISIBILITY_HIDDEN_ACTION_PAUSE)

// songs data (fetched from a database or any storage)
const myPlaylist = [
    {
        song_title: 'My World',
        album_name: 'Season One',
        artist_name: 'WE ARE FM',
        web: 'http://www.wearefm.nl/',
        license: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
        ogg: 'My_World_-_WE_ARE_FM.ogg',
        mp3: 'My_World_-_WE_ARE_FM.mp3',
        album_cover: 'Season_One.jpg',
        id: 'song1',
    },
    {
        song_title: 'Departure',
        album_name: 'Departure',
        artist_name: 'Capashen',
        web: 'https://twitter.com/capashen2',
        license: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
        ogg: 'Departure_-_Capashen.ogg',
        mp3: 'Departure_-_Capashen.mp3',
        album_cover: 'Departure.jpg',
        id: 'song2',
    },
    {
        song_title: 'Crown',
        album_name: 'Crown',
        artist_name: 'Kellee Maize',
        web: 'https://www.kelleemaize.com/',
        license: 'https://creativecommons.org/licenses/by-nc-nd/4.0/',
        ogg: 'Crown_-_Kellee_Maize.ogg',
        mp3: 'Crown_-_Kellee_Maize.mp3',
        album_cover: 'Crown.jpg',
        id: 'song3',
    },
]

// create an instance of a basic UI we created for this example
// the player does not come with an UI so you are free to create your own to match your needs and style taste
const playerUI = new PlayerUI(player, myPlaylist)

// create the sound attributes object
// check the main project README for a list of all available attributes
myPlaylist.forEach((song) => {

    const soundAttributes: ISoundAttributes = {
        source: [{ url: song.mp3, codec: 'mp3' }, { url: song.ogg, codec: 'ogg' }],
        id: song.id,
        onLoading: (loadingProgress, maximumValue, currentValue) => {
            console.log(`SONG: ${sound.id} - onLoading (loadingProgress, maximumValue, currentValue): `, loadingProgress, maximumValue, currentValue)
            playerUI.changeLoadingProgress(loadingProgress);
        },
        onPlaying: (playingPercentage, duration, playTime) => {
            //console.log(`SONG: ${sound.id} - onPlaying (playingPercentage, duration, playTime): `, playingPercentage, duration, playTime)
            playerUI.changePlayingProgress(playingPercentage, playTime)
        },
        onSeeking: (seekingPercentage, duration, playTime) => {
            console.log(`SONG: ${sound.id} - onSeeking (seekingPercentage, duration, playTime): `, seekingPercentage, duration, playTime)
            playerUI.changePlayingProgress(seekingPercentage, playTime)
        },
        onStarted: (playTimeOffset) => {
            console.log(`SONG: ${sound.id} - onStarted (playTimeOffset): `, playTimeOffset)
            playerUI.setToPlay(sound.duration)
            playerUI.updateSongInfo(sound.id.toString())
        },
        onPaused: (playTime) => {
            console.log(`SONG: ${sound.id} - onPaused (playTime): `, playTime)
            playerUI.setToStop()
        },
        onStopped: (playTime) => {
            console.log(`SONG: ${sound.id} - onStopped (playTime): `, playTime)
            playerUI.setToStop()
        },
        onResumed: (playTime) => {
            console.log(`SONG: ${sound.id} - onResumed (playTime): `, playTime)
            playerUI.setToPlay()
        },
        onEnded: (willPlayNext) => {
            console.log(`SONG: ${sound.id} - onEnded (willPlayNext): `, willPlayNext)
            if (!willPlayNext) {
                playerUI.setToStop()
            }
        }
    }

    // add the the song (sound) to the player queue
    const soundQueueOptions: ISoundsQueueOptions = {
        soundAttributes: soundAttributes,
        whereInQueue: PlayerCore.WHERE_IN_QUEUE_AT_END
    }

    const sound = player.addSoundToQueue(soundQueueOptions)

    console.log('sound got added to queue: ', sound)

})

playerUI.refresh()
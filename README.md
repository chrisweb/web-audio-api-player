[![npm version](https://img.shields.io/npm/v/web-audio-api-player.svg?style=flat)](https://www.npmjs.com/package/web-audio-api-player)
[![minified size](https://img.shields.io/bundlephobia/min/web-audio-api-player?style=flat)](https://www.npmjs.com/package/web-audio-api-player)
[![GitHub license](https://img.shields.io/github/license/chrisweb/web-audio-api-player?style=flat)](https://github.com/chrisweb/web-audio-api-player/blob/master/LICENSE)

# web audio API player

<p align="center"><img width="202" height="225" src="./assets/web_audio_api_player_logo_small.png" alt="web audio API player logo"></p>

## About this project

🎶 An opensource javascript (typescript) audio player for the browser, built using the Web Audio API with support for HTML5 audio elements

this player can be added to any javascript project and extended in many ways, it is not bound to a specific UI, this player is just a core that can be used to create any kind of player you can imagine and even be used to play sound in video games or for any other sound / song playing needs you may have  

Want to help improve the documentation or contribute to this project by improving and fixing it, then first check out the [TODOs section](#todos-ideas-for-future-improvements) below, maybe there is something in the list you want to help with. Any contribution, even things not listed on the TODO list are of course welcome. To get started check out the section ["contributing" section](#contributing-prs-welcome) below.  

## installation

web audio API player is published to the [npm registry](https://npm.im/web-audio-api-player) so you can install it with either [npm](https://www.npmjs.com/get-npm) or [yarn](https://yarnpkg.com)  

with npm:

`npm i web-audio-api-player`  

or with yarn:

`yarn add web-audio-api-player`  

## examples

the best way to get started is to check out the examples folder, check out the source of [simple player example](examples/simple-player) if you want to see how to build a fully working player with UI elements of a basic audio player

## documentation

### guide to building a simple audio player UI

in this chapter I will try to explain how to set up the most important parts of a player, but I also recommend you have a look at the [simple player example](examples/simple-player) which is an HTML / Javascript client and has an express.js server, to demonstrate how to build an UI, you can explore and run the example locally if you want to know more about how to use this package and see a working example

after having [installed](#installation) the package you need to import it, like so:

```ts
import { PlayerCore, ICoreOptions, ISoundAttributes } from 'web-audio-api-player'
```

what you must import is the **PlayerCore**, the other two **ICoreOptions** and **ISoundAttributes** are optional, I import those two because I write my code using typescript and want the player and sound / song options types

first we define some options for our player core:

```ts
const options: ICoreOptions = {
    soundsBaseUrl: '/assets/songs/',
    loopQueue: true,
}
```

Note: the **soundsBaseUrl** is the first option we set, it will tell the player what the full URL for the songs source is (for example <https://www.example.com/songs/>) or if the player and songs are hosted on the same domain the path is enough, **loopQueue** by default is set to false, I enable it here, this means that at the end of a queue (a playlist) the player won't stop but instead go back to the first song and play that song

Note 2: for a full list of all available player options check out the [player options chapter](#player-options)

next we initialize the player using our options object and get a player instance in return:

```ts
const player = new PlayerCore(options)
```

now we are going to create our first song:

```ts
const firstSongAttributes: ISoundAttributes = {
    source: [
        {
            url: 'mp3/song1.mp3',
            codec: 'mp3',
        },
        {
            url: 'ogg/song2.ogg',
            codec: 'ogg',
            isPreferred: true,
        }
    ],
    id: 1,
}
```

the only two attributes that are mandatory are the source array and the sound id, the source only needs one entry but for demonstration purposes I added two here, the first one is the song encoded as an mp3 and the second source is the same song but this time it has is encoded using the ogg codec, a third source option is **isPreferred**, it tells the player that if the browser has support for both codecs but that it should preferrably use ogg over mp3, the id can be any numeric value, it can be usefull if you have additional song data stored somewhere, for example if you have the related band name info, the songs music genre and so on, for example stored in a database and want to display that data in the UI while the song is being played

Note: for a full list of all available sound attributes check out the [sound attributes chapter](#sound-attributes)

after we have set the attributes for our first song we pass these attributes to the player queue:

```ts
const firstSong = player.addSoundToQueue({ soundAttributes: firstSongAttributes })
```

if you want to you can add callbacks via the songs attributes, these callbacks will get triggered by the player when an internal event happens to let your code adapt the UI based on them, I'm going to use those callbacks with a console.log inside to demonstrate their use as I add a second song to queue:

```ts
const secondSongAttributes: ISoundAttributes = {
    source: [
        {
            url: 'mp3/song2.mp3',
            codec: 'mp3',
        },
        {
            url: 'ogg/song2.ogg',
            codec: 'ogg',
            isPreferred: true,
        }
    ],
    id: 2,
    onLoading: (loadingProgress, maximumValue, currentValue) => {
        console.log('onLoading (loadingProgress, maximumValue, currentValue): ', loadingProgress, maximumValue, currentValue)
    },
    onPlaying: (playingPercentage, duration, playTime) => {
        console.log('onPlaying (playingPercentage, duration, playTime): ', playingPercentage, duration, playTime)
    },
    onStarted: (playTimeOffset) => {
        console.log('onStarted (playTimeOffset): ', playTimeOffset)
    },
    onPaused: (playTime) => {
        console.log('onPaused (playTime): ', playTime)
    },
    onStopped: (playTime) => {
        console.log('onStopped (playTime): ', playTime)
    },
    onResumed: (playTime) => {
        console.log('onResumed (playTime): ', playTime)
    },
    onEnded: (willPlayNext) => {
        console.log('onEnded (willPlayNext): ', willPlayNext)
    },
    onSeeking: (seekingPercentage, duration, playTime) => {
        console.log('onPlaying (seekingPercentage, duration, playTime): ', seekingPercentage, duration, playTime)
    },
}
```

after we have set the attributes for our second song we pass these attributes to the player queue too, which means we now have a queue with two songs:

```ts
const secondSong = player.addSoundToQueue({ soundAttributes: secondSongAttributes })
```

some player options can be changed even after initialization, for example if you want to adjust the volume, you could do this:

```ts
let volume = 90

player.setVolume(volume)
```

or you want to player to be muted when the browser of the user goes into the background then you can still enable the option:

```ts
player.setVisibilityAutoMute(true)
```

or you want the queue to make a loop when the last song in the player queue (your playlist) finishes playing, then you would enable / disable it like this:

```ts
player.setLoopQueue(true)
```

Note: all of these setters have a corresponding getter, so if you want to now what the current value is, for example if you want to know what the current volume is set to:

```ts
const volume = player.getVolume(volume)
```

now it is time to build your player UI, if you want a good example of such an UI check out the [simple player example](examples/simple-player)

first thing we need is an play button (of course you can use any element you want, you just need to attach an onclick to it), in this example we will use an HTML button element:

```html
<button id="playButton" class="button">
    <span id="play-icon">&gt;</span>
</button>
```

and then you listen for the onclick, when the onclick gets triggered you tell the player to start playing (if nothing is defined it will play the first song in the queue by default):

```ts
const playButton = document.getElementById('playButton');
playButton.addEventListener('click', (event) => {
    event.preventDefault();
    player.play()
})
```

here is another example from a react component I use for my blog [chris.lu source on github](https://github.com/chrisweb/chris.lu):

```ts
<button onClick={onClickPlayHandler} className={styles.play}>
    <FontAwesomeIcon icon={faPlay} size="2x" color='white' />
</button>
```

and here is the click handler I have in my react component, which tells the player to play the first song from the queue:

```ts
const onClickPlayHandler = () => {
    player.play()
}
```

One last tip, when you want to change the position of the song, for example when someone uses the range slider of your player UI, then it is best to not stop (or pause) the song and then use play() to resume playing at a certain position, instead the easiest way is just to call the **setPosition** method of the player:

```ts
const onChangePositionHandler = (positionInPercent: number): void => {
    player.setPosition(positionInPercent)
}
```

### player options

Note: if you use typescript, import the **ICoreOptions** interface along with the playerCore, this makes it a lot easier to see what player options are available and what the type of each value is

* volume: [number] (default: 80) the current playback volume
* loopQueue: [boolean] (default: false) after the last sound in the queue has finished to play should the player do a loop and continue to play by playing the first sound or stop playing
* soundsBaseUrl: [string] (default: '') the base url for the location of the sounds
* playingProgressIntervalTime: [number] (default: 200) the interval in milliseconds at which the player should trigger a sounds **onPlaying** callback which will tell you the playing progress in percent, this value is a minimum value because the player uses the [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame) internally, meaning that if the browser is very busy it might take a bit longer than the defined interval time before the progress value is being reported, this helps to prevent that your UI uses resources that are needed more urgently somewhere else
* playNextOnEnded: [boolean] (default: true) when a sound or song finishes playing should the player play the next sound that is in the queue or just stop playing
* stopOnReset: [boolean] (default: true) when the queue gets reset and a sound is currently being played, should the player stop or continue playing that sound
* visibilityAutoMute: [boolean] (default: false) tells the player if a sound is playing and the visibility API triggers a visibility change event, if the currently playing sound should get muted or not, uses the [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) internally
* unlockAudioOnFirstUserInteraction: [boolean] (default: false) this tells the player to attempt to unlock audio as soon as possible, so that you can call the player play() method programmatically at any time, for more about this check out the chapter ["locked audio on mobile"](#locked-audio-on-mobile), if you don't want to the player to handle this part and prefer to do it manually then you can use the [player function](#player-functions) called **manuallyUnlockAudio()**
* persistVolume: [boolean] (default: true) if this value is set to true the player will use the localstorage of the browser and save the value of the volume (localstorage entry key is **WebAudioAPIPlayerVolume**), if the page gets reloaded or the user comes back later the player will check if there is a value in the localstorage and automatically set the player volume to that value
* loadPlayerMode: [typePlayerModes] (default: PLAYER_MODE_AUDIO) this is a constant you can import from player, currently you can chose between two modes, [PLAYER_MODE_AUDIO](#player_mode_audio) which uses the audio element to load sounds via the audio element and [PLAYER_MODE_AJAX](#player_mode_ajax) to load sounds via the web audio API, for more info about the modes read the [modes extended knowledge](#modes-extended-knowledge) chapter
* audioContext: [AudioContext] (default: null) a custom [audiocontext](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext) you inject to replace the default audiocontext of the player
* addAudioElementsToDom: [boolean] (default: false) when audio elements get created, they are by default offscreen (not added to the DOM), if you want the audio elements to be added to the DOM set this option to true
* unLockAudioOnFirstPlay: [boolean] (default: true) will unlock audio on mobile devices on the first call to play(), if this is turned off and you intend to support mobile devices you should enables this or consider the alternative option that is called "unlockAudioOnFirstUserInteraction" and which will attempt to unlock audio on mobile on any first user interaction it catches, you could also add your own custom code to detect mobile devices and only enable this feature on mobile but it can be tricky to create a reliable code that detects all mobile devices with 100% accurancy, this is why this option is enabled by default (the player does not make differentiate between mobile and desktop browsers)

### sound attributes

Note: if you use typescript, import the **ISoundAttributes** interface along with the playerCore, this makes it a lot easier to see what sound attributes are available and what the type of each value is

**sound options:**

* source: [(ISoundSource)[] | ISoundSource] (optional if an AudioBuffer or ArrayBuffer is provided instead else mandatory) a single sound source or an array of sound sources, an **ISoundSource** object consists of 3 values:
  * **url** [string] is the base url defined in the player options + the path defined here or you add the full url here, the URL will get used by the player to load the sound when needed
  * **codec** [string] the codec that got used to encode the sound, this allowed the player to check if that codec is supported by the browser and it also allows the player to decide which source to use if multiple sources have been defined
  * **isPreferred** [boolean] (optional) the player will use the first source that has a codec this is supported by the browser, if more than one codec is supported it will take the source that is marked as **isPreferred**
* id: [number | string] (optional, if none is set the player will generate one) unique id for the sound, can be used as a reference to link sound data which is not part of the sound object itself to an external source, for example if you have sound info stored in a database, set the sound id to the database id and you have a link between the two, it also allows you to call the player.play funtion using the sound id as argument to play that sound
* loop: [boolean] (optional, default false) if the sound playback should loop when it reaches the end of sound
* audioBuffer: [AudioBuffer] (optional) if you want to inject your own custom [AudioBuffer](https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer) to be used instead of the default one the player will create
* arrayBuffer: [ArrayBuffer] (optional) if you want to inject your own custom [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer) to be used instead of the default one the player will create
* duration: [number] (optional) if you know the duration of the sound and want to tell the player about it early, in [PLAYER_MODE_AJAX](#player_mode_ajax) the player will need to wait for the sound to be fully loaded until it can determine the duration

**sound callbacks:**

* onLoading(loadingPercentage, total, loaded): [function] (optional) a callback funtion that will get triggered at intervals during the loading process of a sound, the interval duration can be changed using the [player option "playingProgressIntervalTime"](#player-options), the callback has three parameters, **loadingPercentage** is the percentage that has been loaded so far (number ranging from 0 to 100)
  * if the player mode is [PLAYER_MODE_AUDIO](#player_mode_audio), then **total** is an integer telling you the total song duration in seconds ([MDN HTMLMediaElement duration](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/duration)), **loaded** is an integer that tells you the amount that already got loaded (buffered end) in seconds ([MDN HTMLMediaElement timerange end](https://developer.mozilla.org/en-US/docs/Web/API/TimeRanges/end)), if you prefer to use the raw values I recommend you use the **sound.audioElement.buffered** and read them perciodically yourself
  * if the player mode is [PLAYER_MODE_AJAX](#player_mode_ajax), then **total** is an integer telling you the total bytes that will get loaded ([MDN ProgressEvent total](https://developer.mozilla.org/en-US/docs/Web/API/ProgressEvent/total)), **loaded** is an integer that tells you the amount of bytes that already got loaded ([MDN ProgressEvent loaded](https://developer.mozilla.org/en-US/docs/Web/API/ProgressEvent/loaded))
* onPlaying(playingPercentage, duration, playTime)): [function] (optional) a callback funtion that will get triggered at intervals while the sound is playing, the callback has three parameters, **playingPercentage** is the percentage that has been played so far (number ranging from 0 to 100), **duration** is the total song duration, playTime is the current time in seconds that have been played
* onEnded(willPlayNext): [function] (optional) a callback funtion that will get triggered when the end of the sound is reached, returns one parameter **willPlayNext** which is a boolean, true if there is a next song in the internal queue that will get played or false if no next sound will get played
* onStarted(playTimeOffset): [function] (optional) a callback funtion that will get triggered when the sound playback starts, returned value is the playTimeOffset of the song, usually playTimeOffset is zero unless you explicitly set it to be something else
* onStopped(playTime): [function] (optional) a callback funtion that will get triggered when the sound playback is stopped (the difference between pause and stop is that stop will free the resources needed to play a song), returns one parameter **playTime** which is the current sound position in seconds
* onPaused(playTime): [function] (optional) a callback funtion that will get triggered when the sound playback is being paused (use pause instead of stop if there is a reason to assume that the playback will be resumed at anytime, if this can't be assumed it is recommended to call stop), returns one parameter **playTime** which is the current sound position in seconds
* onResumed(playTime): [function] (optional) a callback funtion that will get triggered when the sound playback gets resumed after if got set to pause, returns one parameter **playTime** which is the current sound position in seconds

### player functions

Note: all player functions a promise, I recommend using a try catch and await the promise or call promise.catch to fetch eventual errors thrown by the player, like so:

```ts
async function foo(): Promise<void> {
    try {
        await player.play()
    } catch (error) {
        console.error(error)
    }
}
foo()
```

or like so:

```ts
function bar(): void {
    player.play().catch((error) => {
        console.error(error)
    })
}
bar()
```

* play() [optional property IPlayOptions] (default {}) **starts playback** of a sound, returns a promise that when resolved returns the current sound

```ts
IPlayOptions {
    whichSound: accepted values: song ID (number or string) OR one of these 4 constants: PlayerCore.PLAY_SOUND_NEXT, PlayerCore.PLAY_SOUND_PREVIOUS, PlayerCore.PLAY_SOUND_FIRST, PlayerCore.PLAY_SOUND_LAST
    playTimeOffset: the time at which you want the sound to start (in seconds), usually the song would start at zero but if you set this it will start at playTimeOffset
}
```

Note: the playTimeOffset (if set) will always get honored, so if you want to resume after a pause don't set the playTimeOffset, if playTimeOffset is set the song will start at the specified position, if no playTimeOffset is set the player will use the songs playTime value, which is 0 for a song that gets played for the first time or a value > 0 for a song that was paused

* pause() **pauses playback**, returns a promise that when resolved returns the current sound
* stop() **stops playback**, returns a promise that when resolved returns the current sound
* next() used to play the **next** sound from the internal queue, returns a promise that when resolved returns the current sound
* previous() used to play the **previous** sound from the internal queue, returns a promise that when resolved returns the current sound
* first() used to play the **first** sound from the internal queue, returns a promise that when resolved returns the current sound
* last() used to play the **last** sound from the internal queue, returns a promise that when resolved returns the current sound
* addSoundToQueue() [ISoundsQueueOptions] (default { soundAttributes, whereInQueue? }) adds a new sound to the queue, it returns a sound (ISound) object
  * addSoundToQueue has a single parameter **soundsQueueOptions** is an object of type ISoundsQueueOptions, it has two properties **soundAttribtes** (object) and **whereInQueue** (string)
  * the soundAttribtes property you probably want to set is **source**, source is either a single ISoundSource object or an array of ISoundSource objects and the second property you may want to set is **id** (string or number), if you set it you will be able to play sounds by id, however if you don't set it the player will create an id
  * an ISoundSource object has two required properties **url** (string) and a **codec** (string), the third property **isPreferred** is optional, it can be used to tell the player which source is preferred (if you set two sources, one with the codec mp3 and another source for that same song but with the codec ogg and both codecs are supported then the player will take the one that is marked as preferred and if none is marked as preferred it will take the first one that has a codec which is supported)
  * the other property **whereInQueue** is optional and tells the player to put the sound at the beginning or the end of the queue, use the constants PlayerCore.WHERE_IN_QUEUE_AT_START or PlayerCore.WHERE_IN_QUEUE_AT_END, if you don't specify a constant the sound will be put at the end of the queue
  * for some sample code check out [building a simple player guide](#guide-to-building-a-simple-audio-player-ui) or for a working example have a look at [simple player example](./examples/simple-player/README.md) source code in the file bootstrap.ts, or use this basic example to get started:

```ts
const mySoundAttributes = {
    source: [{ url: 'https://example.com/mySound.mp3', codec: 'mp3' }],
}

player.addSoundToQueue({ soundAttributes: mySoundAttributes })
```

* resetQueue() (or reset()) removes all sounds from the queue
* getQueue() returns the an array of sounds currently in the queue
* setVolume(volume: number) sets to the volume in percent, so a number ranging from 0 to 100
* getVolume() returns the current volume
* setLoopQueue(loppQueue: boolean) to let the player know it should loop the queue, meaning that after the last song in the queue finished playing it will play the first sound in the queue, set to false to just stop at the last song in queue
* getLoopQueue() get the current boolean value to which **loopQueue** is set
* mute() sets the volume to 0
* unMute() resets the volume to it's previous value
* isMuted() a boolean value, true if the volume is currently muted else false
* setPosition(soundPositionInPercent: number) used to change the position of the song that is currently playing in percent, so a number ranging from 0 to 100, returns a promise
* setPositionInSeconds(soundPositionInSeconds: number): used to change the position of the song that is currently playing in seconds, the number should be smaller than the duration of the song, returns a promise
* setVisibilityAutoMute(visibilityAutoMute: boolean) a boolean value to change the **visibilityAutoMute** option of the player, if true the player will be muted when the visibility API [MDN visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) notices that the browser is in the background, will get unmuted when the visibility API notices that the browser is in the foreground again, if false the volume will not be automatically muted when the visibility changes
* getVisibilityAutoMute() get the current boolean value that is set for the **visibilityAutoMute** option
* disconnect() disconnects the player and destroys all songs in the queue, this function should get called for example in react when a component unmounts, call this function when you don't need the player anymore to free memory
* getAudioContext() get the current audioContext that is being used by the player [MDN audiocontext](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext)
* manuallyUnlockAudio() this method can be used on mobile to unlock audio, because by default audio won't play on mobile if the code that triggers the player play() method is not a user interaction, for example a user pressing a play button works fine, but if you want to play a sound programmatically without any user interaction then the mobile browser will throw a notallowed error, this method can be used to unlock audio on a user interaction, after audio is unlocked you can use the play() method programmatically, an alternative if you don't want to implement this yourself is to enable the [player option](#player-options) called **unlockAudioOnFirstUserInteraction**, for more about this check out the chapter ["locked audio on mobile"](#locked-audio-on-mobile)
* checkIfAudioIsUnlocked() function you can use to check if audio is unlocked on mobile, for example after calling manuallyUnlockAudio()

### locked audio on mobile

On mobile you can NOT play sounds (songs) programmatically until the user has interacted with the website / webapp

If the user clicks on a play button and in your event handler you call the play method of the player then everything is fine as it is a user interaction that triggered the play method

However if you want to play music programmatically on mobile, then the page / app needs to be "user activated", in other words on mobile when a page has finished loading audio is still locked you will not be able to programmatically play a sound (song), the play method will return a **NotAllowedError** error:

> The request is not allowed by the user agent or the platform in the current context, possibly because the user denied permission (No legacy code value and constant name).

This means that autoplay without a prior user interaction will get prevented by the mobile browsers

iOS (iPhone) and android mobile devices will throw an error, in the past iPad tablets would throw an error too, however newer versions are considered a desktop device and do not need throw an error

The process of unlocking audio on a mobile browser is called "Transient activation" and the player can help you achieve this if you don't want to write your own code

* solution 1: there is a [player option](#player-options) called **unlockAudioOnFirstUserInteraction**, set it to true when initializing the player and the player will add user interaction listeners to the html document, on the first user interaction the player will attempt to unlock audio, after audio is unlocked you will be able to call player play() function programmatically and it will not throw an error anywore

* solution 2: there is a [player function](#player-functions) called **manuallyUnlockAudio()** that you can use to attempt to unlock audio on mobile, this function MUST be played inside an event handler for a user interaction like "keydown" (excluding the Escape key and possibly some keys reserved by the browser or OS), "mousedown", "pointerdown" or "pointerup" (but only if the pointerType is "mouse") and "touchend"

After audio got unlocked, you can use the [player function](#player-functions) called **checkIfAudioIsUnlocked()** to check if now audio is unlocked, this is also useful because the browsers have an internal timer that starts running after "Transient activation" happend, so if the website (app) is idle for a while the browser might lock audio again, meaning you need to re-unlock it again, what the exact duration of that timer is depends on the browser and is not something browser vendors make public (in might also be different depending on the version of the browser)

Read more:

* [MDN: Features gated by user activation & Transient activation](https://developer.mozilla.org/en-US/docs/Web/Security/User_activation)
* [WebKit: The User Activation API](https://webkit.org/blog/13862/the-user-activation-api/)
* [MDN: Navigator: userActivation property](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/userActivation)
* [caniuse: Navigator API: userActivation](https://caniuse.com/mdn-api_navigator_useractivation)

### modes extended knowledge

#### differencies clarification

Note: You might have read (like I did) a lot of outdated web audio articles which stated the web audio element lacks a lot of features the web audio API and that hence it is not suited to create complex audio software or for example be used in games where you might want to add effects and filters to sounds. This is not true anymore and especially not true for this library. Yes the audio element if used as a standalone lacks a lot of features. But this library does combine the web audio element with the web audio API, meaning that no matter what mode you chose the sound will be converted to an AudioSourceNode.

If you use this library, the difference is only how the sound (song) gets retrieved:

##### PLAYER_MODE_AJAX

will use an [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) the source will be an [AudioBufferSourceNode](https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode)

##### PLAYER_MODE_AUDIO

will use the HTML [audio element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio), then the player will use [createMediaElementSource](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createMediaElementSource) method of the [AudioContext](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext) internally to create an [MediaElementAudioSourceNode](https://developer.mozilla.org/en-US/docs/Web/API/MediaElementAudioSourceNode)

#### so which PLAYER_MODE should I use

It depends on what you intend to build.

If you build something like a music player, it is probably best to use the PLAYER_MODE_AUDIO as you might to want to start playing the sound (song) as quickly as possible and don't care if it has fully loaded, because in this mode the song will start playing as soon as enough data has been buffered even though the song has not been fully loaded yet (it will get the rest of it from the server in the background while playing). To display the time range(s) that have been loaded you could for example use a [2D canvas element](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D).

If you build something that has a lot (of small sounds) that get (pre-)loaded and maybe cached, but played later at some time after they finished loading, use PLAYER_MODE_AJAX. Its progress is easier to understand, because when the loading progress of the sound has reached 100% you know it can be played. To display the loading progress a simple [HTML progress element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/progress) is enough.

### advanced usage

#### You can create and then inject your own AudioContext

You can inject your own using the **audioContext** [player option](#player-options), if you want to reuse an existing one your app already created

This is especially useful if you want to add your own nodes to the AudioGraph (audio routing graph). For example you may want to add an [AnalyserNode](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode) or a pannerNode, delayNode or any other node that is available in the web audio API.

## read more: W3C sources and MDN documetation

* [W3C Recommendation, 17 June 2021](https://www.w3.org/TR/webaudio/)  
* [Web Audio API: Editor’s Draft, 18 July 2023](https://webaudio.github.io/web-audio-api/)  
* [MDN "Web Audio API" page](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)  
* [MDN "The Embed Audio element" page](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio)
* [MDN webaudio examples repository on github](https://github.com/mdn/webaudio-examples/)
* Support tables for audio features, [caniuse: web audio API / audio element / formats ...](https://caniuse.com/#search=audio)  

## development: build

install the latest nodejs (if you haven't already) [nodejs](https://nodejs.org)  

install or update to the latest git version [git scm downloads](https://git-scm.com/downloads) (During installation at the step "choosing the default editor used by Git", if like me you are using visual studio code you might want to chose the new option "use visual studio code as Git's default editor") (also if like me you are on windows, at the step "adjusting your PATH environment", ensure the second radio button option is selected "git from the line and also from 3rd-party software" to ensure git is added to the windows PATH, which will allow you to use git with any command line tool like windows powershell for example)  

git clone this repository to get a local copy  

`git clone git@github.com:chrisweb/web-audio-api-player.git`

open your favorite command line tool and go to the root directory of this repository  

update npm to latest version  

`npm install npm@latest -g`

install the dependencies  

`npm i`

to build the distributions  

`npm run build`

in development you can use watch to rebuild every time you edit a typescript file  

## development: watch

`npm run watch`

## development: linting

to lint the typescript files  

`npm run lint`

## Changelog

check out the [releases page](https://github.com/chrisweb/web-audio-api-player/releases) on github

## contributing (PRs welcome)

if you wish to contribute to this project, please first open a [ticket in the github issues page of this project](https://github.com/chrisweb/web-audio-api-player/issues) and explain briefly what fix or improvement you want to provide (remember the github ticket number you will need it for the commit message later on), if you want to help but are not sure what would be useful then check out the [todos list](#todos-ideas-for-future-improvements)

go the [github page of this project](https://github.com/chrisweb/web-audio-api-player) and hit the fork button  

follow the instructions in the previous section ["development: build"](#development-build), but instead of cloning this projects repository, clone **your own fork** of the project to get a local copy that you can edit in your IDE (VSCode)  

`git clone https://github.com/YOUR_GITHUB_USER/web-audio-api-player.git`

when you are done coding, commit your local changes (if your commit is related to a ticket start your commit message with the "#TICKER_NUMBER", this will "link" the commit to the ticket)  

`git commit -m "#TICKER_NUMBER commit message"`

now go to the github page of your fork and hit the pull request button  

## TODOs (ideas for future improvements)

things I intend to add some day or if you want to help but are not sure what to do, check out this list and just pick one idea you like or that would you think is most useful

if you are interested in helping out 😊 by working on one of the following TODOs, please start by reading the ["contributing"](#contributing-prs-welcome) chapter above

* add a shuffle songs feature, I thought about adding a PLAY_SHUFFLE(D) option for the play() function but then only the first song would be a random pick, so the player itself needs a shuffle mode which also shuffles the next songs, you need to be able to turn it on / off at any time
* add a loop song (<https://webaudio.github.io/web-audio-api/#looping-AudioBufferSourceNode>) feature (actually maybe this already works today, need to verify this), same for loop playlist (need to verify it works well before I remove this item from the TODOS)
* we have sound events, but would player event be useful, like onVolumeChange?
* use service worker to cache ajax requests when the player mode is ajax (audio buffer) <https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API>
* it would probably be useful to have a duration change callback (onDurationChange) for songs
* add sound option to set the initial gain value of a sound, for now it is always 1 (1 = no change to loudness), (optional method that lets you define a modifier (or coefficient) per song by which the gain will be changed), useful if some songs are louder than others and you want to normalize the volume of all songs in a playlist to be similar
* add a song feature to fade out (current song) / fade in (next song) maybe two new options fadeInDuration and fadeOutDuration would be enough
* instead of having sound properties like "isReadyToPLay, isBuffered, isBuffering" it would be better to use the SOUND_STATE_XXX constants
* add (stereo) panning (maybe add an example of how to do it by injecting an audiocontext that has the panningnode attached already) <https://developer.mozilla.org/en-US/docs/Web/API/StereoPannerNode>
* allow to add an array of sounds to queue all at once
* allow to add sound to queue after a sound by id (not just at beginning or end, as it is as of now)
* for volume (gain) allow values beyond 0 to 1 to amplify wave or invert it?
* add improve UI style of the "simple" example(s) (or any new example) and then add a screenshot of it to the readme to show what can be achieved
* opt in feature to use the browser notification system to alert which song is being played (?)
* preload ArrayBuffers (or the audio buffer instead of array buffer) into indexeddb (first song, next song, current song if loop or previous is triggered ...), let the developer set the amount of preloaded ArrayBuffers, remove from "cache" by least used and by date when "cache" is full, maybe do such work using this browser feature [requestidlecallback](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback) (when available)
* cache songs for offline mode? indexeddb is not very big (filesystem?), check if doable because saving a playlist of songs might exhaust the free space (depending on the playlist size), maybe using service worker?
* some methods return a promise others don't, use promises for all to make it more consistent?
* [abort](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/abort) the loading of the sound if the user clicks play and then pause (or stop / next / previous) before the end of the buffering process
* add new loadPlayerMode similar to XMLHttpRequest but that uses [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) to get the sound / song data from server, fetch as of now is still young, it is not yet possible to get the loading progress (<https://stackoverflow.com/a/69400632/656689>)
* use suspend (audioContext) if for some time no sound was played? (and then resume needed?) ... to free device resources. As suspend returns a promise, does this mean suspending and resuming takes time? if so how much time does it take, based on that information we can decide after how much time it makes sense to suspend the ctx to save device resources, should this be an event of the player so that user can attach a callback to show a dialog like netflix (still wathcing?)
* use web workers, especially for the decoding of the ArrayBuffer into an AudioBuffer, to not block the main thread while decoding?
* add support for more codecs? Note: the player should check which codecs are supported by the browser and compare that list with the ones defined in the sound sources, then the player should use the first codec that is supported and that is marked as "isPreferred", if none is marked as "isPreferred" use the first sources codec that is supported
* write code tests!!! (goal ofc 100% coverage), add [tests coverage badge](https://coveralls.io)
* add saucelabs (or similar) browser testing (and their badge [browser compatibility table badge](https://saucelabs.com/blog/new-open-sauce-ui-and-refreshed-build-status-badges) in readme) to add a test suite for all player features
* use github actions for a CI/CD workflow
* add live demo (via github pages?) for people to see how the player works
* create a react example (vite server?)
* create a vue.js example
* create an example using the (browser) fileReader, something like:

```javascript
var fileInput = document.querySelector('input[type="file"]');
fileInput.addEventListener('change', function(event) {  
  var reader = new FileReader();
  reader.onload = function(event) {
    playerCore._decodeSound(this.result);
  };
  reader.readAsArrayBuffer(this.files[0]);
}, false);
```

## notes about problems I encountered during development

### web audio api typings notes

As of the 25.05.2019 the web audio api typings seem to be included in lib.d.ts, so removing them from package.json:  

```json
  "dependencies": {
    "@types/webaudioapi": "0.0.27"
  },
```

Unfortunately (as of 06/2019) the defined window does not have AudioContext:  

* check out [github ticket](https://github.com/microsoft/TypeScript/issues/31686)  
* the current [dom.d.ts on github](https://github.com/microsoft/TypeScript/blob/master/src/lib/dom.generated.d.ts)  

This is fixed, as of now (20.02.2023) the AudioContext is now defined properly

## License

[MIT](LICENSE)

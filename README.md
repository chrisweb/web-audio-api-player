# web audio API player

## W3C web audio API

Latest published version (as of 01.01.2017)  
W3C Working Draft 08 December 2015  
https://www.w3.org/TR/webaudio/  

W3C Editor's Draft 11 January 2017  
https://webaudio.github.io/web-audio-api/  

Support of audio (web audio API / audio element / formats ...)  
http://caniuse.com/#search=audio  

## build

```
gulp build
```

## usage

TODO write some user guide  

in the meantime check out what's in the examples directory (especially the [simple example](examples/simple-player) to get started)  

## TODOs

 * make the core player options object optinal when initializing a new player
 * abort the loading of the sound if the user clicks play and then pause (or stop / next / previous) before the end of the buffering process (https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/abort)
 * allow cross fading songs "on end" if it's the next song in a playlist
 * create a web component UI (http://www.w3.org/TR/components-intro/)!?
 * currently the "find song in queue" can't retrieve songs by queue index, is this useful anyway?
 * let the user modify the audio graph, for example by adding / removíng nodes like a filter node, a panner node ...
 * implement suspend and resume: ctx.suspend() and resume of the context on pause / stop or if for some time no sound was played? ... to free device resources, as suspend returns a promise, does this mean suspending and resuming takes time? if so how much time does it take, based on that information we can decide when and how often we should resume / suspend
 * use the html audio element for backwards compatibility for IE11 and mobile android devices? (http://caniuse.com/#feat=audio-api / )
 * use the requestAnimation (https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame) frame or the requestidlecallback (https://developers.google.com/web/updates/2015/08/using-requestidlecallback / https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback) instead of setInterval for playing progress callback?
 * use web workers, especially for the decoding of the ArrayBuffer into an AudioBuffer, to not block the main thread while decoding?
 * cache (preload) AudioBuffers in localstorage, let the user set the amount of cached AudioBuffers, remove from cache by least used and by date when cache is full
 * add shuffle mode
 * add a loop song and loop queue mode
 * handle all error cases that are still unhandled
 * add support for more codecs (flac, wav, ogg vorbis, opus, aac): also check the available codecs and defined sources, play the first one that has matches and available codec, let user define order of preferred codecs for playerback
 * add promise fallback for IE11 and Android < 4.4.4?
 * add fallback for onended for IE11 (https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode/onended)
 * publish on npm
 * add npm version badge / license badge / ... (http://shields.io/)
 * add dependencies check badge(s) (https://david-dm.org)
 * add browser compatibility table badge in readme (https://saucelabs.com/blog/new-open-sauce-ui-and-refreshed-build-status-badges)
 * write tests!!! (goal 100% coverage), add tests coverage badge ((https://coveralls.io)
 * add travis build check and badge (https://travis-ci.org)
 * add a contribution guide
 * write some documentation
 * put all the code related to the queue into a seperate library class (out of core)
 * add UI screenshot to readme
 * add demo (github pages)
 * for position and volume, allow to use a percentage or a value

## DONE

* create an XMLHttpRequest library class to fetch the ArrayBuffer
* create an audio library class to create the context and decode the ArrayBuffer
* create a custom error class with message but also a numeric code
* let the user add a sound with an already fetched ArrayBuffer or even with an already decoded AudioBuffer
* create a simple example with a vanilla JS UI
* add a sounds queue manager
* add "play" sound
* add "pause" and "stop"
* add "next" and "previous"
* add set / get volume and mute
* add a loading progress callback
* add a playing progress callback
* add an onEnded callback
* play next song onEnded, add option to enable or disable automatic play next onEnded
* add change position method
* add loop queue option

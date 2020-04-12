[![Dependencies](https://david-dm.org/chrisweb/web-audio-api-player/status.svg)](https://david-dm.org/chrisweb/web-audio-api-player)
[![Dependencies](https://david-dm.org/chrisweb/web-audio-api-player/dev-status.png)](https://david-dm.org/chrisweb/web-audio-api-player)
[![npm version](https://img.shields.io/npm/v/web-audio-api-player.svg?style=flat)](https://www.npmjs.com/package/web-audio-api-player)
[![GitHub license](https://img.shields.io/github/license/chrisweb/web-audio-api-player)](https://github.com/chrisweb/web-audio-api-player/blob/master/LICENSE)

# web audio API player

## installation

web audio API player is published to the [npm registry](https://npm.im/web-audio-api-player) so you can install it with either [npm](https://www.npmjs.com/get-npm) or [yarn](https://yarnpkg.com)  

`npm install web-audio-api-player`  

😔 there is almost no documentation yet (see below), but check out the source code of the [simple player example](examples/simple-player) to get started  

## documentation

This player has two modes, SOUND_MODE_AUDIO which uses the audio element to load sounds via the audio element and SOUND_MODE_FETCH to load sounds via the web audio API. Here are some of the differences between the two:

### the web audio API (SOUND_MODE_FETCH)

* No support for streaming
* Files get loaded using fetch, the loading progress is in percent and it is a single value between 0 and 100 percent loaded
* A song has to be fully fetched before it can be turned into a buffer and hence before the playback can start

For a more complete list of features, check out the w3c [web audio API features list](https://www.w3.org/TR/webaudio/#Features) in their [candidate recommendation document](https://www.w3.org/TR/webaudio/#Features)

### the audio element (SOUND_MODE_AUDIO)

* Support for streaming
* Files get loaded using the audio element, the loading progress is not just a single value, it can be split into multiple parts (time ranges), so for example the start of a song from 0 to 10 percent got loaded, then there is a blank of not yet loaded data and then also the part from 35 to 60 percent has been loaded
* A song can be played as soon as a big enough portion of the sound has been loaded (what "big enough" means, is that the browser calculates how much of the sounds needs to get loaded to be able to start playing it and continue loading (streaming) what is left without having to pause the sound at some time during the play process until the end of the playback)

### features clarification

You might have read (like I did) a lot of outdated web audio articles which stated the web audio element lacks a lot of features the web audio API has and that hence it is not suited to create complex audio software or for example be used in games where you might want to add effects and filters to sounds.

TLDR; This is not true anymore and especially not true for this library. Yes the audio element if used as standalone lacks a lot of features. But this library does combine the web audio element with the web audio API.

If you use this library, the difference is only how the sound (song) gets loaded (see list of differences above). If using fetch the source is a Buffer and if using the audio element well the source is an media element. Everything that happens after is the same. This is why you can change in the player options the SOUND_MODE, to either load the sound using [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) or load / stream it using the [audio element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio). But this influences only how the sound get loaded (fetched), if loaded via audio element, we use the web audio API [createMediaElementSource method](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createMediaElementSource) of the audiocontext to pass it to the audiocontext of the web audio API. After feeding the web audio API with the input from the web audio element, the playback and what you do with it is being handled by the web audio API.

### so which SOUND_MODE should I use

It depends on what you intend to build.

If build a game where you have a lot (of small sounds) that get (pre-)loaded and maybe cached but played later at some time after they finished loading, use SOUND_MODE_FETCH. It's progress is easier to understand, because when the loading progress of the sound has reached 100% you know it can be played. To display the loading progress a simple [HTML progress element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/progress) is enough.

If you build a music player, use the SOUND_MODE_AUDIO as you might to want to start playing the sound (song) as quickly as possible and don't care if it has fully loaded yet as long as the part that has been loaded is enough to play the song until the end (while the rest of it is being streamed from the server in the background). To display the time range(s) that have been loaded you could for example uses a [2D canvas element](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D).

### advanced usage

#### You can create and then inject your own AudioContext

You can inject your own, if you want to resuse an existing one your app already created:
...

You can also take the one created by the library and alter it the way you want:
...

#### You can create and then inject your own AudioGraph (audio routing graph)

This is especially useful if you want to add your own nodes to the AudioGraph (audio routing graph). For example you may want to add an [AnalyserNode](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode) or a pannerNode, delayNode or any other node that is available in the web audio API.

## W3C web audio API

[W3C Candidate Recommendation, 18 September 2018](https://www.w3.org/TR/webaudio/)  

[Editor’s Draft, 8 August 2019](https://webaudio.github.io/web-audio-api/)  

[MDN Web Audio API section](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)  

Support tables for audio features, [caniuse: web audio API / audio element / formats ...](https://caniuse.com/#search=audio)  

## development: build

install the latest nodejs (if you haven't already) [nodejs](https://nodejs.org)  

install or update to the latest git version [git scm downloads](https://git-scm.com/downloads) (During installation at the step "choosing the default editor used by Git", if like me you are using visual studio code you might want to chose the new option "use visual studio code as Git's default editor") (also if like me you are on windows, at the step "adjusting your PATH environment", ensure the second radio button option is selected "git from the line and also from 3rd-party software" to ensure git is added to the windows PATH, which will allow you to use git with any command line tool like windows powershell for example)  

git clone this repository if you haven't already

open your favorite command line tool and go to the root directory of this repository

update npm to latest version  

`npm install npm@latest -g`

install the dependencies

`npm i`

to build the distributions  

* es6 module = /dist/index.js  
* UMD version = /dist/index.umd.js  

`npm run build`

in devlopment you can use watch to rebuild every time you edit a typescript file  

## development: watch

`npm run watch`

## development: linting

to lint the typescript files  

`npm run lint`

## publish package on npmjs.com

login to npmjs.com  

`npm login`

before hitting running the command ensure the version of your package in the package.json has been updated  

publish a new version on npmjs  

`npm publish`

## examples

the best way to get started is to check out the examples folder, start with [simple player example](examples/simple-player)

## notes about problems I encountered during development

### web audio api typings notes

As of now (25.05.2019) the web audio api typings seems to be included in lib.d.ts, so removing them from package.json:  

```json
  "dependencies": {
    "@types/webaudioapi": "0.0.27"
  },
```

Unfortunatly the defined window does not have AudioContext:  
check out [[open] github ticket (as of 06/2019)](https://github.com/microsoft/TypeScript/issues/31686)  
the current [dom.d.ts on github](https://github.com/microsoft/TypeScript/blob/master/src/lib/dom.generated.d.ts)  

## TODOs (help wanted 😊)

* create a react example
* create a vue.js example
* create an example using the fileReader

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

* completly rewrite the sources system, where you can define multiple variants of a sound but with different codecs, app needs to check which codecs are supported by the device and choose one, use should be able to define which codec is preferred if playback support for multiple codecs is available
* implement audiocontext to close to release memory?
* feature to use the browser notification system to alert which song is being played
* instead of the ArrayBuffer use the MediaElementAudioSourceNode, make it optional to still use the ArrayBuffer
* preload AudioBuffers in indexeddb (first song, next song, current song if loop or previous is triggered ...), let the developer set the amount of pre-loaded AudioBuffers, remove from "cache" by least used and by date when "cache" is full
* cache songs for offline mode? indexdb is not very big (filesystem?), check if doable because saving a playlist of songs might exhaust the free space
* some methods return a promise others don't, use promises for all to make it more consistent?
* write a documentation
* make a list of all possible errors (set a distinct code for each error)
* add a contribution guide
* write tests!!! (goal 100% coverage), add [tests coverage badge](https://coveralls.io)
* [abort](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/abort) the loading of the sound if the user clicks play and then pause (or stop / next / previous) before the end of the buffering process
* replace XMLHttpRequest with fetch?
* allow cross fading songs "on end" if it's the next song in a playlist (or just fade out / fade in)
* currently the "find song in queue" can't retrieve songs by queue index, is this useful anyway?
* use suspend and resume if for some time no sound was played? ... to free device resources. As suspend returns a promise, does this mean suspending and resuming takes time? if so how much time does it take, based on that information we can decide after how much time it makes sense to suspend the ctx to save device resources
* use the [requestAnimation](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame) frame or the [requestidlecallback](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback) instead of setInterval for playing progress callback?
* use web workers, especially for the decoding of the ArrayBuffer into an AudioBuffer, to not block the main thread while decoding?
* add shuffle mode
* add a loop song and loop queue mode (<https://webaudio.github.io/web-audio-api/#looping-AudioBufferSourceNode>)
* handle all error cases that are still unhandled
* add support for more codecs (flac, wav, ogg vorbis, opus, aac): also check the available codecs and defined sources, play the first one that has matches and available codec, let user define order of preferred codecs for playerback
* add saucelabs browser testing and their badge [browser compatibility table badge](https://saucelabs.com/blog/new-open-sauce-ui-and-refreshed-build-status-badges) in readme
* add [travis](https://travis-ci.org) continous integration and badge
* add improve UI style and then add a screenshot to readme of example
* add live demo (via github pages)
* for position and volume, allow to use a percentage or a value
* add hooks to the sound object for all the native source node events [AudioBufferSourceNode](https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode)
* add (stereo) panning

## DONE

* use gulp [gulp](https://gulpjs.com/) and some gulp plugins to create a clean build
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
* make the core player options object optinal when initializing a new player
* let the user modify the audio graph, for example by adding / removíng nodes like a filter node, a panner node ...
* replace [gulp](https://gulpjs.com/) with [rollup](https://github.com/rollup/rollup) as new module bundler
* use [pkg.module](https://github.com/rollup/rollup/wiki/pkg.module) to distribute a UMD as well as an "ES6 modules" version
* rewrite the simple example with vanilla js instead of jquery
* put the web audio API player on npm and add npm version badge / license badge / ... [shields.io](http://shields.io/)
* implement suspend and resume: ctx.suspend() and resume
* add an option that uses the visibility API to automatically mute and unmute a sound when the visibility changes
* rewrite how the audiocontext is created, for browser that enforce that a user interaction has taken place before a context can be running
* add option to persist the user volume choice using the localstorage
* switch from tslint to eslint with typescript-eslint plugin / parser: TSlint will be deprecated [github ticket](https://github.com/palantir/tslint/issues/4534), read their [blog post](https://medium.com/palantir/tslint-in-2019-1a144c2317a9) and then switch to [ESLint](https://github.com/eslint/eslint)

## License

[MIT](LICENSE)

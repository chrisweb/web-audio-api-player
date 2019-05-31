[![Dependencies](https://david-dm.org/chrisweb/web-audio-api-player/status.svg)](https://david-dm.org/chrisweb/web-audio-api-player)
[![Dependencies](https://david-dm.org/chrisweb/web-audio-api-player/dev-status.png)](https://david-dm.org/chrisweb/web-audio-api-player)
[![GitHub release](https://img.shields.io/github/release/chrisweb/web-audio-api-player.svg)](https://github.com/chrisweb/web-audio-api-player/releases)

# web audio API player

## W3C web audio API

[W3C Candidate Recommendation, 18 September 2018](https://www.w3.org/TR/webaudio/)  

[Editor’s Draft, 28 February 2019](https://webaudio.github.io/web-audio-api/)  

Support tables for audio features, [caniuse: web audio API / audio element / formats ...](https://caniuse.com/#search=audio)  

## build

install the latest nodejs (if you haven't already) [nodejs](https://nodejs.org)  
update npm to latest version

`npm install npm@latest -g`

install the dependencies

`npm install`

to build the distributions (es6 module (esm.js) and the UMD version)

`npm run build`

in devlopment you can use watch to rebuild every time you edit a typescript file

## development (watch)

`npm run watch`

## linting

to lint the typescript files

`npm run lint`

## usage

the best way to get started is to check out the examples folder, start with [simple example](examples/simple-player)  

## notes about problems I encountered during development

### web audio api typings notes

As of now (25.05.2019) the web audio api typings seems to be included in lib.d.ts, so removing them from package.json:

```
  "dependencies": {
    "@types/webaudioapi": "0.0.27"
  },
```

### linting setup notes

	> we plan to deprecate TSLint and focus our efforts instead on improving ESLint’s TypeScript support  
    
Their [blog post](https://medium.com/palantir/tslint-in-2019-1a144c2317a9) announcing that [TSLint](https://github.com/palantir/tslint) will be deprecated in 2019 and you should switch to [ESLint](https://github.com/eslint/eslint) when TSLint is officially deprecated  

TSlint will be deprecated [github ticket](https://github.com/palantir/tslint/issues/4534)

## TODOs (help wanted 😊)

* create a react example
* create a vue.js example
* create a jquery ajax example
* create a custom ajax example
* create systemjs module loader example
* create use as standalone js package
* make player with vanilla js
* put the web audio API player on npm
* make people aware of the examples folder
* write some documentation
* [abort](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/abort) the loading of the sound if the user clicks play and then pause (or stop / next / previous) before the end of the buffering process 
* allow cross fading songs "on end" if it's the next song in a playlist
* create a [web component](http://www.w3.org/TR/components-intro/) UI!?
* currently the "find song in queue" can't retrieve songs by queue index, is this useful anyway?
* implement suspend and resume: ctx.suspend() and resume of the context on pause / stop or if for some time no sound was played? ... to free device resources, as suspend returns a promise, does this mean suspending and resuming takes time? if so how much time does it take, based on that information we can decide when and how often we should resume / suspend
* use the html audio element for backwards compatibility for IE11 and mobile android devices? [caniuse audio-api](http://caniuse.com/#feat=audio-api)
* use the [requestAnimation](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame) frame or the [requestidlecallback](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback) instead of setInterval for playing progress callback?
* use web workers, especially for the decoding of the ArrayBuffer into an AudioBuffer, to not block the main thread while decoding?
* cache (preload) AudioBuffers in localstorage, let the user set the amount of cached AudioBuffers, remove from cache by least used and by date when cache is full
* add shuffle mode
* add a loop song and loop queue mode
* handle all error cases that are still unhandled
* add support for more codecs (flac, wav, ogg vorbis, opus, aac): also check the available codecs and defined sources, play the first one that has matches and available codec, let user define order of preferred codecs for playerback
* add promise fallback for IE11 and Android < 4.4.4?
* add fallback for onended for IE11 (https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode/onended)
* publish on npm
* add npm version badge / license badge / ... [shields.io](http://shields.io/)
* add dependencies check badge(s) [david-dm.org](https://david-dm.org)
* add [browser compatibility table badge](https://saucelabs.com/blog/new-open-sauce-ui-and-refreshed-build-status-badges) in readme 
* write tests!!! (goal 100% coverage), add [tests coverage badge](https://coveralls.io)
* add [travis](https://travis-ci.org) build check and badge 
* add a contribution guide
* write some documentation
* put all the code related to the queue into a seperate library class (out of core)
* add UI screenshot to readme
* add demo (github pages)
* for position and volume, allow to use a percentage or a value
* add hooks to the sound object for all the native source node events [AudioBufferSourceNode](https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode)

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

## License

MIT

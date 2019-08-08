[![Dependencies](https://david-dm.org/chrisweb/web-audio-api-player/status.svg)](https://david-dm.org/chrisweb/web-audio-api-player)
[![Dependencies](https://david-dm.org/chrisweb/web-audio-api-player/dev-status.png)](https://david-dm.org/chrisweb/web-audio-api-player)
[![npm version](https://img.shields.io/npm/v/web-audio-api-player.svg?style=flat)](https://www.npmjs.com/package/web-audio-api-player)
[![GitHub license](https://img.shields.io/github/license/chrisweb/web-audio-api-player)](https://github.com/chrisweb/web-audio-api-player/blob/master/LICENSE)

# web audio API player

## installation

web audio API player is published to the [npm registry](https://npm.im/web-audio-api-player) so you can install it with either [npm](https://www.npmjs.com/get-npm) or [yarn](https://yarnpkg.com)  

`npm install web-audio-api-player`  

😔 there is no documentation yet, but check out the source code of the [simple player example](examples/simple-player)  

## W3C web audio API

[W3C Candidate Recommendation, 18 September 2018](https://www.w3.org/TR/webaudio/)  

[Editor’s Draft, 28 February 2019](https://webaudio.github.io/web-audio-api/)  

Support tables for audio features, [caniuse: web audio API / audio element / formats ...](https://caniuse.com/#search=audio)  

## development: build

install the latest nodejs (if you haven't already) [nodejs](https://nodejs.org)  
update npm to latest version

`npm install npm@latest -g`

install the dependencies

`npm install`

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

### linting setup notes

TSlint will be deprecated [github ticket](https://github.com/palantir/tslint/issues/4534)  

> we plan to deprecate TSLint and focus our efforts instead on improving ESLint’s TypeScript support  

Their [blog post](https://medium.com/palantir/tslint-in-2019-1a144c2317a9) announcing that [TSLint](https://github.com/palantir/tslint) will be deprecated in 2019 and you should switch to [ESLint](https://github.com/eslint/eslint) when TSLint is officially deprecated  

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

* instead of the ArrayBuffer use the MediaElementAudioSourceNode, make it optional to still use the ArrayBuffer
* cache (preload) AudioBuffers in indexeddb, let the user set the amount of cached AudioBuffers, remove from cache by least used and by date when cache is full
* cache songs for offline mode? indexdb is not very big, check if doable because saving a playlist of songs might exhaust the free space
* write a documentation
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
* add a loop song and loop queue mode
* handle all error cases that are still unhandled
* add support for more codecs (flac, wav, ogg vorbis, opus, aac): also check the available codecs and defined sources, play the first one that has matches and available codec, let user define order of preferred codecs for playerback
* add saucelabs browser testing and their badge [browser compatibility table badge](https://saucelabs.com/blog/new-open-sauce-ui-and-refreshed-build-status-badges) in readme
* add [travis](https://travis-ci.org) continous integration and badge
* add improve UI style and then add a screenshot to readme of example
* add live demo (via github pages)
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
* rewrite the simple example with vanilla js instead of jquery
* put the web audio API player on npm and add npm version badge / license badge / ... [shields.io](http://shields.io/)
* implement suspend and resume: ctx.suspend() and resume
* add an option that uses the visibility API to automatically mute and unmute a sound when the visibility changes
* rewrite how the audiocontext is created, for browser that enforce that a user interaction has taken place before a context can be running
* add option to persist the user volume choice using the localstorage

## License

[MIT](LICENSE)

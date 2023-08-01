[![npm version](https://img.shields.io/npm/v/web-audio-api-player.svg?style=flat)](https://www.npmjs.com/package/web-audio-api-player)
[![minified size](https://img.shields.io/bundlephobia/min/web-audio-api-player?style=flat)](https://www.npmjs.com/package/web-audio-api-player)
[![GitHub license](https://img.shields.io/github/license/chrisweb/web-audio-api-player?style=flat)](https://github.com/chrisweb/web-audio-api-player/blob/master/LICENSE)

# web audio API player

<p align="center"><img width="202" height="225" src="./assets/web_audio_api_player_logo_small.png" alt="web audio API player logo"></p>

## About this project

🎶 An opensource javascript (typescript) audio player for the browser, built using the Web Audio API with support for HTML5 audio elements

this player can be added to any javascript project and extended in many ways, it is not bound to a specific UI, this player is just a core that can be used to create any kind of player you can imagine and even be used to play sound in video games or for any other sound / song playing needs you may have  

TODO: add screenshot here showing the "simple example" UI, explain that this is just an example of an UI, you can bind your own custom UI to this player and use all or just some of its features

😔 there is almost no documentation yet (there is some, see next section below), to learn how to use this library I recommend you check out the source code of the [simple player example](examples/simple-player) to get started  

Want to help improve the documentation or contribute to this project by improving and fixing it, then first check out the [TODOs section](#todos-help--prs-appreciated) below, maybe there is something in the list you want to help with. Any contribution, even things not listed on the TODO list are of course welcome. To get started check out the section ["contributing" section](#contributing-prs-welcome) below.  

## installation

web audio API player is published to the [npm registry](https://npm.im/web-audio-api-player) so you can install it with either [npm](https://www.npmjs.com/get-npm) or [yarn](https://yarnpkg.com)  

with npm:

`npm i web-audio-api-player`  

or with yarn:

`yarn add web-audio-api-player`  

## examples

the best way to get started is to check out the examples folder, start with [simple player example](examples/simple-player)

## documentation

This player has two modes, [PLAYER_MODE_AUDIO](#the-audio-element-player_mode_audio) which uses the audio element to load sounds via the audio element and [PLAYER_MODE_AJAX](#the-web-audio-api-player_mode_ajax) to load sounds via the web audio API. Here are some of the differences between the two:

### the web audio API (PLAYER_MODE_AJAX)

* No support for streaming
* Files get loaded using fetch, the loading progress is in percent and it is a single value between 0 and 100 percent loaded
* A song has to be fully fetched before it can be turned into a buffer and hence before the playback can start

For a more complete list of features, check out the w3c [web audio API features list](https://www.w3.org/TR/webaudio/#Features) in their [candidate recommendation document](https://www.w3.org/TR/webaudio/#Features)

### the audio element (PLAYER_MODE_AUDIO)

* Support for streaming
* Files get loaded using the audio element, the loading progress is not just a single value, it can be split into multiple parts (time ranges), so for example the start of a song from 0 to 10 percent got loaded, then there is a blank of not yet loaded data and then also the part from 35 to 60 percent has been loaded
* A song can be played as soon as a big enough portion of the sound has been loaded (what "big enough" means, is that the browser calculates how much of the sounds needs to get loaded to be able to start playing it and continue loading (streaming) what is left without having to pause the sound at some time during the play process until the end of the playback)

### features clarification

You might have read (like I did) a lot of outdated web audio articles which stated the web audio element lacks a lot of features the web audio API has and that hence it is not suited to create complex audio software or for example be used in games where you might want to add effects and filters to sounds.

TLDR; This is not true anymore and especially not true for this library. Yes the audio element if used as a standalone lacks a lot of features. But this library does combine the web audio element with the web audio API.

If you use this library, the difference is only how the sound (song) gets loaded (see list of differences above). If using fetch the source is a Buffer and if using the "HTML audio element" well the source is a media element. Everything that happens after is the same. This is why you can change in the player options the PLAYER_MODE, to either load the sound using [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) or load / stream it using the [audio element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio). But this influences only how the sound get loaded (fetched), if loaded via audio element, we use the web audio API [createMediaElementSource method](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createMediaElementSource) of the audiocontext to pass it to the audiocontext of the web audio API. After feeding the web audio API with the input from the web audio element, the playback and what you do with it is being handled by the web audio API.

### so which PLAYER_MODE should I use

It depends on what you intend to build.

If you build a game where you have a lot (of small sounds) that get (pre-)loaded and maybe cached but played later at some time after they finished loading, use PLAYER_MODE_AJAX. Its progress is easier to understand, because when the loading progress of the sound has reached 100% you know it can be played. To display the loading progress a simple [HTML progress element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/progress) is enough.

If you build a music player, use the PLAYER_MODE_AUDIO as you might to want to start playing the sound (song) as quickly as possible and don't care if it has fully loaded yet as long as the part that has been loaded is enough to play the song until the end (while the rest of it is being streamed from the server in the background). To display the time range(s) that have been loaded you could for example use a [2D canvas element](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D).

### advanced usage

#### You can create and then inject your own AudioContext

You can inject your own, if you want to reuse an existing one your app already created:

TODO: add example

You can also take the one created by the library and alter it the way you want:

TODO: add example

#### You can create and then inject your own AudioGraph (audio routing graph)

This is especially useful if you want to add your own nodes to the AudioGraph (audio routing graph). For example you may want to add an [AnalyserNode](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode) or a pannerNode, delayNode or any other node that is available in the web audio API.

## read more: W3C sources and MDN documetation

* [W3C Recommendation, 17 June 2021](https://www.w3.org/TR/webaudio/)  
* [Web Audio API: Editor’s Draft, 18 July 2023](https://webaudio.github.io/web-audio-api/)  
* [MDN "Web Audio API" page](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)  
* [MDN "The Embed Audio element" page](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio)
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

## contributing (PRs welcome)

if you wish to contribute to this project, please first open a [ticket in the github issues page of this project](https://github.com/chrisweb/web-audio-api-player/issues) and explain briefly what fix or improvement you want to provide (remember the github ticket number you will need it for the commit message later on)

go the [github page of this project](https://github.com/chrisweb/web-audio-api-player) and hit the fork button  

follow the instructions in the previous section ["development: build"](#development-build), but instead of cloning this projects repository, clone **your own fork** of the project to get a local copy that you can edit in your IDE (VSCode)  

`git clone https://github.com/YOUR_GITHUB_USER/web-audio-api-player.git`

when you are done coding, commit your local changes (if your commit is related to a ticket start your commit message with the "#TICKER_NUMBER", this will "link" the commit to the ticket)  

`git commit -m "#TICKER_NUMBER commit message"`

now go to the github page of your fork and hit the pull request button  

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

## Changelog

check out the [releases page](https://github.com/chrisweb/web-audio-api-player/releases) on github

## TODOs (help / PRs appreciated)

If you are interested in helping out 😊 by working on one of the following TODOs, please start by reading the ["contributing"](#contributing-prs-welcome) chapter above

* create a react example
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

* add improve UI style of the "simple" example(s) (or any new example) and then add a screenshot of it to the readme to show what can be achieved
* completely rewrite the sources system, where you can define multiple variants of a sound but with different codecs, app needs to check which codecs are supported by the device and choose one, use should be able to define which codec is preferred if playback support for multiple codecs is available
* destroy the audiocontext at some point, to release memory?
* feature to use the browser notification system to alert which song is being played
* preload AudioBuffers into indexeddb (first song, next song, current song if loop or previous is triggered ...), let the developer set the amount of preloaded AudioBuffers, remove from "cache" by least used and by date when "cache" is full, maybe do such work using this browser feature [requestidlecallback](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback) (when available)
* cache songs for offline mode? indexeddb is not very big (filesystem?), check if doable because saving a playlist of songs might exhaust the free space (depending on the playlist size)
* some methods return a promise others don't, use promises for all to make it more consistent
* write more documentation
* make a list of all possible errors (set a distinct code for each error), handle all error cases that are still unhandled
* [abort](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/abort) the loading of the sound if the user clicks play and then pause (or stop / next / previous) before the end of the buffering process
* replace XMLHttpRequest with fetch?
* add feature to crossfade two songs "on end" (if there is a the next song in a playlist) or just fade out (current song) / fade in (next song)
* currently the "find song in queue" can't retrieve songs by queue index, is this useful anyway?
* use suspend and resume if for some time no sound was played? ... to free device resources. As suspend returns a promise, does this mean suspending and resuming takes time? if so how much time does it take, based on that information we can decide after how much time it makes sense to suspend the ctx to save device resources
* use web workers, especially for the decoding of the ArrayBuffer into an AudioBuffer, to not block the main thread while decoding?
* add a shuffle songs mode
* add a loop song (<https://webaudio.github.io/web-audio-api/#looping-AudioBufferSourceNode>) feature (actually maybe this already works today, need to verify)
* add support for more codecs (flac, wav, ogg vorbis, opus, aac): also check the available codecs and defined sources, play the first one that has matches and available codec, let user define order of preferred codecs for playback
* write code tests!!! (goal ofc 100% coverage), add [tests coverage badge](https://coveralls.io)
* add saucelabs (or similar) browser testing (and their badge [browser compatibility table badge](https://saucelabs.com/blog/new-open-sauce-ui-and-refreshed-build-status-badges) in readme) to add a test suite for all player features
* add [travis](https://travis-ci.org) continuous integration and badge
* add live demo (via github pages?) for people to see how the player works
* for position and volume, allow to use a percentage or a value
* feature that let's the dev set a volume (via a modifier value / coefficient) per song, useful if some songs are louder than others and you want to normalize the volume of all songs in a playlist to be similar
* add hooks to the sound object for all the native source node events [AudioBufferSourceNode](https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode)
* add (stereo) panning

## note to self: publish package on npmjs.com

login to npmjs.com  

`npm login`

to make a publishing test (without actually publishing) use:

`npm publish --dry-run`

!!! before using the next the command ensure the version of your package in the package.json has been updated  

publish a new version on npmjs  

`npm publish`

## License

[MIT](LICENSE)

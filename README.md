# web audio API player

## W3C web audio API

Latest published version (as of 01.01.2017)  
W3C Working Draft 08 December 2015  
https://www.w3.org/TR/webaudio/  

W3C Editor's Draft 11 January 2017  
https://webaudio.github.io/web-audio-api/  

## build

```
gulp build
```

## usage

TODO write some user guide  

in the meantime check out what's in the examples directory (especially the simple example to get started)  

## TODOs

 * abort the loading of the sound if the user clicks play and then pause (or stop / next / previous) before the end of the buffering process
 * allow cross fading songs "on end" if it's the next song in a playlist
 * create a web component UI (http://www.w3.org/TR/components-intro/)!?
 * currently the "find song in queue" can't retrieve songs by queue index, is this useful anyway?
 * let the user modify the audio graph, for example by adding / removíng nodes like a filter node, a panner node ...
 * implement suspend and resume: ctx.suspend() and resume of the context on pause / stop or if for some time no sound was played? ... to free device resources, as suspend returns a promise, does this mean suspending and resuming takes time? if so how much time does it take, based on that information we can decide when and how often we should resume / suspend
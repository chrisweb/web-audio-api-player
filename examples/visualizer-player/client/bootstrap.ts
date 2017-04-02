
'use strict';

// vendor (node_modules)
import * as $ from 'jquery';

// player build
import { PlayerCore, ICoreOptions, PlayerSound, ISoundAttributes } from 'web-audio-api-player';

// library
import { PlayerUI } from './library/player/ui';

/*function transformToVisualBins(array: []) {
    
    let i;
    let spectrumSize = 63; // number of bars in the spectrum
    let spectrumScale = 2.5; // the logarithmic scale to adjust spectrum values to
    let spectrumStart = 4; // the first bin rendered in the spectrum
    let spectrumEnd = 1200; // the last bin rendered in the spectrum
    let newArray = new Uint8Array(spectrumSize);

    for (i = 0; i < spectrumSize; i++) {

        let bin = Math.pow(i / spectrumSize, spectrumScale) * (spectrumEnd - spectrumStart) + spectrumStart;
        let flooredBin = Math.floor(bin);
        let a: number = flooredBin + spectrumStart;

        newArray[i] = array[a] * (bin % 1) + array[Math.floor(bin + 1) + spectrumStart] * (1 - (bin % 1));

    }

    return newArray;

}*/

function transformToVisualBins(Array: any) {
    Array = AverageTransform(Array);
    Array = tailTransform(Array);
    Array = exponentialTransform(Array);

    return Array;
}


// canvas
let canvas = document.getElementById('visualizer') as HTMLCanvasElement;
let ctx = canvas.getContext('2d');

var SpectrumBarCount = 63;
var Bar1080pWidth = 15;
var Bar1080pSeperation = 7;

var barWidth = 750 / 63;
var spectrumDimensionScalar = 4.5;
var headMargin = 7;
var tailMargin = 0;
var minMarginWeight = 0.7;
var marginDecay = 1.6;
var spectrumMaxExponent = 5;
var spectrumMinExponent = 3;
var spectrumExponentScale = 2;
var SideWeight = 2;
var CenterWeight = 2;

var SpectrumStart = 4;
var SpectrumEnd = 1200;
var SpectrumLogScale = 2.5;

var resRatio = (canvas.width / canvas.height)
var spectrumWidth = 1568 * resRatio;
var spectrumSpacing = 7 * resRatio;
spectrumWidth = (Bar1080pWidth + Bar1080pSeperation) * SpectrumBarCount - Bar1080pSeperation;
var headMarginSlope = (1 - minMarginWeight) / Math.pow(headMargin, marginDecay);

var spectrumHeight = 255;
var tailMarginSlope: number = 0;

function AverageTransform(Array: any) {
    var Values = []
    var Length = Array.length


    for (var i = 0; i < Length; i++) {
        var Value = 0
        if (i == 0) {
            Value = Array[i];
        } else if (i == Length - 1) {
            Value = (Array[i - 1] + Array[i]) / 2
        } else {
            var PrevValue = Array[i - 1]
            var CurValue = Array[i]
            var NextValue = Array[i + 1]

            Value = (CurValue + (NextValue + PrevValue) / 2) / 2
        }
        Value = Math.min(Value + 1, spectrumHeight)

        Values[i] = Value;
    }

    return Values
}

function tailTransform(array: any) {
    var values = [];
    for (var i = 0; i < SpectrumBarCount; i++) {
        var value = array[i];
        if (i < headMargin) {
            value *= headMarginSlope * Math.pow(i + 1, marginDecay) + minMarginWeight;
        } else if (SpectrumBarCount - i <= tailMargin) {
            value *= tailMarginSlope * Math.pow(SpectrumBarCount - i, marginDecay) + minMarginWeight;
        }
        values[i] = value;
    }
    return values;
}

function exponentialTransform(array: any) {
    var newArr = [];
    for (var i = 0; i < array.length; i++) {
        var exp = spectrumMaxExponent + (spectrumMinExponent - spectrumMaxExponent) * (i / array.length)
        newArr[i] = Math.max(Math.pow(array[i] / spectrumHeight, exp) * spectrumHeight, 1);
    }
    return newArr;
}

$(function () {

    let options: ICoreOptions = {
        soundsBaseUrl: 'https://mp3l.jamendo.com/?trackid=',
        playingProgressIntervalTime: 500
    };

    let player = new PlayerCore(options);
    let visualizerAudioGraph: any = {};

    player.getAudioContext().then((audioContext) => {

        let bufferInterval = 1024;
        let numberOfInputChannels = 1;
        let numberOfOutputChannels = 1;

        // create the audio graph
        visualizerAudioGraph.gainNode = audioContext.createGain();
        visualizerAudioGraph.delayNode = audioContext.createDelay(1);
        visualizerAudioGraph.scriptProcessorNode = audioContext.createScriptProcessor(bufferInterval, numberOfInputChannels, numberOfOutputChannels);
        visualizerAudioGraph.analyserNode = audioContext.createAnalyser();

        // analyser options
        visualizerAudioGraph.analyserNode.smoothingTimeConstant = 0.2;
        visualizerAudioGraph.analyserNode.minDecibels = -100;
        visualizerAudioGraph.analyserNode.maxDecibels = -33;
        visualizerAudioGraph.analyserNode.fftSize = 16384;

        // connect the nodes
        visualizerAudioGraph.delayNode.connect(audioContext.destination);
        visualizerAudioGraph.scriptProcessorNode.connect(audioContext.destination);
        visualizerAudioGraph.analyserNode.connect(visualizerAudioGraph.scriptProcessorNode);
        visualizerAudioGraph.gainNode.connect(visualizerAudioGraph.delayNode);

        player.setAudioGraph(visualizerAudioGraph);

    });

    let isPlaying = false;

    // canvas painting loop
    function looper() {

        if (!isPlaying) {
            return;
        } 

        window.webkitRequestAnimationFrame(looper);

        // visualizer
        var initialArray = new Uint8Array(visualizerAudioGraph.analyserNode.frequencyBinCount);

        visualizerAudioGraph.analyserNode.getByteFrequencyData(initialArray);

        console.log(initialArray);

        var binsArray = transformToVisualBins(initialArray);

        console.log(binsArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
        ctx.fillStyle = 'red'; // Color of the bars

        for (var y = 0; y < SpectrumBarCount; y++) {

            let bar_x = y * barWidth;
            let bar_width = barWidth;
            let bar_height = binsArray[y];

            //  fillRect( x, y, width, height ) // Explanation of the parameters below
            //ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillRect(bar_x, (canvas.height / 2) - bar_height, bar_width, bar_height);

            ctx.fillRect(bar_x, canvas.height / 2, bar_width, bar_height);

        }

    }

    // initialize player ui
    let playerUI = new PlayerUI(player);

    // add songs to player queue
    let firstSoundAttributes: ISoundAttributes = {
        sources: '1314412&format=mp31',
        id: 1314412,
        playlistId: 0,
        onLoading: (loadingProgress, maximumValue, currentValue) => {

            console.log('loading: ', loadingProgress, maximumValue, currentValue);

            playerUI.setLoadingProgress(loadingProgress);

        },
        onPlaying: (playingProgress, maximumValue, currentValue) => {

            console.log('playing: ', playingProgress, maximumValue, currentValue);

            playerUI.setPlayingProgress(playingProgress);

        },
        onStarted: (playTimeOffset) => {

            console.log('started', playTimeOffset);

            isPlaying = true;

            looper();

        },
        onPaused: (playTimeOffset) => {

            console.log('paused', playTimeOffset);

            isPlaying = false;

        },
        onStopped: (playTimeOffset) => {

            console.log('stopped', playTimeOffset);

            isPlaying = false;

        },
        onResumed: (playTimeOffset) => {
            
            console.log('resumed', playTimeOffset);

            isPlaying = true;

            looper();

        },
        onEnded: (willPlayNext) => {

            console.log('ended', willPlayNext);

            if (!willPlayNext) {
                playerUI.switchPlayerContext('on');
            }

            isPlaying = false;

        }
    };

    // add the first song to queue
    let firstSound = player.addSoundToQueue(firstSoundAttributes);

});

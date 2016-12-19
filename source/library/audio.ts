
'use strict';

export class Audio {

    public getContext(): AudioContext {

        let AudioContext = window.AudioContext || (<any>window).webkitAudioContext;

        let audioContext = new AudioContext();

        return audioContext;

    }

}

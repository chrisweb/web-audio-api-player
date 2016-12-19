
'use strict';

import { PlayerError, IPlayerError } from './error';

export class Audio {

    protected context: AudioContext;

    constructor() {

        this.context = this._getContext();

    }

    protected _getContext(): AudioContext {

        let AudioContext = window.AudioContext || (window as any).webkitAudioContext;

        let audioContext = new AudioContext();

        return audioContext;

    }

    public decodeAudio(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {

        // decodeAudioData returns a promise of type PromiseLike
        // using resolve to return a promise of type Promise
        return Promise.resolve(this.context.decodeAudioData(arrayBuffer));

    }

}

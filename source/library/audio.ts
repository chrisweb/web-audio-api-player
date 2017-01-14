
'use strict';

import { PlayerError, IPlayerError } from './error';

export interface IAudioGraph {
    sourceNode: AudioBufferSourceNode;
    gainNode: GainNode;
    pannerNode: PannerNode;
}

export interface IAudioGraphOptions {
    volume: number;
}

export class PlayerAudio {

    protected _context: AudioContext;
    protected _contextState: string;

    constructor() {

        // initial context state is still "closed"
        this._contextState = 'closed';

        // TODO: to speed up things would it be better to create a context in the constructor?
        // and suspend the context upon creating it until it gets used?

    }

    public decodeAudio(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {

        if (this._contextState === 'closed') {
            this._createContext();
        }

        if (this._contextState === 'suspended') {

            this._unfreezeAudioContext().then(() => {

                return Promise.resolve(this._context.decodeAudioData(arrayBuffer));

            });

        }

        // decodeAudioData returns a promise of type PromiseLike
        // using resolve to return a promise of type Promise
        return Promise.resolve(this._context.decodeAudioData(arrayBuffer));

    }

    protected _createContext() {

        let AudioContext = window.AudioContext || (window as any).webkitAudioContext;

        let audioContext = new AudioContext();

        audioContext.onstatechange = () => {

            this._contextState = audioContext.state;

            if (this._contextState === 'closed') {
                this._context = null;
            }

        };

        this._context = audioContext;

    }

    protected _destroyAudioContext() {

        this._context.close().then(() => {

            this._context = null;

        });

    }

    protected _freezeAudioContext(): Promise<void> {

        // did resume get implemented
        if (typeof this._context.suspend === 'undefined') {

            return Promise.resolve();

        } else {

            // resume the audio hardware access
            return this._context.resume();

        }

    }

    protected _unfreezeAudioContext(): Promise<void> {

        // did suspend get implemented
        if (typeof this._context.suspend === 'undefined') {

            return Promise.resolve();

        } else {

            // halt the audio hardware access temporarily to reduce CPU and battery usage
            return this._context.suspend();

        }

    }

    public createAudioGraph(audioGraphOptions: IAudioGraphOptions): IAudioGraph {

        if (this._contextState === 'closed') {
            this._createContext();
        }

        if (this._contextState === 'suspended') {

            this._unfreezeAudioContext().then(() => {

                this._createAudioGraph(audioGraphOptions);

            });

        }

        return this._createAudioGraph(audioGraphOptions);

    }

    protected _createAudioGraph(audioGraphOptions: IAudioGraphOptions): IAudioGraph {

        let audioGraph = {
            // TODO: source nodes can be used only once, so we need one per song
            sourceNode: this._context.createBufferSource(),
            gainNode: this._context.createGain(),
            pannerNode: this._context.createPanner()
        };

        audioGraph.gainNode.gain.value = audioGraphOptions.volume / 100;

        // connect the source node to the gain node
        audioGraph.sourceNode.connect(audioGraph.gainNode);

        // connect the gain node to the panner node
        //audioGraph.gainNode.connect(audioGraph.pannerNode);

        // connect to the panner node to the destination (speakers)
        //audioGraph.pannerNode.connect(this._context.destination);

        // connect the gain node to the destination (speakers)
        audioGraph.gainNode.connect(this._context.destination);

        return audioGraph;

    }

}

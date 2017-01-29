
'use strict';

import { PlayerError, IPlayerError } from './error';

export interface IAudioGraph {
    gainNode: GainNode;
    pannerNode?: PannerNode;
    stereoPannerNode?: StereoPannerNode;
}

export interface IAudioGraphOptions {
    volume: number;
}

export interface ISourceNodeOptions {
    loop: boolean;
    onEnded: Function;
}

export class PlayerAudio {

    protected _context: AudioContext;
    protected _contextState: string;
    protected _audioGraph: IAudioGraph | null;

    constructor() {

        // initial context state is still "closed"
        this._contextState = 'closed';
        this._audioGraph = null;

        // TODO: to speed up things would it be better to create a context in the constructor?
        // and suspend the context upon creating it until it gets used?

    }

    public decodeAudio(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {

        return this._getAudioContext().then(() => {

            // decodeAudioData returns a promise of type PromiseLike
            // using resolve to return a promise of type Promise
            return Promise.resolve(this._context.decodeAudioData(arrayBuffer));

        });

    }

    protected _getAudioContext(): Promise<{}> {

        return new Promise((resolve, reject) => {

            if (this._contextState === 'closed') {

                let AudioContext = window.AudioContext || (window as any).webkitAudioContext;

                let audioContext = new AudioContext();

                audioContext.onstatechange = () => {

                    this._contextState = audioContext.state;

                    if (this._contextState === 'closed') {
                        this._context = null;
                    }

                };

                this._context = audioContext;

                this._createAudioGraph();

                resolve();

            } else if (this._contextState === 'suspended') {

                this._unfreezeAudioContext().then(() => {

                    resolve();

                });

            } else {

                resolve();

            }

        });

    }

    protected _destroyAudioContext() {

        this._destroyAudioGraph();

        this._context.close().then(() => {

            this._context = null;

        });

    }

    protected _unfreezeAudioContext(): Promise<void> {

        // did resume get implemented
        if (typeof this._context.suspend === 'undefined') {

            return Promise.resolve();

        } else {

            // resume the audio hardware access
            return this._context.resume();

        }

    }

    protected _freezeAudioContext(): Promise<void> {

        // did suspend get implemented
        if (typeof this._context.suspend === 'undefined') {

            return Promise.resolve();

        } else {

            // halt the audio hardware access temporarily to reduce CPU and battery usage
            return this._context.suspend();

        }

    }

    protected _createAudioGraph() {

        // https://developer.mozilla.org/en-US/docs/Web/API/GainNode

        let audioGraph = {
            gainNode: this._context.createGain()
        };

        // connect the gain node to the destination (speakers)
        audioGraph.gainNode.connect(this._context.destination);

        this._audioGraph = audioGraph;

    }

    public setAudioGraph(audioGraph: IAudioGraph) {

        if (this._audioGraph !== null) {

            this._destroyAudioGraph();

        }

        this._audioGraph = audioGraph;

    }

    public getAudioGraph(): IAudioGraph {

        return this._audioGraph;

    }

    public createSourceNode(sourceNodeOptions: ISourceNodeOptions): Promise<AudioBufferSourceNode> {

        return this._getAudioContext().then(() => {

            let sourceNode = this._context.createBufferSource();

            // do we loop this song
            sourceNode.loop = sourceNodeOptions.loop;

            // if the song ends destroy it's audioGraph as the source can't be reused anyway
            // NOTE: the onended handler won't have any effect if the loop property is set to
            // true, as the audio won't stop playing. To see the effect in this case you'd
            // have to use AudioBufferSourceNode.stop()
            sourceNode.onended = () => {

                sourceNodeOptions.onEnded();

                sourceNode.disconnect();

                sourceNode = null;

            };

            return sourceNode;

        });

    }

    public connectSourceNodeToGraph(sourceNode: AudioBufferSourceNode) {

        sourceNode.connect(this._audioGraph.gainNode);

    }

    protected _destroyAudioGraph(): void {

        this._audioGraph.gainNode.disconnect();

        this._audioGraph = null;

    }

    public destroySourceNode(sourceNode: AudioBufferSourceNode) {

        sourceNode.disconnect();

        sourceNode = null;

        return sourceNode;

    }

    public changeGainValue(volume: number) {

        this._getAudioContext().then(() => {

            this._audioGraph.gainNode.gain.value = volume / 100;

        });

    }

    /*public setPlaybackRate(playbackRate: number): void {

        // < 1 slower, > 1 faster playback
        //this._audioGraph.sourceNode.setPlaybackRate(playbackRate);

    };

    public getPlaybackRate(): number {

        //return this._audioGraph.sourceNode.playbackRate;

        return 0;

    };

    public resetPlaybackRate(): void {



    }

    public setPanner(left: number, right: number): void {

        // https://developer.mozilla.org/en-US/docs/Web/API/PannerNode

        //this.audioGraph.pannerNode.setPosition(0, 0, 0);

    };

    public getPanner(): { left: number, right: number } {

        //return this.audioGraph.pannerNode.getPosition();

        return { left: 0, right: 0 };

    };

    public resetPanner(): void {



    }*/

}


'use strict';

import { PlayerError, IPlayerError } from './error';

// Note to self: AudioGraph documentation
// https://developer.mozilla.org/en-US/docs/Web/API/AudioNode

export interface IAudioGraph {
    // https://developer.mozilla.org/en-US/docs/Web/API/GainNode
    gainNode: GainNode;
    // https://developer.mozilla.org/en-US/docs/Web/API/PannerNode
    pannerNode?: PannerNode;
    // https://developer.mozilla.org/en-US/docs/Web/API/StereoPannerNode
    stereoPannerNode?: StereoPannerNode;
    // https://developer.mozilla.org/en-US/docs/Web/API/DelayNode
    delayNode?: DelayNode;
    // https://developer.mozilla.org/en-US/docs/Web/API/ScriptProcessorNode
    scriptProcessorNode?: ScriptProcessorNode;
    // https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode
    analyserNode?: AnalyserNode;
    // https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode
    biquadFilterNode?: BiquadFilterNode;
    // https://developer.mozilla.org/en-US/docs/Web/API/ChannelMergerNode
    channelMergeNode?: ChannelMergerNode;
    // https://developer.mozilla.org/en-US/docs/Web/API/ChannelSplitterNode
    channelSplitterNode?: ChannelSplitterNode;
    // https://developer.mozilla.org/en-US/docs/Web/API/ConvolverNode
    convolverNode?: ConvolverNode;
    // https://developer.mozilla.org/en-US/docs/Web/API/DynamicsCompressorNode
    dynamicCompressorNode?: DynamicsCompressorNode;
    // https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode
    oscillatorNode?: OscillatorNode;
    // https://developer.mozilla.org/en-US/docs/Web/API/WaveShaperNode
    waveShaperNode?: WaveShaperNode;
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
    protected _audioGraph: IAudioGraph | null = null;

    constructor(customAudioGraph?: IAudioGraph) {

        // initial context state is still "closed"
        this._contextState = 'closed';

        if (customAudioGraph !== undefined) {
            this._audioGraph = customAudioGraph;
        }

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

                this._connectAudioGraphGainToDestination();

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

    protected _connectAudioGraphGainToDestination() {

        if (this._audioGraph === null) {

            this._audioGraph = {
                gainNode: this._context.createGain()
            }

        }

        // connect the gain node to the destination (speakers)
        // https://developer.mozilla.org/en-US/docs/Web/API/AudioDestinationNode
        this._audioGraph.gainNode.connect(this._context.destination);

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

    public connectSourceNodeToGraphGainNode(sourceNode: AudioBufferSourceNode) {

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

// Note to self: AudioGraph documentation
// https://developer.mozilla.org/en-US/docs/Web/API/AudioNode

interface IAudioGraph {
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

interface IAudioOptions {
    customAudioContext: AudioContext;
    customAudioGraph: IAudioGraph;
    createAudioContextOnFirstUserInteraction: boolean;
    persistVolume: boolean;
}

interface ISourceNodeOptions {
    loop: boolean;
    onEnded: Function;
}

class PlayerAudio {

    protected _volume: number;
    protected _audioContext: AudioContext | null = null;
    protected _audioGraph: IAudioGraph | null = null;
    protected _createAudioContextOnFirstUserInteraction: boolean;
    protected _persistVolume: boolean;

    constructor(options: IAudioOptions) {

        this.setPersistVolume(options.persistVolume);
        this.setAutoCreateContextOnFirstTouch(options.createAudioContextOnFirstUserInteraction);

        if (options.customAudioContext !== null
            && options.customAudioContext !== undefined) {
            this.setAudioContext(options.customAudioContext);
        } else {
            this._autoCreateAudioContextOnFirstUserInteraction();
        }

        if (options.customAudioGraph !== null
            && options.customAudioGraph !== undefined) {
            this.setAudioGraph(options.customAudioGraph);
        }

    }

    public async decodeAudio(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {

        const audioContext = await this.getAudioContext();

        // Note to self:
        // newer decodeAudioData returns promise, older accept as second
        // and third parameter a success and an error callback funtion
        // https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/decodeAudioData

        let audioBufferPromise = audioContext.decodeAudioData(arrayBuffer);

        // decodeAudioData returns a promise of type PromiseLike
        // using resolve to return a promise of type Promise
        return Promise.resolve(audioBufferPromise);

    }

    protected _createAudioContext(): Promise<void> {

        return new Promise((resolve, reject) => {

            let MyAudioContext: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;

            // initialize the audio context
            try {
                this._audioContext = new MyAudioContext();
                resolve();
            } catch (error) {
                reject(error);
            }

        });

    }

    protected _autoCreateAudioContextRemoveListener() {

        document.removeEventListener('touchstart', this._autoCreateAudioContextRemoveListener.bind(this), false);
        document.removeEventListener('mousedown', this._autoCreateAudioContextRemoveListener.bind(this), false);

        this.getAudioContext().then(() => {

        });

    }

    protected _autoCreateAudioContextOnFirstUserInteraction(): void {

        if (this._createAudioContextOnFirstUserInteraction) {
            document.addEventListener('touchstart', this._autoCreateAudioContextRemoveListener.bind(this), false);
            document.addEventListener('mousedown', this._autoCreateAudioContextRemoveListener.bind(this), false);
        }

    }

    public getAudioContext(): Promise<AudioContext> {

        return new Promise((resolve, reject) => {

            if (this._audioContext === null) {

                this._createAudioContext().then(() => {
                    resolve(this._audioContext);
                }).catch(reject);

            } else if (this._audioContext.state === 'suspended') {

                this._unfreezeAudioContext().then(() => {

                    resolve(this._audioContext);

                });

            } else if (this._audioContext.state === 'running') {

                resolve(this._audioContext);

            } else {
                console.log('audioContext.state: ', this._audioContext.state);
            }

        });

    }

    public setAudioContext(audioContext: AudioContext): void {

        if (this._audioContext !== null) {

            this._destroyAudioContext().then(() => {

                this._setAudioContext(audioContext);

            });

        } else {

            this._setAudioContext(audioContext);

        }

    }

    protected _setAudioContext(audioContext: AudioContext): void {

        this._audioContext = audioContext;

    }

    protected _destroyAudioContext(): Promise<void> {

        return this._audioContext.close().then(() => {

            this._audioContext = null;

        });

    }

    public _unfreezeAudioContext(): Promise<void> {

        // did resume get implemented
        if (typeof this._audioContext.suspend === 'undefined') {

            // this browser does not support resume
            // just send back a promise as resume would do
            return Promise.resolve();

        } else {

            // resume the audio hardware access
            // audio context resume returns a promise
            // https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/resume
            return this._audioContext.resume();

        }

    }

    public _freezeAudioContext(): Promise<void> {

        // did suspend get implemented
        if (typeof this._audioContext.suspend === 'undefined') {

            return Promise.resolve();

        } else {

            // halt the audio hardware access temporarily to reduce CPU and battery usage
            return this._audioContext.suspend();

        }

    }

    public setAudioGraph(audioGraph: IAudioGraph): void {

        if (this._audioGraph !== null) {
            this._destroyAudioGraph();
        }

        // check if there is gain node
        if (!('gainNode' in audioGraph)
            || audioGraph.gainNode === null
            || audioGraph.gainNode === undefined) {

            this.getAudioContext().then((audioContext: AudioContext) => {

                audioGraph.gainNode = audioContext.createGain();

                this._audioGraph = audioGraph;

            });

        } else {

            this._audioGraph = audioGraph;

        }

    }

    public getAudioGraph(): Promise<IAudioGraph> {

        return new Promise((resolve, reject) => {

            if (this._audioGraph !== null) {

                resolve(this._audioGraph);

            } else {

                this._createAudioGraph()
                    .then((audioGraph: IAudioGraph) => {

                        this._audioGraph = audioGraph;

                        resolve(audioGraph);

                    }).catch(reject);

            }

        });

    }

    protected _createAudioGraph(): Promise<IAudioGraph> {

        return new Promise((resolve, reject) => {

            this.getAudioContext().then((audioContext: AudioContext) => {

                if (!this._audioGraph) {

                    this._audioGraph = {
                        gainNode: audioContext.createGain()
                    };

                }

                // connect the gain node to the destination (speakers)
                // https://developer.mozilla.org/en-US/docs/Web/API/AudioDestinationNode
                this._audioGraph.gainNode.connect(audioContext.destination);

                // update volume
                this.changeVolume(this._volume, false);

                // resolve
                resolve(this._audioGraph);

            });

        });

    }

    protected _destroyAudioGraph(): void {

        if (this._audioGraph !== null) {
            this._audioGraph.gainNode.disconnect();
        }

        // TODO: disconnect other nodes!?

        this._audioGraph = null;

    }

    public createSourceNode(sourceNodeOptions: ISourceNodeOptions): Promise<AudioBufferSourceNode> {

        return this.getAudioContext().then((audioContext: AudioContext) => {

            let sourceNode: AudioBufferSourceNode = audioContext.createBufferSource();

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

    public connectSourceNodeToGraphNodes(sourceNode: AudioBufferSourceNode): void {

        this.getAudioGraph().then((audioGraph: IAudioGraph) => {

            sourceNode.connect(audioGraph.gainNode);

            if ('analyserNode' in audioGraph
                && audioGraph.analyserNode !== null
                && audioGraph.analyserNode !== undefined) {

                sourceNode.connect(audioGraph.analyserNode);

            }

            if ('delayNode' in audioGraph
                && audioGraph.delayNode !== null
                && audioGraph.delayNode !== undefined) {

                sourceNode.connect(audioGraph.delayNode);

            }

            // TODO: handle other types of nodes as well
            // do it recursivly!?

        });

    }

    public destroySourceNode(sourceNode: AudioBufferSourceNode): AudioBufferSourceNode {

        sourceNode.disconnect();

        sourceNode = null;

        return sourceNode;

    }

    public changeVolume(volume: number, forceUpdateUserVolume: boolean = true): number {

        if (this._persistVolume) {

            const userVolume = parseInt(localStorage.getItem('WebAudioAPIPlayerVolume'));

            if (!isNaN(userVolume) && !forceUpdateUserVolume) {
                volume = userVolume;
            } else {
                if (forceUpdateUserVolume) {
                    localStorage.setItem('WebAudioAPIPlayerVolume', volume.toString());
                }
            }

        }

        // update volume (gainValue)
        const gainValue = volume / 100;

        this._changeGainValue(gainValue);

        this._volume = volume;

        return volume;

    }

    protected _changeGainValue(gainValue: number): void {

        this.getAudioGraph().then((audioGraph: IAudioGraph) => {

            audioGraph.gainNode.gain.value = gainValue;

        });

    }

    public setAutoCreateContextOnFirstTouch(autoCreate: boolean): void {

        this._createAudioContextOnFirstUserInteraction = autoCreate;

    }

    public getAutoCreateContextOnFirstTouch(): boolean {

        return this._createAudioContextOnFirstUserInteraction;

    }

    public setPersistVolume(persistVolume: boolean): void {

        this._persistVolume = persistVolume;

    }

    public getPersistVolume(): boolean {

        return this._persistVolume;

    }

}

export { PlayerAudio, IAudioGraph, IAudioOptions };

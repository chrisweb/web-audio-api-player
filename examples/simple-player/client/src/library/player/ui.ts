﻿
//import { PlayerCore } from 'web-audio-api-player';
import { PlayerCore } from '../../../../../../dist/index';

class PlayerUI {

    public player: PlayerCore;

    protected _buttonsBox: HTMLElement;
    protected _volumeSlider: HTMLInputElement;
    protected _loadingProgressBar: HTMLInputElement;
    protected _playingProgressBar: HTMLInputElement;

    constructor(player: PlayerCore) {

        this.player = player;

        this._prepareUI();

    }

    protected _prepareUI(): void {

        // NOTE TO SELF: compatibility goal: minimum IE11

        // buttons box
        this._buttonsBox = document.getElementById('js-buttons-box');

        // slider (html5 input range)
        this._volumeSlider = document.getElementById('js-player-volume') as HTMLInputElement;

        // loading progress bar (html5 input range)
        this._loadingProgressBar = document.getElementById('js-player-loading-progress') as HTMLInputElement;

        // playing progress bar (html5 input range)
        this._playingProgressBar = document.getElementById('js-player-playing-progress') as HTMLInputElement;

        // start listening to events
        this._createListeners();

        // set the initial volume to the volume input range
        this._volumeSlider.value = String(this.player.getVolume());

        // TODO: use the localstorage or indexeddb to persist the user volume

    }

    protected _createListeners(): void {

        // some performance tests:
        // https://jsperf.com/js-get-elements

        this._buttonsBox.addEventListener('click', this._onClickButtonsBox.bind(this));
        this._volumeSlider.addEventListener('change', this._onChangeVolume.bind(this));
        this._playingProgressBar.addEventListener('change', this._onChangePlayingProgress.bind(this));

    }

    protected _onClickButtonsBox(event: Event): void {

        event.preventDefault();

        let $button = event.target as HTMLElement;

        if ($button.localName === 'span') {
            $button = $button.parentElement;
        }

        if ($button.id === 'js-play-pause-button') {

            const playerContext = this._buttonsBox.dataset['playerContext'];

            switch (playerContext) {
                // is playing
                case 'on':
                    this.player.pause();
                    break;
                // is paused
                case 'off':
                    this.player.play();
                    break;
            }

            this._switchPlayerContext(playerContext);

        }

        if ($button.id === 'js-previous-button') {

            this._setPlayingProgress(0);

            const playerContext = this._buttonsBox.dataset['playerContext'];

            if (playerContext === 'off') {
                this._switchPlayerContext(playerContext);
            }

            this.player.play({ whichSound: 'previous' }).catch((error) => {
                const playerContext = this._buttonsBox.dataset['playerContext'];
                console.log('player ui js-previous-button error:', error);
                if (playerContext === 'on') {
                    this._switchPlayerContext(playerContext);
                }
            });

        }

        if ($button.id === 'js-next-button') {

            this._setPlayingProgress(0);

            const playerContext = this._buttonsBox.dataset['playerContext'];

            if (playerContext === 'off') {
                this._switchPlayerContext(playerContext);
            }

            this.player.play({ whichSound: 'next' }).catch((error) => {
                const playerContext = this._buttonsBox.dataset['playerContext'];
                console.log('player ui js-next-button error:', error);
                if (playerContext === 'on') {
                    this._switchPlayerContext(playerContext);
                }
            });

        }

        if ($button.id === 'js-shuffle-button') {

            // TODO

        }

        if ($button.id === 'js-repeat-button') {

            // TODO

        }

    }

    protected _onChangeVolume(event: Event): void {

        // styling the html5 range:
        // http://brennaobrien.com/blog/2014/05/style-input-type-range-in-every-browser.html

        const rangeElement = event.target as HTMLInputElement;
        const value = parseInt(rangeElement.value);

        this.player.setVolume(value);

    }

    protected _onChangePlayingProgress(event: Event): void {

        const rangeElement = event.target as HTMLInputElement;
        const value = parseInt(rangeElement.value);

        this.player.setPosition(value);

    }

    protected _switchPlayerContext(currentPlayerContext: string): void {

        const $playIcon = document.getElementById('js-play');
        const $pauseIcon = document.getElementById('js-pause');
        let newPlayerContext;

        switch (currentPlayerContext) {
            // is playing
            case 'on':
                newPlayerContext = 'off';
                $playIcon.classList.remove('hidden');
                $pauseIcon.classList.add('hidden');
                break;
            // is paused
            case 'off':
                newPlayerContext = 'on';
                $playIcon.classList.add('hidden');
                $pauseIcon.classList.remove('hidden');
                break;
        }

        this._buttonsBox.dataset['playerContext'] = newPlayerContext;

    }

    protected _setPlayingProgress(percentage: number): void {

        this._playingProgressBar.value = percentage.toString();

    }

    protected _setLoadingProgress(percentage: number): void {

        this._loadingProgressBar.value = percentage.toString();

    }

    public changePlayingProgress(percentage: number): void {

        this._setPlayingProgress(percentage);

    }

    public changeLoadingProgress(percentage: number): void {

        this._setLoadingProgress(percentage);

    }

    public resetUI(): void {

        this._switchPlayerContext('on');

    }

    protected _destroyListeners(): void {

        this._buttonsBox.removeEventListener('click', this._onClickButtonsBox.bind(this));
        this._volumeSlider.removeEventListener('change', this._onChangeVolume.bind(this));
        this._playingProgressBar.removeEventListener('click', this._onChangePlayingProgress.bind(this));

        this._buttonsBox = null;
        this._volumeSlider = null;
        this._playingProgressBar = null;

    }

    public deconstructor(): void {

        this._destroyListeners();

    }

}

export { PlayerUI };

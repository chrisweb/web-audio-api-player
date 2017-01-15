
import { PlayerCore } from 'web-audio-api-player';

export class PlayerUI {

    public player: PlayerCore;

    protected _buttonsBox: HTMLElement;
    protected _volumeSlider: HTMLInputElement;
    protected _progressBar: HTMLInputElement;

    constructor(player: PlayerCore) {

        // compatibility goal: minimum IE11

        this.player = player;

        // buttons box
        this._buttonsBox = document.getElementById('js-buttons-box');

        // slider (html5 input range)
        this._volumeSlider = document.getElementById('js-player-volume') as HTMLInputElement;

        // progress bar (html5 input range)
        this._progressBar = document.getElementById('js-player-progress') as HTMLInputElement;

        // start listening to events
        this._createListeners();

        // set the initial volume volume to the volume input range
        this._volumeSlider.value = String(this.player.getVolume());

    }

    protected _createListeners() {

        // some performance tests:
        // https://jsperf.com/js-get-elements

        this._buttonsBox.addEventListener('click', this._onClickButtonsBox.bind(this));
        this._volumeSlider.addEventListener('change', this._onChangeVolume.bind(this));
        this._progressBar.addEventListener('change', this._onChangeProgress.bind(this));

    }

    protected _onClickButtonsBox(event: Event) {

        event.preventDefault();

        let $button = event.target as HTMLElement;

        if ($button.localName === 'span') {
            $button = $button.parentElement;
        }

        if ($button.id === 'js-play-pause-button') {

            let playerContext = $button.dataset['playerContext'];
            let $playIcon = document.getElementById('js-play');
            let $pauseIcon = document.getElementById('js-pause');

            switch (playerContext) {
                // is playing
                case 'on':
                    this.player.pause();
                    playerContext = 'off';
                    $playIcon.classList.remove('hidden');
                    $pauseIcon.classList.add('hidden');
                    break;
                // is paused
                case 'off':
                    this.player.play();
                    playerContext = 'on';
                    $playIcon.classList.add('hidden');
                    $pauseIcon.classList.remove('hidden');
                    break;
            }

            $button.dataset['playerContext'] = playerContext;

        }

        if ($button.id === 'js-previous-button') {

            this.player.play('previous');

        }

        if ($button.id === 'js-next-button') {

            this.player.play('next');

        }

        if ($button.id === 'js-shuffle-button') {

            // TODO

        }

        if ($button.id === 'js-repeat-button') {

            // TODO

        }

    }

    protected _onChangeVolume(event: Event) {

        // styling the html5 range:
        // http://brennaobrien.com/blog/2014/05/style-input-type-range-in-every-browser.html

        let rangeElement = event.target as HTMLInputElement;
        let value = parseInt(rangeElement.value);

        this.player.setVolume(value);

    }

    protected _onChangeProgress(event: Event) {

        let rangeElement = event.target as HTMLInputElement;
        let value = parseInt(rangeElement.value);

        this.player.setProgress(value);

    }

    protected _destroyListeners() {

        this._buttonsBox.removeEventListener('click', this._onClickButtonsBox.bind(this));
        this._volumeSlider.removeEventListener('change', this._onChangeVolume.bind(this));
        this._progressBar.removeEventListener('click', this._onChangeProgress.bind(this));

        this._buttonsBox = null;
        this._volumeSlider = null;
        this._progressBar = null;

    }

    public deconstructor() {

        this._destroyListeners();

    }

}

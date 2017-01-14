
import { PlayerCore } from 'web-audio-api-player';

export class PlayerUI {

    public player: PlayerCore;

    constructor(player: PlayerCore) {

        // compatibility: minimum IE11

        this.player = player;

        this._createListeners();

    }

    protected _createListeners() {

        let $body = document.getElementsByTagName('body')[0];

        let $buttonsBar = $body.getElementsByClassName('js-buttons-bar')[0];

        $buttonsBar.addEventListener('click', this._onClickButtonsBar.bind(this));

    }

    protected _onClickButtonsBar(event: Event) {

        event.preventDefault();

        let $button = event.target as HTMLElement;

        if ($button.localName === 'span') {
            $button = $button.parentElement;
        }

        if ($button.classList.contains('js-play-pause-button')) {

            let playerContext = $button.dataset['playerContext'];
            let $playIcon = $button.getElementsByClassName('js-play')[0];
            let $pauseIcon = $button.getElementsByClassName('js-pause')[0];

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

        }

        if ($button.classList.contains('js-next-button')) {

            this.player.play('next');

        }

    }

    protected _destroyListeners() {

        let $body = document.getElementsByTagName('body')[0];

        let $buttonsBar = $body.getElementsByClassName('js-buttons-bar')[0];

        $buttonsBar.removeEventListener('click', this._onClickButtonsBar);

    }

    public deconstructor() {

        this._destroyListeners();

    }

}

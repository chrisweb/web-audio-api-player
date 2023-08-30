import { PlayerCore, IPlayOptions } from '../../../../../../dist/index'

class PlayerUI {

    public player: PlayerCore

    protected _buttonsBox: HTMLElement
    protected _volumeSlider: HTMLInputElement
    protected _loadingProgressBar: HTMLInputElement
    protected _playingProgressBar: HTMLInputElement
    protected _extraButtons: HTMLElement

    constructor(player: PlayerCore) {
        this.player = player
        this._prepareUI()
    }

    protected _prepareUI(): void {
        // buttons box
        this._buttonsBox = document.getElementById('js-buttons-box')
        // slider (html5 input range)
        this._volumeSlider = document.getElementById('js-player-volume') as HTMLInputElement
        // loading progress bar (html5 input range)
        this._loadingProgressBar = document.getElementById('js-player-loading-progress') as HTMLInputElement
        // playing progress bar (html5 input range)
        this._playingProgressBar = document.getElementById('js-player-playing-progress') as HTMLInputElement
        // extra buttons
        this._extraButtons = document.getElementById('js-extra-buttons')
        // start listening to events
        this._createListeners()
        // set the initial volume to the volume input range
        this._volumeSlider.value = String(this.player.getVolume())
    }

    protected _createListeners(): void {

        this._buttonsBox.addEventListener('click', this._onClickButtonsBox.bind(this))
        this._volumeSlider.addEventListener('input', this._onInputVolume.bind(this))
        this._playingProgressBar.addEventListener('input', this._onInputPlayingProgress.bind(this))
        this._extraButtons.addEventListener('click', this._onClickExtraButtons.bind(this))

    }

    protected _onClickButtonsBox(event: Event): void {

        event.preventDefault()

        let $button = event.target as HTMLElement

        if ($button.localName === 'span') {
            $button = $button.parentElement
        }

        if ($button.id === 'js-play-pause-button') {

            const playerContext = this._buttonsBox.dataset['playerContext'];

            switch (playerContext) {
                // is playing
                case 'on':
                    this.player.pause()
                    break
                // is paused
                case 'off':
                    this.player.play()
                    break
            }

            this._switchPlayerContext(playerContext)

        }

        if ($button.id === 'js-previous-button') {

            const playOptions: IPlayOptions = {
                whichSound: 'previous'
            }

            this.player.play(playOptions).catch((error: unknown) => {
                const playerContext = this._buttonsBox.dataset['playerContext']
                console.log('player ui js-previous-button error:', error)
                if (playerContext === 'on') {
                    this._switchPlayerContext(playerContext)
                }
            })

        }

        if ($button.id === 'js-next-button') {

            const playOptions: IPlayOptions = {
                whichSound: 'next'
            }

            this.player.play(playOptions).catch((error: unknown) => {
                const playerContext = this._buttonsBox.dataset['playerContext']
                console.log('player ui js-next-button error:', error)
                if (playerContext === 'on') {
                    this._switchPlayerContext(playerContext)
                }
            })

        }

        if ($button.id === 'js-shuffle-button') {
            // TODO
        }

        if ($button.id === 'js-loop-playlist-button') {
            // TODO
        }

    }

    protected _onInputVolume(event: Event): void {

        // Note: for input type=range elements listen for input events
        // instead of change events, the change event will sometimes
        // not fire if the click on the element happens at the same
        // exact moment at which the user clicks on the input element

        // styling the html5 range:
        // http://brennaobrien.com/blog/2014/05/style-input-type-range-in-every-browser.html

        const rangeElement = event.target as HTMLInputElement
        const value = parseInt(rangeElement.value)

        this.player.setVolume(value)

    }

    protected _onInputPlayingProgress(event: Event): void {
        const rangeElement = event.target as HTMLInputElement
        const value = parseInt(rangeElement.value)
        this.player.setPosition(value)
    }

    protected _onClickExtraButtons(event: Event): void {

        event.preventDefault()

        const $button = event.target as HTMLElement

        if ($button.id === 'js-first') {
            this.player.play({ whichSound: 'first' });
        }

        if ($button.id === 'js-last') {
            this.player.play({ whichSound: 'last' });
        }

        if ($button.id.substring(0, 7) === 'js-byId') {
            const songId = $button.getAttribute('data-song-id');
            this.player.play({ whichSound: parseInt(songId) });
        }

        if ($button.id === 'pause') {
            this.player.pause();
        }

        if ($button.id === 'stop') {
            this.player.stop();
        }
    }

    protected _setPlayingProgress(percentage: number): void {
        this._playingProgressBar.value = percentage.toString()
    }

    protected _setLoadingProgress(percentage: number): void {
        this._loadingProgressBar.value = percentage.toString()
    }

    public changePlayingProgress(percentage: number): void {
        this._setPlayingProgress(percentage)
    }

    public changeLoadingProgress(percentage: number): void {
        this._setLoadingProgress(percentage)
    }

    protected _switchPlayerContext(currentPlayerContext: string): void {

        const $playIcon = document.getElementById('js-play')
        const $pauseIcon = document.getElementById('js-pause')
        let newPlayerContext

        switch (currentPlayerContext) {
            // is playing
            case 'on':
                newPlayerContext = 'off'
                $playIcon.classList.remove('hidden')
                $pauseIcon.classList.add('hidden')
                break
            // is paused
            case 'off':
                newPlayerContext = 'on'
                $playIcon.classList.add('hidden')
                $pauseIcon.classList.remove('hidden')
                break
        }

        this._buttonsBox.dataset['playerContext'] = newPlayerContext

    }

    public setToPlay(): void {
        this._switchPlayerContext('off')
    }

    public setToStop(): void {
        this._switchPlayerContext('on')
    }

    protected _destroyListeners(): void {

        this._buttonsBox.removeEventListener('click', this._onClickButtonsBox.bind(this))
        this._volumeSlider.removeEventListener('change', this._onInputVolume.bind(this))
        this._playingProgressBar.removeEventListener('click', this._onInputPlayingProgress.bind(this))

        this._buttonsBox = null
        this._volumeSlider = null
        this._playingProgressBar = null

    }

    public deconstructor(): void {
        this._destroyListeners()
    }

}

export { PlayerUI }

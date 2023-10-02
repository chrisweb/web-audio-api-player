import { PlayerCore, IPlayOptions } from '../../../../../../dist/index.js'

class PlayerUI {

    public player: PlayerCore

    protected _buttonsBox: HTMLElement
    protected _volumeSlider: HTMLInputElement
    protected _loadingProgressBar: HTMLInputElement
    protected _playingProgressBar: HTMLInputElement
    protected _extraButtons: HTMLElement
    protected _playTime: HTMLElement
    protected _durationTime: HTMLElement
    protected _volumeNumber: HTMLElement

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
        // the play time display
        this._playTime = document.getElementById('js-play-time')
        // the duration time display
        this._durationTime = document.getElementById('js-duration-time')
        // the volume number display
        this._volumeNumber = document.getElementById('js-volume-number')

        // start listening to events
        this._createListeners()

        // set the initial volume to the volume input range
        const volume = String(this.player.getVolume())
        this._volumeSlider.value = volume
        this._volumeNumber.textContent = volume

        const $isAudioLockedButton = document.getElementById('checkLock')
        //const $isAudioPlayingInfo = document.getElementById('checkPlay')

        setInterval(() => {
            this.player.checkIfAudioIsUnlocked().then((isUnlocked) => {
                if (isUnlocked) {
                    $isAudioLockedButton.style.backgroundColor = 'green'
                } else {
                    $isAudioLockedButton.style.backgroundColor = 'red'
                }
            }).catch((error) => {
                console.error(error)
            })
            /*this.player.play().then(() => {
                this.player.pause();
                $isAudioPlayingInfo.style.backgroundColor = 'green'
                $isAudioPlayingInfo.textContent = 'playing song OK'
            }).catch((error) => {
                console.error(error)
                $isAudioPlayingInfo.style.backgroundColor = 'red'
                $isAudioPlayingInfo.textContent = error.message
            })*/
        }, 500)

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

            this.player.play(playOptions)

        }

        if ($button.id === 'js-next-button') {

            const playOptions: IPlayOptions = {
                whichSound: PlayerCore.PLAY_SOUND_NEXT
            }

            this.player.play(playOptions)

        }

        if ($button.id === 'js-mute-toggle-button') {

            const playerMuted = this.player.isMuted()

            switch (playerMuted) {
                // is not muted
                case false:
                    this.player.mute()
                    break
                // is muted
                case true:
                    this.player.unMute()
                    break
            }

            this._switchMuteIcon(playerMuted)

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

        this._volumeNumber.textContent = value.toString()

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
            this.player.play({ whichSound: 'first' })
        }

        if ($button.id === 'js-last') {
            this.player.play({ whichSound: 'last' })
        }

        if ($button.id.substring(0, 7) === 'js-byId') {
            const songId = $button.getAttribute('data-song-id');
            const songPlayTimeOffset = $button.getAttribute('data-song-play-time-offset');
            if (songPlayTimeOffset !== null) {
                this.player.play({ whichSound: parseInt(songId), playTimeOffset: parseInt(songPlayTimeOffset) });
            } else {
                this.player.play({ whichSound: parseInt(songId) });
            }
        }

        if ($button.id === 'pause') {
            this.player.pause()
        }

        if ($button.id === 'stop') {
            this.player.stop()
        }

        if ($button.id === 'unLock') {
            this.player.manuallyUnlockAudio()
        }

        if ($button.id === 'disconnect') {
            this.player.disconnect()
        }

    }

    public changePlayingProgress(percentage: number, currentValue: number): void {
        this._playingProgressBar.value = percentage.toString()
        this._playTime.textContent = this._secondsToTimeDisplay(currentValue)
    }

    public changeLoadingProgress(percentage: number): void {
        this._loadingProgressBar.value = percentage.toString()
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

    protected _switchMuteIcon(mutedState: boolean): void {

        const $muteIcon = document.getElementById('js-mute')
        const $unMuteIcon = document.getElementById('js-unmute')

        switch (mutedState) {
            // is muted?
            case true:
                $muteIcon.classList.remove('hidden')
                $unMuteIcon.classList.add('hidden')
                break
            // is paused
            case false:
                $muteIcon.classList.add('hidden')
                $unMuteIcon.classList.remove('hidden')
                break
        }

    }

    protected _secondsToTimeDisplay = (duration: number) => {
        const minutes = Math.floor(duration / 60)
        const seconds = Math.floor(duration % 60)
        const secondsTwoDecimal = seconds < 10 ? `0${seconds}` : `${seconds}`
        return `${minutes}:${secondsTwoDecimal}`
    }

    public setToPlay(duration?: number): void {
        this._switchPlayerContext('off')
        if (typeof duration !== 'undefined') {
            this._durationTime.textContent = this._secondsToTimeDisplay(duration)
        }
    }

    public setToStop(): void {
        this._switchPlayerContext('on')
    }

    protected _destroyListeners(): void {

        this._buttonsBox.removeEventListener('click', this._onClickButtonsBox.bind(this))
        this._volumeSlider.removeEventListener('change', this._onInputVolume.bind(this))
        this._playingProgressBar.removeEventListener('click', this._onInputPlayingProgress.bind(this))
        this._extraButtons.removeEventListener('click', this._onClickExtraButtons.bind(this))

        this._buttonsBox = null
        this._volumeSlider = null
        this._playingProgressBar = null
        this._playTime = null
        this._durationTime = null
        this._volumeNumber = null

    }

    public deconstructor(): void {
        this._destroyListeners()
    }

}

export { PlayerUI }

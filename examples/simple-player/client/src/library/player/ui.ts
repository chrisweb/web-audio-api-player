import { PlayerCore, IPlayOptions } from '../../../../../../dist/index.js'

interface IPlaylistTrack {
    song_title: string,
    album_name: string,
    artist_name: string,
    web: string,
    license: string,
    ogg: string,
    mp3: string,
    album_cover: string,
    id: string,
}

class PlayerUI {

    public player: PlayerCore
    public playlist: IPlaylistTrack[]

    protected _buttonsBox: HTMLElement
    protected _volumeSlider: HTMLInputElement
    protected _loadingProgressBar: HTMLInputElement
    protected _playingProgressBar: HTMLInputElement
    protected _extraButtons: HTMLElement
    protected _playTime: HTMLElement
    protected _durationTime: HTMLElement
    protected _volumeNumber: HTMLElement

    constructor(player: PlayerCore, playlist: IPlaylistTrack[]) {
        this.player = player
        this.playlist = playlist
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

        // show first song data even though it is not yet loaded
        this.updateSongInfo('song1')

        // in firefox it puts the handler in the middle
        // even though the value is zero
        this._playingProgressBar.value = '0'

    }

    public updateSongInfo(songId: string) {

        const playlistTrackInfo = this.playlist.find((songData) => {
            return songId === songData.id
        });

        const albumCoverElement = document.getElementById('js-album_cover') as HTMLImageElement

        albumCoverElement.src = 'http://127.0.0.1:35000/static/music/' + playlistTrackInfo.album_cover

        const songDetailsElement = document.getElementById('js-song-details') as HTMLDivElement
        const songWebElement = document.getElementById('js-song-web') as HTMLAnchorElement
        const songLicenseElement = document.getElementById('js-song-license') as HTMLAnchorElement

        songDetailsElement.textContent = `Current song: ${playlistTrackInfo.song_title} by ${playlistTrackInfo.artist_name}`

        songWebElement.href = playlistTrackInfo.web
        songWebElement.textContent = playlistTrackInfo.web

        songLicenseElement.href = playlistTrackInfo.license
        songLicenseElement.textContent = playlistTrackInfo.license

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

        let $button = event.target as HTMLElement

        if ($button.localName === 'span') {
            $button = $button.parentElement
        }

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
                this.player.play({ whichSound: songId, playTimeOffset: parseInt(songPlayTimeOffset) });
            } else {
                this.player.play({ whichSound: songId });
            }
        }

        if ($button.id === 'js-stop') {
            this.player.stop()
        }

        if ($button.id === 'js-loop-song') {
            const currentSound = this.player.getCurrentSound()
            if (currentSound.getLoop()) {
                currentSound.setLoop(false)
            } else {
                currentSound.setLoop(true)
            }
            this._updateLoopSong()
        }

        if ($button.id === 'js-loop-queue') {
            if (this.player.getLoopQueue()) {
                this.player.setLoopQueue(false)
            } else {
                this.player.setLoopQueue(true)
            }
            this._updateLoopQueue()
        }

        if ($button.id === 'js-disconnect') {
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

    protected _updateLoopQueue(): void {

        const isLoopQueue = this.player.getLoopQueue()
        const $loopQueueOn = document.getElementById('js-loop-queue-on')
        const $loopQueueOff = document.getElementById('js-loop-queue-off')

        if (isLoopQueue) {
            $loopQueueOn.classList.remove('hidden')
            $loopQueueOff.classList.add('hidden')
        } else {
            $loopQueueOn.classList.add('hidden')
            $loopQueueOff.classList.remove('hidden')
        }

    }

    protected _updateLoopSong(): void {

        const isLoopSound = this.player.getCurrentSound().getLoop()
        const $loopSongOn = document.getElementById('js-loop-song-on')
        const $loopSongOff = document.getElementById('js-loop-song-off')

        if (isLoopSound) {
            $loopSongOn.classList.remove('hidden')
            $loopSongOff.classList.add('hidden')
        } else {
            $loopSongOn.classList.add('hidden')
            $loopSongOff.classList.remove('hidden')
        }

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

    public refresh(): void {
        
        this._updateLoopQueue()
        this._updateLoopSong()

    }

    public deconstructor(): void {
        this._destroyListeners()
    }

}

export { PlayerUI }

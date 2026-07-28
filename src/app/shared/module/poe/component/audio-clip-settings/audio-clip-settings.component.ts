import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy } from '@angular/core'
import { environment } from '@env/environment'
import { SnackBarService } from '@shared/module/material/service'
import { AudioClipSettings } from '@shared/module/poe/type/audioclip.type'

interface AudioData {
  clip: HTMLAudioElement
  isPlaying: boolean // Explicitly keeping track of this ourselves because the clip doesn't update its variables on time.
  endedEventHandler: any
}

@Component({
  selector: 'app-audio-clip-settings',
  templateUrl: './audio-clip-settings.component.html',
  styleUrls: ['./audio-clip-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AudioClipSettingsComponent implements OnDestroy {
  @Input()
  public settings: AudioClipSettings

  @Input()
  public title: string

  public audioData: AudioData

  constructor(
    private readonly ref: ChangeDetectorRef,
    private readonly snackbarService: SnackBarService,
  ) {
  }

  ngOnDestroy(): void {
    const audioData = this.audioData
    if (audioData) {
      const audioClip = audioData.clip
      if (!audioClip.ended || audioData.isPlaying) {
        audioClip.pause()
      }
      audioClip.removeEventListener('ended', audioData.endedEventHandler)
      audioClip.remove()
    }
  }

  public getRoundedPercentage = (value: number) => `${Math.round(value * 100)}%`

  public onPlayOrStopAudioClick(): void {
    const audioData = this.audioData
    let audioClip: HTMLAudioElement
    if (!audioData) {
      if (!this.settings.src) {
        this.snackbarService.error('settings.audio.invalid-source')
        return
      }
      audioClip = new Audio()
      const scopedEndedEvent = () => {
        this.audioData.isPlaying = false
        this.ref.detectChanges()
      }
      audioClip.addEventListener('ended', scopedEndedEvent)
      this.audioData = {
        clip: audioClip,
        isPlaying: false,
        endedEventHandler: scopedEndedEvent
      }
    } else {
      audioClip = audioData.clip
    }
    audioClip.volume = this.settings.volume
    if (audioClip.currentTime === 0 || audioClip.ended) {
      audioClip.src = this.settings.src
      audioClip.play()
        .then(() => {
          this.audioData.isPlaying = true
          this.ref.detectChanges()
        })
        .catch((error) => {
          if (!environment.production) {
            console.log(`[AudioClip] Error playing audio: ${error}`)
          }
          this.snackbarService.error('settings.audio.invalid-source')
        })
    } else {
      audioClip.pause()
      audioClip.currentTime = 0
    }
  }
}

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, NgZone, OnDestroy } from '@angular/core'
import { ColorUtils, EnumValues } from '@app/class'
import { WindowService } from '@app/service'
import { UserSettingsComponent } from '@layout/type'
import { TradeCompanionStashGridService } from '@shared/module/poe/service/trade-companion/trade-companion-stash-grid.service'
import { TradeNotificationsService } from '@shared/module/poe/service/trade-companion/trade-notifications.service'
import {
    AudioClipSettings,
    DefaultAskIfStillInterestedMessage,
    ExampleNotificationType,
    StashGridMode,
    StashGridType,
    TradeCompanionStashGridOptions,
    TradeCompanionUserSettings,
    TradeNotificationAutoCollapseType
} from '@shared/module/poe/type/trade-companion.type'
import { SnackBarService } from '../../../../shared/module/material/service'

@Component({
  selector: 'app-trade-companion-settings',
  templateUrl: './trade-companion-settings.component.html',
  styleUrls: ['./trade-companion-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradeCompanionSettingsComponent implements UserSettingsComponent, OnDestroy {
  @Input()
  public settings: TradeCompanionUserSettings

  public stashGridTypes = new EnumValues(StashGridType)
  public autoCollapseTypes = new EnumValues(TradeNotificationAutoCollapseType)

  public exampleNotificationTypes = new EnumValues(ExampleNotificationType)

  public ColorUtils = ColorUtils

  public audioClips: {
    [name: string]: {
      clip: HTMLAudioElement
      isPlaying: boolean // Explicitly keeping track of this ourselves because the clip doesn't update its variables on time.
      endedEventHandler: any
    }
  } = {}

  private isShowingStashGrid = false

  constructor(
    private readonly ref: ChangeDetectorRef,
    private readonly window: WindowService,
    private readonly stashGridDialogService: TradeCompanionStashGridService,
    private readonly tradeNotificationsService: TradeNotificationsService,
    private readonly snackbarService: SnackBarService,
  ) {
    this.window.on('show').subscribe(() => {
      if (this.isShowingStashGrid) {
        this.stashGridDialogService.editStashGrid(null)
      }
    })
  }

  ngOnDestroy(): void {
    for (const name in this.audioClips) {
      const audioData = this.audioClips[name]
      if (audioData) {
        const audioClip = audioData.clip
        if (!audioClip.ended || audioData.isPlaying) {
          audioClip.pause()
        }
        audioClip.removeEventListener('ended', audioData.endedEventHandler)
        audioClip.remove()
      }
    }
  }

  public load(): void {}

  public getRoundedPercentage = (value: number) => `${Math.round(value * 100)}%`

  public isPlaying(name: string): boolean {
    const audioData = this.audioClips[name]
    if (!audioData) {
      return false
    }
    return audioData.isPlaying
  }

  public onResetTradeCompanionBoundsClick(): void {
    const bounds = this.window.getOffsettedGameBounds()
    bounds.width = bounds.height = 0
    this.settings.tradeCompanionBounds = bounds
  }

  public onResetAreYouStillInterestedMessageClick(): void {
    this.settings.askIfStillInterestedMessage = DefaultAskIfStillInterestedMessage
  }

  public onEditStashGridClick(gridType: StashGridType): void {
    const options: TradeCompanionStashGridOptions = {
      gridMode: StashGridMode.Edit,
      gridType,
      gridBounds: this.settings.stashGridBounds[gridType],
      settings: this.settings,
    }
    this.isShowingStashGrid = true
    this.window.hide()
    this.stashGridDialogService.editStashGrid(options).subscribe((stashGridBounds) => {
      this.isShowingStashGrid = false
      if (stashGridBounds) {
        this.settings.stashGridBounds[gridType] = stashGridBounds
      }
      this.window.show()
    })
  }

  public onPreviewStashGridClick(gridType: StashGridType): void {
    const options: TradeCompanionStashGridOptions = {
      gridMode: StashGridMode.Preview,
      gridType,
      gridBounds: this.settings.stashGridBounds[gridType],
      highlightLocation: {
        tabName: '[Tab Name]',
        bounds: {
          x: 6,
          y: 3,
          width: 2,
          height: 3,
        },
      },
      settings: this.settings,
    }
    this.isShowingStashGrid = true
    this.window.hide()
    this.stashGridDialogService.showStashGrid(options).subscribe(() => {
      this.isShowingStashGrid = false
      this.window.show()
    })
  }

  public onAddExampleTradeNotificationClick(
    exampleNotificationType: ExampleNotificationType
  ): void {
    this.tradeNotificationsService.addExampleTradeNotification(exampleNotificationType)
  }

  public onAddIncomingTradeOptionClick(): void {
    this.settings.incomingTradeOptions.push({
      buttonLabel: '1 min',
      whisperMessage: '1 minute please',
      kickAfterWhisper: false,
      dismissNotification: false,
    })
  }

  public onRemoveIncomingTradeOptionClick(index: number): void {
    this.settings.incomingTradeOptions.splice(index, 1)
  }

  public onAddOutgoingTradeOptionClick(): void {
    this.settings.outgoingTradeOptions.push({
      buttonLabel: 'thx',
      whisperMessage: 'Thank you very much!',
      kickAfterWhisper: false,
      dismissNotification: false,
    })
  }

  public onRemoveOutgoingTradeOptionClick(index: number): void {
    this.settings.outgoingTradeOptions.splice(index, 1)
  }

  public onPlayOrStopAudioClick(name: string, audioSettings: AudioClipSettings): void {
    const audioData = this.audioClips[name]
    let audioClip: HTMLAudioElement
    if (!audioData) {
      if (!audioSettings.src) {
        this.snackbarService.error('trade-companion.audio.invalid-source')
        return
      }
      audioClip = new Audio()
      const scopedEndedEvent = () => {
        this.audioClips[name].isPlaying = false
        this.ref.detectChanges()
      }
      audioClip.addEventListener('ended', scopedEndedEvent)
      this.audioClips[name] = {
        clip: audioClip,
        isPlaying: false,
        endedEventHandler: scopedEndedEvent
      }
    } else {
      audioClip = audioData.clip
    }
    audioClip.volume = audioSettings.volume
    if (audioClip.currentTime === 0 || audioClip.ended) {
      audioClip.src = audioSettings.src
      audioClip.play()
        .then(() => {
          this.audioClips[name].isPlaying = true
          this.ref.detectChanges()
        })
        .catch(() => this.snackbarService.error('trade-companion.audio.invalid-source'))
    } else {
      audioClip.pause()
      audioClip.currentTime = 0
    }
  }
}

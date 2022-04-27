import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy } from '@angular/core'
import { ColorUtils, EnumValues } from '@app/class'
import { WindowService } from '@app/service'
import { UserSettingsComponent } from '@layout/type'
import { TradeCompanionStashGridService } from '@shared/module/poe/service/trade-companion/trade-companion-stash-grid.service'
import { TradeNotificationsService } from '@shared/module/poe/service/trade-companion/trade-notifications.service'
import {
    DefaultAskIfStillInterestedMessage,
    ExampleNotificationType,
    StashGridMode,
    StashGridType,
    TradeCompanionStashGridOptions,
    TradeCompanionUserSettings,
    TradeNotificationAutoCollapseType
} from '@shared/module/poe/type/trade-companion.type'
import { SnackBarService } from '@shared/module/material/service'

@Component({
  selector: 'app-trade-companion-settings',
  templateUrl: './trade-companion-settings.component.html',
  styleUrls: ['./trade-companion-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradeCompanionSettingsComponent implements UserSettingsComponent {
  @Input()
  public settings: TradeCompanionUserSettings

  @Input()
  public defaultSettings: TradeCompanionUserSettings

  public stashGridTypes = new EnumValues(StashGridType)
  public autoCollapseTypes = new EnumValues(TradeNotificationAutoCollapseType)

  public exampleNotificationTypes = new EnumValues(ExampleNotificationType)

  public ColorUtils = ColorUtils

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

  public load(): void {}

  public getRoundedPercentage = (value: number) => `${Math.round(value * 100)}%`

  public onResetTradeCompanionBoundsClick(): void {
    const bounds = this.window.getOffsettedGameBounds(false)
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
}

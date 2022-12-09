import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core'
import { ColorUtils, EnumValues } from '@app/class'
import { WindowService } from '@app/service'
import { UserSettingsComponent } from '@layout/type'
import { SnackBarService } from '@shared/module/material/service'
import { TradeNotificationsService } from '@shared/module/poe/service/trade-companion/trade-notifications.service'
import {
    DefaultAskIfStillInterestedMessage,
    ExampleNotificationType,
    TradeCompanionUserSettings,
    TradeNotificationAutoCollapseType
} from '@shared/module/poe/type/trade-companion.type'

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

  public autoCollapseTypes = new EnumValues(TradeNotificationAutoCollapseType)

  public exampleNotificationTypes = new EnumValues(ExampleNotificationType)

  constructor(
    private readonly window: WindowService,
    private readonly tradeNotificationsService: TradeNotificationsService,
  ) {
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

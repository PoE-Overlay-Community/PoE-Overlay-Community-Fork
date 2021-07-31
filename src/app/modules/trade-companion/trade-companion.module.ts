import { NgModule } from '@angular/core'
import { Color, Colors, ColorUtils } from '@app/class'
import { FEATURE_MODULES } from '@app/token'
import { Feature, FeatureModule } from '@app/type'
import { DefaultAskIfStillInterestedMessage, TradeCompanionUserSettings, TradeNotificationAutoCollapseType } from '@shared/module/poe/type/trade-companion.type'
import { SharedModule } from '@shared/shared.module'
import { UserSettingsFeature } from 'src/app/layout/type'
import { TradeCompanionStashGridComponent } from './component/stash-grid/trade-companion-stash-grid.component'
import { TradeCompanionSettingsComponent } from './component/trade-companion-settings/trade-companion-settings.component'
import { TradeNotificationComponent } from './component/trade-notification/trade-notification.component'
import { TradeNotificationPanelComponent } from './component/trade-notifications-panel/trade-notifications-panel.component'

@NgModule({
  providers: [{ provide: FEATURE_MODULES, useClass: TradeCompanionModule, multi: true }],
  declarations: [
    TradeCompanionSettingsComponent,
    TradeCompanionStashGridComponent,
    TradeNotificationComponent,
    TradeNotificationPanelComponent,
  ],
  imports: [SharedModule],
  exports: [TradeCompanionStashGridComponent, TradeNotificationPanelComponent],
})
export class TradeCompanionModule implements FeatureModule {
  constructor() {}

  public getSettings(): UserSettingsFeature {
    const maxVisibileTradeNotifications = 8
    const defaultSettings: TradeCompanionUserSettings = {
      tradeCompanionEnabled: false,
      tradeCompanionOpacity: 1.0,
      maxVisibileTradeNotifications,
      incomingTradeOptions: [
        {
          buttonLabel: '1m',
          whisperMessage: '1 minute please.',
          kickAfterWhisper: false,
          dismissNotification: false,
        },
        {
          buttonLabel: 'thx',
          whisperMessage: 'Thank you very much.',
          kickAfterWhisper: true,
          dismissNotification: true,
        },
        {
          buttonLabel: 'sold',
          whisperMessage: 'Sorry, already sold.',
          kickAfterWhisper: true,
          dismissNotification: true,
        },
      ],
      outgoingTradeOptions: [
        {
          buttonLabel: 'thx',
          whisperMessage: 'Thank you very much.',
          kickAfterWhisper: true,
          dismissNotification: true,
        },
      ],
      stashGridBounds: [
        {
          x: 16,
          y: 134,
          width: 624, // 12*52px
          height: 624,
        },
        {
          x: 16,
          y: 134,
          width: 624, // 24*26px
          height: 624,
        },
      ],
      stashGrids: new Map(),
      stashGridColors: {
        gridLine: ColorUtils.create(0, 0, 0, 0.65),
        gridOutline: Colors.yellow,
        gridBackground: Colors.transparent,
        highlightLine: Colors.yellow,
        highlightBackground: Colors.transparent,
      },
      showStashGridOnInvite: true,
      hideStashGridOnTrade: true,
      reversedNotificationHorizontalAlignment: false,
      reversedNotificationDirection: false,
      buttonClickAudio: {
        enabled: false,
        volume: 1,
      },
      incomingTradeMessageAudio: {
        enabled: false,
        volume: 1,
      },
      autoCollapseIncomingTradeNotifications: TradeNotificationAutoCollapseType.None,
      autoCollapseOutgoingTradeNotifications: TradeNotificationAutoCollapseType.None,
      tradeNotificationKeybindings: {},
      activeTradeNotificationBorderColor: Colors.yellow,
      askIfStillInterestedMessage: DefaultAskIfStillInterestedMessage
    }
    return {
      name: 'trade-companion.name',
      component: TradeCompanionSettingsComponent,
      defaultSettings,
      visualPriority: 90,
    }
  }

  public getFeatures(settings: TradeCompanionUserSettings): Feature[] {
    // No specific features of the Trade Companion support short-cuts atm.
    return []
  }

  public run(feature: string, settings: TradeCompanionUserSettings): void {
    // Nothing specific has to run for this feature
  }
}

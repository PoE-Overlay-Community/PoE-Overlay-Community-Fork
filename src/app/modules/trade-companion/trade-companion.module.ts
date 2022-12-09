import { NgModule } from '@angular/core'
import { Colors } from '@app/class'
import { FEATURE_MODULES } from '@app/token'
import { Feature, FeatureModule } from '@app/type'
import { DefaultAskIfStillInterestedMessage, TradeCompanionUserSettings, TradeNotificationAutoCollapseType } from '@shared/module/poe/type/trade-companion.type'
import { SharedModule } from '@shared/shared.module'
import { UserSettingsFeature } from 'src/app/layout/type'
import { TradeCompanionSettingsComponent } from './component/trade-companion-settings/trade-companion-settings.component'
import { TradeNotificationComponent } from './component/trade-notification/trade-notification.component'
import { TradeNotificationPanelComponent } from './component/trade-notifications-panel/trade-notifications-panel.component'

@NgModule({
  providers: [{ provide: FEATURE_MODULES, useClass: TradeCompanionModule, multi: true }],
  declarations: [
    TradeCompanionSettingsComponent,
    TradeNotificationComponent,
    TradeNotificationPanelComponent,
  ],
  imports: [SharedModule],
  exports: [TradeNotificationPanelComponent],
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

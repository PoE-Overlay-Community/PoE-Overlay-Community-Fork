import { NgModule, Injectable } from '@angular/core'
import { FEATURE_MODULES } from '@app/token'
import { Feature, FeatureModule } from '@app/type'
import { SharedModule } from '@shared/shared.module'
import { UserSettingsFeature } from 'src/app/layout/type'
import { TradeCompanionSettingsComponent, TradeCompanionUserSettings } from './component/trade-companion-settings/trade-companion-settings.component'

@NgModule({
  providers: [{ provide: FEATURE_MODULES, useClass: TradeCompanionModule, multi: true }],
  declarations: [TradeCompanionSettingsComponent],
  imports: [SharedModule],
})
export class TradeCompanionModule implements FeatureModule {
  constructor() { }

  public getSettings(): UserSettingsFeature {
    const defaultSettings: TradeCompanionUserSettings = {
      tradeCompanionEnabled: false,
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
      normalStashGrid: {
        x: 16,
        y: 134,
        width: 624,//12*52px
        height: 624,
      },
      quadStashGrid: {
        x: 16,
        y: 134,
        width: 624,//24*26px
        height: 624,
      },
      showStashGridOnTrade: true,
      highlightItemOnTrade: true,
      showStashGridDropShadow: true
    }
    return {
      name: 'trade-companion.name',
      component: TradeCompanionSettingsComponent,
      defaultSettings,
    }
  }

  public getFeatures(settings: TradeCompanionUserSettings): Feature[] {
    return []
  }

  public run(feature: string, settings: TradeCompanionUserSettings): void {
  }
}
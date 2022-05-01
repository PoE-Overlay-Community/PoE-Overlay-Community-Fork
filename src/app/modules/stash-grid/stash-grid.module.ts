import { NgModule } from '@angular/core'
import { Colors, ColorUtils } from '@app/class'
import { FEATURE_MODULES } from '@app/token'
import { Feature, FeatureModule } from '@app/type'
import { StashGridUserSettings } from '@shared/module/poe/type/stash-grid.type'
import { SharedModule } from '@shared/shared.module'
import { UserSettingsFeature } from 'src/app/layout/type'
import { StashGridSettingsComponent } from './component/stash-grid-settings/stash-grid-settings.component'
import { StashGridComponent } from './component/stash-grid/stash-grid.component'

@NgModule({
  providers: [{ provide: FEATURE_MODULES, useClass: StashGridModule, multi: true }],
  declarations: [
    StashGridSettingsComponent,
    StashGridComponent,
  ],
  imports: [SharedModule],
  exports: [StashGridComponent],
})
export class StashGridModule implements FeatureModule {
  constructor() { }

  public getSettings(): UserSettingsFeature {
    const defaultSettings: StashGridUserSettings = {
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
        highlightText: Colors.white,
      },
    }
    return {
      name: 'stash-grid.name',
      component: StashGridSettingsComponent,
      defaultSettings,
      visualPriority: 40,
    }
  }

  public getFeatures(settings: StashGridUserSettings): Feature[] {
    // No specific features of this feature short-cuts atm.
    return []
  }

  public run(feature: string, settings: StashGridUserSettings): void {
    // Nothing specific has to run for this feature
  }
}

import { NgModule } from '@angular/core'
import { FEATURE_MODULES } from '@app/token'
import { Feature, FeatureModule } from '@app/type'
import { DefaultRecipeSettings, VendorRecipeType, VendorRecipeUserSettings } from '@shared/module/poe/type/vendor-recipe.type'
import { SharedModule } from '@shared/shared.module'
import { UserSettingsFeature } from 'src/app/layout/type'
import { VendorRecipeItemSetSettingsComponent } from './component/item-set-recipe-settings/item-set-recipe-settings.component'
import { VendorRecipeQualitySettingsComponent } from './component/quality-recipe-settings/quality-recipe-settings.component'
import { VendorRecipePanelComponent } from './component/vendor-recipe-panel/vendor-recipe-panel.component'
import { VendorRecipeSettingsComponent } from './component/vendor-recipe-settings/vendor-recipe-settings.component'
import { VendorRecipesPanelComponent } from './component/vendor-recipes-panel/vendor-recipes-panel.component'
import { VendorRecipesSettingsComponent } from './component/vendor-recipes-settings/vendor-recipes-settings.component'

@NgModule({
  providers: [{ provide: FEATURE_MODULES, useClass: VendorRecipeModule, multi: true }],
  declarations: [
    VendorRecipesSettingsComponent,
    VendorRecipeSettingsComponent,
    VendorRecipeItemSetSettingsComponent,
    VendorRecipeQualitySettingsComponent,
    VendorRecipesPanelComponent,
    VendorRecipePanelComponent,
  ],
  imports: [SharedModule],
  exports: [VendorRecipesPanelComponent],
})
export class VendorRecipeModule implements FeatureModule {
  constructor() { }

  public getSettings(): UserSettingsFeature {
    const defaultSettings: VendorRecipeUserSettings = {
      vendorRecipePanelSettings: {
        enabled: false,
        backgroundOpacity: 0.05,
      },
      vendorRecipeSettings: [
        DefaultRecipeSettings[VendorRecipeType.Chaos],
        DefaultRecipeSettings[VendorRecipeType.ExaltedShard],
        DefaultRecipeSettings[VendorRecipeType.Gemcutter],
      ],
    }
    return {
      name: 'vendor-recipe.name',
      component: VendorRecipesSettingsComponent,
      defaultSettings,
      visualPriority: 80,
    }
  }

  public getFeatures(settings: VendorRecipeUserSettings): Feature[] {
    // No specific features of the Vendor Recipe support short-cuts atm.
    return []
  }

  public run(feature: string, settings: VendorRecipeUserSettings): void {
    // Nothing specific has to run for this feature
  }
}

import { NgModule } from '@angular/core'
import { FEATURE_MODULES } from '@app/token'
import { Feature, FeatureModule } from '@app/type'
import { DefaultChaosRecipeSettings, DefaultExaltedShardRecipeSettings, ItemLevelBasedItemSetRecipeUserSettings, ItemSetGroup, ItemSetRecipeUserSettings, RecipeHighlightMode, RecipeHighlightOrder, StashTabSearchMode, VendorRecipeType, VendorRecipeUserSettings } from '@shared/module/poe/type/vendor-recipe.type'
import { SharedModule } from '@shared/shared.module'
import { UserSettingsFeature } from 'src/app/layout/type'
import { Colors } from '@app/class'
import { VendorRecipeSettingsComponent } from './component/vendor-recipe-settings/vendor-recipe-settings.component'
import { VendorRecipeItemSetSettingsComponent } from './component/item-set-recipe-settings/item-set-recipe-settings.component'
import { ItemSetRecipePanelComponent } from './component/item-set-recipe-panel/item-set-recipe-panel.component'
import { VendorRecipePanelComponent } from './component/vendor-recipe-panel/vendor-recipe-panel.component'

@NgModule({
  providers: [{ provide: FEATURE_MODULES, useClass: VendorRecipeModule, multi: true }],
  declarations: [
    VendorRecipeSettingsComponent,
    VendorRecipeItemSetSettingsComponent,
    VendorRecipePanelComponent,
    ItemSetRecipePanelComponent,
  ],
  imports: [SharedModule],
  exports: [VendorRecipePanelComponent],
})
export class VendorRecipeModule implements FeatureModule {
  constructor() { }

  public getSettings(): UserSettingsFeature {
    const defaultSettings: VendorRecipeUserSettings = {
      vendorRecipeItemSetPanelSettings: {
        enabled: false,
        backgroundOpacity: 0.05,
      },
      vendorRecipeItemSetSettings: [
        DefaultChaosRecipeSettings,
        DefaultExaltedShardRecipeSettings,
      ],
    }
    return {
      name: 'vendor-recipe.name',
      component: VendorRecipeSettingsComponent,
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

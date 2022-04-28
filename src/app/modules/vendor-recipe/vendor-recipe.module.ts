import { NgModule } from '@angular/core'
import { FEATURE_MODULES } from '@app/token'
import { Feature, FeatureModule } from '@app/type'
import { ItemSetGroup, RecipeHighlightMode, RecipeHighlightOrder, StashTabSearchMode, VendorRecipeUserSettings } from '@shared/module/poe/type/vendor-recipe.type'
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
      vendorRecipeChaosRecipeSettings: {
        enabled: true,
        itemThreshold: 5,
        fullSetThreshold: 5,
        separateQualityItems: false,
        fillGreedy: false,
        useIdentifiedItems: false,
        stashTabSearchMode: StashTabSearchMode.Prefix,
        stashTabSearchValue: 'Ch',
        showItemAmounts: true,
        highlightMode: RecipeHighlightMode.ItemByItem,
        highlightOrder: RecipeHighlightOrder.LargeToSmall,
        groupWeaponsTogether: true,
        itemClassColors: [
          {
            group: ItemSetGroup.Helmets,
            showOnOverlay: true,
            color: Colors.yellow,
          },
          {
            group: ItemSetGroup.Chests,
            showOnOverlay: true,
            color: Colors.magenta,
          },
          {
            group: ItemSetGroup.Gloves,
            showOnOverlay: true,
            color: Colors.lightgreen,
          },
          {
            group: ItemSetGroup.Boots,
            showOnOverlay: true,
            color: Colors.royalblue,
          },
          {
            group: ItemSetGroup.Belts,
            showOnOverlay: true,
            color: Colors.red,
          },
          {
            group: ItemSetGroup.Amulets,
            showOnOverlay: true,
            color: Colors.red,
          },
          {
            group: ItemSetGroup.Rings,
            showOnOverlay: true,
            color: Colors.red,
          },
          {
            group: ItemSetGroup.TwoHandedWeapons,
            showOnOverlay: true,
            color: Colors.cyan,
          },
          {
            group: ItemSetGroup.OneHandedWeapons,
            showOnOverlay: true,
            color: Colors.cyan,
          },
        ],
        recipeCompleteAudio: {
          enabled: false,
          volume: 1,
        },
        itemThresholdAudio: {
          enabled: false,
          volume: 1,
        },
        fullSetThresholdAudio: {
          enabled: false,
          volume: 1,
        },
      },
      vendorRecipeExaltedShardRecipeSettings: {
        enabled: false,
        itemThreshold: 5,
        fullSetThreshold: 5,
        useIdentifiedItems: true,
        stashTabSearchMode: StashTabSearchMode.Prefix,
        stashTabSearchValue: 'Ex',
        showItemAmounts: true,
        highlightMode: RecipeHighlightMode.ItemByItem,
        highlightOrder: RecipeHighlightOrder.LargeToSmall,
        groupWeaponsTogether: true,
        itemClassColors: [
          {
            group: ItemSetGroup.Helmets,
            showOnOverlay: true,
            color: Colors.yellow,
          },
          {
            group: ItemSetGroup.Chests,
            showOnOverlay: true,
            color: Colors.magenta,
          },
          {
            group: ItemSetGroup.Gloves,
            showOnOverlay: true,
            color: Colors.lightgreen,
          },
          {
            group: ItemSetGroup.Boots,
            showOnOverlay: true,
            color: Colors.royalblue,
          },
          {
            group: ItemSetGroup.Belts,
            showOnOverlay: true,
            color: Colors.red,
          },
          {
            group: ItemSetGroup.Amulets,
            showOnOverlay: true,
            color: Colors.red,
          },
          {
            group: ItemSetGroup.Rings,
            showOnOverlay: true,
            color: Colors.red,
          },
          {
            group: ItemSetGroup.TwoHandedWeapons,
            showOnOverlay: true,
            color: Colors.cyan,
          },
          {
            group: ItemSetGroup.OneHandedWeapons,
            showOnOverlay: true,
            color: Colors.cyan,
          },
        ],
        recipeCompleteAudio: {
          enabled: false,
          volume: 1,
        },
        itemThresholdAudio: {
          enabled: false,
          volume: 1,
        },
        fullSetThresholdAudio: {
          enabled: false,
          volume: 1,
        },
      }
    }
    return {
      name: 'vendor-recipe.name',
      component: VendorRecipeSettingsComponent,
      defaultSettings,
      visualPriority: 30,
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

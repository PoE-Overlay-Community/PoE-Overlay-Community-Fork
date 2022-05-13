import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { EnumValues } from '@app/class'
import { ItemLevelBasedItemSetRecipeUserSettings, ItemSetRecipeUserSettings, ItemUsageType, VendorRecipeType, VendorRecipeUserSettings } from '@shared/module/poe/type/vendor-recipe.type'

@Component({
  selector: 'app-vendor-recipe-item-set-settings',
  templateUrl: './item-set-recipe-settings.component.html',
  styleUrls: ['./item-set-recipe-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorRecipeItemSetSettingsComponent {
  @Input()
  public globalSettings: VendorRecipeUserSettings

  @Input()
  public settings: ItemSetRecipeUserSettings

  @Input()
  public defaultSettings: ItemSetRecipeUserSettings

  public get levelBasedSettings(): ItemLevelBasedItemSetRecipeUserSettings {
    return this.settings as ItemLevelBasedItemSetRecipeUserSettings
  }

  public VendorRecipeType = VendorRecipeType

  public itemUsageTypes = new EnumValues(ItemUsageType)

  constructor() { }
}

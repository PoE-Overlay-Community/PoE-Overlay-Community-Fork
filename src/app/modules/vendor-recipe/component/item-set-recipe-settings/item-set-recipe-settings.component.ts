import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core'
import { ItemGroupColor, ItemLevelBasedItemSetRecipeUserSettings, ItemSetGroup, ItemSetRecipeUserSettings, RecipeHighlightMode, RecipeHighlightOrder, StashTabSearchMode } from '@shared/module/poe/type/vendor-recipe.type'
import { AppTranslateService } from '@app/service'
import { ColorUtils, EnumValues } from '@app/class'

@Component({
  selector: 'app-vendor-recipe-item-set-settings',
  templateUrl: './item-set-recipe-settings.component.html',
  styleUrls: ['./item-set-recipe-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorRecipeItemSetSettingsComponent {
  @Input()
  public settings: ItemSetRecipeUserSettings

  @Input()
  public defaultSettings: ItemSetRecipeUserSettings

  @Output()
  public resetToDefault = new EventEmitter<any>()

  @Input()
  public title: string

  public ColorUtils = ColorUtils;

  public stashTabSearchModes = new EnumValues(StashTabSearchMode)

  public highlightModes = new EnumValues(RecipeHighlightMode)
  public highlightOrders = new EnumValues(RecipeHighlightOrder)
  public itemSetGroups = new EnumValues(ItemSetGroup)

  constructor(
    private readonly translate: AppTranslateService,
  ) {
  }

  public isItemLevelBasedItemSetSettings(settings: any): settings is ItemLevelBasedItemSetRecipeUserSettings {
    return (settings as ItemLevelBasedItemSetRecipeUserSettings).fillGreedy !== undefined
  }

  public getItemColorGroup(settings: ItemSetRecipeUserSettings, itemSetGroup: ItemSetGroup): ItemGroupColor {
    return settings.itemClassColors.find(x => x.group == itemSetGroup)
  }

  public getItemColorGroupName(itemSetGroup: ItemSetGroup): string {
    if (this.settings.groupWeaponsTogether && itemSetGroup === ItemSetGroup.OneHandedWeapons) {
      return "weapons"
    }
    return (this.itemSetGroups.values[itemSetGroup] as string).toLowerCase()
  }

  public canShowItemColorGroup(itemSetGroup: ItemSetGroup): boolean {
    if (itemSetGroup === ItemSetGroup.TwoHandedWeapons && this.settings.groupWeaponsTogether) {
      return false;
    }
    return true;
  }

  public onResetSettingsClick(): void {
    if (confirm(this.translate.get("settings.are-you-sure-reset", { featureName: this.title }))) {
      this.resetToDefault.emit()
    }
  }
}

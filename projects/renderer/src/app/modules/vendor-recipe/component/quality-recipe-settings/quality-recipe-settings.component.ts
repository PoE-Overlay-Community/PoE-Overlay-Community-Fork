import { ChangeDetectorRef, OnInit } from '@angular/core'
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core'
import { ColorUtils, EnumValues } from '@app/class'
import { AppTranslateService } from '@app/service'
import { CurrenciesProvider } from '@shared/module/poe/provider/currency/currencies.provider'
import { Currency } from '@shared/module/poe/type'
import { ItemGroupSettings, ItemLevelBasedItemSetRecipeUserSettings, RecipeItemGroup, ItemSetRecipeUserSettings, ItemUsageType, RecipeHighlightMode, RecipeHighlightOrder, StashTabSearchMode, VendorRecipeType, VendorRecipeUserSettings, RecipeItemGroups, QualityRecipeUserSettings } from '@shared/module/poe/type/vendor-recipe.type'
import { BehaviorSubject } from 'rxjs'

@Component({
  selector: 'app-vendor-recipe-quality-settings',
  templateUrl: './quality-recipe-settings.component.html',
  styleUrls: ['./quality-recipe-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorRecipeQualitySettingsComponent {
  @Input()
  public globalSettings: VendorRecipeUserSettings

  @Input()
  public settings: QualityRecipeUserSettings

  @Input()
  public defaultSettings: QualityRecipeUserSettings

  public bagSpacesList: number[] = Array.from(Array(60).keys()).map(x => x + 1)

  public VendorRecipeType = VendorRecipeType

  public itemUsageTypes = new EnumValues(ItemUsageType)

  constructor() { }
}

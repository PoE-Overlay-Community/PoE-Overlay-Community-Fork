import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import { ColorUtils, EnumValues } from '@app/class'
import { ofType } from '@app/function'
import { AppTranslateService } from '@app/service'
import { CurrenciesProvider } from '@shared/module/poe/provider/currency/currencies.provider'
import { Currency } from '@shared/module/poe/type'
import { DefaultRecipeSettings, ItemGroupSettings, ItemSetRecipeUserSettings, ItemUsageType, RecipeHighlightMode, RecipeHighlightOrder, RecipeItemGroup, RecipeItemGroups, RecipeUserSettings, StashTabSearchMode, VendorRecipeType, VendorRecipeUserSettings } from '@shared/module/poe/type/vendor-recipe.type'
import { BehaviorSubject } from 'rxjs'
import { VendorRecipeUtils } from '../../class/vendor-recipe-utils.class'

@Component({
  selector: 'app-vendor-recipe-settings',
  templateUrl: './vendor-recipe-settings.component.html',
  styleUrls: ['./vendor-recipe-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorRecipeSettingsComponent implements OnInit {
  @Input()
  public globalSettings: VendorRecipeUserSettings

  @Input()
  public identifier: number

  @Input()
  public settings: RecipeUserSettings

  @Input()
  public defaultSettings: RecipeUserSettings

  @Output()
  public resetToDefault = new EventEmitter<any>()

  @Output()
  public remove = new EventEmitter<any>()

  public collapsed = true

  public currencies$ = new BehaviorSubject<Currency[]>([])

  public get selectedLargeIcon(): Currency {
    return this.currencies$.value?.find(x => x.id === this.settings.largeIconId)
  }

  public get selectedSmallIcon(): Currency {
    return this.currencies$.value?.find(x => x.id === this.settings.smallIconId)
  }

  public VendorRecipeType = VendorRecipeType

  public ColorUtils = ColorUtils
  public RecipeItemGroup = RecipeItemGroup

  public stashTabSearchModes = new EnumValues(StashTabSearchMode)
  public itemUsageTypes = new EnumValues(ItemUsageType)
  public highlightModes = new EnumValues(RecipeHighlightMode)
  public highlightOrders = new EnumValues(RecipeHighlightOrder)
  public get recipeItemGroups(): RecipeItemGroup[] {
    const recipeItemGroups = RecipeItemGroups[this.settings.type]
    return recipeItemGroups
  }

  public get itemSetRecipeUserSettings(): ItemSetRecipeUserSettings {
    return VendorRecipeUtils.getItemSetRecipeUserSettings(this.settings)
  }

  constructor(
    private readonly translate: AppTranslateService,
    private readonly currenciesProvider: CurrenciesProvider
  ) {
  }

  ngOnInit(): void {
    this.load()
  }

  public load(): void {
    if (this.globalSettings.language) {
      this.updateCurrencies()
    }
  }

  public getIconBackgroundImage(currency: Currency): string {
    if (currency) {
      return 'url(https://web.poecdn.com' + currency.image + ')'
    }
    return ''
  }

  public getItemGroupSettings(recipeItemGroup: RecipeItemGroup): ItemGroupSettings {
    return this.settings.itemGroupSettings.find(x => x.group === recipeItemGroup)
  }

  public getDefaultItemGroupSettings(recipeItemGroup: RecipeItemGroup): ItemGroupSettings {
    const defaultRecipeSettings = DefaultRecipeSettings[this.settings.type]
    return defaultRecipeSettings.itemGroupSettings.find(x => x.group === recipeItemGroup)
  }

  public getItemGroupName(recipeItemGroup: RecipeItemGroup): string {
    return VendorRecipeUtils.getItemGroupName(this.settings, recipeItemGroup)
  }

  public canShowItemColorGroup(recipeItemGroup: RecipeItemGroup): boolean {
    if (recipeItemGroup === RecipeItemGroup.TwoHandedWeapons && this.itemSetRecipeUserSettings?.groupWeaponsTogether) {
      return false
    }
    return true
  }

  public onResetSettingsClick(): void {
    if (confirm(this.translate.get(`settings.are-you-sure-reset`, { featureName: `${(this.identifier + 1)}. ${this.translate.get(`vendor-recipe.settings.title.${VendorRecipeType[this.settings.type].toLowerCase()}`)}` }))) {
      this.resetToDefault.emit()
    }
  }

  private updateCurrencies(): void {
    this.currenciesProvider.provide(this.globalSettings.language).subscribe((currencies) => {
      this.currencies$.next(currencies.filter(x => x.image))
    })
  }
}

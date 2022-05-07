import { ChangeDetectorRef, OnInit } from '@angular/core'
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core'
import { ColorUtils, EnumValues } from '@app/class'
import { AppTranslateService } from '@app/service'
import { CurrenciesProvider } from '@shared/module/poe/provider/currency/currencies.provider'
import { Currency } from '@shared/module/poe/type'
import { ItemGroupColor, ItemLevelBasedItemSetRecipeUserSettings, ItemSetGroup, ItemSetRecipeUserSettings, ItemUsageType, RecipeHighlightMode, RecipeHighlightOrder, StashTabSearchMode, VendorRecipeType, VendorRecipeUserSettings } from '@shared/module/poe/type/vendor-recipe.type'
import { BehaviorSubject } from 'rxjs'

@Component({
  selector: 'app-vendor-recipe-item-set-settings',
  templateUrl: './item-set-recipe-settings.component.html',
  styleUrls: ['./item-set-recipe-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorRecipeItemSetSettingsComponent implements OnInit {
  @Input()
  public globalSettings: VendorRecipeUserSettings

  @Input()
  public identifier: number

  @Input()
  public settings: ItemSetRecipeUserSettings

  @Input()
  public defaultSettings: ItemSetRecipeUserSettings

  @Output()
  public resetToDefault = new EventEmitter<any>()

  @Output()
  public remove = new EventEmitter<any>()

  public get levelBasedSettings(): ItemLevelBasedItemSetRecipeUserSettings {
    return this.settings as ItemLevelBasedItemSetRecipeUserSettings
  }

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

  public stashTabSearchModes = new EnumValues(StashTabSearchMode)
  public itemUsageTypes = new EnumValues(ItemUsageType)
  public highlightModes = new EnumValues(RecipeHighlightMode)
  public highlightOrders = new EnumValues(RecipeHighlightOrder)
  public itemSetGroups = new EnumValues(ItemSetGroup)

  constructor(
    private readonly ref: ChangeDetectorRef,
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

  public getItemColorGroup(settings: ItemSetRecipeUserSettings, itemSetGroup: ItemSetGroup): ItemGroupColor {
    return settings.itemClassColors.find(x => x.group === itemSetGroup)
  }

  public getItemColorGroupName(itemSetGroup: ItemSetGroup): string {
    if (this.settings.groupWeaponsTogether && itemSetGroup === ItemSetGroup.OneHandedWeapons) {
      return "weapons"
    }
    return (this.itemSetGroups.values[itemSetGroup] as string).toLowerCase()
  }

  public canShowItemColorGroup(itemSetGroup: ItemSetGroup): boolean {
    if (itemSetGroup === ItemSetGroup.TwoHandedWeapons && this.settings.groupWeaponsTogether) {
      return false
    }
    return true
  }

  public onResetSettingsClick(): void {
    if (confirm(this.translate.get(`settings.are-you-sure-reset`, { featureName: `${(this.identifier + 1)}. ${this.translate.get(`vendor-recipe.item-set-settings.title.${VendorRecipeType[this.settings.type].toLowerCase()}`)}` }))) {
      this.resetToDefault.emit()
    }
  }

  private updateCurrencies(): void {
    this.currenciesProvider.provide(this.globalSettings.language).subscribe((currencies) => {
      this.currencies$.next(currencies.filter(x => x.image))
    })
  }
}

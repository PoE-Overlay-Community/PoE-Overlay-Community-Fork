import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, QueryList, SimpleChanges, ViewChildren } from '@angular/core'
import { EnumValues } from '@app/class'
import { WindowService } from '@app/service'
import { UserSettingsComponent } from '@layout/type'
import { DefaultChaosRecipeSettings, DefaultExaltedShardRecipeSettings, ItemSetRecipeUserSettings, VendorRecipeType, VendorRecipeUserSettings } from '@shared/module/poe/type/vendor-recipe.type'
import { VendorRecipeItemSetSettingsComponent } from '../item-set-recipe-settings/item-set-recipe-settings.component'

@Component({
  selector: 'app-vendor-recipe-settings',
  templateUrl: './vendor-recipe-settings.component.html',
  styleUrls: ['./vendor-recipe-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorRecipeSettingsComponent implements UserSettingsComponent, OnDestroy {
  @Input()
  public settings: VendorRecipeUserSettings

  @Input()
  public defaultSettings: VendorRecipeUserSettings

  @ViewChildren(VendorRecipeItemSetSettingsComponent)
  public itemSetRecipeSettingComponents: QueryList<VendorRecipeItemSetSettingsComponent>

  public vendorRecipeTypes = new EnumValues(VendorRecipeType)

  constructor(
    private readonly ref: ChangeDetectorRef,
    private readonly window: WindowService,
  ) {
  }

  ngOnDestroy(): void {
  }

  public load(): void {
    this.itemSetRecipeSettingComponents?.forEach(x => x.load())
  }

  public getRoundedPercentage = (value: number) => `${Math.round(value * 100)}%`

  public onResetItemSetPanelBoundsClick(): void {
    const bounds = this.window.getOffsettedGameBounds(false)
    bounds.width = bounds.height = 0
    this.settings.vendorRecipeItemSetPanelSettings.bounds = bounds
  }

  public getDefaultRecipeSettings(vendorRecipeType: VendorRecipeType): ItemSetRecipeUserSettings {
    switch (vendorRecipeType) {
      case VendorRecipeType.Chaos:
        return DefaultChaosRecipeSettings

      case VendorRecipeType.ExaltedShard:
        return DefaultExaltedShardRecipeSettings

      default:
        return undefined
    }
  }

  public onVendorRecipeSettingsDrop(event: CdkDragDrop<string[]>): void {
    moveItemInArray(this.settings.vendorRecipeItemSetSettings, event.previousIndex, event.currentIndex);
  }

  public onResetRecipeSettingsToDefaultClick(identifier: number) {
    this.settings.vendorRecipeItemSetSettings[identifier] = { ... this.getDefaultRecipeSettings(this.settings.vendorRecipeItemSetSettings[identifier].type) }
  }

  public onRemoveRecipeSettingsClick(identifier: number) {
    if (this.settings.vendorRecipeItemSetSettings.length <= 1) {
      return
    }
    this.settings.vendorRecipeItemSetSettings.splice(identifier, 1)
  }

  public onAddItemSetRecipe(vendorRecipeType: VendorRecipeType): void {
    const newSettings = { ... this.getDefaultRecipeSettings(vendorRecipeType) }
    newSettings.enabled = true
    this.settings.vendorRecipeItemSetSettings.push(newSettings)
    this.ref.detectChanges()
  }
}

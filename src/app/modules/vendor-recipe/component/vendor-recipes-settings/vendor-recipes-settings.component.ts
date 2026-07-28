import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, QueryList, ViewChildren } from '@angular/core'
import { EnumValues, ObjectUtils } from '@app/class'
import { WindowService } from '@app/service'
import { UserSettingsComponent } from '@layout/type'
import { DefaultRecipeSettings, RecipeUserSettings, VendorRecipeType, VendorRecipeUserSettings } from '@shared/module/poe/type/vendor-recipe.type'
import { VendorRecipeSettingsComponent } from '../vendor-recipe-settings/vendor-recipe-settings.component'

@Component({
  selector: 'app-vendor-recipes-settings',
  templateUrl: './vendor-recipes-settings.component.html',
  styleUrls: ['./vendor-recipes-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorRecipesSettingsComponent implements UserSettingsComponent, OnDestroy {
  @Input()
  public settings: VendorRecipeUserSettings

  @Input()
  public defaultSettings: VendorRecipeUserSettings

  @ViewChildren(VendorRecipeSettingsComponent)
  public recipeSettingComponents: QueryList<VendorRecipeSettingsComponent>

  public vendorRecipeTypes = new EnumValues(VendorRecipeType)

  constructor(
    private readonly ref: ChangeDetectorRef,
    private readonly window: WindowService,
  ) {
  }

  ngOnDestroy(): void {
  }

  public load(): void {
    this.recipeSettingComponents?.forEach(x => x.load())
  }

  public getRoundedPercentage = (value: number) => `${Math.round(value * 100)}%`

  public onResetPanelBoundsClick(): void {
    const bounds = this.window.getOffsettedGameBounds(false)
    bounds.width = bounds.height = 0
    this.settings.vendorRecipePanelSettings.bounds = bounds
  }

  public getDefaultRecipeSettings(vendorRecipeType: VendorRecipeType): RecipeUserSettings {
    return DefaultRecipeSettings[vendorRecipeType]
  }

  public onVendorRecipeSettingsDrop(event: CdkDragDrop<string[]>): void {
    moveItemInArray(this.settings.vendorRecipeSettings, event.previousIndex, event.currentIndex);
  }

  public onResetRecipeSettingsToDefaultClick(identifier: number) {
    this.settings.vendorRecipeSettings[identifier] = ObjectUtils.merge({}, this.getDefaultRecipeSettings(this.settings.vendorRecipeSettings[identifier].type))
  }

  public onRemoveRecipeSettingsClick(identifier: number) {
    if (this.settings.vendorRecipeSettings.length <= 1) {
      return
    }
    this.settings.vendorRecipeSettings.splice(identifier, 1)
  }

  public onAddVendorRecipeSettings(vendorRecipeType: VendorRecipeType): void {
    const newSettings = ObjectUtils.merge({}, this.getDefaultRecipeSettings(vendorRecipeType))
    newSettings.enabled = true
    this.settings.vendorRecipeSettings.push(newSettings)
    this.ref.detectChanges()
  }
}

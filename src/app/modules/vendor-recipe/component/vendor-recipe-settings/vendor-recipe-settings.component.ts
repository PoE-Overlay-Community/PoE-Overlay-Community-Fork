import { ChangeDetectionStrategy, Component, Input, OnDestroy } from '@angular/core'
import { WindowService } from '@app/service'
import { UserSettingsComponent } from '@layout/type'
import { VendorRecipeUserSettings } from '@shared/module/poe/type/vendor-recipe.type'

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

  constructor(
    private readonly window: WindowService,
  ) {
  }

  ngOnDestroy(): void {
  }

  public load(): void {
  }

  public getRoundedPercentage = (value: number) => `${Math.round(value * 100)}%`

  public onResetItemSetPanelBoundsClick(): void {
    const bounds = this.window.getOffsettedGameBounds(false)
    bounds.width = bounds.height = 0
    this.settings.vendorRecipeItemSetPanelSettings.bounds = bounds
  }

  public onResetChaosRecipeSettingsToDefaultClick(): void {
    this.settings.vendorRecipeChaosRecipeSettings = { ...this.defaultSettings.vendorRecipeChaosRecipeSettings }
  }

  public onResetExaltedShardRecipeSettingsToDefaultClick(): void {
    this.settings.vendorRecipeExaltedShardRecipeSettings = { ...this.defaultSettings.vendorRecipeExaltedShardRecipeSettings }
  }
}

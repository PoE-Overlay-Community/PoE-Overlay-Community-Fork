import { Injectable } from '@angular/core'
import { ElectronService } from '@app/service'
import { THREAD_AVAILABLE } from '@layout/page/periodic-update-thread/periodic-update-thread'
import { UserSettings } from '@layout/type'
import { VendorRecipeProcessResult, VendorRecipeUserSettings } from '@shared/module/poe/type'
import { BehaviorSubject } from 'rxjs'
import { GET_VENDOR_RECIPES, VENDOR_RECIPES } from './vendor-recipe-thread.service'

@Injectable({
  providedIn: 'root',
})
export class VendorRecipeService {
  public readonly vendorRecipes$ = new BehaviorSubject<VendorRecipeProcessResult[]>(undefined);

  private settings: VendorRecipeUserSettings

  private scopedVendorRecipesEventHandler
  private scopedThreadAvailableEventHandler

  constructor(
    private readonly electronService: ElectronService,
  ) {
  }

  public register(settings: UserSettings): void {
    this.settings = settings as VendorRecipeUserSettings

    if (!this.settings.vendorRecipePanelSettings.enabled) {
      return
    }

    if (!this.scopedVendorRecipesEventHandler) {
      this.scopedVendorRecipesEventHandler = (_, vendorRecipes: VendorRecipeProcessResult[]) => {
        if (vendorRecipes) {
          this.vendorRecipes$.next(vendorRecipes)
        }
      }

      this.electronService.on(VENDOR_RECIPES, this.scopedVendorRecipesEventHandler)
      this.electronService.onMain(VENDOR_RECIPES, this.scopedVendorRecipesEventHandler)
    }

    if (!this.scopedThreadAvailableEventHandler) {
      this.scopedThreadAvailableEventHandler = () => {
        this.updateVendorRecipes(false)
      }

      this.electronService.onMain(THREAD_AVAILABLE, this.scopedThreadAvailableEventHandler)
    }
  }

  public unregister(): void {
    if (this.scopedVendorRecipesEventHandler) {
      this.electronService.removeListener(VENDOR_RECIPES, this.scopedVendorRecipesEventHandler)
      this.electronService.removeMainListener(VENDOR_RECIPES, this.scopedVendorRecipesEventHandler)
      this.scopedVendorRecipesEventHandler = null
    }
    if (this.scopedThreadAvailableEventHandler) {
      this.electronService.removeMainListener(THREAD_AVAILABLE, this.scopedThreadAvailableEventHandler)
      this.scopedThreadAvailableEventHandler = null
    }
  }

  public updateVendorRecipes(forceUpdate: boolean): void {
    this.electronService.send(GET_VENDOR_RECIPES, forceUpdate)
  }
}

import { Injectable } from '@angular/core'
import { ElectronService } from '@app/service'
import { THREAD_AVAILABLE, THREAD_TAG } from '@layout/page/periodic-update-thread/periodic-update-thread'
import { UserSettings } from '@layout/type'
import { VendorRecipeProcessResult, VendorRecipeUserSettings } from '@shared/module/poe/type'
import { BehaviorSubject } from 'rxjs'
import { GET_VENDOR_RECIPES, VENDOR_RECIPES, VR_TAG } from './vendor-recipe-thread.service'

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
      this.scopedVendorRecipesEventHandler = (_: any, vendorRecipes: VendorRecipeProcessResult[]): void => {
        if (vendorRecipes) {
          this.vendorRecipes$.next(vendorRecipes)
        }
      }

      this.electronService.on(VR_TAG, VENDOR_RECIPES, this.scopedVendorRecipesEventHandler)
    }

    if (!this.scopedThreadAvailableEventHandler) {
      this.scopedThreadAvailableEventHandler = () => {
        this.updateVendorRecipes(false)
      }

      this.electronService.on(THREAD_TAG, THREAD_AVAILABLE, this.scopedThreadAvailableEventHandler)
    }
  }

  public unregister(): void {
    if (this.scopedVendorRecipesEventHandler) {
      this.electronService.removeListener(VR_TAG, VENDOR_RECIPES, this.scopedVendorRecipesEventHandler)
      this.scopedVendorRecipesEventHandler = null
    }
    if (this.scopedThreadAvailableEventHandler) {
      this.electronService.removeListener(VR_TAG, THREAD_AVAILABLE, this.scopedThreadAvailableEventHandler)
      this.scopedThreadAvailableEventHandler = null
    }
  }

  public updateVendorRecipes(forceUpdate: boolean): void {
    this.electronService.send(VR_TAG, GET_VENDOR_RECIPES, forceUpdate)
  }
}

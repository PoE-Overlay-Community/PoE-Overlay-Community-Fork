import { Injectable } from '@angular/core'
import { ElectronService } from '@app/service'
import { UserSettings } from '@layout/type'
import { PoEAccountService } from '@shared/module/poe/service/account/account.service'
import { StashThreadService } from '@shared/module/poe/service/stash/stash-thread.service'
import { PoEAccount, PoEStashTab, RecipeUserSettings, StashTabSearchMode, StashTabsToSearch, VendorRecipeProcessResult, VendorRecipeType, VendorRecipeUserSettings } from '@shared/module/poe/type'
import { forkJoin, Observable, of, Subscription } from 'rxjs'
import { concatAll, flatMap, map } from 'rxjs/operators'
import { PoEAccountThreadService } from '../account/account-thread.service'
import { ChanceRecipeProcessorService } from './processors/chance-recipe-processor.service'
import { ChaosRecipeProcessorService } from './processors/chaos-recipe-processor.service'
import { ExaltedShardRecipeProcessorService } from './processors/exalted-shard-recipe-processor.service'
import { GemcutterRecipeProcessorService } from './processors/gemcutter-recipe-processor.service'
import { GlassblowerRecipeProcessorService } from './processors/glassblower-recipe-processor.service'
import { RecipeProcessorService } from './processors/recipe-processor.service'
import { RegalRecipeProcessorService } from './processors/regal-recipe-processor.service'

export const VENDOR_RECIPES = 'vendor-recipes'
export const GET_VENDOR_RECIPES = 'get-vendor-recipes'

@Injectable({
  providedIn: 'root',
})
export class VendorRecipeThreadService implements StashTabsToSearch {
  private vendorRecipes: VendorRecipeProcessResult[]

  private settings: VendorRecipeUserSettings

  private stashTabSearchRegexes: RegExp[]

  private accountSub: Subscription
  private stashContentSub: Subscription

  private readonly recipeProcessors: {
    [key: string]: RecipeProcessorService
  }

  constructor(
    private readonly electronService: ElectronService,
    private readonly stashThreadService: StashThreadService,
    private readonly accountThreadService: PoEAccountThreadService,
    chaosRecipeProcessor: ChaosRecipeProcessorService,
    exaltedShardRecipeProcessor: ExaltedShardRecipeProcessorService,
    gemcutterRecipeProcessor: GemcutterRecipeProcessorService,
    glassblowerRecipeProcessor: GlassblowerRecipeProcessorService,
    regalRecipeProcessor: RegalRecipeProcessorService,
    chanceRecipeProcessor: ChanceRecipeProcessorService,
  ) {
    this.recipeProcessors = {
      [VendorRecipeType.Chaos]: chaosRecipeProcessor,
      [VendorRecipeType.ExaltedShard]: exaltedShardRecipeProcessor,
      [VendorRecipeType.Gemcutter]: gemcutterRecipeProcessor,
      [VendorRecipeType.GlassblowerBauble]: glassblowerRecipeProcessor,
      [VendorRecipeType.Regal]: regalRecipeProcessor,
      [VendorRecipeType.Chance]: chanceRecipeProcessor,
    }
  }

  public register(settings: UserSettings): void {
    this.settings = settings as VendorRecipeUserSettings

    this.stashTabSearchRegexes = []
    this.settings.vendorRecipeSettings.forEach((settings, index) => {
      if (settings.stashTabSearchMode === StashTabSearchMode.Regex) {
        this.stashTabSearchRegexes[index] = new RegExp(settings.stashTabSearchValue, 'gi')
      }
    })

    this.accountSub = this.accountThreadService.subscribe((account) => this.onAccountChange(account))

    this.stashThreadService.registerStashTabToSearch(this)

    this.updateVendorRecipes()

    this.electronService.onMain(GET_VENDOR_RECIPES, (event, forceUpdate: boolean) => {
      if (forceUpdate) {
        // Force-updating the content will trigger a vendor recipe update too
        this.stashThreadService.forceUpdateTabContent()
      }
      event.reply(VENDOR_RECIPES, this.vendorRecipes)
    })
  }

  public unregister(): void {
    this.stashThreadService.unregisterStashTabToSearch(this)
    if (this.accountSub) {
      this.accountSub.unsubscribe()
      this.accountSub = null
    }
    this.tryUnsubscribeStashContentUpdate()
  }

  public getStashTabsToSearch(): Observable<PoEStashTab[]> {
    if (!this.settings || !this.settings.vendorRecipePanelSettings.enabled) {
      return of([])
    }

    return forkJoin(
      this.settings.vendorRecipeSettings.map((settings, index) => this.getItemSetStashTabsToSearch(index, settings)),
    ).pipe(concatAll())
  }

  private trySubscribeStashContentUpdate(): void {
    if (!this.stashContentSub && this.settings) {
      this.stashContentSub = this.stashThreadService.stashTabContentUpdated$.subscribe(() => this.updateVendorRecipes())
    }
  }

  private tryUnsubscribeStashContentUpdate(): void {
    if (this.stashContentSub) {
      this.stashContentSub.unsubscribe()
      this.stashContentSub = null
    }
  }

  private getItemSetStashTabsToSearch(index: number, settings: RecipeUserSettings): Observable<PoEStashTab[]> {
    if (!settings.enabled) {
      return of([])
    }
    return this.stashThreadService.getStashTabs((stashTab) => this.stashTabPredicate(stashTab, settings, index))
  }

  private getVendorRecipes(identifier: number, settings: RecipeUserSettings, processedRecipes: VendorRecipeProcessResult[]): Observable<VendorRecipeProcessResult> {
    if (!settings.enabled) {
      return of({
        identifier,
        recipes: [],
        itemGroups: [],
      })
    }
    const recipeProcessor = this.recipeProcessors[settings.type]
    return this.getItemSetStashTabsToSearch(identifier, settings)
      .pipe(
        flatMap((stashTabs) => this.stashThreadService.getStashTabContents(stashTabs)
          .pipe(
            map((stashItems) => {
              return recipeProcessor.process(identifier, stashItems, settings, processedRecipes)
            })
          )
        )
      )
  }

  private stashTabPredicate(stashTab: PoEStashTab, settings: RecipeUserSettings, index: number): boolean {
    switch (settings.stashTabSearchMode) {
      case StashTabSearchMode.Index:
        return settings.stashTabSearchValue.split(',').map((x) => +x).findIndex((x) => stashTab.tabIndex === x) !== -1

      case StashTabSearchMode.Prefix:
        return stashTab.name.startsWith(settings.stashTabSearchValue)

      case StashTabSearchMode.Suffix:
        return stashTab.name.endsWith(settings.stashTabSearchValue)

      case StashTabSearchMode.Regex:
        return this.stashTabSearchRegexes[index].test(stashTab.name)
    }
  }

  private updateVendorRecipes(): void {
    if (!this.settings.vendorRecipePanelSettings.enabled) {
      return
    }

    const processedRecipes: VendorRecipeProcessResult[] = []

    forkJoin(
      this.settings.vendorRecipeSettings.map((settings, index) => this.getVendorRecipes(index, settings, processedRecipes))
    ).subscribe(null, err => console.log(err), () => {
      this.vendorRecipes = processedRecipes
      this.electronService.send(VENDOR_RECIPES, this.vendorRecipes)
    })

    this.trySubscribeStashContentUpdate()
  }

  private onAccountChange(account: PoEAccount) {
    if (account.loggedIn) {
      this.updateVendorRecipes()
    } else {
      this.tryUnsubscribeStashContentUpdate()
    }
  }
}

import { Injectable } from '@angular/core'
import { UserSettings } from '@layout/type'
import { PoEAccountService } from '@shared/module/poe/service/account/account.service'
import { StashService } from '@shared/module/poe/service/stash/stash.service'
import { PoEAccount, PoEStashTab, RecipeUserSettings, StashTabSearchMode, StashTabsToSearch, VendorRecipeProcessResult, VendorRecipeType, VendorRecipeUserSettings } from '@shared/module/poe/type'
import { BehaviorSubject, forkJoin, Observable, of, Subscription } from 'rxjs'
import { concatAll, flatMap, map } from 'rxjs/operators'
import { ChaosRecipeProcessorService } from './processors/chaos-recipe-processor.service'
import { ExaltedShardRecipeProcessorService } from './processors/exalted-shard-recipe-processor.service'
import { GemcutterRecipeProcessorService } from './processors/gemcutter-recipe-processor.service'
import { GlassblowerRecipeProcessorService } from './processors/glassblower-recipe-processor.service'
import { RecipeProcessorService } from './processors/recipe-processor.service'

@Injectable({
  providedIn: 'root',
})
export class VendorRecipeService implements StashTabsToSearch {
  public readonly vendorRecipes$ = new BehaviorSubject<VendorRecipeProcessResult[]>(undefined);

  private settings: VendorRecipeUserSettings

  private stashTabSearchRegexes: RegExp[]

  private accountSub: Subscription
  private stashContentSub: Subscription

  private readonly recipeProcessors: {
    [key: string]: RecipeProcessorService
  }

  constructor(
    private readonly stashService: StashService,
    private readonly accountService: PoEAccountService,
    chaosRecipeProcessor: ChaosRecipeProcessorService,
    exaltedShardRecipeProcessor: ExaltedShardRecipeProcessorService,
    gemcutterRecipeProcessor: GemcutterRecipeProcessorService,
    glassblowerRecipeProcessor: GlassblowerRecipeProcessorService,
  ) {
    this.recipeProcessors = {
      [VendorRecipeType.Chaos]: chaosRecipeProcessor,
      [VendorRecipeType.ExaltedShard]: exaltedShardRecipeProcessor,
      [VendorRecipeType.Gemcutter]: gemcutterRecipeProcessor,
      [VendorRecipeType.GlassblowerBauble]: glassblowerRecipeProcessor,
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

    this.accountSub = this.accountService.subscribe((account) => this.onAccountChange(account))

    this.stashService.registerStashTabToSearch(this)

    this.updateVendorRecipes()
  }

  public unregister(): void {
    this.stashService.unregisterStashTabToSearch(this)
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
      this.stashContentSub = this.stashService.stashTabContentUpdated$.subscribe(() => this.updateVendorRecipes())
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
    return this.stashService.getStashTabs((stashTab) => this.stashTabPredicate(stashTab, settings, index))
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
        flatMap((stashTabs) => this.stashService.getStashTabContents(stashTabs)
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
    ).subscribe(null, (err) => console.log(err), () => {
      this.vendorRecipes$.next(processedRecipes)
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

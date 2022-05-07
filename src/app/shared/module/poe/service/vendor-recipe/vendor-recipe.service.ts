import { Injectable } from '@angular/core'
import { BehaviorSubject, forkJoin, merge, Observable, of, Subscription, concat } from 'rxjs'
import { catchError, concatAll, flatMap, map, switchMap, tap } from 'rxjs/operators'
import { UserSettings } from '../../../../../layout/type'
import { PoEAccount } from '../../type'
import { PoEStashTab, StashTabsToSearch } from '../../type/stash.type'
import { ItemSetProcessResult, ItemSetRecipeProcessor, ItemSetRecipeUserSettings, StashTabSearchMode, VendorRecipe, VendorRecipeType, VendorRecipeUserSettings } from '../../type/vendor-recipe.type'
import { PoEAccountService } from '../account/account.service'
import { StashService } from '../stash/stash.service'
import ChaosRecipeProcessorService from './processors/chaos-recipe-processor.service'
import ExaltedShardRecipeProcessorService from './processors/exalted-shard-recipe-processor.service'

const ChaosRecipeResourceName = 'ChaosRecipe';
const ExaltedShardRecipeResourceName = 'ExaltedShard';

@Injectable({
  providedIn: 'root',
})
export class VendorRecipeService implements StashTabsToSearch {
  public readonly vendorRecipes$ = new BehaviorSubject<ItemSetProcessResult>(undefined);

  private settings: VendorRecipeUserSettings

  private stashTabSearchRegexes: RegExp[]

  private accountSub: Subscription
  private stashContentSub: Subscription

  constructor(
    private readonly stashService: StashService,
    private readonly accountService: PoEAccountService,
    private readonly chaosRecipeProcessor: ChaosRecipeProcessorService,
    private readonly exaltedShardRecipeProcessor: ExaltedShardRecipeProcessorService,
  ) {
  }

  public register(settings: UserSettings): void {
    this.settings = settings as VendorRecipeUserSettings

    this.stashTabSearchRegexes = []
    this.settings.vendorRecipeItemSetSettings.forEach((settings, index) => {
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
    if (!this.settings) {
      return of([])
    }

    return forkJoin(
      this.settings.vendorRecipeItemSetSettings.map((settings, index) => this.getItemSetStashTabsToSearch(index, settings))
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

  private getItemSetStashTabsToSearch(index: number, settings: ItemSetRecipeUserSettings): Observable<PoEStashTab[]> {
    return this.stashService.getStashTabs((stashTab) => this.stashTabPredicate(stashTab, settings, index))
  }

  private getVendorRecipes(identifier: number, settings: ItemSetRecipeUserSettings, recipeProcessor: ItemSetRecipeProcessor, allRecipes: ItemSetProcessResult): Observable<ItemSetProcessResult> {
    if (!settings.enabled) {
      return of({
        itemGroups: [],
        recipes: [],
      })
    }
    return this.getItemSetStashTabsToSearch(identifier, settings)
      .pipe(
        flatMap((stashTabs) => this.stashService.getStashTabContents(stashTabs)
          .pipe(
            map((stashItems) => {
              return recipeProcessor.process(identifier, stashItems, settings, allRecipes)
            })
          )
        )
      )
  }

  private stashTabPredicate(stashTab: PoEStashTab, settings: ItemSetRecipeUserSettings, index: number): boolean {
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
    const allResults: ItemSetProcessResult = {
      recipes: [],
      itemGroups: [],
    }

    forkJoin(
      this.settings.vendorRecipeItemSetSettings.map((settings, index) => this.getVendorRecipes(index, settings, this.getVendorRecipeProcessor(settings), allResults))
    ).subscribe(null, (err) => console.log(err), () => {
      this.vendorRecipes$.next(allResults)
    })

    this.trySubscribeStashContentUpdate()
  }

  private getVendorRecipeProcessor(settings: ItemSetRecipeUserSettings): ItemSetRecipeProcessor {
    switch (settings.type) {
      case VendorRecipeType.Chaos:
        return this.chaosRecipeProcessor

      case VendorRecipeType.ExaltedShard:
        return this.exaltedShardRecipeProcessor
    }
  }

  private onAccountChange(account: PoEAccount) {
    if (account.loggedIn) {
      this.updateVendorRecipes()
    } else {
      this.tryUnsubscribeStashContentUpdate()
    }
  }
}

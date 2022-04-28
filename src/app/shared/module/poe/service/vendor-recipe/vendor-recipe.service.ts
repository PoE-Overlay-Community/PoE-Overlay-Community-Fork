import { Injectable } from '@angular/core'
import { BehaviorSubject, forkJoin, merge, Observable, of, Subscription } from 'rxjs'
import { flatMap, map } from 'rxjs/operators'
import { UserSettings } from '../../../../../layout/type'
import { PoEAccount } from '../../type'
import { PoEStashTab, StashTabsToSearch } from '../../type/stash.type'
import { ItemSetProcessResult, ItemSetRecipeProcessor, ItemSetRecipeUserSettings, StashTabSearchMode, VendorRecipe, VendorRecipeUserSettings } from '../../type/vendor-recipe.type'
import { PoEAccountService } from '../account/account.service'
import { StashService } from '../stash/stash.service'
import { ChaosRecipeProcessorService } from './processors/chaos-recipe-processor.service'

const ChaosRecipeResourceName = 'ChaosRecipe';
const ExaltedShardRecipeResourceName = 'ExaltedShard';

@Injectable({
  providedIn: 'root',
})
export class VendorRecipeService implements StashTabsToSearch {
  public readonly vendorRecipes$ = new BehaviorSubject<ItemSetProcessResult>(undefined);

  private settings: VendorRecipeUserSettings

  private stashTabSearchRegexes: {
    [resource: string]: RegExp
  } = {}

  private accountSub: Subscription
  private stashContentSub: Subscription

  constructor(
    private readonly stashService: StashService,
    private readonly accountService: PoEAccountService,
    private readonly chaosRecipeProcessor: ChaosRecipeProcessorService,
  ) {
  }

  public register(settings: UserSettings): void {
    this.settings = settings as VendorRecipeUserSettings

    this.stashTabSearchRegexes = {}
    this.tryUpdateStashTabRegex(ChaosRecipeResourceName, this.settings.vendorRecipeChaosRecipeSettings)
    this.tryUpdateStashTabRegex(ExaltedShardRecipeResourceName, this.settings.vendorRecipeExaltedShardRecipeSettings)

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

    return merge(
      this.getItemSetStashTabsToSearch(ChaosRecipeResourceName, this.settings.vendorRecipeChaosRecipeSettings),
      this.getItemSetStashTabsToSearch(ExaltedShardRecipeResourceName, this.settings.vendorRecipeExaltedShardRecipeSettings)
    )
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

  private getItemSetStashTabsToSearch(resource: string, settings: ItemSetRecipeUserSettings): Observable<PoEStashTab[]> {
    return this.stashService.getStashTabs((stashTab) => this.stashTabPredicate(stashTab, settings, resource))
  }

  private getVendorRecipes(resource: string, settings: ItemSetRecipeUserSettings, recipeProcessor: ItemSetRecipeProcessor): Observable<ItemSetProcessResult> {
    if (!settings.enabled) {
      return of({
        itemGroups: [],
        recipes: [],
      })
    }
    return this.getItemSetStashTabsToSearch(resource, settings).pipe(
      flatMap((stashTabs) => {
        const uniqueStashTabs = stashTabs.reduce((accumulator, current) => {
          if (!accumulator.some((stashTab) => stashTab.id === current.id)) {
            accumulator.push(current);
          }
          return accumulator;
        }, []);
        return this.stashService.getStashTabContents(uniqueStashTabs).pipe(
          map((stashItems) => recipeProcessor.process(stashItems, settings))
        )
      })
    )
  }

  private stashTabPredicate(stashTab: PoEStashTab, settings: ItemSetRecipeUserSettings, resource: string): boolean {
    switch (settings.stashTabSearchMode) {
      case StashTabSearchMode.Index:
        return settings.stashTabSearchValue.split(',').map((x) => +x).findIndex((x) => stashTab.tabIndex === x) !== -1

      case StashTabSearchMode.Prefix:
        return stashTab.name.startsWith(settings.stashTabSearchValue)

      case StashTabSearchMode.Suffix:
        return stashTab.name.endsWith(settings.stashTabSearchValue)

      case StashTabSearchMode.Regex:
        return this.stashTabSearchRegexes[resource].test(stashTab.name)
    }
  }

  private updateVendorRecipes(): void {
    forkJoin(
      this.getVendorRecipes(ChaosRecipeResourceName, this.settings.vendorRecipeChaosRecipeSettings, this.chaosRecipeProcessor),
      //this.getVendorRecipes(ExaltedShardRecipeResourceName, this.settings.exaltedShardRecipeSettings, this.exaltedShardRecipeProcessor)
    ).subscribe(results => {
      this.vendorRecipes$.next({
        recipes: results.map(x => x.recipes).reduce((arr, elem) => arr.concat(elem), []),
        itemGroups: results.map(x => x.itemGroups).reduce((arr, elem) => arr.concat(elem), []),
      })
    })

    this.trySubscribeStashContentUpdate()
  }

  private tryUpdateStashTabRegex(resource: string, settings: ItemSetRecipeUserSettings): void {
    if (settings.stashTabSearchMode === StashTabSearchMode.Regex) {
      this.stashTabSearchRegexes[resource] = new RegExp(settings.stashTabSearchValue, 'gi')
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

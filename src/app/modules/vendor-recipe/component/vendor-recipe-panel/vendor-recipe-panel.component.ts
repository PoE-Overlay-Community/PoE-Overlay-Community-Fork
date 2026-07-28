import {
    ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy,
    OnInit, Output, SimpleChanges
} from '@angular/core'
import { ColorUtils } from '@app/class'
import { CurrenciesProvider } from '@shared/module/poe/provider/currency/currencies.provider'
import { StashService } from '@shared/module/poe/service'
import { StashGridService } from '@shared/module/poe/service/stash-grid/stash-grid.service'
import { AudioClipSettings, Currency, ItemGroupSettings, QualityRecipeProcessResult, QualityRecipeUserSettings, RecipeHighlightMode, RecipeItemGroup, RecipeItemGroups, RecipeUserSettings, VendorRecipeProcessResult, VendorRecipeUserSettings } from '@shared/module/poe/type'
import { StashGridMode, StashGridOptions, TradeItemLocations } from '@shared/module/poe/type/stash-grid.type'
import { BehaviorSubject, forkJoin, Subscription } from 'rxjs'
import { delay, throttleTime } from 'rxjs/operators'
import { VendorRecipeUtils } from '../../class/vendor-recipe-utils.class'

interface RecipeQueueItem {
  type: RecipeQueueItemType
  item: any
}

enum RecipeQueueItemType {
  StashGrid = 0,
  Audio = 1,
}

@Component({
  selector: 'app-vendor-recipe-panel',
  templateUrl: './vendor-recipe-panel.component.html',
  styleUrls: ['./vendor-recipe-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorRecipePanelComponent implements OnInit, OnDestroy, OnChanges {
  @Input()
  public globalSettings: VendorRecipeUserSettings

  @Input()
  public settings: RecipeUserSettings

  @Input()
  public vendorRecipeProcessResult: VendorRecipeProcessResult

  @Output()
  public recipeTypeScroll = new EventEmitter<WheelEvent>();

  public showRecipeCountScrollArrows = false

  public readonly stashTabContentPeriodicUpdateActiveChanged$ = new BehaviorSubject<boolean>(false)

  public readonly currencies$ = new BehaviorSubject<Currency[]>([])

  public get recipeCountLargeBGImage(): string {
    const icon = this.currencies$.value?.find(x => x.id === this.settings.largeIconId)
    if (icon) {
      return 'url(https://web.poecdn.com' + icon.image + ')'
    }
    return ''
  }

  public get recipeCountSmallBGImage(): string {
    const icon = this.currencies$.value?.find(x => x.id === this.settings.smallIconId)
    if (icon) {
      return 'url(https://web.poecdn.com' + icon.image + ')'
    }
    return ''
  }

  public getRoundedPercentage = (value: number) => `${Math.round(value * 100)}%`

  private readonly internalStashTabContentPeriodicUpdateActiveChanged$ = new BehaviorSubject<boolean>(false)
  private periodicUpdateMarkedAsCompleted = false

  private readonly stashSub: Subscription
  private recipeSub: Subscription

  private recipeCompleteAudioClip: HTMLAudioElement

  public get itemsGroups(): any {
    return RecipeItemGroups[this.settings.type].map(group => {
      const itemGroupSettings = this.settings?.itemGroupSettings.find(x => x.group === group)
      return {
        group,
        itemGroupColor: itemGroupSettings,
        itemGroupColorName: this.getItemColorGroupName(group),
        itemGroupResult: this.vendorRecipeProcessResult?.itemGroups.find(x => x.group === group),
        itemThreshold: itemGroupSettings?.itemThreshold || this.settings.itemThreshold
      }
    }).filter(x => x.itemGroupColor && this.canShowItemColorGroup(x.itemGroupColor))
  }

  public get qualityRecipeUserSettings(): QualityRecipeUserSettings {
    return VendorRecipeUtils.getQualityRecipeUserSettings(this.settings)
  }

  public get qualityRecipeProcessResult(): QualityRecipeProcessResult {
    return this.vendorRecipeProcessResult as QualityRecipeProcessResult
  }

  public ColorUtils = ColorUtils

  constructor(
    private readonly ref: ChangeDetectorRef,
    private readonly stashService: StashService,
    private readonly stashGridService: StashGridService,
    private readonly currenciesProvider: CurrenciesProvider
  ) {
    this.stashSub = this.stashService.stashTabContentPeriodicUpdateActiveChanged$.subscribe(x => {
      if (!x && this.vendorRecipeProcessResult == undefined) {
        // Mark as completed to keep the loading bar active while waiting for the process result to arrive
        this.periodicUpdateMarkedAsCompleted = true
      } else {
        this.internalStashTabContentPeriodicUpdateActiveChanged$.next(x)
      }
    })
  }

  public ngOnInit(): void {
    this.internalStashTabContentPeriodicUpdateActiveChanged$.pipe(
      throttleTime(2000, undefined, { leading: true, trailing: true }),
    ).subscribe(x => {
      this.stashTabContentPeriodicUpdateActiveChanged$.next(x)
      this.ref.detectChanges()
    })

    this.updateCurrencies()
    if (!this.vendorRecipeProcessResult) {
      this.internalStashTabContentPeriodicUpdateActiveChanged$.next(true)
    }
  }

  public ngOnDestroy(): void {
    this.stashSub.unsubscribe()
    this.recipeSub?.unsubscribe()
    this.recipeCompleteAudioClip?.remove()
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['settings']) {
      const recipeCompleteAudio = this.settings.recipeCompleteAudio
      if (recipeCompleteAudio.enabled) {
        if (!this.recipeCompleteAudioClip) {
          this.recipeCompleteAudioClip = new Audio()
        }
        this.recipeCompleteAudioClip.src = recipeCompleteAudio.src
        this.recipeCompleteAudioClip.volume = recipeCompleteAudio.volume
      } else if (this.recipeCompleteAudioClip) {
        this.recipeCompleteAudioClip.remove()
        this.recipeCompleteAudioClip = null
      }

      this.updateCurrencies()
    } else if (changes['vendorRecipeProcessResult'] && this.periodicUpdateMarkedAsCompleted) {
      this.internalStashTabContentPeriodicUpdateActiveChanged$.next(false)
      this.periodicUpdateMarkedAsCompleted = false
    }
  }

  public getItemColorGroupName(recipeItemGroup: RecipeItemGroup): string {
    return VendorRecipeUtils.getItemGroupName(this.settings, recipeItemGroup)
  }

  public canShowItemColorGroup(itemClassColor: ItemGroupSettings): boolean {
    if (!itemClassColor.showOnOverlay || (itemClassColor.group === RecipeItemGroup.TwoHandedWeapons && VendorRecipeUtils.getItemSetRecipeUserSettings(this.settings)?.groupWeaponsTogether)) {
      return false;
    }
    return true;
  }

  public onRecipesCountClick(): void {
    if (this.recipeSub) {
      this.recipeSub.unsubscribe()
      this.recipeSub = null
      this.stashGridService.hideStashGrid()
    } else {
      const recipes = this.vendorRecipeProcessResult.recipes
      if (!recipes || recipes.length === 0) {
        return
      }
      const uniqueStashTabs: TradeItemLocations[] = []
      recipes.forEach(recipe => recipe.forEach(item => {
        const stashTabName = item.itemLocation.tabName
        const uniqueStashTab = uniqueStashTabs.find(x => x.tabName === stashTabName)
        if (!uniqueStashTab) {
          uniqueStashTabs.push({
            tabName: stashTabName,
            bounds: [item.itemLocation.bounds]
          })
        } else {
          uniqueStashTab.bounds.push(item.itemLocation.bounds)
        }
      }))

      this.recipeSub = forkJoin(
        uniqueStashTabs.map(x => this.stashGridService.getStashGridTypeByItemLocations(x))
      ).pipe(
        delay(10)
      ).subscribe((stashGridTypes) => {
        const items: RecipeQueueItem[] = []
        switch (this.settings.highlightMode) {
          case RecipeHighlightMode.ItemByItem:
            recipes.forEach(recipe => {
              recipe.forEach(item => {
                const stashTabName = item.itemLocation.tabName
                const stashGridType = stashGridTypes[uniqueStashTabs.findIndex(x => x.tabName === stashTabName)]
                const stashGridOptions: StashGridOptions = {
                  gridMode: StashGridMode.Normal,
                  gridType: stashGridType,
                  highlightLocation: {
                    tabName: stashTabName,
                    bounds: [item.itemLocation.bounds]
                  },
                  autoClose: true,
                }
                items.push({
                  type: RecipeQueueItemType.StashGrid,
                  item: stashGridOptions,
                })
              })
              items.push({
                type: RecipeQueueItemType.Audio,
                item: this.settings.recipeCompleteAudio
              })
            })
            break

          case RecipeHighlightMode.SetBySet:
            recipes.forEach(recipe => {
              const setStashOptions: StashGridOptions[] = []
              recipe.forEach(item => {
                const stashTabName = item.itemLocation.tabName
                const stashGridOption = setStashOptions.find(x => x.highlightLocation.tabName == stashTabName)
                if (!stashGridOption) {
                  const stashGridType = stashGridTypes[uniqueStashTabs.findIndex(x => x.tabName === stashTabName)]
                  const stashGridOptions: StashGridOptions = {
                    gridMode: StashGridMode.Normal,
                    gridType: stashGridType,
                    highlightLocation: {
                      tabName: stashTabName,
                      bounds: [item.itemLocation.bounds]
                    },
                    autoClose: true,
                  }
                  setStashOptions.push(stashGridOptions)
                  items.push({
                    type: RecipeQueueItemType.StashGrid,
                    item: stashGridOptions,
                  })
                } else {
                  stashGridOption.highlightLocation.bounds.push(item.itemLocation.bounds)
                }
              })
              items.push({
                type: RecipeQueueItemType.Audio,
                item: this.settings.recipeCompleteAudio
              })
            })
            break

          case RecipeHighlightMode.AllItems:
            recipes.forEach(recipe => {
              recipe.forEach(item => {
                const stashTabName = item.itemLocation.tabName
                const stashGridOption = items.find(x => {
                  if (x.type === RecipeQueueItemType.StashGrid) {
                    const stashGridOption = x.item as StashGridOptions
                    if (stashGridOption) {
                      return stashGridOption.highlightLocation.tabName == stashTabName
                    }
                  }
                  return false
                })?.item as StashGridOptions
                if (!stashGridOption) {
                  const stashGridType = stashGridTypes[uniqueStashTabs.findIndex(x => x.tabName === stashTabName)]
                  const stashGridOptions: StashGridOptions = {
                    gridMode: StashGridMode.Normal,
                    gridType: stashGridType,
                    highlightLocation: {
                      tabName: stashTabName,
                      bounds: [item.itemLocation.bounds]
                    },
                    autoClose: true,
                  }
                  items.push({
                    type: RecipeQueueItemType.StashGrid,
                    item: stashGridOptions,
                  })
                } else {
                  stashGridOption.highlightLocation.bounds.push(item.itemLocation.bounds)
                }
              })
            })
            break
        }
        if (items.length === 0) {
          return
        }

        // Show the stash grid options one after the other
        let index = 0
        const showStashGrid = (queueItem: RecipeQueueItem) => {
          if (!queueItem || !this.recipeSub) {
            this.recipeSub?.unsubscribe()
            this.recipeSub = null
            return
          }
          switch (queueItem.type) {
            case RecipeQueueItemType.StashGrid:
              this.stashGridService.showStashGrid(queueItem.item).subscribe((next) => {
                if (next) {
                  index++
                  showStashGrid(items[index])
                } else {
                  this.recipeSub.unsubscribe()
                  this.recipeSub = null
                }
              })
              break

            case RecipeQueueItemType.Audio:
              if ((queueItem.item as AudioClipSettings)?.enabled) {
                this.recipeCompleteAudioClip.play()
              }
              index++
              showStashGrid(items[index])
              break

            default:
              index++
              showStashGrid(items[index])
              break
          }
        }
        showStashGrid(items[index])
      })
    }
  }

  private updateCurrencies(): void {
    this.currenciesProvider.provide(this.globalSettings.language).subscribe((currencies) => {
      this.currencies$.next(currencies.filter(x => x.image))
    })
  }
}

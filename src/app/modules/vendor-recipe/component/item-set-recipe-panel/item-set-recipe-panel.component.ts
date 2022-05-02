import { OnChanges, SimpleChanges } from '@angular/core'
import {
  ChangeDetectionStrategy, Component, Input, OnDestroy,
  OnInit
} from '@angular/core'
import { ColorUtils, EnumValues } from '@app/class'
import { StashService } from '@shared/module/poe/service'
import { StashGridService } from '@shared/module/poe/service/stash-grid/stash-grid.service'
import { AudioClipSettings, ItemGroupColor, ItemSetGroup, ItemSetProcessResult, ItemSetRecipeUserSettings, RecipeHighlightMode } from '@shared/module/poe/type'
import { StashGridMode, StashGridOptions, StashGridUserSettings, TradeItemLocations } from '@shared/module/poe/type/stash-grid.type'
import { forkJoin, of } from 'rxjs'
import { BehaviorSubject, Subscription } from 'rxjs'
import { concatAll, delay, tap, throttleTime } from 'rxjs/operators'
import { ofType } from '../../../../core/function'

interface RecipeQueueItem {
  type: RecipeQueueItemType
  item: any
}

enum RecipeQueueItemType {
  StashGrid = 0,
  Audio = 1,
}

@Component({
  selector: 'app-item-set-recipe-panel',
  templateUrl: './item-set-recipe-panel.component.html',
  styleUrls: ['./item-set-recipe-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemSetRecipePanelComponent implements OnInit, OnDestroy, OnChanges {
  @Input()
  public settings: ItemSetRecipeUserSettings

  @Input()
  public itemSetProcessResult: ItemSetProcessResult

  public readonly stashTabContentPeriodicUpdateActiveChanged$ = new BehaviorSubject<boolean>(false)

  public itemSetGroups = new EnumValues(ItemSetGroup)

  private readonly stashSub: Subscription
  private recipeSub: Subscription

  private recipeCompleteAudioClip: HTMLAudioElement

  public get itemSets(): any {
    return this.itemSetGroups.keys.map(itemSetGroup => {
      return {
        itemSetGroup,
        itemGroupColor: this.settings?.itemClassColors.find(x => x.group === itemSetGroup),
        itemGroupColorName: this.getItemColorGroupName(itemSetGroup),
        itemGroupResult: this.itemSetProcessResult?.itemGroups.find(x => x.group === itemSetGroup),
      }
    }).filter(x => x.itemGroupColor && this.canShowItemColorGroup(x.itemGroupColor))
  }

  public ColorUtils = ColorUtils

  constructor(
    private readonly stashService: StashService,
    private readonly stashGridService: StashGridService,
  ) {
    this.stashSub = this.stashService.stashTabContentPeriodicUpdateActiveChanged$.pipe(
      throttleTime(2000, undefined, { leading: true, trailing: true }),
    ).subscribe(x => this.stashTabContentPeriodicUpdateActiveChanged$.next(x))
  }

  public ngOnInit(): void {
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
    }
  }

  public getItemColorGroupName(itemSetGroup: ItemSetGroup): string {
    if (this.settings.groupWeaponsTogether && itemSetGroup === ItemSetGroup.OneHandedWeapons) {
      return "weapons"
    }
    return (this.itemSetGroups.values[itemSetGroup] as string).toLowerCase()
  }

  public canShowItemColorGroup(itemClassColor: ItemGroupColor): boolean {
    if (!itemClassColor.showOnOverlay || (itemClassColor.group === ItemSetGroup.TwoHandedWeapons && this.settings.groupWeaponsTogether)) {
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
      const recipes = this.itemSetProcessResult.recipes
      if (!recipes || recipes.length === 0) {
        return
      }
      const uniqueStashTabs: TradeItemLocations[] = []
      recipes.forEach(recipe => recipe.items.forEach(item => {
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
              recipe.items.forEach(item => {
                const stashTabName = item.itemLocation.tabName
                const stashGridType = stashGridTypes[uniqueStashTabs.findIndex(x => x.tabName === stashTabName)]
                items.push({
                  type: RecipeQueueItemType.StashGrid,
                  item: {
                    gridMode: StashGridMode.Normal,
                    gridType: stashGridType,
                    highlightLocation: {
                      tabName: stashTabName,
                      bounds: [item.itemLocation.bounds]
                    },
                  },
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
              recipe.items.forEach(item => {
                const stashTabName = item.itemLocation.tabName
                const stashGridOption = setStashOptions.find(x => x.highlightLocation.tabName == stashTabName)
                if (!stashGridOption) {
                  const stashGridType = stashGridTypes[uniqueStashTabs.findIndex(x => x.tabName === stashTabName)]
                  const newStashGridOption = {
                    identifier: Date.now().toString(),
                    gridMode: StashGridMode.Normal,
                    gridType: stashGridType,
                    highlightLocation: {
                      tabName: stashTabName,
                      bounds: [item.itemLocation.bounds]
                    }
                  }
                  setStashOptions.push(newStashGridOption)
                  items.push({
                    type: RecipeQueueItemType.StashGrid,
                    item: newStashGridOption,
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
              recipe.items.forEach(item => {
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
                  items.push({
                      type: RecipeQueueItemType.StashGrid,
                      item: {
                        gridMode: StashGridMode.Normal,
                        gridType: stashGridType,
                        highlightLocation: {
                          tabName: stashTabName,
                          bounds: [item.itemLocation.bounds]
                        },
                      },
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
}

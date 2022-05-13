import { BaseItemTypesService } from '@shared/module/poe/service/base-item-types/base-item-types.service'
import { ItemRarity, ItemSetProcessResult, ItemSetRecipeUserSettings, ItemUsageType, RecipeHighlightOrder, RecipeItemGroup, RecipeItemGroupCount, RecipeItemGroups } from '@shared/module/poe/type'
import { ExpandedStashItem, RecipeProcessorService } from './recipe-processor.service'

const DefaultRecipeCategoryOrder = [
  [RecipeItemGroup.TwoHandedWeapons],
  [RecipeItemGroup.Chests],
  [RecipeItemGroup.OneHandedWeapons, RecipeItemGroup.OneHandedWeapons],
  [RecipeItemGroup.Helmets, RecipeItemGroup.Gloves, RecipeItemGroup.Boots],
  [RecipeItemGroup.Belts],
  [RecipeItemGroup.Rings, RecipeItemGroup.Rings, RecipeItemGroup.Amulets],
]

export abstract class ItemSetRecipeProcessorService extends RecipeProcessorService {
  constructor(
    readonly baseItemTypeService: BaseItemTypesService
  ) {
    super(baseItemTypeService)
  }

  protected processCandidates(identifier: number, stashItems: ExpandedStashItem[], settings: ItemSetRecipeUserSettings): ItemSetProcessResult {
    const result: ItemSetProcessResult = {
      identifier,
      recipes: [],
      itemGroups: [],
    }

    // Determine the base list of recipe items
    const splittedCandidates = this.getSplittedCandidates(stashItems, settings)

    const getItemCount = (recipeItemGroup: RecipeItemGroup) => {
      let countMultiplier = 0
      DefaultRecipeCategoryOrder.forEach(x => x.forEach(y => {
        if (y === recipeItemGroup) {
          countMultiplier++
        }
      }))
      return stashItems.filter(x => x.recipeItemGroup === recipeItemGroup).length / countMultiplier
    }

    // Find Item counts for each Item Set Group
    const recipeItemGroups = RecipeItemGroups[settings.type]
    for (const recipeItemGroup of recipeItemGroups) {
      const itemGroup: RecipeItemGroupCount = {
        group: recipeItemGroup,
        count: getItemCount(recipeItemGroup),
      }
      if (recipeItemGroup == RecipeItemGroup.OneHandedWeapons && settings.groupWeaponsTogether) {
        itemGroup.count += getItemCount(RecipeItemGroup.TwoHandedWeapons)
      }
      result.itemGroups.push(itemGroup)
    }

    // Determine the empty slots ordering (based on settings)
    let defaultEmptySlots: RecipeItemGroup[][]
    switch (settings.highlightOrder) {
      case RecipeHighlightOrder.LargeToSmall:
        defaultEmptySlots = DefaultRecipeCategoryOrder
        break

      case RecipeHighlightOrder.SmallToLarge:
        defaultEmptySlots = [...DefaultRecipeCategoryOrder].reverse()
        break

      case RecipeHighlightOrder.ShortestDistance:
        defaultEmptySlots = [[]]
        DefaultRecipeCategoryOrder.forEach(x => x.forEach(y => defaultEmptySlots[0].push(y)))
        break
    }

    // Find all recipes
    while (result.recipes.length < settings.fullSetThreshold) {
      const emptySlots = defaultEmptySlots.map(x => [...x])

      const items: ExpandedStashItem[] = []
      let noItemsFound = false
      let lastItem: ExpandedStashItem = undefined
      while (true) {
        const group = emptySlots.find(x => x.length > 0)
        if (!group) {
          break
        }
        // Attempt to find an item, prioritizing main items first
        const candidates = this.getPickableCandidates(splittedCandidates, settings, items)
        const item = this.takeItem(candidates, group, lastItem)
        if (item) {
          // Remove the picked item
          splittedCandidates.forEach(splittedCandidate => {
            const itemIndex = splittedCandidate.indexOf(item)
            if (itemIndex !== -1) {
              splittedCandidate.splice(itemIndex, 1)
            }
          })
          items.push(item)
          lastItem = item
          group.splice(group.indexOf(item.recipeItemGroup), 1)

          // Remove conflicting categories based on the added item
          switch (item.recipeItemGroup) {
            case RecipeItemGroup.TwoHandedWeapons:
              // Remove 1h from the list of items we need
              for (const g in emptySlots) {
                emptySlots[g] = emptySlots[g].filter(x => x !== RecipeItemGroup.OneHandedWeapons)
              }
              break

            case RecipeItemGroup.OneHandedWeapons:
              // Remove 2h from the list of items we need
              for (const g in emptySlots) {
                emptySlots[g] = emptySlots[g].filter(x => x !== RecipeItemGroup.TwoHandedWeapons)
              }
              break
          }
        } else {
          noItemsFound = true
          break
        }
      }

      if (noItemsFound) {
        break
      }

      result.recipes.push(items)
    }

    return result
  }

  protected isPartOfRecipe(stashItem: ExpandedStashItem, settings: ItemSetRecipeUserSettings): boolean {
    // Items must always be rare
    if (stashItem.rarity !== ItemRarity.Rare) {
      return false
    }

    // Check identified item usage
    switch (settings.identifiedItemUsage) {
      case ItemUsageType.AlwaysUse:
        if (!stashItem.source.identified) {
          return false
        }
        break

      case ItemUsageType.NeverUse:
        if (stashItem.source.identified) {
          return false
        }
        break
    }

    // Exclude certain groups from the quality-check
    switch (stashItem.recipeItemGroup) {
      case RecipeItemGroup.Belts:
      case RecipeItemGroup.Rings:
      case RecipeItemGroup.Amulets:
        return true
    }

    // Check quality item usage
    switch (settings.qualityItemUsage) {
      case ItemUsageType.AlwaysUse:
        if (stashItem.quality === 0) {
          return false
        }
        break

      case ItemUsageType.NeverUse:
        if (stashItem.quality > 0) {
          return false
        }
        break
    }

    return true
  }

  protected canTakeItem(item: ExpandedStashItem, group: RecipeItemGroup[], lastItem: ExpandedStashItem): boolean {
    return group.some((y) => y === item.recipeItemGroup)
  }

  protected abstract getSplittedCandidates(allCandidates: ExpandedStashItem[], settings: ItemSetRecipeUserSettings): ExpandedStashItem[][]

  protected abstract getPickableCandidates(splittedCandidates: ExpandedStashItem[][], settings: ItemSetRecipeUserSettings, pickedItems: ExpandedStashItem[]): ExpandedStashItem[]

  private takeItem(items: ExpandedStashItem[], group: RecipeItemGroup[], lastItem: ExpandedStashItem): ExpandedStashItem {
    const candidates = items
      .filter((x) => this.canTakeItem(x, group, lastItem))
      .map((x) => ({ distance: this.calcDistance(lastItem, x), item: x }))
      .sort((a, b) => a.distance - b.distance)
    return candidates[0]?.item
  }
}

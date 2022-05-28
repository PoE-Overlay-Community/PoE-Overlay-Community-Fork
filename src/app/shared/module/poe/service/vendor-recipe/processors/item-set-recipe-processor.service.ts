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
      const groupItems = stashItems.filter(x => x.recipeItemGroup === recipeItemGroup)
      this.log && console.log(`Group '${RecipeItemGroup[recipeItemGroup]}' Items:`)
      this.log && console.log(groupItems)
      return groupItems.length / countMultiplier
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

    let lastItem: ExpandedStashItem = undefined

    // Find all recipes
    while (result.recipes.length < settings.fullSetThreshold) {
      this.log && console.log(`===== ***** =====`)

      const findRecipe = (emptySlots: RecipeItemGroup[][]): ExpandedStashItem[] => {
        const items: ExpandedStashItem[] = []
        while (true) {
          const groups = emptySlots.find(x => x.length > 0)
          if (!groups) {
            break
          }
          this.log && console.log(`-----`)
          this.log && console.log(`Attempting to fill '${groups.map(x => RecipeItemGroup[x])}'. Candidates:`)
          // Attempt to find an item, prioritizing main items first
          const candidates = this.getPickableCandidates(splittedCandidates, settings, items, groups, lastItem)
          this.log && console.log(candidates)
          const item = this.findItem(candidates, lastItem)
          if (item) {
            this.log && console.log(`found item:`)
            this.log && console.log(item)
            item.usedInRecipe = true
            items.push(item)
            lastItem = item
            groups.splice(groups.indexOf(item.recipeItemGroup), 1)

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
            // Remove the first item in the group and try again
            const removedItemGroup = groups.splice(0, 1)[0]

            this.log && console.log(`Removed group '${RecipeItemGroup[removedItemGroup]}'`)

            // If it's NOT weapon we can quit early since other pieces aren't interchargable.
            if (removedItemGroup !== RecipeItemGroup.TwoHandedWeapons && removedItemGroup !== RecipeItemGroup.OneHandedWeapons) {
              break
            }
          }
        }
        return items
      }

      let items = findRecipe(defaultEmptySlots.map(groups => [...groups]))
      if (items.some(x => x.recipeItemGroup === RecipeItemGroup.TwoHandedWeapons || x.recipeItemGroup === RecipeItemGroup.OneHandedWeapons) && !this.isValidRecipe(items)) {
        // Try this recipe again, explicitly using the opposite/other weapon type
        const excludedGroup = items.some(x => x.recipeItemGroup === RecipeItemGroup.TwoHandedWeapons) ? RecipeItemGroup.TwoHandedWeapons : RecipeItemGroup.OneHandedWeapons
        items = findRecipe(defaultEmptySlots.map(groups => [...groups.filter(x => x !== excludedGroup)]))
      }

      if (!this.isValidRecipe(items)) {
        this.log && console.log(`Invalid recipe found. Attempted to use items:`)
        this.log && console.log(items)
        // Free up the items again
        items.forEach(item => item.usedInRecipe = false)
        break
      }
      
      let requiredItemCount = defaultEmptySlots.reduce((sum, group) => sum + group.length, 0)
      if (items.some(x => x.recipeItemGroup === RecipeItemGroup.TwoHandedWeapons)) {
        requiredItemCount -= 2
      } else if (items.some(x => x.recipeItemGroup === RecipeItemGroup.OneHandedWeapons)) {
        requiredItemCount--
      }

      // Not all items that are part of this recipe could be found
      if (items.length !== requiredItemCount) {
        this.log && console.log(`Insufficient items found. Found ${items.length} Expected ${requiredItemCount}`)
        this.log && console.log(items)
        // Free up the items again
        items.forEach(item => item.usedInRecipe = false)
        break
      }

      this.log && console.log(`Recipe complete. Used items:`)
      this.log && console.log(items)

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

  protected canTakeItem(item: ExpandedStashItem, groups: RecipeItemGroup[], lastItem: ExpandedStashItem): boolean {
    return !item.usedInRecipe && groups.some(x => x === item.recipeItemGroup)
  }

  protected abstract getSplittedCandidates(allCandidates: ExpandedStashItem[], settings: ItemSetRecipeUserSettings): ExpandedStashItem[][]

  protected abstract getPickableCandidates(splittedCandidates: ExpandedStashItem[][], settings: ItemSetRecipeUserSettings, pickedItems: ExpandedStashItem[], groups: RecipeItemGroup[], lastItem: ExpandedStashItem): ExpandedStashItem[]

  protected abstract isValidRecipe(items: ExpandedStashItem[]): boolean

  private findItem(items: ExpandedStashItem[], lastItem: ExpandedStashItem): ExpandedStashItem {
    const candidates = items
      .map((x) => ({ distance: this.calcDistance(lastItem, x), item: x }))
      .sort((a, b) => a.distance - b.distance)
    this.log && console.log(`Sorted candidates:`)
    this.log && console.log(candidates)
    return candidates[0]?.item
  }
}

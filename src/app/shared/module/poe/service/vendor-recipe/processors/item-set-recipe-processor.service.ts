import { EnumValues } from '@app/class'
import { environment } from '@env/environment'
import { BaseItemTypesService } from '@shared/module/poe/service/base-item-types/base-item-types.service'
import { BaseItemType, ItemCategory, ItemRarity, ItemSetGroup, ItemSetGroupCount, ItemSetProcessResult, ItemSetRecipeProcessor, ItemSetRecipeUserSettings, ItemUsageType, PoEStashTabItem, RecipeHighlightOrder } from '@shared/module/poe/type'
import { ItemParserUtils } from '../../item/parser/item-parser.utils'

export interface ExpandedStashItem extends PoEStashTabItem {
  baseItemTypeId: string
  baseItemType: BaseItemType
  calcX: number
  calcY: number
  itemSetGroup: ItemSetGroup
  quality: number
}

const DefaultRecipeCategoryOrder = [
  [ItemSetGroup.TwoHandedWeapons],
  [ItemSetGroup.Chests],
  [ItemSetGroup.OneHandedWeapons, ItemSetGroup.OneHandedWeapons],
  [ItemSetGroup.Helmets, ItemSetGroup.Gloves, ItemSetGroup.Boots],
  [ItemSetGroup.Belts],
  [ItemSetGroup.Rings, ItemSetGroup.Rings, ItemSetGroup.Amulets],
]

const CategoryMapping = {
  // 1h
  [ItemCategory.WeaponClaw]: ItemSetGroup.OneHandedWeapons,
  [ItemCategory.WeaponDagger]: ItemSetGroup.OneHandedWeapons,
  [ItemCategory.WeaponOneAxe]: ItemSetGroup.OneHandedWeapons,
  [ItemCategory.WeaponOneMace]: ItemSetGroup.OneHandedWeapons,
  [ItemCategory.WeaponOneSword]: ItemSetGroup.OneHandedWeapons,
  [ItemCategory.WeaponRunedagger]: ItemSetGroup.OneHandedWeapons,
  [ItemCategory.WeaponSceptre]: ItemSetGroup.OneHandedWeapons,
  [ItemCategory.WeaponWand]: ItemSetGroup.OneHandedWeapons,
  // 2h
  [ItemCategory.WeaponTwoAxe]: ItemSetGroup.TwoHandedWeapons,
  [ItemCategory.WeaponTwoMace]: ItemSetGroup.TwoHandedWeapons,
  [ItemCategory.WeaponTwoSword]: ItemSetGroup.TwoHandedWeapons,
  [ItemCategory.WeaponBow]: ItemSetGroup.TwoHandedWeapons,
  [ItemCategory.WeaponStaff]: ItemSetGroup.TwoHandedWeapons,
  [ItemCategory.WeaponWarstaff]: ItemSetGroup.TwoHandedWeapons,
  // Others
  [ItemCategory.ArmourHelmet]: ItemSetGroup.Helmets,
  [ItemCategory.ArmourChest]: ItemSetGroup.Chests,
  [ItemCategory.ArmourGloves]: ItemSetGroup.Gloves,
  [ItemCategory.ArmourBoots]: ItemSetGroup.Boots,
  [ItemCategory.AccessoryBelt]: ItemSetGroup.Belts,
  [ItemCategory.AccessoryRing]: ItemSetGroup.Rings,
  [ItemCategory.AccessoryAmulet]: ItemSetGroup.Amulets,
}

export abstract class ItemSetRecipeProcessorService implements ItemSetRecipeProcessor {
  constructor(
    protected readonly baseItemTypeService: BaseItemTypesService
  ) {
  }

  public process(identifier: number, stashItems: PoEStashTabItem[], settings: ItemSetRecipeUserSettings, allRecipes: ItemSetProcessResult): ItemSetProcessResult {
    const result: ItemSetProcessResult = {
      recipes: [],
      itemGroups: [],
    }

    if (!settings.enabled) {
      return result
    }

    // Remove any already used items
    const availableStashItems = stashItems.filter(item => !allRecipes.recipes.some(recipe =>
        recipe.items.some(recipeItem =>
          recipeItem.source.id === item.source.id
        )
      )
    ).map((x) => this.expandItem(x))

    // Determine the base list of recipe items
    const allCandidates = this.getAllRecipeCandidates(availableStashItems, settings)
    const splittedCandidates = this.getSplittedCandidates(allCandidates, settings)

    const getItemCount = (itemSetGroup: ItemSetGroup) => {
      let countMultiplier = 0
      DefaultRecipeCategoryOrder.forEach(x => x.forEach(y => {
        if (y === itemSetGroup) {
          countMultiplier++
        }
      }))
      return allCandidates.filter(x => x.itemSetGroup === itemSetGroup).length / countMultiplier
    }

    // Find Item counts for each Item Set Group
    const itemSetGroups = new EnumValues(ItemSetGroup)
    for (const itemSetGroup of itemSetGroups.keys) {
      const itemGroup: ItemSetGroupCount = {
        identifier,
        group: itemSetGroup,
        count: getItemCount(itemSetGroup),
      }
      if (itemSetGroup == ItemSetGroup.OneHandedWeapons && settings.groupWeaponsTogether) {
        itemGroup.count += getItemCount(ItemSetGroup.TwoHandedWeapons)
      }
      result.itemGroups.push(itemGroup)
    }

    // Determine the empty slots ordering (based on settings)
    let defaultEmptySlots: ItemSetGroup[][]
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
          group.splice(group.indexOf(item.itemSetGroup), 1)

          // Remove conflicting categories based on the added item
          switch (item.itemSetGroup) {
            case ItemSetGroup.TwoHandedWeapons:
              // Remove 1h from the list of items we need
              for (const g in emptySlots) {
                emptySlots[g] = emptySlots[g].filter(x => x !== ItemSetGroup.OneHandedWeapons)
              }
              break

            case ItemSetGroup.OneHandedWeapons:
              // Remove 2h from the list of items we need
              for (const g in emptySlots) {
                emptySlots[g] = emptySlots[g].filter(x => x !== ItemSetGroup.TwoHandedWeapons)
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

      result.recipes.push({
        identifier,
        items,
      })
    }

    if (!environment.production) {
      console.log(`${identifier}. recipes`)
      console.log(result)
    }

    allRecipes.recipes.push(...result.recipes)
    allRecipes.itemGroups.push(...result.itemGroups)

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
    switch (stashItem.itemSetGroup) {
      case ItemSetGroup.Belts:
      case ItemSetGroup.Rings:
      case ItemSetGroup.Amulets:
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

  protected canTakeItem(item: ExpandedStashItem, group: ItemSetGroup[], lastItem: ExpandedStashItem): boolean {
    return group.some((y) => y === item.itemSetGroup)
  }

  protected abstract getSplittedCandidates(allCandidates: ExpandedStashItem[], settings: ItemSetRecipeUserSettings): ExpandedStashItem[][]

  protected abstract getPickableCandidates(splittedCandidates: ExpandedStashItem[][], settings: ItemSetRecipeUserSettings, pickedItems: ExpandedStashItem[]): ExpandedStashItem[]

  private getAllRecipeCandidates(stashItems: ExpandedStashItem[], settings: ItemSetRecipeUserSettings): ExpandedStashItem[] {
    return stashItems.filter((stashItem) => this.isPartOfRecipe(stashItem, settings))
  }

  private takeItem(items: ExpandedStashItem[], group: ItemSetGroup[], lastItem: ExpandedStashItem): ExpandedStashItem {
    const candidates = items
      .filter((x) => this.canTakeItem(x, group, lastItem))
      .map((x) => ({ distance: this.calcDistance(lastItem, x), item: x }))
      .sort((a, b) => a.distance - b.distance)
    return candidates[0]?.item
  }

  private expandItem(stashItem: PoEStashTabItem): ExpandedStashItem {
    const baseItemType = this.baseItemTypeService.search(stashItem.baseItemTypeName)
    const bounds = stashItem.itemLocation.bounds
    const qualityText = stashItem.source.properties?.find(x => x.name === "Quality")?.values[0][0] as string
    return {
      ...stashItem,
      baseItemTypeId: baseItemType.id,
      baseItemType: baseItemType.baseItemType,
      calcX: bounds.x + bounds.width / 2,
      calcY: bounds.y + bounds.height / 2,
      itemSetGroup: CategoryMapping[baseItemType.baseItemType.category],
      quality: qualityText ? ItemParserUtils.parseNumber(qualityText) : 0
    }
  }

  private calcDistance(item1: ExpandedStashItem, item2: ExpandedStashItem): number {
    const pos1 = this.getPos(item1)
    const pos2 = this.getPos(item2)
    let cost = 0
    if (pos1.tab !== pos2.tab) {
      cost += 40
    }
    cost += Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2))
    return cost
  }

  private getPos(item: ExpandedStashItem): { tab: string, x: number, y: number } {
    if (item) {
      return {
        tab: item.itemLocation.tabName,
        x: item.calcX,
        y: item.calcY,
      }
    }
    return { tab: '', x: 0, y: 0 }
  }
}

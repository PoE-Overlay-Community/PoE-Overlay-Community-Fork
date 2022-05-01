import { Injectable } from '@angular/core';
import { EnumValues } from '@app/class';
import { BaseItemTypesService } from '@shared/module/poe/service/base-item-types/base-item-types.service';
import { BaseItemType, ItemCategory, ItemLevelBasedItemSetRecipeUserSettings, ItemRarity, ItemSetGroup, ItemSetGroupCount, ItemSetProcessResult, ItemSetRecipeProcessor, ItemSetRecipeUserSettings, PoEStashTabItem, VendorRecipeType } from '@shared/module/poe/type';

interface ExpandedStashItem extends PoEStashTabItem {
  baseItemTypeId: string
  baseItemType: BaseItemType
  calcX: number
  calcY: number
  itemSetGroup: ItemSetGroup
}

const DefaultRecipeCategoryOrder = [
  [ItemSetGroup.Chests],
  [ItemSetGroup.TwoHandedWeapons],
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

@Injectable({
  providedIn: 'root',
})
export class ChaosRecipeProcessorService implements ItemSetRecipeProcessor {
  constructor(private readonly baseItemTypeService: BaseItemTypesService) {
  }

  public process(stashItems: PoEStashTabItem[], settings: ItemLevelBasedItemSetRecipeUserSettings): ItemSetProcessResult {
    const result: ItemSetProcessResult = {
      recipes: [],
      itemGroups: [],
    }

    if (!settings.enabled) {
      return result
    }

    // Determine the base list of chaos recipe items
    const candidates = stashItems.filter((x) =>
      x.rarity === ItemRarity.Rare &&
      (!x.source.identified || settings.useIdentifiedItems)
    ).map((x) => this.expandItem(x))

    const getItemCount = (itemSetGroup: ItemSetGroup) => {
      let countMultiplier = 0
      DefaultRecipeCategoryOrder.forEach(x => x.forEach(y => {
        if (y === itemSetGroup) {
          countMultiplier++
        }
      }))
      return candidates.filter(x => x.itemSetGroup === itemSetGroup).length / countMultiplier
    }

    // Find Item counts for each Item Set Group
    const itemSetGroups = new EnumValues(ItemSetGroup)
    for (const itemSetGroup of itemSetGroups.keys) {
      const itemGroup: ItemSetGroupCount = {
        type: VendorRecipeType.Chaos,
        group: itemSetGroup,
        count: getItemCount(itemSetGroup),
      }
      if (itemSetGroup == ItemSetGroup.OneHandedWeapons && settings.groupWeaponsTogether) {
        itemGroup.count += getItemCount(ItemSetGroup.TwoHandedWeapons)
      }
      result.itemGroups.push(itemGroup)
    }

    // Determine chaos recipe items
    const chaosRecipeCandidates = candidates.filter((x) =>
      x.itemLevel >= 60 &&
      x.itemLevel < 75
    )

    // Determine chaos recipe filler items
    const chaosRecipeFillerCandidates = candidates.filter((x) =>
      x.itemLevel >= 75
    )

    // Find all chaos recipes
    while (result.recipes.length < settings.fullSetThreshold) {
      const emptySlots = DefaultRecipeCategoryOrder.map(x => [...x])

      const items: ExpandedStashItem[] = []
      let hasChaosItem = false
      let noItemsFound = false
      let lastItem: ExpandedStashItem = undefined
      while (true) {
        const group = emptySlots.find(x => x.length > 0)
        if (!group) {
          break
        }
        // Attempt to find an item, prioritizing chaos items first
        const candidates = [...(hasChaosItem ? chaosRecipeFillerCandidates : chaosRecipeCandidates)]
        if (hasChaosItem && settings.fillGreedy) {
        // Attempt to find a chaos-item to greedily fill this group
          candidates.push(...chaosRecipeCandidates)
        }
        const item = this.takeItem(candidates, group, lastItem)
        if (item) {
          const itemIndex = chaosRecipeCandidates.indexOf(item)
          if (itemIndex === -1) {
            chaosRecipeFillerCandidates.splice(chaosRecipeFillerCandidates.indexOf(item), 1)
          } else {
            chaosRecipeCandidates.splice(itemIndex, 1)
          }
          hasChaosItem = hasChaosItem || item.itemLevel < 75
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
        type: VendorRecipeType.Chaos,
        items,
      })
    }

    console.log('recipes:')
    console.log(result)

    return result
  }

  private takeItem(items: ExpandedStashItem[], group: ItemSetGroup[], lastItem: ExpandedStashItem): ExpandedStashItem {
    const candidates = items
      .filter((x) => group.findIndex((y) => y === x.itemSetGroup) !== -1)
      .map((x) => ({ distance: this.calcDistance(lastItem, x), item: x }))
      .sort((a, b) => a.distance - b.distance)
    return candidates[0]?.item
  }

  private expandItem(stashItem: PoEStashTabItem): ExpandedStashItem {
    const baseItemType = this.baseItemTypeService.search(stashItem.baseItemTypeName)
    return {
      ...stashItem,
      baseItemTypeId: baseItemType.id,
      baseItemType: baseItemType.baseItemType,
      calcX: stashItem.stashLocation.x + stashItem.stashLocation.width / 2,
      calcY: stashItem.stashLocation.y + stashItem.stashLocation.height / 2,
      itemSetGroup: CategoryMapping[baseItemType.baseItemType.category]
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
        tab: item.stashTabId,
        x: item.calcX,
        y: item.calcY,
      }
    }
    return { tab: '', x: 0, y: 0 }
  }
}

import { Injectable } from '@angular/core'
import { ModifierType, PSEUDO_MODIFIERS } from '@shared/module/poe/config/pseudo.config'
import { Item, ItemCategory, ItemRarity, ItemStat, StatGenType, StatType } from '@shared/module/poe/type'
import { ItemParserUtils } from '../parser/item-parser.utils'

@Injectable({
  providedIn: 'root',
})
export class ItemPseudoProcessorService {
  public process(item: Item): void {
    if (!item.stats) {
      item.stats = []
    }

    const emptyAndCraftedPseudoMods: ItemStat[] = []
    if (item.category.startsWith(ItemCategory.Weapon)
      || item.category.startsWith(ItemCategory.Armour)
      || item.category.startsWith(ItemCategory.Accessory)
      || item.category.startsWith(ItemCategory.Jewel)
      || item.category.startsWith(ItemCategory.Flask)) {
      emptyAndCraftedPseudoMods.push(...this.addPseudoEmptyModifiers(item))
      emptyAndCraftedPseudoMods.push(...this.addPseudoCraftedModifiers(item))
    }

    this.groupPseudoMods(item)

    this.groupIdenticalMods(item)

    item.stats.push(...emptyAndCraftedPseudoMods)
  }

  private addPseudoEmptyModifiers(item: Item): ItemStat[] {
    const newMods: ItemStat[] = []
    const maxMods = this.getMaxMods(item)
    if (maxMods.total == 0) {
      return newMods
    }

    // Only include crafted mods when the item is corrupted or mirrored. Otherwise exclude them since they can easily be replaced or removed using the crafting bench (and this shouldn't count towards the total)
    const explicitMods = item.stats.filter(x => x.genType !== StatGenType.Unknown && (
      x.type === StatType.Explicit ||
      x.type === StatType.Fractured ||
      x.type === StatType.Veiled ||
      (x.type === StatType.Crafted && (item.corrupted || item.mirrored))
    ))

    const numExplicitMods = explicitMods.length
    const numEmptyAffixMods = maxMods.total - numExplicitMods

    if (numExplicitMods > 0 && numEmptyAffixMods > 0) {
      newMods.push(this.createPseudoMod('pseudo_number_of_empty_affix_mods', [numEmptyAffixMods]))

      const numPrefixes = explicitMods.filter(x => x.genType === StatGenType.Prefix).length
      const numSuffixes = explicitMods.filter(x => x.genType === StatGenType.Suffix).length
      const numEmptyPrefixes = maxMods.prefixes - numPrefixes
      const numEmptySuffixes = maxMods.suffixes - numSuffixes
      if (numEmptyPrefixes > 0) {
        newMods.push(this.createPseudoMod('pseudo_number_of_empty_prefix_mods', [numEmptyPrefixes]))
      }
      if (numEmptySuffixes > 0) {
        newMods.push(this.createPseudoMod('pseudo_number_of_empty_suffix_mods', [numEmptySuffixes]))
      }
    }
    return newMods
  }

  private addPseudoCraftedModifiers(item: Item): ItemStat[] {
    const newMods: ItemStat[] = []

    const craftedMods = item.stats.filter(x => x.genType !== StatGenType.Unknown && x.type === StatType.Crafted)
    const numCraftedMods = craftedMods.length

    if (numCraftedMods > 0) {
      newMods.push(this.createPseudoMod('pseudo_number_of_crafted_mods', [numCraftedMods]))

      const numPrefixes = craftedMods.filter(x => x.genType === StatGenType.Prefix).length
      const numSuffixes = craftedMods.filter(x => x.genType === StatGenType.Suffix).length
      if (numPrefixes > 0) {
        newMods.push(this.createPseudoMod('pseudo_number_of_crafted_prefix_mods', [numPrefixes]))
      }
      if (numSuffixes > 0) {
        newMods.push(this.createPseudoMod('pseudo_number_of_crafted_suffix_mods', [numSuffixes]))
      }
    }

    return newMods
  }

  private getMaxMods(item: Item): { prefixes: number, suffixes: number, total: number } {
    const maxMods = {
      prefixes: 0,
      suffixes: 0,
      total: 0
    }

    switch (item.rarity) {
      case ItemRarity.Magic:
        maxMods.prefixes = 1
        maxMods.suffixes = 1
        maxMods.total = 2
        break

      case ItemRarity.Rare:
        maxMods.prefixes = 3
        maxMods.suffixes = 3
        maxMods.total = 6
        break
    }

    if (item.category.startsWith(ItemCategory.Jewel)) {
        maxMods.prefixes = 2
        maxMods.suffixes = 2
        maxMods.total = 4
    }

    const maxPrefixesPlus = item.stats.find(x => x.id === 'local_maximum_prefixes_allowed_+')
    if (maxPrefixesPlus) {
      maxMods.prefixes += maxPrefixesPlus.values[0].value
    }

    const maxSuffixesPlus = item.stats.find(x => x.id === 'local_maximum_suffixes_allowed_+')
    if (maxSuffixesPlus) {
      maxMods.suffixes += maxSuffixesPlus.values[0].value
    }

    return maxMods
  }

  private createPseudoMod(id: string, values: number[], relatedStats?: ItemStat[]): ItemStat {
    const itemStat: ItemStat = {
      id,
      type: StatType.Pseudo,
      predicateIndex: 0,
      predicate: '#',
      tradeId: id,
      values: values.map(x => ({ text: `${+x.toFixed(2)}` })),
      negated: false,
      option: false,
      mod: undefined,
      indistinguishables: undefined,
      relatedStats,
    }
    return itemStat
  }

  private groupPseudoMods(item: Item): void {
    const itemStats = [...item.stats]
    Object.getOwnPropertyNames(PSEUDO_MODIFIERS).forEach((id) => {
      const pseudo = PSEUDO_MODIFIERS[id]
      let values: number[] = []
      let count = 0
      let minCount = pseudo.count
      const relatedStats: ItemStat[] = []

      if (pseudo.mods) {
        for (const mod of pseudo.mods) {
          const stats = itemStats.filter((x) => x.id === mod.id && x.values.length > 0)
          if (stats.length <= 0) {
            if (mod.type === ModifierType.MinimumRequired) {
              values = []
              break
            }
            continue
          }

          relatedStats.push(...stats)

          if (mod.count && (!minCount || mod.count > minCount)) {
            minCount = mod.count
          }


          stats.forEach((stat) => {
            count++
            values = this.calculateValue(stat, mod.type, values)

            if (
              stat.type !== StatType.Pseudo && // Never remove pseudo stats
              item.rarity !== ItemRarity.Unique && // Never remove stats from unique items
              item.rarity !== ItemRarity.UniqueRelic && // Never remove stats from unique relic items
              stat.type !== StatType.Fractured && // Never remove fractured stats
              stat.type !== StatType.Scourge && // Never remove scourged stats
              stat.type !== StatType.Crucible && // Never remove crucible stats
              // Never remove synthesised implicit stats
              (!item.influences || !item.influences.synthesised || stat.type !== StatType.Implicit) &&
              // Never remove stats if the pseudo grouping occured with a scourged or crucible stat
              stats.findIndex(x => x.type === StatType.Scourge || x.type === StatType.Crucible) === -1
            ) {
              item.stats = item.stats.filter((y) => y !== stat)
            }
          })
        }
      } else if (pseudo.prop) {
        const prop = pseudo.prop(item)
        if (prop !== undefined) {
          values.push(ItemParserUtils.parseNumberSimple(prop))
        }
      }

      const itemStat = this.createPseudoMod(id, values, relatedStats)
      itemStats.push(itemStat)
      if (values.length > 0 && (!minCount || count >= minCount)) {
        item.stats.push(itemStat)
      }
    })
  }

  private groupIdenticalMods(item: Item): void {
    const itemStats = [...item.stats]
    itemStats.forEach(stat => {
      const identicalStats = itemStats.filter(x => x.tradeId == stat.tradeId && x.type == stat.type)
      if (identicalStats.length <= 1) return
      let values = []
      let count = 0
      identicalStats.forEach(identicalStat => {
        count++
        values = this.calculateValue(identicalStat, ModifierType.Addition, values)
        // Remove the duplicate stat
        if (count > 1) {
          item.stats = item.stats.filter(y => y !== identicalStat)
        }
      })
      // Update the values of the stat
      stat.values = values.map(x => ({ text: `${+x.toFixed(2)}` }))
    })
  }

  private calculateValue(stat: ItemStat, type: ModifierType, values: number[]): number[] {
    while (stat.values.length > values.length) {
      values.push(0)
    }

    return values.map((current, index) => {
      const itemValue = stat.values[index] || stat.values[0]
      if (!itemValue) {
        return current
      }

      const parsed = ItemParserUtils.parseNumberSimple(itemValue.text)
      const negate = !stat.negated && stat.predicate[0] === 'N' ? -1 : 1

      const value = parsed * negate
      if (type === ModifierType.MinimumRequired) {
        if (current === 0) {
          return value
        }
        return Math.min(value, current)
      }
      if (type === ModifierType.Addition5Every10) {
        return current + (value / 10) * 5
      }
      if (type === ModifierType.Addition1Every2) {
        return current + value / 2
      }
      return current + value
    })
  }
}

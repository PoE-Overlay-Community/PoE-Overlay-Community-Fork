import { Injectable } from '@angular/core'
import {
  ExportedItem,
  Item,
  ItemRarity,
  ItemSection,
  ItemSectionParserService,
  Section,
  ItemCategory,
} from '@shared/module/poe/type'
import { StatsSearchOptions, StatsService } from '../../stats/stats.service'

@Injectable({
  providedIn: 'root',
})
export class ItemSectionStatsParserService implements ItemSectionParserService {
  constructor(
    private readonly statsService: StatsService,
  ) { }

  public optional = true
  public section = ItemSection.Stats

  public parse(item: ExportedItem, target: Item): Section {
    switch (target.rarity) {
      case ItemRarity.Normal:
      case ItemRarity.Magic:
      case ItemRarity.Rare:
      case ItemRarity.Unique:
      case ItemRarity.UniqueRelic:
        break
      case ItemRarity.Currency:
        if (target.properties?.ultimatum) {
          break
        }
        return null
      default:
        return null
    }

    const contents = item.sections.map((section) => section.content)
    const content = contents.join('\n')

    const result = this.statsService.searchMultiple(contents, this.createOptions(target))
    const sorted = result.sort(
      (a, b) => content.indexOf(a.match.text) - content.indexOf(b.match.text)
    )
    target.stats = sorted.map((x) => x.stat)
  }

  private createOptions(item: Item): StatsSearchOptions {
    const options: StatsSearchOptions = {
      ultimatum: item.typeId === 'ItemisedTrial' || item.typeId === 'MapWorldsTrialmaster',
      sanctum: item.category === ItemCategory.SanctumRelic || item.category === ItemCategory.SanctumResearch,
      map: item.category === ItemCategory.Map,
      critical_strike_chance___: true,
    }

    if (!item.properties) {
      return options
    }

    if (item.properties.weaponPhysicalDamage) {
      options.local_minimum_added_physical_damage_local_maximum_added_physical_damage = true
      options.local_mana_leech_from_physical_damage_permyriad = true
      options.local_life_leech_from_physical_damage_permyriad = true
    }
    if (item.properties.weaponElementalDamage && item.properties.weaponElementalDamage.length > 0) {
      options.local_minimum_added_fire_damage_local_maximum_added_fire_damage = true
      options.local_minimum_added_cold_damage_local_maximum_added_cold_damage = true
      options.local_minimum_added_lightning_damage_local_maximum_added_lightning_damage = true
    }
    if (item.properties.weaponChaosDamage) {
      options.local_minimum_added_chaos_damage_local_maximum_added_chaos_damage = true
    }

    if (item.properties.weaponAttacksPerSecond) {
      options.local_attack_speed___ = true
    }

    // Weapons have local crit chance when its crit chance is marked as 'augmented'
    if (item.properties.weaponCriticalStrikeChance?.augmented) {
      options.local_critical_strike_chance___ = true
    }

    if (item.properties.armourEvasionRating) {
      options.local_base_evasion_rating = true
      options.local_evasion_rating___ = true
    }

    if (item.properties.armourArmour) {
      options.local_base_physical_damage_reduction_rating = true
      options.local_physical_damage_reduction_rating___ = true
    }

    if (item.properties.armourEnergyShield) {
      options.local_energy_shield = true
    }

    if (
      item.properties.weaponAttacksPerSecond ||
      item.properties.weaponChaosDamage ||
      item.properties.weaponCriticalStrikeChance ||
      (item.properties.weaponElementalDamage && item.properties.weaponElementalDamage.length > 0) ||
      item.properties.weaponPhysicalDamage ||
      item.properties.weaponRange
    ) {
      options.local_accuracy_rating = true
      options.local_poison_on_hit__ = true
    }

    return options
  }
}

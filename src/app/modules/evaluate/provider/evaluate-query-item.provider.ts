import { Injectable } from '@angular/core'
import { ItemSocketService } from '@shared/module/poe/service/item/item-socket.service'
import { Item, ItemCategory, ItemRarity, ItemSocketColor, ItemStat, StatType } from '@shared/module/poe/type'
import { ModIconsService } from '../../../shared/module/poe/service/mod-icons/mod-icons.service'
import { EvaluateUserSettings } from '../component/evaluate-settings/evaluate-settings.component'

export interface EvaluateQueryItemResult {
  queryItem: Item
  defaultItem: Item
}

const SocketRelatedStatIds: string[] = [
  "stat_899329924", // "Gems can be Socketed in this Item ignoring Socket Colour" -- Dialla's Malefaction
  "stat_3192592092", // "Sockets cannot be modified" -- Skin of the Lords | Skin of the Loyal
  "stat_2112615899", // "#% increased Global Physical Damage with Weapons per Red Socket" -- Prismatic Eclipse
  "stat_2139569643", // "Minions convert #% of Physical Damage to Fire Damage per Red Socket" -- Triad Grip
  "stat_3025389409", // "#% of Physical Attack Damage Leeched as Life per Red Socket" -- Scaeva
  "stat_4210076836", // "# to Maximum Life per Red Socket" -- The Pariah
  "stat_1666896662", // "You and Nearby Allies have # to # added Fire Damage per Red Socket" -- Crown of the Tyrant
]

@Injectable({
  providedIn: 'root',
})
export class EvaluateQueryItemProvider {
  constructor(
    private readonly itemSocketService: ItemSocketService,
    private readonly modIconService: ModIconsService,
  ) { }

  public provide(item: Item, settings: EvaluateUserSettings): EvaluateQueryItemResult {
    const defaultItem: Item = this.copy({
      nameId: item.nameId,
      typeId: item.typeId,
      category: item.category,
      rarity: item.rarity,
      corrupted: item.corrupted,
      // Don't copy mirrored; doing so will auto-select it and narrow the search too much
      unmodifiable: item.unmodifiable,
      unidentified: item.unidentified,
      veiled: item.veiled,
      blighted: item.blighted,
      blightRavaged: item.blightRavaged,
      relic: item.relic,
      influences: item.influences || {},
      damage: {},
      stats: [],
      properties: {
        qualityType: (item.properties || {}).qualityType,
        ultimatum: {},
        heist: {
          requiredSkills: [],
        },
      },
      requirements: {},
      sockets: new Array((item.sockets || []).length).fill({}),
    })
    const queryItem = this.copy(defaultItem)

    // Deselect fractured & synthesised to avoid narrowing the query item too much
    if (queryItem.influences) {
      queryItem.influences.fractured = undefined
      queryItem.influences.synthesised = undefined
    }

    if (settings.evaluateQueryDefaultItemLevel && queryItem.rarity !== ItemRarity.Unique && queryItem.rarity !== ItemRarity.UniqueRelic) {
      queryItem.level = item.level
    }

    const count = this.itemSocketService.getLinkCount(item.sockets)
    if (count >= settings.evaluateQueryDefaultLinks) {
      item.sockets.forEach((socket, index) => {
        queryItem.sockets[index].linked = socket.linked
      })
    }

    if (item.sockets && item.sockets.length >= settings.evaluateQueryDefaultColors) {
      item.sockets.forEach((socket, index) => {
        let newColor = ItemSocketColor.Any
        if (item.corrupted || socket.color === ItemSocketColor.White || item.stats.some(stat => SocketRelatedStatIds.some(y => stat.id === y))) {
          newColor = socket.color
        }
        queryItem.sockets[index].color = newColor
      })
    }

    if (settings.evaluateQueryDefaultUltimatum) {
      const ultimatum = item.properties?.ultimatum
      if (ultimatum) {
        queryItem.properties.ultimatum = ultimatum
      }
    }

    const heist = item.properties?.heist
    if (heist) {
      const queryHeist = queryItem.properties.heist
      if (settings.evaluateQueryDefaultHeistRequiredLevels) {
        queryHeist.requiredSkills.push(...heist.requiredSkills)
      }

      if (settings.evaluateQueryDefaultHeistContracts) {
        queryHeist.objectiveValue = heist.objectiveValue
      }

      if (settings.evaluateQueryDefaultHeistBlueprints) {
        queryHeist.wingsRevealed = heist.wingsRevealed
        queryHeist.escapeRoutes = heist.escapeRoutes
        queryHeist.rewardRooms = heist.rewardRooms
      }
    }

    if (settings.evaluateQueryDefaultMiscs) {
      const prop = item.properties
      if (prop) {
        queryItem.properties.gemLevel = prop.gemLevel
        queryItem.properties.gemQualityType = prop.gemQualityType
        queryItem.properties.mapTier = prop.mapTier
        queryItem.properties.durability = prop.durability
        queryItem.properties.storedExperience = prop.storedExperience
        queryItem.properties.areaLevel = prop.areaLevel
        if (item.rarity === ItemRarity.Gem || prop.qualityType > 0) {
          queryItem.properties.quality = prop.quality
        }
      }
    }

    if (settings.evaluateQueryDefaultAttack && queryItem.rarity !== ItemRarity.Unique && queryItem.rarity !== ItemRarity.UniqueRelic) {
      queryItem.damage = item.damage

      const prop = item.properties
      if (prop) {
        if (item.category.startsWith(ItemCategory.Weapon)) {
          queryItem.properties.weaponAttacksPerSecond = prop.weaponAttacksPerSecond
          queryItem.properties.weaponCriticalStrikeChance = prop.weaponCriticalStrikeChance
        }
      }
    }

    if (settings.evaluateQueryDefaultDefense && queryItem.rarity !== ItemRarity.Unique && queryItem.rarity !== ItemRarity.UniqueRelic) {
      const prop = item.properties
      if (prop) {
        if (item.category.startsWith(ItemCategory.Armour)) {
          queryItem.properties.armourArmour = prop.armourArmour
          queryItem.properties.armourEvasionRating = prop.armourEvasionRating
          queryItem.properties.armourEnergyShield = prop.armourEnergyShield
          queryItem.properties.armourWard = prop.armourWard
          queryItem.properties.shieldBlockChance = prop.shieldBlockChance
        }
      }
    }

    if (!settings.evaluateQueryDefaultType) {
      if (
        item.rarity === ItemRarity.Normal ||
        item.rarity === ItemRarity.Magic ||
        item.rarity === ItemRarity.Rare
      ) {
        if (
          item.category.startsWith(ItemCategory.Weapon) ||
          item.category.startsWith(ItemCategory.Armour) ||
          item.category.startsWith(ItemCategory.Accessory)
        ) {
          queryItem.typeId = queryItem.nameId = undefined
        }
      }
    }

    const incursion = item.properties?.incursion
    if (incursion) {
      queryItem.properties.incursion = {
        openRooms: incursion.openRooms.map((room) => {
          const key = `${room.stat.type}.${room.stat.tradeId}`
          return settings.evaluateQueryDefaultStats[key] ? room : undefined
        }),
        closedRooms: incursion.closedRooms.map((room) => {
          const key = `${room.stat.type}.${room.stat.tradeId}`
          return settings.evaluateQueryDefaultStats[key] ? room : undefined
        }),
      }
    }

    if (item.stats) {
      if (
        (item.rarity === ItemRarity.Unique || item.rarity === ItemRarity.UniqueRelic) &&
        settings.evaluateQueryDefaultStatsUnique
      ) {
        // Select all stats if it's corrupted, mirrored or unmodifiable, otherwise exclude implicit stats
        queryItem.stats = item.stats.map((stat) => (item.corrupted || item.mirrored || item.unmodifiable || !this.isRelatedToAnImplicitStat(stat)) ? stat : undefined)
      } else {
        queryItem.stats = item.stats.map((stat) => {
          // Auto-select enchanted stats or stats with a mod icon
          if ((stat.type === StatType.Enchant && settings.evaluateQueryDefaultStatsEnchants) ||
            (settings.evaluateQueryDefaultStatsModIcon && this.modIconService.get(stat.modName))) {
            return stat
          }
          const key = `${stat.type}.${stat.tradeId}`
          return settings.evaluateQueryDefaultStats[key] ? stat : undefined
        })
      }
    }

    return {
      defaultItem: this.copy(defaultItem),
      queryItem: this.copy(queryItem),
    }
  }

  private copy(item: Item): Item {
    return JSON.parse(JSON.stringify(item))
  }

  private isRelatedToAnImplicitStat(stat: ItemStat): boolean {
    return stat.type === StatType.Implicit || (stat.relatedStats?.some(s => this.isRelatedToAnImplicitStat(s)) ?? false)
  }
}

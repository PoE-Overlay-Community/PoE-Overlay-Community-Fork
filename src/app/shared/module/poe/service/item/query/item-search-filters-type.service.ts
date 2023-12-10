import { Injectable } from '@angular/core'
import { Query } from '@data/poe'
import {
  Item,
  ItemCategory,
  ItemRarity,
  ItemSearchFiltersService,
  Language,
} from '@shared/module/poe/type'
import { ItemService } from '../item.service'

@Injectable({
  providedIn: 'root',
})
export class ItemSearchFiltersTypeService implements ItemSearchFiltersService {
  constructor(private readonly itemNameService: ItemService) {}

  public add(item: Item, language: Language, query: Query): void {
    query.filters.type_filters = {
      filters: {},
    }

    const name = this.itemNameService.getName(item.nameId, language)
    if (name) {
      query.name = {
        option: name,
      }
    }

    const type = this.itemNameService.getType(item.typeId, language)
    if (type) {
      query.type = {
        option: type,
      }
    }

    switch (item.category) {
      // weapon
      case ItemCategory.Weapon:
      case ItemCategory.WeaponOne:
      case ItemCategory.WeaponOneMelee:
      case ItemCategory.WeaponTwoMelee:
      case ItemCategory.WeaponBow:
      case ItemCategory.WeaponClaw:
      case ItemCategory.WeaponDagger:
      case ItemCategory.WeaponRunedagger:
      case ItemCategory.WeaponOneAxe:
      case ItemCategory.WeaponOneMace:
      case ItemCategory.WeaponOneSword:
      case ItemCategory.WeaponSceptre:
      case ItemCategory.WeaponStaff:
      case ItemCategory.WeaponWarstaff:
      case ItemCategory.WeaponTwoAxe:
      case ItemCategory.WeaponTwoMace:
      case ItemCategory.WeaponTwoSword:
      case ItemCategory.WeaponWand:
      case ItemCategory.WeaponRod:
      // armour
      case ItemCategory.Armour:
      case ItemCategory.ArmourChest:
      case ItemCategory.ArmourBoots:
      case ItemCategory.ArmourGloves:
      case ItemCategory.ArmourHelmet:
      case ItemCategory.ArmourShield:
      case ItemCategory.ArmourQuiver:
      // accessory
      case ItemCategory.Accessory:
      case ItemCategory.AccessoryAmulet:
      case ItemCategory.AccessoryBelt:
      case ItemCategory.AccessoryRing:
      case ItemCategory.AccessoryTrinket:
        switch (item.rarity) {
          case ItemRarity.Unique:
            query.filters.type_filters.filters.rarity = {
              option: item.rarity,
            }
            break
          case ItemRarity.UniqueRelic:
            query.filters.type_filters.filters.rarity = {
              option: item.relic ? item.rarity : ItemRarity.Unique,
            }
            break
          default:
            query.filters.type_filters.filters.rarity = {
              option: ItemRarity.NonUnique,
            }

            if (query.name) {
              query.term = `${query.name.option || ''} ${query.type.option || ''}`.trim()
              query.name = query.type = undefined
            }
            break
        }
        query.filters.type_filters.filters.category = {
          option: item.category,
        }
        break
      // jewel
      case ItemCategory.Jewel:
      case ItemCategory.JewelBase:
      case ItemCategory.JewelAbyss:
      case ItemCategory.JewelCluster:
      // flasks
      case ItemCategory.Flask:
      // map
      case ItemCategory.Map:
      // monster
      case ItemCategory.MonsterBeast:
      // watchstones
      case ItemCategory.Watchstone:
        switch (item.rarity) {
          case ItemRarity.Unique:
            query.filters.type_filters.filters.rarity = {
              option: item.rarity,
            }
            break
          case ItemRarity.UniqueRelic:
            query.filters.type_filters.filters.rarity = {
              option: item.relic ? item.rarity : ItemRarity.Unique,
            }
            break
          default:
            query.filters.type_filters.filters.rarity = {
              option: ItemRarity.NonUnique,
            }
            break
        }
        query.filters.type_filters.filters.category = {
          option: item.category,
        }
        break
      // gem
      case ItemCategory.Gem:
      case ItemCategory.GemActiveGem:
      case ItemCategory.GemSupportGem:
      case ItemCategory.GemSupportGemplus:
        if (item.typeId?.startsWith("TransfiguredGem_")) {
          query.term = query.type.option
          query.type = undefined
        }

        query.filters.type_filters.filters.category = {
          option: item.category,
        }
        break
      // leaguestone
      case ItemCategory.Leaguestone:
      // memoryline
      case ItemCategory.MemoryLine:
      // currency
      case ItemCategory.Currency:
      case ItemCategory.CurrencyPiece:
      case ItemCategory.CurrencyResonator:
      case ItemCategory.CurrencyFossil:
      case ItemCategory.CurrencyIncubator:
      case ItemCategory.CurrencyHeistTarget:
      case ItemCategory.CurrencyOmen:
      case ItemCategory.CurrencyTattoo:
      // seed
      case ItemCategory.CurrencySeed:
      case ItemCategory.CurrencyWildSeed:
      case ItemCategory.CurrencyVividSeed:
      case ItemCategory.CurrencyPrimalSeed:
      case ItemCategory.CurrencySeedBooster:
      // map
      case ItemCategory.MapFragment:
      case ItemCategory.MapInvitation:
      case ItemCategory.MapScarab:
      // divination card
      case ItemCategory.Card:
      // heist
      case ItemCategory.HeistEquipment:
      case ItemCategory.HeistGear:
      case ItemCategory.HeistTool:
      case ItemCategory.HeistCloak:
      case ItemCategory.HeistBrooch:
      case ItemCategory.HeistMission:
      case ItemCategory.HeistContract:
      case ItemCategory.HeistBlueprint:
      // expedition
      case ItemCategory.ExpeditionLogbook:
      // sanctum
      case ItemCategory.SanctumRelic:
      case ItemCategory.SanctumResearch:
      // affliction (azmeri)
      case ItemCategory.AzmeriTincture:
      case ItemCategory.AzmeriCharm:
      case ItemCategory.AzmeriTincture:
        query.filters.type_filters.filters.category = {
          option: item.category,
        }
        break
      // metamorph samples
      case ItemCategory.MonsterSample:
        query.filters.type_filters.filters.category = {
          option: item.category,
        }
        if (item.rarity === ItemRarity.Unique || item.rarity === ItemRarity.UniqueRelic) {
          query.term = undefined
          query.name = undefined
          query.type = undefined
        }
        break
      // prophecy
      case ItemCategory.Prophecy:
        query.filters.type_filters.filters.category = {
          option: item.category,
        }
        if (query.type.option.endsWith(')')) {
          const discrimininatorStartIdx = query.type.option.lastIndexOf('(')
          query.name = {
            option: query.type.option.substr(0, discrimininatorStartIdx).trim(),
            discriminator: query.type.option.substr(
              discrimininatorStartIdx + 1,
              query.type.option.length - discrimininatorStartIdx - 2
            ),
          }
        } else {
          query.name = {
            option: query.type.option,
          }
        }
        query.type = undefined
        break
      default:
        break
    }
  }
}

import { Injectable } from '@angular/core'
import { CacheService } from '@app/service'
import {
  CurrencyOverviewHttpService,
  CurrencyOverviewType,
  ItemOverviewHttpService,
  ItemOverviewType,
} from '@data/poe-ninja'
import { forkJoin, Observable, of } from 'rxjs'
import { map } from 'rxjs/operators'
import { CacheExpirationType, ItemCategory, ItemRarity } from '@shared/module/poe/type'

export interface ItemCategoryValue {
  name: string
  type: string
  mapTier: number
  levelRequired: number
  links: number
  gemLevel: number
  gemQuality: number
  corrupted: boolean
  relic: boolean
  prophecyText: string
  chaosAmount: number
  change: number
  history: number[]
  url: string
}

export interface ItemCategoryValues {
  values: ItemCategoryValue[]
}

@Injectable({
  providedIn: 'root',
})
export class ItemCategoryValuesProvider {
  constructor(
    private readonly currencyService: CurrencyOverviewHttpService,
    private readonly itemService: ItemOverviewHttpService,
    private readonly cache: CacheService
  ) {}

  public provide(
    leagueId: string,
    rarity: ItemRarity,
    category: ItemCategory
  ): Observable<ItemCategoryValues> {
    switch (category) {
      case ItemCategory.Map: {
        if (rarity === ItemRarity.Unique || rarity === ItemRarity.UniqueRelic) {
          const key = `${leagueId}_${ItemCategory.Map}_${ItemRarity.Unique}`
          return this.fetch(key, () => this.fetchItem(leagueId, ItemOverviewType.UniqueMap))
        } else {
          const key = `${leagueId}_${ItemCategory.Map}`
          return forkJoin([
            this.fetch(key, () => this.fetchItem(leagueId, ItemOverviewType.Map)),
            this.fetch(`${key}_blighted`, () =>
              this.fetchItem(leagueId, ItemOverviewType.BlightedMap)
            ),
          ]).pipe(
            map(([maps, blightedMaps]) => {
              return {
                values: [...maps.values, ...blightedMaps.values],
              }
            })
          )
        }
      }
      case ItemCategory.Prophecy: {
        const key = `${leagueId}_${ItemCategory.Prophecy}`
        return this.fetch(key, () => this.fetchItem(leagueId, ItemOverviewType.Prophecy))
      }
      case ItemCategory.Card: {
        const key = `${leagueId}_${ItemCategory.Card}`
        return this.fetch(key, () => this.fetchItem(leagueId, ItemOverviewType.DivinationCard))
      }
      case ItemCategory.Currency: {
        const key = `${leagueId}_${ItemCategory.Currency}`
        return forkJoin([
          this.fetch(key, () => this.fetchCurrency(leagueId, CurrencyOverviewType.Currency)),
          this.fetch(`${key}_essence`, () => this.fetchItem(leagueId, ItemOverviewType.Essence)),
          this.fetch(`${key}_oil`, () => this.fetchItem(leagueId, ItemOverviewType.Oil)),
          this.fetch(`${key}_vial`, () => this.fetchItem(leagueId, ItemOverviewType.Vial)),
          this.fetch(`${key}_deliriumOrb`, () => this.fetchItem(leagueId, ItemOverviewType.DeliriumOrb)),
          this.fetch(`${key}_artifact`, () => this.fetchItem(leagueId, ItemOverviewType.Artifact)),
          this.fetch(`${leagueId}_${ItemCategory.MapFragment}`, () => this.fetchCurrency(leagueId, CurrencyOverviewType.Fragment)),
        ]).pipe(
          map(([currencies, essences, oil, vial, deliriumOrb, artifacts, fragments]) => {
            return {
              values: [
                ...currencies.values,
                ...essences.values,
                ...oil.values,
                ...vial.values,
                ...deliriumOrb.values,
                ...artifacts.values,
                ...fragments.values,
              ],
            }
          })
        )
      }
      case ItemCategory.MapFragment: {
        const key = `${leagueId}_${ItemCategory.MapFragment}`
        return this.fetch(key, () => this.fetchCurrency(leagueId, CurrencyOverviewType.Fragment))
      }
      case ItemCategory.MapInvitation: {
        const key = `${leagueId}_${ItemCategory.MapInvitation}`
        return this.fetch(key, () => this.fetchItem(leagueId, ItemOverviewType.Invitation))
      }
      case ItemCategory.Watchstone: {
        const key = `${leagueId}_${ItemCategory.Watchstone}`
        return this.fetch(key, () => this.fetchItem(leagueId, ItemOverviewType.Watchstone))
      }
      case ItemCategory.CurrencyFossil: {
        const key = `${leagueId}_${ItemCategory.CurrencyFossil}`
        return this.fetch(key, () => this.fetchItem(leagueId, ItemOverviewType.Fossil))
      }
      case ItemCategory.CurrencyResonator: {
        const key = `${leagueId}_${ItemCategory.CurrencyResonator}`
        return this.fetch(key, () => this.fetchItem(leagueId, ItemOverviewType.Resonator))
      }
      case ItemCategory.CurrencyIncubator: {
        const key = `${leagueId}_${ItemCategory.CurrencyIncubator}`
        return this.fetch(key, () => this.fetchItem(leagueId, ItemOverviewType.Incubator))
      }
      case ItemCategory.CurrencyTattoo: {
        const key = `${leagueId}_${ItemCategory.CurrencyTattoo}`
        return this.fetch(key, () => this.fetchItem(leagueId, ItemOverviewType.Tattoo))
      }
      case ItemCategory.CurrencyOmen: {
        const key = `${leagueId}_${ItemCategory.CurrencyOmen}`
        return this.fetch(key, () => this.fetchItem(leagueId, ItemOverviewType.Omen))
      }
      case ItemCategory.MonsterBeast: {
        const key = `${leagueId}_${ItemCategory.MonsterBeast}`
        return this.fetch(key, () => this.fetchItem(leagueId, ItemOverviewType.Beast))
      }
      case ItemCategory.MapScarab: {
        const key = `${leagueId}_${ItemCategory.MapScarab}`
        return this.fetch(key, () => this.fetchItem(leagueId, ItemOverviewType.Scarab))
      }
      case ItemCategory.Jewel:
      case ItemCategory.JewelBase:
      case ItemCategory.JewelAbyss:
      case ItemCategory.JewelCluster:
        if (rarity === ItemRarity.Unique || rarity === ItemRarity.UniqueRelic) {
          const key = `${leagueId}_${ItemCategory.Jewel}`
          return this.fetch(key, () => this.fetchItem(leagueId, ItemOverviewType.UniqueJewel))
        }
        return of({ values: [] })
      case ItemCategory.Flask:
        if (rarity === ItemRarity.Unique || rarity === ItemRarity.UniqueRelic) {
          const key = `${leagueId}_${ItemCategory.Flask}`
          return this.fetch(key, () => this.fetchItem(leagueId, ItemOverviewType.UniqueFlask))
        }
        return of({ values: [] })
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
        if (rarity === ItemRarity.Unique || rarity === ItemRarity.UniqueRelic) {
          const key = `${leagueId}_${ItemCategory.Weapon}`
          return this.fetch(key, () => this.fetchItem(leagueId, ItemOverviewType.UniqueWeapon))
        }
        return of({ values: [] })
      case ItemCategory.Armour:
      case ItemCategory.ArmourChest:
      case ItemCategory.ArmourBoots:
      case ItemCategory.ArmourGloves:
      case ItemCategory.ArmourHelmet:
      case ItemCategory.ArmourShield:
      case ItemCategory.ArmourQuiver:
        if (rarity === ItemRarity.Unique || rarity === ItemRarity.UniqueRelic) {
          const key = `${leagueId}_${ItemCategory.Armour}`
          return this.fetch(key, () => this.fetchItem(leagueId, ItemOverviewType.UniqueArmour))
        }
        return of({ values: [] })
      case ItemCategory.Accessory:
      case ItemCategory.AccessoryAmulet:
      case ItemCategory.AccessoryBelt:
      case ItemCategory.AccessoryRing:
        if (rarity === ItemRarity.Unique || rarity === ItemRarity.UniqueRelic) {
          const key = `${leagueId}_${ItemCategory.Accessory}`
          return this.fetch(key, () => this.fetchItem(leagueId, ItemOverviewType.UniqueAccessory))
        }
        return of({ values: [] })
      case ItemCategory.Gem:
      case ItemCategory.GemActiveGem:
      case ItemCategory.GemSupportGem:
      case ItemCategory.GemSupportGemplus:
        const gemKey = `${leagueId}_${ItemCategory.Gem}`
        return this.fetch(gemKey, () => this.fetchItem(leagueId, ItemOverviewType.SkillGem))
      case ItemCategory.CurrencySeed:
      case ItemCategory.CurrencyWildSeed:
      case ItemCategory.CurrencyVividSeed:
      case ItemCategory.CurrencyPrimalSeed:
        const seedKey = `${leagueId}_${ItemCategory.CurrencySeed}`
        return this.fetch(seedKey, () => this.fetchItem(leagueId, ItemOverviewType.Seed))
      case ItemCategory.Leaguestone:
      case ItemCategory.MemoryLine:
      case ItemCategory.MonsterSample:
      case ItemCategory.CurrencyPiece:
      case ItemCategory.CurrencySeedBooster:
      case ItemCategory.AccessoryTrinket:
      case ItemCategory.CurrencyHeistTarget:
      case ItemCategory.HeistEquipment:
      case ItemCategory.HeistGear:
      case ItemCategory.HeistTool:
      case ItemCategory.HeistCloak:
      case ItemCategory.HeistBrooch:
      case ItemCategory.HeistMission:
      case ItemCategory.HeistContract:
      case ItemCategory.HeistBlueprint:
      case ItemCategory.ExpeditionLogbook:
      case ItemCategory.AzmeriTincture:
      case ItemCategory.AzmeriCharm:
      case ItemCategory.AzmeriCorpse:
        return of({ values: [] })
      default:
        console.warn(`Missing ItemCategory case for '${category}'`)
        return of({ values: [] })
    }
  }

  private fetch(
    key: string,
    fetch: () => Observable<ItemCategoryValues>
  ): Observable<ItemCategoryValues> {
    return this.cache.proxy(`item_category_${key}`, fetch, CacheExpirationType.HalfHour)
  }

  private fetchCurrency(
    leagueId: string,
    type: CurrencyOverviewType
  ): Observable<ItemCategoryValues> {
    return this.currencyService.get(leagueId, type).pipe(
      map((response) => {
        const result: ItemCategoryValues = {
          values: response.lines.map((line) => {
            const sparkLine = line.receiveSparkLine || {
              data: [],
              totalChange: 0,
            }
            const value: ItemCategoryValue = {
              name: line.currencyTypeName,
              type: undefined,
              links: undefined,
              mapTier: undefined,
              levelRequired: undefined,
              gemLevel: undefined,
              gemQuality: undefined,
              prophecyText: undefined,
              corrupted: undefined,
              relic: undefined,
              change: sparkLine.totalChange,
              history: sparkLine.data,
              chaosAmount: line.chaosEquivalent,
              url: response.url,
            }
            return value
          }),
        }
        if (type === CurrencyOverviewType.Currency) {
          // Explicitly add Chaos Orb to the list since this is the default exchange-currency (and thus not listed)
          const chaosOrb: ItemCategoryValue = {
            name: 'Chaos Orb',
            type: undefined,
            links: undefined,
            mapTier: undefined,
            levelRequired: undefined,
            gemLevel: undefined,
            gemQuality: undefined,
            prophecyText: undefined,
            corrupted: undefined,
            relic: undefined,
            change: 0,
            history: [],
            chaosAmount: 1,
            url: response.url,
          }
          result.values.push(chaosOrb)
        }
        return result
      })
    )
  }

  private fetchItem(leagueId: string, type: ItemOverviewType): Observable<ItemCategoryValues> {
    return this.itemService.get(leagueId, type).pipe(
      map((response) => {
        const result: ItemCategoryValues = {
          values: response.lines.map((line) => {
            const sparkLine = line.sparkline || {
              data: [],
              totalChange: 0,
            }
            const value: ItemCategoryValue = {
              name: line.name,
              type: line.baseType,
              links: line.links,
              mapTier: line.mapTier,
              levelRequired: line.levelRequired,
              gemLevel: line.gemLevel,
              gemQuality: line.gemQuality,
              prophecyText: line.prophecyText,
              corrupted: line.corrupted,
              relic: line.itemClass === 9,
              change: sparkLine.totalChange,
              history: sparkLine.data,
              chaosAmount: line.chaosValue,
              url: response.url,
            }
            return value
          }),
        }
        return result
      })
    )
  }
}

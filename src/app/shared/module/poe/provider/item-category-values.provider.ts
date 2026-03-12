import { Injectable } from '@angular/core'
import { MathUtils } from '@app/class'
import { CacheService } from '@app/service'
import {
    CURRENCY_TO_ITEM_OVERVIEW_MAP,
    CurrencyOverviewHttpService,
    CurrencyOverviewType,
    EXCHANGE_CATEGORIES,
    ItemOverviewHttpService,
    ItemOverviewType,
} from '@data/poe-ninja'
import { ExchangeOverviewHttpService } from '@data/poe-ninja/service/exchange-overview-http.service'
import { CacheExpirationType, ItemCategory, ItemRarity } from '@shared/module/poe/type'
import { Observable, forkJoin, of } from 'rxjs'
import { map } from 'rxjs/operators'

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
    private readonly exchangeService: ExchangeOverviewHttpService,
    private readonly cache: CacheService
  ) {}

  public provide(
    leagueId: string,
    rarity: ItemRarity,
    category: ItemCategory,
    useCurrencyExchangeData: boolean,
  ): Observable<ItemCategoryValues> {
    switch (category) {
      case ItemCategory.Map: {
        if (rarity === ItemRarity.Unique || rarity === ItemRarity.UniqueRelic) {
          const key = `${leagueId}_${ItemCategory.Map}_${ItemRarity.Unique}`
          return this.fetch(key, useCurrencyExchangeData, () => this.fetchItem(leagueId, useCurrencyExchangeData, ItemOverviewType.UniqueMap))
        } else {
          const key = `${leagueId}_${ItemCategory.Map}`
          return forkJoin([
            this.fetch(key, useCurrencyExchangeData, () => this.fetchItem(leagueId, useCurrencyExchangeData, ItemOverviewType.Map)),
            this.fetch(`${key}_blighted`, useCurrencyExchangeData, () => this.fetchItem(leagueId, useCurrencyExchangeData, ItemOverviewType.BlightedMap)),
            this.fetch(`${key}_blightRavaged`, useCurrencyExchangeData, () => this.fetchItem(leagueId, useCurrencyExchangeData, ItemOverviewType.BlightRavagedMap)),
            this.fetch(`${key}_valdo`, useCurrencyExchangeData, () => this.fetchItem(leagueId, useCurrencyExchangeData, ItemOverviewType.ValdoMap)),
          ]).pipe(
            map(([maps, blightedMaps, blightRavaged, valdo]) => {
              return {
                values: [...maps.values, ...blightedMaps.values, ...blightRavaged.values, ...valdo.values],
              }
            })
          )
        }
      }
      case ItemCategory.Prophecy: {
        const key = `${leagueId}_${ItemCategory.Prophecy}`
        return this.fetch(key, useCurrencyExchangeData, () => this.fetchItem(leagueId, useCurrencyExchangeData, ItemOverviewType.Prophecy))
      }
      case ItemCategory.Card: {
        const key = `${leagueId}_${ItemCategory.Card}`
        return this.fetch(key, useCurrencyExchangeData, () => this.fetchItem(leagueId, useCurrencyExchangeData, ItemOverviewType.DivinationCard))
      }
      case ItemCategory.Currency: {
        const key = `${leagueId}_${ItemCategory.Currency}`
        return forkJoin([
          this.fetch(key, useCurrencyExchangeData, () => this.fetchCurrency(leagueId, useCurrencyExchangeData, CurrencyOverviewType.Currency)),
          this.fetch(`${key}_essence`, useCurrencyExchangeData, () => this.fetchItem(leagueId, useCurrencyExchangeData, ItemOverviewType.Essence)),
          this.fetch(`${key}_oil`, useCurrencyExchangeData, () => this.fetchItem(leagueId, useCurrencyExchangeData, ItemOverviewType.Oil)),
          this.fetch(`${key}_vial`, useCurrencyExchangeData, () => this.fetchItem(leagueId, useCurrencyExchangeData, ItemOverviewType.Vial)),
          this.fetch(`${key}_deliriumOrb`, useCurrencyExchangeData, () => this.fetchItem(leagueId, useCurrencyExchangeData, ItemOverviewType.DeliriumOrb)),
          this.fetch(`${key}_artifact`, useCurrencyExchangeData, () => this.fetchItem(leagueId, useCurrencyExchangeData, ItemOverviewType.Artifact)),
          this.fetch(`${key}_runegraft`, useCurrencyExchangeData, () => this.fetchItem(leagueId, useCurrencyExchangeData, ItemOverviewType.Runegraft)),
          this.fetch(`${key}_astrolabe`, useCurrencyExchangeData, () => this.fetchItem(leagueId, useCurrencyExchangeData, ItemOverviewType.Astrolabe)),
          this.fetch(`${key}_djinnCoin`, useCurrencyExchangeData, () => this.fetchItem(leagueId, useCurrencyExchangeData, ItemOverviewType.DjinnCoin)),
          this.fetch(`${leagueId}_${ItemCategory.MapFragment}`, useCurrencyExchangeData, () => this.fetchCurrency(leagueId, useCurrencyExchangeData, CurrencyOverviewType.Fragment)),
        ]).pipe(
          map(([currencies, essences, oil, vial, deliriumOrb, artifacts, runegraft, astrolabe, djinnCoin, fragments]) => {
            return {
              values: [
                ...currencies.values,
                ...essences.values,
                ...oil.values,
                ...vial.values,
                ...deliriumOrb.values,
                ...artifacts.values,
                ...runegraft.values,
                ...astrolabe.values,
                ...djinnCoin.values,
                ...fragments.values,
              ],
            }
          })
        )
      }
      case ItemCategory.MapFragment: {
        const key = `${leagueId}_${ItemCategory.MapFragment}`
        return forkJoin([
          this.fetch(key, useCurrencyExchangeData, () => this.fetchCurrency(leagueId, useCurrencyExchangeData, CurrencyOverviewType.Fragment)),
          this.fetch(`${leagueId}_${ItemCategory.Currency}`, useCurrencyExchangeData, () => this.fetchCurrency(leagueId, useCurrencyExchangeData, CurrencyOverviewType.Currency)),
        ]).pipe(
          map(([fragments, currencies]) => {
            return {
              values: [
                ...fragments.values,
                ...currencies.values,
              ],
            }
          })
        )
      }
      case ItemCategory.MapInvitation: {
        const key = `${leagueId}_${ItemCategory.MapInvitation}`
        return this.fetch(key, useCurrencyExchangeData, () => this.fetchItem(leagueId, useCurrencyExchangeData, ItemOverviewType.Invitation))
      }
      case ItemCategory.Watchstone: {
        const key = `${leagueId}_${ItemCategory.Watchstone}`
        return this.fetch(key, useCurrencyExchangeData, () => this.fetchItem(leagueId, useCurrencyExchangeData, ItemOverviewType.Watchstone))
      }
      case ItemCategory.CurrencyFossil: {
        const key = `${leagueId}_${ItemCategory.CurrencyFossil}`
        return this.fetch(key, useCurrencyExchangeData, () => this.fetchItem(leagueId, useCurrencyExchangeData, ItemOverviewType.Fossil))
      }
      case ItemCategory.CurrencyResonator: {
        const key = `${leagueId}_${ItemCategory.CurrencyResonator}`
        return this.fetch(key, useCurrencyExchangeData, () => this.fetchItem(leagueId, useCurrencyExchangeData, ItemOverviewType.Resonator))
      }
      case ItemCategory.CurrencyIncubator: {
        const key = `${leagueId}_${ItemCategory.CurrencyIncubator}`
        return this.fetch(key, useCurrencyExchangeData, () => this.fetchItem(leagueId, useCurrencyExchangeData, ItemOverviewType.Incubator))
      }
      case ItemCategory.CurrencyTattoo: {
        const key = `${leagueId}_${ItemCategory.CurrencyTattoo}`
        return this.fetch(key, useCurrencyExchangeData, () => this.fetchItem(leagueId, useCurrencyExchangeData, ItemOverviewType.Tattoo))
      }
      case ItemCategory.CurrencyOmen: {
        const key = `${leagueId}_${ItemCategory.CurrencyOmen}`
        return this.fetch(key, useCurrencyExchangeData, () => this.fetchItem(leagueId, useCurrencyExchangeData, ItemOverviewType.Omen))
      }
      case ItemCategory.NecropolisPack: {
        const key = `${leagueId}_${ItemCategory.NecropolisPack}`
        return this.fetch(key, useCurrencyExchangeData, () => this.fetchItem(leagueId, useCurrencyExchangeData, ItemOverviewType.AllflameEmber))
      }
      case ItemCategory.Wombgift: {
        const key = `${leagueId}_${ItemCategory.Wombgift}`
        return this.fetch(key, useCurrencyExchangeData, () => this.fetchItem(leagueId, useCurrencyExchangeData, ItemOverviewType.Wombgift))
      }
      case ItemCategory.MonsterBeast: {
        const key = `${leagueId}_${ItemCategory.MonsterBeast}`
        return this.fetch(key, useCurrencyExchangeData, () => this.fetchItem(leagueId, useCurrencyExchangeData, ItemOverviewType.Beast))
      }
      case ItemCategory.MapScarab: {
        const key = `${leagueId}_${ItemCategory.MapScarab}`
        return this.fetch(key, useCurrencyExchangeData, () => this.fetchItem(leagueId, useCurrencyExchangeData, ItemOverviewType.Scarab))
      }
      case ItemCategory.Jewel:
      case ItemCategory.JewelBase:
      case ItemCategory.JewelAbyss:
      case ItemCategory.JewelCluster:
        if (rarity === ItemRarity.Unique || rarity === ItemRarity.UniqueRelic) {
          const key = `${leagueId}_${ItemCategory.Jewel}`
          return forkJoin([
            this.fetch(key, useCurrencyExchangeData, () => this.fetchItem(leagueId, useCurrencyExchangeData, ItemOverviewType.UniqueJewel)),
            this.fetch(`${key}_forbiddenJewel`, useCurrencyExchangeData, () => this.fetchItem(leagueId, useCurrencyExchangeData, ItemOverviewType.ForbiddenJewel)),
          ]).pipe(
            map(([uniqueJewels, forbiddenJewels]) => {
              return {
                values: [
                  ...uniqueJewels.values,
                  ...forbiddenJewels.values,
                ],
              }
            })
          )
        }
        return of({ values: [] })
      case ItemCategory.Flask:
        if (rarity === ItemRarity.Unique || rarity === ItemRarity.UniqueRelic) {
          const key = `${leagueId}_${ItemCategory.Flask}`
          return this.fetch(key, useCurrencyExchangeData, () => this.fetchItem(leagueId, useCurrencyExchangeData, ItemOverviewType.UniqueFlask))
        }
        return of({ values: [] })
      case ItemCategory.Tincture:
        if (rarity === ItemRarity.Unique || rarity === ItemRarity.UniqueRelic) {
          const key = `${leagueId}_${ItemCategory.Tincture}`
          return this.fetch(key, useCurrencyExchangeData, () => this.fetchItem(leagueId, useCurrencyExchangeData, ItemOverviewType.UniqueTincture))
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
          return this.fetch(key, useCurrencyExchangeData, () => this.fetchItem(leagueId, useCurrencyExchangeData, ItemOverviewType.UniqueWeapon))
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
          return this.fetch(key, useCurrencyExchangeData, () => this.fetchItem(leagueId, useCurrencyExchangeData, ItemOverviewType.UniqueArmour))
        }
        return of({ values: [] })
      case ItemCategory.Accessory:
      case ItemCategory.AccessoryAmulet:
      case ItemCategory.AccessoryBelt:
      case ItemCategory.AccessoryRing:
        if (rarity === ItemRarity.Unique || rarity === ItemRarity.UniqueRelic) {
          const key = `${leagueId}_${ItemCategory.Accessory}`
          return this.fetch(key, useCurrencyExchangeData, () => this.fetchItem(leagueId, useCurrencyExchangeData, ItemOverviewType.UniqueAccessory))
        }
        return of({ values: [] })
      case ItemCategory.Gem:
      case ItemCategory.GemActiveGem:
      case ItemCategory.GemSupportGem:
      case ItemCategory.GemSupportGemplus:
        const gemKey = `${leagueId}_${ItemCategory.Gem}`
        return this.fetch(gemKey, useCurrencyExchangeData, () => this.fetchItem(leagueId, useCurrencyExchangeData, ItemOverviewType.SkillGem))
      case ItemCategory.CurrencySeed:
      case ItemCategory.CurrencyWildSeed:
      case ItemCategory.CurrencyVividSeed:
      case ItemCategory.CurrencyPrimalSeed:
        const seedKey = `${leagueId}_${ItemCategory.CurrencySeed}`;
        return this.fetch(seedKey, useCurrencyExchangeData, () => this.fetchItem(leagueId, useCurrencyExchangeData, ItemOverviewType.Seed))
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
      case ItemCategory.Corpse:
      case ItemCategory.Idol:
      case ItemCategory.Graft:
        return of({ values: [] })
      default:
        console.warn(`Missing ItemCategory case for '${category}'`)
        return of({ values: [] })
    }
  }

  private fetch(
    key: string,
    useCurrencyExchangeData: boolean,
    fetch: () => Observable<ItemCategoryValues>
  ): Observable<ItemCategoryValues> {
    const useCurrencyExchangeDataKey = useCurrencyExchangeData ? `exchange` : `stash`
    return this.cache.proxy(`item_category_${key}_${useCurrencyExchangeDataKey}`, fetch, CacheExpirationType.HalfHour)
  }

  private fetchCurrency(
    leagueId: string,
    useCurrencyExchangeData: boolean,
    type: CurrencyOverviewType
  ): Observable<ItemCategoryValues> {
    if (useCurrencyExchangeData) {
      return this.fetchExchange(leagueId, CURRENCY_TO_ITEM_OVERVIEW_MAP[type])
    }

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

  private fetchItem(leagueId: string, useCurrencyExchangeData: boolean, type: ItemOverviewType): Observable<ItemCategoryValues> {
    if (useCurrencyExchangeData && EXCHANGE_CATEGORIES.includes(type)) {
      return this.fetchExchange(leagueId, type)
    }

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

  private fetchExchange(
    leagueId: string,
    type: ItemOverviewType
  ): Observable<ItemCategoryValues> {
    return this.exchangeService.get(leagueId, type).pipe(
      map((response) => {
        const chaosRate = response.core.primary === "chaos" ? 1 : response.core.rates[response.core.secondary]
        const result: ItemCategoryValues = {
          values: response.lines.map((line) => {
            const sparkLine = line.sparkline || {
              data: [],
              totalChange: 0,
            }
            const item = response.items.find(x => x.id === line.id)
            const value: ItemCategoryValue = {
              name: item.name,
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
              chaosAmount: MathUtils.floor(line.primaryValue * chaosRate, 2),
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

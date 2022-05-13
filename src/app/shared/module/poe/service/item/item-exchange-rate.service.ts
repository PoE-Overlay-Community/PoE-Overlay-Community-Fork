import { Injectable } from '@angular/core'
import { forkJoin, iif, Observable, of } from 'rxjs'
import { flatMap, map } from 'rxjs/operators'
import {
  ItemCategoryValue,
  ItemCategoryValuesProvider,
} from '../../provider/item-category-values.provider'
import { Currency, Item, Language, ItemCategory, ItemGemQualityType } from '../../type'
import { BaseItemTypesService } from '../base-item-types/base-item-types.service'
import { ClientStringService } from '../client-string/client-string.service'
import { ContextService } from '../context.service'
import { CurrencyConverterService } from '../currency/currency-converter.service'
import { CurrencySelectService, CurrencySelectStrategy } from '../currency/currency-select.service'
import { WordService } from '../word/word.service'
import { ItemSocketService } from './item-socket.service'

export interface ItemExchangeRateResult {
  currency?: Currency
  amount?: number
  inverseAmount?: number
  factor?: number
  change?: number
  history?: number[]
  url?: string
}

@Injectable({
  providedIn: 'root',
})
export class ItemExchangeRateService {
  constructor(
    private readonly context: ContextService,
    private readonly valuesProvider: ItemCategoryValuesProvider,
    private readonly socket: ItemSocketService,
    private readonly currencyConverterService: CurrencyConverterService,
    private readonly currencySelectService: CurrencySelectService,
    private readonly baseItemTypesService: BaseItemTypesService,
    private readonly wordService: WordService,
    private readonly clientString: ClientStringService
  ) {}

  public get(
    item: Item,
    currencies: Currency[],
    leagueId?: string
  ): Observable<ItemExchangeRateResult> {
    leagueId = leagueId || this.context.get().leagueId

    return this.getValue(leagueId, item).pipe(
      flatMap((value) =>
        iif(
          () => !value,
          of(undefined),
          forkJoin(
            currencies.map((currency) =>
              this.currencyConverterService.convert('chaos', currency.id)
            )
          ).pipe(
            map((factors) => {
              const values = factors.map((factor) => [value.chaosAmount * factor])
              const index = this.currencySelectService.select(
                values,
                CurrencySelectStrategy.MinWithAtleast1
              )
              const size = item.properties?.stackSize?.value?.min || 1
              const result: ItemExchangeRateResult = {
                amount: values[index][0],
                factor: size,
                inverseAmount: 1 / values[index][0],
                currency: currencies[index],
                change: value.change,
                history: value.history || [],
                url: value.url,
              }
              return result
            })
          )
        )
      )
    )
  }

  private getValue(leagueId: string, item: Item): Observable<ItemCategoryValue> {
    const links = this.socket.getLinkCount(item.sockets)
    const filterLinks = (x: ItemCategoryValue) => {
      if (x.links === undefined) {
        return true
      }
      if (links > 4) {
        return x.links === links
      }
      if (links >= 0) {
        return x.links === 0
      }
      return false
    }

    const tier = +item.properties?.mapTier?.value?.value
    const filterMapTier = (x: ItemCategoryValue) => {
      if (isNaN(tier) || x.mapTier === undefined) {
        return true
      }
      return x.mapTier === tier
    }

    const gemLevel = +item.properties?.gemLevel?.value?.value
    const filterGemLevel = (x: ItemCategoryValue) => {
      if (isNaN(gemLevel) || x.gemLevel === undefined) {
        switch (item.category) {
          case ItemCategory.Gem:
          case ItemCategory.GemActiveGem:
          case ItemCategory.GemSupportGem:
          case ItemCategory.GemSupportGemplus:
            return false
        }
        return true
      }
      return x.gemLevel === gemLevel
    }

    const gemQuality = +item.properties?.quality?.value?.value
    const filterGemQuality = (x: ItemCategoryValue) => {
      if (isNaN(gemQuality) || x.gemQuality === undefined) {
        switch (item.category) {
          case ItemCategory.Gem:
          case ItemCategory.GemActiveGem:
          case ItemCategory.GemSupportGem:
          case ItemCategory.GemSupportGemplus:
            return false
        }
        return true
      }
      return x.gemQuality === gemQuality
    }

    const corrupted = item.corrupted === true
    const filterCorruption = (x: ItemCategoryValue) => {
      if (corrupted === undefined || x.corrupted === undefined) {
        switch (item.category) {
          case ItemCategory.Gem:
          case ItemCategory.GemActiveGem:
          case ItemCategory.GemSupportGem:
          case ItemCategory.GemSupportGemplus:
            return false
        }
        return true
      }
      return x.corrupted === corrupted
    }

    const prophecyText = item.properties?.prophecyText
    const filterProphecyText = (x: ItemCategoryValue) => {
      if (prophecyText === undefined || x.prophecyText === undefined) {
        switch (item.category) {
          case ItemCategory.Prophecy:
            return false
        }
        return true
      }
      return x.prophecyText === prophecyText
    }

    const itemLevel = item.level?.value
    const filterItemLevel = (x: ItemCategoryValue) => {
      if (itemLevel === undefined || x.levelRequired === undefined) {
        switch (item.category) {
          case ItemCategory.CurrencySeed:
          case ItemCategory.CurrencyWildSeed:
          case ItemCategory.CurrencyVividSeed:
          case ItemCategory.CurrencyPrimalSeed:
            return false
        }
        return true
      }
      return x.levelRequired <= itemLevel
    }

    const filterName = (x: ItemCategoryValue, name: string) => {
      switch (item.category) {
        case ItemCategory.Prophecy:
          // Remove the discriminator from the item name.
          if (name.endsWith(')')) {
            name = name.substr(0, name.lastIndexOf('(')).trim()
          }
          break
        case ItemCategory.Map:
          if (item.blighted) {
            name = this.clientString.translate('InfectedMap').replace('{0}', name)
          }
          if (item.blightRavaged) {
            name = this.clientString.translate('UberInfectedMap').replace('{0}', name)
          }
          break
        case ItemCategory.Gem:
        case ItemCategory.GemActiveGem:
        case ItemCategory.GemSupportGem:
          if (item.properties?.gemQualityType) {
            name = this.clientString
              .translate('GemAlternateQuality' + item.properties.gemQualityType + 'Affix')
              .replace('{0}', name)
          }
          break
      }
      return x.name === name
    }

    const sortFiltered = (a: ItemCategoryValue, b: ItemCategoryValue) => {
      switch (item.category) {
        case ItemCategory.CurrencySeed:
        case ItemCategory.CurrencyWildSeed:
        case ItemCategory.CurrencyVividSeed:
        case ItemCategory.CurrencyPrimalSeed:
          return b.levelRequired - a.levelRequired
        default:
          return 0
      }
    }

    return this.valuesProvider.provide(leagueId, item.rarity, item.category).pipe(
      map((response) => {
        const type = this.baseItemTypesService.translate(item.typeId, Language.English)
        const name = this.wordService.translate(item.nameId, Language.English)
        let results = response.values
        // Filter based on item type or name
        if (item.typeId && !item.nameId) {
          results = results.filter((x) => filterName(x, type))
        } else {
          results = results.filter(
            (x) =>
              filterName(x, name) &&
              x.type === type &&
              ((!item.relic && !x.relic) || x.relic === item.relic)
          )
        }
        // Apply generic filters
        results = results.filter(
          (x) =>
            filterLinks(x) &&
            filterMapTier(x) &&
            filterGemLevel(x) &&
            filterGemQuality(x) &&
            filterProphecyText(x) &&
            filterCorruption(x) &&
            filterItemLevel(x)
        )
        // Sort the results
        results = results.sort(sortFiltered)
        return results[0]
      })
    )
  }
}

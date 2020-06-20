import { Injectable } from '@angular/core'
import { forkJoin, iif, Observable, of } from 'rxjs'
import { flatMap, map } from 'rxjs/operators'
import {
  ItemCategoryValue,
  ItemCategoryValuesProvider,
} from '../../provider/item-category-values.provider'
import { Currency, Item, Language, ItemCategory } from '../../type'
import { BaseItemTypesService } from '../base-item-types/base-item-types.service'
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
    private readonly wordService: WordService
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
              const size = (item.properties?.stackSize?.value?.split('/') || ['1'])[0]
              const result: ItemExchangeRateResult = {
                amount: Math.ceil(values[index][0] * 100) / 100,
                factor: +size.replace('.', ''),
                inverseAmount: Math.ceil((1 / values[index][0]) * 100) / 100,
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

    const tier = +item.properties?.mapTier?.value
    const filterMapTier = (x: ItemCategoryValue) => {
      if (isNaN(tier) || x.mapTier === undefined) {
        return true
      }
      return x.mapTier === tier
    }

    const gemLevel = +item.properties?.gemLevel?.value?.value
    console.log(`gemLevel=${gemLevel}`)
    const filterGemLevel = (x: ItemCategoryValue) => {
      if (isNaN(gemLevel) || x.gemLevel === undefined) {
        switch (item.category) {
          case ItemCategory.Gem:
          case ItemCategory.GemActivegem:
          case ItemCategory.GemSupportGem:
          case ItemCategory.GemSupportGemplus:
            return false
        }
        return true
      }
      console.log(`here gemLevel=${x.gemLevel == gemLevel}`)
      return x.gemLevel === gemLevel
    }

    const gemQuality = +item.properties?.quality?.value?.value
    console.log(`gemQuality=${gemQuality}`)
    console.log(`t=${item.properties?.quality?.value?.text}`)
    console.log(`t2=${item.properties?.quality?.value?.value}`)
    console.log(`t2=${item.properties?.quality?.value?.min}`)
    console.log(`t2=${item.properties ?.quality ?.value ?.max}`)
    console.log(`t2=${item.properties?.qualityType}`)
    const filterGemQuality = (x: ItemCategoryValue) => {
      if (isNaN(gemQuality) || x.gemQuality === undefined) {
        switch (item.category) {
          case ItemCategory.Gem:
          case ItemCategory.GemActivegem:
          case ItemCategory.GemSupportGem:
          case ItemCategory.GemSupportGemplus:
            return false
        }
        return true
      }
      console.log(`here gemQuality=${x.gemQuality == gemQuality}`)
      return x.gemQuality == gemQuality
    }

    const corrupted = item.corrupted === true
    console.log(`corrupted=${corrupted}`)
    const filterCorruption = (x: ItemCategoryValue) => {
      if (corrupted === undefined || x.corrupted === undefined) {
        switch (item.category) {
          case ItemCategory.Gem:
          case ItemCategory.GemActivegem:
          case ItemCategory.GemSupportGem:
          case ItemCategory.GemSupportGemplus:
            return false
        }
        return true;
      }
      console.log(`here corrupted=${x.corrupted === corrupted}`)
      return x.corrupted === corrupted
    }

    return this.valuesProvider.provide(leagueId, item.rarity, item.category).pipe(
      map((response) => {
        const type = this.baseItemTypesService.translate(item.typeId, Language.English)
        const name = this.wordService.translate(item.nameId, Language.English)
        if (item.typeId && !item.nameId) {
          return response.values.find((x) => x.name === type && filterLinks(x) && filterMapTier(x) && filterGemLevel(x) && filterGemQuality(x) && filterCorruption(x))
        }
        return response.values.find(
          (x) =>
            x.name === name && x.type === type && !x.relic && filterLinks(x) && filterMapTier(x) && filterGemLevel(x) && filterGemQuality(x) && filterCorruption(x)
        )
      })
    )
  }
}

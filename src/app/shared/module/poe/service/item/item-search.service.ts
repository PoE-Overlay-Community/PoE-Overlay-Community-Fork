import { Injectable } from '@angular/core'
import { CacheService, LoggerService } from '@app/service'
import {
  ExchangeSearchRequest,
  TradeFetchResult,
  PoEHttpService,
  TradeSearchRequest,
  TradeSearchType,
} from '@data/poe'
import { Currency, Item, ItemCategory, Language } from '@shared/module/poe/type'
import moment from 'moment'
import { forkJoin, from, Observable, of } from 'rxjs'
import { flatMap, map, mergeMap, toArray } from 'rxjs/operators'
import { ItemSearchIndexed, ItemSearchOptions } from '../../type/search.type'
import { BaseItemTypesService } from '../base-item-types/base-item-types.service'
import { ContextService } from '../context.service'
import { CurrencyService } from '../currency/currency.service'
import { ItemSearchQueryService } from './query/item-search-query.service'

const MAX_FETCH_PER_REQUEST_COUNT = 10
const CACHE_EXPIRY = 1000 * 60 * 10

export interface ItemSearchListing {
  seller: string
  indexed: moment.Moment
  age: string
  currency: Currency
  amount: number
  priceNumerator: number
  priceDenominator: number
}

export interface ItemSearchResult {
  searchType: TradeSearchType
  id: string
  language: Language
  url: string
  total: number
  hits: string[]
}

@Injectable({
  providedIn: 'root',
})
export class ItemSearchService {
  constructor(
    private readonly context: ContextService,
    private readonly currencyService: CurrencyService,
    private readonly baseItemTypesServices: BaseItemTypesService,
    private readonly requestService: ItemSearchQueryService,
    private readonly poeHttpService: PoEHttpService,
    private readonly cache: CacheService,
    private readonly logger: LoggerService
  ) {}

  public searchOrExchange(
    requestedItem: Item,
    options?: ItemSearchOptions,
    currency?: Currency
  ): Observable<ItemSearchResult> {
    options = options || {}
    options.leagueId = options.leagueId || this.context.get().leagueId
    options.language = options.language || this.context.get().language

    switch (requestedItem.category) {
      case ItemCategory.Currency:
      case ItemCategory.CurrencyFossil:
      case ItemCategory.CurrencyResonator:
      case ItemCategory.CurrencyIncubator:
      case ItemCategory.MapFragment:
      case ItemCategory.MapScarab:
      case ItemCategory.Card:
        if (currency && !requestedItem.properties?.storedExperience) {
          return this.exchange(requestedItem, options, currency)
        }
        break
    }
    return this.search(requestedItem, options)
  }

  public list(search: ItemSearchResult, fetchCount: number): Observable<ItemSearchListing[]> {
    const { id, language, hits } = search

    const maxFetchCount = Math.min(fetchCount, hits.length)
    const maxHits = hits.slice(0, maxFetchCount)
    if (maxHits.length <= 0) {
      return of([])
    }

    // check cache for values of items about to be searched
    const retrievedHits$ = maxHits.map((hit) => {
      const key = `item_listing_${language}_${hit}`
      return this.cache.retrieve<TradeFetchResult>(key).pipe(
        map((value) => {
          // value will be null or undefined if not in cache
          return { id: hit, value }
        })
      )
    })

    return this.cache.clear('item_listing_').pipe(
      flatMap(() => forkJoin(retrievedHits$)),
      flatMap((retrievedHits) => {
        const hitsChunked: string[][] = []

        const hitsMissing = retrievedHits.filter((x) => !x.value).map((x) => x.id)
        const hitsCached = retrievedHits.filter((x) => x.value).map((x) => x.value)

        this.logger.debug(
          `missing hits: ${hitsMissing.length}, cached hits: ${hitsCached.length}` +
            ` - saved: ${Math.round((hitsCached.length / maxHits.length) * 100)}%`
        )

        for (let i = 0; i < hitsMissing.length; i += MAX_FETCH_PER_REQUEST_COUNT) {
          hitsChunked.push(hitsMissing.slice(i, i + MAX_FETCH_PER_REQUEST_COUNT))
        }

        return from(hitsChunked).pipe(
          flatMap((chunk) => this.poeHttpService.fetch(chunk, id, language)),
          toArray(),
          flatMap((responses) => {
            const results: TradeFetchResult[] = responses
              .filter((x) => x.result && x.result.length)
              .reduce((a, b) => a.concat(b.result), hitsCached)

            if (results.length <= 0) {
              return of([])
            }

            const listings$ = results.map((result) => {
              const key = `item_listing_${language}_${result.id}`
              return this.cache
                .store(key, result, CACHE_EXPIRY, false)
                .pipe(flatMap(() => this.mapResult(result)))
            })

            return forkJoin(listings$).pipe(
              map((listings) => listings.filter((x) => x !== undefined))
            )
          })
        )
      })
    )
  }

  private search(requestedItem: Item, options: ItemSearchOptions): Observable<ItemSearchResult> {
    const request: TradeSearchRequest = {
      sort: {
        price: 'asc',
      },
      query: {
        status: {
          option: options.online ? 'online' : 'any',
        },
        filters: {
          trade_filters: {
            filters: {
              sale_type: {
                option: 'priced',
              },
            },
          },
        },
        stats: [],
      },
    }

    const { indexed } = options
    if (indexed && indexed !== ItemSearchIndexed.AnyTime) {
      request.query.filters.trade_filters.filters.indexed = {
        option: indexed,
      }
    }

    const { language, leagueId } = options
    this.requestService.map(requestedItem, language, request.query)

    return this.poeHttpService.search(request, language, leagueId).pipe(
      map((response) => {
        const { id, url, total } = response
        const result: ItemSearchResult = {
          searchType: response.searchType,
          id,
          language,
          url,
          total,
          hits: response.result || [],
        }
        return result
      })
    )
  }

  private exchange(
    requestedItem: Item,
    options: ItemSearchOptions,
    currency: Currency
  ): Observable<ItemSearchResult> {
    const { online, language, leagueId } = options

    return this.currencyService
      .searchByNameType(
        this.baseItemTypesServices.translate(requestedItem.typeId, language),
        language
      )
      .pipe(
        flatMap((requestedCurrency) => {
          if (!requestedCurrency) {
            return this.search(requestedItem, options)
          }

          const request: ExchangeSearchRequest = {
            sort: {
              price: 'asc',
            },
            exchange: {
              status: {
                option: online ? 'online' : 'any',
              },
              want: [requestedCurrency.id],
              have: [currency.id],
            },
          }

          return this.poeHttpService.exchange(request, language, leagueId).pipe(
            map((response) => {
              const { id, url, total } = response
              const result: ItemSearchResult = {
                searchType: response.searchType,
                id,
                language,
                url,
                total,
                hits: response.result || [],
              }
              return result
            })
          )
        })
      )
  }

  private mapResult(result: TradeFetchResult): Observable<ItemSearchListing> {
    if (
      !result ||
      !result.listing ||
      !result.listing.price ||
      !result.listing.account ||
      !result.listing.indexed
    ) {
      this.logger.warn(`Result was invalid.`, result)
      return of(undefined)
    }

    const { listing, item } = result

    const indexed = moment(listing.indexed)
    if (!indexed.isValid()) {
      this.logger.warn(`Indexed value: '${listing.indexed}' was not a valid date.`)
      return of(undefined)
    }

    const seller = listing.account.name || ''
    if (seller.length <= 0) {
      this.logger.warn(`Seller: '${seller}' was empty or undefined.`)
      return of(undefined)
    }

    const { price } = listing
    const { amount } = price
    if (amount <= 0) {
      this.logger.warn(`Amount was less or equal zero. Seller: ${seller}`)
      return of(undefined)
    }

    let priceNumerator = amount
    let priceDenominator = 1

    const { note } = item
    const priceFraction =
      note?.replace(price.type, '').replace(price.currency, '').trim().split('/') || []
    if (priceFraction.length === 2) {
      priceNumerator = +priceFraction[0]
      priceDenominator = +priceFraction[1]
    }

    const currencyId = price.currency
    return this.currencyService.searchById(currencyId).pipe(
      map((currency) => {
        if (!currency) {
          this.logger.warn(`Could not parse '${currencyId}' as currency.`)
          return undefined
        }
        return {
          seller,
          indexed,
          currency,
          amount,
          age: indexed.fromNow(),
          priceNumerator,
          priceDenominator,
        }
      })
    )
  }
}

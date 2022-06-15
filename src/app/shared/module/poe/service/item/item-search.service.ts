import { Injectable } from '@angular/core'
import { MathUtils } from '@app/class'
import { CacheService, LoggerService } from '@app/service'
import {
    ExchangeEngine,
    ExchangeFetchResult, ExchangeSearchRequest, PoEHttpService, TradeFetchResult, TradeSearchRequest,
    TradeSearchType
} from '@data/poe'
import { environment } from '@env/environment'
import { Currency, Item, ItemCategory, Language } from '@shared/module/poe/type'
import moment from 'moment'
import { forkJoin, from, Observable, of } from 'rxjs'
import { catchError, flatMap, map, toArray } from 'rxjs/operators'
import { ItemSearchIndexed, ItemSearchOptions } from '../../type/search.type'
import { BaseItemTypesService } from '../base-item-types/base-item-types.service'
import { ContextService } from '../context.service'
import { CurrencyService } from '../currency/currency.service'
import { ItemParserUtils } from './parser/item-parser.utils'
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

export interface SearchResult {
  searchType: TradeSearchType
  id: string
  language: Language
  url: string
  total: number
}

export interface TradeSearchResult extends SearchResult {
  hits: string[]
}

export interface ExchangeSearchResult extends SearchResult {
  hits: {
    [key: string]: ExchangeFetchResult
  }
}

export type ItemSearchResult = TradeSearchResult | ExchangeSearchResult

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

  public listTradeSearch(search: TradeSearchResult, fetchCount: number): Observable<ItemSearchListing[]> {
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

    return this.cache.prune('item_listing_').pipe(
      flatMap(() => forkJoin(retrievedHits$)),
      flatMap((retrievedHits) => {
        const hitsChunked: string[][] = []

        const hitsMissing = retrievedHits.filter((x) => !x.value).map((x) => x.id)
        const hitsCached = retrievedHits.filter((x) => x.value).map((x) => x.value)

        this.logger.debug('',
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
                .pipe(flatMap(() => this.mapTradeFetchResult(result)))
            })

            return forkJoin(listings$).pipe(
              map((listings) => listings.filter((x) => x !== undefined))
            )
          })
        )
      })
    )
  }

  public listExchangeSearch(search: ExchangeSearchResult, fetchCount: number): Observable<ItemSearchListing[]> {
    const { language } = search
    const hits = Object.keys(search.hits)

    const maxFetchCount = Math.min(fetchCount, hits.length)
    const maxHits = hits.slice(0, maxFetchCount)
    if (maxHits.length <= 0) {
      return of([])
    }

    // check cache for values of items about to be searched
    const retrievedHits$ = maxHits.map((hit) => {
      const key = `item_listing_${language}_${hit}`
      return this.cache.retrieve<ExchangeFetchResult>(key).pipe(
        map((value) => {
          // value will be null or undefined if not in cache
          return { id: hit, value }
        })
      )
    })

    return this.cache.prune('item_listing_').pipe(
      flatMap(() => forkJoin(retrievedHits$)),
      flatMap((retrievedHits) => {
        const hitsMissing = retrievedHits.filter((x) => !x.value)
        const hitsCached = retrievedHits.filter((x) => x.value)

        this.logger.debug('',
          `missing hits: ${hitsMissing.length}, cached hits: ${hitsCached.length}` +
          ` - saved: ${Math.round((hitsCached.length / maxHits.length) * 100)}%`
        )

        const listings$ = retrievedHits.map((result) => {
          const key = `item_listing_${language}_${result.id}`
          if (!result.value) {
            result.value = search.hits[result.id]
          }
          return this.cache
            .store(key, result.value, CACHE_EXPIRY, false)
            .pipe(flatMap(() => this.mapExchangeFetchResult(result.value)))
        })

        return forkJoin(listings$).pipe(
          map((listings) => listings.filter((x) => x !== undefined))
        )
      })
    )
  }

  private search(requestedItem: Item, options: ItemSearchOptions): Observable<TradeSearchResult> {
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
        const result: TradeSearchResult = {
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
          // Fall-back to normal search when the requested currency can't be found or is invalid
          if (!requestedCurrency) {
            return this.search(requestedItem, options)
          }

          const request: ExchangeSearchRequest = {
            engine: ExchangeEngine.New,
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
              const result: ExchangeSearchResult = {
                searchType: response.searchType,
                id,
                language,
                url,
                total,
                hits: response.result || {},
              }
              return result
            }),
            catchError(err => {
              if (!environment.production) {
                console.log(`Failed to retrieve BulkExchange result for '${requestedCurrency.nameType}' Error:`)
                console.log(err)
              }
              return this.search(requestedItem, options)
            })
          )
        })
      )
  }

  private mapTradeFetchResult(result: TradeFetchResult): Observable<ItemSearchListing> {
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
    const notePrice = note?.replace(price.type, '').replace(price.currency, '').trim()
    if (notePrice) {
      if (notePrice.indexOf('/') !== -1) {
        const priceFraction = notePrice.split('/') || []
        if (priceFraction.length === 2) {
          priceNumerator = ItemParserUtils.parseNumber(priceFraction[0])
          priceDenominator = ItemParserUtils.parseNumber(priceFraction[1])
        }
      } else if (notePrice.indexOf('.') !== -1 || notePrice.indexOf(',') !== -1) {
        priceNumerator = ItemParserUtils.parseDecimalNumber(notePrice, notePrice.split(/[.,]+/)[1].length)
      }
    }

    const currencyId = price.currency
    return this.currencyService.searchById(currencyId).pipe(
      map((currency) => {
        if (!currency) {
          this.logger.warn(`Could not parse '${currencyId}' as currency.`)
          return undefined
        }
        const result: ItemSearchListing =  {
          seller,
          indexed,
          currency,
          amount,
          age: indexed.fromNow(),
          priceNumerator,
          priceDenominator,
        }
        return result
      })
    )
  }

  private mapExchangeFetchResult(result: ExchangeFetchResult): Observable<ItemSearchListing> {
    if (
      !result ||
      !result.id ||
      !result.listing ||
      !result.listing.account ||
      !result.listing.indexed ||
      !result.listing.offers ||
      result.listing.offers.length === 0 ||
      !result.listing.offers.some(x => x.item.id === result.id)
    ) {
      this.logger.warn(`Result was invalid.`, result)
      return of(undefined)
    }

    const { id, listing } = result
    const offer = listing.offers.find(x => x.item.id === id)

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

    const { currency, amount } = offer.exchange

    const priceNumerator = amount
    const priceDenominator = offer.item.amount

    if (priceNumerator <= 0) {
      this.logger.warn(`Exchange amount was less or equal zero. Seller: ${seller}`)
      return of(undefined)
    }

    if (priceDenominator <= 0) {
      this.logger.warn(`Offer Amount was less or equal zero. Seller: ${seller}`)
      return of(undefined)
    }

    return this.currencyService.searchById(currency).pipe(
      map((currency) => {
        if (!currency) {
          this.logger.warn(`Could not parse '${currency}' as currency.`)
          return undefined
        }
        const result: ItemSearchListing = {
          seller,
          indexed,
          currency,
          amount: MathUtils.floor((priceNumerator / priceDenominator), MathUtils.significantDecimalCount(priceNumerator, priceDenominator)),
          age: indexed.fromNow(),
          priceNumerator,
          priceDenominator,
        }
        return result
      })
    )
  }
}

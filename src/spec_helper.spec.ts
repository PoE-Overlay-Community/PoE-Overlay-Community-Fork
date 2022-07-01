import { TestBed } from '@angular/core/testing'
import { CacheService } from '@app/service/cache.service'
import { forkJoin } from 'rxjs'

let cache: CacheService

const mockLeagues: any = require('doc/poe/api_trade_data_leagues.json')
const mockStaticCurrencyData: any = require('doc/poe/mockCurrenciesCache.json')
const mockExchangeRates: any = require('doc/poe-ninja/currencyoverviewcache.json')
const mockItemCategoryDivinationCard: any = require('doc/poe-ninja/itemcategory_card.json')

beforeAll((done) => {
  cache = TestBed.inject<CacheService>(CacheService)
  forkJoin([
    cache.store(`leagues_1`, mockLeagues.result, 99999, true),
    cache.store('currency_chaos_equivalents_Delirium', mockExchangeRates, 99999, true),
    cache.store('all_1', mockStaticCurrencyData, 99999, true),
    cache.store('currency_1', mockStaticCurrencyData, 99999, true),
    cache.store('item_category_Delirium_card', mockItemCategoryDivinationCard, 99999, true),
  ]).subscribe(() => done())
})

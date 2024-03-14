import { TestBed } from '@angular/core/testing'
import { Item, Language } from '@shared/module/poe/type'
import { SharedModule } from '@shared/shared.module'
import { BaseItemTypesService } from '../base-item-types/base-item-types.service'
import { ContextService } from '../context.service'
import { ItemSearchService, TradeSearchResult } from './item-search.service'
import {
  TradeFetchResult,
  PoEHttpService,
  TradeSearchResponse,
  TradeResponse,
  TradeSearchType,
} from '@data/poe'
import { of } from 'rxjs'

describe('ItemSearchService', () => {
  let sut: ItemSearchService
  let contextService: ContextService
  let baseItemTypesService: BaseItemTypesService
  let tradeServiceSpy: jasmine.SpyObj<PoEHttpService>

  const mockLeagues: any = require('doc/poe/api_trade_data_leagues.json')
  const mockStatic: any = require('doc/poe/api_trade_data_static.json')
  const mockSearchResult: TradeSearchResponse = {
    searchType: TradeSearchType.NormalTrade,
    id: 'y35jtR',
    result: [
      '72fad07c5684c05f543504bf40c1739081e34a3c63f101b1c4477d8547763563',
      '71c98661168b99693db42191c4788f8216a335f095e49fa3d35c49fb200c0f5d',
    ],
    total: 15785,
    url: 'https://www.pathofexile.com/trade/search/Delirum/y35jtR',
  }
  const mockFetchResult: TradeResponse<TradeFetchResult> = {
    result: [
      {
        id: '72fad07c5684c05f543504bf40c1739081e34a3c63f101b1c4477d8547763563',
        listing: {
          indexed: '2020-06-12T13:49:07Z',
          account: {
            name: 'Lord_Mohamed',
          },
          price: { type: '~price', amount: 1, currency: 'jew' },
        },
        item: {
          note: '~price 1 jew',
        },
      },
      {
        id: '71c98661168b99693db42191c4788f8216a335f095e49fa3d35c49fb200c0f5d',
        listing: {
          indexed: '2020-06-13T12:54:38Z',
          account: {
            name: 'Lord_Mohamed',
          },
          price: { type: '~price', amount: 1, currency: 'alch' },
        },
        item: {
          note: '~price 1 alch',
        },
      },
    ],
  }

  beforeEach((done) => {
    const tradeServiceSpyObj = jasmine.createSpyObj('PoEHttpService', [
      'search',
      'exchange',
      'fetch',
      'getStats',
      'getStatic',
      'getLeagues',
      'getItems',
    ])

    TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: [{ provide: PoEHttpService, useValue: tradeServiceSpyObj }],
    }).compileComponents()

    tradeServiceSpy = TestBed.inject(PoEHttpService) as jasmine.SpyObj<PoEHttpService>
    tradeServiceSpy.getLeagues.and.returnValue(of(mockLeagues))
    sut = TestBed.inject<ItemSearchService>(ItemSearchService)

    contextService = TestBed.inject<ContextService>(ContextService)
    contextService
      .init({
        language: Language.English,
        leagueId: 'Delirium',
      })
      .subscribe(() => done())
    baseItemTypesService = TestBed.inject<BaseItemTypesService>(BaseItemTypesService)
  })

  it('should return items', (done) => {
    const requestedItem: Item = {
      typeId: baseItemTypesService.searchId('Topaz Ring', 1),
    }
    tradeServiceSpy.search.and.returnValue(of(mockSearchResult))

    sut.searchOrExchange(requestedItem, { language: Language.English }).subscribe(
      (result) => {
        expect(result.hits.length).toBeGreaterThan(0)
        done()
      },
      (error) => {
        done.fail(error)
      }
    )
  })

  it('should list items from search', (done) => {
    const requestedItem: Item = {
      typeId: baseItemTypesService.searchId('Topaz Ring', 1),
    }
    tradeServiceSpy.search.and.returnValue(of(mockSearchResult))
    tradeServiceSpy.fetch.and.returnValue(of(mockFetchResult))
    tradeServiceSpy.getStatic.and.returnValue(of(mockStatic))

    sut
      .searchOrExchange(requestedItem, { language: Language.English, leagueId: 'Delirium' })
      .subscribe(
        (result) => {
          const tradeResult = result as TradeSearchResult
          expect(tradeResult.hits.length).toBeGreaterThan(0)

          sut.listTradeSearch(tradeResult, 2).subscribe(
            (listings) => {
              expect(listings.length).toBe(Math.min(tradeResult.hits.length, 2))

              done()
            },
            (error) => done.fail(error)
          )
        },
        (error) => done.fail(error)
      )
  })
})

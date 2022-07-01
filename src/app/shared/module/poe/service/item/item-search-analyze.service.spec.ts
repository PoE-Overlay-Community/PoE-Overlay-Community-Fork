import { TestBed } from '@angular/core/testing'
import { TradeSearchType } from '@data/poe'
import { Item, Language } from '@shared/module/poe/type'
import { SharedModule } from '@shared/shared.module'
import moment from 'moment'
import { forkJoin, of } from 'rxjs'
import { flatMap } from 'rxjs/operators'
import { BaseItemTypesService } from '../base-item-types/base-item-types.service'
import { ContextService } from '../context.service'
import { CurrencyService } from '../currency/currency.service'
import { ItemSearchAnalyzeService } from './item-search-analyze.service'
import { ItemSearchListing, ItemSearchService, TradeSearchResult } from './item-search.service'

describe('ItemSearchAnalyzeService', () => {
  let sut: ItemSearchAnalyzeService
  let contextService: ContextService
  let searchService: ItemSearchService
  let currencyService: CurrencyService
  let baseItemTypesService: BaseItemTypesService
  let itemSearchServiceSpy: jasmine.SpyObj<ItemSearchService>

  const mockSearchResult: TradeSearchResult = {
    searchType: TradeSearchType.NormalTrade,
    id: 'y35jtR',
    hits: [
      '72fad07c5684c05f543504bf40c1739081e34a3c63f101b1c4477d8547763563',
      '71c98661168b99693db42191c4788f8216a335f095e49fa3d35c49fb200c0f5d',
    ],
    language: Language.English,
    total: 15785,
    url: 'https://www.pathofexile.com/trade/search/Delirum/y35jtR',
  }

  const mockListResult: ItemSearchListing[] = [
    {
      seller: 'Lord_Mohamed',
      indexed: moment('2020-06-12T13:49:07.000Z'),
      currency: {
        id: 'jew',
        nameType: "Jeweller's Orb",
        image:
          '/image/Art/2DItems/Currency/CurrencyRerollSocketNumbers.png?v=2946b0825af70f796b8f15051d75164d',
      },
      amount: 1,
      age: '4 days ago',
      priceNumerator: 1,
      priceDenominator: 1,
    },
    {
      seller: 'Lord_Mohamed',
      indexed: moment('2020-06-13T12:54:38.000Z'),
      currency: {
        id: 'alch',
        nameType: 'Orb of Alchemy',
        image:
          '/image/Art/2DItems/Currency/CurrencyUpgradeToRare.png?v=89c110be97333995522c7b2c29cae728',
      },
      amount: 1,
      age: '3 days ago',
      priceNumerator: 1,
      priceDenominator: 1,
    },
  ]

  beforeEach((done) => {
    const itemSearchServiceSpyObj = jasmine.createSpyObj('ItemSearchService', [
      'searchOrExchange',
      'listTradeSearch',
    ])

    TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: [{ provide: ItemSearchService, useValue: itemSearchServiceSpyObj }],
    }).compileComponents()
    sut = TestBed.inject<ItemSearchAnalyzeService>(ItemSearchAnalyzeService)

    itemSearchServiceSpy = TestBed.inject(ItemSearchService) as jasmine.SpyObj<ItemSearchService>

    contextService = TestBed.inject<ContextService>(ContextService)
    contextService
      .init({
        language: Language.English,
      })
      .subscribe(() => done())

    searchService = TestBed.inject<ItemSearchService>(ItemSearchService)
    currencyService = TestBed.inject<CurrencyService>(CurrencyService)
    baseItemTypesService = TestBed.inject<BaseItemTypesService>(BaseItemTypesService)
  })

  it('should return items', (done) => {
    const requestedItem: Item = {
      typeId: baseItemTypesService.searchId('Topaz Ring'),
    }
    itemSearchServiceSpy.searchOrExchange.and.returnValue(of(mockSearchResult))
    itemSearchServiceSpy.listTradeSearch.and.returnValue(of(mockListResult))

    forkJoin([
      searchService
        .searchOrExchange(requestedItem)
        .pipe(flatMap((result) => searchService.listTradeSearch(result as TradeSearchResult, 10))),
      currencyService.searchById('chaos'),
    ]).subscribe(
      (results) => {
        sut.analyze(results[0], [results[1]]).subscribe(
          (result) => {
            expect(result.values.median).toBeGreaterThan(0)
            done()
          },
          (error) => {
            done.fail(error)
          }
        )
      },
      (error) => {
        done.fail(error)
      }
    )
  })
})

import { TestBed } from '@angular/core/testing'
import { SharedModule } from '@shared/shared.module'
import { forkJoin, from } from 'rxjs'
import { Item, Language } from '../../type'
import { ContextService } from '../context.service'
import { CurrencyService } from '../currency/currency.service'
import { ItemPricePredictionService } from './item-price-prediction.service'
import { ItemPricePrediction, ItemPricePredictionProvider } from '@shared/module/poe/provider'

describe('ItemPricePredictionService', () => {
  let sut: ItemPricePredictionService
  let contextService: ContextService
  let currencyService: CurrencyService
  let itemPricePredictionProvider: ItemPricePredictionProvider
  let mock

  beforeEach((done) => {
    const result: ItemPricePrediction = {
      min: 1,
      max: 2,
      currency: 'exalt',
      currencyId: 'exalted',
      score: 1,
    }
    const mockObservable = from(Promise.resolve(result))

    TestBed.configureTestingModule({
      imports: [SharedModule],
    }).compileComponents()
    mock = TestBed.inject<ItemPricePredictionProvider>(
      ItemPricePredictionProvider
    ) as jasmine.SpyObj<ItemPricePredictionProvider>
    sut = TestBed.inject<ItemPricePredictionService>(ItemPricePredictionService)

    itemPricePredictionProvider = TestBed.inject<ItemPricePredictionProvider>(
      ItemPricePredictionProvider
    )

    spyOn(itemPricePredictionProvider, 'provide').and.returnValue(mockObservable)
    contextService = TestBed.inject<ContextService>(ContextService)
    contextService
      .init({
        language: Language.English,
      })
      .subscribe(() => done())

    currencyService = TestBed.inject<CurrencyService>(CurrencyService)
  })

  it('should return items', (done) => {
    const requestedItem: Item = {
      source:
        'Item Class: ** UNSET **\n' +
        'Rarity: Rare\n' +
        'Victory Corona\n' +
        'Steel Circlet\n' +
        '--------\n' +
        'Energy Shield: 46\n' +
        '--------\n' +
        'Requirements:\n' +
        'Level: 60\n' +
        'Str: 96\n' +
        'Int: 125\n' +
        '--------\n' +
        'Sockets: R-B-B-B \n' +
        '--------\n' +
        'Item Level: 47\n' +
        '--------\n' +
        '+25 to Intelligence\n' +
        '+29 to maximum Mana\n' +
        '+6% to Fire Resistance\n' +
        '+7% to Lightning Resistance\n',
    }

    forkJoin([currencyService.searchById('chaos')]).subscribe(
      (currencies) => {
        sut.predict(requestedItem, currencies).subscribe(
          (result) => {
            expect(result.min).toBeGreaterThan(0)
            expect(result.max).toBeGreaterThan(0)
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

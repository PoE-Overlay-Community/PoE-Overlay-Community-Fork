import { Injectable } from '@angular/core'
import { cyrb53 } from '@app/function'
import { CacheService } from '@app/service'
import { ItemPricePredictionHttpService } from '@data/poe-prices'
import { Observable } from 'rxjs'
import { flatMap, map } from 'rxjs/operators'
import { CacheExpirationType } from '@shared/module/poe/type'

export interface ItemPricePrediction {
  min: number
  max: number
  currency: 'chaos' | 'exalt' | 'divine'
  currencyId: string
  score: number
}

const CACHE_PATH = 'item_price_'

@Injectable({
  providedIn: 'root',
})
export class ItemPricePredictionProvider {
  constructor(
    private readonly http: ItemPricePredictionHttpService,
    private readonly cache: CacheService
  ) {}

  public provide(leagueId: string, stringifiedItem: string): Observable<ItemPricePrediction> {
    const hash = cyrb53(stringifiedItem)
    const key = `${CACHE_PATH}${leagueId}_${hash}`
    return this.cache.prune(CACHE_PATH).pipe(
      flatMap(() =>
        this.cache.proxy(
          key,
          () =>
            this.http.get(leagueId, stringifiedItem).pipe(
              map((response) => {
                const currencyId = response.currency === 'exalt' ? 'exalted' : response.currency
                const result: ItemPricePrediction = {
                  currencyId,
                  currency: response.currency,
                  max: response.max,
                  min: response.min,
                  score: response.pred_confidence_score,
                }
                return result
              })
            ),
          CacheExpirationType.FifteenMin,
          true
        )
      )
    )
  }
}

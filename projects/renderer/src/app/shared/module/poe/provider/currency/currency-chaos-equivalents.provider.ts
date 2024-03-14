import { Injectable } from '@angular/core'
import { CacheService } from '@app/service'
import * as PoENinja from '@data/poe-ninja'
import { CacheExpirationType, CurrencyChaosEquivalents } from '@shared/module/poe/type'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

@Injectable({
  providedIn: 'root',
})
export class CurrencyChaosEquivalentsProvider {
  constructor(
    private readonly currencyOverviewHttpService: PoENinja.CurrencyOverviewHttpService,
    private readonly cache: CacheService
  ) {}

  public provide(leagueId: string): Observable<CurrencyChaosEquivalents> {
    const key = `currency_chaos_equivalents_${leagueId}`
    return this.cache.proxy(key, () => this.fetch(leagueId), CacheExpirationType.HalfHour)
  }

  private fetch(leagueId: string): Observable<CurrencyChaosEquivalents> {
    return this.currencyOverviewHttpService
      .get(leagueId, PoENinja.CurrencyOverviewType.Currency)
      .pipe(
        map((response) => {
          const currencyChaosEquivalents: CurrencyChaosEquivalents = {}
          response.lines.forEach((line) => {
            currencyChaosEquivalents[line.currencyTypeName] = line.chaosEquivalent
          })
          currencyChaosEquivalents['Chaos Orb'] = 1
          return currencyChaosEquivalents
        })
      )
  }
}

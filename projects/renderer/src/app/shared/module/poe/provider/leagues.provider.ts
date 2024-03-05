import { Injectable } from '@angular/core'
import { CacheService } from '@app/service'
import { PoEHttpService } from '@data/poe'
import { CacheExpiration, CacheExpirationType, Language, League } from '@shared/module/poe/type'
import { forkJoin, Observable } from 'rxjs'
import { map } from 'rxjs/operators'

@Injectable({
  providedIn: 'root',
})
export class LeaguesProvider {
  constructor(
    private readonly poeHttpService: PoEHttpService,
    private readonly cache: CacheService
  ) {}

  public provide(language: Language, cacheExpiration?: CacheExpirationType): Observable<League[]> {
    const key = `leagues_${language}`
    return this.cache.proxy(key, () => this.fetch(language), CacheExpiration.getExpiration(cacheExpiration, CacheExpirationType.OneHour))
  }

  private fetch(language: Language): Observable<League[]> {
    return forkJoin([
      this.poeHttpService.getLeagues(language),
      this.poeHttpService.getTradePageLeagues(language)
    ]).pipe(map((responses) => {
      const leagues = responses[0].result
      const tradePageLeagues = responses[1]?.result || []
      const allLeagues = leagues.concat(tradePageLeagues.filter((x) => leagues.findIndex((y) => x.id === y.id) === -1))
      return allLeagues.filter(league => league.realm == "pc").map(league => {
        const result: League = {
          id: league.id,
          text: league.text,
          privateLeague: leagues.findIndex((l) => l.id === league.id) === -1
        }
        return result
      })
    }))
  }
}

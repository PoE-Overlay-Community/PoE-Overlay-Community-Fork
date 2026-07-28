import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { LeaguesProvider } from '../provider'
import { CacheExpirationType, Language, League } from '../type'
import { ContextService } from './context.service'

@Injectable({
  providedIn: 'root',
})
export class LeaguesService {
  constructor(
    private readonly context: ContextService,
    private readonly leaguesProvider: LeaguesProvider
  ) {}

  public getLeagues(language?: Language, cacheExpiration: CacheExpirationType = CacheExpirationType.OneHour): Observable<League[]> {
    language = language || this.context.get().language
    return this.leaguesProvider.provide(language, cacheExpiration)
  }

  public get(leagueId: string, language?: Language): Observable<League> {
    language = language || this.context.get().language
    return this.getLeagues(language).pipe(map((leagues) => leagues.find((l) => l.id === leagueId)))
  }
}

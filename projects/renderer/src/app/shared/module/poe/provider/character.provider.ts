import { Injectable } from '@angular/core'
import { CacheService } from '@app/service'
import { ApiCharacterResponse, ApiErrorResponse, PoEHttpService } from '@data/poe'
import { CacheExpiration, CacheExpirationType, Language, PoECharacter } from '@shared/module/poe/type'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

@Injectable({
  providedIn: 'root',
})
export class PoECharacterProvider {
  public readonly defaultCacheExpiration = CacheExpirationType.FiveMin

  constructor(
    private readonly poeHttpService: PoEHttpService,
    private readonly cache: CacheService
  ) { }

  public provide(accountName: string, language: Language, cacheExpiration?: CacheExpirationType): Observable<PoECharacter[]> {
    const key = `characters_${language}_${accountName}`
    return this.cache.proxy(key, () => this.fetch(accountName, language), CacheExpiration.getExpiration(cacheExpiration, this.defaultCacheExpiration))
  }

  private fetch(accountName: string, language: Language): Observable<PoECharacter[]> {
    return this.poeHttpService.getCharacters(accountName, language).pipe(map((response) => {
      const apiError = response as ApiErrorResponse
      if (apiError && apiError.error) {
        return []
      } else {
        const characters = response as ApiCharacterResponse[]
        return characters.map((character) => {
          const poeCharacter: PoECharacter = {
            name: character.name,
            leagueId: character.league,
            level: character.level,
            experience: character.experience,
            lastActive: character.lastActive,
          }
          return poeCharacter
        })
      }
    }))
  }
}

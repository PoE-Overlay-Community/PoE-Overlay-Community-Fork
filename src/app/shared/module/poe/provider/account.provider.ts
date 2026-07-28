import { Injectable } from '@angular/core'
import { CacheService } from '@app/service'
import { ApiErrorResponse, ApiProfileResponse, PoEHttpService } from '@data/poe'
import { CacheExpiration, CacheExpirationType, Language, PoEAccount } from '@shared/module/poe/type'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

@Injectable({
  providedIn: 'root',
})
export class PoEAccountProvider {
  constructor(
    private readonly poeHttpService: PoEHttpService,
    private readonly cache: CacheService
  ) { }

  public provide(language: Language, cacheExpiration?: CacheExpirationType): Observable<PoEAccount> {
    const key = `accountinfo_${language}`
    return this.cache.proxy(key, () => this.fetch(language), CacheExpiration.getExpiration(cacheExpiration, CacheExpirationType.OneHour))
  }

  public update(account: PoEAccount, language: Language): Observable<PoEAccount> {
    const key = `accountinfo_${language}`
    return this.cache.store(key, account, CacheExpirationType.OneHour)
  }

  private fetch(language: Language): Observable<PoEAccount> {
    return this.poeHttpService.getAccountInfo(language).pipe(map((response) => {
      const apiError = response as ApiErrorResponse
      if (apiError && apiError.error) {
        const poeAccount: PoEAccount = {
          loggedIn: false
        }
        return poeAccount
      } else {
        const account = response as ApiProfileResponse
        const poeAccount: PoEAccount = {
          loggedIn: true,
          name: account.name
        }
        return poeAccount
      }
    }))
  }
}

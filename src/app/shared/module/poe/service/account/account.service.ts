import { Injectable } from '@angular/core'
import { PoEHttpService } from '@data/poe'
import { BehaviorSubject, Observable, of, Subscription, TimeInterval } from 'rxjs'
import { flatMap, map, tap } from 'rxjs/operators'
import { BrowserService } from '@app/service'
import { PoEAccountProvider } from '../../provider/account.provider'
import { CacheExpirationType, Language, PoEAccount, PoECharacter } from '../../type'
import { ContextService } from '../context.service'
import { PoECharacterProvider } from '../../provider/character.provider'
import { UserSettings } from '../../../../../layout/type'

@Injectable({
  providedIn: 'root',
})
export class PoEAccountService {
  private readonly accountSubject = new BehaviorSubject<PoEAccount>(undefined)

  public get defaultCharacterCacheExpiration(): CacheExpirationType {
    return this.characterProvider.defaultCacheExpiration
  }

  private settings: UserSettings

  private characterInterval: NodeJS.Timeout

  constructor(
    private readonly context: ContextService,
    private readonly accountProvider: PoEAccountProvider,
    private readonly browser: BrowserService,
    private readonly poeHttpService: PoEHttpService,
    private readonly characterProvider: PoECharacterProvider,
  ) { }

  public register(settings: UserSettings): Observable<PoEAccount> {
    this.settings = settings

    return this.getAsync()
  }

  public unregister(): void {
    this.tryStopPeriodicUpdate()
  }

  public subscribe(next: (value: PoEAccount) => void): Subscription {
    return this.accountSubject.subscribe(next)
  }

  public get(): PoEAccount {
    return this.accountSubject.getValue()
  }

  public getActiveCharacter(): PoECharacter {
    return this.get()?.characters?.find(x => x.lastActive)
  }

  public getAsync(language?: Language): Observable<PoEAccount> {
    language = language || this.context.get().language
    return this.accountProvider.provide(language).pipe(flatMap((account) => {
      return this.getCharacters(account, language).pipe(map(() => {
        this.accountSubject.next(account)
        this.tryStartPeriodicUpdate()
        return account
      }))
    }))
  }

  public forceUpdateCharacters(): void {
    this.periodicCharacterUpdate(CacheExpirationType.OneMin)
  }

  public login(language?: Language): Observable<PoEAccount> {
    language = language || this.context.get().language
    return this.browser.openAndWait(this.poeHttpService.getLoginUrl(language)).pipe(flatMap(() => {
      return this.accountProvider.provide(language, CacheExpirationType.Instant).pipe(flatMap((account) => {
        if (account.loggedIn) {
          return this.characterProvider.provide(account.name, language, CacheExpirationType.Instant).pipe(map((characters) => {
            account.characters = characters
            this.accountSubject.next(account)
            this.tryStartPeriodicUpdate()
            return account
          }))
        } else {
          return of(account)
        }
      }))
    }))
  }

  public logout(language?: Language): Observable<PoEAccount> {
    language = language || this.context.get().language
    return this.browser.retrieve(this.poeHttpService.getLogoutUrl(language)).pipe(
      flatMap(() => 
        this.accountProvider.update({
          loggedIn: false,
        }, language)
      ),
      tap((account) => {
        this.tryStopPeriodicUpdate()
        this.accountSubject.next(account)
      })
    )
  }

  private getCharacters(account: PoEAccount, language?: Language, cacheExpiration?: CacheExpirationType): Observable<PoECharacter[]> {
    if (account.loggedIn) {
      language = language || this.context.get().language
      return this.characterProvider.provide(account.name, language, cacheExpiration).pipe(tap((characters) => {
        account.characters = characters
      }))
    }
    return of([])
  }

  private tryStartPeriodicUpdate(): void {
    if (!this.characterInterval && this.settings && (!this.settings.charactersCacheExpiration || this.settings.charactersCacheExpiration !== CacheExpirationType.Never)) {
      this.characterInterval = setInterval(() => this.periodicCharacterUpdate(), (this.settings.charactersCacheExpiration || this.characterProvider.defaultCacheExpiration) + 10)
    }
  }

  private tryStopPeriodicUpdate(): void {
    if (this.characterInterval) {
      clearInterval(this.characterInterval)
      this.characterInterval = null
    }
  }

  private periodicCharacterUpdate(cacheExpiration?: CacheExpirationType) {
    const account = this.get()
    if (account.loggedIn) {
      this.getCharacters(this.get(), undefined, cacheExpiration || this.settings?.charactersCacheExpiration).subscribe(() => {
        this.accountSubject.next(account)
      })
      this.tryStartPeriodicUpdate()
    }
  }
}

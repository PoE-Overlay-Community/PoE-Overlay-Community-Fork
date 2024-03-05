import { Injectable } from '@angular/core'
import { BrowserService, ElectronService } from '@app/service'
import { PoEHttpService } from '@data/poe'
import { UserSettings } from '@layout/type'
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs'
import { flatMap, map, tap } from 'rxjs/operators'
import { PoEAccountProvider } from '../../provider/account.provider'
import { PoECharacterProvider } from '../../provider/character.provider'
import { CacheExpirationType, Language, PoEAccount, PoECharacter } from '../../type'
import { ContextService } from '../context.service'
import { POE_ACCOUNT_UPDATED } from './account-thread.service'

@Injectable({
  providedIn: 'root',
})
export class PoEAccountService {
  private readonly accountSubject = new BehaviorSubject<PoEAccount>(undefined)

  public get defaultCharacterCacheExpiration(): CacheExpirationType {
    return this.characterProvider.defaultCacheExpiration
  }

  private settings: UserSettings

  private scopedAccountUpdatedEventHandler

  constructor(
    private readonly electronService: ElectronService,
    private readonly context: ContextService,
    private readonly accountProvider: PoEAccountProvider,
    private readonly browser: BrowserService,
    private readonly poeHttpService: PoEHttpService,
    private readonly characterProvider: PoECharacterProvider,
  ) { }

  public register(settings: UserSettings): Observable<PoEAccount> {
    this.settings = settings

    if (!this.scopedAccountUpdatedEventHandler) {
      this.scopedAccountUpdatedEventHandler = () => this.updateCharacters()

      this.electronService.onMain(POE_ACCOUNT_UPDATED, this.scopedAccountUpdatedEventHandler)
    }

    return this.getAsync()
  }

  public unregister(): void {
    if (this.scopedAccountUpdatedEventHandler) {
      this.electronService.removeMainListener(POE_ACCOUNT_UPDATED, this.scopedAccountUpdatedEventHandler)
      this.scopedAccountUpdatedEventHandler = null
    }
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
    const oldAccount = { ...this.get() }
    return this.accountProvider.provide(language).pipe(flatMap((account) => {
      return this.getCharacters(account, language).pipe(map(() => {
        if (oldAccount !== account) {
          this.accountSubject.next(account)
        }
        return account
      }))
    }))
  }

  public forceUpdateCharacters(): void {
    this.updateCharacters(CacheExpirationType.FiveSeconds)
  }

  public login(language?: Language): Observable<PoEAccount> {
    language = language || this.context.get().language
    return this.browser.openAndWait(this.poeHttpService.getLoginUrl(language)).pipe(flatMap(() => {
        return this.accountProvider.provide(language, CacheExpirationType.Instant).pipe(flatMap((account) => {
          if (account.loggedIn) {
            return this.characterProvider.provide(account.name, language, CacheExpirationType.Instant).pipe(map((characters) => {
              account.characters = characters
              this.accountSubject.next(account)
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

  private updateCharacters(cacheExpiration?: CacheExpirationType) {
    const account = this.get()
    if (account?.loggedIn) {
      const oldAccount = { ...account }
      this.getCharacters(account, undefined, cacheExpiration || this.settings?.charactersCacheExpiration).subscribe(() => {
        if (oldAccount !== account) {
          this.accountSubject.next(account)
        }
      })
    }
  }
}

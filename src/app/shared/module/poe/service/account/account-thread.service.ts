import { Injectable } from '@angular/core'
import { ElectronService } from '@app/service'
import { UserSettings } from '@layout/type'
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs'
import { flatMap, map, tap } from 'rxjs/operators'
import { PoEAccountProvider } from '../../provider/account.provider'
import { PoECharacterProvider } from '../../provider/character.provider'
import { CacheExpirationType, Language, PoEAccount, PoECharacter } from '../../type'
import { ContextService } from '../context.service'

export const POE_ACCOUNT_UPDATED = 'poe-account-updated'

@Injectable({
  providedIn: 'root',
})
export class PoEAccountThreadService {
  private readonly accountSubject = new BehaviorSubject<PoEAccount>(undefined)

  private settings: UserSettings

  private characterInterval: NodeJS.Timeout

  constructor(
    private readonly electronService: ElectronService,
    private readonly context: ContextService,
    private readonly accountProvider: PoEAccountProvider,
    private readonly characterProvider: PoECharacterProvider,
  ) {
  }

  public register(settings: UserSettings): Observable<PoEAccount> {
    this.settings = settings

    return this.updateAccountAndCharacters()
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

  private updateAccountAndCharacters(): Observable<PoEAccount> {
    const language = this.context.get().language
    const oldAccount = { ...this.get() }
    return this.accountProvider.provide(language).pipe(flatMap((account) => {
      return this.getCharacters(account, language, this.settings.charactersCacheExpiration).pipe(map(() => {
        if (oldAccount !== account) {
          this.updateAccount(account)
        }
        this.tryStartPeriodicUpdate()
        return account
      }))
    }))
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

  private periodicCharacterUpdate(cacheExpiration?: CacheExpirationType): void {
    const account = this.get()
    if (account.loggedIn) {
      const oldAccount: PoEAccount = { ...account }
      this.getCharacters(account, undefined, cacheExpiration || this.settings?.charactersCacheExpiration).subscribe(() => {
        if (oldAccount !== account) {
          this.updateAccount(account)
        }
      })
      this.tryStartPeriodicUpdate()
    }
  }

  private updateAccount(account: PoEAccount): void {
    this.accountSubject.next(account)
    this.electronService.send(POE_ACCOUNT_UPDATED)
  }
}

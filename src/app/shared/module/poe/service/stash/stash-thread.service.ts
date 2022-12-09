import { Injectable } from '@angular/core'
import { ElectronService } from '@app/service'
import { UserSettings } from '@layout/type'
import { forkJoin, Observable, of, Subject, Subscription } from 'rxjs'
import { concatAll, delay, flatMap, map } from 'rxjs/operators'
import { StashProvider } from '../../provider/stash.provider'
import { CacheExpirationType, PoEAccount } from '../../type'
import { StashGridUserSettings } from '../../type/stash-grid.type'
import { PoEStashTab, PoEStashTabItem, StashTabsToSearch } from '../../type/stash.type'
import { PoEAccountThreadService } from '../account/account-thread.service'
import { ContextService } from '../context.service'

export const STASH_TAB_INFO_CHANGED = 'stash-tab-info-changed'
export const STASH_PERIODIC_UPDATE_ACTIVE_CHANGED = 'stash-periodic-update-active-changed'

@Injectable({
  providedIn: 'root',
})
export class StashThreadService {
  public readonly stashTabContentUpdated$ = new Subject<void>()

  private accountSub: Subscription
  private stashTabInfoInterval: NodeJS.Timeout
  private stashTabContentInterval: NodeJS.Timeout

  private settings: StashGridUserSettings

  private stashTabProviders: StashTabsToSearch[] = []

  constructor(
    private readonly electronService: ElectronService,
    private readonly stashProvider: StashProvider,
    private readonly accountThreadService: PoEAccountThreadService,
    private readonly context: ContextService,
  ) {
  }

  public register(settings: UserSettings): void {
    this.settings = settings as StashGridUserSettings

    this.accountSub = this.accountThreadService.subscribe((account) => this.onAccountChanged(account))

    this.periodicStashTabInfoUpdate()
    this.periodicStashContentUpdate()
  }

  public unregister(): void {
    this.tryStopPeriodicUpdate()
    if (this.accountSub) {
      this.accountSub.unsubscribe()
      this.accountSub = null
    }
  }

  public registerStashTabToSearch(provider: StashTabsToSearch): void {
    this.stashTabProviders.push(provider)
  }

  public unregisterStashTabToSearch(provider: StashTabsToSearch): void {
    this.stashTabProviders = this.stashTabProviders.filter((x) => x !== provider)
  }

  public forceUpdateTabInfo(): void {
    this.periodicStashTabInfoUpdate(CacheExpirationType.FiveSeconds)
  }

  public forceUpdateTabContent(): void {
    this.periodicStashContentUpdate(CacheExpirationType.FiveSeconds)
  }

  public getStashTabs(predicate: (stashTab: PoEStashTab) => boolean): Observable<PoEStashTab[]> {
    const account = this.accountThreadService.get()
    if (account.loggedIn) {
      const context = this.context.get()
      return this.stashProvider.provideTabInfo(account.name, context.leagueId, context.language).pipe(map((stashTabs) => {
        return stashTabs.filter((stashTab) => predicate(stashTab))
      }))
    } else {
      return of([])
    }
  }

  public getStashTabContents(stashTabs: PoEStashTab[], cacheExpiration?: CacheExpirationType): Observable<PoEStashTabItem[]> {
    if (stashTabs.length === 0) {
      return of([])
    }
    const account = this.accountThreadService.get()
    if (account.loggedIn) {
      const context = this.context.get()
      const uniqueStashTabs = stashTabs.reduce((accumulator, current) => {
        if (!accumulator.some((stashTab) => stashTab.id === current.id)) {
          accumulator.push(current);
        }
        return accumulator;
      }, []);

      return forkJoin(
        uniqueStashTabs.map((stashTab, i) =>
          of(stashTab).pipe(
            // Delay each stash tab to ensure we don't hit rate limits
            delay(50 * i),
            flatMap(stashTab => this.stashProvider.provideTabsContent(stashTab, account.name, context.leagueId, context.language, cacheExpiration || this.settings?.stashTabContentCacheExpiration))
          )
        )
      ).pipe(
        map(x => [].concat(...x) as PoEStashTabItem[])
      )
    } else {
      return of([])
    }
  }

  private periodicStashTabInfoUpdate(cacheExpiration?: CacheExpirationType) {
    const account = this.accountThreadService.get()
    if (account.loggedIn) {
      const context = this.context.get()
      this.stashProvider.provideTabInfo(account.name, context.leagueId, context.language, cacheExpiration || this.settings?.stashTabInfoCacheExpiration).subscribe(
        null,
        (err) => console.error(err),
        () => this.electronService.send(STASH_TAB_INFO_CHANGED)
      )
      this.tryStartPeriodicUpdate()
    }
  }

  private periodicStashContentUpdate(cacheExpiration?: CacheExpirationType): void {
    this.electronService.send(STASH_PERIODIC_UPDATE_ACTIVE_CHANGED, true)
    const account = this.accountThreadService.get()
    if (account.loggedIn && this.stashTabProviders.length > 0) {
      const providers = this.stashTabProviders.map((provider) => provider.getStashTabsToSearch())
      forkJoin(providers).pipe(
        concatAll(),
        flatMap((stashTabs) => this.getStashTabContents(stashTabs, cacheExpiration))
      ).subscribe(null, null, () => {
        this.stashTabContentUpdated$.next()
        this.electronService.send(STASH_PERIODIC_UPDATE_ACTIVE_CHANGED, false)
      })
      this.tryStartPeriodicUpdate()
    } else {
      this.electronService.send(STASH_PERIODIC_UPDATE_ACTIVE_CHANGED, false)
    }
  }

  private tryStartPeriodicUpdate(): void {
    if (!this.stashTabInfoInterval && this.settings && (!this.settings.stashTabInfoCacheExpiration || this.settings.stashTabInfoCacheExpiration !== CacheExpirationType.Never)) {
      this.stashTabInfoInterval = setInterval(() => this.periodicStashTabInfoUpdate(), (this.settings.stashTabInfoCacheExpiration || this.stashProvider.defaultTabInfoCacheExpiration) + 10)
    }
    if (!this.stashTabContentInterval && this.settings && (!this.settings.stashTabContentCacheExpiration || this.settings.stashTabContentCacheExpiration !== CacheExpirationType.Never)) {
      this.stashTabContentInterval = setInterval(() => this.periodicStashContentUpdate(), (this.settings.stashTabContentCacheExpiration || this.stashProvider.defaultTabContentCacheExpiration) + 10)
    }
  }

  private tryStopPeriodicUpdate(): void {
    if (this.stashTabInfoInterval) {
      clearInterval(this.stashTabInfoInterval)
      this.stashTabInfoInterval = null
    }
    if (this.stashTabContentInterval) {
      clearInterval(this.stashTabContentInterval)
      this.stashTabContentInterval = null
    }
  }

  private onAccountChanged(account: PoEAccount) {
    if (account.loggedIn) {
      this.periodicStashTabInfoUpdate(CacheExpirationType.Instant)
      this.periodicStashContentUpdate(CacheExpirationType.Instant)
    } else {
      this.tryStopPeriodicUpdate()
    }
  }
}

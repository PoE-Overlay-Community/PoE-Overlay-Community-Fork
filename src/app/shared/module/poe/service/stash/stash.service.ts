import { Injectable } from '@angular/core'
import { WindowService } from '@app/service'
import {
    ClipboardService,
    KeyboardService,
    KeyCode,
    MouseService,
    ShortcutService
} from '@app/service/input'
import { Point } from '@app/type'
import { UserSettings } from '@layout/type'
import { forkJoin, Observable, of, Subject, Subscription } from 'rxjs'
import { concatAll, delay, flatMap, map, tap } from 'rxjs/operators'
import { StashProvider } from '../../provider/stash.provider'
import { CacheExpirationType, Currency, PoEAccount } from '../../type'
import { PoEStashTab, PoEStashTabItem, StashTabsToSearch } from '../../type/stash.type'
import { StashGridType } from '../../type/trade-companion.type'
import { PoEAccountService } from '../account/account.service'
import { BaseItemTypesService } from '../base-item-types/base-item-types.service'
import { ContextService } from '../context.service'

export enum StashNavigationDirection {
  Left,
  Right,
}

export enum StashPriceTagType {
  Exact = '~price',
  Negotiable = '~b/o',
}

const GAME_HEIGHT_TO_STASH_WIDTH_RATIO = 1.622

export interface StashPriceTag {
  amount: number
  currency: Currency
  type?: StashPriceTagType
  count?: number
}

@Injectable({
  providedIn: 'root',
})
export class StashService {
  public get defaultStashTabInfoCacheExpiration(): CacheExpirationType {
    return this.stashProvider.defaultTabInfoCacheExpiration
  }

  public get defaultStashTabContentCacheExpiration(): CacheExpirationType {
    return this.stashProvider.defaultTabContentCacheExpiration
  }

  public readonly stashTabContentUpdated$ = new Subject<void>()

  private accountSub: Subscription
  private stashTabInfoInterval: NodeJS.Timeout
  private stashTabContentInterval: NodeJS.Timeout

  private settings: UserSettings

  private stashTabProviders: StashTabsToSearch[] = []

  constructor(
    private readonly keyboard: KeyboardService,
    private readonly shortcut: ShortcutService,
    private readonly mouse: MouseService,
    private readonly window: WindowService,
    private readonly clipboard: ClipboardService,
    private readonly stashProvider: StashProvider,
    private readonly accountService: PoEAccountService,
    private readonly context: ContextService,
    private readonly baseItemTypesService: BaseItemTypesService,
  ) {
  }

  public register(settings: UserSettings): void {
    this.settings = settings

    this.accountSub = this.accountService.subscribe((account) => this.onAccountChange(account))

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
    const account = this.accountService.get()
    if (account.loggedIn) {
      const context = this.context.get()
      return this.stashProvider.provideTabInfo(account.name, context.leagueId, context.language).pipe(map((stashTabs) => {
        return stashTabs.filter((stashTab) => predicate(stashTab))
      }))
    } else {
      return of([])
    }
  }

  public getStashTabContents(stashTabs: PoEStashTab[]): Observable<PoEStashTabItem[]> {
    const account = this.accountService.get()
    if (account.loggedIn) {
      const context = this.context.get()

      return forkJoin(
        stashTabs.map((stashTab, i) =>
          of(stashTab).pipe(
            // Delay each stash tab to ensure we don't hit rate limits
            delay(50 * i),
            flatMap(stashTab => this.stashProvider.provideTabsContent(stashTab, account.name, context.leagueId, context.language, this.settings?.stashTabContentCacheExpiration))
          )
        )
      ).pipe(
        map(x => [].concat(...x) as PoEStashTabItem[])
      )
    } else {
      return of([])
    }
  }

  public getStashGridType(stashName: string): Observable<StashGridType> {
    const account = this.accountService.get()
    if (account.loggedIn) {
      const context = this.context.get()
      return this.stashProvider.provideTabInfo(account.name, context.leagueId, context.language).pipe(map((stashTabs) => {
        const stashTab = stashTabs.find((x) => x.name === stashName)
        if (stashTab) {
          return stashTab.stashGridType
        }
        return StashGridType.Normal
      }))
    } else {
      return of(StashGridType.Normal)
    }
  }

  public hovering(point?: Point): boolean {
    point = point || this.mouse.position()
    const gameBounds = this.window.gameBounds.value

    const stashWidth = Math.round(gameBounds.height / GAME_HEIGHT_TO_STASH_WIDTH_RATIO)
    const relativePointX = point.x - gameBounds.x

    return relativePointX >= 0 && relativePointX <= stashWidth
  }

  public highlight(term: string): Observable<void> {
    const text = this.clipboard.readText()
    this.clipboard.writeText(`"${term}"`)

    this.keyboard.setKeyboardDelay(1)
    this.keyboard.keyToggle(KeyCode.VK_LMENU, false)
    this.keyboard.keyToggle(KeyCode.VK_RMENU, false)

    this.keyboard.setKeyboardDelay(15)
    return of(null).pipe(
      tap(() => this.shortcut.disableAllByAccelerator('CmdOrCtrl + F')),
      tap(() => this.keyboard.keyTap(KeyCode.VK_KEY_F, ['control'])),
      delay(175),
      tap(() => this.keyboard.keyTap(KeyCode.VK_KEY_V, ['control'])),
      tap(() => this.shortcut.enableAllByAccelerator('CmdOrCtrl + F')),
      delay(75),
      tap(() => this.clipboard.writeText(text))
    )
  }

  public navigate(dir: StashNavigationDirection): void {
    this.keyboard.setKeyboardDelay(5)
    this.keyboard.keyTap(dir === StashNavigationDirection.Left ? KeyCode.VK_LEFT : KeyCode.VK_RIGHT)
  }

  public copyPrice(tag: StashPriceTag): void {
    this.clipboard.writeText(
      `${tag.type} ${tag.count ? `${tag.amount}/${tag.count}` : tag.amount} ${tag.currency.id}`
    )
  }

  private periodicStashTabInfoUpdate(cacheExpiration?: CacheExpirationType) {
    const account = this.accountService.get()
    if (account.loggedIn) {
      const context = this.context.get()
      this.stashProvider.provideTabInfo(account.name, context.leagueId, context.language, cacheExpiration || this.settings?.stashTabInfoCacheExpiration).subscribe()
      this.tryStartPeriodicUpdate()
    }
  }

  private periodicStashContentUpdate(cacheExpiration?: CacheExpirationType) {
    const account = this.accountService.get()
    if (account.loggedIn) {
      const context = this.context.get()
      const providers = this.stashTabProviders.map((provider) => provider.getStashTabsToSearch())
      forkJoin(providers).pipe(
        concatAll(),
        flatMap((stashTabs) =>
          forkJoin(
            stashTabs.map((stashTab, i) =>
              of(stashTab).pipe(
                // Delay each stash tab to ensure we don't hit rate limits
                delay(50 * i),
                flatMap(stashTab => this.stashProvider.provideTabsContent(stashTab, account.name, context.leagueId, context.language, cacheExpiration || this.settings?.stashTabContentCacheExpiration))
              )
            )
          ).pipe(
            map(x => [].concat(...x) as PoEStashTabItem[])
          )
        )
      ).subscribe(null, null, () => this.stashTabContentUpdated$.next())
      this.tryStartPeriodicUpdate()
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

  private onAccountChange(account: PoEAccount) {
    if (account.loggedIn) {
      this.periodicStashTabInfoUpdate(CacheExpirationType.Instant)
      this.periodicStashContentUpdate(CacheExpirationType.Instant)
    } else {
      this.tryStopPeriodicUpdate()
    }
  }
}

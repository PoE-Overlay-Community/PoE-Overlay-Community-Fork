import { Injectable } from '@angular/core'
import { ElectronService, WindowService } from '@app/service'
import {
    ClipboardService,
    KeyboardService,
    KeyCode,
    MouseService,
    ShortcutService
} from '@app/service/input'
import { Point } from '@app/type'
import { UserSettings } from '@layout/type'
import { BehaviorSubject, forkJoin, Observable, of, Subject } from 'rxjs'
import { concatAll, delay, flatMap, map, tap } from 'rxjs/operators'
import { StashProvider } from '../../provider/stash.provider'
import { CacheExpirationType, Currency } from '../../type'
import { StashGridType, StashGridUserSettings } from '../../type/stash-grid.type'
import { PoEStashTab, PoEStashTabItem, StashTabsToSearch } from '../../type/stash.type'
import { PoEAccountService } from '../account/account.service'
import { ContextService } from '../context.service'
import { STASH_PERIODIC_UPDATE_ACTIVE_CHANGED, STASH_TAB_INFO_CHANGED } from './stash-thread.service'

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

  public readonly stashTabContentPeriodicUpdateActiveChanged$ = new BehaviorSubject<boolean>(false)
  public readonly stashTabContentUpdated$ = new Subject<void>()

  private scopedStashTabInfoChangedEventHandler
  private scopedStashPeriodicUpdateActiveChangedEventHandler

  private settings: StashGridUserSettings

  private stashTabProviders: StashTabsToSearch[] = []

  constructor(
    private readonly electronService: ElectronService,
    private readonly keyboard: KeyboardService,
    private readonly shortcut: ShortcutService,
    private readonly mouse: MouseService,
    private readonly window: WindowService,
    private readonly clipboard: ClipboardService,
    private readonly stashProvider: StashProvider,
    private readonly accountService: PoEAccountService,
    private readonly context: ContextService,
  ) {
  }

  public register(settings: UserSettings): void {
    this.settings = settings as StashGridUserSettings

    // Start listening to 'stash tab info' updates from the stash thread
    if (!this.scopedStashTabInfoChangedEventHandler) {
      this.scopedStashTabInfoChangedEventHandler = () => this.updateStashTabInfo()

      this.electronService.onMain(STASH_TAB_INFO_CHANGED, this.scopedStashTabInfoChangedEventHandler)
    }

    // Start listening to 'stash periodic update active changed' updates from the stash thread
    if (!this.scopedStashPeriodicUpdateActiveChangedEventHandler) {
      this.scopedStashPeriodicUpdateActiveChangedEventHandler = (_, periodicUpdateActive: boolean) => {
        this.stashTabContentPeriodicUpdateActiveChanged$.next(periodicUpdateActive)
        // The threaded update has finished -> update our local data
        if (!periodicUpdateActive) {
          this.updateStashContent()
        }
      }

      this.electronService.onMain(STASH_PERIODIC_UPDATE_ACTIVE_CHANGED, this.scopedStashPeriodicUpdateActiveChangedEventHandler)
    }

    this.stashTabContentPeriodicUpdateActiveChanged$.next(true)
  }

  public unregister(): void {
    if (this.scopedStashTabInfoChangedEventHandler) {
      this.electronService.removeMainListener(STASH_TAB_INFO_CHANGED, this.scopedStashTabInfoChangedEventHandler)
      this.scopedStashTabInfoChangedEventHandler = null
    }
    if (this.scopedStashPeriodicUpdateActiveChangedEventHandler) {
      this.electronService.removeMainListener(STASH_PERIODIC_UPDATE_ACTIVE_CHANGED, this.scopedStashPeriodicUpdateActiveChangedEventHandler)
      this.scopedStashPeriodicUpdateActiveChangedEventHandler = null
    }

    this.stashTabContentPeriodicUpdateActiveChanged$.next(false)
  }

  public registerStashTabToSearch(provider: StashTabsToSearch): void {
    this.stashTabProviders.push(provider)
  }

  public unregisterStashTabToSearch(provider: StashTabsToSearch): void {
    this.stashTabProviders = this.stashTabProviders.filter((x) => x !== provider)
  }

  public forceUpdateTabInfo(): void {
    this.updateStashTabInfo(CacheExpirationType.FiveSeconds)
  }

  public forceUpdateTabContent(): void {
    this.updateStashContent(CacheExpirationType.FiveSeconds)
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

  public getStashTabContents(stashTabs: PoEStashTab[], cacheExpiration?: CacheExpirationType): Observable<PoEStashTabItem[]> {
    if (stashTabs.length === 0) {
      return of([])
    }
    const account = this.accountService.get()
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

  public highlight(term: string, unquotedTerm?: string): Observable<void> {
    const text = this.clipboard.readText()
    this.clipboard.writeText(`"${term}"${(unquotedTerm) ? ` ${unquotedTerm}` : ``}`)

    this.keyboard.setKeyboardDelay(1)
    this.keyboard.keyToggle(KeyCode.VK_LMENU, false)
    this.keyboard.keyToggle(KeyCode.VK_RMENU, false)

    this.keyboard.setKeyboardDelay(15)
    return of(null).pipe(
      tap(() => this.shortcut.disableAllByAccelerator('CmdOrCtrl + F')),
      tap(() => this.keyboard.keyTap(KeyCode.VK_KEY_F, ['control'])),
      delay(175),
      tap(() => this.keyboard.keyTap(KeyCode.VK_KEY_V, ['control'])),
      tap(() => this.keyboard.keyTap(KeyCode.VK_RETURN)),
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

  private updateStashTabInfo(cacheExpiration?: CacheExpirationType): void {
    const account = this.accountService.get()
    if (account.loggedIn) {
      const context = this.context.get()
      this.stashProvider.provideTabInfo(account.name, context.leagueId, context.language, cacheExpiration || this.settings?.stashTabInfoCacheExpiration).subscribe()
    }
  }

  private updateStashContent(cacheExpiration?: CacheExpirationType): void {
    const account = this.accountService.get()
    if (account.loggedIn && this.stashTabProviders.length > 0) {
      this.stashTabContentPeriodicUpdateActiveChanged$.next(true)
      const providers = this.stashTabProviders.map((provider) => provider.getStashTabsToSearch())
      forkJoin(providers).pipe(
        concatAll(),
        flatMap((stashTabs) => this.getStashTabContents(stashTabs, cacheExpiration))
      ).subscribe(null, null, () => {
        this.stashTabContentUpdated$.next()
        this.stashTabContentPeriodicUpdateActiveChanged$.next(false)
      })
    }
  }
}

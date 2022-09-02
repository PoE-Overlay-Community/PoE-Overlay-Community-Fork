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
import { Observable, of, Subscription } from 'rxjs'
import { delay, map, tap } from 'rxjs/operators'
import { StashProvider } from '../../provider/stash.provider'
import { CacheExpirationType, Currency, PoEAccount } from '../../type'
import { StashGridType } from '../../type/trade-companion.type'
import { PoEAccountService } from '../account/account.service'
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
  public get defaultStashCacheExpiration(): CacheExpirationType {
    return this.stashProvider.defaultCacheExpiration
  }

  private accountSub: Subscription
  private stashInterval: NodeJS.Timeout

  private settings: UserSettings

  constructor(
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
    this.settings = settings

    this.accountSub = this.accountService.subscribe((account) => this.onAccountChange(account))

    this.periodicStashUpdate()
  }

  public unregister(): void {
    this.tryStopPeriodicUpdate()
    if (this.accountSub) {
      this.accountSub.unsubscribe()
      this.accountSub = null
    }
  }

  public forceUpdate(): void {
    this.periodicStashUpdate(CacheExpirationType.OneMin)
  }

  public getStashGridType(stashName: string): Observable<StashGridType> {
    const account = this.accountService.get()
    if (account.loggedIn) {
      const context = this.context.get()
      return this.stashProvider.provide(account.name, context.leagueId, context.language).pipe(map((stashTabs) => {
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

  private periodicStashUpdate(cacheExpiration?: CacheExpirationType) {
    const account = this.accountService.get()
    if (account.loggedIn) {
      const context = this.context.get()
      this.stashProvider.provide(account.name, context.leagueId, context.language, cacheExpiration || this.settings?.stashCacheExpiration).subscribe()
      this.tryStartPeriodicUpdate()
    }
  }

  private tryStartPeriodicUpdate(): void {
    if (!this.stashInterval && this.settings && (!this.settings.stashCacheExpiration || this.settings.stashCacheExpiration !== CacheExpirationType.Never)) {
      this.stashInterval = setInterval(() => this.periodicStashUpdate(), (this.settings.stashCacheExpiration || this.stashProvider.defaultCacheExpiration) + 10)
    }
  }

  private tryStopPeriodicUpdate(): void {
    if (this.stashInterval) {
      clearInterval(this.stashInterval)
      this.stashInterval = null
    }
  }

  private onAccountChange(account: PoEAccount) {
    if (account.loggedIn) {
      const context = this.context.get()
      this.stashProvider.provide(account.name, context.leagueId, context.language, CacheExpirationType.Instant).subscribe()
      this.tryStartPeriodicUpdate()
    } else {
      this.tryStopPeriodicUpdate()
    }
  }
}

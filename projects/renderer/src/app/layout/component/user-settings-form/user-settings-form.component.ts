import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core'
import { EnumValues } from '@app/class'
import { AppService, AppTranslateService, WindowService } from '@app/service'
import { UiLanguage } from '@app/type'
import { UserSettings } from '@layout/type'
import { LeaguesService, StashService } from '@shared/module/poe/service'
import { PoEAccountService } from '@shared/module/poe/service/account/account.service'
import { CacheExpirationType, Language, League, PoEAccount, PoECharacter } from '@shared/module/poe/type'
import { BehaviorSubject, Observable, Subscription } from 'rxjs'
import { map } from 'rxjs/operators'

interface UpdateInterval {
  name: string
  value: number
}

@Component({
  selector: 'app-user-settings-form',
  templateUrl: './user-settings-form.component.html',
  styleUrls: ['./user-settings-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserSettingsFormComponent implements OnInit, OnDestroy {
  public languages = new EnumValues(Language)
  public uiLanguages = new EnumValues(UiLanguage)
  public readonly updateIntervals: UpdateInterval[] = [
    {
      name: 'one-min',
      value: CacheExpirationType.OneMin
    },
    {
      name: 'two-min',
      value: CacheExpirationType.TwoMin
    },
    {
      name: 'three-min',
      value: CacheExpirationType.ThreeMin
    },
    {
      name: 'four-min',
      value: CacheExpirationType.FourMin
    },
    {
      name: 'five-min',
      value: CacheExpirationType.FiveMin
    },
    {
      name: 'ten-min',
      value: CacheExpirationType.TenMin
    },
    {
      name: 'fifteen-min',
      value: CacheExpirationType.FifteenMin
    },
    {
      name: 'half-hour',
      value: CacheExpirationType.HalfHour
    },
    {
      name: 'one-hour',
      value: CacheExpirationType.OneHour
    },
    {
      name: 'one-day',
      value: CacheExpirationType.OneDay
    },
    {
      name: 'never',
      value: CacheExpirationType.Never
    },
  ]

  public leagues$ = new BehaviorSubject<League[]>([])
  public autoLaunchEnabled$: Observable<boolean>
  public downloadAvailable$: Observable<boolean>

  public account$ = new BehaviorSubject<PoEAccount>({
    loggedIn: false,
  })
  public activeCharacter$ = new BehaviorSubject<PoECharacter>({
    name: 'N/A'
  })
  public characterLeagues$ = new BehaviorSubject<string[]>([])

  public defaultCharacterUpdateInterval: UpdateInterval
  public defaultStashTabInfoUpdateInterval: UpdateInterval
  public defaultStashTabContentUpdateInterval: UpdateInterval

  @Input()
  public settings: UserSettings

  public displayWithOpacity = (value: number) => `${Math.round(value * 100)}%`

  private accountSub: Subscription

  constructor(
    private readonly ref: ChangeDetectorRef,
    private readonly leagues: LeaguesService,
    private readonly app: AppService,
    private readonly translate: AppTranslateService,
    private readonly window: WindowService,
    private readonly accountService: PoEAccountService,
    private readonly stashService: StashService,
  ) {
    this.defaultCharacterUpdateInterval = this.updateIntervals.find((x) => x.value === this.accountService.defaultCharacterCacheExpiration)
    this.defaultStashTabInfoUpdateInterval = this.updateIntervals.find((x) => x.value === this.stashService.defaultStashTabInfoCacheExpiration)
    this.defaultStashTabContentUpdateInterval = this.updateIntervals.find((x) => x.value === this.stashService.defaultStashTabContentCacheExpiration)
  }

  public ngOnInit(): void {
    if (this.settings.language) {
      this.updateAccount()
    }
    this.autoLaunchEnabled$ = this.app.isAutoLaunchEnabled()
  }

  public ngOnDestroy(): void {
    this.accountSub?.unsubscribe()
  }

  public onAutoLaunchChange(enabled: boolean): void {
    this.autoLaunchEnabled$ = this.app
      .updateAutoLaunchEnabled(enabled)
      .pipe(map((success) => (success ? enabled : !enabled)))
  }

  public onLanguageChange(): void {
    this.updateAccount()
  }

  public onForceRefreshLeaguesClick(): void {
    this.updateLeagues(true)
  }

  public onUiLanguageChange(): void {
    this.translate.use(this.settings.uiLanguage)
  }

  public onZoomChange(): void {
    this.window.setZoom(this.settings.zoom / 100)
  }

  public relaunchApp(): void {
    this.app.relaunch()
  }

  public exitApp(): void {
    this.app.quit()
  }

  public onLoginClick(): void {
    this.accountService.login(this.settings.language).subscribe((account) => {
      this.onAccountChanged(account, true)
      this.window.focus()
    })
  }

  public onLogoutClick(): void {
    this.accountService.logout(this.settings.language).subscribe((account) => this.onAccountChanged(account, true))
  }

  public onForceRefreshCharactersClick(): void {
    this.accountService.forceUpdateCharacters()
  }

  public onForceRefreshStashInfoClick(): void {
    this.stashService.forceUpdateTabInfo()
  }

  public onForceRefreshStashContentClick(): void {
    this.stashService.forceUpdateTabContent()
  }

  public getActiveCharacter(): PoECharacter {
    const activeCharacterName = this.settings.activeCharacterName
    if (activeCharacterName) {
      return this.account$.value?.characters?.find((x) => x.name === activeCharacterName)
    }
    return this.activeCharacter$.value
  }

  public getCharacterInLeague(characters: PoECharacter[], leagueId: string): PoECharacter[] {
    return characters.filter((x) => x.leagueId === leagueId)
  }

  public getCharacterSelectLabel(character: PoECharacter): string {
    return `${character.name} (${this.translate.get('settings.abbr-level')}: ${character.level})`
  }

  public getDefaultIntervalLabel(interval: UpdateInterval): string {
    return `${this.translate.get('settings.update-intervals.default')} (${this.translate.get(`settings.update-intervals.${interval.name}`)})`
  }

  private updateLeagues(forceRefresh: boolean = false): void {
    this.leagues.getLeagues(this.settings.language, forceRefresh ? CacheExpirationType.FiveSeconds : CacheExpirationType.OneHour).subscribe((leagues) => this.onLeaguesChanged(leagues))
  }

  private updateAccount(): void {
    if (!this.accountSub) {
      this.accountSub = this.accountService.subscribe((account) => this.onAccountChanged(account))
    }
    this.accountService.getAsync(this.settings.language).subscribe((account) => this.onAccountChanged(account))
  }

  private onLeaguesChanged(leagues: League[]) {
    const selectedLeague = leagues.find((league) => league.id === this.settings.leagueId)
    if (!selectedLeague) {
      this.settings.leagueId = leagues[0].id
    }
    this.leagues$.next(leagues)
  }

  private onAccountChanged(account: PoEAccount, forceRefreshLeagues: boolean = false) {
    const current = this.account$.value
    this.account$.next(account)
    if (current.name !== account.name) {
      if (forceRefreshLeagues) {
        this.leagues.getLeagues(this.settings.language, CacheExpirationType.Instant).subscribe((leagues) => this.onLeaguesChanged(leagues))
      } else {
        this.updateLeagues()
      }
    }
    if (account.characters) {
      const activeCharacter = account.characters.find(x => x.lastActive)
      if (activeCharacter) {
        this.activeCharacter$.next(activeCharacter)
      }
      this.characterLeagues$.next([...new Set(account.characters.map((x) => x.leagueId))])
    }
    this.ref.detectChanges()
  }
}

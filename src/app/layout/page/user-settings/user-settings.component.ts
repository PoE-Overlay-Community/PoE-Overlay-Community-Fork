import { HostListener, OnDestroy } from '@angular/core'
import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core'
import { AppTranslateService, WindowService } from '@app/service'
import { FEATURE_MODULES } from '@app/token'
import { FeatureModule } from '@app/type'
import { ContextService } from '@shared/module/poe/service'
import { BehaviorSubject, Observable, of } from 'rxjs'
import { catchError, map } from 'rxjs/operators'
import { PoEAccountService } from '../../../shared/module/poe/service/account/account.service'
import { UserSettingsFeatureContainerComponent } from '../../component'
import { UserSettingsService } from '../../service'
import { UserSettings, UserSettingsFeature } from '../../type'

@Component({
  selector: 'app-user-settings',
  styleUrls: ['./user-settings.component.scss'],
  templateUrl: './user-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserSettingsComponent implements OnInit, OnDestroy {
  public init$ = new BehaviorSubject<boolean>(false)

  public settings: UserSettings
  public features: UserSettingsFeature[]

  @ViewChildren(UserSettingsFeatureContainerComponent)
  public containers: QueryList<UserSettingsFeatureContainerComponent>

  constructor(
    @Inject(FEATURE_MODULES)
    private readonly modules: FeatureModule[],
    private readonly settingsService: UserSettingsService,
    private readonly window: WindowService,
    private readonly context: ContextService,
    private readonly translate: AppTranslateService,
    private readonly accountService: PoEAccountService,
  ) {
  }

  @HostListener('window:beforeunload', [])
  public onWindowBeforeUnload(): void {
    this.reset()
  }

  public ngOnInit(): void {
    this.createTitlebar()
    this.init()
  }

  public ngOnDestroy(): void {
    this.reset()
  }

  public onSelectedIndexChange(index: number): void {
    const containerIndex = index - 1
    const container = this.containers.toArray()[containerIndex]
    if (container) {
      container.instance.load()
    }
  }

  public onSave(): void {
    this.save().subscribe(() => {
      this.window.close()
    })
  }

  private createTitlebar(): void {
    const { Titlebar, Color } = window.require('custom-electron-titlebar')
    const titlebar = new Titlebar({
      backgroundColor: Color.fromHex('#7f7f7f'),
      menu: null,
    })

    titlebar.on(
      'before-close',
      () => new Promise((resolve, reject) => this.save().subscribe(resolve, reject))
    )

    titlebar.updateTitle('PoE Overlay - Settings')
  }

  private init(): void {
    this.settingsService.init(this.modules).subscribe((settings) => {
      this.translate.use(settings.uiLanguage)
      this.window.setZoom(settings.zoom / 100)

      const { language, gameLanguage, leagueId } = settings
      this.context.init({ language, gameLanguage, leagueId }).subscribe(() => {
        this.accountService.register(settings).subscribe(() => {
          this.settings = settings
          this.features = [...this.settingsService.features()].sort(
            (a, b) => b.visualPriority - a.visualPriority
          )

          this.init$.next(true)
        })
      })
    })
  }

  private reset(): void {
    this.accountService.unregister()
  }

  private save(): Observable<boolean> {
    if (this.init$.value) {
      this.translate.use(this.settings.uiLanguage)
      this.window.setZoom(this.settings.zoom / 100)

      const { language, gameLanguage, leagueId } = this.settings
      this.context.update({ language, gameLanguage, leagueId })

      return this.settingsService.save(this.settings).pipe(
        map(() => true),
        catchError(() => of(false))
      )
    }
    return of(true)
  }
}

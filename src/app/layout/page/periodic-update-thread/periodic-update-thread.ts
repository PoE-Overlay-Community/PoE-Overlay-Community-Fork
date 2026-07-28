import {
    ChangeDetectionStrategy,
    Component,
    HostListener,
    Inject,
    OnDestroy,
    OnInit
} from '@angular/core'
import { AppTranslateService, ElectronService, WindowService } from '@app/service'
import { FEATURE_MODULES } from '@app/token'
import { FeatureModule } from '@app/type'
import { UserSettingsService } from '@layout/service'
import { ContextService } from '@shared/module/poe/service'
import { PoEAccountThreadService } from '@shared/module/poe/service/account/account-thread.service'
import { StashThreadService } from '@shared/module/poe/service/stash/stash-thread.service'
import { VendorRecipeThreadService } from '@shared/module/poe/service/vendor-recipe/vendor-recipe-thread.service'

export const THREAD_AVAILABLE = 'thread-available'
export const THREAD_PAUSE = 'thread-pause'
export const SETTINGS_CHANGED = 'settings-changed'

@Component({
  selector: 'app-periodic-update-thread',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PeriodicUpdateThreadComponent implements OnInit, OnDestroy {

  constructor(
    @Inject(FEATURE_MODULES)
    private readonly modules: FeatureModule[],
    private readonly settingsService: UserSettingsService,
    private readonly context: ContextService,
    private readonly translate: AppTranslateService,
    private readonly accountThreadService: PoEAccountThreadService,
    private readonly stashThreadService: StashThreadService,
    private readonly vendorRecipeThreadService: VendorRecipeThreadService,
    private readonly electronService: ElectronService,
    private readonly window: WindowService,
  ) {
    this.electronService.onMain(THREAD_PAUSE, () => this.reset())
    this.electronService.onMain(SETTINGS_CHANGED, () => this.init())
  }

  @HostListener('window:beforeunload', [])
  public onWindowBeforeUnload(): void {
    this.reset()
    this.window.removeAllListeners()
  }

  public ngOnInit(): void {
    console.log('=== Periodic Thread ===')
    this.init()
  }

  public ngOnDestroy(): void {
    this.reset()
  }

  private init(): void {
    this.reset()
    this.settingsService.init(this.modules).subscribe((settings) => {
      this.translate.use(settings.uiLanguage)

      const { language, gameLanguage, leagueId } = settings
      this.context.init({ language, gameLanguage, leagueId }).subscribe(() => {
        this.accountThreadService.register(settings).subscribe(() => {
          this.stashThreadService.register(settings)
          this.vendorRecipeThreadService.register(settings)

          this.electronService.send(THREAD_AVAILABLE)
        })
      })
    })
  }

  private reset(): void {
    this.vendorRecipeThreadService.unregister()
    this.stashThreadService.unregister()
    this.accountThreadService.unregister()
  }
}

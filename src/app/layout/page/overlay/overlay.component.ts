import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  Inject,
  OnDestroy,
  OnInit,
} from '@angular/core'
import { AppService, AppTranslateService, RendererService, WindowService } from '@app/service'
import { DialogRefService } from '@app/service/dialog'
import { ShortcutService } from '@app/service/input'
import { FEATURE_MODULES } from '@app/token'
import { AppUpdateState, FeatureModule, Rectangle, VisibleFlag } from '@app/type'
import { SnackBarService } from '@shared/module/material/service'
import { ContextService, StashService } from '@shared/module/poe/service'
import { TradeCompanionStashGridService } from '@shared/module/poe/service/trade-companion/trade-companion-stash-grid.service'
import { Context } from '@shared/module/poe/type'
import { BehaviorSubject, EMPTY, forkJoin, Observable, timer } from 'rxjs'
import { debounce, distinctUntilChanged, flatMap, map, tap } from 'rxjs/operators'
import { PoEAccountService } from '../../../shared/module/poe/service/account/account.service'
import { TradeNotificationsService } from '../../../shared/module/poe/service/trade-companion/trade-notifications.service'
import { TradeNotificationPanelShortcutRef } from '../../../shared/module/poe/type/trade-companion.type'
import { UserSettingsService } from '../../service'
import { UserSettings } from '../../type'

const OverlayCompRef = 'overlay-component'

@Component({
  selector: 'app-overlay',
  templateUrl: './overlay.component.html',
  styleUrls: ['./overlay.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverlayComponent implements OnInit, OnDestroy {
  private userSettingsOpen: Observable<void>

  public readonly version$ = new BehaviorSubject<string>('')
  public readonly userSettings$ = new BehaviorSubject<UserSettings>(null)
  public readonly gameOverlayBounds: BehaviorSubject<Rectangle>

  constructor(
    @Inject(FEATURE_MODULES)
    private readonly modules: FeatureModule[],
    private readonly userSettingsService: UserSettingsService,
    private readonly context: ContextService,
    private readonly app: AppService,
    private readonly translate: AppTranslateService,
    private readonly snackBar: SnackBarService,
    private readonly window: WindowService,
    private readonly renderer: RendererService,
    private readonly shortcut: ShortcutService,
    private readonly dialogRef: DialogRefService,
    private readonly stashGridService: TradeCompanionStashGridService,
    private readonly tradeNotificationsService: TradeNotificationsService,
    private readonly accountService: PoEAccountService,
    private readonly stashService: StashService,
  ) {
    this.gameOverlayBounds = new BehaviorSubject<Rectangle>(this.window.getOffsettedGameBounds())
    this.window.gameBounds.subscribe((_) => {
      this.gameOverlayBounds.next(this.window.getOffsettedGameBounds())
    })
  }

  @HostListener('window:beforeunload', [])
  public onWindowBeforeUnload(): void {
    this.reset()
    this.window.removeAllListeners()
  }

  public ngOnInit(): void {
    this.version$.next(this.app.version())
    this.initSettings()
    this.window.enableTransparencyMouseFix()
  }

  public ngOnDestroy(): void {
    this.window.disableTransparencyMouseFix(true)
    this.stashGridService.unregisterEvents()
    this.tradeNotificationsService.unregisterEvents()
    this.reset()
  }

  public openUserSettings(): void {
    if (!this.userSettingsOpen) {
      this.userSettingsOpen = this.renderer.open('user-settings')
      this.userSettingsOpen.pipe(flatMap(() => this.userSettingsService.get())).subscribe(
        (settings) => {
          this.userSettingsOpen = null

          this.translate.use(settings.uiLanguage)
          this.window.setZoom(settings.zoom / 100)
          this.context.update(this.getContext(settings))
          this.accountService.register(settings).subscribe(() => {
            this.app.updateAutoDownload(settings.autoDownload)
            this.register(settings)
            this.app.triggerVisibleChange()
          })
        },
        () => (this.userSettingsOpen = null)
      )
      this.reset()
    } else {
      this.renderer.restore('user-settings')
    }
  }

  private initSettings(): void {
    this.userSettingsService.init(this.modules).subscribe((settings) => {
      this.translate.use(settings.uiLanguage)
      this.window.setZoom(settings.zoom / 100)

      this.context.init(this.getContext(settings)).subscribe(() => {
        this.accountService.register(settings).subscribe(() => {
          this.registerEvents(settings)
          this.register(settings)
          this.registerVisibleChange()

          this.renderer.on('show-user-settings').subscribe(() => {
            this.openUserSettings()
          })
          this.renderer.on('reset-zoom').subscribe(() => {
            this.userSettingsService
              .update((x) => {
                x.zoom = 100
                return x
              })
              .subscribe((x) => {
                this.window.setZoom(x.zoom / 100)
              })
          })
        })
      })
    })
  }

  private registerEvents(settings: UserSettings): void {
    this.app.updateStateChange().subscribe((event) => {
      switch (event) {
        case AppUpdateState.Available:
          this.snackBar.info('app.update.available')
          break
        case AppUpdateState.Downloaded:
          this.snackBar.success('app.update.downloaded')
          break
        default:
          break
      }
    })
    this.app.registerEvents(settings.autoDownload)
    this.window.registerEvents()
    this.stashGridService.registerEvents()
    this.tradeNotificationsService.registerEvents()
  }

  private registerVisibleChange(): void {
    this.app
      .visibleChange()
      .pipe(
        tap((flag) => this.shortcut.check(flag)),
        map((flag) => flag !== VisibleFlag.None),
        debounce((show) => (show ? EMPTY : timer(1500))),
        distinctUntilChanged()
      )
      .subscribe((show) => {
        if (show) {
          this.window.show()
        } else {
          this.window.hide()
        }
      })
    this.app.triggerVisibleChange()
  }

  private reset(): void {
    this.dialogRef.reset()
    this.accountService.unregister()
    this.stashService.unregister()
    this.shortcut.removeAllByRef(OverlayCompRef)
    this.shortcut.removeAllByRef(TradeNotificationPanelShortcutRef)
  }

  private register(settings: UserSettings): void {
    this.registerFeatures(settings)
    this.registerSettings(settings)
    this.dialogRef.register()
    this.stashService.register(settings)

    this.userSettings$.next(settings)
  }

  private registerFeatures(settings: UserSettings): void {
    this.modules.forEach((mod) => {
      const features = mod.getFeatures(settings)
      features.forEach((feature) => {
        if (feature.accelerator) {
          this.shortcut
            .add(
              feature.accelerator,
              OverlayCompRef,
              !!feature.passive,
              VisibleFlag.Game,
              VisibleFlag.Overlay
            )
            .subscribe(() => {
              mod.run(feature.name, settings)
            })
        }
      })
    })
  }

  private registerSettings(settings: UserSettings): void {
    if (settings.openUserSettingsKeybinding) {
      this.shortcut
        .add(
          settings.openUserSettingsKeybinding,
          OverlayCompRef,
          false,
          VisibleFlag.Game,
          VisibleFlag.Overlay
        )
        .subscribe(() => this.openUserSettings())
    }
    if (settings.exitAppKeybinding) {
      this.shortcut
        .add(
          settings.exitAppKeybinding,
          OverlayCompRef,
          false,
          VisibleFlag.Game,
          VisibleFlag.Overlay
        )
        .subscribe(() => this.app.quit())
    }
  }

  private getContext(settings: UserSettings): Context {
    return {
      language: settings.language,
      leagueId: settings.leagueId,
    }
  }
}

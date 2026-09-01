import { Injectable, NgZone } from '@angular/core'
import { ElectronProvider } from '@app/provider'
import { ElectronService } from '@app/service'
import { AppUpdateState, VisibleFlag } from '@app/type/app.type'
import { ElectronAPI } from '@app/type/electron-api.type'
import { BehaviorSubject, Observable, Subject, combineLatest } from 'rxjs'
import { map } from 'rxjs/operators'
import { DialogRefService, DialogType } from './dialog/dialog-ref.service'

@Injectable({
  providedIn: 'root',
})
export class AppService {
  private readonly electronAPI: ElectronAPI

  private readonly activeChange$ = new BehaviorSubject<boolean>(false)
  private readonly focusChange$ = new BehaviorSubject<boolean>(false)

  private readonly updateState$ = new BehaviorSubject<AppUpdateState>(AppUpdateState.None)

  constructor(
    private readonly ngZone: NgZone,
    private readonly dialogRef: DialogRefService,
    private readonly electronService: ElectronService,
    electronProvider: ElectronProvider
  ) {
    this.electronAPI = electronProvider.provideElectronAPI()
  }

  public registerEvents(autoDownload: boolean): void {
    this.electronService.on('app', 'app-update-available', () => this.updateState$.next(AppUpdateState.Available))
    this.electronService.on('app', 'app-update-downloaded', () => this.updateState$.next(AppUpdateState.Downloaded))
    this.electronService.on('app', 'app-relaunch', () => this.relaunch())
    this.electronService.on('app', 'app-quit', () => this.quit())
    this.electronAPI.initDownload(autoDownload)
  }

  public updateAutoDownload(autoDownload: boolean): void {
    this.electronAPI.setAutoDownload(autoDownload)
  }

  public updateStateChange(): Observable<AppUpdateState> {
    return this.updateState$
  }

  public visibleChange(): Observable<VisibleFlag> {
    this.electronService.on('game', 'game-active-change', (_, arg) => {
      this.ngZone.run(() => this.activeChange$.next(arg))
    })
    this.electronAPI.sendGameActiveChange()

    this.electronService.on('window', 'window-focus', () => this.focusChange$.next(true))
    this.electronService.on('window', 'window-blur', () => this.focusChange$.next(false))

    return combineLatest([
      this.activeChange$,
      this.focusChange$,
      this.dialogRef.dialogsChange(),
    ]).pipe(
      map(([game, focus, dialogs]) => {
        let result = VisibleFlag.None
        if (game) {
          result |= VisibleFlag.Game
        }
        if (focus) {
          result |= VisibleFlag.Overlay
        }

        if (dialogs.length > 0) {
          const dialog = dialogs[dialogs.length - 1]
          switch (dialog.type) {
            case DialogType.Dialog:
              result |= VisibleFlag.Dialog
              break
            case DialogType.Browser:
              result |= VisibleFlag.Browser
              break
            default:
              break
          }
        }
        return result
      })
    )
  }

  public isAutoLaunchEnabled(): Observable<boolean> {
    const subject = new Subject<boolean>()
    this.electronService.once('app', 'app-auto-launch-enabled-result', (_, enabled) => {
      subject.next(enabled)
      subject.complete()
    })
    this.electronAPI.isAutoLaunchEnabled()
    return subject
  }

  public updateAutoLaunchEnabled(enabled: boolean): Observable<boolean> {
    const subject = new Subject<boolean>()
    this.electronService.once('app', 'app-auto-launch-change-result', (_, success) => {
      subject.next(success)
      subject.complete()
    })
    this.electronAPI.setAutoLaunchEnabled(enabled)
    return subject
  }

  public triggerVisibleChange(): void {
    this.activeChange$.next(this.activeChange$.value)
  }

  public version(): string {
    return this.electronAPI.getVersion()
  }

  public quit(): void {
    if (this.updateState$.value === AppUpdateState.Downloaded) {
      this.electronAPI.quitAndInstall(false)
    } else {
      this.electronAPI.exit()
    }
  }

  /**
   * Electron's suggested way of relaunching the application.
   *
   * https://www.electronjs.org/docs/api/app#apprelaunchoptions
   */
  public relaunch(): void {
    if (this.updateState$.value === AppUpdateState.Downloaded) {
      this.electronAPI.quitAndInstall(true)
    } else {
      this.electronAPI.relaunch()
    }
  }
}

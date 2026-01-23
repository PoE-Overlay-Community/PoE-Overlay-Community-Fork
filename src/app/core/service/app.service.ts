import { Injectable, NgZone } from '@angular/core'
import { ElectronProvider } from '@app/provider'
import { AppUpdateState, VisibleFlag } from '@app/type/app.type'
import { ElectronAPI } from '@app/type/electron-api.type'
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs'
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
    electronProvider: ElectronProvider
  ) {
    this.electronAPI = electronProvider.provideElectronAPI()
  }

  public registerEvents(autoDownload: boolean): void {
    this.electronAPI.on('app-update-available', () => {
      this.ngZone.run(() => this.updateState$.next(AppUpdateState.Available))
    })
    this.electronAPI.on('app-update-downloaded', () => {
      this.ngZone.run(() => this.updateState$.next(AppUpdateState.Downloaded))
    })
    this.electronAPI.on('app-relaunch', () => {
      this.ngZone.run(() => this.relaunch())
    })
    this.electronAPI.on('app-quit', () => {
      this.ngZone.run(() => this.quit())
    })
    this.electronAPI.initDownload(autoDownload)
  }

  public updateAutoDownload(autoDownload: boolean): void {
    this.electronAPI.setAutoDownload(autoDownload)
  }

  public updateStateChange(): Observable<AppUpdateState> {
    return this.updateState$
  }

  public visibleChange(): Observable<VisibleFlag> {
    this.electronAPI.on('game-active-change', (_, arg) => {
      this.ngZone.run(() => this.activeChange$.next(arg))
    })
    this.electronAPI.sendGameActiveChange()

    this.electronAPI.on('window-focus', () => this.ngZone.run(() => this.focusChange$.next(true)))
    this.electronAPI.on('window-blur', () => this.ngZone.run(() => this.focusChange$.next(false)))

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
    this.electronAPI.once('app-auto-launch-enabled-result', (_, enabled) => {
      this.ngZone.run(() => {
        subject.next(enabled)
        subject.complete()
      })
    })
    this.electronAPI.isAutoLaunchEnabled()
    return subject
  }

  public updateAutoLaunchEnabled(enabled: boolean): Observable<boolean> {
    const subject = new Subject<boolean>()
    this.electronAPI.once('app-auto-launch-change-result', (_, success) => {
      this.ngZone.run(() => {
        subject.next(success)
        subject.complete()
      })
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

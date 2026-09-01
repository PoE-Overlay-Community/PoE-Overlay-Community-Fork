import { Injectable } from '@angular/core'
import { ElectronProvider } from '@app/provider'
import { ElectronService, LoggerService } from '@app/service'
import { VisibleFlag } from '@app/type/app.type'
import { ElectronAPI } from '@app/type/electron-api.type'
import { Observable, Subject } from 'rxjs'

export interface Shortcut {
  accelerator: string
  ref: any
  actives: VisibleFlag[]
  callback: Subject<void>
  disabled: boolean
  isActive: boolean
}

interface ShortcutDict {
  [accelerator: string]: Shortcut[]
}

@Injectable({
  providedIn: 'root',
})
export class ShortcutService {
  private readonly electronAPI: ElectronAPI
  private readonly shortcuts: ShortcutDict = {}

  private lastFlag?: VisibleFlag

  constructor(
    private readonly logger: LoggerService,
    private readonly electronService: ElectronService,
    electronProvider: ElectronProvider) {
    this.electronAPI = electronProvider.provideElectronAPI()
  }

  public add(
    accelerator: string,
    ref: any,
    ...actives: VisibleFlag[]
  ): Observable<void> {
    if (!this.shortcuts[accelerator]) {
      this.shortcuts[accelerator] = []
    }

    const shortcut: Shortcut = {
      accelerator,
      ref,
      actives,
      callback: new Subject<void>(),
      disabled: false,
      isActive: false,
    }
    this.shortcuts[accelerator].unshift(shortcut)

    this.check(this.lastFlag)

    return shortcut.callback
  }

  public remove(accelerator: string, ref: any): void {
    const shortcuts = this.shortcuts[accelerator]
    if (shortcuts) {
      const index = shortcuts.findIndex((x) => x.ref === ref)
      if (index !== -1) {
        const shortcut = shortcuts[index]
        if (shortcut.isActive) {
          this.unregisterShortcut(shortcut)
        }
        shortcut.callback.complete()
        shortcuts.splice(index, 1)
        this.check(this.lastFlag)
      }
    }
  }

  public removeAllByRef(ref: any): void {
    for (const accelerator in this.shortcuts) {
      const shortcuts = this.shortcuts[accelerator]
      const activeShortcut = shortcuts.find((x) => x.isActive && x.ref === ref)
      if (activeShortcut) {
        this.unregisterShortcut(activeShortcut)
      }
      const removedShortcuts = shortcuts.filter((x) => x.ref === ref)
      this.shortcuts[accelerator] = shortcuts.filter((x) => x.ref !== ref)
      removedShortcuts.forEach((x) => x.callback.complete())
    }
    this.check(this.lastFlag)
  }

  public disableAllByAccelerator(accelerator: string): void {
    const shortcuts = this.shortcuts[accelerator]
    if (shortcuts) {
      shortcuts.forEach((shortcut) => (shortcut.disabled = true))
      this.check(this.lastFlag)
    }
  }

  public enableAllByAccelerator(accelerator: string): void {
    const shortcuts = this.shortcuts[accelerator]
    if (shortcuts) {
      shortcuts.forEach((shortcut) => (shortcut.disabled = false))
      this.check(this.lastFlag)
    }
  }

  public disableAllByRef(ref: any): void {
    for (const accelerator in this.shortcuts) {
      const shortcuts = this.shortcuts[accelerator]
      shortcuts.forEach((shortcut) => {
        if (shortcut.ref === ref) {
          shortcut.disabled = true
        }
      })
    }
    this.check(this.lastFlag)
  }

  public enableAllByRef(ref: any): void {
    for (const accelerator in this.shortcuts) {
      const shortcuts = this.shortcuts[accelerator]
      shortcuts.forEach((shortcut) => {
        if (shortcut.ref === ref) {
          shortcut.disabled = false
        }
      })
    }
    this.check(this.lastFlag)
  }

  public disable(accelerator: string, ref: any): void {
    const shortcuts = this.shortcuts[accelerator]
    if (shortcuts) {
      const index = shortcuts.findIndex((x) => x.ref === ref)
      if (index !== -1) {
        const shortcut = shortcuts[index]
        shortcut.disabled = true
        this.check(this.lastFlag)
      }
    }
  }

  public enable(accelerator: string, ref: any): void {
    const shortcuts = this.shortcuts[accelerator]
    if (shortcuts) {
      const index = shortcuts.findIndex((x) => x.ref === ref)
      if (index !== -1) {
        const activeIndex = shortcuts.findIndex((x) => x.isActive)
        const shortcut = shortcuts[index]
        shortcut.disabled = false
        if (activeIndex !== -1 && index < activeIndex) {
          this.unregisterShortcut(shortcuts[activeIndex])
          this.check(this.lastFlag)
        }
      }
    }
  }

  public check(flag: VisibleFlag): void {
    this.lastFlag = flag
    for (const accelerator in this.shortcuts) {
      const activeShortcut = this.shortcuts[accelerator].find((x) => x.isActive)
      if (
        activeShortcut &&
        (activeShortcut.disabled ||
          !activeShortcut.actives.some((filter) => (flag & filter) === filter))
      ) {
        this.unregisterShortcut(activeShortcut)
      }
      const nextShortcut = this.shortcuts[accelerator].find(
        (x) => !x.disabled && !x.isActive && x.actives.some((filter) => (flag & filter) === filter)
      )
      if (nextShortcut) {
        this.registerShortcut(nextShortcut)
      }
    }
  }

  public reset(): void {
    for (const accelerator in this.shortcuts) {
      const shortcuts = this.shortcuts[accelerator]
      if (shortcuts.length > 0) {
        const activeShortcut = shortcuts.find((x) => x.isActive)
        if (activeShortcut) {
          this.unregisterShortcut(activeShortcut)
        }
        this.shortcuts[accelerator] = []
        shortcuts.forEach((x) => x.callback.complete())
      }
    }
  }

  private registerShortcut(shortcut: Shortcut): void {
    if (shortcut.isActive) {
      this.logger.warn(`Shortcut '${shortcut.accelerator}' is already active! - Ignoring register call.`)
      return
    }
    shortcut.isActive = true
    this.electronService.on('shortcut', `shortcut-${shortcut.accelerator}`, () => shortcut.callback.next())
    this.electronAPI.registerGlobalShortcut(shortcut.accelerator)
  }

  private unregisterShortcut(shortcut: Shortcut): void {
    if (!shortcut.isActive) {
      this.logger.warn(`Shortcut '${shortcut.accelerator}' is inactive! - Ignoring unregister call.`)
      return
    }
    shortcut.isActive = false
    this.electronService.removeAllListeners('shortcut', `shortcut-${shortcut.accelerator}`)
    this.electronAPI.unregisterGlobalShortcut(shortcut.accelerator)
  }
}

import { Injectable, NgZone } from '@angular/core'
import { ElectronProvider, Remote } from '@app/provider'
import { VisibleFlag } from '@app/type/app.type'
import type { IpcRenderer } from 'electron' //renderer
import { Observable, Subject } from 'rxjs'

export interface Shortcut {
  accelerator: string
  ref: any
  passive: boolean
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
  private readonly ipcRenderer: IpcRenderer
  private readonly remote: Remote
  private readonly shortcuts: ShortcutDict = {}

  private lastFlag?: VisibleFlag

  constructor(private readonly ngZone: NgZone, electronProvider: ElectronProvider) {
    this.ipcRenderer = electronProvider.provideIpcRenderer()
    this.remote = electronProvider.provideRemote()
  }

  public add(
    accelerator: string,
    ref: any,
    passive: boolean = false,
    ...actives: VisibleFlag[]
  ): Observable<void> {
    if (!this.shortcuts[accelerator]) {
      this.shortcuts[accelerator] = []
    }

    const shortcut: Shortcut = {
      accelerator,
      ref,
      passive,
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
        (x) => !x.disabled && x.actives.some((filter) => (flag & filter) === filter)
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
    shortcut.isActive = true
    if (shortcut.passive) {
      this.ipcRenderer.on(`shortcut-${shortcut.accelerator}`, () => {
        this.ngZone.run(() => shortcut.callback.next())
      })
      this.ipcRenderer.sendSync('register-shortcut', shortcut.accelerator)
    } else {
      this.remote.globalShortcut.register(shortcut.accelerator, () => {
        this.ngZone.run(() => shortcut.callback.next())
      })
    }
  }

  private unregisterShortcut(shortcut: Shortcut): void {
    shortcut.isActive = false
    if (shortcut.passive) {
      this.ipcRenderer.removeAllListeners(`shortcut-${shortcut.accelerator}`)
      this.ipcRenderer.sendSync('unregister-shortcut', shortcut.accelerator)
    } else {
      this.remote.globalShortcut.unregister(shortcut.accelerator)
    }
  }
}

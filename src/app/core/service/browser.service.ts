import { Injectable } from '@angular/core'
import { ElectronProvider } from '@app/provider'
import { ElectronAPI } from '@app/type/electron-api.type'
import { Observable, Subject } from 'rxjs'
import { Dialog, DialogRefService, DialogType } from './dialog/dialog-ref.service'

@Injectable({
  providedIn: 'root',
})
export class BrowserService {
  private readonly electronAPI: ElectronAPI

  constructor(private readonly dialogRef: DialogRefService, electronProvider: ElectronProvider) {
    this.electronAPI = electronProvider.provideElectronAPI()
  }

  public retrieve(url: string): Observable<void> {
    const subject = new Subject<void>()

    const windowId = this.electronAPI.createBrowserWindow({
      show: false,
      useParent: true,
      webPreferences: {
        webSecurity: false,
      },
    })

    this.electronAPI.once('browser-window-did-finish-load', (_, id) => {
      if (id === windowId) {
        subject.next()
        subject.complete()
        this.electronAPI.closeBrowserWindow(windowId)
      }
    })

    this.electronAPI.loadUrlInBrowserWindow(windowId, url)
    return subject
  }

  public openAndWait(url: string, smallerWindow: boolean = false): Observable<void> {
    const subject = new Subject<void>()
    const [width, height] = this.electronAPI.windowGetSize()

    const windowId = this.electronAPI.createBrowserWindow({
      center: true,
      useParent: true,
      autoHideMenuBar: true,
      width: smallerWindow ? Math.round(Math.min(height * 1.3, width * 0.7)) : width,
      height: smallerWindow ? Math.round(height * 0.7) : height,
      backgroundColor: '#0F0F0F',
      show: false,
      webPreferences: {
        webSecurity: false,
      },
    })

    this.electronAPI.windowSetEnabled(false)

    this.electronAPI.once('browser-window-closed', (_, id) => {
      if (id === windowId) {
        this.electronAPI.windowSetEnabled(true)
        this.electronAPI.windowMoveTop()
        subject.next()
        subject.complete()
      }
    })

    this.electronAPI.once('browser-window-ready', (_, id) => {
      if (id === windowId) {
        const zoomFactor = this.electronAPI.getZoomFactor()
        this.electronAPI.send('set-browser-window-zoom', windowId, zoomFactor)
        this.electronAPI.send('show-browser-window', windowId)
      }
    })

    this.electronAPI.loadUrlInBrowserWindow(windowId, url)
    return subject
  }

  public open(url: string, external: boolean = false): void {
    if (external) {
      this.electronAPI.shellOpenExternal(url)
    } else {
      const [width, height] = this.electronAPI.windowGetSize()

      const windowId = this.electronAPI.createBrowserWindow({
        center: true,
        useParent: true,
        autoHideMenuBar: true,
        width: Math.round(Math.min(height * 1.3, width * 0.7)),
        height: Math.round(height * 0.7),
        backgroundColor: url.startsWith('file://') ? '#FCFCFC' : '#0F0F0F',
        show: false,
        webPreferences: {
          webSecurity: false,
        },
      })

      const dialog: Dialog = {
        close: () => this.electronAPI.closeBrowserWindow(windowId),
        type: DialogType.Browser,
      }

      this.electronAPI.windowSetEnabled(false)
      this.dialogRef.add(dialog)

      // Note: minimize, restore, maximize events are handled in the main process
      // For simplicity, we just handle the closed event here

      this.electronAPI.once('browser-window-closed', (_, id) => {
        if (id === windowId) {
          this.electronAPI.windowSetEnabled(true)
          this.dialogRef.remove(dialog)
          this.electronAPI.windowMoveTop()
        }
      })

      this.electronAPI.once('browser-window-ready', (_, id) => {
        if (id === windowId) {
          const zoomFactor = this.electronAPI.getZoomFactor()
          this.electronAPI.send('set-browser-window-zoom', windowId, zoomFactor)
          this.electronAPI.send('show-browser-window', windowId)
        }
      })

      this.electronAPI.loadUrlInBrowserWindow(windowId, url)
    }
  }
}

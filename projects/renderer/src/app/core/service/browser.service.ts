import { Injectable } from '@angular/core'
import { ElectronProvider, Remote } from '@app/provider'
import { environment } from '@env/environment'
import { Observable, Subject } from 'rxjs'
import { Dialog, DialogRefService, DialogType } from './dialog/dialog-ref.service'

const { BrowserWindow } = (window as any).remote as Remote;

@Injectable({
  providedIn: 'root',
})
export class BrowserService {
  private readonly electron: Remote

  constructor(private readonly dialogRef: DialogRefService, electronProvider: ElectronProvider) {
    this.electron = electronProvider.provideRemote()
  }

  public retrieve(url: string): Observable<void> {
    
    const parent = this.electron.getCurrentWindow()
    const subject = new Subject<void>()

    const win = new BrowserWindow({
      parent,
      show: false,
    })
    this.setupCookieSharing(win)
    win.webContents.once('did-finish-load', () => {
      subject.next()
      subject.complete()
      win.close()
    })
    win.loadURL(url)
  
    return subject
  }

  public openAndWait(url: string, smallerWindow: boolean = false): Observable<void> {
    const subject = new Subject<void>()
    const parent = this.electron.getCurrentWindow()
    const [width, height] = parent.getSize()

    const win = new BrowserWindow({
      center: true,
      parent,
      autoHideMenuBar: true,
      width: smallerWindow ? Math.round(Math.min(height * 1.3, width * 0.7)) : width,
      height: smallerWindow ? Math.round(height * 0.7) : height,
      backgroundColor: '#0F0F0F',
      show: false,
    })

    this.setupCookieSharing(win)

    parent.setEnabled(false)
    win.once('closed', () => {
      parent.setEnabled(true)
      parent.moveTop()
      subject.next()
      subject.complete()
    })
    win.once('ready-to-show', () => {
      win.webContents.zoomFactor = parent.webContents.zoomFactor
      win.show()
    })
    win.loadURL(url)

    return subject
  }

  public open(url: string, external: boolean = false): void {
    if (external) {
      this.electron.shell.openExternal(url)
    } else {
      const parent = this.electron.getCurrentWindow()
      const [width, height] = parent.getSize()

      const win = new BrowserWindow({
        center: true,
        parent,
        autoHideMenuBar: true,
        width: Math.round(Math.min(height * 1.3, width * 0.7)),
        height: Math.round(height * 0.7),
        backgroundColor: url.startsWith('file://') ? '#FCFCFC' : '#0F0F0F',
        show: false,
      })

      this.setupCookieSharing(win)

      const dialog: Dialog = {
        close: win.close.bind(win),
        type: DialogType.Browser,
      }

      parent.setEnabled(false)
      this.dialogRef.add(dialog)
      win.on('minimize', () => {
        parent.setEnabled(true)
        this.dialogRef.remove(dialog)
      })
      const restore = () => {
        parent.setEnabled(false)
        this.dialogRef.remove(dialog)
        this.dialogRef.add(dialog)
      }
      win.on('restore', () => restore())
      win.on('maximize', () => restore())
      win.once('closed', () => {
        parent.setEnabled(true)
        this.dialogRef.remove(dialog)
        parent.moveTop()
      })
      win.once('ready-to-show', () => {
        win.webContents.zoomFactor = parent.webContents.zoomFactor
        win.show()
      })
      win.loadURL(url)
    }
  }

  private setupCookieSharing(browserWindow: any) {
    browserWindow.webContents.session.webRequest.onHeadersReceived({
      urls: environment.cookieSharingUrls
    }, (details, next) => {
      const cookies = details.responseHeaders?.['set-cookie']
      if (cookies) {
        details.responseHeaders['set-cookie'] = cookies.map(cookie => {
          cookie = cookie
            .split(';')
            .map(x => x.trim())
            .filter(x =>
              !x.toLowerCase().startsWith('samesite') &&
              !x.toLowerCase().startsWith('secure'))
            .join('; ')

          return `${cookie}; SameSite=None; Secure`
        })
      }

      next({ responseHeaders: details.responseHeaders })
    })
  }
}

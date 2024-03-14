import { Injectable, NgZone } from '@angular/core'
import { ElectronProvider } from '@app/provider'
import type { IpcMain } from 'electron' //main
import type { IpcMainEvent, IpcRenderer, IpcRendererEvent } from 'electron' //renderer
import { from, Observable } from 'rxjs'
import { LoggerService } from './logger.service'

interface ScopedListener<T> {
  channel: string
  listener: (event: T, ...args: any[]) => void
  scopedListener: (event: T, ...args: any[]) => void
}

@Injectable({
  providedIn: 'root',
})
export class ElectronService {
  private readonly ipcMain: IpcMain
  private readonly ipcRenderer: IpcRenderer

  private readonly mainListeners: ScopedListener<IpcMainEvent>[] = []
  private readonly rendererListeners: ScopedListener<IpcRendererEvent>[] = []

  constructor(
    private readonly ngZone: NgZone,
    private readonly logger: LoggerService,
    electronProvider: ElectronProvider
  ) {
    this.ipcMain = electronProvider.provideIpcMain()
    this.ipcRenderer = electronProvider.provideIpcRenderer()
  }

  public onMain(channel: string, listener: (event: IpcMainEvent, ...args: any[]) => void): void {
    const scopedListener = (event: IpcMainEvent, ...args: any[]): void => {
      this.logger.log('electronService', `onMain(${channel})`)
      this.ngZone.run(() => listener(event, ...args))
    }
    this.mainListeners.push({ channel, listener, scopedListener })
    this.ipcMain.on(channel, scopedListener)
  }

  public removeMainListener(channel: string, listener: (event: IpcMainEvent, ...args: any[]) => void): void {
    const index = this.mainListeners.findIndex(x => x.channel === channel && x.listener === listener)
    if (index !== -1) {
      this.logger.log('electronService', `removeMainListener(${channel})`)
      const removedListener = this.mainListeners.splice(index, 1)[0]
      this.ipcMain.removeListener(channel, removedListener.scopedListener)
    }
  }

  public on(channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void): void {
    console.log('electron.service.on')
    const scopedListener = (event: IpcRendererEvent, ...args: any[]): void => {
      console.log('electron.service scoped listner', event)
      this.logger.log('electronService', `on(${channel})`)
      this.ngZone.run(() => listener(event, ...args))
    }
    this.rendererListeners.push({ channel, listener, scopedListener })
    this.ipcRenderer.on(channel, scopedListener)
  }

  public removeListener(channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void): void {
    const index = this.rendererListeners.findIndex(x => x.channel === channel && x.listener === listener)
    if (index !== -1) {
      this.logger.log('electronService', `removeListener(${channel})`)
      const removedListener = this.rendererListeners.splice(index, 1)[0]
      this.ipcRenderer.removeListener(channel, removedListener.scopedListener)
    }
  }

  public restore(route: string): void {
    this.ipcRenderer.send('open-route', route)
  }

  public open(route: string): Observable<void> {
    const promise = new Promise<void>((resolve, reject) => {
      this.ipcRenderer.send('open-route', route)

      this.ipcRenderer.once('open-route-reply', (_, result) => {
        if (result === 'close' || result === 'hide') {
          resolve()
        } else {
          reject(result)
        }
      })
    })
    return from(promise)
  }

  /**
   * Send an asynchronous message to the main process via `channel`, along with arguments.
   *
   * The main process handles it by listening for `channel` with the `ipcMain` module.
   */
  public send(channel: string, ...args: any[]): void {
    this.logger.log('electronService', `send(${channel})`)
    this.ipcRenderer.send(channel, ...args)
  }
}

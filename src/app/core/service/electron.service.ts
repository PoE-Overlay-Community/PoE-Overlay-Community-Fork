import { Injectable, NgZone } from '@angular/core'
import { ElectronProvider } from '@app/provider'
import { ElectronAPI } from '@app/type/electron-api.type'
import { from, Observable } from 'rxjs'
import { LoggerService } from './logger.service'

interface ScopedListener {
  channel: string
  listener: (event: any, ...args: any[]) => void
  scopedListener: (event: any, ...args: any[]) => void
}

@Injectable({
  providedIn: 'root',
})
export class ElectronService {
  private readonly electronAPI: ElectronAPI

  private readonly listeners: ScopedListener[] = []

  constructor(
    private readonly ngZone: NgZone,
    private readonly logger: LoggerService,
    electronProvider: ElectronProvider
  ) {
    this.electronAPI = electronProvider.provideElectronAPI()
  }

  /**
   * Listen for IPC events from the main process.
   * Note: In the new context-isolated architecture, we use ipcRenderer.on for all IPC listening.
   * The 'onMain' naming is kept for backwards compatibility.
   */
  public onMain(channel: string, listener: (event: any, ...args: any[]) => void): void {
    const scopedListener = (event: any, ...args: any[]): void => {
      this.logger.log('electronService', `onMain(${channel})`)
      this.ngZone.run(() => listener(event, ...args))
    }
    this.listeners.push({ channel, listener, scopedListener })
    this.electronAPI.on(channel, scopedListener)
  }

  public removeMainListener(channel: string, listener: (event: any, ...args: any[]) => void): void {
    const index = this.listeners.findIndex(x => x.channel === channel && x.listener === listener)
    if (index !== -1) {
      this.logger.log('electronService', `removeMainListener(${channel})`)
      const removedListener = this.listeners.splice(index, 1)[0]
      this.electronAPI.removeListener(channel, removedListener.scopedListener)
    }
  }

  public on(channel: string, listener: (event: any, ...args: any[]) => void): void {
    const scopedListener = (event: any, ...args: any[]): void => {
      this.logger.log('electronService', `on(${channel})`)
      this.ngZone.run(() => listener(event, ...args))
    }
    this.listeners.push({ channel, listener, scopedListener })
    this.electronAPI.on(channel, scopedListener)
  }

  public removeListener(channel: string, listener: (event: any, ...args: any[]) => void): void {
    const index = this.listeners.findIndex(x => x.channel === channel && x.listener === listener)
    if (index !== -1) {
      this.logger.log('electronService', `removeListener(${channel})`)
      const removedListener = this.listeners.splice(index, 1)[0]
      this.electronAPI.removeListener(channel, removedListener.scopedListener)
    }
  }

  public restore(route: string): void {
    this.electronAPI.openRoute(route)
  }

  public open(route: string): Observable<void> {
    const promise = new Promise<void>((resolve, reject) => {
      this.electronAPI.openRoute(route)

      this.electronAPI.once('open-route-reply', (_, result) => {
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
    this.electronAPI.send(channel, ...args)
  }
}

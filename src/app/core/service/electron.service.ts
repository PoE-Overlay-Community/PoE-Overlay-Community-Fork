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

  public on(tag: string, channel: string, listener: (event: any, ...args: any[]) => void): void {
    this.logger.log(`electronService_${tag}`, `register on('${channel}')`)
    const scopedListener = (event: any, ...args: any[]): void => {
      this.logger.log(`electronService_${tag}`, `on('${channel}')`)
      this.ngZone.run(() => listener(event, ...args))
    }
    this.listeners.push({ channel, listener, scopedListener })
    this.electronAPI.on(channel, scopedListener)
  }

  public once(tag: string, channel: string, listener: (event: any, ...args: any[]) => void): void {
    this.logger.log(`electronService_${tag}`, `register once('${channel}')`)
    const scopedListener = (event: any, ...args: any[]): void => {
      this.logger.log(`electronService_${tag}`, `onnce('${channel}')`)
      this.ngZone.run(() => listener(event, ...args))
      this.removeListener(tag, channel, listener)
    }
    this.listeners.push({ channel, listener, scopedListener })
    this.electronAPI.once(channel, scopedListener)
  }

  public removeListener(tag: string, channel: string, listener: (event: any, ...args: any[]) => void): void {
    const index = this.listeners.findIndex(x => x.channel === channel && x.listener === listener)
    if (index !== -1) {
      this.logger.log(`electronService_${tag}`, `removeListener('${channel}')`)
      const removedListener = this.listeners.splice(index, 1)[0]
      this.electronAPI.removeListener(channel, removedListener.scopedListener)
    }
  }

  public removeAllListeners(tag: string, channel: string): void {
    this.logger.log(`electronService_${tag}`, `removeAllListeners('${channel}')`)
    const allListeners = this.listeners.find(x => x.channel === channel)
    for (const idx in allListeners) {
      const index = this.listeners.indexOf(allListeners[idx])
      this.listeners.splice(index, 1)[0]
    }
    this.electronAPI.removeAllListeners(channel)
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
  public send(tag: string, channel: string, ...args: any[]): void {
    this.logger.log(`electronService_${tag}`, `send('${channel}')`)
    this.electronAPI.send(channel, ...args)
  }
}

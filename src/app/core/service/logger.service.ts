import { Injectable } from '@angular/core'
import { ElectronProvider } from '@app/provider/electron.provider'
import { environment } from '@env/environment'
import { IpcRenderer } from 'electron'

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  private readonly ipcRenderer: IpcRenderer

  constructor(electronProvider: ElectronProvider) {
    this.ipcRenderer = electronProvider.provideIpcRenderer()
  }

  public debug(message: string, ...args: any[]): void {
    this.ipcRenderer?.sendSync('log', 'debug', message, ...args)
    if (!environment.production) {
      console.debug(message)
      args.forEach(arg => console.debug(arg))
    }
  }

  public info(message: string, ...args: any[]): void {
    this.ipcRenderer?.sendSync('log', 'info', message, ...args)
    if (!environment.production) {
      console.info(message)
      args.forEach(arg => console.info(arg))
    }
  }

  public warn(message: string, ...args: any[]): void {
    this.ipcRenderer?.sendSync('log', 'warn', message, ...args)
    if (!environment.production) {
      console.warn(message)
      args.forEach(arg => console.warn(arg))
    }
  }

  public error(message: string, ...args: any[]): void {
    this.ipcRenderer?.sendSync('log', 'error', message, ...args)
    if (!environment.production) {
      console.error(message)
      args.forEach(arg => console.error(arg))
    }
  }
}

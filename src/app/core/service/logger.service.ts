import { Injectable } from '@angular/core'
import { ElectronProvider } from '@app/provider/electron.provider'
import { ElectronAPI } from '@app/type/electron-api.type'
import { environment } from '@env/environment'

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  private readonly electronAPI: ElectronAPI

  constructor(electronProvider: ElectronProvider) {
    this.electronAPI = electronProvider.provideElectronAPI()
  }

  public isLogTagEnabled(tag: string): boolean {
    return tag.length === 0 || this.electronAPI.isLogTagEnabled(tag)
  }

  public debug(tag: string, message: string, ...args: any[]): void {
    this.sendLog('debug', tag, message, ...args)
  }

  public log(tag: string, message: string, ...args: any[]): void {
    this.sendLog('log', tag, message, ...args)
  }

  public info(message: string, ...args: any[]): void {
    this.sendLog('info', '', message, ...args)
  }

  public warn(message: string, ...args: any[]): void {
    this.sendLog('warn', '', message, ...args)
  }

  public error(message: string, ...args: any[]): void {
    this.sendLog('error', '', message, ...args)
  }

  private sendLog(level: string, tag: string, message: string, ...args: any[]): void {
    if (environment.production) {
      if (this.electronAPI) {
        this.electronAPI.log(level, tag, message, ...args)
      } else {
        console.warn(`[LoggerService] Failed to forward the log below to the ElectronAPI!`)
        console.log(message)
        args.forEach(arg => console.log(arg))
      }
    } else if (this.isLogTagEnabled(tag)) {
      if (tag.length > 0) {
        message = `[${tag}] ${message}`
      }
      message = `[PoE Overlay - CF] ${message}`
      console[level](message)
      args.forEach(arg => console[level](arg))
    }
  }
}

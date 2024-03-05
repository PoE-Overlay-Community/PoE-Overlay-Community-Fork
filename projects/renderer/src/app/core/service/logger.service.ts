import { Injectable } from '@angular/core'
import { ElectronProvider } from '@app/provider/electron.provider'
import { environment } from '@env/environment'
import type { IpcRenderer } from 'electron' //renderer

interface LogTags {
  cacheService?: boolean
  rateLimiter?: boolean
  poeHttp?: boolean
  electronService?: boolean
}

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  private readonly enabledLogTags: LogTags = {
    poeHttp: true,
    cacheService: false,
    rateLimiter: false,
    electronService: true,
  }

  private readonly ipcRenderer: IpcRenderer

  constructor(electronProvider: ElectronProvider) {
    this.ipcRenderer = electronProvider.provideIpcRenderer()
  }

  public isLogTagEnabled(tag: string): boolean {
    return tag.length === 0 || this.enabledLogTags[tag]
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
    if (tag.length > 0) {
      if (!this.enabledLogTags[tag]) {
        return
      }
      message = `[${tag}] ${message}`
    }
    if (environment.production) {
      this.ipcRenderer?.sendSync('log', level, message, ...args)
    } else {
      console.log(message)
      args.forEach(arg => console.log(arg))
    }
  }
}

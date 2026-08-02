import { IpcMain } from 'electron'
import * as electronLog from 'electron-log'

interface LogTags {
  cacheService?: boolean
  rateLimiter?: boolean
  poeHttp?: boolean
  electronService?: boolean
  electronService_app?: boolean
  electronService_game?: boolean
  electronService_window?: boolean
  electronService_browserWindow?: boolean
  electronService_settings?: boolean
  electronService_account?: boolean
  electronService_shortcut?: boolean
  electronService_mouseKeyboard?: boolean
  electronService_stashGrid?: boolean
  electronService_tradeCompanion?: boolean
  electronService_thread?: boolean
  electronService_vendorRecipes?: boolean
  vendorRecipePerformance?: boolean
}

export class Logger {
  private readonly enabledLogTags: LogTags = {
    poeHttp: true,
    cacheService: false,
    rateLimiter: false,
    electronService: true,
    electronService_app: false,
    electronService_game: false,
    electronService_window: false,
    electronService_browserWindow: false,
    electronService_settings: false,
    electronService_account: false,
    electronService_shortcut: false,
    electronService_stashGrid: false,
    electronService_tradeCompanion: false,
    electronService_thread: false,
    electronService_vendorRecipes: false,
    vendorRecipePerformance: false,
  }

  constructor(ipcMain: IpcMain) {
    ipcMain.on('log', (event, level, tag, message, ...args) => {
      message = `[SID ${event.sender.id}] ${message}`
      event.returnValue = this.printLog(level, tag, message, ...args)
    })

    ipcMain.on('is-log-tag-enabled', (event, tag) => {
      event.returnValue = this.isLogTagEnabled(tag)
    })

    electronLog.transports.file.level = 'info'
    Object.assign(console, electronLog.functions)
  }

  public isLogTagEnabled(tag: string): boolean {
    return tag.length === 0 || this.enabledLogTags[tag]
  }

  public debug(tag: string, message: string, ...args: any[]): void {
    this.printLog('debug', tag, message, ...args)
  }

  public log(tag: string, message: string, ...args: any[]): void {
    this.printLog('log', tag, message, ...args)
  }

  public info(message: string, ...args: any[]): void {
    this.printLog('info', '', message, ...args)
  }

  public warn(message: string, ...args: any[]): void {
    this.printLog('warn', '', message, ...args)
  }

  public error(message: string, ...args: any[]): void {
    this.printLog('error', '', message, ...args)
  }

  private printLog(level: string, tag: string, message: string, ...args: any[]): boolean {
    if (tag.length > 0) {
      if (!this.enabledLogTags[tag]) {
        return false
      }
      message = `[${tag}] ${message}`
    }

    // Prefix with a custom tag to make it easier to recognize our own logs
    message = `[PoE Overlay - CF] ${message}`

    if (typeof level === 'string' && typeof electronLog[level] === 'function') {
      electronLog[level](message, ...args)
    } else {
      console.log(message)
      args.forEach(arg => console.log(arg))
    }

    return true
  }
}

import type { IpcMain } from 'electron'
import log, {LogLevel} from 'electron-log'

export function register(ipcMain: IpcMain): void {
  ipcMain.on('log', (event, level: LogLevel, message, ...args) => {
    log[level](message, ...args)
    event.returnValue = true
  })

  log.transports.file.level = 'info'
  Object.assign(console, log.functions)
}

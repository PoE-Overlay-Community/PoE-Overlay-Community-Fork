import { IpcMain } from 'electron'
import * as log from 'electron-log'

export function register(ipcMain: IpcMain): void {
  ipcMain.on('log', (event, level, message, ...args) => {
    if (typeof level === 'string' && typeof log[level] === 'function') {
      log[level](message, ...args)
    }
    event.returnValue = true
  })

  log.transports.file.level = 'info'
  Object.assign(console, log.functions)
}

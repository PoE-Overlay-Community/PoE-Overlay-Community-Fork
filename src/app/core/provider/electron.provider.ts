import { Injectable } from '@angular/core'
import { IpcRenderer, IpcMain, GlobalShortcut, Clipboard, Shell, Screen, App, BrowserWindow, ipcRenderer } from 'electron'
import { getCurrentWindow, app, screen, shell, clipboard, globalShortcut, ipcMain } from '@electron/remote'


export interface Remote {
  getCurrentWindow: () => BrowserWindow
  app: App
  BrowserWindow: typeof BrowserWindow
  screen: Screen
  shell: Shell
  clipboard: Clipboard
  globalShortcut: GlobalShortcut
}

@Injectable({
  providedIn: 'root',
})
export class ElectronProvider {
  // private readonly electron: Electron

  constructor() {
    console.warn('construct electron provider')
    if (window?.require) {
      // this.electron = window.require('electron') as Electron
    } else {
      console.warn('window.require not defined.')
    }
  }

  // TODO: refactor
  // Remote was removed: this should be implemented with ipcRender / ipcMain instead
  // see https://github.com/electron/electron/issues/21408
  // https://nornagon.medium.com/electrons-remote-module-considered-harmful-70d69500f31
  public provideRemote(): Remote {
    return {
      app,
      getCurrentWindow: () => getCurrentWindow(),
      BrowserWindow,
      screen,
      shell,
      clipboard,
      globalShortcut
    }
  }

  public provideIpcRenderer(): IpcRenderer {
    return ipcRenderer
  }

  public provideIpcMain(): IpcMain {
    return ipcMain
  }
}

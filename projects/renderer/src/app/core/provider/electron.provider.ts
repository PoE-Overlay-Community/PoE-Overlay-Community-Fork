import { Injectable } from '@angular/core'
import type { IpcRenderer } from 'electron' // renderer
import type { IpcMain } from 'electron/main' //main
import remote from '@electron/remote'
export type Remote = typeof remote;

@Injectable({
  providedIn: 'root',
})
export class ElectronProvider {
  // private readonly electron: Electron

  constructor() {  }

  // TODO: refactor
  // Remote was removed: this should be implemented with ipcRender / ipcMain instead
  // see https://github.com/electron/electron/issues/21408
  // https://nornagon.medium.com/electrons-remote-module-considered-harmful-70d69500f31
  public provideRemote(): Remote {
    return (window as any).remote as Remote
  }

  public provideIpcRenderer(): IpcRenderer {
    return (window as any).ipcRenderer
  }

  public provideIpcMain(): IpcMain {
    return this.provideRemote().ipcMain
  }
}

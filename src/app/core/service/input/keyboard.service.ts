import { Injectable } from '@angular/core'
import { ElectronProvider } from '@app/provider'
import { IpcRenderer } from 'electron'

export enum KeyCode {
  VK_KEY_C = 'c',
  VK_KEY_F = 'f',
  VK_KEY_V = 'v',
  VK_RETURN = 'enter',
  VK_LMENU = 'alt',
  VK_RMENU = 'right_alt',
  VK_LEFT = 'left',
  VK_RIGHT = 'right',
}

@Injectable({
  providedIn: 'root',
})
export class KeyboardService {
  private readonly ipcRenderer: IpcRenderer

  constructor(electronProvider: ElectronProvider) {
    this.ipcRenderer = electronProvider.provideIpcRenderer()
  }

  public setKeyboardDelay(delay: number): void {
    this.ipcRenderer.sendSync('set-keyboard-delay', delay)
  }

  public keyTap(code: KeyCode, modifiers: string[] = []): void {
    this.ipcRenderer.sendSync('key-tap', code, modifiers)
  }

  public keyToggle(code: KeyCode, down: boolean, modifiers: string[] = []): void {
    this.ipcRenderer.sendSync('key-toggle', code, down ? 'down' : 'up', modifiers)
  }
}

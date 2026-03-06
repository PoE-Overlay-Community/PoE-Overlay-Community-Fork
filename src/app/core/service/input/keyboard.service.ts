import { Injectable } from '@angular/core'
import { ElectronProvider } from '@app/provider'
import { ElectronAPI } from '@app/type/electron-api.type'

export enum KeyCode {
  VK_KEY_C = 0x43,
  VK_KEY_F = 0x46,
  VK_KEY_V = 0x56,
  VK_RETURN = 0x0d,
  VK_LMENU = 0xa4,
  VK_RMENU = 0xa5,
  VK_LEFT = 0x25,
  VK_RIGHT = 0x27,
}

@Injectable({
  providedIn: 'root',
})
export class KeyboardService {
  private readonly electronAPI: ElectronAPI

  constructor(electronProvider: ElectronProvider) {
    this.electronAPI = electronProvider.provideElectronAPI()
  }

  public setKeyboardDelay(delay: number): void {
    this.electronAPI.setKeyboardDelay(delay)
  }

  public keyTap(code: KeyCode, modifiers: string[] = []): void {
    this.electronAPI.keyTap(code, modifiers)
  }

  public keyToggle(code: KeyCode, down: boolean, modifiers: string[] = []): void {
    this.electronAPI.keyToggle(code, down ? 'down' : 'up', modifiers)
  }
}

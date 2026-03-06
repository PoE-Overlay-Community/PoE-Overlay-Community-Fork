import { Injectable } from '@angular/core'
import { ElectronProvider } from '@app/provider'
import { ElectronAPI } from '@app/type/electron-api.type'

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private readonly electronAPI: ElectronAPI

  constructor(electronProvider: ElectronProvider) {
    this.electronAPI = electronProvider.provideElectronAPI()
  }

  public focus(): void {
    this.electronAPI.windowSetAlwaysOnTop(false)
    this.electronAPI.windowSetVisibleOnAllWorkspaces(false)

    this.electronAPI.gameFocus()

    this.electronAPI.windowSetAlwaysOnTop(true, 'pop-up-menu', 1)
    this.electronAPI.windowSetVisibleOnAllWorkspaces(true)
  }
}

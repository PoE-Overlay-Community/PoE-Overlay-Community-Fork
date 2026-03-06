import { Injectable } from '@angular/core'
import { ElectronAPI } from '@app/type/electron-api.type'

@Injectable({
  providedIn: 'root',
})
export class ElectronProvider {
  private readonly electronAPI: ElectronAPI

  constructor() {
    if (window?.electronAPI) {
      this.electronAPI = window.electronAPI
    } else {
      console.warn('window.electronAPI not defined. Running outside of Electron?')
    }
  }

  public provideElectronAPI(): ElectronAPI {
    return this.electronAPI
  }
}

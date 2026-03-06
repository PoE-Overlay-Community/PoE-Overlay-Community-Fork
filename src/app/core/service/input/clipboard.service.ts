import { Injectable } from '@angular/core'
import { ElectronProvider } from '@app/provider'
import { ElectronAPI } from '@app/type/electron-api.type'

@Injectable({
  providedIn: 'root',
})
export class ClipboardService {
  private readonly electronAPI: ElectronAPI

  constructor(electronProvider: ElectronProvider) {
    this.electronAPI = electronProvider.provideElectronAPI()
  }

  public readText(): string {
    return this.electronAPI.clipboardReadText()
  }

  public writeText(text: string): void {
    return this.electronAPI.clipboardWriteText(text)
  }
}

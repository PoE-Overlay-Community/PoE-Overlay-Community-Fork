import { Injectable } from '@angular/core'
import { ElectronProvider, Remote } from '@app/provider'

@Injectable({
  providedIn: 'root',
})
export class ClipboardService {
  private readonly electron: Remote

  constructor(electronProvider: ElectronProvider) {
    this.electron = electronProvider.provideRemote()
  }

  public readText(): string {
    return this.electron.clipboard.readText()
  }

  public writeText(text: string): void {
    return this.electron.clipboard.writeText(text)
  }
}

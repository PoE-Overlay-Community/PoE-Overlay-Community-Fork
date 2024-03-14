import { EventEmitter, Injectable } from '@angular/core'
import { ElectronProvider } from '@app/provider'

@Injectable({
  providedIn: 'root',
})
export class GameLogService {
  public readonly logLineAdded = new EventEmitter<string>(true)

  constructor(electronProvider: ElectronProvider) {
    const ipcRenderer = electronProvider.provideIpcRenderer()
    ipcRenderer.on('game-log-line', (_, logLine: string) => this.logLineAdded.emit(logLine))
  }

  public once(predicate: (logLine: string) => boolean, callback: (logLine: string) => void): void {
    const subscription = this.logLineAdded.subscribe((logLine) => {
      if (predicate(logLine)) {
        callback(logLine)
        subscription.unsubscribe()
      }
    })
  }
}

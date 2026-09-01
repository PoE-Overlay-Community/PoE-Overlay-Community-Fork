import { EventEmitter, Injectable } from '@angular/core'
import { ElectronService } from '@app/service'

@Injectable({
  providedIn: 'root',
})
export class GameLogService {
  public readonly logLineAdded = new EventEmitter<string>(true)

  constructor(electronService: ElectronService) {
    electronService?.on('game', 'game-log-line', (_, logLine: string) => this.logLineAdded.emit(logLine))
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

import { open, read, stat, Stats, unwatchFile, watchFile } from 'fs'
import { EOL } from 'os'

export type OnLogLineAddedFunc = (logLine: string) => void

export class GameLogListener {
  private onLogLineAdded: OnLogLineAddedFunc
  private clientLogFilePath: string
  private lastFilePosition: number = 0

  constructor(onLogLineAdded: OnLogLineAddedFunc) {
    this.onLogLineAdded = onLogLineAdded
  }

  public setLogFilePath(filePath: string): void {
    if (filePath && this.clientLogFilePath !== filePath) {
      this.stop()
      this.clientLogFilePath = filePath
      this.start()
    }
  }

  private stop(): void {
    if (this.clientLogFilePath) {
      unwatchFile(this.clientLogFilePath)
    }
  }

  private start(): void {
    stat(this.clientLogFilePath, (err, infos) => {
      if (err) {
        this.logError('Failed to get Client.txt stats', err)
        return
      }

      this.lastFilePosition = infos.size

      watchFile(this.clientLogFilePath, {
        persistent: true,
        interval: 350
      }, (current, _) => this.readLastLines(current))
    })
  }

  private readLastLines(current: Stats): void {
    open(this.clientLogFilePath, 'r', (err, fd) => {
      if (err) {
        this.logError('Failed to open Client.txt', err)
        return
      }
	  
      const newSize = current.size
      let diff = newSize - this.lastFilePosition
      if (diff < 0) {
        this.lastFilePosition = 0
        return
      } else if (diff == 0) {
        return
      }

      const buffer: Buffer = Buffer.alloc(diff)

      read(fd, buffer, 0, buffer.length, this.lastFilePosition, (err, bytesRead, buffer) => {
        if (err) {
          this.logError('Failed to read Client.txt', err)
          return
        }

        this.lastFilePosition = newSize
        buffer.toString().split(EOL).forEach(line => {
          if (line) {
            this.onLogLineAdded(line)
          }
        })
      })
    })
  }

  private logError(message: string, err: NodeJS.ErrnoException): void {
    console.log(message)
    console.error(err)
  }
}

import { IpcMain, Rectangle } from 'electron'
import * as path from 'path'
import { GameLogListener, OnLogLineAddedFunc } from './game-log-listener'
import { getActiveWindow, Window } from './window'

const POE_NAMES = [
  // Epic Games Store
  'pathofexile_x64egs.exe',
  'pathofexileegs.exe',
  'pathofexile_x64egs',
  'pathofexileegs',

  // Steam
  'pathofexile_x64steam.exe',
  'pathofexilesteam.exe',
  'pathofexile_x64steam',
  'pathofexilesteam',

  // Standalone
  'pathofexile_x64.exe',
  'pathofexile.exe',
  'pathofexile_x64',
  'pathofexile',

  // Linux
  'wine64-preloader',
]

const POE_KOREAN_NAMES = [
  // Kakao Client (Korean)
  'pathofexile_x64_kg.exe',
  'pathofexile_kg.exe',
  'pathofexile_x64_kg',
  'pathofexile_kg',
]

const POE_TITLES = ['Path of Exile']

const POE_ALTERNATIVE_TITLES = ['Path of Exile <---> ']

export class Game {
  private window: Window
  private gameLogListener: GameLogListener

  public active?: boolean
  public bounds?: Rectangle

  constructor(onLogLineAdded: OnLogLineAddedFunc) {
    this.gameLogListener = new GameLogListener(onLogLineAdded)
  }

  public async update(): Promise<boolean> {
    const old = this.toString()

    const window = await getActiveWindow()
    if (window) {
      const windowPath = (window.path || '').toLowerCase()
      const name = path.basename(windowPath)
      if (POE_NAMES.includes(name)) {
        this.updateWindow(window, "Client.txt")
      } else if (POE_KOREAN_NAMES.includes(name)) {
        this.updateWindow(window, "KakaoClient.txt")
      } else {
        this.active = false
      }
    } else {
      this.active = false
    }
    return old !== this.toString()
  }

  public focus(): void {
    if (this.window?.bringToTop) {
      this.window.bringToTop()
    }
  }

  private toString(): string {
    return JSON.stringify({
      active: this.active,
      bounds: this.bounds,
      processId: this.window?.processId,
    })
  }

  private updateWindow(window: Window, logFileName: string): void {
    const title = window.title()
    if (POE_TITLES.includes(title) || POE_ALTERNATIVE_TITLES.some((x) => title.startsWith(x))) {
      this.window = window
      this.active = true
      this.bounds = window.bounds()
      this.gameLogListener.setLogFilePath(path.join(path.parse(window.path).dir, "logs", logFileName))
    } else {
      this.active = false
    }
  }
}

export function register(ipcMain: IpcMain, onUpdate: (game: Game) => void, onLogLineAdded: OnLogLineAddedFunc): void {
  const game = new Game(onLogLineAdded)

  ipcMain.on('game-focus', (event) => {
    game.focus()
    event.returnValue = true
  })

  ipcMain.on('game-send-active-change', (event) => {
    onUpdate(game)
    event.returnValue = true
  })

  setInterval(async () => {
    if (await game.update()) {
      onUpdate(game)
    }
  }, 500)
}

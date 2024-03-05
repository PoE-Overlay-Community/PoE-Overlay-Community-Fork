import { IpcMain, Rectangle } from 'electron'
import path from 'path'
import { procfs } from '@stroncium/procfs'
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

  // Kakao Client (Korean)
  'pathofexile_x64_kg.exe',
  'pathofexile_kg.exe',
  'pathofexile_x64_kg',
  'pathofexile_kg',
]

const POE_TITLES = ['Path of Exile']

const POE_ALTERNATIVE_TITLES = ['Path of Exile <---> ']

/**
 *  Gets the directory for pid on linux
 *  This assumes the games is started through steam.
 *  Get POE directory from wine process env variable PWD.
 */
const getLinuxDir = (pid: number) => new Map(procfs.processEnviron(pid) as Array<[string,string]>).get('PWD')

export class Game {
  private window?: Window
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
      this.updateWindow(window)
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

  private updateWindow(window: Window): void {
    const windowPath = path.parse((window.path || '').toLowerCase())

    const isPOEWindowPath = POE_NAMES.includes(windowPath.name)

    if (!isPOEWindowPath) {
      this.active = false
      return
    }

    const title = window.title()

    const isPOETitle = POE_TITLES.includes(title) || POE_ALTERNATIVE_TITLES.some((x) => title.startsWith(x))

    if (!isPOETitle) {
      this.active = false
      return
    }

    const poeDir = process.platform === 'linux' ?  getLinuxDir(window.processId) : windowPath.dir

    if (!poeDir) {
      this.active = false
      return
    }

    this.window = window
    this.active = true
    this.bounds = window.bounds()

    // Kakao client uses a different logfile name
    const logFileName = windowPath.name.endsWith('_kg') ? "KakaoClient.txt" : "Client.txt"

    this.gameLogListener.setLogFilePath(path.join(poeDir, "logs", logFileName))
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

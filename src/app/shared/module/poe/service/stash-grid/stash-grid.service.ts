import { Injectable } from '@angular/core'
import { ElectronProvider } from '@app/provider/electron.provider'
import { GameService, WindowService } from '@app/service'
import { Rectangle } from '@app/type'
import { StashGridOptions, StashGridType, STASH_TAB_CELL_COUNT_MAP, TradeItemLocation } from '@shared/module/poe/type/stash-grid.type'
import { IpcMain, IpcMainEvent, IpcRenderer } from 'electron'
import { BehaviorSubject, from, Observable, of } from 'rxjs'
import { StashService } from '../stash/stash.service'

const STASH_GRID_OPTIONS_KEY = 'stash-grid-options'
const STASH_GRID_OPTIONS_REPLY_KEY = 'stash-grid-options-reply'
const CLOSED_KEY = 'closed'

@Injectable({
  providedIn: 'root',
})
export class StashGridService {
  public readonly stashGridOptions$ = new BehaviorSubject<StashGridOptions>(undefined)

  private ipcMain: IpcMain
  private ipcRenderer: IpcRenderer
  private ipcMainEvent: IpcMainEvent

  private scopedStashGridOptionsEvent

  constructor(
    electronProvider: ElectronProvider,
    private readonly window: WindowService,
    private readonly game: GameService,
    private readonly stashService: StashService,
  ) {
    this.ipcMain = electronProvider.provideIpcMain()
    this.ipcRenderer = electronProvider.provideIpcRenderer()
  }

  /**
   * Call this method only from the main window
   */
  public registerEvents(): void {
    if (!this.scopedStashGridOptionsEvent) {
      this.scopedStashGridOptionsEvent = (event, stashGridOptions) =>
        this.onStashGridOptions(event, stashGridOptions)
      this.ipcMain.on(STASH_GRID_OPTIONS_KEY, this.scopedStashGridOptionsEvent)
    }
  }

  /**
   * Call this method only from the main window
   */
  public unregisterEvents(): void {
    this.ipcMain.removeListener(STASH_GRID_OPTIONS_KEY, this.scopedStashGridOptionsEvent)
  }

  public showStashGrid(stashGridOptions: StashGridOptions): Observable<void> {
    const promise = new Promise<void>((resolve) => {
      this.ipcRenderer.send(STASH_GRID_OPTIONS_KEY, stashGridOptions)
      const scopedReplyEvent = (_, stashGridBounds: Rectangle) => {
        this.ipcRenderer.removeListener(CLOSED_KEY, scopedClosedEvent)
        resolve()
      }
      const scopedClosedEvent = () => {
        this.ipcRenderer.removeListener(STASH_GRID_OPTIONS_REPLY_KEY, scopedReplyEvent)
        resolve()
      }
      this.ipcRenderer.once(STASH_GRID_OPTIONS_REPLY_KEY, scopedReplyEvent)
      this.ipcRenderer.once(CLOSED_KEY, scopedClosedEvent)
    })
    return from(promise)
  }

  public hideStashGrid(): void {
    this.ipcRenderer.send(STASH_GRID_OPTIONS_KEY, null)
  }

  /**
   * Call this method only from the settings window
   */
  public editStashGrid(stashGridOptions: StashGridOptions): Observable<Rectangle> {
    const promise = new Promise<Rectangle>((resolve, reject) => {
      this.ipcRenderer.send(STASH_GRID_OPTIONS_KEY, stashGridOptions)
      const scopedReplyEvent = (_, stashGridBounds: Rectangle) => {
        this.ipcRenderer.removeListener(CLOSED_KEY, scopedClosedEvent)
        resolve(stashGridBounds)
      }
      const scopedClosedEvent = () => {
        this.ipcRenderer.removeListener(STASH_GRID_OPTIONS_REPLY_KEY, scopedReplyEvent)
        resolve(null)
      }
      this.ipcRenderer.once(STASH_GRID_OPTIONS_REPLY_KEY, scopedReplyEvent)
      this.ipcRenderer.once(CLOSED_KEY, scopedClosedEvent)
    })
    return from(promise)
  }

  /**
   * Call this method only from the main window
   */
  public completeStashGridEdit(stashGridBounds: Rectangle): void {
    if (this.ipcMainEvent) {
      this.stashGridOptions$.next(null)
      this.ipcMainEvent.reply(STASH_GRID_OPTIONS_REPLY_KEY, stashGridBounds)
      this.ipcMainEvent = null
    }
  }

  public getStashGridType(itemLocation: TradeItemLocation): Observable<StashGridType> {
    const normalGridCellCount = STASH_TAB_CELL_COUNT_MAP[StashGridType.Normal]
    const bounds = itemLocation.bounds
    const maxX = bounds.reduce((max, bounds) => Math.max(max, bounds.x + bounds.width - 1), 0)
    const maxY = bounds.reduce((max, bounds) => Math.max(max, bounds.y + bounds.height - 1), 0)
    const gridType = maxX <= normalGridCellCount && maxY <= normalGridCellCount ? StashGridType.Normal : StashGridType.Quad
    if (gridType === StashGridType.Normal) {
      return this.stashService.getStashGridType(itemLocation.tabName)
    } else {
      return of(gridType)
    }
  }

  private onStashGridOptions(
    event: IpcMainEvent,
    stashGridOptions: StashGridOptions
  ): void {
    this.completeStashGridEdit(null)
    this.ipcMainEvent = event
    this.stashGridOptions$.next(stashGridOptions)
    this.game.focus()
    this.window.focus()
  }
}

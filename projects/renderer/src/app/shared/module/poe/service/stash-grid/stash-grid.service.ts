import { Injectable } from '@angular/core'
import { ElectronProvider } from '@app/provider/electron.provider'
import { GameService, WindowService } from '@app/service'
import { Rectangle } from '@app/type'
import { StashGridOptions, StashGridType, STASH_TAB_CELL_COUNT_MAP, TradeItemLocation, TradeItemLocations } from '@shared/module/poe/type/stash-grid.type'
import type { IpcMain } from 'electron' //main
import type { IpcMainEvent, IpcRenderer } from 'electron' //renderer
import { Subject } from 'rxjs'
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

  private stashGridOptionsQueue: StashGridOptions[] = []
  private readonly cancelStashGridSequence$ = new Subject<void>()

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
      this.scopedStashGridOptionsEvent = (event, stashGridOptions) => this.onStashGridOptions(event, stashGridOptions)
      this.ipcMain.on(STASH_GRID_OPTIONS_KEY, this.scopedStashGridOptionsEvent)
    }
  }

  /**
   * Call this method only from the main window
   */
  public unregisterEvents(): void {
    this.ipcMain.removeListener(STASH_GRID_OPTIONS_KEY, this.scopedStashGridOptionsEvent)
  }

  /**
   * Call this method only from the main window
   */
  public showStashGrid(...stashGridOptions: StashGridOptions[]): Observable<boolean> {
    const promise = new Promise<boolean>((resolve, reject) => {
      const sub = this.stashGridOptions$.subscribe((stashGridOptions) => {
        if (!sub || sub.closed || !sub2 || sub2.closed) {
          return
        }
        if (!stashGridOptions) {
          resolve(true)
          sub.unsubscribe()
          sub2.unsubscribe()
        }
      })
      const sub2 = this.cancelStashGridSequence$.subscribe(() => {
        if (!sub || sub.closed || !sub2 || sub2.closed) {
          return
        }
        resolve(false)
        sub.unsubscribe()
        sub2.unsubscribe()
      })
      this.enqueueStashGridOptions(stashGridOptions)
    })
    return from(promise)
  }

  /**
   * Call this method only from the settings window
   */
  public settingsShowStashGrid(...stashGridOptions: StashGridOptions[]): Observable<void> {
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
    if (this.ipcMainEvent) {
      this.ipcRenderer.send(STASH_GRID_OPTIONS_KEY, null)
    } else {
      this.clearStashGridOptionsQueue()
      this.showNextStashGridOption()
    }
  }

  /**
   * Call this method only from the settings window
   */
  public settingsEditStashGrid(...stashGridOptions: StashGridOptions[]): Observable<Rectangle> {
    const promise = new Promise<Rectangle>((resolve) => {
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
  public completeStashGridEdit(stashGridBounds?: Rectangle): void {
    this.completeStashGridEditEvent(stashGridBounds)
    this.showNextStashGridOption()
  }

  /**
   * Call this method only from the main window
   */
  public nextStashGridInSequence(): void {
    this.completeStashGridEditEvent(null)
    this.showNextStashGridOption()
  }

  /**
   * Call this method only from the main window
   */
  public cancelStashGridSequence(): void {
    this.completeStashGridEditEvent(null)
    this.clearStashGridOptionsQueue()
    this.cancelStashGridSequence$.next()
    this.showNextStashGridOption()
  }

  /**
   * Call this method only from the main window
   */
  public getStashGridTypeByItemLocation(itemLocation: TradeItemLocation): Observable<StashGridType> {
    return this.getStashGridType(itemLocation.tabName, [itemLocation.bounds])
  }

  /**
   * Call this method only from the main window
   */
  public getStashGridTypeByItemLocations(itemLocation: TradeItemLocations): Observable<StashGridType> {
    return this.getStashGridType(itemLocation.tabName, itemLocation.bounds)
  }

  private getStashGridType(stashTabName: string, bounds: Rectangle[]): Observable<StashGridType> {
    const normalGridCellCount = STASH_TAB_CELL_COUNT_MAP[StashGridType.Normal]
    const maxX = bounds.reduce((max, bounds) => Math.max(max, bounds.x + bounds.width - 1), 0)
    const maxY = bounds.reduce((max, bounds) => Math.max(max, bounds.y + bounds.height - 1), 0)
    const gridType = maxX <= normalGridCellCount && maxY <= normalGridCellCount ? StashGridType.Normal : StashGridType.Quad
    if (gridType === StashGridType.Normal) {
      return this.stashService.getStashGridType(stashTabName)
    } else {
      return of(gridType)
    }
  }

  private showNextStashGridOption(): void {
    const stashGridOptions = this.stashGridOptionsQueue.shift()
    if (stashGridOptions) {
      this.stashGridOptions$.next(stashGridOptions)
    } else {
      this.stashGridOptions$.next(null)
    }
  }

  private enqueueStashGridOptions(stashGridOptions: StashGridOptions[]): void {
    const isQueueEmpty = this.stashGridOptionsQueue.length === 0
    this.stashGridOptionsQueue.push(...stashGridOptions)
    if (isQueueEmpty) {
      this.showNextStashGridOption()
    }
  }

  private clearStashGridOptionsQueue(): void {
    this.stashGridOptionsQueue.splice(0, this.stashGridOptionsQueue.length)
  }

  private completeStashGridEditEvent(stashGridBounds?: Rectangle): void {
    if (this.ipcMainEvent) {
      this.ipcMainEvent.reply(STASH_GRID_OPTIONS_REPLY_KEY, stashGridBounds)
      this.ipcMainEvent = null
    }
  }

  private onStashGridOptions(
    event: IpcMainEvent,
    stashGridOptions: StashGridOptions[]
  ): void {
    this.completeStashGridEditEvent(null)
    this.clearStashGridOptionsQueue()
    this.ipcMainEvent = event
    if (stashGridOptions) {
      this.enqueueStashGridOptions(stashGridOptions)
    } else {
      this.stashGridOptions$.next(null)
    }
    this.game.focus()
    this.window.focus()
  }
}

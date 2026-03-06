import { Injectable } from '@angular/core'
import { ElectronProvider } from '@app/provider/electron.provider'
import { GameService, WindowService } from '@app/service'
import { Rectangle } from '@app/type'
import { ElectronAPI } from '@app/type/electron-api.type'
import { StashGridOptions, StashGridType, STASH_TAB_CELL_COUNT_MAP, TradeItemLocation, TradeItemLocations } from '@shared/module/poe/type/stash-grid.type'
import { Subject } from 'rxjs'
import { BehaviorSubject, from, Observable, of, Subscription } from 'rxjs'
import { StashService } from '../stash/stash.service'

const STASH_GRID_OPTIONS_KEY = 'stash-grid-options'
const STASH_GRID_OPTIONS_REPLY_KEY = 'stash-grid-options-reply'
const CLOSED_KEY = 'closed'

@Injectable({
  providedIn: 'root',
})
export class StashGridService {
  public readonly stashGridOptions$ = new BehaviorSubject<StashGridOptions>(undefined)

  private readonly electronAPI: ElectronAPI
  private originalSenderId: number | null = null

  private scopedStashGridOptionsEvent: (event: any, stashGridOptions: any, senderId?: number) => void

  private stashGridOptionsQueue: StashGridOptions[] = []
  private readonly cancelStashGridSequence$ = new Subject<void>()

  constructor(
    electronProvider: ElectronProvider,
    private readonly window: WindowService,
    private readonly game: GameService,
    private readonly stashService: StashService,
  ) {
    this.electronAPI = electronProvider.provideElectronAPI()
  }

  /**
   * Call this method only from the main window
   */
  public registerEvents(): void {
    if (!this.scopedStashGridOptionsEvent) {
      this.scopedStashGridOptionsEvent = (event: any, stashGridOptions: any, senderId?: number) => this.onStashGridOptions(stashGridOptions, senderId)
      this.electronAPI.on(STASH_GRID_OPTIONS_KEY, this.scopedStashGridOptionsEvent)
    }
  }

  /**
   * Call this method only from the main window
   */
  public unregisterEvents(): void {
    if (this.scopedStashGridOptionsEvent) {
      this.electronAPI.removeListener(STASH_GRID_OPTIONS_KEY, this.scopedStashGridOptionsEvent)
    }
  }

  /**
   * Call this method only from the main window
   */
  public showStashGrid(...stashGridOptions: StashGridOptions[]): Observable<boolean> {
    const promise = new Promise<boolean>((resolve, reject) => {
      let sub: Subscription
      let sub2: Subscription
      sub = this.stashGridOptions$.subscribe((stashGridOptions) => {
        if (!sub || sub.closed || !sub2 || sub2.closed) {
          return
        }
        if (!stashGridOptions) {
          resolve(true)
          sub.unsubscribe()
          sub2.unsubscribe()
        }
      })
      sub2 = this.cancelStashGridSequence$.subscribe(() => {
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
      this.electronAPI.send(STASH_GRID_OPTIONS_KEY, stashGridOptions)
      const scopedReplyEvent = (_: any, stashGridBounds: Rectangle) => {
        this.electronAPI.removeListener(CLOSED_KEY, scopedClosedEvent)
        resolve()
      }
      const scopedClosedEvent = () => {
        this.electronAPI.removeListener(STASH_GRID_OPTIONS_REPLY_KEY, scopedReplyEvent)
        resolve()
      }
      this.electronAPI.once(STASH_GRID_OPTIONS_REPLY_KEY, scopedReplyEvent)
      this.electronAPI.once(CLOSED_KEY, scopedClosedEvent)
    })
    return from(promise)
  }

  public hideStashGrid(): void {
    if (this.originalSenderId) {
      this.electronAPI.send(STASH_GRID_OPTIONS_KEY, null)
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
      this.electronAPI.send(STASH_GRID_OPTIONS_KEY, stashGridOptions)
      const scopedReplyEvent = (_: any, stashGridBounds: Rectangle) => {
        this.electronAPI.removeListener(CLOSED_KEY, scopedClosedEvent)
        resolve(stashGridBounds)
      }
      const scopedClosedEvent = () => {
        this.electronAPI.removeListener(STASH_GRID_OPTIONS_REPLY_KEY, scopedReplyEvent)
        resolve(null)
      }
      this.electronAPI.once(STASH_GRID_OPTIONS_REPLY_KEY, scopedReplyEvent)
      this.electronAPI.once(CLOSED_KEY, scopedClosedEvent)
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
    if (this.originalSenderId) {
      // Send reply via the main process which will forward to the original sender
      this.electronAPI.send(STASH_GRID_OPTIONS_REPLY_KEY, stashGridBounds, this.originalSenderId)
      this.originalSenderId = null
    }
  }

  private onStashGridOptions(
    stashGridOptions: StashGridOptions[],
    senderId?: number
  ): void {
    this.completeStashGridEditEvent(null)
    this.clearStashGridOptionsQueue()
    this.originalSenderId = senderId || null
    if (stashGridOptions) {
      this.enqueueStashGridOptions(stashGridOptions)
    } else {
      this.stashGridOptions$.next(null)
    }
    this.game.focus()
    this.window.focus()
  }
}

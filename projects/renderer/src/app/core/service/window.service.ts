import { Injectable, NgZone } from '@angular/core'
import { ElectronProvider, Remote } from '@app/provider'
import { Rectangle } from '@app/type'
import type { BrowserWindow } from 'electron' //main
import type { Point, IpcRenderer } from 'electron' //renderer
import { Observable, Subject, BehaviorSubject } from 'rxjs'
import { TransparencyMouseFix } from '../../transparency-mouse-fix'

@Injectable({
  providedIn: 'root',
})
export class WindowService {
  public readonly gameBounds: BehaviorSubject<Rectangle>

  // Don't remove this. We need to keep the instance, but don't actually use it (because all magic happens inside)
  private transparencyMouseFix: TransparencyMouseFix

  private readonly electronRemote: Remote
  private readonly ipcRenderer: IpcRenderer
  private readonly window: BrowserWindow

  constructor(private readonly ngZone: NgZone, electronProvider: ElectronProvider) {
    this.ipcRenderer = electronProvider.provideIpcRenderer()
    this.electronRemote = electronProvider.provideRemote()
    this.window = this.electronRemote.getCurrentWindow()
    this.gameBounds = new BehaviorSubject<Rectangle>(
      this.window?.getBounds() ?? { x: 0, y: 0, width: 0, height: 0 }
    )
  }

  public registerEvents(): void {
    this.ipcRenderer.on('game-bounds-change', (_, bounds: Rectangle) => {
      this.gameBounds.next(bounds)
    })
  }

  public enableTransparencyMouseFix(): void {
    this.transparencyMouseFix = new TransparencyMouseFix(this.electronRemote)
  }

  public disableTransparencyMouseFix(ignoreMouse = false): void {
    this.transparencyMouseFix?.dispose()
    this.transparencyMouseFix = null

    this.window.setIgnoreMouseEvents(ignoreMouse, { forward: ignoreMouse })
  }

  public on(event: any): Observable<void> {
    const callback = new Subject<void>()
    this.window.on(event, () => {
      this.ngZone.run(() => callback.next())
    })
    return callback
  }

  public removeAllListeners(): void {
    this.window.removeAllListeners()
  }

  public getMainWindowBounds(): [Rectangle, Rectangle] {
    return this.ipcRenderer.sendSync('main-window-bounds')
  }

  public getWindowBounds(): Rectangle {
    const bounds = this.window.getBounds()
    return bounds
  }

  public getOffsettedGameBounds(useLocalBounds = true): Rectangle {
    let bounds: Rectangle
    let poeBounds: Rectangle
    if (useLocalBounds) {
      bounds = this.window.getBounds()
      poeBounds = this.gameBounds.value
    } else {
      const remoteBounds = this.getMainWindowBounds()
      bounds = remoteBounds[0]
      poeBounds = remoteBounds[1]
    }
    return {
      x: poeBounds.x - bounds.x,
      y: poeBounds.y - bounds.y,
      width: poeBounds.width,
      height: poeBounds.height,
    }
  }

  public hide(): void {
    this.window.hide()
  }

  public show(): void {
    this.window.show()
  }

  public focus(): void {
    this.window.focus()
  }

  public minimize(): void {
    this.window.minimize()
  }

  public restore(): void {
    this.window.restore()
  }

  public close(): void {
    this.window.close()
  }

  public getZoom(): number {
    return this.window.webContents.zoomFactor
  }

  public setZoom(zoom: number): void {
    this.window.webContents.zoomFactor = zoom
  }

  public setSize(width: number, height: number): void {
    this.window.setSize(width, height)
  }

  public disableInput(focusable: boolean): void {
    if (focusable) {
      this.window.blur()
    }
    this.window.setIgnoreMouseEvents(true, { forward: true })
    if (focusable) {
      this.window.setFocusable(false)
    }
  }

  public enableInput(focusable: boolean): void {
    if (focusable) {
      this.window.setFocusable(true)
      this.window.setSkipTaskbar(true)
    }
    this.window.setIgnoreMouseEvents(false)
    if (focusable) {
      this.window.focus()
    }
  }

  public convertToLocal(point: Point): Point {
    const winBounds = this.window.getBounds()
    const poeBounds = this.gameBounds.value
    const local = {
      ...point,
    }
    local.x -= winBounds.x - poeBounds.x
    local.x = Math.min(Math.max(local.x, 0), winBounds.width)
    local.y -= winBounds.y - poeBounds.y
    local.y = Math.min(Math.max(local.y, 0), winBounds.height)
    return local
  }

  public convertToLocalScaled(local: Point): Point {
    const point = {
      ...local,
    }

    const { zoomFactor } = this.window.webContents
    point.x *= 1 / zoomFactor
    point.y *= 1 / zoomFactor
    return point
  }
}

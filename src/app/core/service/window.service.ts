import { Injectable, NgZone } from '@angular/core'
import { ElectronProvider } from '@app/provider'
import { Rectangle, Point } from '@app/type'
import { ElectronAPI } from '@app/type/electron-api.type'
import { Observable, Subject, BehaviorSubject } from 'rxjs'
import { TransparencyMouseFix } from '../../transparency-mouse-fix'

@Injectable({
  providedIn: 'root',
})
export class WindowService {
  public readonly gameBounds: BehaviorSubject<Rectangle>

  // Don't remove this. We need to keep the instance, but don't actually use it (because all magic happens inside)
  private transparencyMouseFix: TransparencyMouseFix

  private readonly electronAPI: ElectronAPI

  constructor(private readonly ngZone: NgZone, electronProvider: ElectronProvider) {
    this.electronAPI = electronProvider.provideElectronAPI()
    this.gameBounds = new BehaviorSubject<Rectangle>(
      this.electronAPI?.getCurrentWindowBounds() ?? { x: 0, y: 0, width: 0, height: 0 }
    )
  }

  public registerEvents(): void {
    this.electronAPI.on('game-bounds-change', (_, bounds: Rectangle) => {
      this.gameBounds.next(bounds)
    })
  }

  public enableTransparencyMouseFix(): void {
    this.transparencyMouseFix = new TransparencyMouseFix(this.electronAPI)
  }

  public disableTransparencyMouseFix(ignoreMouse = false): void {
    this.transparencyMouseFix?.dispose()
    this.transparencyMouseFix = null

    this.electronAPI.setIgnoreMouseEvents(ignoreMouse, { forward: ignoreMouse })
  }

  public on(event: string): Observable<void> {
    const callback = new Subject<void>()
    this.electronAPI.on(event, () => {
      this.ngZone.run(() => callback.next())
    })
    return callback
  }

  public removeAllListeners(): void {
    // Note: In the new architecture, we can't remove all listeners on the window
    // We would need to track specific listeners and remove them individually
    console.warn('removeAllListeners is no longer supported in context-isolated mode')
  }

  public getMainWindowBounds(): [Rectangle, Rectangle] {
    return this.electronAPI.getMainWindowBounds()
  }

  public getWindowBounds(): Rectangle {
    return this.electronAPI.getCurrentWindowBounds()
  }

  public getOffsettedGameBounds(useLocalBounds = true): Rectangle {
    let bounds: Rectangle
    let poeBounds: Rectangle
    if (useLocalBounds) {
      bounds = this.electronAPI.getCurrentWindowBounds()
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
    this.electronAPI.windowHide()
  }

  public show(): void {
    this.electronAPI.windowShow()
  }

  public focus(): void {
    this.electronAPI.windowFocus()
  }

  public minimize(): void {
    this.electronAPI.windowMinimize()
  }

  public restore(): void {
    this.electronAPI.windowRestore()
  }

  public close(): void {
    this.electronAPI.windowClose()
  }

  public getZoom(): number {
    return this.electronAPI.getZoomFactor()
  }

  public setZoom(zoom: number): void {
    this.electronAPI.setZoomFactor(zoom)
  }

  public setSize(width: number, height: number): void {
    this.electronAPI.windowSetSize(width, height)
  }

  public disableInput(focusable: boolean): void {
    if (focusable) {
      this.electronAPI.windowBlur()
    }
    this.electronAPI.setIgnoreMouseEvents(true, { forward: true })
    if (focusable) {
      this.electronAPI.windowSetFocusable(false)
    }
  }

  public enableInput(focusable: boolean): void {
    if (focusable) {
      this.electronAPI.windowSetFocusable(true)
      this.electronAPI.windowSetSkipTaskbar(true)
    }
    this.electronAPI.setIgnoreMouseEvents(false)
    if (focusable) {
      this.electronAPI.windowFocus()
    }
  }

  public convertToLocal(point: Point): Point {
    const winBounds = this.electronAPI.getCurrentWindowBounds()
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

    const zoomFactor = this.electronAPI.getZoomFactor()
    point.x *= 1 / zoomFactor
    point.y *= 1 / zoomFactor
    return point
  }
}

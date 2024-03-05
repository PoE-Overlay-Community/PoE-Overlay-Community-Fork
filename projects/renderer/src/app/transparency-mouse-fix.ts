import { Remote } from '@app/provider'
import type { BrowserWindow } from 'electron' //main

// This class makes it possible to make certain elements clickable and keeping others click-through.
//
// It also contains a workaround for the following issue:
//   setIgnoreMouseEvents({forward: true}) stops forwarding after a page reload
//   https://github.com/electron/electron/issues/15376
//
//   The main idea is to poll the mouse every frame once a reload has occured.
//
// Transparency-checking is based on comments posted here: https://github.com/electron/electron/issues/1335
// The work-around is based on https://github.com/toonvanvr/electron-transparency-mouse-fix/blob/348bd943864671801324cf50c939f96eec448f40/src/electron-transparency-mouse-fix.js

export class TransparencyMouseFix {
  private readonly STYLE_ID = 'tmf-css'
  private readonly SESSION_STORAGE_KEY = 'tmf-reloaded'
  private readonly SESSION_STORAGE_VALUE = 'true'

  private readonly electron: Remote
  private readonly electronWindow: BrowserWindow
  private readonly htmlWindow: Window

  private readonly scopedOnMouseEvent
  private readonly scopedManualPoll

  private ignoreMouse = true
  private fixPointerEvents = false
  private manualPollingInstanceCount = 0

  constructor(electronRemote: Remote, private readonly log = false) {
    this.electron = electronRemote
    this.electronWindow = this.electron.getCurrentWindow()
    this.htmlWindow = window

    this.scopedOnMouseEvent = (event) => this.onMouseEvent(event)
    this.scopedManualPoll = () => this.manualMousePoll()

    this.registerListeners()
    this.tryStartPolling()
  }

  public dispose(): void {
    this.unregister(this.htmlWindow)
  }

  private registerListeners(): void {
    this.log && console.log('tmf-registerListeners')

    this.htmlWindow.addEventListener('mousemove', this.scopedOnMouseEvent)
    this.htmlWindow.addEventListener('beforeunload', () => this.unregister(this.htmlWindow))
    const styleSheet = this.htmlWindow.document.createElement('style')
    styleSheet.id = this.STYLE_ID
    styleSheet.innerHTML = `html { pointer-events: none; }`
    this.htmlWindow.document.head.appendChild(styleSheet)
  }

  private unregister(htmlWindow: Window): void {
    this.log && console.log('tmf-unregister')

    htmlWindow.document.getElementById(this.STYLE_ID)?.remove()

    htmlWindow.removeEventListener('mousemove', this.scopedOnMouseEvent)

    sessionStorage.setItem(this.SESSION_STORAGE_KEY, this.SESSION_STORAGE_VALUE)

    this.electronWindow.setIgnoreMouseEvents(false)
  }

  private shouldIgnoreMouseEvents(element): boolean {
    return element === this.htmlWindow.document.documentElement
  }

  private onMouseEvent(event): void {
    this.log && console.log('tmf.onMouseEvent')

    if (this.shouldIgnoreMouseEvents(event.target)) {
      if (this.ignoreMouse) return
      this.ignoreMouse = true

      if (this.fixPointerEvents) {
        // Circumvent forwarding of ignored mouse events
        this.electronWindow.setIgnoreMouseEvents(true, { forward: false })
        this.manualMousePoll(true)
      } else {
        // Ignore mouse events with built-in forwarding
        this.electronWindow.setIgnoreMouseEvents(true, { forward: true })
      }
    } else {
      if (!this.ignoreMouse) return
      this.ignoreMouse = false

      // Catch all mouse events
      this.electronWindow.setIgnoreMouseEvents(false)
    }
  }

  private tryStartPolling(): void {
    this.fixPointerEvents = true
    switch (process.platform) {
      case 'win32':
        // Only windows has this mouse issue after a reload, so check if polling has to occur.
        if (sessionStorage.getItem(this.SESSION_STORAGE_KEY) !== this.SESSION_STORAGE_VALUE) {
          this.fixPointerEvents = false
        }
        break

      case 'darwin':
        // MacOS doesn't have this mouse issue, so there's no need to start polling.
        this.fixPointerEvents = false
        break
    }

    if (this.fixPointerEvents) {
      this.manualMousePoll(true)
    }
  }

  /**
   * Circumvent the lack of forwarded mouse events by polling mouse position with requestAnimationFrame
   * @param {boolean} once Don't request a next animationFrame
   * @returns {boolean} True if a element is found besides sinkholes or the main <html> element
   */
  private manualMousePoll(first = false): boolean {
    // HINT: you can manually stop the loop by incrementing manualPollingInstanceCount
    if (first) {
      this.manualPollingInstanceCount++
    }
    if (this.manualPollingInstanceCount > 1) {
      this.manualPollingInstanceCount--
      return null
    }

    // If the cursor is within content bounds, check the element it's hovering,
    //   emulate a MouseMove event with the element as target
    const { x, y } = this.electron.screen.getCursorScreenPoint()
    const { x: left, y: top, width, height } = this.electronWindow.getContentBounds()
    if (x >= left && x < left + width && y >= top && y < top + height) {
      const tgt = document.elementFromPoint(x - left, y - top)
      // HINT: update classList checks when expanding code
      if (tgt && !this.shouldIgnoreMouseEvents(tgt)) {
        this.onMouseEvent({ target: tgt })
        this.manualPollingInstanceCount--
        return true
      }
    }

    requestAnimationFrame(this.scopedManualPoll)
    return false
  }
}

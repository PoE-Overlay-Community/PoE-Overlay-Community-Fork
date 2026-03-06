import { Rectangle } from 'electron'
import { addon, windowManager } from 'node-window-manager'
import activeWin from 'active-win'

export interface Window {
  processId: number
  path: string
  title: () => string
  bounds: () => Rectangle
  bringToTop: any
}

// macos only - probably not needed for now
try {
  windowManager.requestAccessibility()
} catch (err) {
  console.warn('requestAccessibility() failed (expected on non-macOS):', err)
}

let platformLogged = false

export async function getActiveWindow(): Promise<Window> {
  try {
    let active: any
    let processId: number
    let path: string
    let bounds: () => Rectangle
    let title: () => string
    let bringToTop: any
    const isLinux = process.platform !== ('win32' || 'darwin')

    if (!platformLogged) {
      console.log(`[Window] platform=${process.platform}, isLinux=${isLinux}`)
      platformLogged = true
    }

    if (isLinux) {
      active = await activeWin()

      if (!active) {
        return undefined
      }

      processId = active.owner.processId
      path = active.owner.path
      bounds = () => active.bounds
      title = () => active.title
      bringToTop = undefined
    } else {
      active = windowManager.getActiveWindow()

      if (!active) {
        return undefined
      }

      processId = active.processId
      path = active.path
      bounds = () => addon.getWindowBounds(active.id)
      title = () => active.getTitle()
      bringToTop = () => active.bringToTop()
      // Debug logging moved to game.ts (throttled)
    }

    return {
      processId,
      path,
      bounds,
      title,
      bringToTop,
    }
  } catch (error) {
    console.warn('Could not get active window.', error)
    return undefined
  }
}

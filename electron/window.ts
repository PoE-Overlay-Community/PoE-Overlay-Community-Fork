import { Rectangle } from 'electron'
import { addon, windowManager } from 'node-window-manager'
import activeWin from 'active-win'

export interface Window {
  processId: number
  path: string
  title: () => string
  bounds: () => Rectangle
  bringToTop: () => void
}

export async function getActiveWindow(): Promise<Window> {
  try {
    if (process.platform === 'linux') {
      const active = await activeWin()

      if (!active) {
        return undefined
      }

      return {
        processId: active.owner.processId,
        path: active.owner.path,
        bounds: () => active.bounds,
        title: () => active.title,
        bringToTop: () => console.log('bring to top not supported on linux')
      }
    }

    if (process.platform === 'win32' || process.platform === 'darwin') {
      const active = windowManager.getActiveWindow()

      if (!active) {
        return undefined
      }

      return {
        processId: active.processId,
        path: active.path,
        bounds: () => addon.getWindowBounds(active.id),
        title: () => active.getTitle(),
        bringToTop: () => {
          windowManager.requestAccessibility()
          active.bringToTop()
        }
      }
    }

    throw new Error(`Platform not supported ${process.platform}`)
  } catch (error) {
    console.warn('Could not get active window.', error)
    return undefined
  }
}

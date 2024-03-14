import type { IpcMain } from 'electron'
import { uIOhook, UiohookKey } from 'uiohook-napi'

interface MouseWheelEvent {
  rotation: number
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
}

type MouseWheelFn = (event: MouseWheelEvent) => void

class Hook {
  private active = false
  private callback?: MouseWheelFn

  public enable(callback: MouseWheelFn): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      if (this.active) {
        resolve(false)
      } else {
        try {

          uIOhook.on('wheel', callback)

          this.active = true
          this.callback = callback

          resolve(true)
        } catch (error) {
          console.error('An unexpected error occured while registering iohook', error)
          reject(error)
        }
      }
    })
  }

  public disable(): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      if (!this.active) {
        resolve(false)
      } else {
        try {

          if (this.callback) {
            uIOhook.off('wheel', this.callback)
          }

          uIOhook.stop()

          this.callback = undefined
          this.active = false

          resolve(true)
        } catch (error) {
          console.error('An unexpected error occured while unregistering iohook', error)
          reject(error)
        }
      }
    })
  }
}

const hook = new Hook()

export function register(
  ipcMain: IpcMain,
  onEvent: (channel: string) => void,
  onError: (error: any) => void
): void {
  ipcMain.on('register-shortcut', (event, accelerator) => {
    switch (accelerator) {
      case 'CmdOrCtrl + MouseWheelUp':
      case 'CmdOrCtrl + MouseWheelDown':
        hook
          .enable((e) => {
            if (e.ctrlKey) {
              const channel = `shortcut-CmdOrCtrl + ${
                e.rotation === -1 ? 'MouseWheelUp' : 'MouseWheelDown'
              }`
              onEvent(channel)
            }
          })
          .then(
            (success) =>
              // tslint:disable-next-line:no-console
              success ? console.debug('Started CmdOrCtrl listening for Mousewheel-Events.') : null,
            (error) => onError(error)
          )
        break
      case 'Shift + MouseWheelUp':
      case 'Shift + MouseWheelDown':
        hook
          .enable((e) => {
            if (e.shiftKey) {
              const channel = `shortcut-Shift + ${
                e.rotation === -1 ? 'MouseWheelUp' : 'MouseWheelDown'
              }`
              onEvent(channel)
            }
          })
          .then(
            (success) =>
              // tslint:disable-next-line:no-console
              success ? console.debug('Started Shift listening for Mousewheel-Events.') : null,
            (error) => onError(error)
          )
        break
      case 'Alt + MouseWheelUp':
      case 'Alt + MouseWheelDown':
        hook
          .enable((e) => {
            if (e.altKey) {
              const channel = `shortcut-Alt + ${
                e.rotation === -1 ? 'MouseWheelUp' : 'MouseWheelDown'
              }`
              onEvent(channel)
            }
          })
          .then(
            (success) =>
              // tslint:disable-next-line:no-console
              success ? console.debug('Started Alt listening for Mousewheel-Events.') : null,
            (error) => onError(error)
          )
        break
      default:
        break
    }
    event.returnValue = true
  })

  ipcMain.on('unregister-shortcut', (event, accelerator) => {
    switch (accelerator) {
      case 'CmdOrCtrl + MouseWheelUp':
      case 'CmdOrCtrl + MouseWheelDown':
        hook.disable().then(
          (success) =>
            // tslint:disable-next-line:no-console
            success ? console.debug('Stopped CmdOrCtrl listening for Mousewheel-Events.') : null,
          (error) => onError(error)
        )
        break
      case 'Shift + MouseWheelUp':
      case 'Shift + MouseWheelDown':
        hook.disable().then(
          (success) =>
            // tslint:disable-next-line:no-console
            success ? console.debug('Stopped Shift listening for Mousewheel-Events.') : null,
          (error) => onError(error)
        )
        break
      case 'Alt + MouseWheelUp':
      case 'Alt + MouseWheelDown':
        hook.disable().then(
          (success) =>
            // tslint:disable-next-line:no-console
            success ? console.debug('Stopped Alt listening for Mousewheel-Events.') : null,
          (error) => onError(error)
        )
        break
      default:
        break
    }
    event.returnValue = true
  })
}

export function unregister(): void {
  hook.disable()
}

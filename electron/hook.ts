import { IpcMain } from 'electron'
import { uIOhook, UiohookWheelEvent } from 'uiohook-napi'

interface MouseWheelEvent {
  rotation: number
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
}

type MouseWheelFn = (event: MouseWheelEvent) => void

class Hook {
  private active = false
  private callback: MouseWheelFn = undefined
  private internalCallback: (event: UiohookWheelEvent) => void = undefined

  public enable(callback: MouseWheelFn): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.active) {
        resolve(false)
      } else {
        try {
          // Create internal callback that converts uiohook-napi event to our format
          this.internalCallback = (e: UiohookWheelEvent) => {
            const event: MouseWheelEvent = {
              // uiohook-napi: rotation > 0 = down, rotation < 0 = up
              // iohook used: rotation = -1 for up, rotation = 1 for down
              rotation: e.rotation > 0 ? 1 : -1,
              ctrlKey: e.ctrlKey,
              shiftKey: e.shiftKey,
              altKey: e.altKey,
            }
            callback(event)
          }

          uIOhook.on('wheel', this.internalCallback)
          uIOhook.start()

          this.active = true
          this.callback = callback

          resolve(true)
        } catch (error) {
          console.error('An unexpected error occurred while registering uiohook-napi', error)
          reject(error)
        }
      }
    })
  }

  public disable(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.active) {
        resolve(false)
      } else {
        try {
          if (this.internalCallback) {
            uIOhook.off('wheel', this.internalCallback)
          }

          uIOhook.stop()

          this.callback = undefined
          this.internalCallback = undefined
          this.active = false

          resolve(true)
        } catch (error) {
          console.error('An unexpected error occurred while unregistering uiohook-napi', error)
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

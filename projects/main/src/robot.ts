import type { IpcMain } from 'electron'
import robot from '@hurdlegroup/robotjs'

export function register(ipcMain: IpcMain): void {
  ipcMain.on('click-at', (event, button, position) => {
    if (position) {
      robot.updateScreenMetrics()
      robot.moveMouse(position.x, position.y)
    }
    robot.mouseClick(button, false)
    event.returnValue = true
  })

  ipcMain.on('move-to', (event, position) => {
    robot.updateScreenMetrics()
    robot.moveMouse(position.x, position.y)
    event.returnValue = true
  })

  ipcMain.on('mouse-pos', (event) => {
    event.returnValue = robot.getMousePos()
  })

  ipcMain.on('key-tap', (event, key, modifier) => {
    robot.keyTap(key, modifier)
    event.returnValue = true
  })

  ipcMain.on('key-toggle', (event, key, down, modifier) => {
    robot.keyToggle(key, down, modifier)
    event.returnValue = true
  })

  ipcMain.on('set-keyboard-delay', (event, delay) => {
    robot.setKeyboardDelay(delay)
    event.returnValue = true
  })
}

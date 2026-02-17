import { IpcMain } from 'electron'
import * as robot from '@jitsi/robotjs'

// Map Windows virtual key codes to @jitsi/robotjs key names.
// The old custom robotjs fork accepted numeric VK codes directly;
// @jitsi/robotjs requires string key names.
const VK_TO_KEY: { [code: number]: string } = {
  0x08: 'backspace',
  0x09: 'tab',
  0x0d: 'enter',
  0x1b: 'escape',
  0x20: 'space',
  0x25: 'left',
  0x26: 'up',
  0x27: 'right',
  0x28: 'down',
  0x2e: 'delete',
  0xa4: 'alt',    // VK_LMENU
  0xa5: 'alt',    // VK_RMENU
}

// Add a-z (0x41-0x5A) and 0-9 (0x30-0x39)
for (let i = 0x41; i <= 0x5a; i++) {
  VK_TO_KEY[i] = String.fromCharCode(i).toLowerCase()
}
for (let i = 0x30; i <= 0x39; i++) {
  VK_TO_KEY[i] = String.fromCharCode(i)
}

function toKeyName(key: number | string): string {
  if (typeof key === 'string') {
    return key
  }
  const name = VK_TO_KEY[key]
  if (!name) {
    console.warn(`Unknown virtual key code: 0x${key.toString(16)}`)
    return String.fromCharCode(key).toLowerCase()
  }
  return name
}

export function register(ipcMain: IpcMain): void {
  ipcMain.on('click-at', (event, button, position) => {
    if (position) {
      robot.moveMouse(position.x, position.y)
    }
    robot.mouseClick(button, false)
    event.returnValue = true
  })

  ipcMain.on('move-to', (event, position) => {
    robot.moveMouse(position.x, position.y)
    event.returnValue = true
  })

  ipcMain.on('mouse-pos', (event) => {
    event.returnValue = robot.getMousePos()
  })

  ipcMain.on('key-tap', (event, key, modifier) => {
    robot.keyTap(toKeyName(key), modifier)
    event.returnValue = true
  })

  ipcMain.on('key-toggle', (event, key, down, modifier) => {
    robot.keyToggle(toKeyName(key), down, modifier)
    event.returnValue = true
  })

  ipcMain.on('set-keyboard-delay', (event, delay) => {
    robot.setKeyboardDelay(delay)
    event.returnValue = true
  })
}

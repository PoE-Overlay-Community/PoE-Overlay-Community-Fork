import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  MenuItem,
  MenuItemConstructorOptions,
  screen,
  session,
  systemPreferences,
  Tray,
  Rectangle,
} from 'electron'
import path, { join } from 'path'
import url from 'url'
import * as launch from './auto-launch'
import * as update from './auto-updater'
import * as game from './game'
import * as hook from './hook'
import * as log from './log'
import * as robot from './robot'
import { State } from './state'
import { initialize, enable } from '@electron/remote/main'

// TODO: fix win?
initialize();

const VITE_DEV_SERVER_URL = import.meta.env.VITE_DEV_SERVER_URL || 'http://localhost:4200'
const args = process.argv.slice(1)

// tslint:disable-next-line:no-console
console.info(`App start args`, args)

const serve = args.some((val) => val === '--serve')
const debug = args.some((val) => val === '--dev')

import.meta.hot?.on('vite:afterUpdate', () => console.log('main afterUpdate'));
import.meta.hot?.on('vite:beforeFullReload', () => console.log('main beforeFullReload'));
import.meta.hot?.on('restart', () => console.log('restart'));
import.meta.hot?.on('reload', () => console.log('reload'));

if (!app.requestSingleInstanceLock()) {
  app.exit()
}

if (process.platform === 'win32' && !systemPreferences.isAeroGlassEnabled()) {
  dialog.showErrorBox(
    'Aero is required to run PoE Overlay',
    'Aero is currently disabled. Please enable Aero and try again.'
  )
  app.exit()
}

// TODO: deprecated
// app.allowRendererProcessReuse = false

app.commandLine.appendSwitch('high-dpi-support', 'true')
app.commandLine.appendSwitch('force-device-scale-factor', '1')

log.register(ipcMain)

// tslint:disable-next-line:no-console
console.info('App starting...')

const state = new State(app.getPath('userData'))
if (!state.hardwareAcceleration) {
  app.disableHardwareAcceleration()
  // tslint:disable-next-line:no-console
  console.info('App started with disabled hardware acceleration.')
}

let win: BrowserWindow | undefined
let tray: Tray
let menu: Menu
let downloadItem: MenuItem
let poeBounds: Rectangle

const childs: {
  [key: string]: BrowserWindow | undefined
} = {}

/* session */

function setUserAgent(): void {
  const generatedUserAgent = `PoEOverlayCommunityFork/${app.getVersion()} (contact: p.overlay.c.f@gmail.com)`
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = generatedUserAgent
    callback({ cancel: false, requestHeaders: details.requestHeaders })
  })
}

/* helper */

function getBounds(): Rectangle {
  const displays = screen.getAllDisplays()
  const primary = screen.getPrimaryDisplay();
  let bounds = {
    x: primary.bounds.x,
    y: primary.bounds.y,
    width: primary.bounds.width,
    height: primary.bounds.height,
  }
  displays.forEach((display) => {
    if (display.id !== primary.id) {
      if (bounds.x !== display.bounds.x) {
        bounds.x = Math.min(bounds.x, display.bounds.x)
        bounds.width += display.bounds.width
      }
      if (bounds.y !== display.bounds.y) {
        bounds.y = Math.min(bounds.y, display.bounds.y)
        bounds.height += display.bounds.height
      }
    }
  });
  return bounds
}

function send(channel: string, ...additionalArgs: any[]): void {
  try {
    win?.webContents.send(channel, ...additionalArgs)
  } catch (error) {
    console.error(`could not send to '${channel}' with args '${JSON.stringify(args)}`)
  }
}

launch.register(ipcMain)

update.register(ipcMain, (event, autoDownload) => {
  switch (event) {
    case update.AutoUpdaterEvent.UpdateAvailable:
      tray?.displayBalloon({
        iconType: 'info',
        title: 'New update available',
        content:
          'A new update is available. Will be automatically downloaded unless otherwise specified.',
      })
      if (!autoDownload && !downloadItem) {
        downloadItem = new MenuItem({
          label: 'Download Update',
          type: 'normal',
          click: () => {
            update.download()
            downloadItem.enabled = false
          },
        })
        menu?.insert(2, downloadItem)
      }
      break
    case update.AutoUpdaterEvent.UpdateDownloaded:
      tray?.displayBalloon({
        iconType: 'info',
        title: 'Update ready to install',
        content: 'The new update is now ready to install. Please relaunch your application.',
      })
      break
  }
  send(event)
})

robot.register(ipcMain)

game.register(ipcMain, (poe) => {
  send('game-active-change', serve ? true : poe.active)
  // send('game-active-change', poe.active);

  if (!win) {
    console.error("No BrowserWindow")
    return
  }

  if (!poe.active) {
    win.setAlwaysOnTop(false)
    win.setVisibleOnAllWorkspaces(false)
    return
  }

  if (process.platform === 'linux') {
    win.setAlwaysOnTop(true)
    win.maximize()
  } else {
    win.setAlwaysOnTop(true, 'pop-up-menu', 1)
    win.setVisibleOnAllWorkspaces(true)
  }

  if (poe.bounds) {
    poeBounds = poe.bounds
    send('game-bounds-change', poe.bounds)
  }

}, (logLine: string) => send('game-log-line', logLine))

hook.register(
  ipcMain,
  (event) => send(event),
  () => {
    dialog.showErrorBox(
      'Iohook is required to run PoE Overlay',
      'Iohook could not be loaded. Please make sure you have vc_redist installed and try again.'
    )
    app.quit()
  }
)

/* general */

ipcMain.on('app-version', (event) => {
  event.returnValue = app.getVersion()
})

ipcMain.on('main-window-bounds', (event) => {
  const windowBounds = win?.getBounds()
  event.returnValue = [windowBounds, poeBounds || windowBounds]
})

/* changelog */

function showChangelog(): void {
  const changelog = new BrowserWindow({
    modal: true,
    parent: win,
  })
  changelog.removeMenu()
  changelog.loadURL(
    'https://github.com/PoE-Overlay-Community/PoE-Overlay-Community-Fork/blob/master/CHANGELOG.md#Changelog'
  )
}

/* main window */
function createWindow(): BrowserWindow {
  const bounds = getBounds()

  // Create the browser window.
  win = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    enableLargerThanScreen: true,
    transparent: true,
    frame: false,
    resizable: false,
    movable: false,
    webPreferences: {
      nodeIntegration: true, // TODO: false
      allowRunningInsecureContent: serve,
      webSecurity: false,
      contextIsolation: false, // TODO: true
      sandbox: false, // TODO: true
      webviewTag: false, // The webview tag is not recommended. Consider alternatives like an iframe or Electron's BrowserView. @see https://www.electronjs.org/docs/latest/api/webview-tag#warning
      preload: join(app.getAppPath(), 'dist/preload/index.mjs'),
    },
    focusable: process.platform === 'linux',
    skipTaskbar: true,
    show: false,
  })

  enable(win.webContents)

  win.setSize(bounds.width, bounds.height)    // Explicitly set size after creating the window since some OS'es don't allow an initial size larger than the display's size.
  win.removeMenu()
  win.setIgnoreMouseEvents(true, {forward: true})

  if (process.platform !== 'linux') {
    win.setAlwaysOnTop(true, 'pop-up-menu', 1)
  } else {
    win.setAlwaysOnTop(true)
  }

  win.setVisibleOnAllWorkspaces(true)

  win.once('show', () => {
    if (state.isVersionUpdated(app.getVersion())) {
      showChangelog()
    }
  })

  win.webContents.on('devtools-opened', () => win?.setIgnoreMouseEvents(true, {forward: true}))

  loadApp(win, '')

  win.on('closed', () => {
    win = undefined
  })

  return win
}

/* modal window */

ipcMain.on('open-route', (event, route: string) => {
  const routeWin = childs[route]

  try {
    const isThread = route.endsWith('-thread')
    if (!routeWin) {
       const newWin = new BrowserWindow({
        width: 1210,
        height: 700,
        frame: false,
        resizable: true,
        movable: true,
        webPreferences: {
          nodeIntegration: true, // TODO: false
          allowRunningInsecureContent: serve,
          webSecurity: false,
          contextIsolation: false, // TODO: true
          sandbox: false, // TODO: true
          webviewTag: false, // The webview tag is not recommended. Consider alternatives like an iframe or Electron's BrowserView. @see https://www.electronjs.org/docs/latest/api/webview-tag#warning
          preload: join(app.getAppPath(), 'dist/preload/index.mjs'),
        },
        center: true,
        transparent: true,
        show: !isThread,
        skipTaskbar: isThread,
        focusable: !isThread,
        closable: !isThread,
      })

      enable(newWin.webContents)

      newWin.removeMenu()

      // TODO: remote

      childs[route] = newWin
      newWin.once('closed', () => {
        childs[route] = undefined
        win?.moveTop()
        event.reply('open-route-reply', 'close')
      })

      loadApp(newWin, `#/${route}`)
      
      return
    }
    
    if (!isThread) {
      if (routeWin.isMinimized()) {
        routeWin.restore()
      }
      routeWin.show()
    }
  } catch (error) {
    event.reply('open-route-reply', error)
  }
})

function loadApp(self: BrowserWindow, route: string): void {
  if (serve) {
    self.loadURL(VITE_DEV_SERVER_URL + route)
    self.webContents.openDevTools({ mode: 'undocked' })
  } else {
    const appUrl = url.format({
      pathname: path.join(app.getAppPath(), 'dist/renderer/browser', 'index.html'),
      protocol: 'file:',
      slashes: true,
    })
    self.loadURL(appUrl + route)
  }
}

/* tray */

function createTray(): Tray {
  const iconFile = /^win/.test(process.platform) ? 'favicon.ico' : 'favicon.png'
  const iconPath = path.join(app.getAppPath(), 'dist/renderer/browser', iconFile)

  tray = new Tray(iconPath)

  const items: MenuItemConstructorOptions[] = [
    {
      label: 'Settings',
      type: 'normal',
      click: () => {
        console.log('settings clicked')
        send('show-user-settings')
      }
    },
    {
      label: 'Reset Zoom',
      type: 'normal',
      click: () => send('reset-zoom'),
    },
    {
      label: 'Relaunch',
      type: 'normal',
      click: () => send('app-relaunch'),
    },
    {
      label: 'Hardware Acceleration',
      type: 'checkbox',
      checked: state.hardwareAcceleration,
      click: () => {
        state.hardwareAcceleration = !state.hardwareAcceleration
        send('app-relaunch')
      },
    },
    {
      label: 'Changelog',
      type: 'normal',
      click: () => showChangelog(),
    },
    {
      label: 'Exit',
      type: 'normal',
      click: () => send('app-quit'),
    },
  ]

  if (serve) {
    items.splice(1, 0, {
      label: 'Ignore Mouse Events',
      type: 'normal',
      click: () => win?.setIgnoreMouseEvents(true),
    })
  }
  if (debug || serve) {
    items.splice(1, 0, {
      label: 'Open Dev Tools',
      type: 'normal',
      click: () => {
        if (!win) { // win?
          return
        }
        if (win.webContents.isDevToolsOpened()) {
          win.webContents.closeDevTools()
          for (const child in childs) {
            childs[child]?.webContents.closeDevTools()
          }
        } else {
          win.webContents.openDevTools({ mode: 'undocked' })
          for (const child in childs) {
            childs[child]?.webContents.openDevTools({ mode: 'undocked' })
          }

          // Electron bug workaround: this must be triggered after the devtools loaded
          win.setIgnoreMouseEvents(true, { forward: true })
        }
      },
    })
  }

  menu = Menu.buildFromTemplate(items)
  tray.setToolTip(`PoE Overlay: ${app.getVersion()}`)
  tray.setContextMenu(menu)
  tray.on('double-click', () => win?.webContents.send('show-user-settings'))
  return tray
}

try {
  app.on('ready', () => {
    /* delay create window in order to support transparent windows at linux. */
    setTimeout(() => {
      createWindow()
      createTray()
    }, 300)
    setUserAgent()
  })

  app.on('window-all-closed', () => {
    hook.unregister()
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('activate', () => {
    if (win === null) {
      createWindow()
    }
  })
} catch (e) {
  console.error('got a fatal error', e)
  // Catch Error
  // throw e;
}

import {
  app,
  BrowserWindow,
  clipboard,
  dialog,
  globalShortcut,
  ipcMain,
  Menu,
  MenuItem,
  MenuItemConstructorOptions,
  screen,
  session,
  shell,
  systemPreferences,
  Tray,
  Rectangle,
} from 'electron'
import * as path from 'path'
import * as url from 'url'
import * as launch from './electron/auto-launch'
import * as update from './electron/auto-updater'
import * as game from './electron/game'
import * as hook from './electron/hook'
import * as log from './electron/log'
import * as robot from './electron/robot'
import { State } from './electron/state'

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

app.commandLine.appendSwitch('high-dpi-support', 'true')
app.commandLine.appendSwitch('force-device-scale-factor', '1')

log.register(ipcMain)

process.on('unhandledRejection', (reason) => {
  console.warn('Unhandled promise rejection:', reason)
})

// tslint:disable-next-line:no-console
console.info('App starting...')

const state = new State(app.getPath('userData'))
if (!state.hardwareAcceleration) {
  app.disableHardwareAcceleration()
  // tslint:disable-next-line:no-console
  console.info('App started with disabled hardware acceleration.')
}

const args = process.argv.slice(1)
// tslint:disable-next-line:no-console
console.info('App args', args)

const serve = args.some((val) => val === '--serve')
const debug = args.some((val) => val === '--dev')

let win: BrowserWindow = null
let tray: Tray = null
let menu: Menu = null
let downloadItem: MenuItem = null
let poeBounds: Rectangle = null

const childs: {
  [key: string]: BrowserWindow
} = {}

/* session */

function setUserAgent(): void {
  const generatedUserAgent = `PoEOverlayCommunityFork/${app.getVersion()} (contact: p.overlay.c.f@gmail.com)`
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    // Only override UA for API requests; let page loads use the default Chromium UA
    // so Cloudflare doesn't block them
    const isApiRequest = details.url.includes('/api/') || details.resourceType === 'xhr'
    if (isApiRequest) {
      details.requestHeaders['User-Agent'] = generatedUserAgent
    }
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
    if (channel === 'game-active-change') {
      console.log(`[Main] send('game-active-change', ${JSON.stringify(additionalArgs)})`)
    }
    win.webContents.send(channel, ...additionalArgs)
  } catch (error) {
    console.error(`could not send to '${channel}' with args '${JSON.stringify(additionalArgs)}'`)
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
  console.log(`[Main] game onUpdate: active=${poe.active}, bounds=${JSON.stringify(poe.bounds)}`)
  send('game-active-change', serve ? true : !!poe.active)

  if (win) {
    if (poe.active) {
      if (process.platform !== 'linux') {
        win.setAlwaysOnTop(true, 'pop-up-menu', 1)
        win.setVisibleOnAllWorkspaces(true)
      } else {
        win.setAlwaysOnTop(true)
        win.maximize()
      }

      if (poe.bounds) {
        poeBounds = poe.bounds
        send('game-bounds-change', poe.bounds)
      }
    } else {
      win.setAlwaysOnTop(false)
      win.setVisibleOnAllWorkspaces(false)
    }
  }
}, (logLine: string) => send('game-log-line', logLine))

hook.register(
  ipcMain,
  (event) => send(event),
  () => {
    dialog.showErrorBox(
      'Input hook is required to run PoE Overlay',
      'uiohook-napi could not be loaded. Please make sure you have vc_redist installed and try again.'
    )
    app.quit()
  }
)

/* general */

ipcMain.on('app-version', (event) => {
  event.returnValue = app.getVersion()
})

ipcMain.on('main-window-bounds', (event) => {
  const windowBounds = win.getBounds()
  event.returnValue = [windowBounds, poeBounds || windowBounds]
})

/* App controls */

ipcMain.on('app-exit', () => {
  app.exit()
})

ipcMain.on('app-relaunch-now', () => {
  app.relaunch()
  app.exit()
})

/* Clipboard operations */

ipcMain.on('clipboard-read-text', (event) => {
  event.returnValue = clipboard.readText()
})

ipcMain.on('clipboard-write-text', (_, text: string) => {
  clipboard.writeText(text)
})

/* Shell operations */

ipcMain.on('shell-open-external', (_, externalUrl: string) => {
  if (typeof externalUrl === 'string') {
    shell.openExternal(externalUrl).catch((err) => {
      console.warn('Failed to open external URL:', err?.message || err)
    })
  }
})

/* Screen operations */

ipcMain.on('get-cursor-screen-point', (event) => {
  event.returnValue = screen.getCursorScreenPoint()
})

/* Window management operations */

ipcMain.on('get-current-window-bounds', (event) => {
  const webContents = event.sender
  const browserWindow = BrowserWindow.fromWebContents(webContents)
  event.returnValue = browserWindow?.getBounds() ?? { x: 0, y: 0, width: 0, height: 0 }
})

ipcMain.on('set-ignore-mouse-events', (event, ignore: boolean, options?: { forward: boolean }) => {
  const webContents = event.sender
  const browserWindow = BrowserWindow.fromWebContents(webContents)
  if (browserWindow) {
    browserWindow.setIgnoreMouseEvents(ignore, options)
  }
})

ipcMain.on('window-show', (event) => {
  console.log('[Main] window-show')
  const webContents = event.sender
  const browserWindow = BrowserWindow.fromWebContents(webContents)
  if (browserWindow) {
    browserWindow.showInactive()
  }
})

ipcMain.on('window-hide', (event) => {
  console.log('[Main] window-hide')
  const webContents = event.sender
  const browserWindow = BrowserWindow.fromWebContents(webContents)
  browserWindow?.hide()
})

ipcMain.on('window-focus', (event) => {
  const webContents = event.sender
  const browserWindow = BrowserWindow.fromWebContents(webContents)
  browserWindow?.focus()
})

ipcMain.on('window-blur', (event) => {
  const webContents = event.sender
  const browserWindow = BrowserWindow.fromWebContents(webContents)
  browserWindow?.blur()
})

ipcMain.on('window-minimize', (event) => {
  const webContents = event.sender
  const browserWindow = BrowserWindow.fromWebContents(webContents)
  browserWindow?.minimize()
})

ipcMain.on('window-restore', (event) => {
  const webContents = event.sender
  const browserWindow = BrowserWindow.fromWebContents(webContents)
  browserWindow?.restore()
})

ipcMain.on('window-close', (event) => {
  const webContents = event.sender
  const browserWindow = BrowserWindow.fromWebContents(webContents)
  browserWindow?.close()
})

ipcMain.on('window-set-focusable', (event, focusable: boolean) => {
  const webContents = event.sender
  const browserWindow = BrowserWindow.fromWebContents(webContents)
  browserWindow?.setFocusable(focusable)
})

ipcMain.on('window-set-skip-taskbar', (event, skip: boolean) => {
  const webContents = event.sender
  const browserWindow = BrowserWindow.fromWebContents(webContents)
  browserWindow?.setSkipTaskbar(skip)
})

ipcMain.on('window-move-top', (event) => {
  const webContents = event.sender
  const browserWindow = BrowserWindow.fromWebContents(webContents)
  browserWindow?.moveTop()
})

ipcMain.on('window-set-enabled', (event, enabled: boolean) => {
  const webContents = event.sender
  const browserWindow = BrowserWindow.fromWebContents(webContents)
  browserWindow?.setEnabled(enabled)
})

ipcMain.on('window-set-size', (event, width: number, height: number) => {
  const webContents = event.sender
  const browserWindow = BrowserWindow.fromWebContents(webContents)
  browserWindow?.setSize(width, height)
})

ipcMain.on('window-get-size', (event) => {
  const webContents = event.sender
  const browserWindow = BrowserWindow.fromWebContents(webContents)
  event.returnValue = browserWindow?.getSize() ?? [0, 0]
})

ipcMain.on('window-get-content-bounds', (event) => {
  const webContents = event.sender
  const browserWindow = BrowserWindow.fromWebContents(webContents)
  event.returnValue = browserWindow?.getContentBounds() ?? { x: 0, y: 0, width: 0, height: 0 }
})

ipcMain.on('get-zoom-factor', (event) => {
  const webContents = event.sender
  event.returnValue = webContents.zoomFactor
})

ipcMain.on('set-zoom-factor', (event, factor: number) => {
  const webContents = event.sender
  webContents.zoomFactor = factor
})

ipcMain.on('window-set-always-on-top', (event, flag: boolean, level?: string, relativeLevel?: number) => {
  const webContents = event.sender
  const browserWindow = BrowserWindow.fromWebContents(webContents)
  if (browserWindow) {
    if (level) {
      browserWindow.setAlwaysOnTop(flag, level as any, relativeLevel)
    } else {
      browserWindow.setAlwaysOnTop(flag)
    }
  }
})

ipcMain.on('window-set-visible-all-workspaces', (event, visible: boolean) => {
  const webContents = event.sender
  const browserWindow = BrowserWindow.fromWebContents(webContents)
  if (browserWindow) {
    browserWindow.setVisibleOnAllWorkspaces(visible)
  }
})

/* Global shortcuts */

ipcMain.on('register-shortcut', (event, accelerator: string) => {
  try {
    const result = globalShortcut.register(accelerator, () => {
      console.log(`[Main] shortcut triggered: ${accelerator}`)
      event.sender.send(`shortcut-${accelerator}`)
    })
    console.log(`[Main] register-shortcut: ${accelerator} => ${result}`)
    event.returnValue = result
  } catch (error) {
    console.error(`Failed to register shortcut: ${accelerator}`, error)
    event.returnValue = false
  }
})

ipcMain.on('unregister-shortcut', (event, accelerator: string) => {
  try {
    console.log(`[Main] unregister-shortcut: ${accelerator}`)
    globalShortcut.unregister(accelerator)
  } catch (error) {
    console.error(`Failed to unregister shortcut: ${accelerator}`, error)
  }
  event.returnValue = undefined
})

/* Browser window management for BrowserService */

const browserWindows: Map<number, BrowserWindow> = new Map()
let browserWindowIdCounter = 0

ipcMain.on('create-browser-window', (event, options: any) => {
  const parentWebContents = event.sender
  const parent = BrowserWindow.fromWebContents(parentWebContents)

  const browserWindow = new BrowserWindow({
    ...options,
    parent: options.useParent ? parent : undefined,
    webPreferences: {
      ...options.webPreferences,
      webSecurity: false,
    },
  })

  const id = ++browserWindowIdCounter
  browserWindows.set(id, browserWindow)

  browserWindow.once('closed', () => {
    browserWindows.delete(id)
    parentWebContents.send('browser-window-closed', id)
  })

  browserWindow.once('ready-to-show', () => {
    parentWebContents.send('browser-window-ready', id)
  })

  browserWindow.webContents.once('did-finish-load', () => {
    parentWebContents.send('browser-window-did-finish-load', id)
  })

  event.returnValue = id
})

ipcMain.on('close-browser-window', (_, id: number) => {
  const browserWindow = browserWindows.get(id)
  if (browserWindow) {
    browserWindow.close()
  }
})

ipcMain.on('load-url-browser-window', (_, id: number, urlToLoad: string) => {
  const browserWindow = browserWindows.get(id)
  if (browserWindow) {
    browserWindow.loadURL(urlToLoad).catch((err) => {
      console.warn('Failed to load URL in browser window:', err?.message || err)
    })
  }
})

ipcMain.on('show-browser-window', (_, id: number) => {
  const browserWindow = browserWindows.get(id)
  browserWindow?.show()
})

ipcMain.on('set-browser-window-zoom', (_, id: number, zoomFactor: number) => {
  const browserWindow = browserWindows.get(id)
  if (browserWindow) {
    browserWindow.webContents.zoomFactor = zoomFactor
  }
})

/* Cross-window IPC forwarding for periodic update thread */

// Forward thread control messages between main window and periodic-update-thread
const crossWindowChannels = [
  'thread-pause',
  'thread-available',
  'settings-changed',
  'poe-account-updated',
  'stash-tab-info-changed',
  'stash-periodic-update-active-changed',
  'get-vendor-recipes',
  'vendor-recipes',
]

crossWindowChannels.forEach((channel) => {
  ipcMain.on(channel, (event, ...forwardArgs) => {
    const senderWindow = BrowserWindow.fromWebContents(event.sender)
    // Forward to all other windows
    const allWindows = BrowserWindow.getAllWindows()
    for (const browserWindow of allWindows) {
      if (browserWindow !== senderWindow && !browserWindow.isDestroyed()) {
        browserWindow.webContents.send(channel, ...forwardArgs)
      }
    }
  })
})

/* Cross-window IPC forwarding for trade companion and stash grid */

// Forward trade notification example requests from settings window to main window
ipcMain.on('trade-notification-add-example', (event, exampleNotificationType: any) => {
  // Forward to main window
  if (win) {
    win.webContents.send('trade-notification-add-example', exampleNotificationType)
  }
})

// Forward stash grid options from settings window to main window
ipcMain.on('stash-grid-options', (event, stashGridOptions: any) => {
  const senderWindow = BrowserWindow.fromWebContents(event.sender)
  // Store the sender for reply
  const stashGridSender = senderWindow
  // Forward to main window
  if (win && senderWindow !== win) {
    win.webContents.send('stash-grid-options', stashGridOptions, event.sender.id)
  } else if (win && senderWindow === win) {
    // Main window is handling it locally - no need to forward
    win.webContents.send('stash-grid-options-local', stashGridOptions)
  }
})

// Handle stash grid reply from main window to settings window
ipcMain.on('stash-grid-options-reply', (event, stashGridBounds: any, originalSenderId?: number) => {
  // Find the original sender and reply to them
  if (originalSenderId) {
    const allWindows = BrowserWindow.getAllWindows()
    for (const browserWindow of allWindows) {
      if (browserWindow.webContents.id === originalSenderId) {
        browserWindow.webContents.send('stash-grid-options-reply', stashGridBounds)
        break
      }
    }
  }
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
  ).catch((err) => {
    console.warn('Failed to load changelog:', err?.message || err)
  })
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
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'electron/preload.js'),
      allowRunningInsecureContent: serve,
      webSecurity: false,
      sandbox: false,
    },
    focusable: process.platform !== 'linux' ? false : true,
    skipTaskbar: true,
    show: false,
  })
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

  loadApp(win)

  win.on('closed', () => {
    win = null
  })

  if (serve) {
    // Electron bug workaround: this must be triggered after the devtools loaded
    win.setIgnoreMouseEvents(true, { forward: true })
  }

  return win
}

/* modal window */

ipcMain.on('open-route', (event, route: string) => {
  try {
    const isThread = route.endsWith('-thread')
    if (!childs[route]) {
      childs[route] = new BrowserWindow({
        width: 1210,
        height: 700,
        frame: false,
        resizable: true,
        movable: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          preload: path.join(__dirname, 'electron/preload.js'),
          allowRunningInsecureContent: serve,
          webSecurity: false,
          sandbox: false,
        },
        center: true,
        transparent: true,
        show: !isThread,
        skipTaskbar: isThread,
        focusable: !isThread,
        closable: !isThread,
      })

      childs[route].removeMenu()

      childs[route].once('closed', () => {
        childs[route] = null
        try {
          win?.moveTop()
          event.reply('open-route-reply', 'close')
        } catch (err) {
          // sender webContents may be destroyed
        }
      })

      loadApp(childs[route], `#/${route}`)
    } else if (!isThread) {
      if (childs[route].isMinimized()) {
        childs[route].restore()
      }
      childs[route].show()
    }
  } catch (error) {
    event.reply('open-route-reply', error)
  }
})

function loadApp(self: BrowserWindow, route: string = ''): void {
  if (serve) {
    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/node_modules/electron`),
    })
    self.loadURL('http://localhost:4200' + route).catch((err) => {
      console.warn('Failed to load dev URL:', err?.message || err)
    })
    self.webContents.openDevTools({ mode: 'undocked' })
  } else {
    const appUrl = url.format({
      pathname: path.join(__dirname, 'dist/index.html'),
      protocol: 'file:',
      slashes: true,
    })
    self.loadURL(appUrl + route).catch((err) => {
      console.warn('Failed to load app URL:', err?.message || err)
    })
  }
}

/* tray */

function createTray(): Tray {
  const iconFolder = serve ? 'src' : 'dist'
  const iconFile = /^win/.test(process.platform) ? 'favicon.ico' : 'favicon.png'
  tray = new Tray(path.join(__dirname, iconFolder, iconFile))

  const items: MenuItemConstructorOptions[] = [
    {
      label: 'Settings',
      type: 'normal',
      click: () => send('show-user-settings'),
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
      click: () => win.setIgnoreMouseEvents(true),
    })
  }
  if (debug || serve) {
    items.splice(1, 0, {
      label: 'Open Dev Tools',
      type: 'normal',
      click: () => {
        if (win.webContents.isDevToolsOpened()) {
          win.webContents.closeDevTools()
          for (const child in childs) {
            childs[child].webContents.closeDevTools()
          }
        } else {
          win.webContents.openDevTools({ mode: 'undocked' })
          for (const child in childs) {
            childs[child].webContents.openDevTools({ mode: 'undocked' })
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
  tray.on('double-click', () => send('show-user-settings'))
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
  // Catch Error
  // throw e;
}

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

// Define the API to expose to the renderer process
const electronAPI = {
  // App
  getVersion: (): string => ipcRenderer.sendSync('app-version'),
  relaunch: (): void => ipcRenderer.send('app-relaunch'),
  quit: (): void => ipcRenderer.send('app-quit'),
  exit: (): void => ipcRenderer.send('app-exit'),

  // Auto-updater
  initDownload: (autoDownload: boolean): void => ipcRenderer.sendSync('app-download-init', autoDownload),
  setAutoDownload: (autoDownload: boolean): void => ipcRenderer.sendSync('app-download-auto', autoDownload),
  quitAndInstall: (silent: boolean): void => ipcRenderer.send('app-quit-and-install', silent),

  // Auto-launch
  isAutoLaunchEnabled: (): void => ipcRenderer.send('app-auto-launch-enabled'),
  setAutoLaunchEnabled: (enabled: boolean): void => ipcRenderer.send('app-auto-launch-change', enabled),

  // Window management
  getMainWindowBounds: (): any => ipcRenderer.sendSync('main-window-bounds'),
  getCurrentWindowBounds: (): any => ipcRenderer.sendSync('get-current-window-bounds'),
  setIgnoreMouseEvents: (ignore: boolean, options?: { forward: boolean }): void =>
    ipcRenderer.send('set-ignore-mouse-events', ignore, options),
  windowShow: (): void => ipcRenderer.send('window-show'),
  windowHide: (): void => ipcRenderer.send('window-hide'),
  windowFocus: (): void => ipcRenderer.send('window-focus'),
  windowBlur: (): void => ipcRenderer.send('window-blur'),
  windowMinimize: (): void => ipcRenderer.send('window-minimize'),
  windowRestore: (): void => ipcRenderer.send('window-restore'),
  windowClose: (): void => ipcRenderer.send('window-close'),
  windowSetFocusable: (focusable: boolean): void => ipcRenderer.send('window-set-focusable', focusable),
  windowSetSkipTaskbar: (skip: boolean): void => ipcRenderer.send('window-set-skip-taskbar', skip),
  windowMoveTop: (): void => ipcRenderer.send('window-move-top'),
  windowSetEnabled: (enabled: boolean): void => ipcRenderer.send('window-set-enabled', enabled),
  windowSetSize: (width: number, height: number): void => ipcRenderer.send('window-set-size', width, height),
  windowGetSize: (): number[] => ipcRenderer.sendSync('window-get-size'),
  windowGetContentBounds: (): any => ipcRenderer.sendSync('window-get-content-bounds'),
  getZoomFactor: (): number => ipcRenderer.sendSync('get-zoom-factor'),
  setZoomFactor: (factor: number): void => ipcRenderer.send('set-zoom-factor', factor),

  // Clipboard
  clipboardReadText: (): string => ipcRenderer.sendSync('clipboard-read-text'),
  clipboardWriteText: (text: string): void => ipcRenderer.send('clipboard-write-text', text),

  // Shell
  shellOpenExternal: (url: string): void => ipcRenderer.send('shell-open-external', url),

  // Screen
  getCursorScreenPoint: (): { x: number; y: number } => ipcRenderer.sendSync('get-cursor-screen-point'),

  // Global shortcuts
  registerGlobalShortcut: (accelerator: string): boolean =>
    ipcRenderer.sendSync('register-shortcut', accelerator),
  unregisterGlobalShortcut: (accelerator: string): void =>
    ipcRenderer.sendSync('unregister-shortcut', accelerator),

  // Game
  sendGameActiveChange: (): void => ipcRenderer.sendSync('game-send-active-change'),
  gameFocus: (): void => ipcRenderer.sendSync('game-focus'),

  // Window always on top
  windowSetAlwaysOnTop: (flag: boolean, level?: string, relativeLevel?: number): void =>
    ipcRenderer.send('window-set-always-on-top', flag, level, relativeLevel),
  windowSetVisibleOnAllWorkspaces: (visible: boolean): void =>
    ipcRenderer.send('window-set-visible-all-workspaces', visible),

  // Logger
  log: (level: string, message: string, ...args: any[]): void =>
    ipcRenderer.sendSync('log', level, message, ...args),

  // Keyboard
  setKeyboardDelay: (delay: number): void => ipcRenderer.sendSync('set-keyboard-delay', delay),
  keyTap: (code: number, modifiers: string[]): void =>
    ipcRenderer.sendSync('key-tap', code, modifiers),
  keyToggle: (code: number, direction: string, modifiers: string[]): void =>
    ipcRenderer.sendSync('key-toggle', code, direction, modifiers),

  // Mouse
  mouseClick: (button: string, position?: { x: number; y: number }): void =>
    ipcRenderer.sendSync('click-at', button, position),
  mouseMove: (position: { x: number; y: number }): void =>
    ipcRenderer.sendSync('move-to', position),
  mousePosition: (): { x: number; y: number } => ipcRenderer.sendSync('mouse-pos'),

  // Routes/windows
  openRoute: (route: string): void => ipcRenderer.send('open-route', route),

  // Browser windows (for browser.service.ts)
  createBrowserWindow: (options: any): number => ipcRenderer.sendSync('create-browser-window', options),
  closeBrowserWindow: (id: number): void => ipcRenderer.send('close-browser-window', id),
  loadUrlInBrowserWindow: (id: number, url: string): void =>
    ipcRenderer.send('load-url-browser-window', id, url),

  // IPC event listeners
  on: (channel: string, callback: (event: IpcRendererEvent, ...args: any[]) => void): void => {
    // Whitelist of allowed channels
    const validChannels = [
      'app-update-available',
      'app-update-downloaded',
      'app-relaunch',
      'app-quit',
      'app-auto-launch-enabled-result',
      'app-auto-launch-change-result',
      'game-active-change',
      'game-bounds-change',
      'game-log-line',
      'show-user-settings',
      'reset-zoom',
      'open-route-reply',
      'shortcut-',
      'window-focus',
      'window-blur',
      'poe-account-updated',
      'stash-tab-info-changed',
      'stash-periodic-update-active-changed',
      'vendor-recipes',
      'get-vendor-recipes',
      // Cross-window IPC for trade companion and stash grid
      'trade-notification-add-example',
      'stash-grid-options',
      'stash-grid-options-reply',
      'closed',
    ]
    // Allow shortcut channels dynamically
    if (validChannels.some((valid) => channel === valid || channel.startsWith('shortcut-'))) {
      ipcRenderer.on(channel, callback)
    }
  },

  once: (channel: string, callback: (event: IpcRendererEvent, ...args: any[]) => void): void => {
    const validChannels = [
      'app-auto-launch-enabled-result',
      'app-auto-launch-change-result',
      'open-route-reply',
      'browser-window-ready',
      'browser-window-closed',
      'browser-window-did-finish-load',
      // Cross-window IPC
      'stash-grid-options-reply',
      'closed',
    ]
    if (validChannels.includes(channel)) {
      ipcRenderer.once(channel, callback)
    }
  },

  removeListener: (channel: string, callback: (...args: any[]) => void): void => {
    ipcRenderer.removeListener(channel, callback)
  },

  removeAllListeners: (channel: string): void => {
    ipcRenderer.removeAllListeners(channel)
  },

  send: (channel: string, ...args: any[]): void => {
    const validChannels = [
      'poe-account-updated',
      'stash-tab-info-changed',
      'stash-periodic-update-active-changed',
      'vendor-recipes',
      'log',
      // Cross-window IPC for trade companion and stash grid
      'trade-notification-add-example',
      'stash-grid-options',
      'stash-grid-options-reply',
      'set-browser-window-zoom',
      'show-browser-window',
    ]
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, ...args)
    }
  },

  invoke: async (channel: string, ...args: any[]): Promise<any> => {
    const validChannels = ['get-vendor-recipes']
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args)
    }
    return undefined
  },
}

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// Type declaration for the exposed API
export type ElectronAPI = typeof electronAPI

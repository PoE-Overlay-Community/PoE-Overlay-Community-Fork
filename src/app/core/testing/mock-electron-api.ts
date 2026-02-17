import { ElectronAPI } from '@app/type/electron-api.type'

export type MockElectronAPIOverrides = Partial<ElectronAPI>

export interface MockElectronAPI extends ElectronAPI {
  _registeredListeners: Map<string, Array<(event: any, ...args: any[]) => void>>
  _triggerEvent(channel: string, ...args: any[]): void
  _reset(): void
}

export function createMockElectronAPI(overrides: MockElectronAPIOverrides = {}): MockElectronAPI {
  const listeners = new Map<string, Array<(event: any, ...args: any[]) => void>>()

  const mockAPI: MockElectronAPI = {
    _registeredListeners: listeners,

    _triggerEvent(channel: string, ...args: any[]): void {
      const channelListeners = listeners.get(channel) || []
      channelListeners.forEach((listener) => listener({}, ...args))
    },

    _reset(): void {
      listeners.clear()
      Object.keys(spies).forEach((key) => {
        const spy = spies[key as keyof typeof spies]
        if (spy && typeof spy.calls?.reset === 'function') {
          spy.calls.reset()
        }
      })
    },

    // App
    getVersion: jasmine.createSpy('getVersion').and.returnValue('0.8.39'),
    relaunch: jasmine.createSpy('relaunch'),
    quit: jasmine.createSpy('quit'),
    exit: jasmine.createSpy('exit'),

    // Auto-updater
    initDownload: jasmine.createSpy('initDownload'),
    setAutoDownload: jasmine.createSpy('setAutoDownload'),
    quitAndInstall: jasmine.createSpy('quitAndInstall'),

    // Auto-launch
    isAutoLaunchEnabled: jasmine.createSpy('isAutoLaunchEnabled'),
    setAutoLaunchEnabled: jasmine.createSpy('setAutoLaunchEnabled'),

    // Window management
    getMainWindowBounds: jasmine.createSpy('getMainWindowBounds').and.returnValue([
      { x: 0, y: 0, width: 1920, height: 1080 },
      { x: 0, y: 0, width: 1920, height: 1080 },
    ]),
    getCurrentWindowBounds: jasmine
      .createSpy('getCurrentWindowBounds')
      .and.returnValue({ x: 0, y: 0, width: 1920, height: 1080 }),
    setIgnoreMouseEvents: jasmine.createSpy('setIgnoreMouseEvents'),
    windowShow: jasmine.createSpy('windowShow'),
    windowHide: jasmine.createSpy('windowHide'),
    windowFocus: jasmine.createSpy('windowFocus'),
    windowBlur: jasmine.createSpy('windowBlur'),
    windowMinimize: jasmine.createSpy('windowMinimize'),
    windowRestore: jasmine.createSpy('windowRestore'),
    windowClose: jasmine.createSpy('windowClose'),
    windowSetFocusable: jasmine.createSpy('windowSetFocusable'),
    windowSetSkipTaskbar: jasmine.createSpy('windowSetSkipTaskbar'),
    windowMoveTop: jasmine.createSpy('windowMoveTop'),
    windowSetEnabled: jasmine.createSpy('windowSetEnabled'),
    windowSetSize: jasmine.createSpy('windowSetSize'),
    windowGetSize: jasmine.createSpy('windowGetSize').and.returnValue([1920, 1080]),
    windowGetContentBounds: jasmine
      .createSpy('windowGetContentBounds')
      .and.returnValue({ x: 0, y: 0, width: 1920, height: 1080 }),
    getZoomFactor: jasmine.createSpy('getZoomFactor').and.returnValue(1),
    setZoomFactor: jasmine.createSpy('setZoomFactor'),

    // Clipboard
    clipboardReadText: jasmine.createSpy('clipboardReadText').and.returnValue(''),
    clipboardWriteText: jasmine.createSpy('clipboardWriteText'),

    // Shell
    shellOpenExternal: jasmine.createSpy('shellOpenExternal'),

    // Screen
    getCursorScreenPoint: jasmine.createSpy('getCursorScreenPoint').and.returnValue({ x: 0, y: 0 }),

    // Global shortcuts
    registerGlobalShortcut: jasmine.createSpy('registerGlobalShortcut').and.returnValue(true),
    unregisterGlobalShortcut: jasmine.createSpy('unregisterGlobalShortcut'),

    // Game
    sendGameActiveChange: jasmine.createSpy('sendGameActiveChange'),
    gameFocus: jasmine.createSpy('gameFocus'),

    // Window always on top
    windowSetAlwaysOnTop: jasmine.createSpy('windowSetAlwaysOnTop'),
    windowSetVisibleOnAllWorkspaces: jasmine.createSpy('windowSetVisibleOnAllWorkspaces'),

    // Logger
    log: jasmine.createSpy('log'),

    // Keyboard
    setKeyboardDelay: jasmine.createSpy('setKeyboardDelay'),
    keyTap: jasmine.createSpy('keyTap'),
    keyToggle: jasmine.createSpy('keyToggle'),

    // Mouse
    mouseClick: jasmine.createSpy('mouseClick'),
    mouseMove: jasmine.createSpy('mouseMove'),
    mousePosition: jasmine.createSpy('mousePosition').and.returnValue({ x: 0, y: 0 }),

    // Routes/windows
    openRoute: jasmine.createSpy('openRoute'),

    // Browser windows
    createBrowserWindow: jasmine.createSpy('createBrowserWindow').and.returnValue(1),
    closeBrowserWindow: jasmine.createSpy('closeBrowserWindow'),
    loadUrlInBrowserWindow: jasmine.createSpy('loadUrlInBrowserWindow'),

    // IPC event listeners
    on: jasmine.createSpy('on').and.callFake((channel: string, callback: (...args: any[]) => void) => {
      if (!listeners.has(channel)) {
        listeners.set(channel, [])
      }
      listeners.get(channel)!.push(callback)
    }),

    once: jasmine.createSpy('once').and.callFake((channel: string, callback: (...args: any[]) => void) => {
      const onceWrapper = (event: any, ...args: any[]): void => {
        callback(event, ...args)
        const channelListeners = listeners.get(channel)
        if (channelListeners) {
          const index = channelListeners.indexOf(onceWrapper)
          if (index !== -1) {
            channelListeners.splice(index, 1)
          }
        }
      }
      if (!listeners.has(channel)) {
        listeners.set(channel, [])
      }
      listeners.get(channel)!.push(onceWrapper)
    }),

    removeListener: jasmine
      .createSpy('removeListener')
      .and.callFake((channel: string, callback: (...args: any[]) => void) => {
        const channelListeners = listeners.get(channel)
        if (channelListeners) {
          const index = channelListeners.indexOf(callback)
          if (index !== -1) {
            channelListeners.splice(index, 1)
          }
        }
      }),

    removeAllListeners: jasmine.createSpy('removeAllListeners').and.callFake((channel: string) => {
      listeners.delete(channel)
    }),

    send: jasmine.createSpy('send'),

    invoke: jasmine.createSpy('invoke').and.returnValue(Promise.resolve()),

    ...overrides,
  }

  const spies = mockAPI as any

  return mockAPI
}

export class MockElectronProvider {
  private mockAPI: MockElectronAPI

  constructor(overrides: MockElectronAPIOverrides = {}) {
    this.mockAPI = createMockElectronAPI(overrides)
  }

  provideElectronAPI(): MockElectronAPI {
    return this.mockAPI
  }

  getMockAPI(): MockElectronAPI {
    return this.mockAPI
  }
}

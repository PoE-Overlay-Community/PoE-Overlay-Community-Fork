// Type declarations for the electron API exposed via preload script

export interface ElectronAPI {
  // App
  getVersion(): string
  relaunch(): void
  quit(): void
  exit(): void

  // Auto-updater
  initDownload(autoDownload: boolean): void
  setAutoDownload(autoDownload: boolean): void
  quitAndInstall(silent: boolean): void

  // Auto-launch
  isAutoLaunchEnabled(): void
  setAutoLaunchEnabled(enabled: boolean): void

  // Window management
  getMainWindowBounds(): [Rectangle, Rectangle]
  getCurrentWindowBounds(): Rectangle
  setIgnoreMouseEvents(ignore: boolean, options?: { forward: boolean }): void
  windowShow(): void
  windowHide(): void
  windowFocus(): void
  windowBlur(): void
  windowMinimize(): void
  windowRestore(): void
  windowClose(): void
  windowSetFocusable(focusable: boolean): void
  windowSetSkipTaskbar(skip: boolean): void
  windowMoveTop(): void
  windowSetEnabled(enabled: boolean): void
  windowSetSize(width: number, height: number): void
  windowGetSize(): number[]
  windowGetContentBounds(): Rectangle
  getZoomFactor(): number
  setZoomFactor(factor: number): void

  // Clipboard
  clipboardReadText(): string
  clipboardWriteText(text: string): void

  // Session cookies
  setSessionCookie(url: string, name: string, value: string): Promise<boolean>
  getSessionCookie(url: string, name: string): Promise<string | null>

  // Shell
  shellOpenExternal(url: string): void

  // Screen
  getCursorScreenPoint(): { x: number; y: number }

  // Global shortcuts
  registerGlobalShortcut(accelerator: string): boolean
  unregisterGlobalShortcut(accelerator: string): void

  // Game
  sendGameActiveChange(): void
  gameFocus(): void

  // Window always on top
  windowSetAlwaysOnTop(flag: boolean, level?: string, relativeLevel?: number): void
  windowSetVisibleOnAllWorkspaces(visible: boolean): void

  // Logger
  log(level: string, message: string, ...args: any[]): void

  // Keyboard
  setKeyboardDelay(delay: number): void
  keyTap(code: number, modifiers: string[]): void
  keyToggle(code: number, direction: string, modifiers: string[]): void

  // Mouse
  mouseClick(button: string, position?: { x: number; y: number }): void
  mouseMove(position: { x: number; y: number }): void
  mousePosition(): { x: number; y: number }

  // Routes/windows
  openRoute(route: string): void

  // Browser windows
  createBrowserWindow(options: any): number
  closeBrowserWindow(id: number): void
  loadUrlInBrowserWindow(id: number, url: string): void

  // IPC event listeners
  on(channel: string, callback: (event: any, ...args: any[]) => void): void
  once(channel: string, callback: (event: any, ...args: any[]) => void): void
  removeListener(channel: string, callback: (...args: any[]) => void): void
  removeAllListeners(channel: string): void
  send(channel: string, ...args: any[]): void
  invoke(channel: string, ...args: any[]): Promise<any>
}

export interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}

// Augment the global Window interface
declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

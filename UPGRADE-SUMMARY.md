# PoE Overlay Full Dependency Upgrade Summary

This document summarizes the comprehensive dependency upgrade performed on the PoE Overlay project.

## Version Changes

| Package | Previous | Current |
|---------|----------|---------|
| Electron | 8.3.1 | 28.3.3 |
| Angular | 9.1.3 | 17.3.12 |
| Angular Material | 9.x | 17.3.10 |
| TypeScript | 3.8.3 | 5.3.3 |
| RxJS | 6.5.5 | 7.8.0 |
| Node.js | 12+ | 18.13.0+ |
| electron-builder | 22.x | 24.13.3 |
| electron-updater | 4.x | 6.1.7 |
| electron-log | 4.x | 5.1.0 |

### Replaced Native Modules

| Previous | Replacement | Reason |
|----------|-------------|--------|
| `iohook` | `uiohook-napi` 1.5.0 | `iohook` is unmaintained, no Electron 28 support |
| `active-win` | `node-window-manager` 2.2.2 | `active-win` is ESM-only, incompatible with Electron's CJS |
| `custom-electron-titlebar` | Custom HTML titlebar | Incompatible with Electron 28 context isolation |

## Breaking Changes & Fixes

### Electron 28 — Context Isolation

Electron 28 enables `contextIsolation` by default. The renderer process can no longer access Node.js or Electron APIs directly.

**Solution:** Added a preload script using `contextBridge.exposeInMainWorld()` to create a typed `electronAPI` bridge.

- **New file:** `electron/preload.ts` — defines all whitelisted IPC channels and exposes them via `window.electronAPI`
- **New file:** `src/app/core/type/electron-api.type.ts` — TypeScript interface for the bridge
- All renderer services refactored to use `window.electronAPI` instead of `require('electron').ipcRenderer`
- Added IPC handlers in `main.ts` for: window management, clipboard, shell, global shortcuts, game detection, logging, keyboard/mouse automation
- `webPreferences` updated to `contextIsolation: true`, `nodeIntegration: false`, `sandbox: false`

**Services updated:**
`ElectronProvider`, `AppService`, `WindowService`, `BrowserService`, `GameService`, `LoggerService`, `ShortcutService`, `ClipboardService`, `KeyboardService`, `MouseService`, `TradeNotificationsService`, `StashGridService`

### Electron 28 — IPC Serialization

Electron 28 is stricter about IPC argument types.

- `undefined` arguments cause `"conversion failure from undefined"` errors — fixed with `!!poe.active` coercion
- `loadURL()`, `shell.openExternal()`, `autoUpdater.checkForUpdates()` now return promises — added `.catch()` handlers throughout `main.ts` and `electron/auto-updater.ts`
- Added global `process.on('unhandledRejection')` handler as a safety net

### Electron 28 — Window Behaviour

- **Focus-stealing loop:** `BrowserWindow.show()` steals focus from PoE, causing rapid active/inactive detection cycling. Fixed by using `showInactive()` in the `window-show` IPC handler.
- **`setAlwaysOnTop(flag, level)`:** `level` can no longer be `undefined` — added guard to only pass it when defined
- **`isMinimized`:** Now a method, not a property — fixed in the `open-route` handler
- **Child window close handler:** Added null safety for `win?.moveTop()` and try/catch around `event.reply()` (sender webContents may be destroyed)
- **Tray double-click:** Changed direct `win.webContents.send()` to the guarded `send()` helper

### RxJS 7 — `debounce(() => EMPTY)` Breaking Change

In RxJS 6, `debounce(() => EMPTY)` emitted the buffered value when the inner observable completed. In RxJS 7, completion silently drops the value.

This caused the overlay to never become visible — `registerVisibleChange()` in `OverlayComponent` used `debounce((show) => show ? EMPTY : timer(1500))`, which swallowed all `show=true` signals. Fixed by replacing `EMPTY` with `timer(0)`.

### RxJS 7 — Other Migration

- Replaced deprecated `flatMap` → `mergeMap` in 30+ files
- Updated operator import paths where needed

### Angular Material 17 — MDC Component Migration

Angular Material v15+ migrated all components to use MDC (Material Design Components) internally, changing all CSS class names. Updated all selectors across 14 SCSS files:

| Legacy Selector | MDC Selector |
|----------------|--------------|
| `.mat-card` | `.mat-mdc-card` |
| `.mat-dialog-container` | `.mat-mdc-dialog-container` |
| `.mat-dialog-content` | `.mat-mdc-dialog-content` |
| `.mat-dialog-actions` | `.mat-mdc-dialog-actions` |
| `.mat-form-field` | `.mat-mdc-form-field` |
| `.mat-slide-toggle` | `.mat-mdc-slide-toggle` |
| `.mat-slider` | `.mat-mdc-slider` |
| `.mat-tooltip` | `.mat-mdc-tooltip .mdc-tooltip__surface` |
| `.mat-snack-bar-container` | `.mat-mdc-snack-bar-container` + `.mdc-snackbar__surface` |
| `.mat-progress-bar-*` | `.mdc-linear-progress__*` |
| `.mat-raised-button` | `.mat-mdc-raised-button` |
| `.mat-stroked-button` | `.mat-mdc-outlined-button` |
| `.mat-flat-button` | `.mat-mdc-flat-button` |
| `.mat-standard-chip` | `.mat-mdc-chip` |
| `.mat-form-field-prefix/suffix` | `.mat-mdc-form-field-icon-prefix/suffix` |

Additional Angular Material fixes:
- `mat-stretch-tabs` attribute → `[mat-stretch-tabs]="true"` binding
- Added flexbox layout for settings panel content scrolling within titlebar + action bar

### Native Module Replacements

**`iohook` → `uiohook-napi`** (`electron/hook.ts`)
- Updated event handling to match the new API format
- Event types and key codes are compatible

**`active-win` → `node-window-manager`** (`electron/window.ts`)
- Rewrote active window detection using `windowManager.getActiveWindow()`
- Window path, title, bounds, and process ID accessed via the `node-window-manager` Window API
- Added `requestAccessibility()` with try/catch (required on macOS, no-op on Windows)

**`robotjs`** (`electron/robot.ts`)
- Added `VK_TO_KEY_NAME` mapping to translate numeric virtual key codes from `uiohook-napi` to the string key names expected by robotjs (e.g. `0x44` → `'d'`, `0xA0` → `'shift'`)

### Cloudflare Login Fix

The custom `User-Agent` header (`PoEOverlayCommunityFork/x.x.x`) was applied to all HTTP requests, including BrowserWindow page loads. Cloudflare flagged these as bot traffic, blocking the PoE login page.

Fixed by only applying the custom UA to API requests (`/api/` URLs and XHR), letting page loads use the default Chromium user-agent.

### Settings Window — Custom Titlebar

Replaced `custom-electron-titlebar` with a simple HTML/CSS titlebar (draggable title area with close button, matching the dark theme).

### Overlay — Input Value Clipping

`<input>` elements in the evaluate overlay weren't inheriting the PoE-themed font. Width calculated using `ch` units mismatched with the browser default font. Fixed by adding `font: inherit; padding: 0` to `item-frame-value-input.component.scss`.

### Cross-Window IPC

With context isolation enabled, child windows (settings, periodic-update-thread) can no longer share state directly. Added IPC channel forwarding in `main.ts` for: settings changes, trade notifications, stash grid, vendor recipes, account updates.

### TSLint → ESLint

- Created `.eslintrc.json` with Angular ESLint configuration
- Updated `angular.json` to use `@angular-eslint/builder:lint`
- Deleted `tslint.json`

### Build Configuration

- Removed deprecated Angular build options (`extractCss`, `namedChunks`, `vendorChunk`)
- Updated Node.js engine requirement to `>=18.13.0`
- Fixed `BrowserModule` → `CommonModule` in shared modules

## Getting Started

```bash
# Install dependencies (required after upgrade)
npm install

# Rebuild native modules for Electron 28
npm run electron:rebuild

# Run linting
npm run ng:lint

# Run tests
npm run ng:test

# Development mode
npm run start

# Build for Windows
npm run electron:windows

# Build for Linux
npm run electron:linux
```

## Manual Testing Checklist

Due to the scope of changes, manual testing is critical:

### Basic Functionality
- [x] App launches without errors
- [x] Overlay appears and is transparent
- [x] Settings window opens from tray icon
- [x] Settings panel styling renders correctly (dark theme, cards, toggles, sliders)

### Window Behaviour
- [x] Window transparency works (click-through when not over UI)
- [x] Always-on-top functionality works
- [x] Game window detection (overlay shows when PoE is active)
- [x] Overlay doesn't steal focus from PoE (no flashing)

### Input Handling
- [x] Global shortcuts register and trigger (Ctrl+D for evaluate, F5, etc.)
- [ ] Ctrl+MouseWheel zoom works
- [x] Clipboard operations work (copy item text)

### Account & Login
- [x] PoE login page loads (Cloudflare doesn't block it)
- [ ] Account authentication completes successfully
- [ ] Characters and leagues populate after login

### Automation Features
- [ ] Mouse automation (stash grid clicks)
- [ ] Keyboard automation (trade commands)
- [ ] Trade companion notifications work

### UI Components
- [x] Evaluate overlay displays with correct stat values
- [ ] Material dialogs and menus render correctly
- [ ] Charts display (price distribution)
- [ ] Translations load properly

## Known Considerations

1. **Native Modules**: After pulling these changes, always run `npm run electron:rebuild` to ensure native modules are compiled for the correct Electron version.

2. **Context Isolation**: All Electron APIs are now accessed through `window.electronAPI`. Direct `require('electron')` calls in renderer code will not work.

3. **WSL Build**: Building from WSL may hit memory limits or native module compilation issues. Build from a Windows terminal for production builds.

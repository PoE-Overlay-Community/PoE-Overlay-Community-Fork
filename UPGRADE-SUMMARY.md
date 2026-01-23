# PoE Overlay Full Dependency Upgrade Summary

This document summarizes the comprehensive dependency upgrade performed on the PoE Overlay project.

## Version Changes

| Package | Previous | Current |
|---------|----------|---------|
| Electron | 8.3.1 | 28.3.3 |
| Angular | 9.1.3 | 17.3.12 |
| TypeScript | 3.8.3 | 5.3.3 |
| RxJS | 6.5.5 | 7.8.0 |
| Node.js | 12+ | 18.13.0+ |

## Phase 1: Foundation (TypeScript & RxJS)

- Replaced `flatMap` with `mergeMap` in 30+ files (RxJS 7 compatibility)
- Fixed `BrowserModule` to `CommonModule` in `src/app/shared/module/poe/poe.module.ts`
- Updated TypeScript configuration for ES2022 target

## Phase 2: Electron Remote Migration

The deprecated `electron.remote` module was completely removed and replaced with a secure IPC-based architecture using context isolation.

### New Files Created
- `electron/preload.ts` - Exposes safe APIs via `contextBridge.exposeInMainWorld()`
- `src/app/core/type/electron-api.type.ts` - TypeScript interface for the ElectronAPI

### Key Changes
- Added IPC handlers in `main.ts` for:
  - Window management (bounds, always-on-top, ignore-mouse-events)
  - Clipboard operations (read/write)
  - Shell operations (open external URLs)
  - Global shortcuts (register/unregister)
  - Game focus and window detection
  - Logging, keyboard, and mouse automation
- Updated `webPreferences` with `contextIsolation: true` and `nodeIntegration: false`
- Refactored all renderer services to use `window.electronAPI` instead of direct Electron imports

### Services Updated
- `src/app/core/provider/electron.provider.ts`
- `src/app/core/service/app.service.ts`
- `src/app/core/service/window.service.ts`
- `src/app/core/service/browser.service.ts`
- `src/app/core/service/game.service.ts`
- `src/app/core/service/logger.service.ts`
- `src/app/core/service/input/shortcut.service.ts`
- `src/app/core/service/input/clipboard.service.ts`
- `src/app/core/service/input/keyboard.service.ts`
- `src/app/core/service/input/mouse.service.ts`
- `src/app/shared/module/poe/service/trade-companion/trade-notifications.service.ts`
- `src/app/shared/module/poe/service/stash-grid/stash-grid.service.ts`

## Phase 3: Native Module Replacement

### iohook to uiohook-napi
- **File**: `electron/hook.ts`
- The abandoned `iohook` package was replaced with `uiohook-napi` which supports modern Electron versions
- Updated event handling to match the new API format

### robotjs to @jitsi/robotjs
- **File**: `electron/robot.ts`
- Replaced the custom robotjs fork with the maintained `@jitsi/robotjs` package
- API is compatible; removed calls to non-standard methods like `updateScreenMetrics()`

## Phase 4: Angular Incremental Upgrade (9 to 17)

Upgraded through each major Angular version: 9 -> 10 -> 12 -> 14 -> 17

### Key Changes
- Updated all `@angular/*` packages to 17.3.x
- Updated `@angular/material` and `@angular/cdk` to 17.3.x
- Updated RxJS from 6.5.5 to 7.8.0
- Updated zone.js from 0.10.x to 0.14.0
- Updated related packages:
  - `@ngx-translate/core` to 14.0.0
  - `@swimlane/ngx-charts` to 20.1.0
  - `ngx-color-picker` to 12.0.0

### tsconfig.json Updates
- `target`: ES2022
- `module`: ES2022
- `moduleResolution`: bundler
- `lib`: ["ES2022", "dom"]

## Phase 5: Electron Upgrade

- Upgraded Electron from 8.3.1 to 28.3.3
- Updated electron-builder to 24.13.3
- Added `@electron/rebuild` (replacing electron-rebuild)
- Updated `electron-updater` to 6.1.7
- Updated `electron-log` to 5.1.0
- Removed deprecated `app.allowRendererProcessReuse = false`

## Phase 6: Final Cleanup

### TSLint to ESLint Migration
- Created `.eslintrc.json` with Angular ESLint configuration
- Updated `angular.json` to use `@angular-eslint/builder:lint`
- Deleted `tslint.json`

### Build Configuration Cleanup
- Removed deprecated Angular build options (`extractCss`, `namedChunks`, `vendorChunk`)
- Updated Node.js engine requirement to `>=18.13.0`

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
- [ ] App launches without errors
- [ ] Overlay appears and is transparent
- [ ] Settings window opens from tray icon

### Window Behavior
- [ ] Window transparency works (click-through when not over UI)
- [ ] Always-on-top functionality works
- [ ] Game window detection (overlay shows when PoE is active)

### Input Handling
- [ ] Global shortcuts register (Ctrl+D for evaluate)
- [ ] Ctrl+MouseWheel zoom works
- [ ] Clipboard operations work (copy item text)

### Automation Features
- [ ] Mouse automation (stash grid clicks)
- [ ] Keyboard automation (trade commands)
- [ ] Trade companion notifications work

### UI Components
- [ ] Material dialogs and menus render correctly
- [ ] Charts display (price distribution)
- [ ] Translations load properly

## Known Considerations

1. **custom-electron-titlebar**: The project uses a custom fork that may need updates for Electron 28 compatibility. Monitor for issues with the title bar.

2. **Native Modules**: After pulling these changes, always run `npm run electron:rebuild` to ensure native modules are compiled for the correct Electron version.

3. **Context Isolation**: All Electron APIs are now accessed through `window.electronAPI`. Direct `require('electron')` calls in renderer code will not work.

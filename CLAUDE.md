# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PoE Overlay is a desktop overlay application for Path of Exile, built with Electron 8.3 and Angular 9. The overlay is transparent, frameless, and designed to blend with the game, providing features like item evaluation, trade companion, vendor recipes, and stash grid overlays.

## Build Commands

```bash
# Development (starts Angular dev server + Electron with hot reload)
npm run start

# Run tests
npm run ng:test

# Lint with auto-fix
npm run ng:lint

# Format code
npm run format

# Build for Windows
npm run electron:windows

# Build for Linux
npm run electron:linux

# Rebuild native modules (robotjs) after npm install
npm run electron:rebuild
```

## Architecture

### Electron + Angular IPC Model

The app uses two processes communicating via IPC:

- **Main Process** (`main.ts`, `electron/`): Game detection, global shortcuts (iohook), window management, game log parsing, system tray, auto-updates
- **Renderer Process** (`src/app/`): Angular UI, feature modules, settings management, item evaluation

### Path Aliases (tsconfig.json)

```
@app/*     → src/app/core/*
@shared/*  → src/app/shared/*
@modules/* → src/app/modules/*
@env/*     → src/environments/*
@data/*    → src/app/data/*
@layout/*  → src/app/layout/*
```

### Directory Structure

- `electron/` - Main process modules (game.ts, hook.ts, robot.ts, auto-updater.ts)
- `src/app/core/` - Core services (ElectronService, AppService, GameService, input services)
- `src/app/layout/` - Root components (OverlayComponent, UserSettingsComponent)
- `src/app/modules/` - Feature modules (evaluate, command, map, misc, bookmark, stash-grid, trade-companion, vendor-recipe)
- `src/app/shared/module/poe/` - PoE domain logic (item parsing, trade API, currency, stats, mods)
- `src/app/data/` - External API HTTP services (poe.ninja, poe.prices, official trade API)

### Feature Module Pattern

All feature modules implement the `FeatureModule` interface and are registered via the `FEATURE_MODULES` multi-provider token:

```typescript
interface FeatureModule {
  getSettings(): UserSettingsFeature    // UI settings component & defaults
  getFeatures(settings): Feature[]      // Keyboard shortcuts
  run(feature, settings): void          // Execute feature on shortcut
}
```

### Key Services

- `ElectronService` - IPC wrapper with NgZone integration
- `ItemParserService` - Parses clipboard item text into structured Item objects
- `ItemSearchService` - Queries official pathofexile.com/trade API
- `CurrencyChaosEquivalentsService` - poe.ninja currency values
- `TradeNotificationsService` - Parses game log for trade whispers
- `ShortcutService` - Global keybinding registry

### Change Detection

Uses `OnPush` strategy throughout. State managed via `BehaviorSubject` with async pipe consumption.

## Electron Main Process

The overlay window is transparent, frameless, and covers the entire screen. Key characteristics:
- Mouse events forwarded when not over UI elements
- Always-on-top with "pop-up-menu" window level on Windows
- Child windows spawned for settings, browser, and background thread operations
- Game detection polls every 500ms for active PoE window

## External Dependencies

- `iohook` - Global keyboard/mouse hooks (custom version for Electron 8)
- `robotjs` - Keyboard/mouse automation (custom fork)
- `active-win` - Active window detection
- `localforage` - IndexedDB storage for settings
- `@swimlane/ngx-charts` - Chart rendering for price distribution

## Code Style

- Prettier: 100 char line width, single quotes, no semicolons, ES5 trailing commas
- TSLint: 140 char max, kebab-case component selectors, camelCase directive selectors

## Testing

Tests use Karma with Jasmine. Run single test file by modifying the test pattern in karma.conf.js or using `fdescribe`/`fit` for focused tests.

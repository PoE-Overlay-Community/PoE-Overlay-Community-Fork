import { UiLanguage } from '@app/type'
import { CacheExpirationType, Language } from '@shared/module/poe/type'

export enum DialogSpawnPosition {
  Cursor = 1,
  Center = 2,
}

export interface UserSettings {
  leagueId?: string
  language?: Language
  uiLanguage?: UiLanguage
  openUserSettingsKeybinding?: string
  exitAppKeybinding?: string
  zoom?: number
  dialogSpawnPosition?: DialogSpawnPosition
  dialogOpacity?: number
  displayVersion?: boolean
  autoDownload?: boolean
  focusable?: boolean
  stashCacheExpiration?: number
  charactersCacheExpiration?: number
  activeCharacterName?: string
}

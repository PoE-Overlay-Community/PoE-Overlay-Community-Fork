import { Color } from '@app/class'
import { Rectangle } from '@app/type'
import { UserSettings } from 'src/app/layout/type'
import { Currency } from './currency.type'

export type EnumDictionary<T extends string | symbol | number, U> = {
  [K in T]: U
}

export interface TradeCompanionUserSettings extends UserSettings {
  tradeCompanionEnabled: boolean
  tradeCompanionOpacity: number
  tradeCompanionBounds?: Rectangle
  maxVisibileTradeNotifications: number
  incomingTradeOptions: TradeCompanionOption[]
  outgoingTradeOptions: TradeCompanionOption[]
  stashGridBounds: Rectangle[]
  stashGrids: Map<string, StashGridType>
  stashGridColors: TradeCompanionStashGridColors
  showStashGridOnInvite: boolean
  hideStashGridOnTrade: boolean
  reversedNotificationDirection: boolean
  buttonClickAudio: AudioClipSettings
  incomingTradeMessageAudio: AudioClipSettings
}

export interface AudioClipSettings {
  enabled: boolean
  src?: string
  volume: number
}

export interface TradeCompanionStashGridColors {
  gridLine: Color
  gridOutline: Color
  gridBackground: Color
  highlightLine: Color
  highlightBackground: Color
}

export interface TradeCompanionOption {
  buttonLabel: string
  whisperMessage: string
  kickAfterWhisper: boolean
  dismissNotification: boolean
}

export enum StashGridType {
  Normal = 0,
  Quad = 1,
}

export enum StashGridMode {
  Normal = 0,
  Edit = 1,
  Preview = 2,
}

export interface TradeCompanionStashGridOptions {
  gridMode: StashGridMode
  gridType: StashGridType
  gridBounds?: Rectangle
  highlightLocation?: TradeItemLocation
  settings?: TradeCompanionUserSettings
}

export const MAX_STASH_SIZE = 24

export const STASH_TAB_CELL_COUNT_MAP = {
  [StashGridType.Normal]: 12,
  [StashGridType.Quad]: 24,
}

export enum ExampleNotificationType {
  Item = 0,
  Currency = 1,
}

export enum TradeNotificationType {
  Incoming = 0,
  Outgoing = 1,
}

export interface TradeNotification {
  text: string
  type: TradeNotificationType
  time: moment.Moment
  playerName: string
  item: string | CurrencyAmount
  itemLocation?: TradeItemLocation
  price: CurrencyAmount
  offer?: string
  playerInHideout?: boolean
  playerLeftHideout?: boolean
}

export interface CurrencyAmount {
  amount: number
  currency: Currency
}

export interface TradeItemLocation {
  tabName: string
  bounds: Rectangle
}

export interface TradeRegexes {
  all: string
  joinedArea: {
    [language: string]: string
  }
  leftArea: {
    [language: string]: string
  }
  whisper: string
  tradeItemPrice: {
    [language: string]: string
  }
  tradeItemNoPrice: {
    [language: string]: string
  }
  tradeBulk: {
    [language: string]: string
  }
  tradeMap: string
}

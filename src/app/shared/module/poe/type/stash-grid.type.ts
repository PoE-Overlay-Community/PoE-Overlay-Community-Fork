import { Color } from '@app/class'
import { Rectangle } from '@app/type'
import { UserSettings } from '@layout/type'
import { ItemCategory } from './item.type'

export interface StashGridUserSettings extends UserSettings {
  stashGridBounds: Rectangle[]
  stashGrids: Map<string, StashGridType>
  stashGridColors: StashGridColors
}

export interface StashGridColors {
  gridLine: Color
  gridOutline: Color
  gridBackground: Color
  highlightLine: Color
  highlightBackground: Color
  highlightText: Color
}

export enum StashGridType {
  Normal = 0,
  Quad = 1,
  CurrencyGeneral = 2,
  CurrencyExotic = 3,
  Essence = 4,
  FragmentGeneral = 5,
  FragmentBreach = 6,
  FragmentScarab = 7,
  Delve = 8,
  Blight = 9,
  Metamorph = 10,
  Delirium = 11,
}

export enum StashGridMode {
  Normal = 0,
  Edit = 1,
  Preview = 2,
}

export interface StashGridOptions {
  gridMode: StashGridMode
  gridType: StashGridType
  gridBounds?: Rectangle
  highlightLocation?: TradeItemLocations
  autoClose?: boolean
  settings?: StashGridUserSettings    // Can be used to preview settings from within the settings window without applying them first
}

export interface StashTabLayoutMap {
  [baseItemType: string]: StashTabLayoutData
}

export interface StashTabLayoutData {
  xOffset: number
  yOffset: number
  width: number
  height: number
  showIfEmpty: boolean
}

export interface TradeItemLocations {
  tabName: string
  bounds: Rectangle[]
}

export interface TradeItemLocation {
  tabName: string
  bounds: Rectangle
}

export const MAX_STASH_SIZE = 24

export const STASH_TAB_CELL_COUNT_MAP = {
  [StashGridType.Normal]: 12,
  [StashGridType.Quad]: 24,
}

export const STASH_GRID_TYPE_MAP = {
  [StashGridType.CurrencyGeneral]: 'currency-general',
  [StashGridType.CurrencyExotic]: 'currency-exotic',
  [StashGridType.Essence]: 'essence',
  [StashGridType.FragmentGeneral]: 'fragment-general',
  [StashGridType.FragmentBreach]: 'fragment-breach',
  [StashGridType.FragmentScarab]: 'fragment-scarab',
  [StashGridType.Delve]: 'delve',
  [StashGridType.Blight]: 'blight',
  [StashGridType.Metamorph]: 'metamorph',
  [StashGridType.Delirium]: 'delirium',
}

export const STASH_GRID_TYPE_TO_ITEM_CATEGORY_MAP = {
  [StashGridType.CurrencyGeneral]: ItemCategory.Currency,
  [StashGridType.CurrencyExotic]: ItemCategory.Currency,
  [StashGridType.Essence]: ItemCategory.Currency,
  [StashGridType.FragmentGeneral]: ItemCategory.MapFragment,
  [StashGridType.FragmentBreach]: ItemCategory.MapFragment,
  [StashGridType.FragmentScarab]: ItemCategory.MapScarab,
  [StashGridType.Delve]: ItemCategory.CurrencyFossil,
  [StashGridType.Blight]: ItemCategory.Currency,
  [StashGridType.Metamorph]: ItemCategory.Currency,
  [StashGridType.Delirium]: ItemCategory.Currency,
}

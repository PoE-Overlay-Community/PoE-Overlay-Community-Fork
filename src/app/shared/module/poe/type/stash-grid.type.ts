import { Color } from '@app/class'
import { Rectangle } from '@app/type'
import { UserSettings } from '@layout/type'

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

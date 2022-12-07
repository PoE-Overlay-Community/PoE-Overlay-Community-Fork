import { ItemCategory } from './item.type'
import { Stat } from './stat.type'

export interface ClientStringMap {
  [id: string]: string
}

export interface WordMap {
  [id: string]: string
}

export interface BaseItemTypeNameMap {
  [id: string]: string
}

export interface BaseItemTypeMap {
  [id: string]: BaseItemType
}

export interface BaseItemType {
  names?: BaseItemTypeNameMap
  image?: string
  category?: ItemCategory
  width?: number
  height?: number
}

export interface BaseItemTypeCategoryMap {
  [id: string]: ItemCategory
}

export interface StatMap {
  [id: string]: Stat
}

export interface StatLocalMap {
  [id: string]: string
}

export interface StatIndistinguishableMap {
  [id: string]: string[]
}

export interface ModValue {
  min: number
  max: number
}

export interface ModsMap {
  [statId: string]: {
    [modId: string]: ModValue[]
  }
}

export interface AtlasMap {
  url?: string
  layoutRating?: string
  bossRating?: string
  bosses?: string[]
  bossCount?: number
  items?: AtlasMapItem[]
  encounter?: string
  layout?: string
}

export interface AtlasMapItem {
  item?: string
  dropLevel?: number
}

export interface AtlasMapsMap {
  [mapId: string]: AtlasMap
}

export interface AnnointmentMap {
  [id: string]: string[]
}

export interface ModIconsMap {
  [id: string]: string
}

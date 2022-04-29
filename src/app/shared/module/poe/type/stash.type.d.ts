import { ApiStashItem } from '@data/poe'
import { Observable } from 'rxjs'
import { Rectangle } from '../../../../core/type/structure.type'
import { ItemRarity } from './item.type'
import { StashGridType } from './stash-grid.type'

export type PoEStashTab = {
  id: string
  tabIndex: number
  name: string
  stashGridType: StashGridType
}

export type PoEStashTabItem = {
  source: ApiStashItem
  baseItemTypeName: string
  rarity: ItemRarity
  itemLevel: number
  stashTabId: string
  stashLocation: Rectangle
}

export interface StashTabsToSearch {
  getStashTabsToSearch(): Observable<PoEStashTab[]>
}

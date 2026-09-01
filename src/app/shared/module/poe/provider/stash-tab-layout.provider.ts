import { Injectable } from '@angular/core'
import stashTabLayoutData from '../../../../../assets/poe/stashtab-layouts.json'
import { StashTabLayoutMap, StashGridType, STASH_GRID_TYPE_MAP } from '../type'

@Injectable({
  providedIn: 'root',
})
export class StashTabLayoutProvider {
  public provide(stashGridType: StashGridType): StashTabLayoutMap {
    return stashTabLayoutData.layouts[STASH_GRID_TYPE_MAP[stashGridType]]
  }
}

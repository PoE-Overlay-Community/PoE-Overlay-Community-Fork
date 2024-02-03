import { Injectable } from '@angular/core'
import mods from '../../../../../assets/poe/mods.json'
import { ModsMap } from '../type'

@Injectable({
  providedIn: 'root',
})
export class ModsProvider {
  public provide(): ModsMap {
    // TODO: fix cast as any
    return (mods as any).Default
  }
}

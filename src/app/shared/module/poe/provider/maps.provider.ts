import { Injectable } from '@angular/core'
import maps from '../../../../../assets/poe/maps.json'
import { AtlasMapsMap } from '../type'

@Injectable({
  providedIn: 'root',
})
export class MapsProvider {
  public provide(): AtlasMapsMap {
    return maps.Default
  }
}

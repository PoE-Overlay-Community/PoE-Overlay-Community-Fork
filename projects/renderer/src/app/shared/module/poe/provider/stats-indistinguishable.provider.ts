import { Injectable } from '@angular/core'
import indistinguishableStats from '../../../../../assets/poe/stats-indistinguishable.json'
import { StatIndistinguishableMap, StatType } from '../type'

@Injectable({
  providedIn: 'root',
})
export class StatsIndistinguishableProvider {
  public provide(group: StatType): StatIndistinguishableMap {
    return indistinguishableStats.indistinguishableStats[group]
  }
}

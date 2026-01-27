import { Injectable } from '@angular/core'
import statsData from '../../../../../assets/poe/stats.json'
import { StatMap, StatType } from '../type'

@Injectable({
  providedIn: 'root',
})
export class StatsProvider {
  public provide(group: StatType): StatMap {
    switch (group) {
      case StatType.Pseudo:
        return statsData.pseudo
      case StatType.Explicit:
        return statsData.explicit
      case StatType.Implicit:
        return statsData.implicit
      case StatType.Crafted:
        return statsData.crafted
      case StatType.Fractured:
        return statsData.fractured
      case StatType.Enchant:
        return statsData.enchant
      case StatType.Veiled:
        return statsData.veiled
      case StatType.Ultimatum:
        return statsData.ultimatum
      case StatType.Scourge:
        return statsData.scourge
      case StatType.Crucible:
        return statsData.crucible
      case StatType.Sanctum:
        return statsData.sanctum
    }
  }
}

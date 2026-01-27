import { Injectable } from '@angular/core'
import statsLocalData from '../../../../../assets/poe/stats-local.json'
import { StatLocalMap, StatType } from '../type'

@Injectable({
  providedIn: 'root',
})
export class StatsLocalProvider {
  public provide(group: StatType): StatLocalMap {
    switch (group) {
      case StatType.Pseudo:
        return statsLocalData.pseudo
      case StatType.Explicit:
        return statsLocalData.explicit
      case StatType.Implicit:
        return statsLocalData.implicit
      case StatType.Crafted:
        return statsLocalData.crafted
      case StatType.Fractured:
        return statsLocalData.fractured
      case StatType.Enchant:
        return statsLocalData.enchant
      case StatType.Veiled:
        return statsLocalData.veiled
      case StatType.Ultimatum:
        return statsLocalData.ultimatum
      case StatType.Scourge:
        return statsLocalData.scourge
      case StatType.Crucible:
        return statsLocalData.crucible
      case StatType.Sanctum:
        return statsLocalData.sanctum
    }
  }
}

import { Injectable } from '@angular/core'
import stats from '../../../../../assets/poe/stats.json'
import { StatMap, StatType } from '../type'

const {
  crafted,
  enchant,
  explicit,
  fractured,
  implicit,
  pseudo,
  veiled,
  ultimatum,
  scourge,
  crucible,
  sanctum,
} = stats as { [id: string]: StatMap }

@Injectable({
  providedIn: 'root',
})
export class StatsProvider {
  public provide(group: StatType): StatMap {
    switch (group) {
      case StatType.Pseudo:
        return pseudo
      case StatType.Explicit:
        return explicit
      case StatType.Implicit:
        return implicit
      case StatType.Crafted:
        return crafted
      case StatType.Fractured:
        return fractured
      case StatType.Enchant:
        return enchant
      case StatType.Veiled:
        return veiled
      case StatType.Ultimatum:
        return ultimatum
      case StatType.Scourge:
        return scourge
      case StatType.Crucible:
        return crucible
      case StatType.Sanctum:
        return sanctum
    }
  }
}

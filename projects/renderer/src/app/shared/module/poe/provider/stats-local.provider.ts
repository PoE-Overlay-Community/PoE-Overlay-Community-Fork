import { Injectable } from '@angular/core'
import statsLocal from '../../../../../assets/poe/stats-local.json'
import { StatLocalMap, StatType } from '../type'

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
} = statsLocal as { [id: string]: StatLocalMap }

@Injectable({
  providedIn: 'root',
})
export class StatsLocalProvider {
  public provide(group: StatType): StatLocalMap {
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

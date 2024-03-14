import { Injectable } from '@angular/core'
import { Item, StatType } from '@shared/module/poe/type'
import { ItemParserUtils } from '../parser/item-parser.utils'

@Injectable({
  providedIn: 'root',
})
export class ItemModifierMagnitudeProcessorService {
  public process(item: Item): void {
    const { stats } = item
    if (!stats) {
      return
    }

    // Find the magnitude stat
    const idx = stats.findIndex(stat => stat.id === 'local_implicit_stat_magnitude_+%')
    if (idx === -1) {
      return
    }

    // Find the magnitude value
    const stat = stats[idx]
    const magnitude = ItemParserUtils.parseNumberSimple(stat.predicate)
    if (magnitude === 0) {
      return
    }

    // Calculate the multiplier
    const multiplier = (magnitude + 100) / 100

    // Multiply all implicit stats
    stats.forEach(stat => {
      if (stat.type === StatType.Implicit) {
        stat.values.forEach(value => {
          value.text = `${multiplier * ItemParserUtils.parseNumber(value.text)}`
        })
      }
    })
  }
}

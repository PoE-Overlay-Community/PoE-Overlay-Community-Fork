import { Injectable } from '@angular/core'
import { Query, StatsFilter } from '@data/poe'
import { Item, ItemStat, ItemSearchFiltersService, Language } from '@shared/module/poe/type'

@Injectable({
  providedIn: 'root',
})
export class ItemSearchFiltersStatsService implements ItemSearchFiltersService {
  public add(item: Item, language: Language, query: Query): void {
    const stats = (item.stats || []).filter((stat) => !!stat)
    if (stats.length <= 0) {
      return
    }

    const mainStats = stats.filter((stat) => !stat.indistinguishables)
    if (mainStats.length > 0) {
      query.stats.push({
        type: 'and',
        filters: mainStats.map((stat) => this.mapStat(stat, stat.tradeId)),
      })
    }

    const indistinguishableStats = stats.filter((stat) => stat.indistinguishables)
    for (const indistinguishableStat of indistinguishableStats) {
      query.stats.push({
        type: 'count',
        min: 1,
        max: 1,
        filters: indistinguishableStat.indistinguishables.map(s => this.mapStat(indistinguishableStat, s)).concat(
          this.mapStat(indistinguishableStat, indistinguishableStat.tradeId),
        ),
      })
    }
  }

  private mapStat(stat: ItemStat, tradeId: string): StatsFilter {
    const id = `${stat.type}.${tradeId}`
    const filter: StatsFilter = {
      disabled: false,
      id,
    }

    if (stat.option) {
      filter.value = {
        option: isNaN(+stat.predicate) ? stat.predicate : +stat.predicate,
      }
    } else {
      const mins = stat.values.filter((x) => x.min !== undefined)
      const maxs = stat.values.filter((x) => x.max !== undefined)

      if (mins.length === 0 && maxs.length === 0) {
        return filter
      }

      const negate = !stat.negated && stat.predicate[0] === 'N' ? -1 : 1

      let min: number
      if (mins.length > 0) {
        min = mins.reduce((a, b) => a + b.min, 0) / mins.length
        min = Math.round(min * 10) / 10
        min *= negate
      }

      let max: number
      if (maxs.length > 0) {
        max = maxs.reduce((a, b) => a + b.max, 0) / maxs.length
        max = Math.round(max * 10) / 10
        max *= negate
      }

      if (min !== undefined && max !== undefined) {
        if (min > max) {
          const tmp = min
          min = max
          max = tmp
        }
      } else if (min !== undefined) {
        if (min > 0 || (min === 0 && negate === 1)) {
          max = 999999
        } else {
          max = min
          min = -999999
        }
      } else if (max !== undefined) {
        if (max >= 0) {
          min = 0
        } else {
          min = max
          max = -1
        }
      }
      filter.value = { min, max }
    }

    return filter
  }
}

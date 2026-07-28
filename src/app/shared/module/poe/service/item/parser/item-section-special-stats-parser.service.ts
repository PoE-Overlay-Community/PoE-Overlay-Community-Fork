import { Injectable } from '@angular/core'
import {
    ExportedItem,
    Item,
    ItemCategory,
    ItemSection,
    ItemSectionParserService,
    ItemStat,
    Section,
    StatType
} from '@shared/module/poe/type'
import { StatsProvider } from '../../../provider/stats.provider'
import { ClientStringService } from '../../client-string/client-string.service'

@Injectable({
  providedIn: 'root',
})
export class ItemSectionSpecialStatsParserService implements ItemSectionParserService {
  constructor(
    private readonly clientString: ClientStringService,
    private readonly statsProvider: StatsProvider,
  ) { }

  public optional = true
  public section = ItemSection.Stats

  public parse(item: ExportedItem, target: Item): Section {
    switch (target.category) {
      case ItemCategory.ExpeditionLogbook:
        break
      default:
        return null
    }

    if (!target.stats) {
      target.stats = []
    }

    // Parse special stats that are present in the 'normal stat section' (i.e. they can't be their own section)
    const specialStats = this.getSpecialStatPhrases()
    for (const specialStat of specialStats) {
      for (const section of item.sections) {
        for (const line of section.lines) {
          if (line.indexOf(specialStat.phrase) !== -1) {
            const tradeStats = this.statsProvider.provide(specialStat.statType)
            const tradeStat = tradeStats[specialStat.tradeId]
            const stat: ItemStat = {
              id: tradeStat.id,
              mod: tradeStat.mod,
              option: tradeStat.option,
              negated: tradeStat.negated,
              predicateIndex: 0,
              predicate: '#',
              type: specialStat.statType,
              tradeId: specialStat.tradeId,
              values: [],
              indistinguishables: undefined,
            }
            target.stats.push(stat)
          }
        }
      }
    }
  }

  private getSpecialStatPhrases(): {
    phrase: string
    statType: StatType
    tradeId: string
  }[] {
    return [
      {
        phrase: this.clientString.translate('ExpeditionFaction1'),
        statType: StatType.Pseudo,
        tradeId: 'pseudo_logbook_faction_druids'
      },
      {
        phrase: this.clientString.translate('ExpeditionFaction2'),
        statType: StatType.Pseudo,
        tradeId: 'pseudo_logbook_faction_mercenaries'
      },
      {
        phrase: this.clientString.translate('ExpeditionFaction3'),
        statType: StatType.Pseudo,
        tradeId: 'pseudo_logbook_faction_order'
      },
      {
        phrase: this.clientString.translate('ExpeditionFaction4'),
        statType: StatType.Pseudo,
        tradeId: 'pseudo_logbook_faction_knights'
      },
    ]
  }
}

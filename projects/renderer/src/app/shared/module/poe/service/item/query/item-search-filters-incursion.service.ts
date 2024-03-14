import { Injectable } from '@angular/core'
import { Query, StatsFilter } from '@data/poe'
import {
  Item,
  ItemPropertiesIncursionRoom,
  ItemSearchFiltersService,
  Language,
} from '@shared/module/poe/type'

@Injectable({
  providedIn: 'root',
})
export class ItemSearchFiltersIncursionService implements ItemSearchFiltersService {
  constructor() {}

  public add(item: Item, language: Language, query: Query): void {
    if (!item.properties || !item.properties.incursion) {
      return
    }

    const rooms: StatsFilter[] = []
    const incursion = item.properties.incursion

    rooms.push(...this.searchTradeStats(incursion.openRooms, '1'))
    rooms.push(...this.searchTradeStats(incursion.closedRooms, '2'))

    if (rooms.length > 0) {
      query.stats.push({
        type: 'and',
        filters: rooms,
      })
    }
  }

  private searchTradeStats(
    rooms: ItemPropertiesIncursionRoom[],
    roomOption: string
  ): StatsFilter[] {
    return rooms
      .filter((x) => x)
      .map((x) => {
        const statFilter: StatsFilter = {
          id: `${x.stat.type}.${x.stat.tradeId}`,
          value: {
            option: roomOption,
          },
        }
        return statFilter
      })
  }
}

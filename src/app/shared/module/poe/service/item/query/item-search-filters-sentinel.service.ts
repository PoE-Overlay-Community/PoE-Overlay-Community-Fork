import { Injectable } from '@angular/core'
import { Query } from '@data/poe'
import {
    Item,
    ItemSearchFiltersService,
    Language
} from '@shared/module/poe/type'

@Injectable({
  providedIn: 'root',
})
export class ItemSearchFiltersSentinelService implements ItemSearchFiltersService {
  constructor() { }

  public add(item: Item, language: Language, query: Query): void {
    if (!item.properties || !item.properties.sentinel) {
      return
    }

    query.filters.sentinel_filters = {
      filters: {},
    }

    const sentinelFilters = query.filters.sentinel_filters.filters
    const sentinel = item.properties.sentinel

    if (sentinel.durability) {
      sentinelFilters.sentinel_durability = {
        min: sentinel.durability.value.min,
        max: sentinel.durability.value.max,
      }
    }

    if (sentinel.maxDurability) {
      sentinelFilters.sentinel_max_durability = {
        min: sentinel.maxDurability.value.min,
        max: sentinel.maxDurability.value.max,
      }
    }

    if (sentinel.duration) {
      sentinelFilters.sentinel_duration = {
        min: sentinel.duration.value.min,
        max: sentinel.duration.value.max,
      }
    }

    if (sentinel.enemiesEmpowered) {
      sentinelFilters.sentinel_empowerment_limit = {
        min: sentinel.enemiesEmpowered.value.min,
        max: sentinel.enemiesEmpowered.value.max,
      }
    }

    if (sentinel.empowerment) {
      sentinelFilters.sentinel_empowerment = {
        min: sentinel.empowerment.value.min,
        max: sentinel.empowerment.value.max,
      }
    }
  }
}

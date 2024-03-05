import { Injectable } from '@angular/core'
import { Query } from '@data/poe'
import {
  Item,
  ItemSearchFiltersService,
  Language,
  UltimatumRewardType,
} from '@shared/module/poe/type'
import { ItemService } from '../item.service'

@Injectable({
  providedIn: 'root',
})
export class ItemSearchFiltersUltimatumService implements ItemSearchFiltersService {
  constructor(private readonly itemNameService: ItemService) {}

  public add(item: Item, language: Language, query: Query): void {
    if (!item.properties || !item.properties.ultimatum) {
      return
    }

    query.filters.ultimatum_filters = {
      filters: {},
    }

    const ultimatumFilters = query.filters.ultimatum_filters.filters
    const ultimatum = item.properties.ultimatum

    if (ultimatum.challengeType) {
      ultimatumFilters.ultimatum_challenge = {
        option: ultimatum.challengeType,
      }
    }

    if (ultimatum.rewardType) {
      ultimatumFilters.ultimatum_reward = {
        option: ultimatum.rewardType,
      }
      if (ultimatum.rewardType === UltimatumRewardType.UniqueItem && ultimatum.rewardUnique) {
        ultimatumFilters.ultimatum_output = {
          option: this.itemNameService.getName(ultimatum.rewardUnique, language),
        }
      }

      if (ultimatum.requiredItem) {
        let requiredItem
        if (ultimatum.rewardType === UltimatumRewardType.UniqueItem) {
          requiredItem = this.itemNameService.getName(ultimatum.requiredItem, language)
        } else {
          requiredItem = this.itemNameService.getType(ultimatum.requiredItem, language)
        }
        ultimatumFilters.ultimatum_input = {
          option: requiredItem,
        }
      }
    }
  }
}

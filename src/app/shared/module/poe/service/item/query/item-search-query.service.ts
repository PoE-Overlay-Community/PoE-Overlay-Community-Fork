import { Injectable } from '@angular/core'
import { Query } from '@data/poe'
import { Item, ItemSearchFiltersService, Language } from '../../../type'
import { ItemSearchFiltersArmourService } from './item-search-filters-armour.service'
import { ItemSearchFiltersHeistService } from './item-search-filters-heist.service'
import { ItemSearchFiltersIncursionService } from './item-search-filters-incursion.service'
import { ItemSearchFiltersMapService } from './item-search-filters-map.service'
import { ItemSearchFiltersMiscsService } from './item-search-filters-miscs.service'
import { ItemSearchFiltersRequirementsService } from './item-search-filters-requirements.service'
import { ItemSearchFiltersSocketService } from './item-search-filters-socket.service'
import { ItemSearchFiltersStatsService } from './item-search-filters-stats.service'
import { ItemSearchFiltersTypeService } from './item-search-filters-type.service'
import { ItemSearchFiltersUltimatumService } from './item-search-filters-ultimatum.service'
import { ItemSearchFiltersWeaponService } from './item-search-filters-weapon.service'

@Injectable({
  providedIn: 'root',
})
export class ItemSearchQueryService {
  private readonly filters: ItemSearchFiltersService[]

  constructor(
    filtersTypeService: ItemSearchFiltersTypeService,
    filtersSocketService: ItemSearchFiltersSocketService,
    filtersWeaponService: ItemSearchFiltersWeaponService,
    filtersArmourService: ItemSearchFiltersArmourService,
    filtersRequirementsService: ItemSearchFiltersRequirementsService,
    filtersMiscsService: ItemSearchFiltersMiscsService,
    filtersMapService: ItemSearchFiltersMapService,
    filtersStatsService: ItemSearchFiltersStatsService,
    filtersUltimatumService: ItemSearchFiltersUltimatumService,
    filtersIncursionService: ItemSearchFiltersIncursionService,
    filtersHeistService: ItemSearchFiltersHeistService,
  ) {
    this.filters = [
      filtersTypeService,
      filtersSocketService,
      filtersWeaponService,
      filtersArmourService,
      filtersRequirementsService,
      filtersMapService,
      filtersHeistService,
      filtersUltimatumService,
      filtersMiscsService,
      filtersIncursionService,
      filtersStatsService,
    ]
  }

  public map(item: Item, language: Language, query: Query): void {
    this.filters.forEach((filter) => filter.add(item, language, query))
  }
}

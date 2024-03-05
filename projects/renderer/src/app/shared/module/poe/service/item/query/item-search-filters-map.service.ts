import { Injectable } from '@angular/core'
import { Query } from '@data/poe'
import { Item, ItemSearchFiltersService, Language } from '@shared/module/poe/type'

@Injectable({
  providedIn: 'root',
})
export class ItemSearchFiltersMapService implements ItemSearchFiltersService {
  public add(item: Item, language: Language, query: Query): void {
    if (!item.properties) {
      return
    }

    query.filters.map_filters = {
      filters: {},
    }

    const prop = item.properties
    if (prop.mapTier) {
      query.filters.map_filters.filters.map_tier = {
        min: +prop.mapTier.value.value,
        max: +prop.mapTier.value.value,
      }
    }

    if (prop.mapQuantity) {
      query.filters.map_filters.filters.map_iiq = {
        min: prop.mapQuantity.value.value,
      }
    }

    if (prop.mapRarity) {
      query.filters.map_filters.filters.map_iir = {
        min: prop.mapRarity.value.value,
      }
    }

    if (prop.mapPacksize) {
      query.filters.map_filters.filters.map_packsize = {
        min: prop.mapPacksize.value.value,
      }
    }

    if (prop.areaLevel) {
      query.filters.map_filters.filters.area_level = {
        min: prop.areaLevel.value.min,
        max: prop.areaLevel.value.max,
      }
    }

    if (item.blighted) {
      query.filters.map_filters.filters.map_blighted = {
        option: 'true',
      }
    }

    if (item.blightRavaged) {
      query.filters.map_filters.filters.map_uberblighted = {
        option: 'true',
      }
    }
  }
}

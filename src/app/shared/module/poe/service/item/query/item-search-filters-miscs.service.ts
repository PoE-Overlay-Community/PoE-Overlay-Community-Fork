import { Injectable } from '@angular/core'
import { Query } from '@data/poe'
import {
  Item,
  ItemProperties,
  ItemSearchFiltersService,
  Language,
  StatType,
} from '@shared/module/poe/type'

@Injectable({
  providedIn: 'root',
})
export class ItemSearchFiltersMiscsService implements ItemSearchFiltersService {
  public add(item: Item, language: Language, query: Query): void {
    query.filters.misc_filters = {
      filters: {},
    }

    if (item.level) {
      query.filters.misc_filters.filters.ilvl = {
        min: item.level.min,
        max: item.level.max,
      }
    }

    query.filters.misc_filters.filters.corrupted = {
      option: `${!!item.corrupted}`,
    }

    if (item.mirrored) {
      query.filters.misc_filters.filters.mirrored = {
        option: `${!item.mirrored}`,
      }
    }

    if (item.unidentified) {
      query.filters.misc_filters.filters.identified = {
        option: `${!item.unidentified}`,
      }
    }

    query.filters.misc_filters.filters.veiled = {
      option: `${!!item.veiled}`,
    }

    this.mapInfluences(item, query)

    if (!item.properties) {
      return
    }

    const prop = item.properties
    if (prop.gemLevel) {
      query.filters.misc_filters.filters.gem_level = {
        min: prop.gemLevel.value.min,
        max: prop.gemLevel.value.max,
      }
    }

    if (prop.gemExperience) {
      const splittedExp = prop.gemExperience.value.text.split('/')
      const exp = +(splittedExp[0] || '').split(/[\+%,\. ]+/).join('')
      const expMax = +(splittedExp[1] || '').split(/[\+%,\. ]+/).join('')
      if (!isNaN(exp) && !isNaN(expMax)) {
        const expFactor = (exp / expMax) * 100
        query.filters.misc_filters.filters.gem_level_progress = {
          min: Math.round(expFactor * 100) / 100,
        }
      }
    }

    if (prop.gemQualityType) {
      query.filters.misc_filters.filters.gem_alternate_quality = {
        option: `${prop.gemQualityType}`,
      }
    }

    this.mapQuality(prop, query)

    if (prop.durability) {
      query.filters.misc_filters.filters.durability = {
        min: prop.durability.value.min,
        max: prop.durability.value.max,
      }
    }

    if (prop.storedExperience) {
      query.filters.misc_filters.filters.stored_experience = {
        min: prop.storedExperience.value.min,
        max: prop.storedExperience.value.max,
      }
    }
  }

  private mapQuality(prop: ItemProperties, query: Query): void {
    if (!prop.quality) {
      return
    }

    query.filters.misc_filters.filters.quality = {
      min: prop.quality.value.min,
      max: prop.quality.value.max,
    }
  }

  private mapInfluences(item: Item, query: Query): void {
    if (!item.influences) {
      return
    }

    const influences = item.influences

    if (influences.shaper) {
      this.addPseudoStatToAndGroup(query, 'pseudo_has_shaper_influence')
    }
    if (influences.elder) {
      this.addPseudoStatToAndGroup(query, 'pseudo_has_elder_influence')
    }
    if (influences.crusader) {
      this.addPseudoStatToAndGroup(query, 'pseudo_has_crusader_influence')
    }
    if (influences.hunter) {
      this.addPseudoStatToAndGroup(query, 'pseudo_has_hunter_influence')
    }
    if (influences.redeemer) {
      this.addPseudoStatToAndGroup(query, 'pseudo_has_redeemer_influence')
    }
    if (influences.warlord) {
      this.addPseudoStatToAndGroup(query, 'pseudo_has_warlord_influence')
    }

    if (influences.fractured) {
      query.filters.misc_filters.filters.fractured_item = {
        option: `${influences.fractured}`,
      }
    }
    if (influences.synthesised) {
      query.filters.misc_filters.filters.synthesised_item = {
        option: `${influences.synthesised}`,
      }
    }
  }

  private addPseudoStatToAndGroup(query: Query, statID: string): void {
    let andStatGroup = query.stats.find((stat) => stat.type === 'and')
    if (!andStatGroup) {
      andStatGroup = {
        type: 'and',
        filters: [],
      }
      query.stats.push(andStatGroup)
    }
    andStatGroup.filters.push({
      disabled: false,
      id: `${StatType.Pseudo}.${statID}`,
    })
  }
}

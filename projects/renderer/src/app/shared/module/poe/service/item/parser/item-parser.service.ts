import { Injectable } from '@angular/core'
import { ExportedItem, Item, ItemSection, ItemSectionParserService, Section } from '../../../type'
import { ItemSectionCorruptedParserService } from './item-section-corrupted-parser.service'
import { ItemSectionFlaskParserService } from './item-section-flask-parser.service'
import { ItemSectionGemExperienceParserService } from './item-section-gem-experience-parser.service'
import { ItemSectionHeistParserService } from './item-section-heist-parser.service'
import { ItemSectionIncursionParserService } from './item-section-incursion-parser.service'
import { ItemSectionInfluencesParserService } from './item-section-influences-parser.service'
import { ItemSectionItemLevelParserService } from './item-section-item-level-parser.service'
import { ItemSectionMirroredParserService } from './item-section-mirrored-parser.service'
import { ItemSectionNoteParserService } from './item-section-note-parser.service'
import { ItemSectionPropertiesParserService } from './item-section-properties-parser.service'
import { ItemSectionProphecyParserService } from './item-section-prophecy-parser.service'
import { ItemSectionRarityParserService } from './item-section-rarity-parser.service'
import { ItemSectionRelicParserService } from './item-section-relic-parser.service'
import { ItemSectionRequirementsParserService } from './item-section-requirements-parser.service'
import { ItemSectionSocketsParserService } from './item-section-sockets-parser.service'
import { ItemSectionSpecialStatsParserService } from './item-section-special-stats-parser.service'
import { ItemSectionStatsParserService } from './item-section-stats-parser.service'
import { ItemSectionUltimatumParserService } from './item-section-ultimatum-parser.service'
import { ItemSectionUnidentifiedParserService } from './item-section-unidentified-parser.service'
import { ItemSectionVeiledParserService } from './item-section-veiled-parser.service'

@Injectable({
  providedIn: 'root',
})
export class ItemParserService {
  private readonly parsers: ItemSectionParserService[]

  constructor(
    itemSectionRarityParser: ItemSectionRarityParserService,
    itemSectionRequirementsParserService: ItemSectionRequirementsParserService,
    itemSectionNoteParserService: ItemSectionNoteParserService,
    itemSectionItemLevelParserService: ItemSectionItemLevelParserService,
    itemSectionSocketsParserService: ItemSectionSocketsParserService,
    itemSectionPropertiesParserService: ItemSectionPropertiesParserService,
    itemSectionCorruptedParserService: ItemSectionCorruptedParserService,
    itemSectionMirroredParserService: ItemSectionMirroredParserService,
    itemSectionInfluencesParserService: ItemSectionInfluencesParserService,
    itemSectionVeiledParserService: ItemSectionVeiledParserService,
    itemSectionStatsParserService: ItemSectionStatsParserService,
    itemSectionUnidentifiedParserService: ItemSectionUnidentifiedParserService,
    itemSectionFlaskParserService: ItemSectionFlaskParserService,
    itemSectionProphecyParserService: ItemSectionProphecyParserService,
    itemSectionGemExperienceParserService: ItemSectionGemExperienceParserService,
    itemSectionUltimatumParserService: ItemSectionUltimatumParserService,
    itemSectionRelicParserService: ItemSectionRelicParserService,
    itemSectionIncursionParserService: ItemSectionIncursionParserService,
    itemSectionHeistParserService: ItemSectionHeistParserService,
    itemSectionSpecialStatsParserService: ItemSectionSpecialStatsParserService,
  ) {
    this.parsers = [
      itemSectionRarityParser,
      itemSectionRequirementsParserService,
      itemSectionNoteParserService,
      itemSectionItemLevelParserService,
      itemSectionSocketsParserService,
      itemSectionUltimatumParserService, // Parse prior to Properties
      itemSectionRelicParserService, // Parse prior to Properties
      itemSectionIncursionParserService, // Parse prior to Properties
      itemSectionHeistParserService, // Parse prior to Properties
      itemSectionPropertiesParserService,
      itemSectionFlaskParserService, // Properties have to be parsed first in case the Flask Parser contains Quality.
      itemSectionProphecyParserService, // Properties have to be parsed first in case the Prophecy Parser needs to adjust some properties.
      // Properties have to be parsed first in case the Gem Experience Parser needs to adjust some properties.
      itemSectionGemExperienceParserService,
      itemSectionCorruptedParserService,
      itemSectionMirroredParserService,
      itemSectionVeiledParserService,
      itemSectionInfluencesParserService,
      itemSectionUnidentifiedParserService,
      itemSectionStatsParserService,
      itemSectionSpecialStatsParserService, // Parse after Stats
    ]
  }

  public parse(
    stringifiedItem: string,
    sections?: {
      [section: number]: boolean
    }
  ): Item {
    const exportedItem: ExportedItem = {
      sections: stringifiedItem
        .split('--------')
        .map((section) => section.split(/\r?\n/).filter((line) => line.length > 0))
        .filter((lines) => lines.length > 0)
        .map((lines) => {
          const section: Section = {
            lines,
            content: lines.join('\n'),
          }
          return section
        }),
    }

    const target: Item = {
      source: stringifiedItem,
    }

    for (const parser of this.parsers) {
      if (sections && !sections[parser.section]) {
        continue
      }
      const sectionOrSections = parser.parse(exportedItem, target)
      if (!sectionOrSections) {
        if (!parser.optional) {
          console.log(`[ItemParser] Failed to parse required section '${ItemSection[parser.section]}'`)
          return null
        } else {
          continue
        }
      }
      ;[].concat(sectionOrSections).forEach((section) => {
        exportedItem.sections.splice(exportedItem.sections.indexOf(section), 1)
      })
    }
    return target
  }
}

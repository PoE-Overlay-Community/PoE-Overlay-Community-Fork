import { Injectable } from '@angular/core'
import {
    ExportedItem, Item,
    ItemCategory,
    ItemSection,
    ItemSectionParserService, ItemValueProperty, Section
} from '@shared/module/poe/type'
import { ClientStringService } from '../../client-string/client-string.service'
import { ItemParserUtils } from './item-parser.utils'

const AGUMENT_VALUE_REGEX = '(\\S+)( \\(augmented\\))?'

@Injectable({
  providedIn: 'root',
})
export class ItemSectionSentinelParserService implements ItemSectionParserService {
  constructor(private readonly clientString: ClientStringService) { }

  public optional = true
  public section = ItemSection.Sentinel

  public parse(item: ExportedItem, target: Item): Section {
    switch (target.category) {
      case ItemCategory.Sentinel:
      case ItemCategory.SentinelStalker:
      case ItemCategory.SentinelPandemonium:
      case ItemCategory.SentinelApex:
        break
      default:
        return null
    }

    const phrases = this.getPhrases()

    const sentinelSection = item.sections.find((section) => section.lines.some(line => phrases.some(phrase => phrase.test(line))))
    if (!sentinelSection) {
      return null
    }

    if (!target.properties) {
      target.properties = {}
    }
    if (!target.properties.sentinel) {
      target.properties.sentinel = {}
    }

    const sentinel = target.properties.sentinel

    const lines = sentinelSection.lines
    for (const line of lines) {
      sentinel.durability = this.parseValueProperty(line, phrases[0], sentinel.durability, 0)
      sentinel.maxDurability = this.parseValueProperty(line, phrases[0], sentinel.maxDurability, 1)
      sentinel.duration = this.parseValueProperty(line, phrases[1], sentinel.duration)
      sentinel.enemiesEmpowered = this.parseValueProperty(line, phrases[2], sentinel.enemiesEmpowered)// Enemies
      sentinel.enemiesEmpowered = this.parseValueProperty(line, phrases[3], sentinel.enemiesEmpowered)// Enemy
      sentinel.empowerment = this.parseValueProperty(line, phrases[4], sentinel.empowerment)
    }

    return sentinelSection
  }

  private parseValueProperty(
    line: string,
    phrase: RegExp,
    prop: ItemValueProperty,
    part: number = 0,
    numDecimals: number = 0
  ): ItemValueProperty {
    if (!phrase.test(line)) {
      return prop
    }
    const matches = phrase.exec(line)
    let value = matches[1]
    if (value.indexOf('/') !== -1) {
      value = value.split('/')[part]
    }
    const result: ItemValueProperty = {
      value: ItemParserUtils.parseItemValue(value, numDecimals),
      augmented: !!matches[2]
    }
    return result
  }

  private getPhrases(): RegExp[] {
    return [
      new RegExp(`^${this.clientString.translate('ItemDisplaySentinelDroneDurability')}: ${AGUMENT_VALUE_REGEX}$`),
      new RegExp(`^${this.clientString.translate('ItemDisplaySentinelDroneDuration').replace('{0}', AGUMENT_VALUE_REGEX)}$`),
      new RegExp(`^${this.clientString.translate('ItemDisplaySentinelDroneTagLimit').replace('{0}', AGUMENT_VALUE_REGEX)}$`),
      new RegExp(`^${this.clientString.translate('ItemDisplaySentinelDroneTagLimitOne').replace('{0}', AGUMENT_VALUE_REGEX)}$`),
      new RegExp(`^${this.clientString.translate('ItemDisplaySentinelDroneDifficulty').replace('{0}', AGUMENT_VALUE_REGEX)}$`),
    ]
  }
}

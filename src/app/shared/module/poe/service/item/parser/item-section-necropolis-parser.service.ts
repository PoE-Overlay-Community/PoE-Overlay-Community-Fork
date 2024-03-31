import { Injectable } from '@angular/core'
import {
  ExportedItem,
  Item,
  ItemPropertiesNecropolis,
  ItemSection,
  ItemSectionParserService,
  Section,
} from '@shared/module/poe/type'
import { BaseItemTypesService } from '../../base-item-types/base-item-types.service'
import { ClientStringService } from '../../client-string/client-string.service'
import { WordService } from '../../word/word.service'
import { ItemParserUtils } from './item-parser.utils'

@Injectable({
  providedIn: 'root',
})
export class ItemSectionNecropolisParserService implements ItemSectionParserService {
  constructor(
    private readonly clientString: ClientStringService,
    private readonly baseItemTypesService: BaseItemTypesService,
    private readonly wordService: WordService,
  ) {}

  public optional = true
  public section = ItemSection.Necropolis

  public parse(item: ExportedItem, target: Item): Section {
    const corpseLevelPhrase = `${this.clientString.translate('ItemDisplayCorpseLevel')}: `

    const necropolisSection = item.sections.find(
      (x) => x.content.indexOf(corpseLevelPhrase) !== -1
    )
    if (!necropolisSection) {
      return null
    }

    if (!target.properties) {
      target.properties = {}
    }

    const lines = necropolisSection.lines

    // Monster (name)
    const monsterNamePhrase = `${this.clientString.translate('ItemDisplayCorpseVariety')}: `
    // Monster Category
    const monsterCategoryPhrase = `${this.clientString.translate('ItemDisplayCorpseType')}: `

    target.properties.necropolis = {
      monster: lines[0].slice(monsterNamePhrase.length).trim(),
      corpseLevel: ItemParserUtils.parseNumber(lines[1].slice(corpseLevelPhrase.length).trim()),
      monsterCategory: lines[2].slice(monsterCategoryPhrase.length).trim(),
    }

    return necropolisSection
  }
}

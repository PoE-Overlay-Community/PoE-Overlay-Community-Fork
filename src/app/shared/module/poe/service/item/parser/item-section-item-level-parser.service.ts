import { Injectable } from '@angular/core'
import {
  ExportedItem,
  Item,
  ItemSection,
  ItemSectionParserService,
  Section,
  ItemCategory,
} from '@shared/module/poe/type'
import { ClientStringService } from '../../client-string/client-string.service'

@Injectable({
  providedIn: 'root',
})
export class ItemSectionItemLevelParserService implements ItemSectionParserService {
  constructor(private readonly clientString: ClientStringService) {}

  public optional = true
  public section = ItemSection.ItemLevel

  public parse(item: ExportedItem, target: Item): Section {
    let itemLevelSection: Section
    let itemLevel: string
    switch (target.category) {
      case ItemCategory.CurrencyWildSeed:
      case ItemCategory.CurrencyVividSeed:
      case ItemCategory.CurrencyPrimalSeed:
        const seedMonsterLevelPhrase = new RegExp(
          this.clientString.translate('ItemDisplayHarvestMonsterLevel').replace('{0}', '(\\S+)')
        )

        itemLevelSection = item.sections.find((x) => seedMonsterLevelPhrase.test(x.content))
        if (itemLevelSection) {
          itemLevel = seedMonsterLevelPhrase.exec(itemLevelSection.content)[1]
        }
        break

      default:
        const itemLevelPhrase = `${this.clientString.translate('ItemDisplayStringItemLevel')}: `

        itemLevelSection = item.sections.find((x) => x.content.indexOf(itemLevelPhrase) === 0)
        if (itemLevelSection) {
          itemLevel = itemLevelSection.lines[0].slice(itemLevelPhrase.length)
        }
        break
    }

    if (!itemLevelSection) {
      return null
    }

    target.level = {
      text: itemLevel,
      value: +itemLevel,
    }

    return itemLevelSection
  }
}

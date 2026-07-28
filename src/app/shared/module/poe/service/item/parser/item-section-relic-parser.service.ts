import { Injectable } from '@angular/core'
import {
  ExportedItem,
  Item,
  ItemRarity,
  ItemSection,
  ItemSectionParserService,
  Section,
} from '@shared/module/poe/type'
import { ClientStringService } from '../../client-string/client-string.service'

@Injectable({
  providedIn: 'root',
})
export class ItemSectionRelicParserService implements ItemSectionParserService {
  constructor(private readonly clientString: ClientStringService) {}

  public optional = true
  public section = ItemSection.Relic

  public parse(item: ExportedItem, target: Item): Section {
    const phrase = new RegExp(`^${this.clientString.translate('ItemPopupRelicUnique')}$`)

    const relicSection = item.sections.find((x) => phrase.test(x.content))
    if (!relicSection) {
      return null
    }

    target.rarity = ItemRarity.UniqueRelic
    target.relic = true
    return relicSection
  }
}

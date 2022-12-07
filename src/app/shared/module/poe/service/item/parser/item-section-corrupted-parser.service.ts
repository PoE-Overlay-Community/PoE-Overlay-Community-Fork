import { Injectable } from '@angular/core'
import {
  ExportedItem,
  Item,
  ItemSection,
  ItemSectionParserService,
  Section,
} from '@shared/module/poe/type'
import { ClientStringService } from '../../client-string/client-string.service'

@Injectable({
  providedIn: 'root',
})
export class ItemSectionCorruptedParserService implements ItemSectionParserService {
  constructor(private readonly clientString: ClientStringService) {}

  public optional = true
  public section = ItemSection.Corrupted

  public parse(item: ExportedItem, target: Item): Section {
    const phrases = [
      new RegExp(`^${this.clientString.translate('ItemPopupCorrupted')}$`),
      new RegExp(`^${this.clientString.translate('ItemPopupUnmodifiable')}$`),
    ]

    const corruptedSection = item.sections.find(section => phrases.some(phrase => phrase.test(section.content)))
    if (!corruptedSection) {
      return null
    }

    if (phrases[0].test(corruptedSection.content)) {
      target.corrupted = true
    } else if (phrases[1].test(corruptedSection.content)) {
      target.unmodifiable = true
    }
    return corruptedSection
  }
}

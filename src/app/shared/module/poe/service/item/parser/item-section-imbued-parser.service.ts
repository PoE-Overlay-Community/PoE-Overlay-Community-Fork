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
export class ItemSectionImbuedParserService implements ItemSectionParserService {
  constructor(private readonly clientString: ClientStringService) { }

  public optional = true
  public section = ItemSection.Imbued

  public parse(item: ExportedItem, target: Item): Section {
    const phrase = new RegExp(`^${this.clientString.translate('ItemPopupImbued')}$`)

    const imbuedSection = item.sections.find(section => phrase.test(section.content))
    if (!imbuedSection) {
      return null
    }

    target.imbued = true

    return imbuedSection
  }
}

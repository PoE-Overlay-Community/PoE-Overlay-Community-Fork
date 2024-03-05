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
export class ItemSectionMirroredParserService implements ItemSectionParserService {
  constructor(private readonly clientString: ClientStringService) {}

  public optional = true
  public section = ItemSection.Mirrored

  public parse(item: ExportedItem, target: Item): Section {
    const phrase = new RegExp(`^${this.clientString.translate('ItemPopupMirrored')}$`)

    const mirroredSection = item.sections.find(section => phrase.test(section.content))
    if (!mirroredSection) {
      return null
    }

    target.mirrored = true

    return mirroredSection
  }
}

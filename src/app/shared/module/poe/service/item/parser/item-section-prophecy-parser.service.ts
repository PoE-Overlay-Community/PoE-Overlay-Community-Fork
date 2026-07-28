import { Injectable } from '@angular/core'
import {
    ExportedItem,
    Item, ItemCategory, ItemSection,
    ItemSectionParserService,
    Section
} from '@shared/module/poe/type'
import { ClientStringService } from '../../client-string/client-string.service'

const PROPHECY_REGEX = /^Prophecy(?!(Tab|Popup))/

@Injectable({
  providedIn: 'root',
})
export class ItemSectionProphecyParserService implements ItemSectionParserService {
  constructor(private readonly clientString: ClientStringService) {}

  public optional = true
  public section = ItemSection.Prophecy

  public parse(item: ExportedItem, target: Item): Section {
    if (target.category !== ItemCategory.Prophecy) {
      return null
    }

    const phrases = this.clientString.translateMultiple(PROPHECY_REGEX)

    const prophecySection = item.sections.find(
      (section) =>
        phrases.findIndex((phrase) => section.content.indexOf(phrase.translation) !== -1) !== -1
    )
    if (!prophecySection) {
      return null
    }

    const prophecyText = phrases.find(
      (phrase) => prophecySection.content.indexOf(phrase.translation) !== -1
    )

    if (!target.properties) {
      target.properties = {}
    }

    target.properties.prophecyText = prophecyText.translation

    return prophecySection
  }
}

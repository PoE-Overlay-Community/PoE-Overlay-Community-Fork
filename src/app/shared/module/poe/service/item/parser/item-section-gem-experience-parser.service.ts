import { Injectable } from '@angular/core'
import {
  ExportedItem,
  Item,
  ItemProperties,
  ItemValueProperty,
  ItemSection,
  ItemSectionParserService,
  Section,
  ItemCategory,
} from '@shared/module/poe/type'
import { ClientStringService } from '../../client-string/client-string.service'

@Injectable({
  providedIn: 'root',
})
export class ItemSectionGemExperienceParserService implements ItemSectionParserService {
  constructor(private readonly clientString: ClientStringService) {}

  public optional = true
  public section = ItemSection.Experience

  public parse(item: ExportedItem, target: Item): Section {
    switch (target.category) {
      case ItemCategory.Gem:
      case ItemCategory.GemActiveGem:
      case ItemCategory.GemSupportGem:
      case ItemCategory.GemSupportGemplus:
        break
      default:
        return null
    }

    const phrase = `${this.clientString.translate('Experience')}: `

    const experienceSection = item.sections.find((x) => x.content.indexOf(phrase) !== -1)
    if (!experienceSection) {
      return null
    }

    if (!target.properties) {
      target.properties = {}
    }

    const experience = experienceSection.lines
      .find((x) => x.indexOf(phrase) !== -1)
      .replace(phrase, '')
    const splittedExp = experience.split('/')

    target.properties.gemExperience = {
      augmented: false,
      value: {
        text: experience,
        value: +splittedExp[0],
        min: +splittedExp[0],
        max: +splittedExp[1],
      },
    }

    return experienceSection
  }
}

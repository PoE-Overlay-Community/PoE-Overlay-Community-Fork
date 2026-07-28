import { Injectable } from '@angular/core'
import { EnumValues } from '@app/class'
import {
  ExportedItem,
  HeistJob,
  HeistObjectiveValue,
  Item,
  ItemCategory,
  ItemSection,
  ItemSectionParserService,
  ItemValue,
  ItemValueProperty,
  Section,
} from '@shared/module/poe/type'
import { ClientStringService } from '../../client-string/client-string.service'
import { ItemParserUtils } from './item-parser.utils'

@Injectable({
  providedIn: 'root',
})
export class ItemSectionHeistParserService implements ItemSectionParserService {
  private readonly heistObjectiveValues = new EnumValues(HeistObjectiveValue)

  private readonly heistJobValues = new EnumValues(HeistJob)

  constructor(private readonly clientString: ClientStringService) {}

  public optional = true
  public section = ItemSection.Heist

  public parse(item: ExportedItem, target: Item): Section {
    switch (target.category) {
      case ItemCategory.HeistContract:
      case ItemCategory.HeistBlueprint:
        break
      default:
        return null
    }

    const phrases = this.getPhrases()

    const heistSection = item.sections.find((section) => section.content.indexOf(phrases[0]) !== -1)
    if (!heistSection) {
      return null
    }

    if (!target.properties) {
      target.properties = {}
    }
    if (!target.properties.heist) {
      target.properties.heist = {
        requiredSkills: [],
      }
    }

    const props = target.properties
    const heist = props.heist

    const lines = heistSection.lines
    for (const line of lines) {
      const objectiveName = this.parsePhrase(line, phrases[0])
      if (objectiveName) {
        const objectiveRegex = new RegExp(
          this.clientString
            .translate('ItemDisplayHeistContractObjectiveWithValue')
            .replace('(', '\\(')
            .replace(')', '\\)')
            .replace('{0}', '(.+)')
            .replace('{1}', '(.+)')
        )
        const matches = objectiveRegex.exec(line)
        if (matches) {
          heist.objectiveName = matches[1]
          for (const objectiveValue of this.heistObjectiveValues.keys) {
            if (
              matches[2] === this.clientString.translate(`HeistObjectiveValue${objectiveValue}`)
            ) {
              heist.objectiveValue = objectiveValue
              break
            }
          }
        } else {
          heist.objectiveName = objectiveName
        }
      }

      const jobName = this.parsePhrase(line, phrases[1])
      if (jobName) {
        const jobRegex = new RegExp(
          this.clientString
            .translate('ItemDisplayHeistContractJob')
            .replace('(', '\\(')
            .replace(')', '\\)')
            .replace('{0}', '(.+)')
            .replace('{1}', '(.+)')
        )
        const matches = jobRegex.exec(line)
        if (matches) {
          for (const job of this.heistJobValues.keys) {
            if (
              matches[1] ===
              this.clientString.translate(`HeistJob${this.heistJobValues.values[job]}`)
            ) {
              heist.requiredSkills.push({
                job,
                level: ItemParserUtils.parseItemValue(matches[2], 0),
              })
              break
            }
          }
        }
      }

      heist.wingsRevealed = this.parseValue(line, phrases[2], heist.wingsRevealed)
      heist.rewardRooms = this.parseValue(line, phrases[3], heist.rewardRooms)
      heist.escapeRoutes = this.parseValue(line, phrases[4], heist.escapeRoutes)
      props.areaLevel = this.parseValueProperty(line, phrases[5], props.areaLevel)
    }

    return heistSection
  }

  private parseValueProperty(
    line: string,
    phrase: string,
    prop: ItemValueProperty,
    numDecimals: number = 0
  ): ItemValueProperty {
    const text = this.parsePhrase(line, phrase)
    if (!text) {
      return prop
    }
    return {
      value: ItemParserUtils.parseItemValue(text, numDecimals),
      augmented: false,
    }
  }

  private parseValue(
    line: string,
    phrase: string,
    prop: ItemValue,
    numDecimals: number = 0
  ): ItemValue {
    const text = this.parsePhrase(line, phrase)
    if (!text) {
      return prop
    }
    return ItemParserUtils.parseItemValue(text, numDecimals)
  }

  private parsePhrase(line: string, phrase: string): string {
    if (line.indexOf(phrase) !== 0) {
      return ''
    }
    return line.slice(phrase.length)
  }

  private getPhrases(): string[] {
    return [
      this.clientString.translate('ItemDisplayHeistContractObjective').replace('{0}', ''),
      this.clientString.translate('ItemDisplayHeistContractNPC').replace('{0}', ''),
      `${this.clientString.translate('ItemDisplayHeistBlueprintWings')}: `,
      `${this.clientString.translate('ItemDisplayHeistBlueprintRewardRooms')}: `,
      `${this.clientString.translate('ItemDisplayHeistBlueprintEscapeRooms')}: `,
      `${this.clientString.translate('ItemDisplayHeistContractLevel')}: `,
    ]
  }
}

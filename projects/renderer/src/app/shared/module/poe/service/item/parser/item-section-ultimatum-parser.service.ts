import { Injectable } from '@angular/core'
import {
  ExportedItem,
  Item,
  ItemSection,
  ItemSectionParserService,
  Section,
  UltimatumChallengeType,
  UltimatumRewardType,
} from '@shared/module/poe/type'
import { BaseItemTypesService } from '../../base-item-types/base-item-types.service'
import { ClientStringService } from '../../client-string/client-string.service'
import { UltimatumStringService } from '../../ultimatum/ultimatum-string.service'
import { WordService } from '../../word/word.service'
import { ItemParserUtils } from './item-parser.utils'

@Injectable({
  providedIn: 'root',
})
export class ItemSectionUltimatumParserService implements ItemSectionParserService {
  constructor(
    private readonly clientString: ClientStringService,
    private readonly baseItemTypesService: BaseItemTypesService,
    private readonly wordService: WordService,
    private readonly ultimatumStringService: UltimatumStringService
  ) {}

  public optional = true
  public section = ItemSection.Ultimatum

  public parse(item: ExportedItem, target: Item): Section {
    const challengeTypePhrase = `${this.clientString.translate(
      'UltimatumItemisedTrialEncounter'
    )}: `

    const ultimatumSection = item.sections.find(
      (x) => x.content.indexOf(challengeTypePhrase) !== -1
    )
    if (!ultimatumSection) {
      return null
    }

    if (!target.properties) {
      target.properties = {}
    }
    if (!target.properties.ultimatum) {
      target.properties.ultimatum = {}
    }

    const props = target.properties
    const ultimatum = props.ultimatum

    const lines = ultimatumSection.lines

    // Challange Type
    const challengeTypes = this.ultimatumStringService.getChallengeTypes()
    const challengeTypeValue = lines[0].slice(challengeTypePhrase.length).trim()

    const challengeType = challengeTypes.find((x) => x.key === challengeTypeValue)
    if (!challengeType) {
      target.properties.ultimatum = undefined
      return null
    }
    ultimatum.challengeType = challengeType.value

    // Reward Type
    const rewardTypePhrase = this.clientString
      .translate('UltimatumItemisedTrialReward')
      .replace('{0}', '')
    const rewardLine = lines[3]
    const rewardTypes = this.ultimatumStringService.getRewardTypes()
    const rewardTypeValue = rewardLine.slice(rewardTypePhrase.length).trim()

    const rewardType = rewardTypes.find((x) => x.key === rewardTypeValue)
    if (!rewardType) {
      ultimatum.rewardUnique = this.wordService.search(rewardTypeValue.replace(/<<[^>>]*>>/g, ''))
      if (!ultimatum.rewardUnique) {
        target.properties.ultimatum = undefined
        return null
      }
      ultimatum.rewardType = UltimatumRewardType.UniqueItem
    } else {
      ultimatum.rewardType = rewardType.value
    }

    // Required Sacrifice
    const sacrificeQuantityPhrase = this.clientString.translate(
      'UltimatumItemisedTrialItemRequirementQuantity'
    )
    const sacrificeQuantitySuffix = sacrificeQuantityPhrase.slice(
      sacrificeQuantityPhrase.indexOf('{1}') + 3
    )
    const sacrificeLine = lines[2].replace(sacrificeQuantitySuffix, '').trim()
    const sacrificePhrase = this.clientString
      .translate('UltimatumItemisedTrialItemRequirement')
      .replace('{0}', '')
    const sacrificeValue = sacrificeLine.slice(sacrificePhrase.length).trim()
    const sacrificeQuantityRegex = new RegExp(
      `(.*)${this.clientString
        .translate('UltimatumItemisedTrialQuantityFormat')
        .replace('{0}', '(\\S+)')}$`
    )
    const sacrificeQuantityMatches = sacrificeQuantityRegex.exec(sacrificeValue)
    if (sacrificeQuantityMatches) {
      ultimatum.requiredItem = this.baseItemTypesService.searchId(
        sacrificeQuantityMatches[1].trim()
      )
      const sacrificeAmount = sacrificeQuantityMatches[2]
      ultimatum.requiredItemAmount = {
        text: sacrificeAmount,
        value: +sacrificeAmount,
        min: +sacrificeAmount,
        max: +sacrificeAmount,
      }
    } else if (ultimatum.rewardType === UltimatumRewardType.UniqueItem) {
      ultimatum.requiredItem = this.wordService.search(sacrificeValue)
    }

    // Area Level
    const areaLevelPhrase = `${this.clientString.translate('UltimatumItemisedTrialLevel')}: `
    props.areaLevel = {
      value: ItemParserUtils.parseItemValue(lines[1].slice(areaLevelPhrase.length).trim(), 0),
      augmented: false,
    }

    return ultimatumSection
  }
}

import { Injectable } from '@angular/core'
import {
  ExportedItem,
  Item,
  ItemCategory,
  ItemGemQualityType,
  ItemRarity,
  ItemSection,
  ItemSectionParserService,
  Language,
  Section,
} from '../../../type'
import { BaseItemTypesService } from '../../base-item-types/base-item-types.service'
import { ClientStringService } from '../../client-string/client-string.service'
import { WordService } from '../../word/word.service'

@Injectable({
  providedIn: 'root',
})
export class ItemSectionRarityParserService implements ItemSectionParserService {
  constructor(
    private readonly clientString: ClientStringService,
    private readonly baseItemTypesService: BaseItemTypesService,
    private readonly wordService: WordService
  ) {}

  public optional = false
  public section = ItemSection.Rartiy

  public parse(item: ExportedItem, target: Item): Section {
    const phrase = `${this.clientString.translate('ItemDisplayStringClass')}: `

    const raritySection = item.sections.find((x) => x.content.indexOf(phrase) === 0)
    if (!raritySection) {
      console.warn('[ItemRarityParser] Failed to find Item Class.')
      return null
    }

    const lines = raritySection.lines
    const rarityPhrase = `${this.clientString.translate('ItemDisplayStringRarity')}: `

    const rarities = this.getRarities()
    const rarityValue = lines[1].slice(rarityPhrase.length).trim()

    const rarity = rarities.find((x) => x.key === rarityValue)
    if (!rarity) {
      console.warn(`[ItemRarityParser] Failed to find Item Rarity for '${rarityValue}'.`)
      return null
    }

    target.rarity = rarity.value

    switch (lines.length) {
      case 3:
        target.type = lines[2].replace(/<<[^>>]*>>/g, '')
        target.typeId = this.baseItemTypesService.searchId(target.type) || this.baseItemTypesService.searchId(target.type, Language.English)
        break
      case 4:
        target.name = lines[2].replace(/<<[^>>]*>>/g, '')
        target.nameId = this.wordService.search(target.name) || this.wordService.search(target.name, Language.English)
        target.type = lines[3].replace(/<<[^>>]*>>/g, '')
        target.typeId = this.baseItemTypesService.searchId(target.type) || this.baseItemTypesService.searchId(target.type, Language.English)
        break
      default:
        console.warn(`[ItemRarityParser] Incorrect line count for this section. Expected 3~4, found ${lines.length}`)
        return null
    }

    // Check for special master mission prophecies
    const masterMissionPhrases = this.getMasterMissionPhrases()
    const masterMission = masterMissionPhrases.find(
      (x) =>
        item.sections.findIndex((section) => section.content.indexOf(x.prophecyText) !== -1) !== -1
    )
    if (masterMission) {
      target.type += ` (${masterMission.masterName})`
      target.typeId = this.baseItemTypesService.searchId(target.type)
    }

    if (!target.typeId) {
      console.warn(`[ItemRarityParser] Failed to find Base Item Type for '${target.type}'`)
      return null
    }

    // Check for blighted map
    const blightedMapItemNameDisplay = this.clientString
      .translate('InfectedMap')
      .replace('{0}', this.baseItemTypesService.translate(target.typeId))
    if (target.type === blightedMapItemNameDisplay) {
      target.blighted = true
    }

    // Check for blight-ravaged map
    const blightRavagedMapItemNameDisplay = this.clientString
      .translate('UberInfectedMap')
      .replace('{0}', this.baseItemTypesService.translate(target.typeId))
    if (target.type === blightRavagedMapItemNameDisplay) {
      target.blightRavaged = true
    }

    // Check for metamorph samples
    const metamorphSamplePhrase = this.clientString.translate('MetamorphosisItemisedMapBoss')

    const metamorphSample = item.sections.find(
      (x) => x.content.indexOf(metamorphSamplePhrase) === 0
    )
    if (!metamorphSample) {
      target.category = this.baseItemTypesService.get(target.typeId).category
    } else {
      target.category = ItemCategory.MonsterSample

      // Determine the body part and update the item base type (typeId) accordingly.
      const metamorphItemNameDisplay = this.clientString
        .translate('MetamorphosisItemisedBossDisplayText')
        .replace('{0}', this.baseItemTypesService.translate(target.typeId))
      const metamorphBodyParts = this.getMetamorphBodyParts()
      for (const metamorphBodyPart of metamorphBodyParts) {
        if (metamorphItemNameDisplay.replace('{1}', metamorphBodyPart.key) === target.type) {
          target.name = target.type
          target.typeId = metamorphBodyPart.value
          break
        }
      }
    }

    if (!target.category) {
      console.warn(`[ItemRarityParser] Failed to find Item Category for '${target.type}' (${target.typeId})`)
      return null
    }

    // Check for gem naming
    if (
      target.category === ItemCategory.Gem ||
      target.category.indexOf(`${ItemCategory.Gem}.`) === 0
    ) {
      if (!target.properties) {
        target.properties = {}
      }

      // Check for vaal gem
      for (const section of item.sections) {
        if (section.lines.length !== 1) {
          continue
        }

        if (section.lines[0].length <= target.type.length) {
          continue
        }

        const type = section.lines[0]
        const id = this.baseItemTypesService.searchId(type)
        if (id === undefined || id.indexOf('Vaal') === -1) {
          continue
        }

        target.typeId = id
        target.type = type
        break
      }

      // Check for alternate quality
      target.properties.gemQualityType = ItemGemQualityType.Default

      const alternateQualityPhrases = this.getAlternateQualityGemNamesPhrases()
      for (const alternateQualityPhrase of alternateQualityPhrases) {
        const alternateQualityGemNameDisplay = alternateQualityPhrase.alternateQualityText.replace(
          '{0}',
          this.baseItemTypesService.translate(target.typeId)
        )
        if (target.type === alternateQualityGemNameDisplay) {
          target.properties.gemQualityType = alternateQualityPhrase.gemQualityType
          break
        }
      }
    }

    return raritySection
  }

  private getRarities(): {
    key: string
    value: ItemRarity
  }[] {
    return [
      {
        key: this.clientString.translate('ItemDisplayStringNormal'),
        value: ItemRarity.Normal,
      },
      {
        key: this.clientString.translate('ItemDisplayStringMagic'),
        value: ItemRarity.Magic,
      },
      {
        key: this.clientString.translate('ItemDisplayStringRare'),
        value: ItemRarity.Rare,
      },
      {
        key: this.clientString.translate('ItemDisplayStringUnique'),
        value: ItemRarity.Unique,
      },
      {
        key: this.clientString.translate('ItemDisplayStringCurrency'),
        value: ItemRarity.Currency,
      },
      {
        key: this.clientString.translate('ItemDisplayStringGem'),
        value: ItemRarity.Gem,
      },
      {
        key: this.clientString.translate('ItemDisplayStringDivinationCard'),
        value: ItemRarity.DivinationCard,
      },
    ]
  }

  private getMetamorphBodyParts(): {
    key: string
    value: string
  }[] {
    return [
      {
        key: this.clientString.translate('MetamorphBodyPart1'),
        value: 'MetamorphosisBrain',
      },
      {
        key: this.clientString.translate('MetamorphBodyPart2'),
        value: 'MetamorphosisEye',
      },
      {
        key: this.clientString.translate('MetamorphBodyPart3'),
        value: 'MetamorphosisLung',
      },
      {
        key: this.clientString.translate('MetamorphBodyPart4'),
        value: 'MetamorphosisHeart',
      },
      {
        key: this.clientString.translate('MetamorphBodyPart5'),
        value: 'MetamorphosisLiver',
      },
    ]
  }

  private getMasterMissionPhrases(): {
    prophecyText: string
    masterName: string
  }[] {
    return [
      {
        prophecyText: this.clientString.translate('ProphecyQuestTrackerEinhar'),
        masterName: this.clientString.translate('MasterNameEinhar'),
      },
      {
        prophecyText: this.clientString.translate('ProphecyQuestTrackerAlva'),
        masterName: this.clientString.translate('MasterNameAlva'),
      },
      {
        prophecyText: this.clientString.translate('ProphecyQuestTrackerNiko'),
        masterName: this.clientString.translate('MasterNameNiko'),
      },
      {
        prophecyText: this.clientString.translate('ProphecyQuestTrackerZana'),
        masterName: this.clientString.translate('MasterNameZana'),
      },
      {
        prophecyText: this.clientString.translate('ProphecyQuestTrackerJun'),
        masterName: this.clientString.translate('MasterNameJun'),
      },
    ]
  }

  private getAlternateQualityGemNamesPhrases(): {
    alternateQualityText: string
    gemQualityType: ItemGemQualityType
  }[] {
    return [
      {
        alternateQualityText: this.clientString.translate('GemAlternateQuality1Affix'),
        gemQualityType: ItemGemQualityType.Anomalous,
      },
      {
        alternateQualityText: this.clientString.translate('GemAlternateQuality2Affix'),
        gemQualityType: ItemGemQualityType.Divergent,
      },
      {
        alternateQualityText: this.clientString.translate('GemAlternateQuality3Affix'),
        gemQualityType: ItemGemQualityType.Phantasmal,
      },
    ]
  }
}

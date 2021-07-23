import { Injectable } from '@angular/core'
import {
  ExportedItem,
  Item,
  ItemProperty,
  ItemRarity,
  ItemSection,
  ItemSectionParserService,
  ItemValueProperty,
  Section,
  ItemValue,
} from '@shared/module/poe/type'
import { ClientStringService } from '../../client-string/client-string.service'
import { ItemParserUtils } from './item-parser.utils'

const AUGMENTED_PHRASE = ' (augmented)'

@Injectable({
  providedIn: 'root',
})
export class ItemSectionPropertiesParserService implements ItemSectionParserService {
  constructor(private readonly clientString: ClientStringService) {}

  public optional = true
  public section = ItemSection.Properties

  public parse(item: ExportedItem, target: Item): Section {
    switch (target.rarity) {
      case ItemRarity.DivinationCard:
        return null
    }

    const phrases = this.getPhrases()
    const propertiesSection = item.sections.find(
      (section) => phrases.findIndex((prop) => section.content.indexOf(prop) !== -1) !== -1
    )
    if (!propertiesSection) {
      return null
    }

    if (!target.properties) {
      target.properties = {}
    }

    const props = target.properties

    const lines = propertiesSection.lines
    for (const line of lines) {
      switch (target.rarity) {
        case ItemRarity.Normal:
        case ItemRarity.Magic:
        case ItemRarity.Rare:
        case ItemRarity.Unique:
        case ItemRarity.UniqueRelic:
        case ItemRarity.NonUnique:
          props.weaponPhysicalDamage = this.parseValueProperty(
            line,
            phrases[0],
            props.weaponPhysicalDamage
          )
          // Elemental damage can contain multiple damage values (fire/cold/lightning/etc...)
          props.weaponElementalDamage = this.parseValueProperties(
            line,
            phrases[1],
            props.weaponElementalDamage
          )
          props.weaponChaosDamage = this.parseValueProperty(
            line,
            phrases[2],
            props.weaponChaosDamage
          )
          props.weaponCriticalStrikeChance = this.parseValueProperty(
            line,
            phrases[3],
            props.weaponCriticalStrikeChance,
            2
          )
          props.weaponAttacksPerSecond = this.parseValueProperty(
            line,
            phrases[4],
            props.weaponAttacksPerSecond,
            2
          )
          props.weaponRange = this.parseProperty(line, phrases[5], props.weaponRange)
          props.shieldBlockChance = this.parseValueProperty(
            line,
            phrases[6],
            props.shieldBlockChance
          )
          props.armourArmour = this.parseValueProperty(line, phrases[7], props.armourArmour)
          props.armourEvasionRating = this.parseValueProperty(
            line,
            phrases[8],
            props.armourEvasionRating
          )
          props.armourEnergyShield = this.parseValueProperty(
            line,
            phrases[9],
            props.armourEnergyShield
          )
          break
      }
      props.stackSize = this.parseValueProperty(line, phrases[10], props.stackSize)
      props.gemLevel = this.parseValueProperty(line, phrases[11], props.gemLevel)
      props.mapTier = this.parseValueProperty(line, phrases[12], props.mapTier)
      if (props.mapTier) {
        const areaLevel: number = 67 + props.mapTier.value.value
        props.areaLevel = {
          augmented: false,
          value: {
            text: `${areaLevel}`,
            value: areaLevel
          }
        }
      }
      props.mapQuantity = this.parseValueProperty(line, phrases[13], props.mapQuantity)
      props.mapRarity = this.parseValueProperty(line, phrases[14], props.mapRarity)
      props.mapPacksize = this.parseValueProperty(line, phrases[15], props.mapPacksize)
      for (let quality = 0; quality < 8; quality++) {
        const old = props.quality
        props.quality = this.parseValueProperty(line, phrases[16 + quality], old)
        if (props.quality !== old) {
          props.qualityType = quality
        }
      }
      props.durability = this.parseValueProperty(line, phrases[24], props.durability)
      props.storedExperience = this.parseValueProperty(line, phrases[25], props.storedExperience)
    }

    return propertiesSection
  }

  private parseProperty(line: string, phrase: string, prop: ItemProperty): ItemProperty {
    const [text, augmented] = this.parsePhrase(line, phrase)
    if (!text) {
      return prop
    }
    const property: ItemProperty = {
      augmented,
      value: text,
    }
    return property
  }

  private parseValueProperties(
    line: string,
    phrase: string,
    prop: ItemValueProperty[],
    numDecimals: number = 0
  ): ItemValueProperty[] {
    if (line.indexOf(phrase) !== 0) {
      return prop
    }
    return line
      .slice(phrase.length)
      .split(',')
      .map((t) => {
        const [text, augmented] = this.parseText(t.trim())
        const property: ItemValueProperty = {
          augmented,
          value: ItemParserUtils.parseItemValue(text, numDecimals),
        }
        return property
      })
  }

  private parseValueProperty(
    line: string,
    phrase: string,
    prop: ItemValueProperty,
    numDecimals: number = 0
  ): ItemValueProperty {
    const [text, augmented] = this.parsePhrase(line, phrase)
    if (!text) {
      return prop
    }
    const property: ItemValueProperty = {
      augmented,
      value: ItemParserUtils.parseItemValue(text, numDecimals),
    }
    return property
  }

  private parsePhrase(line: string, phrase: string): [string, boolean] {
    if (line.indexOf(phrase) !== 0) {
      return ['', false]
    }
    return this.parseText(line.slice(phrase.length))
  }

  private parseText(line: string): [string, boolean] {
    const max = this.clientString.translate('ItemDisplaySkillGemMaxLevel').replace('{0}', '')
    const augmented = line.indexOf(AUGMENTED_PHRASE) !== -1
    const text = line.replace(max, '').replace(AUGMENTED_PHRASE, '')
    return [text, augmented]
  }

  private getPhrases(): string[] {
    return [
      `${this.clientString.translate('ItemDisplayWeaponPhysicalDamage')}: `,
      `${this.clientString.translate('ItemDisplayWeaponElementalDamage')}: `,
      `${this.clientString.translate('ItemDisplayWeaponChaosDamage')}: `,
      `${this.clientString.translate('ItemDisplayWeaponCriticalStrikeChance')}: `,
      `${this.clientString.translate('ItemDisplayWeaponAttacksPerSecond')}: `,
      `${this.clientString.translate('ItemDisplayWeaponRange')}: `,
      `${this.clientString.translate('ItemDisplayShieldBlockChance')}: `,
      `${this.clientString.translate('ItemDisplayArmourArmour')}: `,
      `${this.clientString.translate('ItemDisplayArmourEvasionRating')}: `,
      `${this.clientString.translate('ItemDisplayArmourEnergyShield')}: `,
      `${this.clientString.translate('ItemDisplayStackSize')}: `,
      `${this.clientString.translate('Level')}: `,
      `${this.clientString.translate('ItemDisplayMapTier')}: `,
      `${this.clientString.translate('ItemDisplayMapQuantityIncrease')}: `,
      `${this.clientString.translate('ItemDisplayMapRarityIncrease')}: `,
      `${this.clientString.translate('ItemDisplayMapPackSizeIncrease')}: `,
      `${this.clientString.translate('Quality')}: `,
      `${this.clientString.translate('Quality1')}: `,
      `${this.clientString.translate('Quality2')}: `,
      `${this.clientString.translate('Quality3')}: `,
      `${this.clientString.translate('Quality4')}: `,
      `${this.clientString.translate('Quality5')}: `,
      `${this.clientString.translate('Quality6')}: `,
      `${this.clientString.translate('Quality7')}: `,
      `${this.clientString.translate('ItemDisplayHarvestBoosterUses')}: `,
      `${this.clientString.translate('ItemDisplayStoredExperience')}: `,
    ]
  }
}

import { Injectable } from '@angular/core'
import { Item, ItemCategory, ItemValue } from '@shared/module/poe/type'
import { ItemParserUtils } from '../parser/item-parser.utils'

interface RangeMap {
  [id: string]: Range[]
}

interface Range {
  min: number
  max: number
}

const addedPassiveSkillsRanges: RangeMap = {
  ['JewelPassiveTreeExpansionMedium']: [
    {
      min: 4,
      max: 5,
    },
  ],
}

const itemLevelRanges: Range[] = [
  {
    min: 1,
    max: 49,
  },
  {
    min: 50,
    max: 67,
  },
  {
    min: 68,
    max: 74,
  },
  {
    min: 75,
    max: 83,
  },
  {
    min: 84,
    max: 100,
  },
]

@Injectable({
  providedIn: 'root',
})
export class ItemClusterJewelProcessorService {
  public process(item: Item): void {
    const { level, stats } = item
    if (!level || !stats || item.category !== ItemCategory.JewelCluster) {
      return
    }

    const addsPassiveSkillsStat = stats.find(x => x.id === 'local_jewel_expansion_passive_node_count')
    if (!addsPassiveSkillsStat) {
      return
    }

    // Determine 'add X passive skills' pre-filled value ranges
    this.applyRangeValues(addsPassiveSkillsStat.values[0], addedPassiveSkillsRanges[item.typeId])

    // Determine item level ranges
    this.applyRangeValues(level, itemLevelRanges)
  }

  private applyRangeValues(itemValue: ItemValue, ranges: Range[]): void {
    if (!itemValue) {
      return
    }
    itemValue.value = itemValue.value || ItemParserUtils.parseNumberSimple(itemValue.text)
    let min = itemValue.value
    let max = itemValue.value
    if (ranges) {
      for (const range of ranges) {
        if (itemValue.value >= range.min && itemValue.value <= range.max) {
          min = range.min
          max = range.max
          break
        }
      }
    }
    itemValue.min = min
    itemValue.max = max
  }
}

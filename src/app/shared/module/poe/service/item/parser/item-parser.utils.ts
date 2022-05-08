import { ItemValue } from '@shared/module/poe/type'

export abstract class ItemParserUtils {
  public static parseNumberSimple(text: string): number {
    return +text.replace('%', '')
  }

  public static parseNumber(text: string): number {
    return +text.split(/[\+%,\. ]+/).join('')
  }

  public static parseDecimalNumber(text: string, numDecimals: number): number {
    return this.parseNumber(text) / Math.pow(10, numDecimals)
  }

  public static parseItemValue(text: string, numDecimals: number): ItemValue {
    let itemValue: ItemValue
    if (text.indexOf('/') !== -1) {
      const splitted = text.split('/')
      itemValue = {
        text,
        value: ItemParserUtils.parseDecimalNumber(splitted[0], numDecimals),
        min: ItemParserUtils.parseDecimalNumber(splitted[0], numDecimals),
        max: ItemParserUtils.parseDecimalNumber(splitted[1], numDecimals),
      }
    } else {
      itemValue = {
        text,
        value: ItemParserUtils.parseDecimalNumber(text, numDecimals),
      }
    }
    return itemValue
  }
}

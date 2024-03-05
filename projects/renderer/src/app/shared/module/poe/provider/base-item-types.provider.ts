import { Injectable } from '@angular/core'
import baseItemTypesArray from '../../../../../assets/poe/base-item-types-normalised.json'
import { EnumValues } from '../../../../core/class'
import { BaseItemType, BaseItemTypeNameMap, Language } from '../type'

@Injectable({
  providedIn: 'root',
})
export class BaseItemTypesProvider {
  private readonly baseItemTypeNames: BaseItemTypeNameMap[] = []
  private readonly baseItemTypes: Map<string, BaseItemType>

  constructor() {
    const languages = new EnumValues(Language)
    
    for (const language of languages.keys) {
      this.baseItemTypeNames[language] = {}
    }
    this.baseItemTypes = new Map()
    for (const item of baseItemTypesArray as [string,BaseItemType][]) {
      const key = crypto.randomUUID()
      const baseItemType = item[1]
      this.baseItemTypes.set(key, baseItemType)
      for (const language in baseItemType.names) {
        const name = baseItemType.names[language]
        if (!this.baseItemTypeNames[+language][name]) {
          this.baseItemTypeNames[+language][name] = key
        }
      }
    }
  }

  public provideBaseItemType(id: string): BaseItemType {
    return this.baseItemTypes.get(id)
  }

  public provideNames(language: Language): BaseItemTypeNameMap {
    return this.baseItemTypeNames[language]
  }
}

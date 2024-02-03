import { Injectable } from '@angular/core'
import baseItemTypes from '../../../../../assets/poe/base-item-types-v2.json'
import { EnumValues } from '../../../../core/class'
import { BaseItemType, BaseItemTypeNameMap, Language } from '../type'

@Injectable({
  providedIn: 'root',
})
export class BaseItemTypesProvider {
  private readonly baseItemTypeNames: BaseItemTypeNameMap[] = []

  constructor() {
    const languages = new EnumValues(Language)
    for (const language of languages.keys) {
      this.baseItemTypeNames[language] = {}
    }
    for (const key in baseItemTypes) {
      const baseItemType = this.provideBaseItemType(key)
      for (const language in baseItemType.names) {
        const name = baseItemType.names[language]
        if (!this.baseItemTypeNames[+language][name]) {
          this.baseItemTypeNames[+language][name] = key
        }
      }
    }
  }

  public provideBaseItemType(id: string): BaseItemType {
    return baseItemTypes[id]
  }

  public provideNames(language: Language): BaseItemTypeNameMap {
    return this.baseItemTypeNames[language]
  }
}

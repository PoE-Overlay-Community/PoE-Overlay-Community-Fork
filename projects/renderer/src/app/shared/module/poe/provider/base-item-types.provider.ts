import { Injectable } from '@angular/core'
import baseItemTypesArray from '../../../../../assets/poe/base-item-types-normalised.json'
//import baseItemTypes from '../../../../../assets/poe/base-item-types-v2.json'
import { EnumValues } from '../../../../core/class'
import { BaseItemType, BaseItemTypeNameMap, Language } from '../type'

// TODO: remove old code / revert and fix duplicate keys in json

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
    /*
    for (const key in baseItemTypes) {
      const baseItemType = this.provideBaseItemType(key)
    */
    // start new code
    this.baseItemTypes = new Map()
    for (const item of baseItemTypesArray as [string,BaseItemType][]) {
      const key = crypto.randomUUID()
      const baseItemType = item[1]
      this.baseItemTypes.set(key, baseItemType)
    // end new code
      
      for (const language in baseItemType.names) {
        const name = baseItemType.names[language]
        if (!this.baseItemTypeNames[+language][name]) {
          this.baseItemTypeNames[+language][name] = key
        }
      }
    }
  }

  public provideBaseItemType(id: string): BaseItemType {
    // return baseItemTypes[id]	
    return this.baseItemTypes.get(id)
  }

  public provideNames(language: Language): BaseItemTypeNameMap {
    return this.baseItemTypeNames[language]
  }
}

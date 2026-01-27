import { Injectable } from '@angular/core'
import modIconsData from '../../../../../assets/poe/mod-icons.json'
import { Language, ModIconsMap } from '../type'

@Injectable({
  providedIn: 'root',
})
export class ModIconsProvider {
  public provide(language: Language): ModIconsMap {
    switch (language) {
      case Language.English:
        return modIconsData.English
      case Language.Portuguese:
        return modIconsData.Portuguese
      case Language.Russian:
        return modIconsData.Russian
      case Language.Thai:
        return modIconsData.Thai
      case Language.German:
        return modIconsData.German
      case Language.French:
        return modIconsData.French
      case Language.Spanish:
        return modIconsData.Spanish
      case Language.Korean:
        return modIconsData.Korean
      // case Language.SimplifiedChinese:
      //     return modIconsData.SimplifiedChinese;
      case Language.TraditionalChinese:
        return modIconsData.TraditionalChinese
      case Language.Japanese:
        return modIconsData.Japanese
      default:
        throw new Error(`Could not map mod-icons to language: '${Language[language]}'.`)
    }
  }
}

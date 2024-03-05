import { Injectable } from '@angular/core'
import modIcons from '../../../../../assets/poe/mod-icons.json'
import { Language, ModIconsMap } from '../type'

const {
  English,
  French,
  German,
  Korean,
  Portuguese,
  Russian,
  SimplifiedChinese,
  Spanish,
  Thai,
  TraditionalChinese,
  Japanese
} = modIcons as {[id: string]: ModIconsMap};

@Injectable({
  providedIn: 'root',
})
export class ModIconsProvider {
  public provide(language: Language): ModIconsMap {
    switch (language) {
      case Language.English:
        return English
      case Language.Portuguese:
        return Portuguese
      case Language.Russian:
        return Russian
      case Language.Thai:
        return Thai
      case Language.German:
        return German
      case Language.French:
        return French
      case Language.Spanish:
        return Spanish
      case Language.Korean:
        return Korean
      // case Language.SimplifiedChinese:
      //     return SimplifiedChinese;
      case Language.TraditionalChinese:
        return TraditionalChinese
      case Language.Japanese:
        return Japanese
      default:
        throw new Error(`Could not map mod-icons to language: '${Language[language]}'.`)
    }
  }
}

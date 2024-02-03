import { Injectable } from '@angular/core'
import words from '../../../../../assets/poe/words.json'
import { Language, WordMap } from '../type'

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
  Japanese,
} = words as { [id: string]: WordMap }

@Injectable({
  providedIn: 'root',
})
export class WordProvider {
  public provide(language: Language): WordMap {
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
        throw new Error(`Could not map words to language: '${Language[language]}'.`)
    }
  }
}

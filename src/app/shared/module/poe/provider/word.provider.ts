import { Injectable } from '@angular/core'
import wordsData from '../../../../../assets/poe/words.json'
import { Language, WordMap } from '../type'

@Injectable({
  providedIn: 'root',
})
export class WordProvider {
  public provide(language: Language): WordMap {
    switch (language) {
      case Language.English:
        return wordsData.English
      case Language.Portuguese:
        return wordsData.Portuguese
      case Language.Russian:
        return wordsData.Russian
      case Language.Thai:
        return wordsData.Thai
      case Language.German:
        return wordsData.German
      case Language.French:
        return wordsData.French
      case Language.Spanish:
        return wordsData.Spanish
      case Language.Korean:
        return wordsData.Korean
      // case Language.SimplifiedChinese:
      //     return wordsData.SimplifiedChinese;
      case Language.TraditionalChinese:
        return wordsData.TraditionalChinese
      case Language.Japanese:
        return wordsData.Japanese
      default:
        throw new Error(`Could not map words to language: '${Language[language]}'.`)
    }
  }
}

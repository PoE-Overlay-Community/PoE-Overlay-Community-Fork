import { Injectable } from '@angular/core'
import clientStringsData from '../../../../../assets/poe/client-strings.json'
import { ClientStringMap, Language } from '../type'

@Injectable({
  providedIn: 'root',
})
export class ClientStringProvider {
  public provide(language: Language): ClientStringMap {
    switch (language) {
      case Language.English:
        return clientStringsData.English
      case Language.Portuguese:
        return clientStringsData.Portuguese
      case Language.Russian:
        return clientStringsData.Russian
      case Language.Thai:
        return clientStringsData.Thai
      case Language.German:
        return clientStringsData.German
      case Language.French:
        return clientStringsData.French
      case Language.Spanish:
        return clientStringsData.Spanish
      case Language.Korean:
        return clientStringsData.Korean
      // case Language.SimplifiedChinese:
      //     return clientStringsData.SimplifiedChinese;
      case Language.TraditionalChinese:
        return clientStringsData.TraditionalChinese
      case Language.Japanese:
        return clientStringsData.Japanese
      default:
        throw new Error(`Could not map clientstrings to language: '${Language[language]}'.`)
    }
  }
}

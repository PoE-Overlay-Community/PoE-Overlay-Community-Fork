import { Injectable } from '@angular/core'
import { WordProvider } from '../../provider'
import { Language } from '../../type'
import { ContextService } from '../context.service'

@Injectable({
  providedIn: 'root',
})
export class WordService {
  constructor(
    private readonly context: ContextService,
    private readonly wordProvider: WordProvider
  ) {}

  public translate(id: string, language?: Language): string {
    language = language || this.context.get().gameLanguage || this.context.get().language

    const map = this.wordProvider.provide(language)
    return map[id] || `untranslated: '${id}' for language: '${Language[language]}'`
  }

  public search(text: string, language?: Language): string {
    language = language || this.context.get().gameLanguage || this.context.get().language

    const map = this.wordProvider.provide(language)
    return map[text]
  }

  public searchAll(predicate: (text: string) => boolean, language?: Language): [string, string] {
    language = language || this.context.get().gameLanguage || this.context.get().language

    const map = this.wordProvider.provide(language)
    for (const id in map) {
      const text = map[id]
      if (predicate(text)) {
        return [id, text]
      }
    }
    return ['', '']
  }
}

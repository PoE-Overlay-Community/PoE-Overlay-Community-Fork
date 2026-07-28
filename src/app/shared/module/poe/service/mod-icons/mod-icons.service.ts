import { Injectable } from '@angular/core'
import { ModIconsProvider } from '../../provider/mod-icons.provider'
import { Language } from '../../type'
import { ContextService } from '../context.service'

@Injectable({
  providedIn: 'root',
})
export class ModIconsService {
  constructor(
    private readonly context: ContextService,
    private readonly modIconsProvider: ModIconsProvider
  ) { }

  public get(modName: string, language?: Language): string {
    if (!modName) {
      return undefined
    }

    language = language || this.context.get().language

    const modIconsMap = this.modIconsProvider.provide(language)

    return modIconsMap[modName]
  }
}

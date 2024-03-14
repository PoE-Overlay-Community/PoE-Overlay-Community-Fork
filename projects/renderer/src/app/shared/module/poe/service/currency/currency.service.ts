import { Injectable } from '@angular/core'
import { CurrenciesProvider } from '@shared/module/poe/provider'
import { Currency, Language } from '@shared/module/poe/type'
import { Observable } from 'rxjs'
import { flatMap, map, shareReplay } from 'rxjs/operators'
import { TradeStaticResultId } from '../../../../../data/poe'
import { ContextService } from '../context.service'

const CACHE_SIZE = 1

@Injectable({
  providedIn: 'root',
})
export class CurrencyService {
  private cache$: {
    [key: string]: Observable<Currency>
  } = {}

  constructor(
    private readonly context: ContextService,
    private readonly currenciesProvider: CurrenciesProvider
  ) {}

  public get(language?: Language): Observable<Currency[]> {
    language = language || this.context.get().language

    return this.currenciesProvider.provide(language, TradeStaticResultId.Currency)
  }

  public searchById(
    id: string,
    searchLanguage?: Language,
    resultLanguage?: Language
  ): Observable<Currency> {
    searchLanguage = searchLanguage || this.context.get().language
    resultLanguage = resultLanguage || this.context.get().language

    const key = this.getCacheKey(id, searchLanguage)
    if (!this.cache$[key]) {
      this.cache$[key] = this.searchByPredicate(searchLanguage, (x) => x.id === id).pipe(
        shareReplay(CACHE_SIZE)
      )
    }
    const result = this.cache$[key]
    if (searchLanguage === resultLanguage) {
      return result
    }
    return result.pipe(flatMap((currency) => this.searchById(currency.id, resultLanguage)))
  }

  public searchByNameType(
    nameType: string,
    searchLanguage?: Language,
    resultLanguage?: Language
  ): Observable<Currency> {
    searchLanguage = searchLanguage || this.context.get().language
    resultLanguage = resultLanguage || this.context.get().language

    const key = this.getCacheKey(nameType, searchLanguage)
    if (!this.cache$[key]) {
      this.cache$[key] = this.searchByPredicate(
        searchLanguage,
        (x) => x.nameType === nameType
      ).pipe(shareReplay(CACHE_SIZE))
    }
    const result = this.cache$[key]
    if (searchLanguage === resultLanguage) {
      return result
    }
    return result.pipe(flatMap((currency) => this.searchById(currency.id, resultLanguage)))
  }

  private getCacheKey(id: string, language: Language): string {
    return `${id}:${language}`
  }

  private searchByPredicate(
    language: Language,
    predicate: (currency: Currency) => boolean
  ): Observable<Currency> {
    return this.currenciesProvider
      .provide(language)
      .pipe(map((currencies) => currencies.find(predicate)))
  }
}

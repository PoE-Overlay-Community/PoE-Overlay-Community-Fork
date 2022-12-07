import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { BrowserService } from '@app/service'
import { environment } from '@env/environment'
import { Language } from '@shared/module/poe/type'
import { Observable, of, Subscriber, throwError } from 'rxjs'
import { delay, flatMap, map, retryWhen } from 'rxjs/operators'
import {
    ApiCharacterResponse,
    ApiErrorResponse,
    ApiProfileResponse,
    ApiStashItems,
    ExchangeSearchRequest,
    TradeFetchResult,
    TradeItemsResult,
    TradeLeaguesResult,
    TradeSearchResponse, TradeResponse,
    TradeSearchRequest,
    TradeSearchType, TradeStaticResult,
    TradeStatsResult,
    ExchangeSearchResponse,
    SearchResponse
} from '../schema/poe-api'
import { TradeRateLimitService } from './trade-rate-limit.service'

const RETRY_COUNT = 3
const RETRY_DELAY = 300
const RETRY_LIMIT_COUNT = 1

const LEAGUES_REGEX = new RegExp(/"leagues":(?<leagues>\[.*?\]),/i)

@Injectable({
  providedIn: 'root',
})
export class PoEHttpService {
  constructor(
    private readonly http: HttpClient,
    private readonly browser: BrowserService,
    private readonly limit: TradeRateLimitService
  ) {}

  public getItems(language: Language): Observable<TradeResponse<TradeItemsResult>> {
    const url = this.getTradeApiUrl('data/items', language)
    return this.getAndParse('trade-items', url)
  }

  // For some odd reason this doesn't include Private Leagues when the player is authenticated.
  public getLeagues(language: Language): Observable<TradeResponse<TradeLeaguesResult>> {
    const url = this.getTradeApiUrl('data/leagues', language)
    return this.getAndParse('leagues', url)
  }

  // To obtain a list of private leagues, simply load the normal trade search page and find them using a regex.
  public getTradePageLeagues(language: Language): Observable<TradeResponse<TradeLeaguesResult>> {
    const url = this.getPoEUrl('trade/search', language)
    return this.getAndTransform('trade-page-leagues', url).pipe(
      map((result) => {
        if (LEAGUES_REGEX.test(result)) {
          const exec = LEAGUES_REGEX.exec(result)
          return `{"result":${exec.groups.leagues}}`
        }
        console.log('[TradeHTTP] Cannot find Leagues list on the trade page.')
        return ''
      }),
      map((result) => {
        if (!result) {
          return {
            result: []
          }
        }
        return this.parseResponse(result)
      })
    )
  }

  public getStatic(language: Language): Observable<TradeResponse<TradeStaticResult>> {
    const url = this.getTradeApiUrl('data/static', language)
    return this.getAndParse('data-static', url)
  }

  public getStats(language: Language): Observable<TradeResponse<TradeStatsResult>> {
    const url = this.getTradeApiUrl('data/stats', language)
    return this.getAndParse('data-stats', url)
  }

  public getLoginUrl(language: Language): string {
    return this.getPoEUrl('login', language)
  }

  public getLogoutUrl(language: Language): string {
    return this.getPoEUrl('logout', language)
  }

  public getAccountInfo(language: Language): Observable<ApiProfileResponse | ApiErrorResponse> {
    const url = this.getApiUrl('profile', language)
    return this.getAndParse('account-profile', url)
  }

  public getCharacters(accountName: string, language: Language): Observable<ApiCharacterResponse[] | ApiErrorResponse> {
    const url = this.getPoEUrl(`character-window/get-characters?accountName=${encodeURIComponent(accountName)}`, language)
    return this.getAndParse('character-names', url)
  }

  public getStashTabInfo(accountName: string, leagueId: string, language: Language): Observable<ApiStashItems> {
    const url = this.getPoEUrl(`character-window/get-stash-items?tabs=1&tabIndex=0&realm=pc&league=${encodeURIComponent(leagueId)}&accountName=${encodeURIComponent(accountName)}`, language)
    return this.getAndParse('stash-tab-names', url)
  }

  public search(
    request: TradeSearchRequest,
    language: Language,
    leagueId: string
  ): Observable<TradeSearchResponse> {
    return this.searchOrExchange(request, language, leagueId, TradeSearchType.NormalTrade)
  }

  public exchange(
    request: ExchangeSearchRequest,
    language: Language,
    leagueId: string
  ): Observable<ExchangeSearchResponse> {
    return this.searchOrExchange(request, language, leagueId, TradeSearchType.BulkExchange)
  }

  public fetch(
    itemIds: string[],
    queryId: string,
    language: Language
  ): Observable<TradeResponse<TradeFetchResult>> {
    const url = this.getTradeApiUrl(`fetch/${itemIds.join(',')}`, language)
    return this.limit
      .throttle('fetch', () =>
        this.http.get<TradeResponse<TradeFetchResult>>(url, {
          params: new HttpParams({
            fromObject: {
              query: queryId,
            },
          }),
          withCredentials: true,
          observe: 'response',
        })
      )
      .pipe(
        retryWhen((errors) =>
          errors.pipe(flatMap((response, count) => this.handleError(url, response, count)))
        )
      )
  }

  private searchOrExchange<TSearchResponse extends SearchResponse>(
    request: TradeSearchRequest | ExchangeSearchRequest,
    language: Language,
    leagueId: string,
    searchType: TradeSearchType
  ): Observable<TSearchResponse> {
    const url = this.getTradeApiUrl(`${searchType}/${encodeURIComponent(leagueId)}`, language)
    if (!environment.production) {
      console.log(`[PoEHttp] Contacting ${url}?q=${encodeURIComponent(JSON.stringify(request))}`)
    }
    return this.limit
      .throttle(searchType, () =>
        this.http.post<TSearchResponse>(url, request, {
          withCredentials: true,
          observe: 'response',
        })
      )
      .pipe(
        retryWhen((errors) =>
          errors.pipe(flatMap((response, count) => this.handleError(url, response, count)))
        ),
        map((response) => {
          response.url = `${url.replace('/api', '')}/${encodeURIComponent(response.id)}`
          response.searchType = searchType
          return response
        })
      )
  }

  private get(resource: string, url: string): Observable<string> {
    if (!environment.production) {
      console.log(`[PoEHttp] Contacting ${url}`)
    }
    return new Observable(observer => {
      this.limit.throttle(resource, () =>
        this.http.get(url, {
          observe: 'response',
          responseType: 'text',
          withCredentials: true,
        })
      ).pipe(
        retryWhen((errors) =>
          errors.pipe(flatMap((response, count) => this.handleError(url, response, count, observer)))
        )
      ).subscribe(
        response => observer.next(response),
        error => observer.error(error),
        () => observer.complete()
      )
    })
  }

  private getAndTransform(resource: string, url: string): Observable<string> {
    return this.get(resource, url).pipe(map((response) => this.transformResponse(response)))
  }

  private getAndParse<TResponse>(resource: string, url: string): Observable<TResponse> {
    return this.getAndTransform(resource, url).pipe(map((result) => this.parseResponse(result)))
  }

  private parseResponse<TResponse>(result: string): TResponse {
    return JSON.parse(result) as TResponse
  }

  private transformResponse(response: string): string {
    return response.replace(/\\u[\dA-Fa-f]{4}/g, (match) =>
      String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16))
    )
  }

  private getTradeApiUrl(postfix: string, language: Language): string {
    return this.getApiUrl(`trade/${postfix}`, language)
  }

  private getApiUrl(postfix: string, language: Language): string {
    return this.getPoEUrl(`api/${postfix}`, language)
  }

  private getPoEUrl(postfix: string, language: Language): string {
    let baseUrl = environment.poe.baseUrl
    switch (language) {
      case Language.English:
        break
      case Language.Portuguese:
        baseUrl = environment.poe.countryUrl.replace('{country}', 'br')
        break
      case Language.Russian:
        baseUrl = environment.poe.countryUrl.replace('{country}', 'ru')
        break
      case Language.Thai:
        baseUrl = environment.poe.countryUrl.replace('{country}', 'th')
        break
      case Language.German:
        baseUrl = environment.poe.countryUrl.replace('{country}', 'de')
        break
      case Language.French:
        baseUrl = environment.poe.countryUrl.replace('{country}', 'fr')
        break
      case Language.Spanish:
        baseUrl = environment.poe.countryUrl.replace('{country}', 'es')
        break
      case Language.Korean:
        baseUrl = environment.poe.koreanUrl
        break
      // case Language.SimplifiedChinese:
      //     baseUrl = environment.poe.simplifiedChineseUrl;
      //     break;
      case Language.TraditionalChinese:
        baseUrl = environment.poe.traditionalChineseUrl
        break
      default:
        throw new Error(`Could not map baseUrl to language: '${language}'.`)
    }
    return `${baseUrl}${postfix}`
  }

  private handleError(url: string, response: HttpErrorResponse, count: number, observer: Subscriber<string> = undefined): Observable <any> {
    if (count >= RETRY_COUNT) {
      return throwError(response)
    }

    switch (response.status) {
      case 400:
        try {
          const message = response?.error?.error?.message || 'no message'
          const code = response?.error?.error?.code || '-'
          return throwError(`${code}: ${message}`)
        } catch {
          return throwError(response.error)
        }
      case 401: // Unauthorized
        observer?.next(response.error)
        observer?.complete()
        return of() // End the retry-chain
      case 403:
        if (count >= RETRY_LIMIT_COUNT) {
          return throwError(response)
        }
        return this.browser.retrieve(url).pipe(delay(RETRY_DELAY))
      case 429:
        return throwError(response)
      default:
        return of(response).pipe(delay(RETRY_DELAY))
    }
  }
}

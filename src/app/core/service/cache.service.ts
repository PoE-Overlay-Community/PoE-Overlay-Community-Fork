import { Injectable } from '@angular/core'
import { Observable, of, throwError } from 'rxjs'
import { catchError, flatMap, map, shareReplay, tap } from 'rxjs/operators'
import { environment } from '@env/environment'
import { ofType } from '../function'
import { LoggerService } from './logger.service'
import { StorageService } from './storage.service'

interface CacheEntry<TValue> {
  value: TValue
  creation: number
  expiry: number
  expired: number
}

const LogTag = 'cacheService'

@Injectable({
  providedIn: 'root',
})
export class CacheService {
  private readonly cache: {
    [key: string]: Observable<any>
  } = {}

  constructor(
    private readonly storage: StorageService,
    private readonly logger: LoggerService
  ) { }

  public proxy<TValue>(
    key: string,
    valueFn: () => Observable<TValue>,
    expiry: number,
    slidingExpiry: boolean = false,
  ): Observable<TValue> {
    return this.storage.get<CacheEntry<TValue>>(key).pipe(
      flatMap((entry) => {
        let now = Date.now()
        if (entry) {
          this.logger.debug(LogTag, `'${key}' Cache check: now=${new Date(now).toISOString()}; entry.expiry=${entry.expiry}; expiry=${expiry}; expired=${new Date(entry.expired).toISOString()}; creation=${new Date(entry.creation).toISOString()}; newExpiry = ${new Date(entry.creation + expiry).toISOString()}`)
        } else {
          this.logger.debug(LogTag, `'${key}' Cache check: now=${new Date(now).toISOString()}; no entry found`)
        }
        if (
          entry &&
          ofType<TValue>(entry.value) &&
          ((entry.expiry === expiry && entry.expired > now) ||
            (entry.expiry !== expiry && entry.creation + expiry > now))
        ) {
          this.logger.debug(LogTag, `'${key}' Cache Hit`)
          if (slidingExpiry) {
            this.storage.save(key, {
              value: entry.value,
              creation: now,
              expiry,
              expired: now + expiry,
            })
          }
          return of(entry.value)
        }
        if (!this.cache[key]) {
          this.logger.debug(LogTag, `'${key}' Cache miss -> retrieving value`)
          this.cache[key] = valueFn().pipe(
            catchError((error) => {
              if (entry) {
                this.logger.info(
                  `Could not update value for key: '${key}'. Using cached value from: '${new Date(entry.expired).toISOString()}'.`,
                  error
                )
                return of(entry.value)
              }
              return throwError(error)
            }),
            tap((value) => {
              this.cache[key] = undefined
              // Update the 'now' value since the 'valueFn' might be async and take a long time to complete
              now = Date.now()
              this.storage.save(key, {
                value,
                creation: now,
                expiry,
                expired: now + expiry,
              })
            }),
            shareReplay(1)
          )
        }
        return this.cache[key]
      })
    )
  }

  public store<TValue>(
    key: string,
    value: TValue,
    expiry: number,
    waitForResult: boolean = true
  ): Observable<TValue> {
    const now = Date.now()
    const result = this.storage.save(key, {
      value,
      creation: now,
      expiry,
      expired: now + expiry,
    })
    if (waitForResult) {
      return result.pipe(map(() => value))
    }
    return of(value)
  }

  public retrieve<TValue>(key: string): Observable<TValue> {
    return this.storage.get<CacheEntry<TValue>>(key).pipe(map((entry) => entry?.value))
  }

  public prune(path: string): Observable<void> {
    const now = Date.now()
    return this.storage.delete<CacheEntry<any>>((key, value) => {
      return key.startsWith(path) && value && value.expired <= now
    })
  }

  public keys(): Observable<string[]> {
    return this.storage.keys()
  }
}

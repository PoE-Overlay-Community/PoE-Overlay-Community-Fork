import { TestBed, fakeAsync, tick } from '@angular/core/testing'
import { CacheService } from './cache.service'
import { StorageService } from './storage.service'
import { LoggerService } from './logger.service'
import { of, throwError } from 'rxjs'
import { delay } from 'rxjs/operators'

describe('CacheService', () => {
  let service: CacheService
  let storageSpy: jasmine.SpyObj<StorageService>
  let loggerSpy: jasmine.SpyObj<LoggerService>

  beforeEach(() => {
    storageSpy = jasmine.createSpyObj('StorageService', ['get', 'save', 'delete', 'keys'])
    loggerSpy = jasmine.createSpyObj('LoggerService', ['log', 'debug', 'info', 'warn', 'error'])

    TestBed.configureTestingModule({
      providers: [
        CacheService,
        { provide: StorageService, useValue: storageSpy },
        { provide: LoggerService, useValue: loggerSpy },
      ],
    })

    service = TestBed.inject(CacheService)
  })

  describe('proxy', () => {
    it('should return cached value on cache hit', fakeAsync(() => {
      const cachedEntry = {
        value: 'cached-data',
        creation: Date.now() - 1000,
        expiry: 60000,
        expired: Date.now() + 59000,
      }
      storageSpy.get.and.returnValue(of(cachedEntry))
      const valueFn = jasmine.createSpy('valueFn').and.returnValue(of('new-data'))

      let result: string | undefined
      service.proxy<string>('test-key', valueFn, 60000).subscribe((v) => (result = v))
      tick()

      expect(result).toBe('cached-data')
      expect(valueFn).not.toHaveBeenCalled()
    }))

    it('should call valueFn on cache miss', fakeAsync(() => {
      storageSpy.get.and.returnValue(of(null))
      storageSpy.save.and.returnValue(of(null))
      const valueFn = jasmine.createSpy('valueFn').and.returnValue(of('new-data'))

      let result: string | undefined
      service.proxy<string>('test-key', valueFn, 60000).subscribe((v) => (result = v))
      tick()

      expect(result).toBe('new-data')
      expect(valueFn).toHaveBeenCalled()
      expect(storageSpy.save).toHaveBeenCalled()
    }))

    it('should update sliding expiry on cache hit', fakeAsync(() => {
      const cachedEntry = {
        value: 'cached-data',
        creation: Date.now() - 1000,
        expiry: 60000,
        expired: Date.now() + 59000,
      }
      storageSpy.get.and.returnValue(of(cachedEntry))
      storageSpy.save.and.returnValue(of(null))

      service.proxy('test-key', () => of('new'), 60000, true).subscribe()
      tick()

      expect(storageSpy.save).toHaveBeenCalled()
    }))

    it('should return stale cache value when valueFn fails', fakeAsync(() => {
      const staleEntry = {
        value: 'stale-data',
        creation: Date.now() - 120000,
        expiry: 60000,
        expired: Date.now() - 60000,
      }
      storageSpy.get.and.returnValue(of(staleEntry))
      const valueFn = jasmine.createSpy('valueFn').and.returnValue(throwError(() => new Error('Network error')))

      let result: string | undefined
      service.proxy<string>('test-key', valueFn, 60000).subscribe((v) => (result = v))
      tick()

      expect(result).toBe('stale-data')
    }))

    it('should share replay for concurrent requests', fakeAsync(() => {
      storageSpy.get.and.returnValue(of(null))
      storageSpy.save.and.returnValue(of(null))
      let callCount = 0
      const valueFn = () => {
        callCount++
        return of('data').pipe(delay(100))
      }

      let result1: string | undefined
      let result2: string | undefined
      service.proxy('test-key', valueFn, 60000).subscribe((v) => (result1 = v))
      service.proxy('test-key', valueFn, 60000).subscribe((v) => (result2 = v))
      tick(200)

      expect(callCount).toBe(1)
      expect(result1).toBe('data')
      expect(result2).toBe('data')
    }))
  })

  describe('store', () => {
    it('should save value to storage', fakeAsync(() => {
      storageSpy.save.and.returnValue(of(null))

      let result: string | undefined
      service.store('test-key', 'test-value', 60000).subscribe((v) => (result = v))
      tick()

      expect(storageSpy.save).toHaveBeenCalled()
      expect(result).toBe('test-value')
    }))

    it('should return value immediately when waitForResult is false', fakeAsync(() => {
      storageSpy.save.and.returnValue(of(null).pipe(delay(1000)))

      let result: string | undefined
      service.store('test-key', 'test-value', 60000, false).subscribe((v) => (result = v))
      tick()

      expect(result).toBe('test-value')
    }))
  })

  describe('retrieve', () => {
    it('should return stored value', fakeAsync(() => {
      const entry = {
        value: 'stored-data',
        creation: Date.now(),
        expiry: 60000,
        expired: Date.now() + 60000,
      }
      storageSpy.get.and.returnValue(of(entry))

      let result: string | undefined
      service.retrieve<string>('test-key').subscribe((v) => (result = v))
      tick()

      expect(result).toBe('stored-data')
    }))

    it('should return undefined when no entry exists', fakeAsync(() => {
      storageSpy.get.and.returnValue(of(null))

      let result: string | undefined
      service.retrieve<string>('test-key').subscribe((v) => (result = v))
      tick()

      expect(result).toBeUndefined()
    }))
  })

  describe('prune', () => {
    it('should delete expired entries matching path', fakeAsync(() => {
      storageSpy.delete.and.returnValue(of(undefined))

      service.prune('test-prefix').subscribe()
      tick()

      expect(storageSpy.delete).toHaveBeenCalled()
    }))
  })

  describe('keys', () => {
    it('should return storage keys', fakeAsync(() => {
      storageSpy.keys.and.returnValue(of(['key1', 'key2']))

      let result: string[] | undefined
      service.keys().subscribe((v) => (result = v))
      tick()

      expect(result).toEqual(['key1', 'key2'])
    }))
  })
})

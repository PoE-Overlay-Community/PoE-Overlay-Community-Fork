import { TestBed, fakeAsync, tick } from '@angular/core/testing'
import { StorageService } from './storage.service'
import { LocalForageProvider } from '@app/provider'
import { MockLocalForageProvider } from '@app/testing'

describe('StorageService', () => {
  let service: StorageService
  let mockProvider: MockLocalForageProvider

  beforeEach(() => {
    mockProvider = new MockLocalForageProvider()

    TestBed.configureTestingModule({
      providers: [StorageService, { provide: LocalForageProvider, useValue: mockProvider }],
    })

    service = TestBed.inject(StorageService)
  })

  afterEach(() => {
    mockProvider.getMock()._reset()
  })

  describe('get', () => {
    it('should return stored value', fakeAsync(() => {
      mockProvider.getMock()._storage.set('test-key', 'test-value')

      let result: string | undefined
      service.get<string>('test-key').subscribe((v) => (result = v))
      tick()

      expect(result).toBe('test-value')
    }))

    it('should return null for non-existent key', fakeAsync(() => {
      let result: string | null = 'initial'
      service.get<string>('non-existent').subscribe((v) => (result = v))
      tick()

      expect(result).toBeNull()
    }))

    it('should save and return default value when key does not exist', fakeAsync(() => {
      const defaultValue = 'default-value'

      let result: string | undefined
      service.get<string>('non-existent', defaultValue).subscribe((v) => (result = v))
      tick()

      expect(result).toBe(defaultValue)
      expect(mockProvider.getMock()._storage.get('non-existent')).toBe(defaultValue)
    }))
  })

  describe('save', () => {
    it('should save value to storage', fakeAsync(() => {
      let result: string | undefined
      service.save('test-key', 'test-value').subscribe((v) => (result = v))
      tick()

      expect(result).toBe('test-value')
      expect(mockProvider.getMock()._storage.get('test-key')).toBe('test-value')
    }))

    it('should overwrite existing value', fakeAsync(() => {
      mockProvider.getMock()._storage.set('test-key', 'old-value')

      service.save('test-key', 'new-value').subscribe()
      tick()

      expect(mockProvider.getMock()._storage.get('test-key')).toBe('new-value')
    }))
  })

  describe('keys', () => {
    it('should return all storage keys', fakeAsync(() => {
      mockProvider.getMock()._storage.set('key1', 'value1')
      mockProvider.getMock()._storage.set('key2', 'value2')

      let result: string[] | undefined
      service.keys().subscribe((v) => (result = v))
      tick()

      expect(result).toEqual(['key1', 'key2'])
    }))

    it('should return empty array when storage is empty', fakeAsync(() => {
      let result: string[] | undefined
      service.keys().subscribe((v) => (result = v))
      tick()

      expect(result).toEqual([])
    }))
  })

  describe('delete', () => {
    it('should delete entries matching predicate', fakeAsync(() => {
      mockProvider.getMock()._storage.set('prefix_key1', { data: 'value1' })
      mockProvider.getMock()._storage.set('prefix_key2', { data: 'value2' })
      mockProvider.getMock()._storage.set('other_key', { data: 'value3' })

      service.delete<any>((key) => key.startsWith('prefix_')).subscribe()
      tick()

      expect(mockProvider.getMock()._storage.has('prefix_key1')).toBeFalse()
      expect(mockProvider.getMock()._storage.has('prefix_key2')).toBeFalse()
      expect(mockProvider.getMock()._storage.has('other_key')).toBeTrue()
    }))

    it('should not delete entries when predicate returns false', fakeAsync(() => {
      mockProvider.getMock()._storage.set('key1', 'value1')

      service.delete(() => false).subscribe()
      tick()

      expect(mockProvider.getMock()._storage.has('key1')).toBeTrue()
    }))
  })
})

export interface MockLocalForage {
  getItem<T>(key: string): Promise<T | null>
  setItem<T>(key: string, value: T): Promise<T>
  removeItem(key: string): Promise<void>
  keys(): Promise<string[]>
  iterate<T, U>(iteratee: (value: T, key: string, iterationNumber: number) => U): Promise<U>
  _storage: Map<string, any>
  _reset(): void
}

export function createMockLocalForage(): MockLocalForage {
  const storage = new Map<string, any>()

  return {
    _storage: storage,

    _reset(): void {
      storage.clear()
    },

    async getItem<T>(key: string): Promise<T | null> {
      return storage.has(key) ? (storage.get(key) as T) : null
    },

    async setItem<T>(key: string, value: T): Promise<T> {
      storage.set(key, value)
      return value
    },

    async removeItem(key: string): Promise<void> {
      storage.delete(key)
    },

    async keys(): Promise<string[]> {
      return Array.from(storage.keys())
    },

    async iterate<T, U>(iteratee: (value: T, key: string, iterationNumber: number) => U): Promise<U> {
      let iterationNumber = 0
      let result: U | undefined
      for (const [key, value] of storage.entries()) {
        result = iteratee(value as T, key, iterationNumber++)
        if (result !== undefined) {
          return result
        }
      }
      return result as U
    },
  }
}

export class MockLocalForageProvider {
  private mockLocalForage: MockLocalForage

  constructor() {
    this.mockLocalForage = createMockLocalForage()
  }

  provide(): MockLocalForage {
    return this.mockLocalForage
  }

  getMock(): MockLocalForage {
    return this.mockLocalForage
  }
}

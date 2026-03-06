import { TestBed } from '@angular/core/testing'
import { ChaosRecipeProcessorService } from './chaos-recipe-processor.service'
import { LoggerService } from '@app/service'
import { BaseItemTypesService } from '@shared/module/poe/service/base-item-types/base-item-types.service'
import { ClientStringService } from '@shared/module/poe/service/client-string/client-string.service'
import { ContextService } from '@shared/module/poe/service/context.service'

describe('ChaosRecipeProcessorService', () => {
  let service: ChaosRecipeProcessorService
  let baseItemTypesServiceSpy: jasmine.SpyObj<BaseItemTypesService>
  let clientStringServiceSpy: jasmine.SpyObj<ClientStringService>
  let contextServiceSpy: jasmine.SpyObj<ContextService>
  let loggerServiceSpy: jasmine.SpyObj<LoggerService>

  beforeEach(() => {
    baseItemTypesServiceSpy = jasmine.createSpyObj('BaseItemTypesService', ['get', 'search'])
    clientStringServiceSpy = jasmine.createSpyObj('ClientStringService', ['translate'])
    contextServiceSpy = jasmine.createSpyObj('ContextService', ['get'])
    loggerServiceSpy = jasmine.createSpyObj('LoggerService', ['log', 'debug', 'info', 'warn', 'error'])

    TestBed.configureTestingModule({
      providers: [
        ChaosRecipeProcessorService,
        { provide: BaseItemTypesService, useValue: baseItemTypesServiceSpy },
        { provide: ClientStringService, useValue: clientStringServiceSpy },
        { provide: ContextService, useValue: contextServiceSpy },
        { provide: LoggerService, useValue: loggerServiceSpy },
      ],
    })

    service = TestBed.inject(ChaosRecipeProcessorService)
  })

  describe('recipe configuration', () => {
    it('should have minimum item level of 60', () => {
      expect(service['minItemLevel']).toBe(60)
    })

    it('should have filler item level of 75', () => {
      expect(service['fillerItemLevel']).toBe(75)
    })
  })

  describe('item level categorization', () => {
    function createMockItem(itemLevel: number): any {
      return {
        itemLevel,
        identified: false,
        rarity: 'Rare',
        stashTabName: 'Test',
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        group: 'helmet',
      }
    }

    it('should categorize item level 60 as main recipe item', () => {
      const item = createMockItem(60)
      const items = [item]

      const splitted = (service as any).getSplittedCandidates(items, {})

      expect(splitted[0]).toContain(item)
      expect(splitted[1]).not.toContain(item)
    })

    it('should categorize item level 74 as main recipe item', () => {
      const item = createMockItem(74)
      const items = [item]

      const splitted = (service as any).getSplittedCandidates(items, {})

      expect(splitted[0]).toContain(item)
      expect(splitted[1]).not.toContain(item)
    })

    it('should categorize item level 75 as filler item', () => {
      const item = createMockItem(75)
      const items = [item]

      const splitted = (service as any).getSplittedCandidates(items, {})

      expect(splitted[0]).not.toContain(item)
      expect(splitted[1]).toContain(item)
    })

    it('should exclude items below level 60', () => {
      const item = createMockItem(59)
      const items = [item]

      const splitted = (service as any).getSplittedCandidates(items, {})

      expect(splitted[0]).not.toContain(item)
      expect(splitted[1]).not.toContain(item)
    })
  })

  describe('recipe validation', () => {
    function createMockItem(itemLevel: number, group: string): any {
      return {
        itemLevel,
        identified: false,
        rarity: 'Rare',
        stashTabName: 'Test',
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        group,
      }
    }

    it('should validate recipe with at least one chaos range item', () => {
      const items = [
        createMockItem(65, 'helmet'),
        createMockItem(80, 'body'),
        createMockItem(82, 'gloves'),
      ]

      const isValid = (service as any).isValidRecipe(items)

      expect(isValid).toBeTrue()
    })

    it('should invalidate recipe with only regal range items', () => {
      const items = [
        createMockItem(75, 'helmet'),
        createMockItem(80, 'body'),
        createMockItem(82, 'gloves'),
      ]

      const isValid = (service as any).isValidRecipe(items)

      expect(isValid).toBeFalse()
    })
  })
})

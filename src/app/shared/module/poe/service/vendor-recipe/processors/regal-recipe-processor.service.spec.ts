import { TestBed } from '@angular/core/testing'
import { RegalRecipeProcessorService } from './regal-recipe-processor.service'
import { LoggerService } from '@app/service'
import { BaseItemTypesService } from '@shared/module/poe/service/base-item-types/base-item-types.service'
import { ClientStringService } from '@shared/module/poe/service/client-string/client-string.service'
import { ContextService } from '@shared/module/poe/service/context.service'

describe('RegalRecipeProcessorService', () => {
  let service: RegalRecipeProcessorService
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
        RegalRecipeProcessorService,
        { provide: BaseItemTypesService, useValue: baseItemTypesServiceSpy },
        { provide: ClientStringService, useValue: clientStringServiceSpy },
        { provide: ContextService, useValue: contextServiceSpy },
        { provide: LoggerService, useValue: loggerServiceSpy },
      ],
    })

    service = TestBed.inject(RegalRecipeProcessorService)
  })

  describe('recipe configuration', () => {
    it('should have minimum item level of 75', () => {
      expect(service['minItemLevel']).toBe(75)
    })

    it('should have filler item level of 100', () => {
      expect(service['fillerItemLevel']).toBe(100)
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

    it('should categorize item level 75 as main recipe item', () => {
      const item = createMockItem(75)
      const items = [item]

      const splitted = (service as any).getSplittedCandidates(items, {})

      expect(splitted[0]).toContain(item)
      expect(splitted[1]).not.toContain(item)
    })

    it('should categorize item level 99 as main recipe item', () => {
      const item = createMockItem(99)
      const items = [item]

      const splitted = (service as any).getSplittedCandidates(items, {})

      expect(splitted[0]).toContain(item)
      expect(splitted[1]).not.toContain(item)
    })

    it('should categorize item level 100 as filler item', () => {
      const item = createMockItem(100)
      const items = [item]

      const splitted = (service as any).getSplittedCandidates(items, {})

      expect(splitted[0]).not.toContain(item)
      expect(splitted[1]).toContain(item)
    })

    it('should exclude items below level 75', () => {
      const item = createMockItem(74)
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

    it('should validate recipe with at least one regal range item', () => {
      const items = [
        createMockItem(80, 'helmet'),
        createMockItem(100, 'body'),
        createMockItem(100, 'gloves'),
      ]

      const isValid = (service as any).isValidRecipe(items)

      expect(isValid).toBeTrue()
    })

    it('should invalidate recipe with only ilvl 100+ items', () => {
      const items = [
        createMockItem(100, 'helmet'),
        createMockItem(100, 'body'),
        createMockItem(100, 'gloves'),
      ]

      const isValid = (service as any).isValidRecipe(items)

      expect(isValid).toBeFalse()
    })
  })
})

import { TestBed } from '@angular/core/testing'
import { GlassblowerRecipeProcessorService } from './glassblower-recipe-processor.service'
import { LoggerService } from '@app/service'
import { BaseItemTypesService } from '@shared/module/poe/service/base-item-types/base-item-types.service'
import { ClientStringService } from '@shared/module/poe/service/client-string/client-string.service'
import { ContextService } from '@shared/module/poe/service/context.service'
import { RecipeItemGroup } from '@shared/module/poe/type'

describe('GlassblowerRecipeProcessorService', () => {
  let service: GlassblowerRecipeProcessorService
  let baseItemTypesServiceSpy: jasmine.SpyObj<BaseItemTypesService>
  let clientStringServiceSpy: jasmine.SpyObj<ClientStringService>
  let contextServiceSpy: jasmine.SpyObj<ContextService>
  let loggerServiceSpy: jasmine.SpyObj<LoggerService>

  beforeEach(() => {
    baseItemTypesServiceSpy = jasmine.createSpyObj('BaseItemTypesService', ['get', 'search'])
    clientStringServiceSpy = jasmine.createSpyObj('ClientStringService', ['translate'])
    contextServiceSpy = jasmine.createSpyObj('ContextService', ['get'])
    loggerServiceSpy = jasmine.createSpyObj('LoggerService', [
      'log',
      'debug',
      'info',
      'warn',
      'error',
      'isLogTagEnabled',
    ])
    loggerServiceSpy.isLogTagEnabled.and.returnValue(false)

    TestBed.configureTestingModule({
      providers: [
        GlassblowerRecipeProcessorService,
        { provide: BaseItemTypesService, useValue: baseItemTypesServiceSpy },
        { provide: ClientStringService, useValue: clientStringServiceSpy },
        { provide: ContextService, useValue: contextServiceSpy },
        { provide: LoggerService, useValue: loggerServiceSpy },
      ],
    })

    service = TestBed.inject(GlassblowerRecipeProcessorService)
  })

  describe('recipe configuration', () => {
    it('should have recipe item group of Flasks', () => {
      expect(service['recipeItemGroup']).toBe(RecipeItemGroup.Flasks)
    })

    it('should have bag slots per item of 2', () => {
      expect(service['bagSlotsPerItem']).toBe(2)
    })

    it('should have quality threshold of 20', () => {
      expect(service['qualityThreshold']).toBe(20)
    })

    it('should have quality divisor of 40', () => {
      expect(service['qualityDivisor']).toBe(40)
    })
  })

  describe('isPartOfRecipe', () => {
    function createMockFlask(quality: number, corrupted = false): any {
      return {
        recipeItemGroup: RecipeItemGroup.Flasks,
        quality,
        source: { corrupted },
      }
    }

    it('should include quality flasks', () => {
      const flask = createMockFlask(15)
      const settings = { corruptedItemUsage: 0 }

      const result = (service as any).isPartOfRecipe(flask, settings)

      expect(result).toBeTrue()
    })

    it('should exclude zero quality flasks', () => {
      const flask = createMockFlask(0)
      const settings = { corruptedItemUsage: 0 }

      const result = (service as any).isPartOfRecipe(flask, settings)

      expect(result).toBeFalse()
    })

    it('should exclude non-flask items', () => {
      const item = {
        recipeItemGroup: RecipeItemGroup.Gems,
        quality: 15,
        source: { corrupted: false },
      }
      const settings = { corruptedItemUsage: 0 }

      const result = (service as any).isPartOfRecipe(item, settings)

      expect(result).toBeFalse()
    })
  })

  describe('bag space calculation', () => {
    it('should account for 2 bag slots per flask', () => {
      expect(service['bagSlotsPerItem']).toBe(2)
    })
  })
})

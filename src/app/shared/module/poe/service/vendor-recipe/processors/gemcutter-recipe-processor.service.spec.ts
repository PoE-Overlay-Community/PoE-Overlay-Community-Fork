import { TestBed } from '@angular/core/testing'
import { GemcutterRecipeProcessorService } from './gemcutter-recipe-processor.service'
import { LoggerService } from '@app/service'
import { BaseItemTypesService } from '@shared/module/poe/service/base-item-types/base-item-types.service'
import { ClientStringService } from '@shared/module/poe/service/client-string/client-string.service'
import { ContextService } from '@shared/module/poe/service/context.service'
import { RecipeItemGroup } from '@shared/module/poe/type'

describe('GemcutterRecipeProcessorService', () => {
  let service: GemcutterRecipeProcessorService
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
        GemcutterRecipeProcessorService,
        { provide: BaseItemTypesService, useValue: baseItemTypesServiceSpy },
        { provide: ClientStringService, useValue: clientStringServiceSpy },
        { provide: ContextService, useValue: contextServiceSpy },
        { provide: LoggerService, useValue: loggerServiceSpy },
      ],
    })

    service = TestBed.inject(GemcutterRecipeProcessorService)
  })

  describe('recipe configuration', () => {
    it('should have recipe item group of Gems', () => {
      expect(service['recipeItemGroup']).toBe(RecipeItemGroup.Gems)
    })

    it('should have bag slots per item of 1', () => {
      expect(service['bagSlotsPerItem']).toBe(1)
    })

    it('should have quality threshold of 20', () => {
      expect(service['qualityThreshold']).toBe(20)
    })

    it('should have quality divisor of 40', () => {
      expect(service['qualityDivisor']).toBe(40)
    })
  })

  describe('isPartOfRecipe', () => {
    function createMockGem(quality: number, corrupted = false): any {
      return {
        recipeItemGroup: RecipeItemGroup.Gems,
        quality,
        source: { corrupted },
      }
    }

    it('should include quality gems', () => {
      const gem = createMockGem(10)
      const settings = { corruptedItemUsage: 0 } // Neither

      const result = (service as any).isPartOfRecipe(gem, settings)

      expect(result).toBeTrue()
    })

    it('should exclude zero quality gems', () => {
      const gem = createMockGem(0)
      const settings = { corruptedItemUsage: 0 }

      const result = (service as any).isPartOfRecipe(gem, settings)

      expect(result).toBeFalse()
    })

    it('should exclude non-gem items', () => {
      const item = {
        recipeItemGroup: RecipeItemGroup.Flasks,
        quality: 10,
        source: { corrupted: false },
      }
      const settings = { corruptedItemUsage: 0 }

      const result = (service as any).isPartOfRecipe(item, settings)

      expect(result).toBeFalse()
    })

    it('should handle corrupted item usage setting', () => {
      const corruptedGem = createMockGem(10, true)
      const normalGem = createMockGem(10, false)
      const neverUseCorrupted = { corruptedItemUsage: 0 } // NeverUse
      const alwaysUseCorrupted = { corruptedItemUsage: 2 } // AlwaysUse

      expect((service as any).isPartOfRecipe(corruptedGem, neverUseCorrupted)).toBeFalse()
      expect((service as any).isPartOfRecipe(normalGem, neverUseCorrupted)).toBeTrue()

      expect((service as any).isPartOfRecipe(corruptedGem, alwaysUseCorrupted)).toBeTrue()
      expect((service as any).isPartOfRecipe(normalGem, alwaysUseCorrupted)).toBeFalse()
    })
  })
})

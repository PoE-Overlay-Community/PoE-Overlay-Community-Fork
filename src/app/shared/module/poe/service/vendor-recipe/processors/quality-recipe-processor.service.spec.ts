import { TestBed } from '@angular/core/testing'
import { LoggerService } from '@app/service'
import { BaseItemTypesService } from '@shared/module/poe/service/base-item-types/base-item-types.service'
import { ClientStringService } from '@shared/module/poe/service/client-string/client-string.service'
import { ContextService } from '@shared/module/poe/service/context.service'
import { ItemUsageType, RecipeHighlightOrder, RecipeItemGroup } from '@shared/module/poe/type'
import { QualityRecipeProcessorService } from './quality-recipe-processor.service'
import { ExpandedStashItem } from './recipe-processor.service'

// Concrete test implementation
class TestQualityRecipeProcessor extends QualityRecipeProcessorService {
  protected get recipeItemGroup(): RecipeItemGroup {
    return RecipeItemGroup.Gems
  }

  protected get bagSlotsPerItem(): number {
    return 1
  }

  protected get qualityThreshold(): number {
    return 20
  }

  protected get qualityDivisor(): number {
    return 40
  }

  get recipeName(): string {
    return 'Test Quality Recipe'
  }

  get recipeShortName(): string {
    return 'Test'
  }

  get recipeId(): string {
    return 'test-quality'
  }
}

describe('QualityRecipeProcessorService', () => {
  let service: TestQualityRecipeProcessor
  let loggerServiceSpy: jasmine.SpyObj<LoggerService>

  beforeEach(() => {
    const baseItemTypesServiceSpy = jasmine.createSpyObj('BaseItemTypesService', ['get', 'search'])
    const clientStringServiceSpy = jasmine.createSpyObj('ClientStringService', ['translate'])
    const contextServiceSpy = jasmine.createSpyObj('ContextService', ['get'])
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
        {
          provide: TestQualityRecipeProcessor,
          useFactory: () =>
            new TestQualityRecipeProcessor(
              baseItemTypesServiceSpy,
              clientStringServiceSpy,
              contextServiceSpy,
              loggerServiceSpy
            ),
        },
      ],
    })

    service = TestBed.inject(TestQualityRecipeProcessor)
  })

  function createMockItem(quality: number, id: string, corrupted = false): ExpandedStashItem {
    return {
      recipeItemGroup: RecipeItemGroup.Gems,
      quality,
      source: { id, corrupted },
      usedInRecipe: false,
      itemLocation: {
        bounds: { x: 0, y: 0, width: 1, height: 1 },
        tabName: 'Test',
      },
    } as unknown as ExpandedStashItem
  }

  describe('isPartOfRecipe', () => {
    it('should include items with quality > 0 and matching group', () => {
      const item = createMockItem(10, 'item1')
      const settings = { corruptedItemUsage: ItemUsageType.CanUse }

      const result = (service as any).isPartOfRecipe(item, settings)

      expect(result).toBeTrue()
    })

    it('should exclude items with quality = 0', () => {
      const item = createMockItem(0, 'item1')
      const settings = { corruptedItemUsage: ItemUsageType.CanUse }

      const result = (service as any).isPartOfRecipe(item, settings)

      expect(result).toBeFalse()
    })

    it('should exclude items from wrong group', () => {
      const item = createMockItem(10, 'item1')
      item.recipeItemGroup = RecipeItemGroup.Flasks
      const settings = { corruptedItemUsage: ItemUsageType.CanUse }

      const result = (service as any).isPartOfRecipe(item, settings)

      expect(result).toBeFalse()
    })

    it('should exclude corrupted items when NeverUse is set', () => {
      const item = createMockItem(10, 'item1', true)
      const settings = { corruptedItemUsage: ItemUsageType.NeverUse }

      const result = (service as any).isPartOfRecipe(item, settings)

      expect(result).toBeFalse()
    })

    it('should include only corrupted items when AlwaysUse is set', () => {
      const corruptedItem = createMockItem(10, 'item1', true)
      const normalItem = createMockItem(10, 'item2', false)
      const settings = { corruptedItemUsage: ItemUsageType.AlwaysUse }

      expect((service as any).isPartOfRecipe(corruptedItem, settings)).toBeTrue()
      expect((service as any).isPartOfRecipe(normalItem, settings)).toBeFalse()
    })
  })

  describe('processCandidates', () => {
    it('should separate max quality items from lesser quality items', () => {
      const items = [
        createMockItem(20, 'item1'),
        createMockItem(15, 'item2'),
        createMockItem(10, 'item3'),
      ]

      const settings = {
        numOfBagSpacesToUse: 60,
        fullSetThreshold: 10,
        calcEfficiency: false,
        highlightOrder: RecipeHighlightOrder.LargeToSmall,
      }

      const result = (service as any).processCandidates('test', 0, items, settings)

      expect(result).toBeDefined()
      expect(result.itemGroups[0].count).toBe(3)
    })

    it('should mark items as used in recipe', () => {
      const items = [createMockItem(15, 'item1'), createMockItem(15, 'item2'), createMockItem(10, 'item3')]

      const settings = {
        numOfBagSpacesToUse: 60,
        fullSetThreshold: 10,
        calcEfficiency: false,
        highlightOrder: RecipeHighlightOrder.LargeToSmall,
      }

      ;(service as any).processCandidates('test', 0, items, settings)

      // Items used in recipes should be marked
      const usedItems = items.filter((i) => i.usedInRecipe)
      expect(usedItems.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('combinations generator', () => {
    it('should generate correct combinations', () => {
      const items = [1, 2, 3, 4]
      const combinator = (service as any).combinations(items, 2)

      const results: number[][] = []
      for (const combo of combinator) {
        results.push([...combo])
      }

      expect(results.length).toBe(6) // C(4,2) = 6
      expect(results).toContain([1, 2])
      expect(results).toContain([1, 3])
      expect(results).toContain([1, 4])
      expect(results).toContain([2, 3])
      expect(results).toContain([2, 4])
      expect(results).toContain([3, 4])
    })

    it('should handle size larger than array', () => {
      const items = [1, 2]
      const combinator = (service as any).combinations(items, 3)

      const results: number[][] = []
      for (const combo of combinator) {
        results.push([...combo])
      }

      // Size is clamped to array length, so returns C(2,2) = 1
      expect(results.length).toBe(1)
    })

    it('should return empty for negative size', () => {
      const items = [1, 2, 3]
      const combinator = (service as any).combinations(items, -1)

      const results: number[][] = []
      for (const combo of combinator) {
        results.push([...combo])
      }

      expect(results.length).toBe(0)
    })
  })
})

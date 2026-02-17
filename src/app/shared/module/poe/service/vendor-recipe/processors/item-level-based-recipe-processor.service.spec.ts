import { TestBed } from '@angular/core/testing'
import { LoggerService } from '@app/service'
import { BaseItemTypesService } from '@shared/module/poe/service/base-item-types/base-item-types.service'
import { ClientStringService } from '@shared/module/poe/service/client-string/client-string.service'
import { ContextService } from '@shared/module/poe/service/context.service'
import { ItemLevelBasedItemSetRecipeUserSettings } from '@shared/module/poe/type'
import { ExpandedStashItem } from './recipe-processor.service'
import { ItemLevelBasedRecipeProcessorService } from './item-level-based-recipe-processor.service'

// Concrete test implementation
class TestItemLevelBasedRecipeProcessor extends ItemLevelBasedRecipeProcessorService {
  protected get minItemLevel(): number {
    return 60
  }

  protected get fillerItemLevel(): number {
    return 75
  }

  get recipeName(): string {
    return 'Test Recipe'
  }

  get recipeShortName(): string {
    return 'Test'
  }

  get recipeId(): string {
    return 'test'
  }
}

describe('ItemLevelBasedRecipeProcessorService', () => {
  let service: TestItemLevelBasedRecipeProcessor
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
        {
          provide: TestItemLevelBasedRecipeProcessor,
          useFactory: () =>
            new TestItemLevelBasedRecipeProcessor(
              baseItemTypesServiceSpy,
              clientStringServiceSpy,
              contextServiceSpy,
              loggerServiceSpy
            ),
        },
      ],
    })

    service = TestBed.inject(TestItemLevelBasedRecipeProcessor)
  })

  function createMockStashItem(itemLevel: number, group?: string): ExpandedStashItem {
    return {
      itemLevel,
      identified: false,
      rarity: 'rare',
      recipeItemGroup: group || 'helmet',
      quality: 0,
      usedInRecipe: false,
      stashTabName: 'Test Stash',
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      name: 'Test Item',
      baseTypeName: 'Test Base',
      source: { corrupted: false, identified: false },
    } as unknown as ExpandedStashItem
  }

  describe('recipe properties', () => {
    it('should have correct recipe name', () => {
      expect(service.recipeName).toBe('Test Recipe')
    })

    it('should have correct recipe short name', () => {
      expect(service.recipeShortName).toBe('Test')
    })

    it('should have correct recipe id', () => {
      expect(service.recipeId).toBe('test')
    })
  })

  describe('getSplittedCandidates', () => {
    it('should split candidates by item level threshold', () => {
      const candidates = [
        createMockStashItem(60),
        createMockStashItem(65),
        createMockStashItem(74),
        createMockStashItem(75),
        createMockStashItem(80),
      ]

      const settings: Partial<ItemLevelBasedItemSetRecipeUserSettings> = {}

      // Access protected method through type assertion
      const splitted = (service as any).getSplittedCandidates(
        candidates,
        settings as ItemLevelBasedItemSetRecipeUserSettings
      )

      expect(splitted[0].length).toBe(3) // Items with ilvl 60-74 (main)
      expect(splitted[1].length).toBe(2) // Items with ilvl 75+ (filler)
    })

    it('should exclude items below minimum level', () => {
      const candidates = [
        createMockStashItem(50),
        createMockStashItem(59),
        createMockStashItem(60),
        createMockStashItem(75),
      ]

      const settings: Partial<ItemLevelBasedItemSetRecipeUserSettings> = {}

      const splitted = (service as any).getSplittedCandidates(
        candidates,
        settings as ItemLevelBasedItemSetRecipeUserSettings
      )

      expect(splitted[0].length).toBe(1) // Only ilvl 60
      expect(splitted[1].length).toBe(1) // Only ilvl 75
    })
  })

  describe('isValidRecipe', () => {
    it('should return true when set contains main recipe items', () => {
      const items = [
        createMockStashItem(60, 'helmet'),
        createMockStashItem(75, 'body'),
        createMockStashItem(80, 'gloves'),
      ]

      const result = (service as any).isValidRecipe(items)

      expect(result).toBeTrue()
    })

    it('should return false when set contains only filler items', () => {
      const items = [
        createMockStashItem(75, 'helmet'),
        createMockStashItem(80, 'body'),
        createMockStashItem(85, 'gloves'),
      ]

      const result = (service as any).isValidRecipe(items)

      expect(result).toBeFalse()
    })
  })

  describe('isPartOfRecipe', () => {
    it('should return true for items at or above minimum level', () => {
      const item = createMockStashItem(60)
      const settings: Partial<ItemLevelBasedItemSetRecipeUserSettings> = {}

      const result = (service as any).isPartOfRecipe(
        item,
        settings as ItemLevelBasedItemSetRecipeUserSettings
      )

      expect(result).toBeTrue()
    })

    it('should return false for items below minimum level', () => {
      const item = createMockStashItem(59)
      const settings: Partial<ItemLevelBasedItemSetRecipeUserSettings> = {}

      const result = (service as any).isPartOfRecipe(
        item,
        settings as ItemLevelBasedItemSetRecipeUserSettings
      )

      expect(result).toBeFalse()
    })
  })

  describe('item level thresholds', () => {
    it('should correctly categorize chaos recipe items (60-74)', () => {
      // Test specific levels for chaos recipe
      expect(service['minItemLevel']).toBe(60)
      expect(service['fillerItemLevel']).toBe(75)
    })
  })
})

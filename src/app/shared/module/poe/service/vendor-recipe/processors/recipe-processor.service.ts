import { LoggerService } from '@app/service'
import { BaseItemTypesService } from '@shared/module/poe/service/base-item-types/base-item-types.service'
import { ClientStringService } from '@shared/module/poe/service/client-string/client-string.service'
import { ContextService } from '@shared/module/poe/service/context.service'
import { ItemParserUtils } from '@shared/module/poe/service/item/parser/item-parser.utils'
import { BaseItemType, ItemCategory, PoEStashTabItem, RecipeItemGroup, RecipeUserSettings, VendorRecipeProcessResult, VendorRecipeType } from '@shared/module/poe/type'

export interface ExpandedStashItem extends PoEStashTabItem {
  baseItemTypeId: string
  baseItemType: BaseItemType
  calcX: number
  calcY: number
  recipeItemGroup: RecipeItemGroup
  quality: number
  usedInRecipe: boolean
}

const CategoryMapping = {
  // 1h
  [ItemCategory.WeaponClaw]: RecipeItemGroup.OneHandedWeapons,
  [ItemCategory.WeaponDagger]: RecipeItemGroup.OneHandedWeapons,
  [ItemCategory.WeaponOneAxe]: RecipeItemGroup.OneHandedWeapons,
  [ItemCategory.WeaponOneMace]: RecipeItemGroup.OneHandedWeapons,
  [ItemCategory.WeaponOneSword]: RecipeItemGroup.OneHandedWeapons,
  [ItemCategory.WeaponRunedagger]: RecipeItemGroup.OneHandedWeapons,
  [ItemCategory.WeaponSceptre]: RecipeItemGroup.OneHandedWeapons,
  [ItemCategory.WeaponWand]: RecipeItemGroup.OneHandedWeapons,
  // 2h
  [ItemCategory.WeaponTwoAxe]: RecipeItemGroup.TwoHandedWeapons,
  [ItemCategory.WeaponTwoMace]: RecipeItemGroup.TwoHandedWeapons,
  [ItemCategory.WeaponTwoSword]: RecipeItemGroup.TwoHandedWeapons,
  [ItemCategory.WeaponBow]: RecipeItemGroup.TwoHandedWeapons,
  [ItemCategory.WeaponStaff]: RecipeItemGroup.TwoHandedWeapons,
  [ItemCategory.WeaponWarstaff]: RecipeItemGroup.TwoHandedWeapons,
  // Others
  [ItemCategory.ArmourHelmet]: RecipeItemGroup.Helmets,
  [ItemCategory.ArmourChest]: RecipeItemGroup.Chests,
  [ItemCategory.ArmourGloves]: RecipeItemGroup.Gloves,
  [ItemCategory.ArmourBoots]: RecipeItemGroup.Boots,
  [ItemCategory.AccessoryBelt]: RecipeItemGroup.Belts,
  [ItemCategory.AccessoryRing]: RecipeItemGroup.Rings,
  [ItemCategory.AccessoryAmulet]: RecipeItemGroup.Amulets,
  // Gems
  [ItemCategory.Gem]: RecipeItemGroup.Gems,
  [ItemCategory.GemActiveGem]: RecipeItemGroup.Gems,
  [ItemCategory.GemSupportGem]: RecipeItemGroup.Gems,
  [ItemCategory.GemSupportGemplus]: RecipeItemGroup.Gems,
  // Flasks
  [ItemCategory.Flask]: RecipeItemGroup.Flasks,
}

const PerformanceSuffix = 'Performance'
const GlobalPerformanceTag = 'vendorRecipePerformance'

export abstract class RecipeProcessorService {
  protected getLogTag(settings: RecipeUserSettings, suffix: string = ''): string {
    let logTag = VendorRecipeType[settings.type]
    return logTag[0].toLowerCase() + logTag.substr(1) + 'Recipe' + suffix
  }

  constructor(
    protected readonly baseItemTypeService: BaseItemTypesService,
    protected readonly clientString: ClientStringService,
    protected readonly context: ContextService,
    protected readonly logger: LoggerService,
  ) {
  }

  public process(identifier: number, stashItems: PoEStashTabItem[], settings: RecipeUserSettings, processedRecipes: VendorRecipeProcessResult[]): VendorRecipeProcessResult {
    if (!settings.enabled) {
      return undefined
    }

    const logTag = this.getLogTag(settings, identifier.toString())

    const measurePerformance = this.logger.isLogTagEnabled(logTag + PerformanceSuffix) || this.logger.isLogTagEnabled(GlobalPerformanceTag)
    let dateNow
    if (measurePerformance) {
      dateNow = Date.now()
      console.time(`${dateNow}-recipe-${(identifier + 1)}-${VendorRecipeType[settings.type]}`)
    }

    this.logger.debug(logTag, `${identifier}. ${VendorRecipeType[settings.type]}`, settings)

    // Remove any items already used in previous recipes
    const availableStashItems = stashItems.filter(item =>
      !processedRecipes.some(result =>
        result.recipes.some(recipe => 
          recipe.some(recipeItem =>
            recipeItem.source.id === item.source.id
          )
        )
      )
    ).map((x) => this.expandItem(x))

    // Determine the base list of recipe items
    const allCandidates = this.getAllRecipeCandidates(availableStashItems, settings)

    const processedRecipe = this.processCandidates(logTag, identifier, allCandidates, settings)

    processedRecipes.push(processedRecipe)

    this.logger.debug(logTag, 'Recipes:', processedRecipe)
    if (measurePerformance) {
      console.timeEnd(`${dateNow}-recipe-${(identifier + 1)}-${VendorRecipeType[settings.type]}`)
    }

    return processedRecipe
  }

  protected abstract isPartOfRecipe(stashItem: ExpandedStashItem, settings: RecipeUserSettings): boolean

  protected abstract processCandidates(logTag: string, identifier: number, stashItems: ExpandedStashItem[], settings: RecipeUserSettings): VendorRecipeProcessResult

  protected expandItem(stashItem: PoEStashTabItem): ExpandedStashItem {
    const language = this.context.get().language
    const baseItemType = this.baseItemTypeService.search(stashItem.baseItemTypeName, language)
    const qualityString = this.clientString.translate("Quality", language)
    const bounds = stashItem.itemLocation.bounds
    const qualityText = stashItem.source.properties?.find(x => x.name === qualityString)?.values[0][0] as string
    return {
      ...stashItem,
      baseItemTypeId: baseItemType.id,
      baseItemType: baseItemType.baseItemType,
      calcX: bounds.x + bounds.width / 2,
      calcY: bounds.y + bounds.height / 2,
      recipeItemGroup: CategoryMapping[baseItemType.baseItemType.category],
      quality: qualityText ? ItemParserUtils.parseNumber(qualityText) : 0,
      usedInRecipe: false,
    }
  }

  protected calcDistance(item1: ExpandedStashItem, item2: ExpandedStashItem): number {
    const pos1 = this.getPos(item1)
    const pos2 = this.getPos(item2)
    let cost = 0
    if (pos1.tab !== pos2.tab) {
      cost += 40
    }
    cost += Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2))
    return cost
  }

  protected getPos(item: ExpandedStashItem): { tab: string, x: number, y: number } {
    if (item) {
      return {
        tab: item.itemLocation.tabName,
        x: item.calcX,
        y: item.calcY,
      }
    }
    return { tab: '', x: 0, y: 0 }
  }

  private getAllRecipeCandidates(stashItems: ExpandedStashItem[], settings: RecipeUserSettings): ExpandedStashItem[] {
    return stashItems.filter((stashItem) => this.isPartOfRecipe(stashItem, settings))
  }
}

import { LoggerService } from '@app/service'
import { BaseItemTypesService } from '@shared/module/poe/service/base-item-types/base-item-types.service'
import { ClientStringService } from '@shared/module/poe/service/client-string/client-string.service'
import { ContextService } from '@shared/module/poe/service/context.service'
import { ItemLevelBasedItemSetRecipeUserSettings, RecipeItemGroup } from '@shared/module/poe/type'
import { ItemSetRecipeProcessorService } from './item-set-recipe-processor.service'
import { ExpandedStashItem } from './recipe-processor.service'

export abstract class ItemLevelBasedRecipeProcessorService extends ItemSetRecipeProcessorService {
  constructor(
    readonly baseItemTypeService: BaseItemTypesService,
    readonly clientString: ClientStringService,
    readonly context: ContextService,
    readonly logger: LoggerService
  ) {
    super(baseItemTypeService, clientString, context, logger)
  }

  protected abstract get minItemLevel(): number

  protected abstract get fillerItemLevel(): number

  protected getSplittedCandidates(allCandidates: ExpandedStashItem[], settings: ItemLevelBasedItemSetRecipeUserSettings): ExpandedStashItem[][] {
    const mainCandidates = allCandidates.filter((x) =>
      x.itemLevel >= this.minItemLevel &&
      x.itemLevel < this.fillerItemLevel
    )
    const fillerCandidates = allCandidates.filter((x) =>
      x.itemLevel >= this.fillerItemLevel
    )
    return [mainCandidates, fillerCandidates]
  }

  protected getPickableCandidates(splittedCandidates: ExpandedStashItem[][], settings: ItemLevelBasedItemSetRecipeUserSettings, pickedItems: ExpandedStashItem[], groups: RecipeItemGroup[], lastItem: ExpandedStashItem): ExpandedStashItem[] {
    const hasMainRecipeItem = pickedItems.some(x => x.itemLevel < this.fillerItemLevel)
    const mainCandidates = splittedCandidates[0].filter((x) => this.canTakeItem(x, groups, lastItem))
    const fillerCandidates = splittedCandidates[1].filter((x) => this.canTakeItem(x, groups, lastItem))

    // Attempt to find an item, prioritizing main items first
    const candidates = hasMainRecipeItem ? fillerCandidates : mainCandidates
    if (hasMainRecipeItem && settings.fillGreedy) {
      // Add main candidates as fillers to greedily fill this group
      candidates.push(...mainCandidates)
    } else if (!hasMainRecipeItem && candidates.length === 0) {
      // Add fillter candidates because there are no main candidates left to be picked
      candidates.push(...fillerCandidates)
    }

    return candidates
  }

  protected isValidRecipe(items: ExpandedStashItem[]): boolean {
    return items.some(x => x.itemLevel < this.fillerItemLevel)
  }

  protected isPartOfRecipe(stashItem: ExpandedStashItem, settings: ItemLevelBasedItemSetRecipeUserSettings): boolean {
    if (!super.isPartOfRecipe(stashItem, settings)) {
      return false
    }
    return stashItem.itemLevel >= this.minItemLevel
  }
}

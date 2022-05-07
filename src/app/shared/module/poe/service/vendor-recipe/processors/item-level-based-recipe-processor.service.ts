import { BaseItemTypesService } from '@shared/module/poe/service/base-item-types/base-item-types.service'
import { ItemLevelBasedItemSetRecipeUserSettings } from '@shared/module/poe/type'
import { ExpandedStashItem, ItemSetRecipeProcessorService } from './item-set-recipe-processor.service'

export abstract class ItemLevelBasedRecipeProcessorService extends ItemSetRecipeProcessorService {
  constructor(
    baseItemTypeService: BaseItemTypesService
  ) {
    super(baseItemTypeService)
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

  protected getPickableCandidates(splittedCandidates: ExpandedStashItem[][], settings: ItemLevelBasedItemSetRecipeUserSettings, pickedItems: ExpandedStashItem[]): ExpandedStashItem[] {
    const hasMainRecipeItem = pickedItems.some(x => x.itemLevel < this.fillerItemLevel)
    const mainCandidates = splittedCandidates[0]
    const fillerCandidates = splittedCandidates[1]

    // Attempt to find an item, prioritizing main items first
    const candidates = [...(hasMainRecipeItem ? fillerCandidates : mainCandidates)]
    if (hasMainRecipeItem && settings.fillGreedy) {
      // Add main candidates as fillers to greedily fill this group
      candidates.push(...mainCandidates)
    }

    return candidates
  }

  protected isPartOfRecipe(stashItem: ExpandedStashItem, settings: ItemLevelBasedItemSetRecipeUserSettings): boolean {
    if (!super.isPartOfRecipe(stashItem, settings)) {
      return false
    }
    return stashItem.itemLevel >= this.minItemLevel
  }
}

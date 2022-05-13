import { Injectable } from '@angular/core';
import { BaseItemTypesService } from '@shared/module/poe/service/base-item-types/base-item-types.service';
import { RecipeItemGroup, ItemSetRecipeUserSettings, VendorRecipeType } from '@shared/module/poe/type';
import { ItemSetRecipeProcessorService } from './item-set-recipe-processor.service';
import { ExpandedStashItem } from './recipe-processor.service';

@Injectable({
  providedIn: 'root',
})
export class ExaltedShardRecipeProcessorService extends ItemSetRecipeProcessorService {
  constructor(
    readonly baseItemTypeService: BaseItemTypesService
  ) {
    super(baseItemTypeService)
  }

  protected getSplittedCandidates(allCandidates: ExpandedStashItem[], settings: ItemSetRecipeUserSettings): ExpandedStashItem[][] {
    return [allCandidates]
  }

  protected getPickableCandidates(splittedCandidates: ExpandedStashItem[][], settings: ItemSetRecipeUserSettings, pickedItems: ExpandedStashItem[]): ExpandedStashItem[] {
    return splittedCandidates[0]
  }

  protected isPartOfRecipe(stashItem: ExpandedStashItem, settings: ItemSetRecipeUserSettings): boolean {
    if (!super.isPartOfRecipe(stashItem, settings)) {
      return false
    }
    const influences = stashItem.source.influences
    if (!influences) {
      return false
    }
    if (!influences.shaper && !influences.elder && !influences.crusader && !influences.warlord && !influences.redeemer && !influences.hunter) {
      return false
    }
    return true
  }

  protected canTakeItem(item: ExpandedStashItem, group: RecipeItemGroup[], lastItem: ExpandedStashItem): boolean {
    if (!super.canTakeItem(item, group, lastItem)) {
      return false
    }
    if (!lastItem) {
      return true
    }
    const influences = item.source.influences
    const lastItemInfluences = item.source.influences
    const influencesKeys = Object.keys(influences).concat(Object.keys(lastItemInfluences))
    for (const influencesKey of influencesKeys) {
      if (influences[influencesKey] !== lastItemInfluences[influencesKey]) {
        return false
      }
    }
    return true
  }
}

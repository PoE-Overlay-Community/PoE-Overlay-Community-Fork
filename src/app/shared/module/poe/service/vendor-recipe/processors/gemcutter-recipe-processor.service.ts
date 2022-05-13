import { Injectable } from '@angular/core';
import { BaseItemTypesService } from '@shared/module/poe/service/base-item-types/base-item-types.service';
import { RecipeItemGroup } from '@shared/module/poe/type';
import { QualityRecipeProcessorService } from './quality-recipe-processor.service';

@Injectable({
  providedIn: 'root',
})
export class GemcutterRecipeProcessorService extends QualityRecipeProcessorService {
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

  constructor(
    readonly baseItemTypeService: BaseItemTypesService,
  ) {
    super(baseItemTypeService)
  }
}

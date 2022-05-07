import { Injectable } from '@angular/core';
import { BaseItemTypesService } from '@shared/module/poe/service/base-item-types/base-item-types.service';
import { ItemLevelBasedRecipeProcessorService } from './item-level-based-recipe-processor.service';

@Injectable({
  providedIn: 'root',
})
export default class ChaosRecipeProcessorService extends ItemLevelBasedRecipeProcessorService {
  constructor(
    readonly baseItemTypeService: BaseItemTypesService
  ) {
    super(baseItemTypeService)
  }

  protected get minItemLevel(): number {
    return 60
  }

  protected get fillerItemLevel(): number {
    return 75
  }
}

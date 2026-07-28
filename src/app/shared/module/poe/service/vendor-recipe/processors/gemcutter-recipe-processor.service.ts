import { Injectable } from '@angular/core'
import { LoggerService } from '@app/service'
import { BaseItemTypesService } from '@shared/module/poe/service/base-item-types/base-item-types.service'
import { ClientStringService } from '@shared/module/poe/service/client-string/client-string.service'
import { ContextService } from '@shared/module/poe/service/context.service'
import { RecipeItemGroup } from '@shared/module/poe/type'
import { QualityRecipeProcessorService } from './quality-recipe-processor.service'

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
    readonly clientString: ClientStringService,
    readonly context: ContextService,
    readonly logger: LoggerService,
  ) {
    super(baseItemTypeService, clientString, context, logger)
  }
}

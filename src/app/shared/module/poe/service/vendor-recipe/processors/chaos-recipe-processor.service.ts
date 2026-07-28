import { Injectable } from '@angular/core'
import { LoggerService } from '@app/service'
import { BaseItemTypesService } from '@shared/module/poe/service/base-item-types/base-item-types.service'
import { ClientStringService } from '@shared/module/poe/service/client-string/client-string.service'
import { ContextService } from '@shared/module/poe/service/context.service'
import { ItemLevelBasedRecipeProcessorService } from './item-level-based-recipe-processor.service'

@Injectable({
  providedIn: 'root',
})
export class ChaosRecipeProcessorService extends ItemLevelBasedRecipeProcessorService {
  constructor(
    readonly baseItemTypeService: BaseItemTypesService,
    readonly clientString: ClientStringService,
    readonly context: ContextService,
    readonly logger: LoggerService
  ) {
    super(baseItemTypeService, clientString, context, logger)
  }

  protected get minItemLevel(): number {
    return 60
  }

  protected get fillerItemLevel(): number {
    return 75
  }
}

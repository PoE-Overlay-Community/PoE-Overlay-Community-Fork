import { Injectable } from '@angular/core'
import { Item } from '@shared/module/poe/type'
import { ItemClusterJewelProcessorService } from './item-cluster-jewel-processor.service'
import { ItemDamageProcessorService } from './item-damage-processor.service'
import { ItemModifierMagnitudeProcessorService } from './item-modifier-magnitude-processor.service'
import { ItemPseudoProcessorService } from './item-pseudo-processor.service'
import { ItemQualityProcessorService } from './item-quality-processor.service'

export interface ItemProcessorOptions {
  normalizeQuality: boolean
  processClusterJewels: boolean
}

@Injectable({
  providedIn: 'root',
})
export class ItemProcessorService {
  constructor(
    private readonly itemQualityProcessorService: ItemQualityProcessorService,
    private readonly itemDamageProcessorService: ItemDamageProcessorService,
    private readonly itemClusterJewelProcessorService: ItemClusterJewelProcessorService,
    private readonly itemMagnitudeProcessorService: ItemModifierMagnitudeProcessorService,
    private readonly itemPseudoProcessorService: ItemPseudoProcessorService
  ) {}

  public process(item: Item, options: ItemProcessorOptions): void {
    if (!item) {
      return
    }
    this.itemQualityProcessorService.process(item, options.normalizeQuality)
    this.itemDamageProcessorService.process(item)
    if (options.processClusterJewels) {
      this.itemClusterJewelProcessorService.process(item)
    }
    this.itemMagnitudeProcessorService.process(item)
    this.itemPseudoProcessorService.process(item)
  }
}

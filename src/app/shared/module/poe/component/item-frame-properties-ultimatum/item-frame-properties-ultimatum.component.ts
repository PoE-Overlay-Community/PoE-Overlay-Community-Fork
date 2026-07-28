import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { ItemService } from '../../service'
import { UltimatumStringService } from '../../service/ultimatum/ultimatum-string.service'
import { Item, Language, UltimatumRewardType } from '../../type'

@Component({
  selector: 'app-item-frame-properties-ultimatum',
  templateUrl: './item-frame-properties-ultimatum.component.html',
  styleUrls: ['./item-frame-properties-ultimatum.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemFramePropertiesUltimatumComponent {
  @Input()
  public item: Item

  @Input()
  public queryItem: Item

  @Input()
  public language: Language

  constructor(
    private readonly ultimatumStringService: UltimatumStringService,
    private readonly itemService: ItemService
  ) {}

  public getChallengeTypeString(): string {
    return this.ultimatumStringService
      .getChallengeTypes()
      .find((x) => x.value === this.item.properties.ultimatum.challengeType).key
  }

  public getSacrificeString(): string {
    const ultimatum = this.item.properties.ultimatum
    if (ultimatum.rewardType === UltimatumRewardType.UniqueItem) {
      return this.itemService.getName(ultimatum.requiredItem, this.language)
    } else {
      return this.itemService.getType(ultimatum.requiredItem, this.language)
    }
  }

  public getRewardTypeString(): string {
    const ultimatum = this.item.properties.ultimatum
    const rewardType = ultimatum.rewardType
    if (rewardType === UltimatumRewardType.UniqueItem) {
      return this.itemService.getName(ultimatum.rewardUnique, this.language)
    }
    return this.ultimatumStringService.getRewardTypes().find((x) => x.value === rewardType).key
  }
}

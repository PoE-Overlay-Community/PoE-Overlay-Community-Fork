import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { EnumValues } from '../../../../../core/class'
import { ClientStringService } from '../../service/client-string/client-string.service'
import { HeistJob, Item, Language } from '../../type'

@Component({
  selector: 'app-item-frame-properties-heist',
  templateUrl: './item-frame-properties-heist.component.html',
  styleUrls: ['./item-frame-properties-heist.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemFramePropertiesHeistComponent {
  @Input()
  public item: Item

  @Input()
  public queryItem: Item

  @Input()
  public language: Language

  @Input()
  public minRange: number

  @Input()
  public maxRange: number

  public heistJobs = new EnumValues(HeistJob)

  constructor(private readonly clientString: ClientStringService) {}

  public getHeistObjectiveParts(): string[] {
    return this.clientString
      .translate('ItemDisplayHeistContractObjectiveWithValue')
      .replace('{1}', '{0}')
      .split('{0}')
  }

  public getHeistJobParts(): string[] {
    return this.clientString
      .translate('ItemDisplayHeistContractJob')
      .replace('{1}', '{0}')
      .split('{0}')
  }
}

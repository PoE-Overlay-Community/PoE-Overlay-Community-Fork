import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { AnnointmentsService } from '../../service/annointments/annointments.service'
import { Item, ItemStat, Language } from '../../type'

@Component({
  selector: 'app-item-frame-annointment',
  templateUrl: './item-frame-annointment.component.html',
  styleUrls: ['./item-frame-annointment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemFrameAnnointmentComponent {
  @Input()
  public item: Item

  @Input()
  public itemStat: ItemStat

  @Input()
  public language: Language

  constructor(private readonly annointmentsService: AnnointmentsService) {}

  public getOils(): string[] {
    return this.annointmentsService.get(this.item, this.itemStat.id, this.itemStat.predicate)
  }
}

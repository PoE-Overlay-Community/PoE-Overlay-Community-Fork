import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { ModIconsService } from '@shared/module/poe/service/mod-icons/mod-icons.service'
import { AnnointmentsService } from '../../service/annointments/annointments.service'
import { Item, ItemStat, Language, Stat } from '../../type'

@Component({
  selector: 'app-item-frame-stats',
  templateUrl: './item-frame-stats.component.html',
  styleUrls: ['./item-frame-stats.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemFrameStatsComponent {
  @Input()
  public item: Item

  @Input()
  public queryItem: Item

  @Input()
  public language: Language

  @Input()
  public modifierMinRange: number

  @Input()
  public modifierMaxRange: number

  @Input()
  public showAnnointmentOils: boolean

  constructor(
    private readonly modIconsService: ModIconsService,
    private readonly annointmentService: AnnointmentsService,
  ) { }

  public getValueClass(id: string): string {
    if (!id || id.length === 0) {
      return ''
    }

    if (id.includes('fire_')) {
      return 'fire'
    }
    if (id.includes('cold_')) {
      return 'cold'
    }
    if (id.includes('lightning_')) {
      return 'lightning'
    }
    if (id.includes('chaos_')) {
      return 'chaos'
    }

    return ''
  }

  public isAnnointmentStat(id: string): boolean {
    return this.annointmentService.isAnnointmentStat(this.item, id)
  }

  public getModIcon(modName: string): string {
    return this.modIconsService.get(modName, this.language)
  }

  public getStatClass(stat: ItemStat): string {
    if (stat.modName === 'foulborn') {
      return 'mutated'
    }
    return 'purpel'
  }
}

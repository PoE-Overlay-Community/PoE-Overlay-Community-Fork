import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { ClientStringService } from '../../service/client-string/client-string.service'
import { Item, ItemPropertiesIncursionRoom, Language } from '../../type'

@Component({
  selector: 'app-item-frame-properties-incursion',
  templateUrl: './item-frame-properties-incursion.component.html',
  styleUrls: ['./item-frame-properties-incursion.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemFramePropertiesIncursionComponent {
  @Input()
  public item: Item

  @Input()
  public queryItem: Item

  @Input()
  public language: Language

  constructor(private readonly clientString: ClientStringService) {}

  public getLocalizedTier(room: ItemPropertiesIncursionRoom): string {
    const mod = room.stat.mod
    if (!mod || mod.length === 0) {
      return ''
    }
    return ` ${this.clientString
      .translate('IncursionRoomPopupTier', this.language)
      .replace('{0}', mod.replace('tier', '').trim())}`
  }
}

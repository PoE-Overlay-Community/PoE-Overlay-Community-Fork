import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { Item, Language } from '../../type'

@Component({
  selector: 'app-item-frame-properties-necropolis',
  templateUrl: './item-frame-properties-necropolis.component.html',
  styleUrls: ['./item-frame-properties-necropolis.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemFramePropertiesNecropolisComponent {
  @Input()
  public item: Item

  @Input()
  public queryItem: Item

  @Input()
  public language: Language

  constructor(
  ) {}
}

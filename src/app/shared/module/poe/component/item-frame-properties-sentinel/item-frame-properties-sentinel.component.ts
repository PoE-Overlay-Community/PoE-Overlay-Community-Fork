import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { ClientStringService } from '../../service/client-string/client-string.service'
import { Item, Language } from '../../type'

@Component({
  selector: 'app-item-frame-properties-sentinel',
  templateUrl: './item-frame-properties-sentinel.component.html',
  styleUrls: ['./item-frame-properties-sentinel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemFramePropertiesSentinelComponent {
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

  constructor(private readonly clientString: ClientStringService) { }

  public getPhraseParts(phrase: string): string[] {
    return this.clientString
      .translate(phrase)
      .split('{0}')
  }
}

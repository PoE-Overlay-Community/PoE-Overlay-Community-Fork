import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { MathUtils } from '@app/class'
import { Currency } from '../../type'

@Component({
  selector: 'app-currency-ratio-frame',
  templateUrl: './currency-ratio-frame.component.html',
  styleUrls: ['./currency-ratio-frame.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CurrencyRatioFrameComponent {
  @Input()
  public currency: Currency

  @Input()
  public amount: number

  @Input()
  public numerator: number

  @Input()
  public denominator: number

  public get significantDecimalCount(): number {
    return Math.max(3, MathUtils.significantDecimalCount(this.numerator, this.denominator))
  }
}

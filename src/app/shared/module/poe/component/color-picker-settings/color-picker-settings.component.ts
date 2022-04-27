import { EventEmitter, Output } from '@angular/core'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { Color, ColorUtils } from '@app/class'

@Component({
  selector: 'app-color-picker-settings',
  templateUrl: './color-picker-settings.component.html',
  styleUrls: ['./color-picker-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorPickerSettingsComponent {
  @Input()
  public color: Color

  @Input()
  public label: string

  @Input()
  public tooltip?: string

  @Input()
  public side: string

  @Input()
  public defaultColor?: Color

  public ColorUtils = ColorUtils

  constructor(
  ) {
  }

  public onResetClick(): void {
    ColorUtils.update(this.color, ColorUtils.toRGBA(this.defaultColor))
  }
}

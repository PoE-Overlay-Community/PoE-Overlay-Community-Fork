import { EventEmitter, OnInit, Output } from '@angular/core'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { Color, Colors, ColorUtils } from '@app/class'

@Component({
  selector: 'app-color-picker-settings',
  templateUrl: './color-picker-settings.component.html',
  styleUrls: ['./color-picker-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorPickerSettingsComponent implements OnInit {
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

  public ngOnInit(): void {
    if (!this.color) {
      this.color = this.defaultColor || Colors.white
    }
  }

  public onResetClick(): void {
    ColorUtils.update(this.color, ColorUtils.toRGBA(this.defaultColor))
  }
}

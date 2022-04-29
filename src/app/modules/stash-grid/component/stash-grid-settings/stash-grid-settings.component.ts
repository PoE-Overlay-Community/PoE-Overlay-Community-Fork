import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { EnumValues } from '@app/class'
import { WindowService } from '@app/service'
import { UserSettingsComponent } from '@layout/type'
import { StashGridService } from '@shared/module/poe/service/stash-grid/stash-grid.service'
import {
    StashGridMode, StashGridOptions, StashGridType, StashGridUserSettings
} from '@shared/module/poe/type/stash-grid.type'

@Component({
  selector: 'app-stash-grid-settings',
  templateUrl: './stash-grid-settings.component.html',
  styleUrls: ['./stash-grid-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StashGridSettingsComponent implements UserSettingsComponent {
  @Input()
  public settings: StashGridUserSettings

  @Input()
  public defaultSettings: StashGridUserSettings

  public stashGridTypes = new EnumValues(StashGridType)

  private isShowingStashGrid = false

  constructor(
    private readonly window: WindowService,
    private readonly stashGridDialogService: StashGridService,
  ) {
    this.window.on('show').subscribe(() => {
      if (this.isShowingStashGrid) {
        this.stashGridDialogService.editStashGrid(null)
      }
    })
  }

  public load(): void { }

  public onEditStashGridClick(gridType: StashGridType): void {
    const options: StashGridOptions = {
      gridMode: StashGridMode.Edit,
      gridType,
      gridBounds: this.settings.stashGridBounds[gridType],
      settings: this.settings,
    }
    this.isShowingStashGrid = true
    this.window.hide()
    this.stashGridDialogService.editStashGrid(options).subscribe((stashGridBounds) => {
      this.isShowingStashGrid = false
      if (stashGridBounds) {
        this.settings.stashGridBounds[gridType] = stashGridBounds
      }
      this.window.show()
    })
  }

  public onPreviewStashGridClick(gridType: StashGridType): void {
    const options: StashGridOptions = {
      gridMode: StashGridMode.Preview,
      gridType,
      gridBounds: this.settings.stashGridBounds[gridType],
      highlightLocation: {
        tabName: '[Tab Name]',
        bounds: [{
          x: 6,
          y: 3,
          width: 2,
          height: 3,
        }],
      },
      settings: this.settings,
    }
    this.isShowingStashGrid = true
    this.window.hide()
    this.stashGridDialogService.showStashGrid(options).subscribe(() => {
      this.isShowingStashGrid = false
      this.window.show()
    })
  }
}

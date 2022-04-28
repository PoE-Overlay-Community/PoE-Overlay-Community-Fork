import {
    AfterViewInit,
    ChangeDetectionStrategy, Component, Input,
    OnChanges,
    OnDestroy,
    OnInit, SimpleChanges
} from '@angular/core'
import { ColorUtils, EnumValues } from '@app/class'
import { ItemGroupColor, ItemSetGroup, ItemSetProcessResult, ItemSetRecipeUserSettings, VendorRecipeType } from '@shared/module/poe/type'

@Component({
  selector: 'app-item-set-recipe-panel',
  templateUrl: './item-set-recipe-panel.component.html',
  styleUrls: ['./item-set-recipe-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemSetRecipePanelComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input()
  public settings: ItemSetRecipeUserSettings

  @Input()
  public itemSetProcessResult: ItemSetProcessResult

  public itemSetGroups = new EnumValues(ItemSetGroup)

  public get itemSets(): any {
    return this.itemSetGroups.keys.map(itemSetGroup => {
      return {
        itemSetGroup,
        itemGroupColor: this.settings?.itemClassColors.find(x => x.group === itemSetGroup),
        itemGroupColorName: this.getItemColorGroupName(itemSetGroup),
        itemGroupResult: this.itemSetProcessResult?.itemGroups.find(x => x.group === itemSetGroup),
      }
    }).filter(x => x.itemGroupColor && this.canShowItemColorGroup(x.itemGroupColor))
  }

  public ColorUtils = ColorUtils

  constructor(
  ) {
  }

  public ngOnInit(): void {
  }

  public ngAfterViewInit(): void {
  }

  public ngOnDestroy(): void {
  }

  public ngOnChanges(changes: SimpleChanges): void {
  }

  public getItemColorGroupName(itemSetGroup: ItemSetGroup): string {
    if (this.settings.groupWeaponsTogether && itemSetGroup === ItemSetGroup.OneHandedWeapons) {
      return "weapons"
    }
    return (this.itemSetGroups.values[itemSetGroup] as string).toLowerCase()
  }

  public canShowItemColorGroup(itemClassColor: ItemGroupColor): boolean {
    if (!itemClassColor.showOnOverlay || (itemClassColor.group === ItemSetGroup.TwoHandedWeapons && this.settings.groupWeaponsTogether)) {
      return false;
    }
    return true;
  }
}

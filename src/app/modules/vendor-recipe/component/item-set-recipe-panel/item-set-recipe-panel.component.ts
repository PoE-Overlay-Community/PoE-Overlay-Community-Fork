import {
    ChangeDetectionStrategy, Component, Input, OnDestroy,
    OnInit
} from '@angular/core'
import { ColorUtils, EnumValues } from '@app/class'
import { StashService } from '@shared/module/poe/service'
import { ItemGroupColor, ItemSetGroup, ItemSetProcessResult, ItemSetRecipeUserSettings } from '@shared/module/poe/type'
import { BehaviorSubject, Subscription } from 'rxjs'
import { throttleTime } from 'rxjs/operators'

@Component({
  selector: 'app-item-set-recipe-panel',
  templateUrl: './item-set-recipe-panel.component.html',
  styleUrls: ['./item-set-recipe-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemSetRecipePanelComponent implements OnInit, OnDestroy {
  @Input()
  public settings: ItemSetRecipeUserSettings

  @Input()
  public itemSetProcessResult: ItemSetProcessResult

  public readonly stashTabContentPeriodicUpdateActiveChanged$ = new BehaviorSubject<boolean>(false)

  public itemSetGroups = new EnumValues(ItemSetGroup)

  private readonly stashSub: Subscription

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
    private readonly stashService: StashService,
  ) {
    this.stashSub = this.stashService.stashTabContentPeriodicUpdateActiveChanged$.pipe(
      throttleTime(2000, undefined, { leading: true, trailing: true }),
    ).subscribe(x => this.stashTabContentPeriodicUpdateActiveChanged$.next(x))
  }

  public ngOnInit(): void {
  }

  public ngOnDestroy(): void {
    this.stashSub.unsubscribe()
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

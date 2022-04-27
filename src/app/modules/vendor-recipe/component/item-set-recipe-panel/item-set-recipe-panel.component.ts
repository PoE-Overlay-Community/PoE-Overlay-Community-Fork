import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component, Input,
    OnChanges,
    OnDestroy,
    OnInit, SimpleChanges
} from '@angular/core'
import { WindowService } from '@app/service'
import { Rectangle } from 'electron'
import { Subject, Subscription } from 'rxjs'
import { debounceTime, map } from 'rxjs/operators'
import { UserSettingsService } from '../../../../layout/service'
import { VendorRecipeService } from '../../../../shared/module/poe/service/vendor-recipe/vendor-recipe.service'
import { VendorRecipeUserSettings } from '../../../../shared/module/poe/type'

@Component({
  selector: 'app-item-set-recipe-panel',
  templateUrl: './item-set-recipe-panel.component.html',
  styleUrls: ['./item-set-recipe-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemSetRecipePanelComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input()
  public settings: VendorRecipeUserSettings

  @Input()
  public gameBounds: Rectangle

  public locked = true

  private vendorRecipeSub: Subscription

  private boundsUpdate$ = new Subject<Rectangle>()
  private closeClick$ = new Subject()

  private notificationAudioClip: HTMLAudioElement

  constructor(
    private readonly ref: ChangeDetectorRef,
    private readonly vendorRecipeService: VendorRecipeService,
    private readonly userSettingsService: UserSettingsService,
    private readonly windowService: WindowService,
  ) {
  }

  public ngOnInit(): void {
    this.vendorRecipeSub = this.vendorRecipeService.vendorRecipes$.subscribe(
      (itemSetProcessResult) => {
        //TODO
        this.ref.detectChanges()
      }
    )
    this.boundsUpdate$
      .pipe(
        debounceTime(350),
        map((bounds) => {
          this.userSettingsService
            .update<VendorRecipeUserSettings>((settings) => {
              settings.vendorRecipeItemSetPanelSettings.bounds = bounds
              return settings
            })
            .subscribe()
        })
      )
      .subscribe()
    this.closeClick$
      .pipe(
        debounceTime(350),
        map(() => {
          this.userSettingsService
            .update<VendorRecipeUserSettings>((settings) => {
              settings.vendorRecipeItemSetPanelSettings.enabled = false
              return settings
            })
            .subscribe((settings) => {
              this.settings = settings
              this.ref.detectChanges()
            })
        })
      )
      .subscribe()
  }

  public ngAfterViewInit(): void {
  }

  public ngOnDestroy(): void {
    this.vendorRecipeSub.unsubscribe()
    this.notificationAudioClip?.remove()
  }

  public ngOnChanges(changes: SimpleChanges): void {
  }

  public onResizeDragEnd(bounds: Rectangle): void {
    const offset = 50
    const windowBounds = this.windowService.getWindowBounds()
    windowBounds.x = offset
    windowBounds.y = offset
    windowBounds.width -= offset * 2
    windowBounds.height -= offset * 2

    if (this.intersects(bounds, windowBounds)) {
      this.boundsUpdate$.next(bounds)
    }
  }

  public close(): void {
    this.closeClick$.next()
  }

  private intersects(a: Rectangle, b: Rectangle): boolean {
    return (
      a.x <= b.x + b.width && a.x + a.width >= b.x && a.y <= b.y + b.height && a.y + a.height >= b.y
    )
  }
}

import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component, EventEmitter, Input,
    OnChanges,
    OnDestroy,
    OnInit, Output, SimpleChanges
} from '@angular/core'
import { WindowService } from '@app/service'
import { UserSettingsService } from '@layout/service'
import { VendorRecipeService } from '@shared/module/poe/service/vendor-recipe/vendor-recipe.service'
import { AudioClipSettings, ItemSetProcessResult, ItemSetRecipeUserSettings, VendorRecipeType, VendorRecipeUserSettings } from '@shared/module/poe/type'
import { Rectangle } from 'electron'
import { BehaviorSubject, Subject, Subscription } from 'rxjs'
import { debounceTime, map } from 'rxjs/operators'

@Component({
  selector: 'app-vendor-recipe-panel',
  templateUrl: './vendor-recipe-panel.component.html',
  styleUrls: ['./vendor-recipe-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorRecipePanelComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input()
  public settings: VendorRecipeUserSettings

  @Input()
  public gameBounds: Rectangle

  @Output()
  public openSettings = new EventEmitter<void>()

  public optionsHovered = false
  public optionsDowned = false
  public optionsClicked = false

  public get optionsExpanded(): boolean {
    return this.optionsHovered || this.optionsClicked || this.optionsDowned
  }

  public locked = true

  public readonly lastItemSetResult$ = new BehaviorSubject<ItemSetProcessResult>(undefined)
  public readonly lastFilteredItemSetResult$ = new BehaviorSubject<ItemSetProcessResult>(undefined)

  public get vendorRecipeSettings(): ItemSetRecipeUserSettings {
    switch (this.currentRecipeType) {
      case VendorRecipeType.Chaos:
        return this.settings.vendorRecipeChaosRecipeSettings

      case VendorRecipeType.ExaltedShard:
        return this.settings.vendorRecipeExaltedShardRecipeSettings

      default:
        return undefined
    }
  }

  private vendorRecipeSub: Subscription

  private readonly boundsUpdate$ = new Subject<Rectangle>()
  private readonly closeClick$ = new Subject()

  private currentRecipeType = VendorRecipeType.Chaos

  private audioClips: HTMLAudioElement[] = []

  constructor(
    private readonly ref: ChangeDetectorRef,
    private readonly vendorRecipeService: VendorRecipeService,
    private readonly userSettingsService: UserSettingsService,
    private readonly windowService: WindowService,
  ) {
  }

  public ngOnInit(): void {
    this.vendorRecipeSub = this.vendorRecipeService.vendorRecipes$.subscribe(x => this.updateItemSetResult(x))
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
    this.audioClips.forEach(x => x.remove())
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

  private playAudioClip(audioClipSettings: AudioClipSettings): void {
    const audioClip = new Audio()
    audioClip.src = audioClipSettings.src
    audioClip.volume = audioClipSettings.volume
    const scopedEndedHandler = () => {
      audioClip.removeEventListener('ended', scopedEndedHandler)
      this.audioClips.splice(this.audioClips.indexOf(audioClip), 1)
      audioClip.remove()
    }
    audioClip.addEventListener('ended', scopedEndedHandler)
    audioClip.play()
  }

  private updateItemSetResult(itemSetResult: ItemSetProcessResult): void {
    const lastItemSetResult = this.lastItemSetResult$.value
    if (lastItemSetResult) {
      const vendorRecipeSettings = this.vendorRecipeSettings
      if (vendorRecipeSettings) {
        // Play audio when any item group reached its threshold
        if (vendorRecipeSettings.itemThresholdAudio.enabled) {
          for (const lastItemGroup of lastItemSetResult.itemGroups.filter(x => x.type === this.currentRecipeType)) {
            const newItemGroup = itemSetResult.itemGroups.find(x => x.type === lastItemGroup.type && x.group === lastItemGroup.group)
            if (newItemGroup && lastItemGroup.count < vendorRecipeSettings.itemThreshold && newItemGroup.count >= vendorRecipeSettings.itemThreshold) {
              this.playAudioClip(vendorRecipeSettings.itemThresholdAudio)
              break
            }
          }
        }
        // Play audio when the full set threshold is reached
        if (vendorRecipeSettings.fullSetThresholdAudio.enabled && lastItemSetResult.recipes.length < vendorRecipeSettings.fullSetThreshold && itemSetResult.recipes.length >= vendorRecipeSettings.fullSetThreshold) {
          this.playAudioClip(vendorRecipeSettings.fullSetThresholdAudio)
        }
      }
    }
    if (itemSetResult) {
      this.lastItemSetResult$.next(itemSetResult)
      this.lastFilteredItemSetResult$.next({
        recipes: itemSetResult.recipes.filter(x => x.type === this.currentRecipeType),
        itemGroups: itemSetResult.itemGroups.filter(x => x.type === this.currentRecipeType),
      })
      this.ref.detectChanges()
    }
  }
}

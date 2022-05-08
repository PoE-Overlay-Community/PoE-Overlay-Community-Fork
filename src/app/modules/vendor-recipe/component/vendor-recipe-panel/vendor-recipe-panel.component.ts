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
import { AudioClipSettings, ItemSetGroup, ItemSetProcessResult, ItemSetRecipeUserSettings, VendorRecipeType, VendorRecipeUserSettings } from '@shared/module/poe/type'
import { Rectangle } from 'electron'
import { BehaviorSubject, Subject, Subscription } from 'rxjs'
import { debounceTime, map } from 'rxjs/operators'
import { StashService } from '../../../../shared/module/poe/service'

@Component({
  selector: 'app-vendor-recipe-panel',
  templateUrl: './vendor-recipe-panel.component.html',
  styleUrls: ['./vendor-recipe-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorRecipePanelComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input()
  public settings: VendorRecipeUserSettings

  @Input()
  public gameBounds: Rectangle

  @Output()
  public openSettings = new EventEmitter<void>()

  public get enabled(): boolean {
    return this.settings.vendorRecipeItemSetPanelSettings.enabled && this.settings.vendorRecipeItemSetSettings.some(x => x.enabled)
  }

  public optionsHovered = false
  public optionsDowned = false
  public optionsClicked = false

  public get optionsExpanded(): boolean {
    return this.optionsHovered || this.optionsClicked || this.optionsDowned
  }

  public locked = true

  public readonly lastItemSetResult$ = new BehaviorSubject<ItemSetProcessResult>(undefined)
  public readonly lastFilteredItemSetResult$ = new BehaviorSubject<ItemSetProcessResult>(undefined)

  private currentRecipeIndex = 0

  public get vendorRecipeSettings(): ItemSetRecipeUserSettings {
    return this.settings.vendorRecipeItemSetSettings[this.currentRecipeIndex]
  }

  private vendorRecipeSub: Subscription

  private readonly boundsUpdate$ = new Subject<Rectangle>()
  private readonly closeClick$ = new Subject()

  private audioClips: HTMLAudioElement[] = []

  constructor(
    private readonly ref: ChangeDetectorRef,
    private readonly vendorRecipeService: VendorRecipeService,
    private readonly userSettingsService: UserSettingsService,
    private readonly windowService: WindowService,
    private readonly stashService: StashService,
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

    if (!this.vendorRecipeSettings.enabled) {
      this.currentRecipeIndex = this.getNextEnabledSettingsIndex(1)
    }
  }

  public ngAfterViewInit(): void {
  }

  public ngOnDestroy(): void {
    this.vendorRecipeSub.unsubscribe()
    this.audioClips.forEach(x => x.remove())
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

  public onRecipeTypeScroll(event: WheelEvent): void {
    if (!this.settings.vendorRecipeItemSetSettings.some(x => x.enabled)) {
      return
    }
    const factor = event.deltaY > 0 ? 1 : -1
    this.currentRecipeIndex = this.getNextEnabledSettingsIndex(factor)
    this.updateLastFilteredItemSetResult()
    this.ref.detectChanges()
  }

  public close(): void {
    this.closeClick$.next()
  }

  public forceRefreshVendorRecipes(): void {
    // Force-updating the content will trigger a vendor recipe update too
    this.stashService.forceUpdateTabContent()
  }

  private getNextEnabledSettingsIndex(factor: number): number {
    if (!this.settings.vendorRecipeItemSetSettings.some(x => x.enabled)) {
      return this.currentRecipeIndex
    }
    let newIndex = this.currentRecipeIndex
    while (true) {
      newIndex += factor
      if (newIndex < 0) {
        newIndex += this.settings.vendorRecipeItemSetSettings.length
      }
      newIndex %= this.settings.vendorRecipeItemSetSettings.length
      if (this.settings.vendorRecipeItemSetSettings[newIndex].enabled) {
        return newIndex
      }
    }
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
          for (const lastItemGroup of lastItemSetResult.itemGroups.filter(x => x.identifier === this.currentRecipeIndex)) {
            const newItemGroup = itemSetResult.itemGroups.find(x => x.identifier === lastItemGroup.identifier && x.group === lastItemGroup.group)
            const itemThreshold = vendorRecipeSettings.itemGroupSettings.find(x => x.group === lastItemGroup.group)?.itemThreshold || vendorRecipeSettings.itemThreshold
            if (newItemGroup && lastItemGroup.count < itemThreshold && newItemGroup.count >= itemThreshold) {
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
      this.updateLastFilteredItemSetResult()
      this.ref.detectChanges()
    }
  }

  private updateLastFilteredItemSetResult() {
    const itemSetResult = this.lastItemSetResult$.value
    this.lastFilteredItemSetResult$.next({
      recipes: itemSetResult.recipes.filter(x => x.identifier === this.currentRecipeIndex),
      itemGroups: itemSetResult.itemGroups.filter(x => x.identifier === this.currentRecipeIndex),
    })
  }
}

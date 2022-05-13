import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component, EventEmitter, Input, OnDestroy,
    OnInit, Output
} from '@angular/core'
import { WindowService } from '@app/service'
import { UserSettingsService } from '@layout/service'
import { StashService } from '@shared/module/poe/service'
import { VendorRecipeService } from '@shared/module/poe/service/vendor-recipe/vendor-recipe.service'
import { AudioClipSettings, RecipeUserSettings, VendorRecipeProcessResult, VendorRecipeType, VendorRecipeUserSettings } from '@shared/module/poe/type'
import { Rectangle } from 'electron'
import { BehaviorSubject, Subject, Subscription } from 'rxjs'
import { debounceTime, map } from 'rxjs/operators'

@Component({
  selector: 'app-vendor-recipes-panel',
  templateUrl: './vendor-recipes-panel.component.html',
  styleUrls: ['./vendor-recipes-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorRecipesPanelComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input()
  public settings: VendorRecipeUserSettings

  @Input()
  public gameBounds: Rectangle

  @Output()
  public openSettings = new EventEmitter<void>()

  public get enabled(): boolean {
    return this.settings.vendorRecipePanelSettings.enabled && this.settings.vendorRecipeSettings.some(x => x.enabled)
  }

  public optionsHovered = false
  public optionsDowned = false
  public optionsClicked = false

  public get optionsExpanded(): boolean {
    return this.optionsHovered || this.optionsClicked || this.optionsDowned
  }

  public locked = true

  public readonly lastVendorRecipeResults$ = new BehaviorSubject<VendorRecipeProcessResult[]>(undefined)
  public readonly currentVendorRecipeResult$ = new BehaviorSubject<VendorRecipeProcessResult>(undefined)

  private currentRecipeIndex = 0

  public get vendorRecipeSettings(): RecipeUserSettings {
    return this.settings.vendorRecipeSettings[this.currentRecipeIndex]
  }

  public VendorRecipeType = VendorRecipeType

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
              settings.vendorRecipePanelSettings.bounds = bounds
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
              settings.vendorRecipePanelSettings.enabled = false
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
    if (!this.settings.vendorRecipeSettings.some(x => x.enabled)) {
      return
    }
    const factor = event.deltaY > 0 ? 1 : -1
    this.currentRecipeIndex = this.getNextEnabledSettingsIndex(factor)
    this.updateCurrencVendorRecipeResult()
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
    if (!this.settings.vendorRecipeSettings.some(x => x.enabled)) {
      return this.currentRecipeIndex
    }
    let newIndex = this.currentRecipeIndex
    while (true) {
      newIndex += factor
      if (newIndex < 0) {
        newIndex += this.settings.vendorRecipeSettings.length
      }
      newIndex %= this.settings.vendorRecipeSettings.length
      if (this.settings.vendorRecipeSettings[newIndex].enabled) {
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

  private updateItemSetResult(vendorRecipes: VendorRecipeProcessResult[]): void {
    const lastResults = this.lastVendorRecipeResults$.value
    const lastVendorRecipe = this.currentVendorRecipeResult$.value
    if (lastResults && lastVendorRecipe) {
      const vendorRecipeSettings = this.vendorRecipeSettings
      if (vendorRecipeSettings) {
        const vendorRecipe = vendorRecipes[this.currentRecipeIndex]
        // Play audio when any item group reached its threshold
        if (vendorRecipeSettings.itemThresholdAudio.enabled) {
          for (const lastItemGroup of lastVendorRecipe.itemGroups) {
            const newItemGroup = vendorRecipe.itemGroups.find(x => x.group === lastItemGroup.group)
            const itemThreshold = vendorRecipeSettings.itemGroupSettings.find(x => x.group === lastItemGroup.group)?.itemThreshold || vendorRecipeSettings.itemThreshold
            if (newItemGroup && lastItemGroup.count < itemThreshold && newItemGroup.count >= itemThreshold) {
              this.playAudioClip(vendorRecipeSettings.itemThresholdAudio)
              break
            }
          }
        }
        // Play audio when the full set threshold is reached
        if (vendorRecipeSettings.fullSetThresholdAudio.enabled && lastVendorRecipe.recipes.length < vendorRecipeSettings.fullSetThreshold && vendorRecipe.recipes.length >= vendorRecipeSettings.fullSetThreshold) {
          this.playAudioClip(vendorRecipeSettings.fullSetThresholdAudio)
        }
      }
    }
    if (vendorRecipes) {
      this.lastVendorRecipeResults$.next(vendorRecipes)
      this.updateCurrencVendorRecipeResult()
      this.ref.detectChanges()
    }
  }

  private updateCurrencVendorRecipeResult(): void {
    const vendorRecipes = this.lastVendorRecipeResults$.value
    if (vendorRecipes) {
      this.currentVendorRecipeResult$.next(vendorRecipes.find(x => x.identifier === this.currentRecipeIndex))
    }
  }
}

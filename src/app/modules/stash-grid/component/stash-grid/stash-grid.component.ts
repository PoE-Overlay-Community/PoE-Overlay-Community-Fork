import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    SimpleChanges
} from '@angular/core'
import { ColorUtils, EnumValues } from '@app/class'
import { MouseService, ShortcutService } from '@app/service/input'
import { Rectangle, VisibleFlag } from '@app/type'
import { environment } from '@env/environment'
import { UserSettings } from '@layout/type'
import { StashTabLayoutProvider } from '@shared/module/poe/provider/stash-tab-layout.provider'
import { ItemExchangeRateService } from '@shared/module/poe/service'
import { CurrencyService } from '@shared/module/poe/service/currency/currency.service'
import { StashGridService } from '@shared/module/poe/service/stash-grid/stash-grid.service'
import { Currency, ItemCategory } from '@shared/module/poe/type'
import {
    StashGridMode, StashGridOptions, StashGridType, StashGridUserSettings, STASH_GRID_TYPE_TO_ITEM_CATEGORY_MAP, STASH_TAB_CELL_COUNT_MAP
} from '@shared/module/poe/type/stash-grid.type'
import { BehaviorSubject, forkJoin, of, Subscription } from 'rxjs'
import { delay, map, switchMap, tap } from 'rxjs/operators'
import { EvaluateUserSettings } from '../../../evaluate/component/evaluate-settings/evaluate-settings.component'

const stashGridCompRef = 'stash-grid'

interface CellData {
  regular?: RegularCellData
  static?: StaticCellData
}

interface RegularCellData {
  highlight: boolean
  marked: boolean
  bgColor: string
  lineColor: string
  markedTextColor: string
}

interface StaticCellData {
  xOffset: number
  yOffset: number
  width: number
  height: number
  priceCurrency?: Currency
  priceValue?: number
}

@Component({
  selector: 'app-stash-grid',
  templateUrl: './stash-grid.component.html',
  styleUrls: ['./stash-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StashGridComponent implements OnInit, OnDestroy, OnChanges {
  // tslint:disable-next-line:no-input-rename
  @Input('settings')
  public globalSettings: StashGridUserSettings

  public readonly ColorUtils = ColorUtils
  public readonly StashGridMode = StashGridMode
  public readonly StashGridType = StashGridType

  public readonly stashGridOptions$ = new BehaviorSubject<StashGridOptions>(undefined)

  public visible: boolean
  public gridBounds: Rectangle
  public cellArray: number[]
  public cellData: CellData[][]
  public cellScale: number
  public fontRatio: number

  public get settings(): StashGridUserSettings {
    return this.stashGridOptions$.value?.settings || this.globalSettings
  }

  private markedBoundsIndex: number

  private stashGridServiceSubscription: Subscription
  private escapeSubscription: Subscription
  private clickSubscription: Subscription

  private stashGridTypes = new EnumValues(StashGridType)

  constructor(
    private readonly ref: ChangeDetectorRef,
    private readonly stashGridService: StashGridService,
    private readonly stashGridLayoutProvider: StashTabLayoutProvider,
    private readonly shortcutService: ShortcutService,
    private readonly mouse: MouseService,
    private readonly itemExchangeRateService: ItemExchangeRateService,
    private readonly currencyService: CurrencyService,
  ) {
  }

  public ngOnInit(): void {
    this.stashGridServiceSubscription = this.stashGridService.stashGridOptions$.subscribe(
      (stashGridOptions) => this.updateStashGridOptions(stashGridOptions)
    )
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (this.visible) {
      this.enableShortcuts()
    } else {
      this.disableShortcuts()
    }
  }

  public ngOnDestroy(): void {
    this.stashGridServiceSubscription?.unsubscribe()
    this.clickSubscription?.unsubscribe()
    if (this.escapeSubscription) {
      this.shortcutService.removeAllByRef(stashGridCompRef)
      this.escapeSubscription.unsubscribe()
    }
  }

  public onResizeDrag(bounds: Rectangle): void {
    // Here as a dummy to enforce bound updates
  }

  public gridCellClick(event: MouseEvent, colIndex: number, rowIndex: number): void {
    if (this.clickSubscription || !this.intersectsMarkedBounds(colIndex, rowIndex)) {
      return
    }
    let target = event.target as HTMLElement
    while (target && !target.classList.contains('gridCell')) {
      target = target.parentElement
    }
    if (!target) {
      return
    }
    // Remove the clickability, move the mouse ever so slightly and then back before triggering a mouse click.
    // Without the movement, the pass - through click isn't registered properly by the game-client
    target.classList.remove('clickable')
    this.clickSubscription = of(null).pipe(
      map(() => this.mouse.position()),
      delay(10),
      tap((point) => this.mouse.move({
        x: point.x + 1,
        y: point.y,
      })),
      delay(10),
      tap((point) => this.mouse.move(point)),
      delay(10),
      tap(() => this.mouse.click('left')),
      delay(10),
      tap(() => {
        this.markedBoundsIndex++
        const stashGridOptions = this.stashGridOptions$.value
        const totalHighlightLocations = stashGridOptions.highlightLocation.bounds.length
        if (this.markedBoundsIndex >= totalHighlightLocations) {
          if (stashGridOptions.autoClose) {
            this.stashGridService.nextStashGridInSequence()
            return
          } else {
            this.markedBoundsIndex = totalHighlightLocations - 1
          }
        } else {
          this.updateCellData(stashGridOptions, false, false)
          this.ref.detectChanges()
        }
      })
    ).subscribe(null, null, () => {
      this.clickSubscription?.unsubscribe()
      this.clickSubscription = null
    })
  }

  public gridCellRightClick(event: MouseEvent, colIndex: number, rowIndex: number): void {
    if (environment.production || this.clickSubscription || !this.intersectsMarkedBounds(colIndex, rowIndex)) {
      return
    }
    this.markedBoundsIndex++
    const stashGridOptions = this.stashGridOptions$.value
    const totalHighlightLocations = stashGridOptions.highlightLocation.bounds.length
    if (this.markedBoundsIndex >= totalHighlightLocations) {
      if (stashGridOptions.autoClose) {
        this.stashGridService.nextStashGridInSequence()
        return
      } else {
        this.markedBoundsIndex = totalHighlightLocations - 1
      }
    } else {
      this.updateCellData(stashGridOptions, false, false)
      this.ref.detectChanges()
    }
  }

  public getGridBackgroundColor(highlight: boolean): string {
    const stashGridColors = this.settings.stashGridColors
    const color = highlight ? stashGridColors.highlightBackground : stashGridColors.gridBackground
    return ColorUtils.toRGBA(color)
  }

  public getGridLineColor(highlight: boolean): string {
    const stashGridColors = this.settings.stashGridColors
    const color = highlight ? stashGridColors.highlightLine : stashGridColors.gridLine
    return ColorUtils.toRGBA(color)
  }

  public intersectsMarkedBounds(colIndex: number, rowIndex: number): boolean {
    const highlightLocation = this.stashGridOptions$.value.highlightLocation
    if (highlightLocation && this.markedBoundsIndex < highlightLocation.bounds.length) {
      colIndex += 1
      rowIndex += 1
      const bounds = highlightLocation.bounds[this.markedBoundsIndex]
      return (
        colIndex >= bounds.x &&
        colIndex < bounds.x + bounds.width &&
        rowIndex >= bounds.y &&
        rowIndex < bounds.y + bounds.height
      )
    }
    return false
  }

  public intersectsHighlightBounds(colIndex: number, rowIndex: number): boolean {
    const highlightLocation = this.stashGridOptions$.value.highlightLocation
    if (highlightLocation) {
      colIndex += 1
      rowIndex += 1
      return highlightLocation.bounds.some(bounds => {
        return (
          colIndex >= bounds.x &&
          colIndex < bounds.x + bounds.width &&
          rowIndex >= bounds.y &&
          rowIndex < bounds.y + bounds.height
        )
      })
    }
    return false
  }

  public saveChanges(): void {
    this.stashGridService.completeStashGridEdit(this.gridBounds)
  }

  public cancelChanges(): void {
    this.stashGridService.cancelStashGridSequence()
  }

  public toggleStashGrid(): void {
    const stashGridOptions = this.stashGridOptions$.value
    stashGridOptions.gridType = (stashGridOptions.gridType + 1) % this.stashGridTypes.keys.length
    stashGridOptions.gridBounds = null
    this.updateStashGridOptions(stashGridOptions)
  }

  private updateCellData(stashGridOptions: StashGridOptions, rebuild: boolean, updateHighlighted: boolean) {
    const stashGridColors = this.settings.stashGridColors
    const highlightLocations = stashGridOptions.highlightLocation
    const markedBounds = highlightLocations?.bounds[this.markedBoundsIndex]
    const cellCount = STASH_TAB_CELL_COUNT_MAP[stashGridOptions.gridType]
    const normalBGColor = ColorUtils.toRGBA(stashGridColors.gridBackground)
    const normalLineColor = ColorUtils.toRGBA(stashGridColors.gridLine)
    const highlightBGColor = ColorUtils.toRGBA(stashGridColors.highlightBackground)
    const highlightLineColor = ColorUtils.toRGBA(stashGridColors.highlightLine)
    const markedTextColor = ColorUtils.toRGBA(stashGridColors.highlightText)
    if (rebuild) {
      this.cellData = []
      for (let row = 0; row < cellCount; row++) {
        const colData: CellData[] = []
        for (let col = 0; col < cellCount; col++) {
          colData.push({
            regular: {
              highlight: false,
              marked: false,
              bgColor: normalBGColor,
              lineColor: normalLineColor,
              markedTextColor: markedTextColor,
            },
          })
        }
        this.cellData.push(colData)
      }
    }
    for (let row = 0; row < cellCount; row++) {
      const rowIndex = row + 1
      for (let col = 0; col < cellCount; col++) {
        const colIndex = col + 1
        const cellData = this.cellData[row][col]
        if (highlightLocations) {
          if (updateHighlighted) {
            cellData.regular.highlight = highlightLocations.bounds.some(bounds => {
              return (
                colIndex >= bounds.x &&
                colIndex < bounds.x + bounds.width &&
                rowIndex >= bounds.y &&
                rowIndex < bounds.y + bounds.height
              )
            })
          }
          cellData.regular.marked = (
            cellData.regular.highlight &&
            colIndex >= markedBounds.x &&
            colIndex < markedBounds.x + markedBounds.width &&
            rowIndex >= markedBounds.y &&
            rowIndex < markedBounds.y + markedBounds.height
          )
          cellData.regular.bgColor = cellData.regular.highlight ? highlightBGColor : normalBGColor
          cellData.regular.lineColor = cellData.regular.highlight ? highlightLineColor : normalLineColor
        }
      }
    }
  }

  private updateStashGridOptions(stashGridOptions: StashGridOptions): void {
    if (stashGridOptions) {
      this.visible = true
      this.markedBoundsIndex = 0
      switch (stashGridOptions.gridType) {
        case StashGridType.Normal:
        case StashGridType.Quad:
          const cellCount = STASH_TAB_CELL_COUNT_MAP[stashGridOptions.gridType]
          this.cellArray = this.createArray(cellCount)
          this.updateCellData(stashGridOptions, true, true)
          this.fontRatio = STASH_TAB_CELL_COUNT_MAP[StashGridType.Quad] / cellCount
          this.cellScale = 1
          this.gridBounds = stashGridOptions.gridBounds ||
            (stashGridOptions.settings || this.globalSettings).stashGridBounds[stashGridOptions.gridType] || {
            x: 16,
            y: 134,
            width: 624,
            height: 624,
          }
          break

        default:
          const stashTabLayoutMap = this.stashGridLayoutProvider.provide(stashGridOptions.gridType)
          if (!stashTabLayoutMap) {
            return
          }
          const baseItemTypeIds = Object.getOwnPropertyNames(stashTabLayoutMap).filter(x => stashTabLayoutMap[x].showIfEmpty)
          this.cellArray = this.createArray(baseItemTypeIds.length)
          this.cellData = []
          this.cellData.push(baseItemTypeIds.map(baseItemTypeId => {
            const layout = stashTabLayoutMap[baseItemTypeId]
            let cellData: CellData = {
              static: {
                xOffset: layout.xOffset * 2 / 3,
                yOffset: layout.yOffset * 2 / 3,
                width: layout.width * 52,
                height: layout.height * 52,
              }
            }
            const evaluateSettings = (((stashGridOptions.settings || this.globalSettings) as UserSettings) as EvaluateUserSettings)
            forkJoin(evaluateSettings.evaluateCurrencyIds.map((id) =>
              this.currencyService.searchById(id)
            )).pipe(switchMap(currencies => {
              return this.itemExchangeRateService.get({
                typeId: baseItemTypeId,
                category: STASH_GRID_TYPE_TO_ITEM_CATEGORY_MAP[stashGridOptions.gridType],
              }, currencies, evaluateSettings.evaluateUseCurrencyExchangeData, (stashGridOptions.settings || this.globalSettings).leagueId)
            })).subscribe(exchangeRateResult => {
              if (exchangeRateResult && exchangeRateResult.currency && exchangeRateResult.amount) {
                cellData.static.priceCurrency = exchangeRateResult.currency
                cellData.static.priceValue = exchangeRateResult.amount
                this.ref.detectChanges()
              }
            })
            return cellData
          }))
          switch (stashGridOptions.gridType) {
            case StashGridType.FragmentScarab:
              this.cellScale = 0.7
              break

            default:
              this.cellScale = 1
              break
          }
          this.fontRatio = 1
          this.gridBounds = stashGridOptions.gridBounds ||
            (stashGridOptions.settings || this.globalSettings).stashGridBounds[stashGridOptions.gridType] || {
            x: 16,
            y: 134,
            width: 624,
            height: 624,
          }
          break
      }
      this.enableShortcuts()
    } else {
      this.visible = false
      this.disableShortcuts()
    }
    this.stashGridOptions$.next(stashGridOptions)
  }

  private enableShortcuts(): void {
    if (!this.escapeSubscription) {
      const clearShortcut = () => {
        this.escapeSubscription?.unsubscribe()
        this.escapeSubscription = null
      }

      this.escapeSubscription = this.shortcutService
        .add('escape', stashGridCompRef, false, VisibleFlag.Game, VisibleFlag.Overlay)
        .subscribe(() => this.cancelChanges(), clearShortcut, clearShortcut)
    }

    this.shortcutService.enableAllByRef(stashGridCompRef)
  }

  private disableShortcuts(): void {
    this.shortcutService.disableAllByRef(stashGridCompRef)
  }

  private createArray(n: number): number[] {
    return [...Array(n).keys()]
  }
}

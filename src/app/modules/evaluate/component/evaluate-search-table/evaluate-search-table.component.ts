import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core'
import { ItemSearchAnalyzeResult } from '@shared/module/poe/service'
import { Currency } from '@shared/module/poe/type'

interface Row {
  amount: number
  priceNumerator: number
  priceDenominator: number
  originalAmount: number
  originalCurrency: Currency
  count: number
  seller: string
  age: string
}

interface SelectEvent {
  amount: number
  numerator: number
  denominator: number
  currency?: Currency
}

@Component({
  selector: 'app-evaluate-search-table',
  templateUrl: './evaluate-search-table.component.html',
  styleUrls: ['./evaluate-search-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvaluateSearchTableComponent {
  public rows: Row[] = []
  public currency: Currency

  @Input()
  public set result(result: ItemSearchAnalyzeResult) {
    this.currency = result.currency
    if (result.entries.length > 0) {
      const keyFn = (row: Row): string => {
        return `${row.amount}_${row.seller}_${row.age}`
      }
      const map: {
        [key: string]: Row
      } = {}
      result.entries.forEach((item) => {
        const next: Row = {
          amount: item.targetAmount,
          priceNumerator: item.priceNumerator,
          priceDenominator: item.priceDenominator,
          count: 1,
          originalAmount: item.originalAmount,
          originalCurrency: item.original,
          seller: item.seller,
          age: item.age,
        }
        const key = keyFn(next)
        if (map[key]) {
          map[key].count++
        } else {
          map[key] = next
        }
      })
      this.rows = Object.getOwnPropertyNames(map)
        .map((key) => map[key])
        .sort((a, b) => a.amount - b.amount)
    } else {
      this.rows = []
    }
  }

  @Input()
  public original: boolean

  @Input()
  public wideViewport: boolean

  @Output()
  public amountSelect = new EventEmitter<SelectEvent>()

  public onRowClick(event: MouseEvent, row: Row): void {
    event.stopImmediatePropagation()

    this.amountSelect.next({
      amount: this.original ? row.originalAmount : row.amount,
      numerator: row.priceNumerator,
      denominator: row.priceDenominator,
      currency: this.original ? row.originalCurrency : undefined,
    })
  }

  public showRatio(row: Row): boolean {
    return (
      (row.priceDenominator !== 1 || row.priceNumerator !== row.originalAmount) &&
      Math.floor(row.originalAmount) !== row.originalAmount
    )
  }
}

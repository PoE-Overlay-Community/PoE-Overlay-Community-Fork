import { Injectable } from '@angular/core'
import { default as tradeRegexes } from '../../../../../assets/poe/trade-regexes.json'
import { TradeRegexes } from '../type/trade-companion.type'

@Injectable({
  providedIn: 'root',
})
export class TradeRegexesProvider {
  public provide(): TradeRegexes {
    return tradeRegexes
  }
}

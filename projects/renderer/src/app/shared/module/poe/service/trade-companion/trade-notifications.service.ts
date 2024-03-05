import { EventEmitter, Injectable } from '@angular/core'
import { EnumValues, MathUtils } from '@app/class'
import { ElectronProvider } from '@app/provider/electron.provider'
import { GameLogService } from '@app/service/game-log.service'
import type { IpcMain } from 'electron' //main
import type { IpcMainEvent, IpcRenderer } from 'electron' //renderer
import moment from 'moment'
import { forkJoin } from 'rxjs'
import { TradeRegexesProvider } from '../../provider/trade-regexes.provider'
import { ItemCategory, Language } from '../../type'
import { MAX_STASH_SIZE } from '../../type/stash-grid.type'
import {
    ExampleNotificationType,
    TradeNotification,
    TradeNotificationType
} from '../../type/trade-companion.type'
import { BaseItemTypesService } from '../base-item-types/base-item-types.service'
import { ClientStringService } from '../client-string/client-string.service'
import { CurrencyService } from '../currency/currency.service'

const LOGLINE_DATE_FORMAT = 'YYYY/MM/DD HH:mm:ss'
const FROM_TO_PLACEHOLDER = '{fromto}'

const ADD_EXAMPLE_TRADE_NOTIFICATION_KEY = 'trade-notification-add-example'

const MAP_GENERATION_ID = 10

const MAP_TIER_REGEXES: LangRegExp[] = [
  { language: Language.English, regex: new RegExp('\\(T(?<tier>\\S+)\\)') },
  { language: Language.Portuguese, regex: new RegExp('\\(T(?<tier>\\S+)\\)') },
  { language: Language.Russian, regex: new RegExp('\\(T(?<tier>\\S+)\\)') },
  { language: Language.Thai, regex: new RegExp('\\(T(?<tier>\\S+)\\)') },
  { language: Language.German, regex: new RegExp('\\(Lvl (?<tier>\\S+)\\)') },
  { language: Language.French, regex: new RegExp('\\(T(?<tier>\\S+)\\)') },
  { language: Language.Spanish, regex: new RegExp('\\(G(?<tier>\\S+)\\)') },
  { language: Language.Korean, regex: new RegExp('\\(T(?<tier>\\S+)\\)') },
  { language: Language.TraditionalChinese, regex: new RegExp('\\(T(?<tier>\\S+)\\)') },
  { language: Language.Japanese, regex: new RegExp('\\(T(?<tier>\\S+)\\)') },
]

const TIERLESS_MAPS = ['MapWorldsChimera', 'MapWorldsHydra', 'MapWorldsMinotaur', 'MapWorldsPhoenix']

interface TradeRegexes {
  whisper: RegExp
  itemTradeOffer: LangRegExp[]
  currencyTradeOffer: LangRegExp[]
  playerJoinedArea: LangRegExp[]
  playerLeftArea: LangRegExp[]
}

interface LangRegExp {
  language: Language
  regex: RegExp
}

@Injectable({
  providedIn: 'root',
})
export class TradeNotificationsService {
  public readonly notificationAddedOrChanged = new EventEmitter<TradeNotification>()

  private readonly tradeRegexes: TradeRegexes

  private readonly languages = new EnumValues(Language)

  private ipcMain: IpcMain
  private ipcRenderer: IpcRenderer

  private notifications: TradeNotification[] = []

  private scopedAddExampleNotificationEvent

  constructor(
    electronProvider: ElectronProvider,
    tradeRegexesProvider: TradeRegexesProvider,
    private readonly gameLogService: GameLogService,
    private readonly currencyService: CurrencyService,
    private readonly baseItemTypesService: BaseItemTypesService,
    private readonly clientString: ClientStringService
  ) {
    this.ipcMain = electronProvider.provideIpcMain()
    this.ipcRenderer = electronProvider.provideIpcRenderer()
    this.gameLogService.logLineAdded.subscribe((logLine: string) => this.onLogLineAdded(logLine))

    // Init regexes
    const tradeRegexStrings = tradeRegexesProvider.provide()
    this.tradeRegexes = {
      whisper: new RegExp(tradeRegexStrings.all + tradeRegexStrings.whisper, 'i'),
      itemTradeOffer: [],
      currencyTradeOffer: [],
      playerJoinedArea: [],
      playerLeftArea: [],
    }
    for (const key in tradeRegexStrings.tradeItemPrice) {
      const regex = tradeRegexStrings.tradeItemPrice[key]
      this.tradeRegexes.itemTradeOffer.push({
        language: this.languages.values[key],
        regex: new RegExp(regex, 'i'),
      })
    }
    for (const key in tradeRegexStrings.tradeBulk) {
      const regex = tradeRegexStrings.tradeBulk[key]
      this.tradeRegexes.currencyTradeOffer.push({
        language: this.languages.values[key],
        regex: new RegExp(regex, 'i'),
      })
    }
    for (const key in tradeRegexStrings.joinedArea) {
      const regex = tradeRegexStrings.joinedArea[key]
      this.tradeRegexes.playerJoinedArea.push({
        language: this.languages.values[key],
        regex: new RegExp(tradeRegexStrings.all + regex, 'i'),
      })
    }
    for (const key in tradeRegexStrings.leftArea) {
      const regex = tradeRegexStrings.leftArea[key]
      this.tradeRegexes.playerLeftArea.push({
        language: this.languages.values[key],
        regex: new RegExp(tradeRegexStrings.all + regex, 'i'),
      })
    }
  }

  /**
   * Call this method only from the main window
   */
  public registerEvents(): void {
    if (!this.scopedAddExampleNotificationEvent) {
      this.scopedAddExampleNotificationEvent = (event, exampleNotificationType) =>
        this.onAddExampleNotification(event, exampleNotificationType)
      this.ipcMain.on(ADD_EXAMPLE_TRADE_NOTIFICATION_KEY, this.scopedAddExampleNotificationEvent)
    }
  }

  /**
   * Call this method only from the main window
   */
  public unregisterEvents(): void {
    this.ipcMain.removeListener(
      ADD_EXAMPLE_TRADE_NOTIFICATION_KEY,
      this.scopedAddExampleNotificationEvent
    )
  }

  /**
   * Call this method only from the settings window
   */
  public addExampleTradeNotification(exampleNotificationType: ExampleNotificationType): void {
    this.ipcRenderer.send(ADD_EXAMPLE_TRADE_NOTIFICATION_KEY, exampleNotificationType)
  }

  public dismissNotification(notification: TradeNotification): void {
    this.notifications = this.notifications.filter((tn) => tn !== notification)
  }

  private addNotification(notification: TradeNotification): void {
    this.notifications.push(notification)
    this.notificationAddedOrChanged.emit(notification)
  }

  private onLogLineAdded(logLine: string): void {
    if (this.tradeRegexes.whisper.test(logLine)) {
      const whisperMatch = this.tradeRegexes.whisper.exec(logLine)
      const whisperMessage = whisperMatch.groups.message

      for (const langRegex of this.tradeRegexes.itemTradeOffer) {
        if (langRegex.regex.test(whisperMessage)) {
          this.parseItemTradeWhisper(
            whisperMatch,
            langRegex.regex.exec(whisperMessage),
            langRegex.language
          )
          return
        }
      }

      for (const langRegex of this.tradeRegexes.currencyTradeOffer) {
        if (langRegex.regex.test(whisperMessage)) {
          this.parseCurrencyTradeWhisper(
            whisperMatch,
            langRegex.regex.exec(whisperMessage),
            langRegex.language
          )
          return
        }
      }
    } else {
      for (const langRegex of this.tradeRegexes.playerJoinedArea) {
        if (langRegex.regex.test(logLine)) {
          this.parsePlayerJoinedArea(langRegex.regex.exec(logLine))
          return
        }
      }
      for (const langRegex of this.tradeRegexes.playerLeftArea) {
        if (langRegex.regex.test(logLine)) {
          this.parsePlayerLeftArea(langRegex.regex.exec(logLine))
          return
        }
      }
    }
  }

  private parsePlayerJoinedArea(whisperMatch: RegExpMatchArray): void {
    const playerName = whisperMatch.groups.player
    this.notifications
      .filter(
        (notification) =>
          notification.playerName === playerName &&
          !notification.playerInHideout &&
          !notification.playerLeftHideout
      )
      .forEach((notification) => {
        notification.playerInHideout = true
        this.notificationAddedOrChanged.emit(notification)
      })
  }

  private parsePlayerLeftArea(whisperMatch: RegExpMatchArray): void {
    const playerName = whisperMatch.groups.player
    this.notifications
      .filter(
        (notification) =>
          notification.playerName === playerName &&
          notification.playerInHideout &&
          !notification.playerLeftHideout
      )
      .forEach((notification) => {
        notification.playerInHideout = false
        notification.playerLeftHideout = true
        this.notificationAddedOrChanged.emit(notification)
      })
  }

  private parseCurrencyTradeWhisper(
    whisperMatch: RegExpMatchArray,
    tradeMatch: RegExpMatchArray,
    tradeLanguage: Language
  ): void {
    const whisperGroups = whisperMatch.groups
    const tradeGroups = tradeMatch.groups
    const playerName = whisperGroups.player
    const currencyID = tradeGroups.name
    const offerItemID = tradeGroups.currency
    const fullWhisper = `@${playerName} ${whisperGroups.message}`
    const whisperTime = moment(whisperGroups.timestamp, LOGLINE_DATE_FORMAT)
    const notificationType = whisperGroups.from
      ? TradeNotificationType.Incoming
      : TradeNotificationType.Outgoing
    const notification = this.notifications.find(
      (x) => x.type === notificationType && x.text === fullWhisper
    )
    if (notification) {
      // Repeated whisper -> Reset timer
      notification.time = whisperTime
      this.notificationAddedOrChanged.emit(notification)
      return
    }
    forkJoin([
      this.currencyService.searchByNameType(currencyID, tradeLanguage),
      this.currencyService.searchByNameType(offerItemID, tradeLanguage),
    ]).subscribe((currencies) => {
      const currency = currencies[0] || {
        id: currencyID,
        nameType: currencyID,
        image: null,
      }
      const offerCurrency = currencies[1] || {
        id: offerItemID,
        nameType: offerItemID,
        image: null,
      }
      currency.image = currency.image || this.getImageUrl(currencyID, tradeLanguage)
      offerCurrency.image = offerCurrency.image || this.getImageUrl(offerItemID, tradeLanguage)

      const notification: TradeNotification = {
        text: fullWhisper,
        type: notificationType,
        time: whisperTime,
        playerName,
        item: {
          amount: +tradeGroups.count,
          currency,
        },
        price: {
          amount: +tradeGroups.price,
          currency: offerCurrency,
        },
        offer: tradeGroups.message,
      }
      this.addNotification(notification)
    })
  }

  private parseItemTradeWhisper(
    whisperMatch: RegExpMatchArray,
    tradeMatch: RegExpMatchArray,
    tradeLanguage: Language
  ): void {
    const whisperGroups = whisperMatch.groups
    const tradeGroups = tradeMatch.groups
    const currencyID = tradeGroups.currency
    const playerName = whisperGroups.player
    const fullWhisper = `@${playerName} ${whisperGroups.message}`
    const whisperTime = moment(whisperGroups.timestamp, LOGLINE_DATE_FORMAT)
    const notificationType = whisperGroups.from
      ? TradeNotificationType.Incoming
      : TradeNotificationType.Outgoing
    const notification = this.notifications.find(
      (x) => x.type === notificationType && x.text === fullWhisper
    )
    if (notification) {
      // Repeated whisper -> Reset timer
      notification.time = whisperTime
      this.notificationAddedOrChanged.emit(notification)
      return
    }
    this.currencyService.searchById(currencyID, tradeLanguage).subscribe((currency) => {
      currency = currency || {
        id: currencyID,
        nameType: currencyID,
        image: null,
      }
      currency.image = currency.image || this.getImageUrl(currencyID, tradeLanguage)
      const itemName = tradeGroups.name
      const baseItemType = this.baseItemTypesService.search(itemName, tradeLanguage).baseItemType
      const notification: TradeNotification = {
        text: fullWhisper,
        type: notificationType,
        time: whisperTime,
        playerName,
        item: itemName,
        price: {
          amount: +tradeGroups.price,
          currency,
        },
        itemLocation: {
          tabName: tradeGroups.stash,
          bounds: {
            x: MathUtils.clamp(+tradeGroups.left, 1, MAX_STASH_SIZE),
            y: MathUtils.clamp(+tradeGroups.top, 1, MAX_STASH_SIZE),
            width: baseItemType?.width ?? 1,
            height: baseItemType?.height ?? 1,
          },
        },
        offer: tradeGroups.message,
      }
      this.addNotification(notification)
    })
  }

  private getImageUrl(item: string, language: Language): string {
    const result = this.baseItemTypesService.search(item, language)
    const baseItemType = result?.baseItemType
    if (!baseItemType) {
      return null
    }
    if (baseItemType.image) {
      return baseItemType.image
    }
    switch (baseItemType.category) {
      case ItemCategory.Map:
        // Check for map tier
        const tierRegex = MAP_TIER_REGEXES.find((x) => x.language === language)?.regex
        const tierMatch = tierRegex?.exec(item)
        let tier = tierMatch?.groups?.tier ?? 0
        if (TIERLESS_MAPS.indexOf(result.id) !== -1) {
          tier = 0
        }

        // Check for blighted map
        let suffix = ''
        const blightedMapItemNameDisplay = this.clientString
          .translate('InfectedMap')
          .replace('{0}', baseItemType.names[language])
        if (item.startsWith(blightedMapItemNameDisplay)) {
          suffix = '&mb=1'
        }

        // Check for blight-ravaged map
        const blightRavagedMapItemNameDisplay = this.clientString
          .translate('UberInfectedMap')
          .replace('{0}', baseItemType.names[language])
        if (item.startsWith(blightRavagedMapItemNameDisplay)) {
          suffix = '&mb=2'
        }

        return `/image/${baseItemType.image}.png?w=1&h=1&scale=1&mn=${MAP_GENERATION_ID}&mt=${tier}${suffix}`
    }
    return null
  }

  private onAddExampleNotification(
    event: IpcMainEvent,
    exampleNotificationType: ExampleNotificationType
  ): void {
    let logLine: string
    switch (exampleNotificationType) {
      case ExampleNotificationType.Item:
        // 2021/04/16 17:04:56 26257593 bb3 [INFO Client 24612] @From FakePlayerName: Hi, I would like to buy your level 14 0% Steelskin listed for 1 alch in Standard (stash tab "~price 1 alch #2"; position: left 3, top 9) -- Offer 1c?
        logLine = `${moment().format(
          LOGLINE_DATE_FORMAT
        )}  12345678 bb3 [INFO Client 12345] @${FROM_TO_PLACEHOLDER} FakePlayerName: Hi, I would like to buy your level 14 0% Steelskin listed for 1 alch in Standard (stash tab "~price 1 alch #2"; position: left 3, top 9) -- Offer 1c?`
        break

      case ExampleNotificationType.Currency:
        // 2021/04/16 15:48:55 12345678 bb3 [INFO Client 12345] @From FakePlayerName: Hi, I'd like to buy your 1 Exalted Orb for my 100 Chaos Orb in Standard. -- Offer 95c?
        logLine = `${moment().format(
          LOGLINE_DATE_FORMAT
        )}  12345678 bb3 [INFO Client 12345] @${FROM_TO_PLACEHOLDER} FakePlayerName: Hi, I'd like to buy your 1 Exalted Orb for my 100 Chaos Orb in Standard. -- Offer 95c?`
        break

      default:
        return
    }
    this.onLogLineAdded(logLine.replace(FROM_TO_PLACEHOLDER, 'To'))
    this.onLogLineAdded(logLine.replace(FROM_TO_PLACEHOLDER, 'From'))
  }
}

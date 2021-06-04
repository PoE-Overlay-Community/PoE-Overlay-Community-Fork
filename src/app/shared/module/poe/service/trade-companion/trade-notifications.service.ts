import { EventEmitter, Injectable } from '@angular/core';
import { ElectronProvider } from '@app/provider/electron.provider';
import { IpcMain, IpcMainEvent, IpcRenderer } from 'electron';
import moment from 'moment';
import { forkJoin } from 'rxjs';
import { GameLogService } from '../../../../../core/service/game-log.service';
import { TradeRegexesProvider } from '../../provider/trade-regexes.provider';
import { Language } from '../../type';
import { ExampleNotificationType, MAX_STASH_SIZE, TradeNotification, TradeNotificationType } from '../../type/trade-companion.type';
import { BaseItemTypesService } from '../base-item-types/base-item-types.service';
import { CurrencyService } from '../currency/currency.service';

const logLineDateFormat = 'YYYY/MM/DD HH:mm:ss'
const fromToPlaceholder = '{fromto}'

const AddExampleTradeNotificationKey = 'trade-notification-add-example'

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

  private ipcMain: IpcMain
  private ipcRenderer: IpcRenderer

  private notifications: TradeNotification[] = []

  private scopedAddExampleNotificationEvent

  constructor(
    electronProvider: ElectronProvider,
    tradeRegexesProvider: TradeRegexesProvider,
    private readonly gameLogService: GameLogService,
    private readonly currencyService: CurrencyService,
    private readonly baseItemTypesService: BaseItemTypesService
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
        language: Language[key],
        regex: new RegExp(regex, 'i'),
      })
    }
    for (const key in tradeRegexStrings.tradeBulk) {
      const regex = tradeRegexStrings.tradeBulk[key]
      this.tradeRegexes.currencyTradeOffer.push({
        language: Language[key],
        regex: new RegExp(regex, 'i'),
      })
    }
    for (const key in tradeRegexStrings.joinedArea) {
      const regex = tradeRegexStrings.joinedArea[key]
      this.tradeRegexes.playerJoinedArea.push({
        language: Language[key],
        regex: new RegExp(tradeRegexStrings.all + regex, 'i'),
      })
    }
    for (const key in tradeRegexStrings.leftArea) {
      const regex = tradeRegexStrings.leftArea[key]
      this.tradeRegexes.playerLeftArea.push({
        language: Language[key],
        regex: new RegExp(tradeRegexStrings.all + regex, 'i'),
      })
    }
  }

  /**
   * Call this method only from the main window
   */
  public registerEvents() {
    if (!this.scopedAddExampleNotificationEvent) {
      this.scopedAddExampleNotificationEvent = (event, exampleNotificationType) => this.onAddExampleNotification(event, exampleNotificationType)
      this.ipcMain.on(AddExampleTradeNotificationKey, this.scopedAddExampleNotificationEvent)
    }
  }

  /**
   * Call this method only from the main window
   */
  public unregisterEvents() {
    this.ipcMain.removeListener(AddExampleTradeNotificationKey, this.scopedAddExampleNotificationEvent)
  }

  /**
   * Call this method only from the settings window
   */
  public addExampleTradeNotification(exampleNotificationType: ExampleNotificationType): void {
    this.ipcRenderer.send(AddExampleTradeNotificationKey, exampleNotificationType)
  }

  public dismissNotification(notification: TradeNotification): void {
    this.notifications = this.notifications.filter((tn) => tn !== notification)
  }

  private addNotification(notification: TradeNotification) {
    this.notifications.push(notification)
    this.notificationAddedOrChanged.emit(notification)
  }

  private onLogLineAdded(logLine: string): void {
    if (this.tradeRegexes.whisper.test(logLine)) {
      const whisperMatch = this.tradeRegexes.whisper.exec(logLine)
      const whisperMessage = whisperMatch.groups.message
      for (const langRegex of this.tradeRegexes.itemTradeOffer) {
        if (langRegex.regex.test(whisperMessage)) {
          this.parseItemTradeWhisper(whisperMatch, langRegex.regex.exec(whisperMessage), langRegex.language)
          return
        }
      }

      for (const langRegex of this.tradeRegexes.currencyTradeOffer) {
        if (langRegex.regex.test(whisperMessage)) {
          this.parseCurrencyTradeWhisper(whisperMatch, langRegex.regex.exec(whisperMessage), langRegex.language)
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
    this.notifications.filter((notification) =>
      notification.playerName === playerName &&
      !notification.playerInHideout &&
      !notification.playerLeftHideout
    ).forEach((notification) => {
      notification.playerInHideout = true
      this.notificationAddedOrChanged.emit(notification)
    })
  }

  private parsePlayerLeftArea(whisperMatch: RegExpMatchArray): void {
    const playerName = whisperMatch.groups.player
    this.notifications.filter((notification) =>
      notification.playerName === playerName &&
      notification.playerInHideout &&
      !notification.playerLeftHideout
    ).forEach((notification) => {
      notification.playerInHideout = false
      notification.playerLeftHideout = true
      this.notificationAddedOrChanged.emit(notification)
    })
  }

  private parseCurrencyTradeWhisper(whisperMatch: RegExpMatchArray, tradeMatch: RegExpMatchArray, tradeLanguage: Language): void {
    const whisperGroups = whisperMatch.groups
    const tradeGroups = tradeMatch.groups
    const playerName = whisperGroups.player
    const currencyID = tradeGroups.name
    const offerItemID = tradeGroups.currency
    const fullWhisper = `@${playerName} ${whisperGroups.message}`
    const whisperTime = moment(whisperGroups.timestamp, logLineDateFormat)
    const notificationType = whisperGroups.from ? TradeNotificationType.Incoming : TradeNotificationType.Outgoing
    const notification = this.notifications.find((x) => x.type === notificationType && x.text === fullWhisper)
    if (notification) {
      // Repeated whisper -> Reset timer
      notification.time = whisperTime
      this.notificationAddedOrChanged.emit(notification)
      return
    }
    forkJoin([this.currencyService.searchByNameType(currencyID, tradeLanguage), this.currencyService.searchByNameType(offerItemID, tradeLanguage)]).subscribe((currencies) => {
      const notification: TradeNotification = {
        text: fullWhisper,
        type: notificationType,
        time: whisperTime,
        playerName: playerName,
        item: {
          amount: +tradeGroups.count,
          currency: currencies[0] || {
            id: currencyID,
            nameType: currencyID,
            image: null,
          }
        },
        price: {
          amount: +tradeGroups.price,
          currency: currencies[1] || {
            id: offerItemID,
            nameType: offerItemID,
            image: null,
          },
        },
        offer: tradeGroups.message,
      }
      this.addNotification(notification)
    })
  }

  private parseItemTradeWhisper(whisperMatch: RegExpMatchArray, tradeMatch: RegExpMatchArray, tradeLanguage: Language): void {
    const whisperGroups = whisperMatch.groups
    const tradeGroups = tradeMatch.groups
    const currencyID = tradeGroups.currency
    const playerName = whisperGroups.player
    const fullWhisper = `@${playerName} ${whisperGroups.message}`
    const whisperTime = moment(whisperGroups.timestamp, logLineDateFormat)
    const notificationType = whisperGroups.from ? TradeNotificationType.Incoming : TradeNotificationType.Outgoing
    const notification = this.notifications.find((x) => x.type === notificationType && x.text === fullWhisper)
    if (notification) {
      // Repeated whisper -> Reset timer
      notification.time = whisperTime
      this.notificationAddedOrChanged.emit(notification)
      return
    }
    this.currencyService.searchById(currencyID, tradeLanguage).subscribe((currency) => {
      const itemName = tradeGroups.name
      const baseItemType = this.baseItemTypesService.get(this.baseItemTypesService.search(itemName, tradeLanguage))
      const notification: TradeNotification = {
        text: fullWhisper,
        type: notificationType,
        time: whisperTime,
        playerName: playerName,
        item: itemName,
        price: {
          amount: +tradeGroups.price,
          currency: currency || {
            id: currencyID,
            nameType: currencyID,
            image: null,
          },
        },
        itemLocation: {
          tabName: tradeGroups.stash,
          bounds: {
            x: this.clamp(+tradeGroups.left, 1, MAX_STASH_SIZE),
            y: this.clamp(+tradeGroups.top, 1, MAX_STASH_SIZE),
            width: baseItemType?.width ?? 1,
            height: baseItemType?.height ?? 1,
          }
        },
        offer: tradeGroups.message,
      }
      this.addNotification(notification)
    })
  }

  private clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
  }

  private onAddExampleNotification(event: IpcMainEvent, exampleNotificationType: ExampleNotificationType) {
    let logLine: string
    switch (exampleNotificationType) {
      case ExampleNotificationType.Item:
        //2021/04/16 17:04:56 26257593 bb3 [INFO Client 24612] @From FakePlayerName: Hi, I would like to buy your level 14 0% Steelskin listed for 1 alch in Standard (stash tab "~price 1 alch #2"; position: left 3, top 9) -- Offer 1c?
        logLine = `${moment().format(logLineDateFormat)}  12345678 bb3 [INFO Client 12345] @${fromToPlaceholder} FakePlayerName: Hi, I would like to buy your level 14 0% Steelskin listed for 1 alch in Standard (stash tab "~price 1 alch #2"; position: left 3, top 9) -- Offer 1c?`
        break

      case ExampleNotificationType.Currency:
        //2021/04/16 15:48:55 12345678 bb3 [INFO Client 12345] @From FakePlayerName: Hi, I'd like to buy your 1 Exalted Orb for my 100 Chaos Orb in Standard. -- Offer 95c?
        logLine = `${moment().format(logLineDateFormat)}  12345678 bb3 [INFO Client 12345] @${fromToPlaceholder} FakePlayerName: Hi, I'd like to buy your 1 Exalted Orb for my 100 Chaos Orb in Standard. -- Offer 95c?`
        break

      default:
        return
    }
    this.onLogLineAdded(logLine.replace(fromToPlaceholder, 'To'));
    this.onLogLineAdded(logLine.replace(fromToPlaceholder, 'From'));
  }
}
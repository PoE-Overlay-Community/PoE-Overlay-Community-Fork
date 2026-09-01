import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges
} from '@angular/core'
import { MatTooltipDefaultOptions, MAT_TOOLTIP_DEFAULT_OPTIONS } from '@angular/material/tooltip'
import { ColorUtils } from '@app/class'
import { AppTranslateService } from '@app/service'
import { CommandService } from '@modules/command/service/command.service'
import { SnackBarService } from '@shared/module/material/service'
import { StashService } from '@shared/module/poe/service'
import { PoEAccountService } from '@shared/module/poe/service/account/account.service'
import { StashGridService } from '@shared/module/poe/service/stash-grid/stash-grid.service'
import { StashGridMode } from '@shared/module/poe/type/stash-grid.type'
import {
    CurrencyAmount,
    TradeCompanionButtonOption,
    TradeCompanionUserSettings,
    TradeNotification,
    TradeNotificationType
} from '@shared/module/poe/type/trade-companion.type'
import moment from 'moment'
import { Subscription, timer } from 'rxjs'

const tooltipDefaultOptions: MatTooltipDefaultOptions = {
  showDelay: 1000,
  hideDelay: 500,
  touchendHideDelay: 1000,
}

@Component({
  selector: 'app-trade-notification',
  templateUrl: './trade-notification.component.html',
  styleUrls: ['./trade-notification.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: tooltipDefaultOptions }],
})
export class TradeNotificationComponent implements OnInit, OnDestroy, OnChanges {
  @Input()
  public settings: TradeCompanionUserSettings

  @Input()
  public notification: TradeNotification

  @Input()
  public isActiveTradeNotification: boolean

  @Output()
  public dismissNotification = new EventEmitter<TradeNotification>()

  @Output()
  public collapseClick = new EventEmitter<TradeNotification>()

  @Output()
  public playerNameClick = new EventEmitter<TradeNotification>()

  // Make the enum available in the html
  public readonly TradeNotificationType = TradeNotificationType

  public readonly ColorUtils = ColorUtils

  public get collapsed(): boolean {
    if (this.notification.userCollapsed === undefined) {
      return this.notification.defaultCollapsed
    }
    return this.notification.userCollapsed
  }

  public elapsedTime = '0s'

  private stashGridSubscription: Subscription

  private buttonClickAudioClip: HTMLAudioElement

  constructor(
    private readonly stashGridService: StashGridService,
    private readonly snackbar: SnackBarService,
    private readonly commandService: CommandService,
    private readonly ref: ChangeDetectorRef,
    private readonly translate: AppTranslateService,
    private readonly accountService: PoEAccountService,
    private readonly stashService: StashService,
  ) {}

  public ngOnInit(): void {
    setInterval(() => {
      const diff = moment.duration(moment().diff(this.notification.time))
      const minutes = Math.floor(diff.minutes())
      if (minutes > 0) {
        const hours = Math.floor(diff.hours())
        if (hours > 0) {
          this.elapsedTime = this.translate.get(
            'trade-companion.trade-notification.elapsed-minutes',
            { hours, minutes }
          )
        } else {
          this.elapsedTime = this.translate.get(
            'trade-companion.trade-notification.elapsed-minutes',
            { minutes }
          )
        }
      } else {
        const seconds = Math.floor(diff.seconds())
        this.elapsedTime = this.translate.get(
          'trade-companion.trade-notification.elapsed-seconds',
          { seconds }
        )
      }
      this.ref.detectChanges()
    }, 1000)
  }

  public ngOnDestroy(): void {
    if (this.buttonClickAudioClip) {
      if (!this.buttonClickAudioClip.ended) {
        const scopedEndedHandler = () => {
          this.buttonClickAudioClip.removeEventListener('ended', scopedEndedHandler)
          this.buttonClickAudioClip.remove()
        }
        this.buttonClickAudioClip.addEventListener('ended', scopedEndedHandler)
      } else {
        this.buttonClickAudioClip.remove()
      }
    }
    if (this.stashGridSubscription) {
      this.toggleItemHighlight()
    }
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['settings']) {
      const buttonClickAudio = this.settings.buttonClickAudio
      if (buttonClickAudio.enabled) {
        if (!this.buttonClickAudioClip) {
          this.buttonClickAudioClip = new Audio()
        }
        this.buttonClickAudioClip.src = buttonClickAudio.src
        this.buttonClickAudioClip.volume = buttonClickAudio.volume
      } else if (this.buttonClickAudioClip) {
        this.buttonClickAudioClip.remove()
        this.buttonClickAudioClip = null
      }
    }
  }

  public itemExchangeRatio(): number {
    return this.floorMD(
      this.notification.price.amount / (this.notification.item as CurrencyAmount).amount,
      3
    )
  }

  public dismissClick(): void {
    this.buttonClickAudioClip?.play()
    this.dismiss()
  }

  public toggleCollapsedClick(): void {
    this.buttonClickAudioClip?.play()
    if (this.notification.userCollapsed === undefined) {
      this.notification.userCollapsed = !this.notification.defaultCollapsed
    } else {
      this.notification.userCollapsed = !this.notification.userCollapsed
    }
    this.collapseClick.emit(this.notification)
  }

  public visitPlayerHideoutClick(): void {
    this.buttonClickAudioClip?.play()
    this.commandService.command(`/hideout ${this.notification.playerName}`, this.settings)
  }

  public leavePartyClick(): void {
    this.buttonClickAudioClip?.play()
    this.leaveParty()
  }

  public inviteToPartyClick(): void {
    this.buttonClickAudioClip?.play()
    this.commandService.command(`/invite ${this.notification.playerName}`, this.settings)
    if (
      this.settings.showStashGridOnInvite &&
      !this.stashGridSubscription &&
      this.notification.type === TradeNotificationType.Incoming
    ) {
      this.toggleItemHighlight()
    }
  }

  public highlightClick(): void {
    this.buttonClickAudioClip?.play()
    this.highlight()
  }

  public kickFromPartyClick(): void {
    this.buttonClickAudioClip?.play()
    this.kickFromParty()
  }

  public requestTradeClick(): void {
    this.buttonClickAudioClip?.play()
    this.commandService.command(`/tradewith ${this.notification.playerName}`, this.settings)
    if (
      this.settings.hideStashGridOnTrade &&
      this.stashGridSubscription &&
      this.notification.type === TradeNotificationType.Incoming
    ) {
      this.toggleItemHighlight()
    }
  }

  public whoisClick(): void {
    this.buttonClickAudioClip?.play()
    this.commandService.command(`/whois ${this.notification.playerName}`, this.settings)
  }

  public whisperPlayerClick(): void {
    this.buttonClickAudioClip?.play()
    this.commandService.command(`@${this.notification.playerName} `, this.settings, false, false)
  }

  public repeatTradeWhisperClick(): void {
    this.buttonClickAudioClip?.play()
    this.commandService.command(this.notification.text, this.settings)
  }

  public askStillInterestedClick(): void {
    this.buttonClickAudioClip?.play()
    this.commandService.command(
      `@${this.notification.playerName} ${this.replacePlaceholders(this.settings.askIfStillInterestedMessage)}`,
      this.settings
    )
  }

  public toggleItemHighlightClick(): void {
    this.buttonClickAudioClip?.play()
    this.toggleItemHighlight()
  }

  public tradeOptionClick(tradeOption: TradeCompanionButtonOption): void {
    this.buttonClickAudioClip?.play()
    this.commandService.command(
      `@${this.notification.playerName} ${this.replacePlaceholders(tradeOption.whisperMessage)}`,
      this.settings
    )
    if (tradeOption.kickAfterWhisper) {
      timer(550).subscribe(() => {
        switch (this.notification.type) {
          case TradeNotificationType.Incoming:
            this.kickFromParty()
            break
          case TradeNotificationType.Outgoing:
            this.leaveParty()
            break
        }
        if (tradeOption.dismissNotification) {
          this.dismiss()
        } else if (tradeOption.collapseNotification) {
          this.collapse()
        }
      })
    } else if (tradeOption.dismissNotification) {
      this.dismiss()
    } else if (tradeOption.collapseNotification) {
      this.collapse()
    }
  }

  // Floors the value to a meaningful amount of decimals
  private floorMD(n: number, d: number): number {
    const log10 = n ? Math.floor(Math.log10(n)) : 0
    const div = log10 < 0 ? Math.pow(10, 1 - log10) : Math.pow(10, d)
    return Math.floor(n * div) / div
  }

  private collapse(): void {
    this.notification.userCollapsed = true
    this.collapseClick.emit(this.notification)
  }

  private dismiss(): void {
    this.dismissNotification.emit(this.notification)
  }

  private leaveParty(): void {
    this.commandService.command(`/leave`, this.settings)
  }

  private kickFromParty(): void {
    this.commandService.command(`/kick ${this.notification.playerName}`, this.settings)
    this.dismiss()
  }

  private highlight(): void {
    if (this.notification.itemLocation != null) {
      this.stashService.highlight(`pos:${this.notification.itemLocation.bounds.x},${this.notification.itemLocation.bounds.y}`).subscribe()
    } else {
      let highlightText = this.notification.item
      if (typeof highlightText === 'object') {
        highlightText = highlightText.currency.nameType
      }

      // Is the item a map?  If so, parse the tier out and use it to constrain the highlight
      const mapRegex = /^(?<item>.*) \(T(?<tier>\d+)\)?/;
      if (mapRegex.test(highlightText)) {
        let match = mapRegex.exec(highlightText)
        this.stashService.highlight(match.groups.item, `tier:${match.groups.tier}`).subscribe()
      } else {
        this.stashService.highlight(highlightText).subscribe()
      }
    }
  }

  private toggleItemHighlight(): void {
    if (this.stashGridSubscription) {
      this.stashGridSubscription.unsubscribe()
      this.stashGridSubscription = null
      this.stashGridService.hideStashGrid()
    } else {
      this.stashGridService.getStashGridTypeByItemLocation(this.notification.itemLocation).subscribe((gridType) => {
        this.stashGridSubscription = this.stashGridService
          .showStashGrid({
            gridMode: StashGridMode.Normal,
            gridType,
            highlightLocation: {
              tabName: this.notification.itemLocation.tabName,
              bounds: [this.notification.itemLocation.bounds]
            },
            autoClose: false,
          })
          .subscribe(null, null, () => {
            this.stashGridSubscription.unsubscribe()
            this.stashGridSubscription = null
          })
      })
    }
  }

  private replacePlaceholders(command: string): string {
    let item: string
    if (this.notification.itemLocation) {
      item = this.notification.item as string
    } else {
      const currencyAmount = this.notification.item as CurrencyAmount
      item = `${currencyAmount.amount} ${currencyAmount.currency.nameType}`
    }
    return command.replace('@item', item).replace('@price', `${this.notification.price.amount} ${this.notification.price.currency.nameType}`)
  }
}

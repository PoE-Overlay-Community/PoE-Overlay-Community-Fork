import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    QueryList,
    SimpleChanges,
    ViewChild,
    ViewChildren
} from '@angular/core'
import { TradeNotificationsService } from '@shared/module/poe/service/trade-companion/trade-notifications.service'
import {
    TradeCompanionUserSettings,
    TradeNotification,
    TradeNotificationAutoCollapseType,
    TradeNotificationPanelShortcutRef,
    TradeNotificationType
} from '@shared/module/poe/type/trade-companion.type'
import type { Rectangle } from 'electron' //renderer
import { Subject, Subscription } from 'rxjs'
import { debounceTime, map } from 'rxjs/operators'
import { WindowService } from '@app/service'
import { ShortcutService } from '@app/service/input'
import { VisibleFlag } from '@app/type'
import { UserSettingsService } from '../../../../layout/service'
import { CommandService } from '../../../command/service/command.service'
import { TradeNotificationComponent } from '../trade-notification/trade-notification.component'

@Component({
  selector: 'app-trade-notifications-panel',
  templateUrl: './trade-notifications-panel.component.html',
  styleUrls: ['./trade-notifications-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradeNotificationPanelComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input()
  public settings: TradeCompanionUserSettings

  @Input()
  public gameBounds: Rectangle

  @Output()
  public openSettings = new EventEmitter<void>()

  @ViewChild('header')
  public headerRef: ElementRef<HTMLDivElement>

  @ViewChildren(TradeNotificationComponent)
  public notificationComponents: QueryList<TradeNotificationComponent>

  public locked = true

  public notifications: TradeNotification[] = []

  public get activeTradeNotificationIndex(): number {
    if (this.userActiveTradeNotificationIndex !== -1) {
      return this.userActiveTradeNotificationIndex
    }
    return this.defaultActiveTradeNotificationIndex
  }

  private userActiveTradeNotificationIndex = -1
  private defaultActiveTradeNotificationIndex = -1

  private logLineAddedSub: Subscription

  private boundsUpdate$ = new Subject<Rectangle>()
  private closeClick$ = new Subject()

  private notificationAudioClip: HTMLAudioElement

  private offsetX?: number

  private get activeNotification(): TradeNotification {
    if (this.userActiveTradeNotificationIndex !== -1) {
      return this.notifications[this.userActiveTradeNotificationIndex]
    }
    if (this.defaultActiveTradeNotificationIndex != -1) {
      return this.notifications[this.defaultActiveTradeNotificationIndex]
    }
    return null
  }

  private get activeNotificationComp(): TradeNotificationComponent {
    const activeNotification = this.activeNotification
    if (activeNotification) {
      return this.notificationComponents.find(x => x.notification === activeNotification)
    }
    return null
  }

  constructor(
    private readonly ref: ChangeDetectorRef,
    private readonly tradeNotificationsService: TradeNotificationsService,
    private readonly userSettingsService: UserSettingsService,
    private readonly windowService: WindowService,
    private readonly commandService: CommandService,
    private readonly shortcut: ShortcutService,
  ) {
  }

  public ngOnInit(): void {
    this.logLineAddedSub = this.tradeNotificationsService.notificationAddedOrChanged.subscribe(
      (notification: TradeNotification) => {
        if (this.notifications.indexOf(notification) === -1) {
          this.notifications.push(notification)
          notification.defaultCollapsed = this.getCollapsed(notification)
          this.updateActiveNotificationIndex()
          if (notification.type === TradeNotificationType.Incoming) {
            this.notificationAudioClip?.play()
          }
        }
        this.ref.detectChanges()
      }
    )
    this.boundsUpdate$
      .pipe(
        debounceTime(350),
        map((bounds) => {
          this.userSettingsService
            .update<TradeCompanionUserSettings>((settings) => {
              settings.tradeCompanionBounds = bounds
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
            .update<TradeCompanionUserSettings>((settings) => {
              settings.tradeCompanionEnabled = false
              return settings
            })
            .subscribe((settings) => {
              this.settings = settings
              this.ref.detectChanges()
            })
        })
      )
      .subscribe()
    this.enableShortcuts()
  }

  public ngAfterViewInit(): void {
    if (this.offsetX === undefined && this.headerRef) {
      this.ref.detectChanges()
    }
  }

  public ngOnDestroy(): void {
    this.shortcut.removeAllByRef(TradeNotificationPanelShortcutRef)
    this.logLineAddedSub.unsubscribe()
    this.notificationAudioClip?.remove()
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['settings']) {
      const incomingTradeMessageAudio = this.settings.incomingTradeMessageAudio
      if (incomingTradeMessageAudio.enabled) {
        if (!this.notificationAudioClip) {
          this.notificationAudioClip = new Audio()
        }
        this.notificationAudioClip.src = incomingTradeMessageAudio.src
        this.notificationAudioClip.volume = incomingTradeMessageAudio.volume
      } else if (this.notificationAudioClip) {
        this.notificationAudioClip.remove()
        this.notificationAudioClip = null
      }
      this.enableShortcuts()
    }
    if (this.offsetX === undefined && this.headerRef) {
      this.ref.detectChanges()
    }
  }

  public calcOffsetX(): number {
    if (!this.headerRef || !this.settings.reversedNotificationHorizontalAlignment) {
      return 0
    }
    if (this.offsetX === undefined) {
      this.offsetX = this.headerRef.nativeElement.offsetWidth
    }
    return this.offsetX
  }

  public calcOffsetY(): number {
    if (!this.headerRef || !this.settings.reversedNotificationDirection) {
      return 0
    }
    return this.headerRef.nativeElement.offsetHeight
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

  public goToHideout(): void {
    this.commandService.command('/hideout', this.settings)
  }

  public close(): void {
    this.closeClick$.next(null)
  }

  public getCollapsed(notification: TradeNotification): boolean {
    const notifications = this.notifications.filter(x => x.type === notification.type)
    switch (notification.type) {
      case TradeNotificationType.Incoming:
        return getCollapsedInternal(notifications, notification, this.settings.autoCollapseIncomingTradeNotifications)
      case TradeNotificationType.Outgoing:
        return getCollapsedInternal(notifications, notification, this.settings.autoCollapseOutgoingTradeNotifications)
    }

    function getCollapsedInternal(notifications: TradeNotification[], notification: TradeNotification, autoCollapseSetting: TradeNotificationAutoCollapseType): boolean {
      const index = notifications.indexOf(notification)
      switch (autoCollapseSetting) {
        case TradeNotificationAutoCollapseType.All:
          return true
        case TradeNotificationAutoCollapseType.Newest:
          return index > 0
        case TradeNotificationAutoCollapseType.Oldest:
          if (index > 0) {
            const prevNotification = notifications[index - 1]
            if (prevNotification) {
              prevNotification.defaultCollapsed = true
            }
          }
          break
      }
      return false
    }
  }

  public onDismissNotification(notification: TradeNotification): void {
    const index = this.notifications.indexOf(notification)
    if (this.userActiveTradeNotificationIndex === index) {
      this.userActiveTradeNotificationIndex = -1
    } else if (index < this.userActiveTradeNotificationIndex) {
      this.userActiveTradeNotificationIndex--
    }
    this.notifications = this.notifications.filter((tn) => tn !== notification)
    this.tradeNotificationsService.dismissNotification(notification)
    this.updateActiveNotificationIndex()
    this.ref.detectChanges()
  }

  public onPlayerNameClick(notification: TradeNotification): void {
    const index = this.notifications.indexOf(notification)
    if (this.userActiveTradeNotificationIndex == index) {
      this.userActiveTradeNotificationIndex = -1
      this.updateActiveNotificationIndex()
    } else {
      this.userActiveTradeNotificationIndex = index
    }
    this.ref.detectChanges()
  }

  public onCollapseClick(notification: TradeNotification): void {
    this.updateActiveNotificationIndex()
    this.ref.detectChanges()
  }

  private updateActiveNotificationIndex(): void {
    this.defaultActiveTradeNotificationIndex = this.notifications.findIndex(x => x.userCollapsed === false)
    if (this.defaultActiveTradeNotificationIndex == -1) {
      this.defaultActiveTradeNotificationIndex = this.notifications.findIndex(x => x.userCollapsed !== true && x.defaultCollapsed === false)
      if (this.defaultActiveTradeNotificationIndex == -1) {
        this.defaultActiveTradeNotificationIndex = Math.min(this.notifications.length - 1, this.settings.maxVisibileTradeNotifications - 1)
      }
    }
    this.defaultActiveTradeNotificationIndex = Math.min(this.settings.maxVisibileTradeNotifications - 1, this.defaultActiveTradeNotificationIndex)
  }

  private incrementActiveTradeNotificationIndex(amount: number): void {
    if (this.userActiveTradeNotificationIndex == -1) {
      this.userActiveTradeNotificationIndex = this.defaultActiveTradeNotificationIndex
    }
    this.userActiveTradeNotificationIndex += amount
    this.userActiveTradeNotificationIndex = Math.max(0, Math.min(this.settings.maxVisibileTradeNotifications - 1, this.userActiveTradeNotificationIndex))
    this.ref.detectChanges()
  }

  private enableShortcuts(): void {
    this.shortcut.disableAllByRef(TradeNotificationPanelShortcutRef)

    const keybindings = this.settings.tradeNotificationKeybindings

    // General
    this.tryEnableShortcut(keybindings.activateNextTradeNotification, () => this.incrementActiveTradeNotificationIndex(1))
    this.tryEnableShortcut(keybindings.activatePreviousTradeNotification, () => this.incrementActiveTradeNotificationIndex(-1))

    // General Trade Notifications
    this.tryEnableShortcut(keybindings.dismiss, () => this.activeNotificationComp?.dismissClick())
    this.tryEnableShortcut(keybindings.collapse, () => this.activeNotificationComp?.toggleCollapsedClick())
    this.tryEnableShortcut(keybindings.whisper, () => this.activeNotificationComp?.whisperPlayerClick())

    // Incoming Trade Notifications
    this.tryEnableShortcut(keybindings.inviteToParty, () => { if (this.activeNotification.type === TradeNotificationType.Incoming) this.activeNotificationComp?.inviteToPartyClick() })
    this.tryEnableShortcut(keybindings.offerTrade, () => { if (this.activeNotification.type === TradeNotificationType.Incoming) this.activeNotificationComp?.requestTradeClick() })
    this.tryEnableShortcut(keybindings.kickFromParty, () => { if (this.activeNotification.type === TradeNotificationType.Incoming) this.activeNotificationComp?.kickFromPartyClick() })
    this.tryEnableShortcut(keybindings.askStillInterested, () => { if (this.activeNotification.type === TradeNotificationType.Incoming) this.activeNotificationComp?.askStillInterestedClick() })
    this.settings.incomingTradeOptions.forEach(x => this.tryEnableShortcut(x.keybinding, () => {
      if (this.activeNotification.type === TradeNotificationType.Incoming) this.activeNotificationComp?.tradeOptionClick(x)
    }))

    // Outgoing Trade Notifications
    this.tryEnableShortcut(keybindings.joinHideout, () => { if (this.activeNotification.type === TradeNotificationType.Outgoing) this.activeNotificationComp?.visitPlayerHideoutClick() })
    this.tryEnableShortcut(keybindings.leaveParty, () => { if (this.activeNotification.type === TradeNotificationType.Outgoing) this.activeNotificationComp?.leavePartyClick() })
    this.tryEnableShortcut(keybindings.whois, () => { if (this.activeNotification.type === TradeNotificationType.Outgoing) this.activeNotificationComp?.whoisClick() })
    this.tryEnableShortcut(keybindings.repeatWhisper, () => { if (this.activeNotification.type === TradeNotificationType.Outgoing) this.activeNotificationComp?.repeatTradeWhisperClick() })
    this.settings.outgoingTradeOptions.forEach(x => this.tryEnableShortcut(x.keybinding, () => {
      if (this.activeNotification.type === TradeNotificationType.Outgoing) this.activeNotificationComp?.tradeOptionClick(x)
    }))
  }

  private tryEnableShortcut(keybind?: string, onShortcutPressed?: () => void): void {
    if (keybind) {
      this.shortcut
        .add(
          keybind,
          TradeNotificationPanelShortcutRef,
          false,
          VisibleFlag.Game,
          VisibleFlag.Overlay
        )
        .subscribe(onShortcutPressed)
    }
  }

  private intersects(a: Rectangle, b: Rectangle): boolean {
    return (
      a.x <= b.x + b.width && a.x + a.width >= b.x && a.y <= b.y + b.height && a.y + a.height >= b.y
    )
  }
}

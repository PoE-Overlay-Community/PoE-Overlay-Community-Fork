import {
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
  SimpleChanges,
  ViewChild,
} from '@angular/core'
import { TradeNotificationsService } from '@shared/module/poe/service/trade-companion/trade-notifications.service'
import {
  TradeCompanionUserSettings,
  TradeNotification,
  TradeNotificationType,
} from '@shared/module/poe/type/trade-companion.type'
import { Rectangle } from 'electron'
import { Subject, Subscription } from 'rxjs'
import { debounceTime, map } from 'rxjs/operators'
import { WindowService } from '../../../../core/service'
import { UserSettingsService } from '../../../../layout/service'

@Component({
  selector: 'app-trade-notifications-panel',
  templateUrl: './trade-notifications-panel.component.html',
  styleUrls: ['./trade-notifications-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradeNotificationPanelComponent implements OnInit, OnDestroy, OnChanges {
  @Input()
  public settings: TradeCompanionUserSettings

  @Input()
  public gameBounds: Rectangle

  @Output()
  public openSettings = new EventEmitter<void>()

  @ViewChild('header')
  public headerRef: ElementRef<HTMLDivElement>

  public locked = true

  public notifications: TradeNotification[] = []

  private logLineAddedSub: Subscription

  private boundsUpdate$ = new Subject<Rectangle>()
  private closeClick$ = new Subject()

  private notificationAudioClip: HTMLAudioElement

  constructor(
    private readonly ref: ChangeDetectorRef,
    private readonly tradeNotificationsService: TradeNotificationsService,
    private readonly userSettingsService: UserSettingsService,
    private readonly windowService: WindowService
  ) {
  }

  public ngOnInit(): void {
    this.logLineAddedSub = this.tradeNotificationsService.notificationAddedOrChanged.subscribe(
      (notification: TradeNotification) => {
        if (this.notifications.indexOf(notification) === -1) {
          this.notifications.push(notification)
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
  }

  public ngOnDestroy(): void {
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
    }
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

  public close(): void {
    this.closeClick$.next()
  }

  public onDismissNotification(notification: TradeNotification): void {
    this.notifications = this.notifications.filter((tn) => tn !== notification)
    this.tradeNotificationsService.dismissNotification(notification)
    this.ref.detectChanges()
  }

  private intersects(a: Rectangle, b: Rectangle): boolean {
    return (
      a.x <= b.x + b.width && a.x + a.width >= b.x && a.y <= b.y + b.height && a.y + a.height >= b.y
    )
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core'
import { LeaguesService } from '@shared/module/poe/service'
import { League } from '@shared/module/poe/type'
import { ItemSearchIndexed } from '@shared/module/poe/type/search.type'
import { BehaviorSubject, Observable } from 'rxjs'
import { map } from 'rxjs/operators'

export interface EvaluateOptions {
  online: boolean
  indexed: ItemSearchIndexed
  leagueId: string
  fetchCount: number
}

type LeagueMap = {
  [id: string]: League
}

@Component({
  selector: 'app-evaluate-options',
  templateUrl: './evaluate-options.component.html',
  styleUrls: ['./evaluate-options.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvaluateOptionsComponent implements OnInit {
  @Input()
  public options: EvaluateOptions

  @Output()
  public optionsChange = new EventEmitter<EvaluateOptions>()

  @Output()
  public resetTrigger = new EventEmitter<void>()

  @Output()
  public toggleOpen = new EventEmitter<boolean>()

  public leagues$: Observable<LeagueMap>
  public isOpen = false

  constructor(private readonly leagues: LeaguesService) {}

  public ngOnInit(): void {
    this.leagues$ = this.leagues.getLeagues().pipe(
      map((leagues) => {
        const result = {}
        leagues.forEach((league) => {
          result[league.id] = league.text
        })
        return result
      })
    )
  }

  public onToggleOnlineClick(): void {
    this.optionsChange.emit(this.options)
  }

  public onLeaguesWheel(event: WheelEvent, leagues: LeagueMap): void {
    const factor = event.deltaY > 0 ? -1 : 1

    this.changeLeague(factor, leagues)
  }

  public changeLeague(factor: number, leagues: LeagueMap): void {
    const keys = Object.getOwnPropertyNames(leagues)

    let index = keys.findIndex((id) => id === this.options.leagueId)
    index += factor

    if (index >= keys.length) {
      index = 0
    } else if (index < 0) {
      index = keys.length - 1
    }

    const key = keys[index]
    this.options.leagueId = key
    this.optionsChange.emit(this.options)
  }

  public onIndexedWheel(event: WheelEvent): void {
    const factor = event.deltaY > 0 ? -1 : 1

    this.changeIndex(factor)
  }

  public changeIndex(factor: number): void {
    const keys = Object.getOwnPropertyNames(ItemSearchIndexed)

    let index = keys.findIndex((x) => ItemSearchIndexed[x] === this.options.indexed)
    index += factor

    if (index >= keys.length) {
      index = 0
    } else if (index < 0) {
      index = keys.length - 1
    }

    const key = keys[index]
    this.options.indexed = ItemSearchIndexed[key]
    this.optionsChange.emit(this.options)
  }

  public onFetchCountWheel(event: WheelEvent): void {
    const factor = event.deltaY > 0 ? -1 : 1

    this.changeCount(factor)
  }

  public changeCount(factor: number): void {
    let fetchCount = this.options.fetchCount + factor * 10
    if (fetchCount > 100) {
      fetchCount = 10
    } else if (fetchCount < 10) {
      fetchCount = 100
    }

    if (fetchCount !== this.options.fetchCount) {
      this.options.fetchCount = fetchCount
      this.optionsChange.emit(this.options)
    }
  }

  public onResetClick(): void {
    this.resetTrigger.next()
  }

  public getIndexedText(): string {
    return this.options.indexed.replace(/\d/, '')
  }

  public openClose(): void {
    this.isOpen = !this.isOpen
    this.toggleOpen.emit(this.isOpen)
  }
}

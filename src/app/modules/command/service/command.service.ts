import { Injectable } from '@angular/core'
import { ClipboardService, KeyboardService, KeyCode } from '@app/service/input'
import { Subject } from 'rxjs'
import { delay, map, tap, throttleTime } from 'rxjs/operators'
import { GameLogService } from '../../../core/service/game-log.service'
import { UserSettings } from '../../../layout/type'
import { TradeRegexesProvider } from '../../../shared/module/poe/provider/trade-regexes.provider'
import { PoEAccountService } from '../../../shared/module/poe/service/account/account.service'

interface Command {
  text: string
  send: boolean
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

@Injectable({
  providedIn: 'root',
})
export class CommandService {
  private readonly command$ = new Subject<Command>()

  private lastIncomingWhisperer: string

  constructor(
    private readonly clipboard: ClipboardService,
    private readonly keyboard: KeyboardService,
    private readonly accountService: PoEAccountService,
    gameLogService: GameLogService,
    tradeRegexesProvirder: TradeRegexesProvider
  ) {
    const tradeRegexStrings = tradeRegexesProvirder.provide()
    const whisperRegex = new RegExp(tradeRegexStrings.all + tradeRegexStrings.whisper, 'i')

    gameLogService.logLineAdded.subscribe((logLine) => {
      if (whisperRegex.test(logLine)) {
        const from = whisperRegex.exec(logLine).groups.player
        if (from) {
          this.lastIncomingWhisperer = from
        }
      }
    })

    this.command$
      .pipe(
        throttleTime(350),
        map(async (command) => {
          const text = this.clipboard.readText()
          this.clipboard.writeText(command.text)
          await sleep(75)
          this.keyboard.setKeyboardDelay(5)
          this.keyboard.keyTap(KeyCode.VK_RETURN)
          this.keyboard.keyTap(KeyCode.VK_KEY_V, ['control'])
          if (command.send) {
            await sleep(75)
            this.keyboard.keyTap(KeyCode.VK_RETURN)
          }
          return text
        }),
        delay(200),
        tap(async (text) => {
          this.clipboard.writeText(await text)
        })
      )
      .subscribe()
  }

  public command(command: string, userSettings: UserSettings, preProcessCommand = false, send = true): void {
    if (preProcessCommand) {
      command = this.preProcessCharacterNameCommand(command, userSettings)
      command = this.preProcessLastWhispererCommand(command)
    }
    this.command$.next({ text: command, send })
  }

  private preProcessCharacterNameCommand(command: string, userSettings?: UserSettings): string {
    if (userSettings) {
      let activeCharacterName = userSettings.activeCharacterName
      if (!activeCharacterName) {
        activeCharacterName = this.accountService.getActiveCharacter()?.name
      }
      if (activeCharacterName) {
        command = command.replace("@me", activeCharacterName)
      }
    }
    return command
  }

  private preProcessLastWhispererCommand(command: string): string {
    if (this.lastIncomingWhisperer) {
      command = command.replace("@last", this.lastIncomingWhisperer)
    }
    return command
  }
}

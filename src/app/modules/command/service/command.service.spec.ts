import { TestBed, fakeAsync, tick } from '@angular/core/testing'
import { CommandService } from './command.service'
import { ClipboardService, KeyboardService, KeyCode } from '@app/service/input'
import { GameLogService } from '@app/service/game-log.service'
import { PoEAccountService } from '@shared/module/poe/service/account/account.service'
import { TradeRegexesProvider } from '@shared/module/poe/provider/trade-regexes.provider'
import { EventEmitter } from '@angular/core'
import { UserSettings } from '@layout/type'

describe('CommandService', () => {
  let service: CommandService
  let clipboardSpy: jasmine.SpyObj<ClipboardService>
  let keyboardSpy: jasmine.SpyObj<KeyboardService>
  let accountServiceSpy: jasmine.SpyObj<PoEAccountService>
  let logLineEmitter: EventEmitter<string>

  const mockTradeRegexes = {
    all: '^\\d{4}/\\d{2}/\\d{2} \\d{2}:\\d{2}:\\d{2} \\d+ [a-f0-9]+ \\[[A-Z]+( Client)? \\d+\\] ',
    whisper:
      '@From( <(?<guild>.*)>)? (?<player>[^:]+): (?<message>.*)',
    tradeItemPrice: { English: 'test' },
    tradeBulk: { English: 'test' },
    joinedArea: { English: 'test' },
    leftArea: { English: 'test' },
  }

  beforeEach(() => {
    clipboardSpy = jasmine.createSpyObj('ClipboardService', ['readText', 'writeText'])
    keyboardSpy = jasmine.createSpyObj('KeyboardService', ['setKeyboardDelay', 'keyTap'])
    accountServiceSpy = jasmine.createSpyObj('PoEAccountService', ['getActiveCharacter'])
    logLineEmitter = new EventEmitter<string>()

    clipboardSpy.readText.and.returnValue('original clipboard')

    TestBed.configureTestingModule({
      providers: [
        CommandService,
        { provide: ClipboardService, useValue: clipboardSpy },
        { provide: KeyboardService, useValue: keyboardSpy },
        { provide: PoEAccountService, useValue: accountServiceSpy },
        {
          provide: GameLogService,
          useValue: { logLineAdded: logLineEmitter },
        },
        {
          provide: TradeRegexesProvider,
          useValue: { provide: () => mockTradeRegexes },
        },
      ],
    })

    service = TestBed.inject(CommandService)
  })

  describe('command', () => {
    it('should execute command with keyboard shortcuts', fakeAsync(() => {
      service.command('/hideout', {} as UserSettings, false, true)
      tick(400)

      expect(clipboardSpy.readText).toHaveBeenCalled()
      expect(clipboardSpy.writeText).toHaveBeenCalledWith('/hideout')
      expect(keyboardSpy.setKeyboardDelay).toHaveBeenCalledWith(5)
      expect(keyboardSpy.keyTap).toHaveBeenCalledWith(KeyCode.VK_RETURN)
      expect(keyboardSpy.keyTap).toHaveBeenCalledWith(KeyCode.VK_KEY_V, ['control'])
    }))

    it('should restore original clipboard after command', fakeAsync(() => {
      service.command('/hideout', {} as UserSettings, false, true)
      tick(600)

      expect(clipboardSpy.writeText).toHaveBeenCalledWith('original clipboard')
    }))

    it('should not send command when send=false', fakeAsync(() => {
      service.command('/hideout', {} as UserSettings, false, false)
      tick(400)

      const enterKeyCalls = (keyboardSpy.keyTap as jasmine.Spy).calls
        .allArgs()
        .filter((args) => args[0] === KeyCode.VK_RETURN)

      expect(enterKeyCalls.length).toBe(1)
    }))

    it('should throttle rapid commands', fakeAsync(() => {
      service.command('/command1', {} as UserSettings, false, true)
      service.command('/command2', {} as UserSettings, false, true)
      service.command('/command3', {} as UserSettings, false, true)
      tick(400)

      expect(clipboardSpy.writeText).toHaveBeenCalledWith('/command1')
      expect(clipboardSpy.writeText).not.toHaveBeenCalledWith('/command2')
    }))
  })

  describe('preProcessCharacterNameCommand', () => {
    it('should replace @me with character name from settings', fakeAsync(() => {
      const settings: Partial<UserSettings> = {
        activeCharacterName: 'TestCharacter',
      }

      service.command('/invite @me', settings as UserSettings, true, true)
      tick(400)

      expect(clipboardSpy.writeText).toHaveBeenCalledWith('/invite TestCharacter')
    }))

    it('should replace @me with active character from account service', fakeAsync(() => {
      const settings: Partial<UserSettings> = {
        activeCharacterName: null,
      }
      accountServiceSpy.getActiveCharacter.and.returnValue({ name: 'ActiveChar' } as any)

      service.command('/invite @me', settings as UserSettings, true, true)
      tick(400)

      expect(clipboardSpy.writeText).toHaveBeenCalledWith('/invite ActiveChar')
    }))

    it('should not replace @me when no character available', fakeAsync(() => {
      const settings: Partial<UserSettings> = {
        activeCharacterName: null,
      }
      accountServiceSpy.getActiveCharacter.and.returnValue(null)

      service.command('/invite @me', settings as UserSettings, true, true)
      tick(400)

      expect(clipboardSpy.writeText).toHaveBeenCalledWith('/invite @me')
    }))
  })

  describe('preProcessLastWhispererCommand', () => {
    it('should replace @last with last whisperer', fakeAsync(() => {
      const logLine =
        '2024/01/01 12:00:00 123 abc123 [INFO Client 1] @From TestWhisperer: Hello'
      logLineEmitter.emit(logLine)
      tick()

      service.command('/whisper @last Hi', {} as UserSettings, true, true)
      tick(400)

      expect(clipboardSpy.writeText).toHaveBeenCalledWith('/whisper TestWhisperer Hi')
    }))

    it('should not replace @last when no whisperer', fakeAsync(() => {
      service.command('/whisper @last Hi', {} as UserSettings, true, true)
      tick(400)

      expect(clipboardSpy.writeText).toHaveBeenCalledWith('/whisper @last Hi')
    }))
  })
})

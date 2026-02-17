import { TestBed } from '@angular/core/testing'
import { KeyboardService, KeyCode } from './keyboard.service'
import { ElectronProvider } from '@app/provider'
import { MockElectronProvider, MockElectronAPI } from '@app/testing'

describe('KeyboardService', () => {
  let service: KeyboardService
  let mockProvider: MockElectronProvider
  let mockAPI: MockElectronAPI

  beforeEach(() => {
    mockProvider = new MockElectronProvider()
    mockAPI = mockProvider.getMockAPI()

    TestBed.configureTestingModule({
      providers: [KeyboardService, { provide: ElectronProvider, useValue: mockProvider }],
    })

    service = TestBed.inject(KeyboardService)
  })

  afterEach(() => {
    mockAPI._reset()
  })

  describe('setKeyboardDelay', () => {
    it('should call setKeyboardDelay on electronAPI', () => {
      service.setKeyboardDelay(50)

      expect(mockAPI.setKeyboardDelay).toHaveBeenCalledWith(50)
    })

    it('should handle zero delay', () => {
      service.setKeyboardDelay(0)

      expect(mockAPI.setKeyboardDelay).toHaveBeenCalledWith(0)
    })
  })

  describe('keyTap', () => {
    it('should call keyTap on electronAPI without modifiers', () => {
      service.keyTap(KeyCode.VK_KEY_C)

      expect(mockAPI.keyTap).toHaveBeenCalledWith(KeyCode.VK_KEY_C, [])
    })

    it('should call keyTap on electronAPI with modifiers', () => {
      service.keyTap(KeyCode.VK_KEY_C, ['ctrl'])

      expect(mockAPI.keyTap).toHaveBeenCalledWith(KeyCode.VK_KEY_C, ['ctrl'])
    })

    it('should handle multiple modifiers', () => {
      service.keyTap(KeyCode.VK_KEY_V, ['ctrl', 'shift'])

      expect(mockAPI.keyTap).toHaveBeenCalledWith(KeyCode.VK_KEY_V, ['ctrl', 'shift'])
    })

    it('should handle various key codes', () => {
      service.keyTap(KeyCode.VK_RETURN)

      expect(mockAPI.keyTap).toHaveBeenCalledWith(KeyCode.VK_RETURN, [])
    })
  })

  describe('keyToggle', () => {
    it('should call keyToggle with down direction', () => {
      service.keyToggle(KeyCode.VK_LMENU, true)

      expect(mockAPI.keyToggle).toHaveBeenCalledWith(KeyCode.VK_LMENU, 'down', [])
    })

    it('should call keyToggle with up direction', () => {
      service.keyToggle(KeyCode.VK_LMENU, false)

      expect(mockAPI.keyToggle).toHaveBeenCalledWith(KeyCode.VK_LMENU, 'up', [])
    })

    it('should call keyToggle with modifiers', () => {
      service.keyToggle(KeyCode.VK_KEY_C, true, ['shift'])

      expect(mockAPI.keyToggle).toHaveBeenCalledWith(KeyCode.VK_KEY_C, 'down', ['shift'])
    })
  })

  describe('KeyCode enum', () => {
    it('should have correct key codes', () => {
      expect(KeyCode.VK_KEY_C).toBe(0x43)
      expect(KeyCode.VK_KEY_F).toBe(0x46)
      expect(KeyCode.VK_KEY_V).toBe(0x56)
      expect(KeyCode.VK_RETURN).toBe(0x0d)
      expect(KeyCode.VK_LMENU).toBe(0xa4)
      expect(KeyCode.VK_RMENU).toBe(0xa5)
      expect(KeyCode.VK_LEFT).toBe(0x25)
      expect(KeyCode.VK_RIGHT).toBe(0x27)
    })
  })
})

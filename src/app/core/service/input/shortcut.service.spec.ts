import { TestBed, fakeAsync, tick } from '@angular/core/testing'
import { NgZone } from '@angular/core'
import { ShortcutService } from './shortcut.service'
import { ElectronProvider } from '@app/provider'
import { MockElectronProvider, MockElectronAPI } from '@app/testing'
import { VisibleFlag } from '@app/type/app.type'

describe('ShortcutService', () => {
  let service: ShortcutService
  let mockProvider: MockElectronProvider
  let mockAPI: MockElectronAPI

  beforeEach(() => {
    mockProvider = new MockElectronProvider()
    mockAPI = mockProvider.getMockAPI()

    TestBed.configureTestingModule({
      providers: [ShortcutService, { provide: ElectronProvider, useValue: mockProvider }],
    })

    service = TestBed.inject(ShortcutService)
  })

  afterEach(() => {
    service.reset()
    mockAPI._reset()
  })

  describe('add', () => {
    it('should register a shortcut and return observable', () => {
      const ref = {}
      const observable = service.add('Ctrl+D', ref, false, VisibleFlag.Game)

      expect(observable).toBeDefined()
    })

    it('should register global shortcut when visibility matches', () => {
      const ref = {}
      service.add('Ctrl+D', ref, false, VisibleFlag.Game)
      service.check(VisibleFlag.Game)

      expect(mockAPI.registerGlobalShortcut).toHaveBeenCalledWith('Ctrl+D')
    })

    it('should not register shortcut when visibility does not match', () => {
      const ref = {}
      service.add('Ctrl+D', ref, false, VisibleFlag.Overlay)
      service.check(VisibleFlag.Game)

      expect(mockAPI.registerGlobalShortcut).not.toHaveBeenCalled()
    })

    it('should emit when shortcut is triggered', fakeAsync(() => {
      const ref = {}
      let triggered = false

      service.add('Ctrl+D', ref, false, VisibleFlag.Game).subscribe(() => {
        triggered = true
      })
      service.check(VisibleFlag.Game)

      mockAPI._triggerEvent('shortcut-Ctrl+D')
      tick()

      expect(triggered).toBeTrue()
    }))
  })

  describe('remove', () => {
    it('should unregister shortcut and complete observable', fakeAsync(() => {
      const ref = {}
      let completed = false

      service.add('Ctrl+D', ref, false, VisibleFlag.Game).subscribe({
        complete: () => {
          completed = true
        },
      })
      service.check(VisibleFlag.Game)

      service.remove('Ctrl+D', ref)
      tick()

      expect(mockAPI.unregisterGlobalShortcut).toHaveBeenCalledWith('Ctrl+D')
      expect(completed).toBeTrue()
    }))

    it('should not error when removing non-existent shortcut', () => {
      expect(() => {
        service.remove('Ctrl+X', {})
      }).not.toThrow()
    })
  })

  describe('removeAllByRef', () => {
    it('should remove all shortcuts with given ref', fakeAsync(() => {
      const ref = {}
      let completed1 = false
      let completed2 = false

      service.add('Ctrl+D', ref, false, VisibleFlag.Game).subscribe({
        complete: () => {
          completed1 = true
        },
      })
      service.add('Ctrl+F', ref, false, VisibleFlag.Game).subscribe({
        complete: () => {
          completed2 = true
        },
      })
      service.check(VisibleFlag.Game)

      service.removeAllByRef(ref)
      tick()

      expect(completed1).toBeTrue()
      expect(completed2).toBeTrue()
    }))
  })

  describe('enable/disable', () => {
    it('should disable shortcut', () => {
      const ref = {}
      service.add('Ctrl+D', ref, false, VisibleFlag.Game)
      service.check(VisibleFlag.Game)

      service.disable('Ctrl+D', ref)

      expect(mockAPI.unregisterGlobalShortcut).toHaveBeenCalledWith('Ctrl+D')
    })

    it('should enable shortcut', () => {
      const ref = {}
      service.add('Ctrl+D', ref, false, VisibleFlag.Game)
      service.check(VisibleFlag.Game)

      service.disable('Ctrl+D', ref)
      ;(mockAPI.registerGlobalShortcut as jasmine.Spy).calls.reset()

      service.enable('Ctrl+D', ref)
      service.check(VisibleFlag.Game)

      expect(mockAPI.registerGlobalShortcut).toHaveBeenCalledWith('Ctrl+D')
    })

    it('should disable all shortcuts by ref', () => {
      const ref = {}
      service.add('Ctrl+D', ref, false, VisibleFlag.Game)
      service.add('Ctrl+F', ref, false, VisibleFlag.Game)
      service.check(VisibleFlag.Game)

      service.disableAllByRef(ref)

      expect(mockAPI.unregisterGlobalShortcut).toHaveBeenCalled()
    })

    it('should enable all shortcuts by ref', () => {
      const ref = {}
      service.add('Ctrl+D', ref, false, VisibleFlag.Game)
      service.check(VisibleFlag.Game)

      service.disableAllByRef(ref)
      ;(mockAPI.registerGlobalShortcut as jasmine.Spy).calls.reset()

      service.enableAllByRef(ref)
      service.check(VisibleFlag.Game)

      expect(mockAPI.registerGlobalShortcut).toHaveBeenCalledWith('Ctrl+D')
    })
  })

  describe('check', () => {
    it('should register shortcuts matching visibility flag', () => {
      const ref = {}
      service.add('Ctrl+D', ref, false, VisibleFlag.Game)

      service.check(VisibleFlag.Game)

      expect(mockAPI.registerGlobalShortcut).toHaveBeenCalledWith('Ctrl+D')
    })

    it('should unregister shortcuts not matching visibility flag', () => {
      const ref = {}
      service.add('Ctrl+D', ref, false, VisibleFlag.Game)
      service.check(VisibleFlag.Game)

      service.check(VisibleFlag.Overlay)

      expect(mockAPI.unregisterGlobalShortcut).toHaveBeenCalledWith('Ctrl+D')
    })

    it('should handle combined visibility flags', () => {
      const ref = {}
      service.add('Ctrl+D', ref, false, VisibleFlag.Game, VisibleFlag.Overlay)

      service.check(VisibleFlag.Game | VisibleFlag.Overlay)

      expect(mockAPI.registerGlobalShortcut).toHaveBeenCalledWith('Ctrl+D')
    })
  })

  describe('reset', () => {
    it('should remove all shortcuts and complete observables', fakeAsync(() => {
      const ref = {}
      let completed = false

      service.add('Ctrl+D', ref, false, VisibleFlag.Game).subscribe({
        complete: () => {
          completed = true
        },
      })
      service.check(VisibleFlag.Game)

      service.reset()
      tick()

      expect(mockAPI.unregisterGlobalShortcut).toHaveBeenCalled()
      expect(completed).toBeTrue()
    }))
  })
})

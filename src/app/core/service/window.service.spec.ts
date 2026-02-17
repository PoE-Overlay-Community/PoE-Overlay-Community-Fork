import { TestBed, fakeAsync, tick } from '@angular/core/testing'
import { NgZone } from '@angular/core'
import { WindowService } from './window.service'
import { ElectronProvider } from '@app/provider'
import { MockElectronProvider, MockElectronAPI } from '@app/testing'

describe('WindowService', () => {
  let service: WindowService
  let mockProvider: MockElectronProvider
  let mockAPI: MockElectronAPI

  beforeEach(() => {
    mockProvider = new MockElectronProvider()
    mockAPI = mockProvider.getMockAPI()

    TestBed.configureTestingModule({
      providers: [WindowService, { provide: ElectronProvider, useValue: mockProvider }],
    })

    service = TestBed.inject(WindowService)
  })

  afterEach(() => {
    mockAPI._reset()
  })

  describe('gameBounds', () => {
    it('should initialize with current window bounds', () => {
      const bounds = service.gameBounds.value

      expect(bounds).toEqual({ x: 0, y: 0, width: 1920, height: 1080 })
    })

    it('should emit new bounds on game-bounds-change event', fakeAsync(() => {
      const newBounds = { x: 100, y: 100, width: 1280, height: 720 }
      let receivedBounds: any

      service.registerEvents()
      service.gameBounds.subscribe((b) => (receivedBounds = b))

      mockAPI._triggerEvent('game-bounds-change', newBounds)
      tick()

      expect(receivedBounds).toEqual(newBounds)
    }))
  })

  describe('show/hide/focus', () => {
    it('should call windowShow', () => {
      service.show()

      expect(mockAPI.windowShow).toHaveBeenCalled()
    })

    it('should call windowHide', () => {
      service.hide()

      expect(mockAPI.windowHide).toHaveBeenCalled()
    })

    it('should call windowFocus', () => {
      service.focus()

      expect(mockAPI.windowFocus).toHaveBeenCalled()
    })

    it('should call windowMinimize', () => {
      service.minimize()

      expect(mockAPI.windowMinimize).toHaveBeenCalled()
    })

    it('should call windowRestore', () => {
      service.restore()

      expect(mockAPI.windowRestore).toHaveBeenCalled()
    })

    it('should call windowClose', () => {
      service.close()

      expect(mockAPI.windowClose).toHaveBeenCalled()
    })
  })

  describe('zoom', () => {
    it('should get zoom factor', () => {
      const spy = mockAPI.getZoomFactor as jasmine.Spy
      spy.and.returnValue(1.5)

      const zoom = service.getZoom()

      expect(mockAPI.getZoomFactor).toHaveBeenCalled()
      expect(zoom).toBe(1.5)
    })

    it('should set zoom factor', () => {
      service.setZoom(1.25)

      expect(mockAPI.setZoomFactor).toHaveBeenCalledWith(1.25)
    })
  })

  describe('setSize', () => {
    it('should set window size', () => {
      service.setSize(800, 600)

      expect(mockAPI.windowSetSize).toHaveBeenCalledWith(800, 600)
    })
  })

  describe('getMainWindowBounds', () => {
    it('should return main window bounds', () => {
      const bounds = service.getMainWindowBounds()

      expect(mockAPI.getMainWindowBounds).toHaveBeenCalled()
      expect(bounds).toEqual([
        { x: 0, y: 0, width: 1920, height: 1080 },
        { x: 0, y: 0, width: 1920, height: 1080 },
      ])
    })
  })

  describe('getWindowBounds', () => {
    it('should return current window bounds', () => {
      const bounds = service.getWindowBounds()

      expect(mockAPI.getCurrentWindowBounds).toHaveBeenCalled()
      expect(bounds).toEqual({ x: 0, y: 0, width: 1920, height: 1080 })
    })
  })

  describe('disableInput/enableInput', () => {
    it('should disable input with focusable=true', () => {
      service.disableInput(true)

      expect(mockAPI.windowBlur).toHaveBeenCalled()
      expect(mockAPI.setIgnoreMouseEvents).toHaveBeenCalledWith(true, { forward: true })
      expect(mockAPI.windowSetFocusable).toHaveBeenCalledWith(false)
    })

    it('should disable input with focusable=false', () => {
      service.disableInput(false)

      expect(mockAPI.windowBlur).not.toHaveBeenCalled()
      expect(mockAPI.setIgnoreMouseEvents).toHaveBeenCalledWith(true, { forward: true })
      expect(mockAPI.windowSetFocusable).not.toHaveBeenCalled()
    })

    it('should enable input with focusable=true', () => {
      service.enableInput(true)

      expect(mockAPI.windowSetFocusable).toHaveBeenCalledWith(true)
      expect(mockAPI.windowSetSkipTaskbar).toHaveBeenCalledWith(true)
      expect(mockAPI.setIgnoreMouseEvents).toHaveBeenCalledWith(false)
      expect(mockAPI.windowFocus).toHaveBeenCalled()
    })

    it('should enable input with focusable=false', () => {
      service.enableInput(false)

      expect(mockAPI.windowSetFocusable).not.toHaveBeenCalled()
      expect(mockAPI.setIgnoreMouseEvents).toHaveBeenCalledWith(false)
    })
  })

  describe('convertToLocal', () => {
    it('should convert point to local coordinates', () => {
      const spy = mockAPI.getCurrentWindowBounds as jasmine.Spy
      spy.and.returnValue({
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
      })
      service.gameBounds.next({ x: 0, y: 0, width: 1920, height: 1080 })

      const result = service.convertToLocal({ x: 100, y: 200 })

      expect(result).toEqual({ x: 100, y: 200 })
    })

    it('should clamp point to window bounds', () => {
      const spy = mockAPI.getCurrentWindowBounds as jasmine.Spy
      spy.and.returnValue({
        x: 0,
        y: 0,
        width: 800,
        height: 600,
      })
      service.gameBounds.next({ x: 0, y: 0, width: 800, height: 600 })

      const result = service.convertToLocal({ x: 1000, y: 800 })

      expect(result.x).toBe(800)
      expect(result.y).toBe(600)
    })

    it('should handle offset windows', () => {
      const spy = mockAPI.getCurrentWindowBounds as jasmine.Spy
      spy.and.returnValue({
        x: 100,
        y: 100,
        width: 800,
        height: 600,
      })
      service.gameBounds.next({ x: 0, y: 0, width: 800, height: 600 })

      const result = service.convertToLocal({ x: 150, y: 150 })

      expect(result.x).toBe(50)
      expect(result.y).toBe(50)
    })
  })

  describe('convertToLocalScaled', () => {
    it('should scale point by zoom factor', () => {
      const spy = mockAPI.getZoomFactor as jasmine.Spy
      spy.and.returnValue(2)

      const result = service.convertToLocalScaled({ x: 100, y: 200 })

      expect(result).toEqual({ x: 50, y: 100 })
    })

    it('should handle 1x zoom', () => {
      const spy = mockAPI.getZoomFactor as jasmine.Spy
      spy.and.returnValue(1)

      const result = service.convertToLocalScaled({ x: 100, y: 200 })

      expect(result).toEqual({ x: 100, y: 200 })
    })
  })

  describe('on', () => {
    it('should register event listener and return observable', fakeAsync(() => {
      const ngZone = TestBed.inject(NgZone)
      spyOn(ngZone, 'run').and.callThrough()
      let triggered = false

      service.on('test-event').subscribe(() => {
        triggered = true
      })

      mockAPI._triggerEvent('test-event')
      tick()

      expect(triggered).toBeTrue()
      expect(ngZone.run).toHaveBeenCalled()
    }))
  })
})

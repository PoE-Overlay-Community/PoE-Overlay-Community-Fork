import { TestBed, fakeAsync, tick } from '@angular/core/testing'
import { NgZone } from '@angular/core'
import { ElectronService } from './electron.service'
import { ElectronProvider } from '@app/provider'
import { MockElectronProvider, MockElectronAPI } from '@app/testing'
import { LoggerService } from './logger.service'

describe('ElectronService', () => {
  let service: ElectronService
  let mockProvider: MockElectronProvider
  let mockAPI: MockElectronAPI

  beforeEach(() => {
    mockProvider = new MockElectronProvider()
    mockAPI = mockProvider.getMockAPI()

    TestBed.configureTestingModule({
      providers: [
        ElectronService,
        { provide: ElectronProvider, useValue: mockProvider },
        {
          provide: LoggerService,
          useValue: {
            log: jasmine.createSpy('log'),
            debug: jasmine.createSpy('debug'),
            info: jasmine.createSpy('info'),
            warn: jasmine.createSpy('warn'),
            error: jasmine.createSpy('error'),
          },
        },
      ],
    })

    service = TestBed.inject(ElectronService)
  })

  afterEach(() => {
    mockAPI._reset()
  })

  describe('on', () => {
    it('should register listener with electronAPI', () => {
      const listener = jasmine.createSpy('listener')

      service.on('test', 'test-channel', listener)

      expect(mockAPI.on).toHaveBeenCalledWith('test-channel', jasmine.any(Function))
    })
  })

  describe('removeListener', () => {
    it('should remove the registered listener', () => {
      const listener = jasmine.createSpy('listener')

      service.on('test', 'test-channel', listener)
      service.removeListener('test', 'test-channel', listener)

      expect(mockAPI.removeListener).toHaveBeenCalledWith('test-channel', jasmine.any(Function))
    })
  })

  describe('send', () => {
    it('should forward message to electronAPI', () => {
      service.send('test', 'test-channel', 'arg1', 'arg2')

      expect(mockAPI.send).toHaveBeenCalledWith('test-channel', 'arg1', 'arg2')
    })
  })

  describe('restore', () => {
    it('should call openRoute on electronAPI', () => {
      service.restore('/settings')

      expect(mockAPI.openRoute).toHaveBeenCalledWith('/settings')
    })
  })

  describe('open', () => {
    it('should call openRoute and resolve when reply is close', fakeAsync(() => {
      let resolved = false

      service.open('/settings').subscribe(() => {
        resolved = true
      })

      mockAPI._triggerEvent('open-route-reply', 'close')
      tick()

      expect(mockAPI.openRoute).toHaveBeenCalledWith('/settings')
      expect(resolved).toBeTrue()
    }))

    it('should call openRoute and resolve when reply is hide', fakeAsync(() => {
      let resolved = false

      service.open('/settings').subscribe(() => {
        resolved = true
      })

      mockAPI._triggerEvent('open-route-reply', 'hide')
      tick()

      expect(resolved).toBeTrue()
    }))

    it('should reject when reply is error', fakeAsync(() => {
      let error: any

      service.open('/settings').subscribe({
        error: (e) => {
          error = e
        },
      })

      mockAPI._triggerEvent('open-route-reply', 'error')
      tick()

      expect(error).toBe('error')
    }))
  })
})

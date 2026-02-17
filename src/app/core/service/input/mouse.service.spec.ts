import { TestBed } from '@angular/core/testing'
import { MouseService } from './mouse.service'
import { ElectronProvider } from '@app/provider'
import { MockElectronProvider, MockElectronAPI } from '@app/testing'

describe('MouseService', () => {
  let service: MouseService
  let mockProvider: MockElectronProvider
  let mockAPI: MockElectronAPI

  beforeEach(() => {
    mockProvider = new MockElectronProvider()
    mockAPI = mockProvider.getMockAPI()

    TestBed.configureTestingModule({
      providers: [MouseService, { provide: ElectronProvider, useValue: mockProvider }],
    })

    service = TestBed.inject(MouseService)
  })

  afterEach(() => {
    mockAPI._reset()
  })

  describe('click', () => {
    it('should call mouseClick with left button', () => {
      service.click('left')

      expect(mockAPI.mouseClick).toHaveBeenCalledWith('left', undefined)
    })

    it('should call mouseClick with right button', () => {
      service.click('right')

      expect(mockAPI.mouseClick).toHaveBeenCalledWith('right', undefined)
    })

    it('should call mouseClick with middle button', () => {
      service.click('middle')

      expect(mockAPI.mouseClick).toHaveBeenCalledWith('middle', undefined)
    })

    it('should call mouseClick with position', () => {
      const position = { x: 100, y: 200 }

      service.click('left', position)

      expect(mockAPI.mouseClick).toHaveBeenCalledWith('left', position)
    })
  })

  describe('move', () => {
    it('should call mouseMove with position', () => {
      const position = { x: 150, y: 250 }

      service.move(position)

      expect(mockAPI.mouseMove).toHaveBeenCalledWith(position)
    })

    it('should handle origin position', () => {
      const position = { x: 0, y: 0 }

      service.move(position)

      expect(mockAPI.mouseMove).toHaveBeenCalledWith(position)
    })

    it('should handle large coordinates', () => {
      const position = { x: 3840, y: 2160 }

      service.move(position)

      expect(mockAPI.mouseMove).toHaveBeenCalledWith(position)
    })
  })

  describe('position', () => {
    it('should return current mouse position', () => {
      const expectedPosition = { x: 500, y: 300 }
      ;(mockAPI.mousePosition as jasmine.Spy).and.returnValue(expectedPosition)

      const result = service.position()

      expect(mockAPI.mousePosition).toHaveBeenCalled()
      expect(result).toEqual(expectedPosition)
    })

    it('should return origin when at origin', () => {
      const spy = mockAPI.mousePosition as jasmine.Spy
      spy.and.returnValue({ x: 0, y: 0 })

      const result = service.position()

      expect(result).toEqual({ x: 0, y: 0 })
    })
  })
})

import { TestBed, fakeAsync, tick } from '@angular/core/testing'
import { StashGridService } from './stash-grid.service'
import { ElectronProvider } from '@app/provider'
import { MockElectronProvider, MockElectronAPI } from '@app/testing'
import { GameService, WindowService } from '@app/service'
import { StashService } from '../stash/stash.service'
import { StashGridOptions, StashGridType, StashGridMode, TradeItemLocation } from '@shared/module/poe/type/stash-grid.type'
import { of } from 'rxjs'

describe('StashGridService', () => {
  let service: StashGridService
  let mockProvider: MockElectronProvider
  let mockAPI: MockElectronAPI
  let windowServiceSpy: jasmine.SpyObj<WindowService>
  let gameServiceSpy: jasmine.SpyObj<GameService>
  let stashServiceSpy: jasmine.SpyObj<StashService>

  beforeEach(() => {
    mockProvider = new MockElectronProvider()
    mockAPI = mockProvider.getMockAPI()

    windowServiceSpy = jasmine.createSpyObj('WindowService', ['focus'])
    gameServiceSpy = jasmine.createSpyObj('GameService', ['focus'])
    stashServiceSpy = jasmine.createSpyObj('StashService', ['getStashGridType'])
    stashServiceSpy.getStashGridType.and.returnValue(of(StashGridType.Normal))

    TestBed.configureTestingModule({
      providers: [
        StashGridService,
        { provide: ElectronProvider, useValue: mockProvider },
        { provide: WindowService, useValue: windowServiceSpy },
        { provide: GameService, useValue: gameServiceSpy },
        { provide: StashService, useValue: stashServiceSpy },
      ],
    })

    service = TestBed.inject(StashGridService)
  })

  afterEach(() => {
    mockAPI._reset()
  })

  describe('stashGridOptions$', () => {
    it('should initialize with undefined', () => {
      expect(service.stashGridOptions$.value).toBeUndefined()
    })
  })

  describe('registerEvents', () => {
    it('should register stash-grid-options event listener', () => {
      service.registerEvents()

      expect(mockAPI.on).toHaveBeenCalledWith('stash-grid-options', jasmine.any(Function))
    })

    it('should not register duplicate event listeners', () => {
      service.registerEvents()
      service.registerEvents()

      expect((mockAPI.on as jasmine.Spy).calls.count()).toBe(1)
    })
  })

  describe('unregisterEvents', () => {
    it('should remove event listener after registering', () => {
      service.registerEvents()
      service.unregisterEvents()

      expect(mockAPI.removeListener).toHaveBeenCalledWith('stash-grid-options', jasmine.any(Function))
    })
  })

  describe('showStashGrid', () => {
    it('should enqueue and emit stash grid options', fakeAsync(() => {
      const options: StashGridOptions = {
        gridType: StashGridType.Normal,
        gridMode: StashGridMode.Normal,
        autoClose: false,
      }

      service.showStashGrid(options)
      tick()

      expect(service.stashGridOptions$.value).toEqual(options)
    }))

    it('should resolve when grid is hidden', fakeAsync(() => {
      const options: StashGridOptions = {
        gridType: StashGridType.Normal,
        gridMode: StashGridMode.Normal,
        autoClose: false,
      }
      let resolved = false

      service.showStashGrid(options).subscribe((result) => {
        resolved = true
        expect(result).toBeTrue()
      })
      tick()

      service.hideStashGrid()
      tick()

      expect(resolved).toBeTrue()
    }))

    it('should queue multiple stash grid options', fakeAsync(() => {
      const options1: StashGridOptions = {
        gridType: StashGridType.Normal,
        gridMode: StashGridMode.Normal,
        autoClose: false,
      }
      const options2: StashGridOptions = {
        gridType: StashGridType.Quad,
        gridMode: StashGridMode.Normal,
        autoClose: false,
      }

      service.showStashGrid(options1, options2)
      tick()

      expect(service.stashGridOptions$.value).toEqual(options1)

      service.nextStashGridInSequence()
      tick()

      expect(service.stashGridOptions$.value).toEqual(options2)
    }))
  })

  describe('hideStashGrid', () => {
    it('should clear queue and emit null', fakeAsync(() => {
      const options: StashGridOptions = {
        gridType: StashGridType.Normal,
        gridMode: StashGridMode.Normal,
        autoClose: false,
      }

      service.showStashGrid(options)
      tick()

      service.hideStashGrid()
      tick()

      expect(service.stashGridOptions$.value).toBeNull()
    }))
  })

  describe('nextStashGridInSequence', () => {
    it('should advance to next stash grid option', fakeAsync(() => {
      const options1: StashGridOptions = {
        gridType: StashGridType.Normal,
        gridMode: StashGridMode.Normal,
        autoClose: false,
      }
      const options2: StashGridOptions = {
        gridType: StashGridType.Quad,
        gridMode: StashGridMode.Normal,
        autoClose: false,
      }

      service.showStashGrid(options1, options2)
      tick()

      service.nextStashGridInSequence()
      tick()

      expect(service.stashGridOptions$.value).toEqual(options2)
    }))

    it('should emit null when queue is exhausted', fakeAsync(() => {
      const options: StashGridOptions = {
        gridType: StashGridType.Normal,
        gridMode: StashGridMode.Normal,
        autoClose: false,
      }

      service.showStashGrid(options)
      tick()

      service.nextStashGridInSequence()
      tick()

      expect(service.stashGridOptions$.value).toBeNull()
    }))
  })

  describe('cancelStashGridSequence', () => {
    it('should clear queue and emit null', fakeAsync(() => {
      const options1: StashGridOptions = {
        gridType: StashGridType.Normal,
        gridMode: StashGridMode.Normal,
        autoClose: false,
      }
      const options2: StashGridOptions = {
        gridType: StashGridType.Quad,
        gridMode: StashGridMode.Normal,
        autoClose: false,
      }

      service.showStashGrid(options1, options2)
      tick()

      service.cancelStashGridSequence()
      tick()

      expect(service.stashGridOptions$.value).toBeNull()
    }))

    it('should resolve showStashGrid with false', fakeAsync(() => {
      const options: StashGridOptions = {
        gridType: StashGridType.Normal,
        gridMode: StashGridMode.Normal,
        autoClose: false,
      }
      let result: boolean | undefined

      service.showStashGrid(options).subscribe((r) => {
        result = r
      })
      tick()

      service.cancelStashGridSequence()
      tick()

      expect(result).toBeFalse()
    }))
  })

  describe('getStashGridTypeByItemLocation', () => {
    it('should return Normal grid type for small items', fakeAsync(() => {
      stashServiceSpy.getStashGridType.and.returnValue(of(StashGridType.Normal))
      let result: StashGridType | undefined

      service
        .getStashGridTypeByItemLocation({
          tabName: 'Test Tab',
          bounds: { x: 1, y: 1, width: 1, height: 1 },
        })
        .subscribe((r) => {
          result = r
        })
      tick()

      expect(result).toBe(StashGridType.Normal)
    }))

    it('should return Quad grid type for items in quad tab positions', fakeAsync(() => {
      let result: StashGridType | undefined

      service
        .getStashGridTypeByItemLocation({
          tabName: 'Test Tab',
          bounds: { x: 20, y: 20, width: 1, height: 1 },
        })
        .subscribe((r) => {
          result = r
        })
      tick()

      expect(result).toBe(StashGridType.Quad)
    }))
  })

  describe('completeStashGridEdit', () => {
    it('should advance to next grid option', fakeAsync(() => {
      const options1: StashGridOptions = {
        gridType: StashGridType.Normal,
        gridMode: StashGridMode.Edit,
        autoClose: false,
      }
      const options2: StashGridOptions = {
        gridType: StashGridType.Quad,
        gridMode: StashGridMode.Edit,
        autoClose: false,
      }

      service.showStashGrid(options1, options2)
      tick()

      const bounds = { x: 16, y: 134, width: 624, height: 624 }
      service.completeStashGridEdit(bounds)
      tick()

      expect(service.stashGridOptions$.value).toEqual(options2)
    }))
  })
})

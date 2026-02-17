import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing'
import { StashGridComponent } from './stash-grid.component'
import { ShortcutService, MouseService } from '@app/service/input'
import { StashGridService } from '@shared/module/poe/service/stash-grid/stash-grid.service'
import { StashGridMode, StashGridType, StashGridUserSettings, StashGridColors } from '@shared/module/poe/type/stash-grid.type'
import { Colors } from '@app/class'
import { BehaviorSubject, of } from 'rxjs'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'

describe('StashGridComponent', () => {
  let component: StashGridComponent
  let fixture: ComponentFixture<StashGridComponent>
  let stashGridServiceSpy: jasmine.SpyObj<StashGridService>
  let shortcutServiceSpy: jasmine.SpyObj<ShortcutService>
  let mouseServiceSpy: jasmine.SpyObj<MouseService>
  let stashGridOptions$: BehaviorSubject<any>

  const mockSettings: Partial<StashGridUserSettings> = {
    stashGridBounds: [
      { x: 16, y: 134, width: 624, height: 624 },
      { x: 16, y: 134, width: 624, height: 624 },
    ],
    stashGridColors: {
      gridBackground: Colors.black,
      gridLine: { r: 51, g: 51, b: 51, a: 1 },
      highlightBackground: Colors.green,
      highlightLine: Colors.green,
      highlightText: Colors.white,
      gridOutline: { r: 51, g: 51, b: 51, a: 1 },
    },
  }

  beforeEach(async () => {
    stashGridOptions$ = new BehaviorSubject<any>(undefined)

    stashGridServiceSpy = jasmine.createSpyObj('StashGridService', [
      'nextStashGridInSequence',
      'cancelStashGridSequence',
      'completeStashGridEdit',
    ], {
      stashGridOptions$: stashGridOptions$
    })

    shortcutServiceSpy = jasmine.createSpyObj('ShortcutService', [
      'add',
      'remove',
      'removeAllByRef',
      'enableAllByRef',
      'disableAllByRef',
    ])
    shortcutServiceSpy.add.and.returnValue(of(undefined))

    mouseServiceSpy = jasmine.createSpyObj('MouseService', ['position', 'move', 'click'])
    mouseServiceSpy.position.and.returnValue({ x: 0, y: 0 })

    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      declarations: [StashGridComponent],
      providers: [
        { provide: StashGridService, useValue: stashGridServiceSpy },
        { provide: ShortcutService, useValue: shortcutServiceSpy },
        { provide: MouseService, useValue: mouseServiceSpy },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()

    fixture = TestBed.createComponent(StashGridComponent)
    component = fixture.componentInstance
    component.globalSettings = mockSettings as StashGridUserSettings
  })

  afterEach(() => {
    component.ngOnDestroy()
  })

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy()
    })

    it('should initialize with undefined stash grid options', () => {
      fixture.detectChanges()

      expect(component.stashGridOptions$.value).toBeUndefined()
      expect(component.visible).toBeFalsy()
    })
  })

  describe('stash grid options subscription', () => {
    it('should show grid when options are emitted', fakeAsync(() => {
      fixture.detectChanges()
      component.ngOnInit()

      const options = {
        gridType: StashGridType.Normal,
        gridMode: StashGridMode.Normal,
        autoClose: false,
      }
      stashGridOptions$.next(options)
      tick()

      expect(component.visible).toBeTrue()
    }))

    it('should hide grid when null options are emitted', fakeAsync(() => {
      fixture.detectChanges()
      component.ngOnInit()

      stashGridOptions$.next({
        gridType: StashGridType.Normal,
        gridMode: StashGridMode.Normal,
        autoClose: false,
      })
      tick()

      stashGridOptions$.next(null)
      tick()

      expect(component.visible).toBeFalse()
    }))

    it('should create cell array based on grid type', fakeAsync(() => {
      fixture.detectChanges()
      component.ngOnInit()

      stashGridOptions$.next({
        gridType: StashGridType.Normal,
        gridMode: StashGridMode.Normal,
        autoClose: false,
      })
      tick()

      expect(component.cellArray).toBeDefined()
      expect(component.cellArray.length).toBe(12) // Normal stash has 12x12 cells
    }))

    it('should create quad-sized cell array for quad tabs', fakeAsync(() => {
      fixture.detectChanges()
      component.ngOnInit()

      stashGridOptions$.next({
        gridType: StashGridType.Quad,
        gridMode: StashGridMode.Normal,
        autoClose: false,
      })
      tick()

      expect(component.cellArray.length).toBe(24) // Quad stash has 24x24 cells
    }))
  })

  describe('cancelChanges', () => {
    it('should call stashGridService.cancelStashGridSequence', fakeAsync(() => {
      fixture.detectChanges()
      component.ngOnInit()

      stashGridOptions$.next({
        gridType: StashGridType.Normal,
        gridMode: StashGridMode.Normal,
        autoClose: false,
      })
      tick()

      component.cancelChanges()

      expect(stashGridServiceSpy.cancelStashGridSequence).toHaveBeenCalled()
    }))
  })

  describe('saveChanges', () => {
    it('should call stashGridService.completeStashGridEdit with bounds', fakeAsync(() => {
      fixture.detectChanges()
      component.ngOnInit()

      stashGridOptions$.next({
        gridType: StashGridType.Normal,
        mode: StashGridMode.Edit,
        autoClose: false,
      })
      tick()

      component.saveChanges()

      expect(stashGridServiceSpy.completeStashGridEdit).toHaveBeenCalledWith(component.gridBounds)
    }))
  })

  describe('toggleStashGrid', () => {
    it('should cycle grid type', fakeAsync(() => {
      fixture.detectChanges()
      component.ngOnInit()

      stashGridOptions$.next({
        gridType: StashGridType.Normal,
        gridMode: StashGridMode.Normal,
        autoClose: false,
      })
      tick()

      const initialType = component.stashGridOptions$.value.gridType
      component.toggleStashGrid()

      expect(component.stashGridOptions$.value.gridType).not.toBe(initialType)
    }))
  })

  describe('shortcuts', () => {
    it('should register escape shortcut when visible', fakeAsync(() => {
      fixture.detectChanges()
      component.ngOnInit()

      stashGridOptions$.next({
        gridType: StashGridType.Normal,
        gridMode: StashGridMode.Normal,
        autoClose: false,
      })
      tick()

      expect(shortcutServiceSpy.add).toHaveBeenCalledWith(
        'escape',
        jasmine.any(String),
        jasmine.any(Boolean),
        jasmine.any(Number),
        jasmine.any(Number)
      )
    }))

    it('should unregister shortcuts on destroy when escape shortcut is registered', fakeAsync(() => {
      fixture.detectChanges()
      component.ngOnInit()

      // Trigger a stash grid option to register the escape shortcut
      stashGridOptions$.next({
        gridMode: StashGridMode.Normal,
        gridType: StashGridType.Normal,
        bounds: [],
        editBounds: [],
        highlightBounds: [],
      } as any)
      tick()

      component.ngOnDestroy()

      expect(shortcutServiceSpy.removeAllByRef).toHaveBeenCalled()
    }))
  })

  describe('cell highlighting', () => {
    it('should highlight cells within bounds', fakeAsync(() => {
      fixture.detectChanges()
      component.ngOnInit()

      stashGridOptions$.next({
        gridType: StashGridType.Normal,
        gridMode: StashGridMode.Normal,
        autoClose: false,
        highlightLocation: {
          tabName: 'Test Tab',
          bounds: [{ x: 1, y: 1, width: 2, height: 2 }],
        },
      })
      tick()

      expect(component.intersectsHighlightBounds(0, 0)).toBeTrue()
      expect(component.intersectsHighlightBounds(1, 0)).toBeTrue()
      expect(component.intersectsHighlightBounds(3, 3)).toBeFalse()
    }))
  })

  describe('getGridBackgroundColor', () => {
    it('should return highlight color when highlighted', fakeAsync(() => {
      fixture.detectChanges()
      component.ngOnInit()

      stashGridOptions$.next({
        gridType: StashGridType.Normal,
        gridMode: StashGridMode.Normal,
        autoClose: false,
      })
      tick()

      const normalColor = component.getGridBackgroundColor(false)
      const highlightColor = component.getGridBackgroundColor(true)

      expect(normalColor).toBeDefined()
      expect(highlightColor).toBeDefined()
      expect(normalColor).not.toBe(highlightColor)
    }))
  })
})

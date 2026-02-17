import { TestBed, fakeAsync, tick } from '@angular/core/testing'
import { VendorRecipeService } from './vendor-recipe.service'
import { ElectronService } from '@app/service'
import { VendorRecipeProcessResult, VendorRecipeUserSettings } from '@shared/module/poe/type'

describe('VendorRecipeService', () => {
  let service: VendorRecipeService
  let electronServiceSpy: jasmine.SpyObj<ElectronService>
  let onCallbacks: Map<string, Array<(event: any, ...args: any[]) => void>>

  beforeEach(() => {
    onCallbacks = new Map()

    electronServiceSpy = jasmine.createSpyObj('ElectronService', [
      'on',
      'onMain',
      'removeListener',
      'removeMainListener',
      'send',
    ])

    electronServiceSpy.on.and.callFake((channel: string, callback: (event: any, ...args: any[]) => void) => {
      if (!onCallbacks.has(channel)) {
        onCallbacks.set(channel, [])
      }
      onCallbacks.get(channel)!.push(callback)
    })

    electronServiceSpy.onMain.and.callFake((channel: string, callback: (event: any, ...args: any[]) => void) => {
      if (!onCallbacks.has(channel)) {
        onCallbacks.set(channel, [])
      }
      onCallbacks.get(channel)!.push(callback)
    })

    TestBed.configureTestingModule({
      providers: [VendorRecipeService, { provide: ElectronService, useValue: electronServiceSpy }],
    })

    service = TestBed.inject(VendorRecipeService)
  })

  function triggerEvent(channel: string, ...args: any[]): void {
    const callbacks = onCallbacks.get(channel) || []
    callbacks.forEach((cb) => cb({}, ...args))
  }

  describe('vendorRecipes$', () => {
    it('should initialize with undefined', () => {
      expect(service.vendorRecipes$.value).toBeUndefined()
    })
  })

  describe('register', () => {
    it('should not register events when vendor recipe panel is disabled', () => {
      const settings: Partial<VendorRecipeUserSettings> = {
        vendorRecipePanelSettings: { enabled: false } as any,
      }

      service.register(settings as any)

      expect(electronServiceSpy.on).not.toHaveBeenCalled()
      expect(electronServiceSpy.onMain).not.toHaveBeenCalled()
    })

    it('should register event listeners when enabled', () => {
      const settings: Partial<VendorRecipeUserSettings> = {
        vendorRecipePanelSettings: { enabled: true } as any,
      }

      service.register(settings as any)

      expect(electronServiceSpy.on).toHaveBeenCalledWith('vendor-recipes', jasmine.any(Function))
      expect(electronServiceSpy.onMain).toHaveBeenCalled()
    })

    it('should not register duplicate event listeners', () => {
      const settings: Partial<VendorRecipeUserSettings> = {
        vendorRecipePanelSettings: { enabled: true } as any,
      }

      service.register(settings as any)
      service.register(settings as any)

      expect((electronServiceSpy.on as jasmine.Spy).calls.count()).toBe(1)
    })

    it('should emit vendor recipes when event is triggered', fakeAsync(() => {
      const settings: Partial<VendorRecipeUserSettings> = {
        vendorRecipePanelSettings: { enabled: true } as any,
      }
      const mockRecipes: VendorRecipeProcessResult[] = [
        {
          identifier: 0,
          recipes: [],
          itemGroups: [],
        },
      ]

      service.register(settings as any)
      let result: VendorRecipeProcessResult[] | undefined
      service.vendorRecipes$.subscribe((r) => (result = r))

      triggerEvent('vendor-recipes', mockRecipes)
      tick()

      expect(result).toEqual(mockRecipes)
    }))
  })

  describe('unregister', () => {
    it('should remove event listeners', () => {
      const settings: Partial<VendorRecipeUserSettings> = {
        vendorRecipePanelSettings: { enabled: true } as any,
      }

      service.register(settings as any)
      service.unregister()

      expect(electronServiceSpy.removeListener).toHaveBeenCalledWith(
        'vendor-recipes',
        jasmine.any(Function)
      )
      expect(electronServiceSpy.removeMainListener).toHaveBeenCalled()
    })

    it('should do nothing when not registered', () => {
      service.unregister()

      expect(electronServiceSpy.removeListener).not.toHaveBeenCalled()
    })
  })

  describe('updateVendorRecipes', () => {
    it('should send get-vendor-recipes event with forceUpdate=false', () => {
      service.updateVendorRecipes(false)

      expect(electronServiceSpy.send).toHaveBeenCalledWith('get-vendor-recipes', false)
    })

    it('should send get-vendor-recipes event with forceUpdate=true', () => {
      service.updateVendorRecipes(true)

      expect(electronServiceSpy.send).toHaveBeenCalledWith('get-vendor-recipes', true)
    })
  })
})

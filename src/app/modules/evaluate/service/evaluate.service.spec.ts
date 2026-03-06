import { TestBed, fakeAsync, tick } from '@angular/core/testing'
import { EvaluateService } from './evaluate.service'
import { EvaluateDialogService } from './evaluate-dialog.service'
import { SnackBarService } from '@shared/module/material/service'
import {
  ItemClipboardService,
  ItemClipboardResultCode,
  ItemProcessorService,
  StashService,
} from '@shared/module/poe/service'
import { EvaluateUserSettings } from '../component/evaluate-settings/evaluate-settings.component'
import { of, throwError } from 'rxjs'

describe('EvaluateService', () => {
  let service: EvaluateService
  let itemClipboardSpy: jasmine.SpyObj<ItemClipboardService>
  let processorSpy: jasmine.SpyObj<ItemProcessorService>
  let stashSpy: jasmine.SpyObj<StashService>
  let snackbarSpy: jasmine.SpyObj<SnackBarService>
  let evaluateDialogSpy: jasmine.SpyObj<EvaluateDialogService>

  const mockSettings: EvaluateUserSettings = {
    evaluateCopyAdvancedItemText: false,
    evaluateQueryNormalizeQuality: true,
    evaluateQueryPostProcessClusterJewels: true,
    evaluateModifierMinRange: 0,
    evaluateModifierMaxRange: 100,
    evaluatePropertyMinRange: 0,
    evaluatePropertyMaxRange: 100,
  } as EvaluateUserSettings

  beforeEach(() => {
    itemClipboardSpy = jasmine.createSpyObj('ItemClipboardService', ['copy'])
    processorSpy = jasmine.createSpyObj('ItemProcessorService', ['process'])
    stashSpy = jasmine.createSpyObj('StashService', ['copyPrice'])
    snackbarSpy = jasmine.createSpyObj('SnackBarService', ['info', 'warning', 'error'])
    evaluateDialogSpy = jasmine.createSpyObj('EvaluateDialogService', ['open'])

    snackbarSpy.info.and.returnValue(of(undefined))
    snackbarSpy.warning.and.returnValue(of(undefined))
    snackbarSpy.error.and.returnValue(of(undefined))

    TestBed.configureTestingModule({
      providers: [
        EvaluateService,
        { provide: ItemClipboardService, useValue: itemClipboardSpy },
        { provide: ItemProcessorService, useValue: processorSpy },
        { provide: StashService, useValue: stashSpy },
        { provide: SnackBarService, useValue: snackbarSpy },
        { provide: EvaluateDialogService, useValue: evaluateDialogSpy },
      ],
    })

    service = TestBed.inject(EvaluateService)
  })

  describe('evaluate', () => {
    it('should open evaluate dialog on successful clipboard copy', fakeAsync(() => {
      const mockItem = { name: 'Test Item' }
      const mockPoint = { x: 100, y: 100 }
      itemClipboardSpy.copy.and.returnValue(
        of({
          code: ItemClipboardResultCode.Success,
          item: mockItem,
          point: mockPoint,
        })
      )
      evaluateDialogSpy.open.and.returnValue(of(null))

      service.evaluate(mockSettings).subscribe()
      tick()

      expect(itemClipboardSpy.copy).toHaveBeenCalledWith(false)
      expect(processorSpy.process).toHaveBeenCalledWith(mockItem, {
        normalizeQuality: true,
        processClusterJewels: true,
      })
      expect(evaluateDialogSpy.open).toHaveBeenCalledWith(
        mockPoint,
        mockItem,
        mockSettings,
        undefined,
        undefined
      )
    }))

    it('should copy price to stash when dialog returns result', fakeAsync(() => {
      const mockItem = { name: 'Test Item' }
      const mockPoint = { x: 100, y: 100 }
      const mockResult = { amount: 10, currency: { id: 'chaos' } }
      itemClipboardSpy.copy.and.returnValue(
        of({
          code: ItemClipboardResultCode.Success,
          item: mockItem,
          point: mockPoint,
        })
      )
      evaluateDialogSpy.open.and.returnValue(of(mockResult as any))

      service.evaluate(mockSettings).subscribe()
      tick()

      expect(stashSpy.copyPrice).toHaveBeenCalledWith(jasmine.objectContaining({ amount: 10 }))
      expect(snackbarSpy.info).toHaveBeenCalledWith('evaluate.tag.clipboard')
    }))

    it('should show warning when clipboard is empty', fakeAsync(() => {
      itemClipboardSpy.copy.and.returnValue(
        of({
          code: ItemClipboardResultCode.Empty,
          item: null,
          point: null,
        })
      )

      service.evaluate(mockSettings).subscribe()
      tick()

      expect(snackbarSpy.warning).toHaveBeenCalledWith('clipboard.empty')
      expect(evaluateDialogSpy.open).not.toHaveBeenCalled()
    }))

    it('should show warning on parser error', fakeAsync(() => {
      itemClipboardSpy.copy.and.returnValue(
        of({
          code: ItemClipboardResultCode.ParserError,
          item: null,
          point: null,
        })
      )

      service.evaluate(mockSettings).subscribe()
      tick()

      expect(snackbarSpy.warning).toHaveBeenCalledWith('clipboard.parser-error')
    }))

    it('should show error on exception', fakeAsync(() => {
      itemClipboardSpy.copy.and.returnValue(throwError(() => new Error('Test error')))

      service.evaluate(mockSettings).subscribe()
      tick()

      expect(snackbarSpy.error).toHaveBeenCalledWith('clipboard.error')
    }))

    it('should pass language parameters to dialog', fakeAsync(() => {
      const mockItem = { name: 'Test Item' }
      const mockPoint = { x: 100, y: 100 }
      itemClipboardSpy.copy.and.returnValue(
        of({
          code: ItemClipboardResultCode.Success,
          item: mockItem,
          point: mockPoint,
        })
      )
      evaluateDialogSpy.open.and.returnValue(of(null))

      service.evaluate(mockSettings, 1 as any, 2 as any).subscribe()
      tick()

      expect(evaluateDialogSpy.open).toHaveBeenCalledWith(mockPoint, mockItem, mockSettings, 1, 2)
    }))
  })
})

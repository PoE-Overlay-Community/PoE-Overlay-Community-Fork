import { TestBed, fakeAsync, tick } from '@angular/core/testing'
import { MiscPoedbService } from './misc-poedb.service'
import { BrowserService } from '@app/service'
import { SnackBarService } from '@shared/module/material/service'
import { ItemClipboardService, ItemClipboardResultCode } from '@shared/module/poe/service'
import { ItemExternalService } from '@shared/module/poe/service/item/item-external.service'
import { of, throwError } from 'rxjs'

describe('MiscPoedbService', () => {
  let service: MiscPoedbService
  let itemClipboardSpy: jasmine.SpyObj<ItemClipboardService>
  let itemExternalSpy: jasmine.SpyObj<ItemExternalService>
  let browserSpy: jasmine.SpyObj<BrowserService>
  let snackbarSpy: jasmine.SpyObj<SnackBarService>

  beforeEach(() => {
    itemClipboardSpy = jasmine.createSpyObj('ItemClipboardService', ['copy'])
    itemExternalSpy = jasmine.createSpyObj('ItemExternalService', ['getDbUrl'])
    browserSpy = jasmine.createSpyObj('BrowserService', ['open'])
    snackbarSpy = jasmine.createSpyObj('SnackBarService', ['warning', 'error'])

    snackbarSpy.warning.and.returnValue(of(undefined))
    snackbarSpy.error.and.returnValue(of(undefined))

    TestBed.configureTestingModule({
      providers: [
        MiscPoedbService,
        { provide: ItemClipboardService, useValue: itemClipboardSpy },
        { provide: ItemExternalService, useValue: itemExternalSpy },
        { provide: BrowserService, useValue: browserSpy },
        { provide: SnackBarService, useValue: snackbarSpy },
      ],
    })

    service = TestBed.inject(MiscPoedbService)
  })

  describe('open', () => {
    it('should open poedb URL on successful clipboard copy', fakeAsync(() => {
      const mockItem = { name: 'Test Item' }
      itemClipboardSpy.copy.and.returnValue(
        of({
          code: ItemClipboardResultCode.Success,
          item: mockItem,
        })
      )
      itemExternalSpy.getDbUrl.and.returnValue('https://poedb.tw/us/item')

      service.open(false).subscribe()
      tick()

      expect(itemExternalSpy.getDbUrl).toHaveBeenCalledWith(mockItem)
      expect(browserSpy.open).toHaveBeenCalledWith('https://poedb.tw/us/item', false)
    }))

    it('should open in external browser when external=true', fakeAsync(() => {
      const mockItem = { name: 'Test Item' }
      itemClipboardSpy.copy.and.returnValue(
        of({
          code: ItemClipboardResultCode.Success,
          item: mockItem,
        })
      )
      itemExternalSpy.getDbUrl.and.returnValue('https://poedb.tw/us/item')

      service.open(true).subscribe()
      tick()

      expect(browserSpy.open).toHaveBeenCalledWith('https://poedb.tw/us/item', true)
    }))

    it('should show warning when clipboard is empty', fakeAsync(() => {
      itemClipboardSpy.copy.and.returnValue(
        of({
          code: ItemClipboardResultCode.Empty,
          item: null,
        })
      )

      service.open(false).subscribe()
      tick()

      expect(snackbarSpy.warning).toHaveBeenCalledWith('clipboard.empty')
      expect(browserSpy.open).not.toHaveBeenCalled()
    }))

    it('should show warning on parser error', fakeAsync(() => {
      itemClipboardSpy.copy.and.returnValue(
        of({
          code: ItemClipboardResultCode.ParserError,
          item: null,
        })
      )

      service.open(false).subscribe()
      tick()

      expect(snackbarSpy.warning).toHaveBeenCalledWith('clipboard.parser-error')
    }))

    it('should show error on exception', fakeAsync(() => {
      itemClipboardSpy.copy.and.returnValue(throwError(() => new Error('Test error')))

      service.open(false).subscribe()
      tick()

      expect(snackbarSpy.error).toHaveBeenCalledWith('clipboard.parser-error')
    }))
  })
})

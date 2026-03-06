import { TestBed } from '@angular/core/testing'
import { ClipboardService } from './clipboard.service'
import { ElectronProvider } from '@app/provider'
import { MockElectronProvider, MockElectronAPI } from '@app/testing'

describe('ClipboardService', () => {
  let service: ClipboardService
  let mockProvider: MockElectronProvider
  let mockAPI: MockElectronAPI

  beforeEach(() => {
    mockProvider = new MockElectronProvider()
    mockAPI = mockProvider.getMockAPI()

    TestBed.configureTestingModule({
      providers: [ClipboardService, { provide: ElectronProvider, useValue: mockProvider }],
    })

    service = TestBed.inject(ClipboardService)
  })

  afterEach(() => {
    mockAPI._reset()
  })

  describe('readText', () => {
    it('should call clipboardReadText on electronAPI', () => {
      const spy = mockAPI.clipboardReadText as jasmine.Spy
      spy.and.returnValue('clipboard content')

      const result = service.readText()

      expect(mockAPI.clipboardReadText).toHaveBeenCalled()
      expect(result).toBe('clipboard content')
    })

    it('should return empty string when clipboard is empty', () => {
      const spy = mockAPI.clipboardReadText as jasmine.Spy
      spy.and.returnValue('')

      const result = service.readText()

      expect(result).toBe('')
    })
  })

  describe('writeText', () => {
    it('should call clipboardWriteText on electronAPI', () => {
      service.writeText('text to copy')

      expect(mockAPI.clipboardWriteText).toHaveBeenCalledWith('text to copy')
    })

    it('should handle empty string', () => {
      service.writeText('')

      expect(mockAPI.clipboardWriteText).toHaveBeenCalledWith('')
    })

    it('should handle multiline text', () => {
      const multilineText = 'line1\nline2\nline3'

      service.writeText(multilineText)

      expect(mockAPI.clipboardWriteText).toHaveBeenCalledWith(multilineText)
    })
  })
})

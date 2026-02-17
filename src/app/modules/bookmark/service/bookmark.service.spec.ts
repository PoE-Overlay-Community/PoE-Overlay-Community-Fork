import { TestBed, fakeAsync, tick } from '@angular/core/testing'
import { BookmarkService } from './bookmark.service'
import { BrowserService } from '@app/service'
import { BookmarkUserBookmark } from '../component/bookmark-settings/bookmark-settings.component'

describe('BookmarkService', () => {
  let service: BookmarkService
  let browserSpy: jasmine.SpyObj<BrowserService>

  beforeEach(() => {
    browserSpy = jasmine.createSpyObj('BrowserService', ['open'])

    TestBed.configureTestingModule({
      providers: [BookmarkService, { provide: BrowserService, useValue: browserSpy }],
    })

    service = TestBed.inject(BookmarkService)
  })

  describe('open', () => {
    it('should open bookmark URL in internal browser', fakeAsync(() => {
      const bookmark: BookmarkUserBookmark = {
        url: 'https://example.com',
        external: false,
        shortcut: 'F1',
      }

      service.open(bookmark)
      tick(400)

      expect(browserSpy.open).toHaveBeenCalledWith('https://example.com', false)
    }))

    it('should open bookmark URL in external browser when external=true', fakeAsync(() => {
      const bookmark: BookmarkUserBookmark = {
        url: 'https://example.com',
        external: true,
        shortcut: 'F1',
      }

      service.open(bookmark)
      tick(400)

      expect(browserSpy.open).toHaveBeenCalledWith('https://example.com', true)
    }))

    it('should throttle rapid bookmark opens', fakeAsync(() => {
      const bookmark1: BookmarkUserBookmark = {
        url: 'https://example1.com',
        external: false,
        shortcut: 'F1',
      }
      const bookmark2: BookmarkUserBookmark = {
        url: 'https://example2.com',
        external: false,
        shortcut: 'F2',
      }

      service.open(bookmark1)
      service.open(bookmark2)
      tick(400)

      expect(browserSpy.open).toHaveBeenCalledTimes(1)
      expect(browserSpy.open).toHaveBeenCalledWith('https://example1.com', false)
    }))

    it('should allow opening after throttle period', fakeAsync(() => {
      const bookmark1: BookmarkUserBookmark = {
        url: 'https://example1.com',
        external: false,
        shortcut: 'F1',
      }
      const bookmark2: BookmarkUserBookmark = {
        url: 'https://example2.com',
        external: false,
        shortcut: 'F2',
      }

      service.open(bookmark1)
      tick(400)

      service.open(bookmark2)
      tick(400)

      expect(browserSpy.open).toHaveBeenCalledTimes(2)
    }))

    it('should handle undefined external as false', fakeAsync(() => {
      const bookmark: BookmarkUserBookmark = {
        url: 'https://example.com',
        external: undefined,
        shortcut: 'F1',
      }

      service.open(bookmark)
      tick(400)

      expect(browserSpy.open).toHaveBeenCalledWith('https://example.com', false)
    }))
  })
})

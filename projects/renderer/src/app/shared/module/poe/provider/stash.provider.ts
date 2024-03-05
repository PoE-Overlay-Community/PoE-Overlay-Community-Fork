import { Injectable } from '@angular/core'
import { CacheService } from '@app/service'
import { ApiErrorResponse, ApiStashTabItems, ApiStashTabNames, ApiStashType, PoEHttpService } from '@data/poe'
import { CacheExpiration, CacheExpirationType, ItemRarity, Language } from '@shared/module/poe/type'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { PoEStashTab, PoEStashTabItem } from '../type/stash.type'
import { StashGridType } from '../type/stash-grid.type'

const STASH_TYPE_MAPPING = {
  [ApiStashType.PremiumStash]: StashGridType.Normal,
  [ApiStashType.QuadStash]: StashGridType.Quad,
}

/* Obtained from the poe trade website source:
 * 
define("PoE/Item/FrameType", [], function() {
    return {
        Normal: 0,
        Magic: 1,
        Rare: 2,
        Unique: 3,
        Gem: 4,
        Currency: 5,
        DivinationCard: 6,
        Quest: 7,
        Prophecy: 8,
        Relic: 9
    }
}),
 * */
const ITEM_FRAME_TO_RARITY_MAPPING = {
  [0]: ItemRarity.Normal,
  [1]: ItemRarity.Magic,
  [2]: ItemRarity.Rare,
  [3]: ItemRarity.Unique,
  [4]: ItemRarity.Gem,
  [5]: ItemRarity.Currency,
  [6]: ItemRarity.DivinationCard,
  //7 = Quest
  //8 = Prophecy
  [9]: ItemRarity.UniqueRelic,
}

@Injectable({
  providedIn: 'root',
})
export class StashProvider {
  public readonly defaultTabInfoCacheExpiration = CacheExpirationType.OneHour
  public readonly defaultTabContentCacheExpiration = CacheExpirationType.FiveMin

  constructor(
    private readonly poeHttpService: PoEHttpService,
    private readonly cache: CacheService
  ) {
  }

  public provideTabInfo(accountName: string, leagueId: string, language: Language, cacheExpiration?: CacheExpirationType): Observable<PoEStashTab[]> {
    const key = `stashinfo_${language}_${leagueId}_${accountName}`
    return this.cache.proxy(key, () => this.fetchTabInfo(accountName, leagueId, language), CacheExpiration.getExpiration(cacheExpiration, this.defaultTabInfoCacheExpiration))
  }

  public provideTabsContent(stashTab: PoEStashTab, accountName: string, leagueId: string, language: Language, cacheExpiration?: CacheExpirationType): Observable<PoEStashTabItem[]> {
    const key = `stashcontent_${language}_${leagueId}_${accountName}_${stashTab.id}`
    return this.cache.proxy(key, () => this.fetchTabContent(stashTab, accountName, leagueId, language), CacheExpiration.getExpiration(cacheExpiration, this.defaultTabContentCacheExpiration))
  }

  private fetchTabInfo(accountName: string, leagueId: string, language: Language): Observable<PoEStashTab[]> {
    return this.poeHttpService.getStashTabInfo(accountName, leagueId, language).pipe(map((response) => {
      const apiError = response as ApiErrorResponse
      if (apiError && apiError.error) {
        return []
      } else {
        const stashTabNames = response as ApiStashTabNames
        return stashTabNames.tabs.map((tab) => {
          const stashGridType = STASH_TYPE_MAPPING[tab.type]
          if (stashGridType === undefined) {
            return undefined
          }
          const poeStashTab: PoEStashTab = {
            id: tab.id,
            tabIndex: tab.i,
            name: tab.n,
            stashGridType
          }
          return poeStashTab
        }).filter((x) => x !== null && x !== undefined)
      }
    }))
  }

  private fetchTabContent(stashTab: PoEStashTab, accountName: string, leagueId: string, language: Language): Observable<PoEStashTabItem[]> {
    return this.poeHttpService.getStashTabItems(stashTab.tabIndex, accountName, leagueId, language).pipe(map((response) => {
      const apiError = response as ApiErrorResponse
      if (apiError && apiError.error) {
        return []
      } else {
        const stashTabItems = response as ApiStashTabItems
        return stashTabItems.items.map((apiStashItem) => {
          const result: PoEStashTabItem = {
            source: apiStashItem,
            baseItemTypeName: apiStashItem.baseType,
            rarity: ITEM_FRAME_TO_RARITY_MAPPING[apiStashItem.frameType],
            itemLevel: apiStashItem.ilvl,
            itemLocation: {
              tabName: stashTab.name,
              bounds: {
                x: apiStashItem.x + 1,  // +1 to accommodate for the 1-based stash grid indexation
                y: apiStashItem.y + 1,  // +1 to accommodate for the 1-based stash grid indexation
                width: apiStashItem.w,
                height: apiStashItem.h,
              },
            },
          }
          return result
        })
      }
    }))
  }
}

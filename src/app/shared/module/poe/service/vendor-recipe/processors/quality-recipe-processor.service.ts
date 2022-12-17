import { Injectable } from '@angular/core'
import { LoggerService } from '@app/service'
import { BaseItemTypesService } from '@shared/module/poe/service/base-item-types/base-item-types.service'
import { ClientStringService } from '@shared/module/poe/service/client-string/client-string.service'
import { ContextService } from '@shared/module/poe/service/context.service'
import { ItemUsageType, QualityRecipeProcessResult, QualityRecipeUserSettings, RecipeHighlightOrder, RecipeItemGroup } from '@shared/module/poe/type'
import { ExpandedStashItem, RecipeProcessorService } from './recipe-processor.service'

const MaxBagSpace = 60

@Injectable({
  providedIn: 'root',
})
export abstract class QualityRecipeProcessorService extends RecipeProcessorService {
  protected abstract get recipeItemGroup(): RecipeItemGroup
  protected abstract get bagSlotsPerItem(): number
  protected abstract get qualityThreshold(): number
  protected abstract get qualityDivisor(): number

  constructor(
    readonly baseItemTypeService: BaseItemTypesService,
    readonly clientString: ClientStringService,
    readonly context: ContextService,
    readonly logger: LoggerService,
  ) {
    super(baseItemTypeService, clientString, context, logger)
  }

  protected processCandidates(logTag: string, identifier: number, stashItems: ExpandedStashItem[], settings: QualityRecipeUserSettings): QualityRecipeProcessResult {
    const candidates = stashItems.filter(x => !x.usedInRecipe).sort((a, b) => b.quality - a.quality)

    const result: QualityRecipeProcessResult = {
      identifier,
      recipes: [],
      itemGroups: [{
        group: this.recipeItemGroup,
        count: candidates.length,
      }]
    }

    const maxQualityItems = candidates.filter(x => x.quality >= this.qualityThreshold)
    const lesserQualityItems = candidates.filter(x => x.quality < this.qualityThreshold)

    this.logger.debug(logTag, `Recipe ${(identifier + 1)}`, [...lesserQualityItems])
    this.logger.debug(logTag, 'Max Quality Items:', maxQualityItems)

    const groupRecipes = this.findAllRecipes(logTag, lesserQualityItems, settings.numOfBagSpacesToUse, settings.fullSetThreshold)
    if (settings.calcEfficiency) {
      const maxGroupRecipes = settings.numOfBagSpacesToUse === MaxBagSpace ? groupRecipes : this.findAllRecipes(logTag, lesserQualityItems, MaxBagSpace, settings.fullSetThreshold)

      const maxGroupQuality = maxGroupRecipes.reduce((sum, recipes) => sum + recipes.reduce((innerSum, item) => innerSum + item.quality, 0), 0)
      const maxGroupCurrency = maxGroupQuality / this.qualityDivisor

      const groupQuality = groupRecipes.reduce((sum, recipes) => sum + recipes.reduce((innerSum, item) => innerSum + item.quality, 0), 0)
      const groupCurrency = groupQuality / this.qualityDivisor

      result.efficiency = maxGroupCurrency === 0 ? 0 : groupCurrency / maxGroupCurrency

      this.logger.debug(logTag, `Currency: ${groupCurrency}/${maxGroupCurrency} (Quality: ${groupQuality}/${maxGroupQuality}) (Efficiency: ${result.efficiency}%)`)
    }

    // mix-in the max quality items
    maxQualityItems.forEach(item => {
      const itemSize = (item.itemLocation.bounds.width * item.itemLocation.bounds.height)
      const recipe = groupRecipes.find(recipe => settings.numOfBagSpacesToUse - recipe.reduce((sum, item) => sum + (item.itemLocation.bounds.width * item.itemLocation.bounds.height), 0) >= itemSize)
      if (recipe) {
        recipe.push(item)
      } else {
        groupRecipes.unshift([item])
      }
    })

    if (settings.highlightOrder === RecipeHighlightOrder.ShortestDistance) {
      // Sort the recipes based on distance
      groupRecipes.forEach(recipe => {
        let lastItem = undefined
        for (let i = 0; i < recipe.length; i++) {
          const mappedItems = recipe
            .slice(i)
            .map((x) => ({ distanceToLastItem: this.calcDistance(lastItem, x), distanceToOrigin: this.calcDistance(undefined, x), item: x }))
            .sort((a, b) => a.distanceToLastItem === b.distanceToLastItem ? a.distanceToOrigin - b.distanceToOrigin : a.distanceToLastItem - b.distanceToLastItem)
          const idx = recipe.findIndex(x => x.source.id === mappedItems[0].item.source.id)
          const temp = recipe[i]
          recipe[i] = recipe[idx]
          recipe[idx] = temp
          lastItem = recipe[i]
        }
      })
    }

    // Mark the items as used
    groupRecipes.forEach(recipe => recipe.forEach(item => item.usedInRecipe = true))

    result.recipes.push(...groupRecipes)

    return result
  }

  protected isPartOfRecipe(stashItem: ExpandedStashItem, settings: QualityRecipeUserSettings): boolean {
    if (stashItem.recipeItemGroup !== this.recipeItemGroup || stashItem.quality === 0) {
      return false
    }

    switch (settings.corruptedItemUsage) {
      case ItemUsageType.AlwaysUse:
        if (!stashItem.source.corrupted) {
          return false
        }
        break

      case ItemUsageType.NeverUse:
        if (stashItem.source.corrupted) {
          return false
        }
        break
    }

    return true
  }

  private findAllRecipes(logTag: string, stashItems: ExpandedStashItem[], maxBagSlots: number, maxRecipes: number): ExpandedStashItem[][] {
    const candidates = [...stashItems]
    const foundRecipes: ExpandedStashItem[][] = []
    while (candidates.length > 0) {
      const groupSize = Math.floor(maxBagSlots / this.bagSlotsPerItem)
      this.logger.debug(logTag, `searching combinations with maxBagSlots ${maxBagSlots} and groupSize ${groupSize}`)
      const groupCombination = this.findCombination(logTag, candidates, groupSize)
      if (!groupCombination) {
        break
      }

      // Remove the found combination from the candidates list and mark them as used
      groupCombination.forEach(item => {
        candidates.splice(candidates.findIndex(x => x.source.id === item.source.id), 1)
      })

      if (this.logger.isLogTagEnabled(logTag)) {
        const groupQuality = groupCombination.reduce((sum, item) => sum + item.quality, 0)
        const groupCurrency = groupQuality / this.qualityDivisor

        this.logger.debug(logTag, `Currency: ${groupCurrency} (Quality: ${groupQuality})`, groupCombination)
        this.logger.debug(logTag, 'Remaining Candidates:', [...candidates])
      }
      foundRecipes.push(groupCombination)
      if (foundRecipes.length === maxRecipes) {
        break
      }
    }
    return foundRecipes
  }

  private findCombination(logTag: string, stashItems: ExpandedStashItem[], maxGroupSize: number): ExpandedStashItem[] {
    const groupItems = stashItems.slice(0, maxGroupSize)
    this.logger.debug(logTag, 'Group Items:', groupItems)
    const totalQuality = groupItems.reduce((sum, item) => sum + item.quality, 0)
    const maxQuality = Math.floor(totalQuality / this.qualityDivisor) * this.qualityDivisor
    this.logger.debug(logTag, `findCombination: maxQuality ${maxQuality} (Total: ${totalQuality})`)
    let totalCount = 0
    for (let targetQuality = maxQuality; targetQuality > 0; targetQuality -= this.qualityDivisor) {
      for (let targetGroupSize = Math.min(stashItems.length, maxGroupSize), minGroupSize = Math.ceil(targetQuality / 19); targetGroupSize >= minGroupSize; targetGroupSize--) {
        this.logger.debug(logTag, `searching for targetQuality ${targetQuality} and targetGroupSize ${targetGroupSize}`)
        const combinator = this.combinations(stashItems, targetGroupSize)
        let count = 0
        const startTime = Date.now()
        for (; ;) {
          const it = combinator.next()
          if (it.done) {
            this.logger.debug(logTag, `Failed to find combo after ${count.toLocaleString('en-US')} combinations (Total: ${totalCount.toLocaleString('en-US')})`)
            break
          }
          totalCount++
          count++
          const combination = (it.value as ExpandedStashItem[])
          const sum = combination.reduce((sum, item) => sum + item.quality, 0)
          if (sum === targetQuality) {
            this.logger.debug(logTag, `Found combo at ${targetQuality} after ${count.toLocaleString('en-US')} combinations (Total: ${totalCount.toLocaleString('en-US')})`)
            return combination
          }
          // Stop looking after 1 billion combinations or when it takes more then 1 second to find a combination
          if (count >= 1000000000) {
            this.logger.debug(logTag, `Failed to find combo after ${count.toLocaleString('en-US')} combinations (Total: ${totalCount.toLocaleString('en-US')})`)
            break
          } else if (Date.now() - startTime >= 1000) {
            this.logger.debug(logTag, `Failed to find combo after ${(Date.now() - startTime).toLocaleString('en-US')}ms (${count.toLocaleString('en-US')} combinations (Total: ${totalCount.toLocaleString('en-US')}))`)
            break
          }
        }
      }
    }
    return undefined
  }

  private * combinations<T>(arr: T[], size: number): Generator<T[], void, unknown> {
    if (size < 0) {
      return // invalid parameters, no combinations possible
    }

    size = Math.min(arr.length, size)

    // generate the initial combination indices
    const combIndices: number[] = Array.from(Array(size).keys())

    while (true) {
      yield combIndices.map(x => arr[x])

      // find first index to update
      let indexToUpdate = size - 1
      while (indexToUpdate >= 0 && combIndices[indexToUpdate] >= arr.length - size + indexToUpdate) {
        indexToUpdate--
      }

      if (indexToUpdate < 0) {
        return
      }

      // update combination indices
      for (let combIndex = combIndices[indexToUpdate] + 1; indexToUpdate < size; indexToUpdate++, combIndex++) {
        combIndices[indexToUpdate] = combIndex
      }
    }
  }
}

import { Injectable } from '@angular/core';
import { BaseItemTypesService } from '@shared/module/poe/service/base-item-types/base-item-types.service';
import { ItemUsageType, QualityRecipeProcessResult, QualityRecipeUserSettings, RecipeHighlightOrder, RecipeItemGroup } from '@shared/module/poe/type';
import { ExpandedStashItem, RecipeProcessorService } from './recipe-processor.service';

const MaxBagSpace = 60

@Injectable({
  providedIn: 'root',
})
export abstract class QualityRecipeProcessorService extends RecipeProcessorService {
  private readonly log = false

  protected abstract get recipeItemGroup(): RecipeItemGroup
  protected abstract get bagSlotsPerItem(): number
  protected abstract get qualityThreshold(): number
  protected abstract get qualityDivisor(): number

  constructor(
    readonly baseItemTypeService: BaseItemTypesService,
  ) {
    super(baseItemTypeService)
  }

  protected processCandidates(identifier: number, stashItems: ExpandedStashItem[], settings: QualityRecipeUserSettings): QualityRecipeProcessResult {
    const result: QualityRecipeProcessResult = {
      identifier,
      recipes: [],
      itemGroups: [{
        group: this.recipeItemGroup,
        count: stashItems.length,
      }]
    }

    stashItems = stashItems.sort((a, b) => b.quality - a.quality)

    const maxQualityItems = stashItems.filter(x => x.quality >= this.qualityThreshold)
    const lesserQualityItems = stashItems.filter(x => x.quality < this.qualityThreshold)

    if (this.log) {
      console.log(`Recipe ${(identifier + 1)}`)
      console.log([...lesserQualityItems])
      console.log(`Max Quality Items:`)
      console.log(maxQualityItems)
    }

    const groupRecipes = this.findAllRecipes(lesserQualityItems, settings.numOfBagSpacesToUse, settings.fullSetThreshold)
    let maxGroupRecipes = undefined
    if (settings.calcEfficiency) {
      maxGroupRecipes = settings.numOfBagSpacesToUse === MaxBagSpace ? groupRecipes : this.findAllRecipes(lesserQualityItems, MaxBagSpace, settings.fullSetThreshold)

      const maxGroupQuality = maxGroupRecipes.reduce((sum, recipes) => sum + recipes.reduce((innerSum, item) => innerSum + item.quality, 0), 0)
      const maxGroupCurrency = maxGroupQuality / this.qualityDivisor

      const groupQuality = groupRecipes.reduce((sum, recipes) => sum + recipes.reduce((innerSum, item) => innerSum + item.quality, 0), 0)
      const groupCurrency = groupQuality / this.qualityDivisor

      result.efficiency = groupCurrency / maxGroupCurrency

      this.log && console.log(`Currency: ${groupCurrency}/${maxGroupCurrency} (Quality: ${groupQuality}/${maxGroupQuality}) (Efficiency: ${result.efficiency}%)`)
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
            .map((x) => ({ distance: this.calcDistance(lastItem, x), item: x }))
            .sort((a, b) => a.distance - b.distance)
          const idx = recipe.findIndex(x => x.source.id === mappedItems[0].item.source.id)
          const temp = recipe[i]
          recipe[i] = recipe[idx]
          recipe[idx] = temp
          lastItem = recipe[i]
        }
      })
    }

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

  private findAllRecipes(stashItems: ExpandedStashItem[], maxBagSlots: number, maxRecipes): ExpandedStashItem[][] {
    const foundRecipes: ExpandedStashItem[][] = []
    const candidates = [...stashItems]
    while (candidates.length > 0) {
      const groupSize = Math.floor(maxBagSlots / this.bagSlotsPerItem)
      this.log && console.log(`searching combinations with maxBagSlots ${maxBagSlots} and groupSize ${groupSize}`)
      const groupCombination = this.findCombination(candidates, groupSize)
      if (!groupCombination) {
        break
      }

      groupCombination.forEach(item => candidates.splice(candidates.findIndex(x => x.source.id === item.source.id), 1))

      if (this.log) {
        const groupQuality = groupCombination.reduce((sum, item) => sum + item.quality, 0)
        const groupCurrency = groupQuality / this.qualityDivisor

        console.log(`Currency: ${groupCurrency} (Quality: ${groupQuality})`)
        console.log(groupCombination)
        console.log(`Remaining Candidates:`)
        console.log([...candidates])
      }
      foundRecipes.push(groupCombination)
      if (foundRecipes.length === maxRecipes) {
        break
      }
    }
    return foundRecipes
  }

  private findCombination(stashItems: ExpandedStashItem[], maxGroupSize: number): ExpandedStashItem[] {
    const totalQuality = stashItems.slice(0, maxGroupSize).reduce((sum, item) => sum + item.quality, 0)
    const maxQuality = Math.floor(totalQuality / this.qualityDivisor) * this.qualityDivisor
    this.log && console.log(`findCombination: maxQuality ${maxQuality} (Total: ${totalQuality})`)
    let totalCount = 0
    for (let targetQuality = maxQuality; targetQuality > 0; targetQuality -= this.qualityDivisor) {
      for (let targetGroupSize = Math.min(stashItems.length, maxGroupSize), minGroupSize = Math.ceil(targetQuality / 19); targetGroupSize >= minGroupSize; targetGroupSize--) {
        this.log && console.log(`searching for targetQuality ${targetQuality} and targetGroupSize ${targetGroupSize}`)
        const combinator = this.combinations(stashItems, targetGroupSize)
        let count = 0
        const startTime = Date.now()
        for (; ;) {
          const it = combinator.next()
          if (it.done) {
            this.log && console.log(`Failed to find combo after ${count.toLocaleString('en-US')} combinations (Total: ${totalCount.toLocaleString('en-US')})`)
            break
          }
          totalCount++
          count++
          const combination = (it.value as ExpandedStashItem[])
          const sum = combination.reduce((sum, item) => sum + item.quality, 0)
          if (sum === targetQuality) {
            this.log && console.log(`Found combo at ${targetQuality} after ${count.toLocaleString('en-US')} combinations (Total: ${totalCount.toLocaleString('en-US')})`)
            return combination
          }
          // Stop looking after 1 billion combinations
          if (count >= 1000000000) {
            this.log && console.log(`Failed to find combo after ${count.toLocaleString('en-US')} combinations (Total: ${totalCount.toLocaleString('en-US')})`)
            break
          } else if (Date.now() - startTime >= 1000) {
            this.log && console.log(`Failed to find combo after ${(Date.now() - startTime).toLocaleString('en-US')}ms (${count.toLocaleString('en-US')} combinations (Total: ${totalCount.toLocaleString('en-US')}))`)
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

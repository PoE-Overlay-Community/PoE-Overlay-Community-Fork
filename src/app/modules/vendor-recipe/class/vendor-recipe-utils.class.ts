import { ItemSetRecipeUserSettings, QualityRecipeProcessResult, QualityRecipeUserSettings, RecipeItemGroup, RecipeUserSettings, VendorRecipeProcessResult, VendorRecipeType } from '@shared/module/poe/type'

export abstract class VendorRecipeUtils {
  public static getItemSetRecipeUserSettings(settings: RecipeUserSettings): ItemSetRecipeUserSettings {
    switch (settings.type) {
      case VendorRecipeType.Chaos:
      case VendorRecipeType.ExaltedShard:
      case VendorRecipeType.Regal:
      case VendorRecipeType.Chance:
        return settings as ItemSetRecipeUserSettings
    }
    return undefined
  }

  public static getQualityRecipeUserSettings(settings: RecipeUserSettings): QualityRecipeUserSettings {
    switch (settings.type) {
      case VendorRecipeType.Gemcutter:
      case VendorRecipeType.GlassblowerBauble:
        return settings as QualityRecipeUserSettings
    }
    return undefined
  }

  public static getItemGroupName(settings: RecipeUserSettings, recipeItemGroup: RecipeItemGroup): string {
    if (recipeItemGroup === RecipeItemGroup.OneHandedWeapons && this.getItemSetRecipeUserSettings(settings)?.groupWeaponsTogether) {
      return `weapons`
    }
    return (RecipeItemGroup[recipeItemGroup] as string).toLowerCase()
  }
}

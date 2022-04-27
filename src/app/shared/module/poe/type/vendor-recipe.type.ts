import { Color } from '@app/class'
import { Rectangle } from '@app/type'
import { UserSettings } from '@layout/type'
import { AudioClipSettings } from './audioclip.type'
import { PoEStashTabItem } from './stash.type'

export interface VendorRecipeUserSettings extends UserSettings {
  vendorRecipeItemSetPanelSettings: ItemSetPanelUserSettings
  vendorRecipeChaosRecipeSettings: ItemLevelBasedItemSetRecipeUserSettings
  vendorRecipeExaltedShardRecipeSettings: ItemSetRecipeUserSettings
}

export interface ItemSetPanelUserSettings {
  enabled: boolean
  bounds?: Rectangle
  backgroundOpacity: number
}

export interface ItemSetRecipeUserSettings {
  enabled: boolean
  itemThreshold: number
  fullSetThreshold: number
  useIdentifiedItems: boolean
  stashTabSearchMode: StashTabSearchMode
  stashTabSearchValue?: string
  showItemAmounts: boolean
  highlightMode: RecipeHighlightMode
  highlightOrder: RecipeHighlightOrder
  groupWeaponsTogether: boolean
  itemClassColors: ItemGroupColor[]
  recipeCompleteAudio: AudioClipSettings
  itemThresholdAudio: AudioClipSettings
  fullSetThresholdAudio: AudioClipSettings
}

export interface ItemLevelBasedItemSetRecipeUserSettings extends ItemSetRecipeUserSettings {
  separateQualityItems: boolean
  fillGreedy: boolean
}

export interface ItemGroupColor {
  group: ItemSetGroup
  showOnOverlay: boolean
  color: Color
}

export enum ItemSetGroup {
  Helmets,
  Chests,
  Gloves,
  Boots,
  OneHandedWeapons,
  TwoHandedWeapons,
  Belts,
  Rings,
  Amulets,
}

export enum StashTabSearchMode {
  Index = 0,
  Prefix = 1,
  Suffix = 2,
  Regex = 3,
}

export enum RecipeHighlightMode {
  ItemByItem = 0,
  SetBySet = 1,
  AllItems = 2,
}

export enum RecipeHighlightOrder {
  LargeToSmall = 0,
  SmallToLarge = 1,
  ShortestDistance = 2,
}

export interface VendorRecipe {
  type: VendorRecipeType
  items: PoEStashTabItem[]
}

export enum VendorRecipeType {
  Chaos = 0,
  ExaltedShard = 1,
}

export interface ItemSetProcessResult {
  recipes: VendorRecipe[]
  itemGroups: ItemSetGroupCount[]
}

export interface ItemSetGroupCount {
  type: VendorRecipeType
  group: ItemSetGroup
  count: number
}

export interface ItemSetRecipeProcessor {
  process(stashItems: PoEStashTabItem[], settings: ItemSetRecipeUserSettings): ItemSetProcessResult
}

import { Color, Colors } from '@app/class'
import { Rectangle } from '@app/type'
import { UserSettings } from '@layout/type'
import { AudioClipSettings } from './audioclip.type'
import { PoEStashTabItem } from './stash.type'

export interface VendorRecipeUserSettings extends UserSettings {
  vendorRecipeItemSetPanelSettings: ItemSetPanelUserSettings
  vendorRecipeItemSetSettings: ItemSetRecipeUserSettings[]
}

export interface ItemSetPanelUserSettings {
  enabled: boolean
  bounds?: Rectangle
  backgroundOpacity: number
}

export interface ItemSetRecipeUserSettings {
  type: VendorRecipeType
  enabled: boolean
  largeIconId: string
  smallIconId: string
  itemThreshold: number
  fullSetThreshold: number
  identifiedItemUsage: ItemUsageType
  qualityItemUsage: ItemUsageType
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
  fillGreedy: boolean
}

export enum ItemUsageType {
  NeverUse = 0,
  CanUse = 1,
  AlwaysUse = 2,
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
  identifier: number
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
  identifier: number
  group: ItemSetGroup
  count: number
}

export interface ItemSetRecipeProcessor {
  process(identifier: number, stashItems: PoEStashTabItem[], settings: ItemSetRecipeUserSettings, allRecipes: ItemSetProcessResult): ItemSetProcessResult
}

export const DefaultChaosRecipeSettings: ItemLevelBasedItemSetRecipeUserSettings = {
  type: VendorRecipeType.Chaos,
  enabled: true,
  largeIconId: 'chaos',
  smallIconId: '',
  itemThreshold: 5,
  fullSetThreshold: 5,
  fillGreedy: false,
  identifiedItemUsage: ItemUsageType.NeverUse,
  qualityItemUsage: ItemUsageType.CanUse,
  stashTabSearchMode: StashTabSearchMode.Prefix,
  stashTabSearchValue: 'Ch',
  showItemAmounts: true,
  highlightMode: RecipeHighlightMode.ItemByItem,
  highlightOrder: RecipeHighlightOrder.LargeToSmall,
  groupWeaponsTogether: true,
  itemClassColors: [
    {
      group: ItemSetGroup.Helmets,
      showOnOverlay: true,
      color: Colors.yellow,
    },
    {
      group: ItemSetGroup.Chests,
      showOnOverlay: true,
      color: Colors.magenta,
    },
    {
      group: ItemSetGroup.Gloves,
      showOnOverlay: true,
      color: Colors.lightgreen,
    },
    {
      group: ItemSetGroup.Boots,
      showOnOverlay: true,
      color: Colors.royalblue,
    },
    {
      group: ItemSetGroup.Belts,
      showOnOverlay: true,
      color: Colors.red,
    },
    {
      group: ItemSetGroup.Amulets,
      showOnOverlay: true,
      color: Colors.red,
    },
    {
      group: ItemSetGroup.Rings,
      showOnOverlay: true,
      color: Colors.red,
    },
    {
      group: ItemSetGroup.TwoHandedWeapons,
      showOnOverlay: true,
      color: Colors.cyan,
    },
    {
      group: ItemSetGroup.OneHandedWeapons,
      showOnOverlay: true,
      color: Colors.cyan,
    },
  ],
  recipeCompleteAudio: {
    enabled: false,
    volume: 1,
  },
  itemThresholdAudio: {
    enabled: false,
    volume: 1,
  },
  fullSetThresholdAudio: {
    enabled: false,
    volume: 1,
  },
}

export const DefaultExaltedShardRecipeSettings: ItemSetRecipeUserSettings = {
  type: VendorRecipeType.ExaltedShard,
  enabled: false,
  largeIconId: 'exalted-shard',
  smallIconId: '',
  itemThreshold: 5,
  fullSetThreshold: 5,
  identifiedItemUsage: ItemUsageType.CanUse,
  qualityItemUsage: ItemUsageType.CanUse,
  stashTabSearchMode: StashTabSearchMode.Prefix,
  stashTabSearchValue: 'Ex',
  showItemAmounts: true,
  highlightMode: RecipeHighlightMode.ItemByItem,
  highlightOrder: RecipeHighlightOrder.LargeToSmall,
  groupWeaponsTogether: true,
  itemClassColors: [
    {
      group: ItemSetGroup.Helmets,
      showOnOverlay: true,
      color: Colors.yellow,
    },
    {
      group: ItemSetGroup.Chests,
      showOnOverlay: true,
      color: Colors.magenta,
    },
    {
      group: ItemSetGroup.Gloves,
      showOnOverlay: true,
      color: Colors.lightgreen,
    },
    {
      group: ItemSetGroup.Boots,
      showOnOverlay: true,
      color: Colors.royalblue,
    },
    {
      group: ItemSetGroup.Belts,
      showOnOverlay: true,
      color: Colors.red,
    },
    {
      group: ItemSetGroup.Amulets,
      showOnOverlay: true,
      color: Colors.red,
    },
    {
      group: ItemSetGroup.Rings,
      showOnOverlay: true,
      color: Colors.red,
    },
    {
      group: ItemSetGroup.TwoHandedWeapons,
      showOnOverlay: true,
      color: Colors.cyan,
    },
    {
      group: ItemSetGroup.OneHandedWeapons,
      showOnOverlay: true,
      color: Colors.cyan,
    },
  ],
  recipeCompleteAudio: {
    enabled: false,
    volume: 1,
  },
  itemThresholdAudio: {
    enabled: false,
    volume: 1,
  },
  fullSetThresholdAudio: {
    enabled: false,
    volume: 1,
  },
}

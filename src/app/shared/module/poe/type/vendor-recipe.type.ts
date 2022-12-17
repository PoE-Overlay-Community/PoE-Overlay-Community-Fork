import { Color, Colors, ObjectUtils } from '@app/class'
import { Rectangle } from '@app/type'
import { UserSettings } from '@layout/type'
import { AudioClipSettings } from './audioclip.type'
import { PoEStashTabItem } from './stash.type'

export interface VendorRecipeUserSettings extends UserSettings {
  vendorRecipePanelSettings: VendorRecipePanelUserSettings
  vendorRecipeSettings: RecipeUserSettings[]
}

export interface VendorRecipePanelUserSettings {
  enabled: boolean
  bounds?: Rectangle
  backgroundOpacity: number
}

export interface RecipeUserSettings {
  type: VendorRecipeType
  enabled: boolean
  largeIconId: string
  smallIconId: string
  itemThreshold: number
  fullSetThreshold: number
  showItemAmounts: boolean
  stashTabSearchMode: StashTabSearchMode
  stashTabSearchValue?: string
  highlightMode: RecipeHighlightMode
  highlightOrder: RecipeHighlightOrder
  itemGroupSettings: ItemGroupSettings[]
  recipeCompleteAudio: AudioClipSettings
  itemThresholdAudio: AudioClipSettings
  fullSetThresholdAudio: AudioClipSettings
}

export interface QualityRecipeUserSettings extends RecipeUserSettings {
  corruptedItemUsage: ItemUsageType
  numOfBagSpacesToUse: number
  calcEfficiency: boolean
}

export interface ItemSetRecipeUserSettings extends RecipeUserSettings {
  identifiedItemUsage: ItemUsageType
  qualityItemUsage: ItemUsageType
  groupWeaponsTogether: boolean
}

export interface ItemLevelBasedItemSetRecipeUserSettings extends ItemSetRecipeUserSettings {
  fillGreedy: boolean
}

export enum ItemUsageType {
  NeverUse = 0,
  CanUse = 1,
  AlwaysUse = 2,
}

export interface ItemGroupSettings {
  group: RecipeItemGroup
  color: Color
  showOnOverlay: boolean
  itemThreshold?: number
}

export enum RecipeItemGroup {
  Helmets,
  Chests,
  Gloves,
  Boots,
  OneHandedWeapons,
  TwoHandedWeapons,
  Belts,
  Rings,
  Amulets,
  Gems,
  Flasks,
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

export enum VendorRecipeType {
  Chaos = 0,
  ExaltedShard = 1,
  Gemcutter = 2,
  GlassblowerBauble = 3,
  Regal = 4,
  Chance = 5,
}

export interface VendorRecipeProcessResult {
  identifier: number
  recipes: PoEStashTabItem[][]
  itemGroups: RecipeItemGroupCount[]
}

export interface ItemSetProcessResult extends VendorRecipeProcessResult {
}

export interface QualityRecipeProcessResult extends VendorRecipeProcessResult {
  efficiency?: number
}

export interface RecipeItemGroupCount {
  group: RecipeItemGroup
  count: number
}

const ItemSetGroups: RecipeItemGroup[] = [
  RecipeItemGroup.Helmets,
  RecipeItemGroup.Chests,
  RecipeItemGroup.Gloves,
  RecipeItemGroup.Boots,
  RecipeItemGroup.OneHandedWeapons,
  RecipeItemGroup.TwoHandedWeapons,
  RecipeItemGroup.Belts,
  RecipeItemGroup.Rings,
  RecipeItemGroup.Amulets,
]

export const RecipeItemGroups: { [key: string]: RecipeItemGroup[] } = {
  [VendorRecipeType.Chaos]: ItemSetGroups,
  [VendorRecipeType.ExaltedShard]: ItemSetGroups,
  [VendorRecipeType.Gemcutter]: [RecipeItemGroup.Gems],
  [VendorRecipeType.GlassblowerBauble]: [RecipeItemGroup.Flasks],
  [VendorRecipeType.Regal]: ItemSetGroups,
  [VendorRecipeType.Chance]: ItemSetGroups,
}

const DefaultChaosRecipeSettings: ItemLevelBasedItemSetRecipeUserSettings = {
  type: VendorRecipeType.Chaos,
  enabled: true,
  largeIconId: 'chaos',
  smallIconId: '',
  itemThreshold: 5,
  fullSetThreshold: 5,
  fillGreedy: true,
  identifiedItemUsage: ItemUsageType.NeverUse,
  qualityItemUsage: ItemUsageType.CanUse,
  stashTabSearchMode: StashTabSearchMode.Prefix,
  stashTabSearchValue: 'Ch',
  showItemAmounts: true,
  highlightMode: RecipeHighlightMode.ItemByItem,
  highlightOrder: RecipeHighlightOrder.LargeToSmall,
  groupWeaponsTogether: true,
  itemGroupSettings: [
    {
      group: RecipeItemGroup.Helmets,
      showOnOverlay: true,
      color: Colors.yellow,
    },
    {
      group: RecipeItemGroup.Chests,
      showOnOverlay: true,
      color: Colors.magenta,
    },
    {
      group: RecipeItemGroup.Gloves,
      showOnOverlay: true,
      color: Colors.lightgreen,
    },
    {
      group: RecipeItemGroup.Boots,
      showOnOverlay: true,
      color: Colors.royalblue,
    },
    {
      group: RecipeItemGroup.Belts,
      showOnOverlay: true,
      color: Colors.red,
    },
    {
      group: RecipeItemGroup.Amulets,
      showOnOverlay: true,
      color: Colors.red,
    },
    {
      group: RecipeItemGroup.Rings,
      showOnOverlay: true,
      color: Colors.red,
    },
    {
      group: RecipeItemGroup.TwoHandedWeapons,
      showOnOverlay: true,
      color: Colors.cyan,
    },
    {
      group: RecipeItemGroup.OneHandedWeapons,
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

const DefaultExaltedShardRecipeSettings: ItemSetRecipeUserSettings = {
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
  itemGroupSettings: [
    {
      group: RecipeItemGroup.Helmets,
      showOnOverlay: true,
      color: Colors.yellow,
    },
    {
      group: RecipeItemGroup.Chests,
      showOnOverlay: true,
      color: Colors.magenta,
    },
    {
      group: RecipeItemGroup.Gloves,
      showOnOverlay: true,
      color: Colors.lightgreen,
    },
    {
      group: RecipeItemGroup.Boots,
      showOnOverlay: true,
      color: Colors.royalblue,
    },
    {
      group: RecipeItemGroup.Belts,
      showOnOverlay: true,
      color: Colors.red,
    },
    {
      group: RecipeItemGroup.Amulets,
      showOnOverlay: true,
      color: Colors.red,
    },
    {
      group: RecipeItemGroup.Rings,
      showOnOverlay: true,
      color: Colors.red,
    },
    {
      group: RecipeItemGroup.TwoHandedWeapons,
      showOnOverlay: true,
      color: Colors.cyan,
    },
    {
      group: RecipeItemGroup.OneHandedWeapons,
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

const DefaultGemcutterRecipeSettings: QualityRecipeUserSettings = {
  type: VendorRecipeType.Gemcutter,
  enabled: false,
  largeIconId: 'gcp',
  smallIconId: '',
  corruptedItemUsage: ItemUsageType.CanUse,
  numOfBagSpacesToUse: 50,
  calcEfficiency: false,
  itemThreshold: 50,
  fullSetThreshold: 1,
  showItemAmounts: true,
  stashTabSearchMode: StashTabSearchMode.Prefix,
  stashTabSearchValue: 'gcp',
  highlightMode: RecipeHighlightMode.ItemByItem,
  highlightOrder: RecipeHighlightOrder.ShortestDistance,
  itemGroupSettings: [
    {
      group: RecipeItemGroup.Gems,
      showOnOverlay: true,
      color: Colors.lightSeaGreen,
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

const DefaultGlassblowerBaubleSettings: QualityRecipeUserSettings = {
  type: VendorRecipeType.GlassblowerBauble,
  enabled: false,
  largeIconId: 'bauble',
  smallIconId: '',
  corruptedItemUsage: ItemUsageType.CanUse,
  numOfBagSpacesToUse: 50,
  calcEfficiency: false,
  itemThreshold: 20,
  fullSetThreshold: 1,
  showItemAmounts: true,
  stashTabSearchMode: StashTabSearchMode.Prefix,
  stashTabSearchValue: 'flasks',
  highlightMode: RecipeHighlightMode.ItemByItem,
  highlightOrder: RecipeHighlightOrder.ShortestDistance,
  itemGroupSettings: [
    {
      group: RecipeItemGroup.Flasks,
      showOnOverlay: true,
      color: Colors.chocolate,
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

const DefaultRegalRecipeSettings: ItemLevelBasedItemSetRecipeUserSettings = {
  type: VendorRecipeType.Regal,
  enabled: true,
  largeIconId: 'regal',
  smallIconId: '',
  itemThreshold: 5,
  fullSetThreshold: 5,
  fillGreedy: true,
  identifiedItemUsage: ItemUsageType.NeverUse,
  qualityItemUsage: ItemUsageType.CanUse,
  stashTabSearchMode: StashTabSearchMode.Prefix,
  stashTabSearchValue: 'Re',
  showItemAmounts: true,
  highlightMode: RecipeHighlightMode.ItemByItem,
  highlightOrder: RecipeHighlightOrder.LargeToSmall,
  groupWeaponsTogether: true,
  itemGroupSettings: [
    {
      group: RecipeItemGroup.Helmets,
      showOnOverlay: true,
      color: Colors.yellow,
    },
    {
      group: RecipeItemGroup.Chests,
      showOnOverlay: true,
      color: Colors.magenta,
    },
    {
      group: RecipeItemGroup.Gloves,
      showOnOverlay: true,
      color: Colors.lightgreen,
    },
    {
      group: RecipeItemGroup.Boots,
      showOnOverlay: true,
      color: Colors.royalblue,
    },
    {
      group: RecipeItemGroup.Belts,
      showOnOverlay: true,
      color: Colors.red,
    },
    {
      group: RecipeItemGroup.Amulets,
      showOnOverlay: true,
      color: Colors.red,
    },
    {
      group: RecipeItemGroup.Rings,
      showOnOverlay: true,
      color: Colors.red,
    },
    {
      group: RecipeItemGroup.TwoHandedWeapons,
      showOnOverlay: true,
      color: Colors.cyan,
    },
    {
      group: RecipeItemGroup.OneHandedWeapons,
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

const DefaultChanceRecipeSettings: ItemLevelBasedItemSetRecipeUserSettings = {
  type: VendorRecipeType.Chance,
  enabled: true,
  largeIconId: 'chance',
  smallIconId: '',
  itemThreshold: 5,
  fullSetThreshold: 5,
  fillGreedy: true,
  identifiedItemUsage: ItemUsageType.NeverUse,
  qualityItemUsage: ItemUsageType.CanUse,
  stashTabSearchMode: StashTabSearchMode.Prefix,
  stashTabSearchValue: 'Chance',
  showItemAmounts: true,
  highlightMode: RecipeHighlightMode.ItemByItem,
  highlightOrder: RecipeHighlightOrder.LargeToSmall,
  groupWeaponsTogether: true,
  itemGroupSettings: [
    {
      group: RecipeItemGroup.Helmets,
      showOnOverlay: true,
      color: Colors.yellow,
    },
    {
      group: RecipeItemGroup.Chests,
      showOnOverlay: true,
      color: Colors.magenta,
    },
    {
      group: RecipeItemGroup.Gloves,
      showOnOverlay: true,
      color: Colors.lightgreen,
    },
    {
      group: RecipeItemGroup.Boots,
      showOnOverlay: true,
      color: Colors.royalblue,
    },
    {
      group: RecipeItemGroup.Belts,
      showOnOverlay: true,
      color: Colors.red,
    },
    {
      group: RecipeItemGroup.Amulets,
      showOnOverlay: true,
      color: Colors.red,
    },
    {
      group: RecipeItemGroup.Rings,
      showOnOverlay: true,
      color: Colors.red,
    },
    {
      group: RecipeItemGroup.TwoHandedWeapons,
      showOnOverlay: true,
      color: Colors.cyan,
    },
    {
      group: RecipeItemGroup.OneHandedWeapons,
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

export const DefaultRecipeSettings: { [key: string]: RecipeUserSettings } = {
  [VendorRecipeType.Chaos]: DefaultChaosRecipeSettings,
  [VendorRecipeType.ExaltedShard]: DefaultExaltedShardRecipeSettings,
  [VendorRecipeType.Gemcutter]: DefaultGemcutterRecipeSettings,
  [VendorRecipeType.GlassblowerBauble]: DefaultGlassblowerBaubleSettings,
  [VendorRecipeType.Regal]: DefaultRegalRecipeSettings,
  [VendorRecipeType.Chance]: DefaultChanceRecipeSettings,
}

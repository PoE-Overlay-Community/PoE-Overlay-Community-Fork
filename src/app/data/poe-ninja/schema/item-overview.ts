export interface ItemOverviewResponse {
  lines: ItemOverviewLine[]
  url: string
}

export interface ItemOverviewLine {
  name: string
  baseType: string
  mapTier: number
  levelRequired: number
  links: number
  gemLevel: number
  gemQuality: number
  prophecyText: string
  corrupted: boolean
  itemClass: number
  chaosValue: number
  sparkline: SparkLine
}

export interface SparkLine {
  data: number[]
  totalChange: number
}

export enum ItemOverviewType {
  // General
  Currency = 'Currency',
  Fragment = 'Fragment',
  Wombgift = 'Wombgift',
  Runegraft = 'Runegraft',
  AllflameEmber = 'AllflameEmber',
  Tattoo = 'Tattoo',
  Omen = 'Omen',
  DjinnCoin = 'DjinnCoin',
  DivinationCard = 'DivinationCard',
  Artifact = 'Artifact',
  Oil = 'Oil',
  Incubator = 'Incubator',
  // Equipment & Gems
  UniqueWeapon = 'UniqueWeapon',
  UniqueArmour = 'UniqueArmour',
  UniqueAccessory = 'UniqueAccessory',
  UniqueFlask = 'UniqueFlask',
  UniqueJewel = 'UniqueJewel',
  ForbiddenJewel = 'ForbiddenJewel',
  UniqueTincture = 'UniqueTincture',
  UniqueRelic = 'UniqueRelic',
  SkillGem = 'SkillGem',
  ClusterJewel = 'ClusterJewel',
  // Atlas
  Map = 'Map',
  BlightedMap = 'BlightedMap',
  BlightRavagedMap = 'BlightRavagedMap',
  UniqueMap = 'UniqueMap',
  ValdoMap = 'ValdoMap',
  DeliriumOrb = 'DeliriumOrb',
  Invitation = 'Invitation',
  Scarab = 'Scarab',
  Astrolabe = 'Astrolabe',
  Memory = 'Memory',
  IncursionTemple = 'IncursionTemple',
  // Crafting
  Fossil = 'Fossil',
  Resonator = 'Resonator',
  Beast = 'Beast',
  Essence = 'Essence',
  Vial = 'Vial',
  // Deprecated
  Prophecy = 'Prophecy',
  Seed = 'Seed',
  Watchstone = 'Watchstone',
}

export const EXCHANGE_CATEGORIES = [
  ItemOverviewType.Wombgift,
  ItemOverviewType.Runegraft,
  ItemOverviewType.AllflameEmber,
  ItemOverviewType.Tattoo,
  ItemOverviewType.Omen,
  ItemOverviewType.DjinnCoin,
  ItemOverviewType.DivinationCard,
  ItemOverviewType.Artifact,
  ItemOverviewType.Oil,
  ItemOverviewType.Incubator,
  ItemOverviewType.DeliriumOrb,
  ItemOverviewType.Scarab,
  ItemOverviewType.Astrolabe,
  ItemOverviewType.Fossil,
  ItemOverviewType.Resonator,
  ItemOverviewType.Essence,
]

export const PATH_TYPE_MAP = {
  // General
  [ItemOverviewType.Wombgift]: 'wombgifts',
  [ItemOverviewType.Runegraft]: 'runegrafts',
  [ItemOverviewType.AllflameEmber]: 'allflame-embers',
  [ItemOverviewType.Tattoo]: 'tattoo',
  [ItemOverviewType.Omen]: 'omen',
  [ItemOverviewType.DjinnCoin]: 'djinn-coins',
  [ItemOverviewType.DivinationCard]: 'divinationcards',
  [ItemOverviewType.Artifact]: 'artifacts',
  [ItemOverviewType.Oil]: 'oils',
  [ItemOverviewType.Incubator]: 'incubators',
  // Equipment & Gems
  [ItemOverviewType.UniqueWeapon]: 'unique-weapons',
  [ItemOverviewType.UniqueArmour]: 'unique-armours',
  [ItemOverviewType.UniqueAccessory]: 'unique-accessories',
  [ItemOverviewType.UniqueFlask]: 'unique-flaks',
  [ItemOverviewType.UniqueJewel]: 'unique-jewels',
  [ItemOverviewType.ForbiddenJewel]: 'forbidden-jewels',
  [ItemOverviewType.UniqueTincture]: 'unique-tinctures',
  [ItemOverviewType.UniqueRelic]: 'unique-relics',
  [ItemOverviewType.SkillGem]: 'skill-gems',
  [ItemOverviewType.ClusterJewel]: 'cluster-jewels',
  // Atlas
  [ItemOverviewType.Map]: 'maps',
  [ItemOverviewType.BlightedMap]: 'blighted-maps',
  [ItemOverviewType.BlightRavagedMap]: 'blight-ravaged-maps',
  [ItemOverviewType.UniqueMap]: 'unique-maps',
  [ItemOverviewType.ValdoMap]: 'valdo-maps',
  [ItemOverviewType.DeliriumOrb]: 'delirium-orbs',
  [ItemOverviewType.Invitation]: 'invitations',
  [ItemOverviewType.Scarab]: 'scarabs',
  [ItemOverviewType.Astrolabe]: 'astrolabes',
  [ItemOverviewType.Memory]: 'memories',
  [ItemOverviewType.IncursionTemple]: 'temples',
  // Crafting
  [ItemOverviewType.Fossil]: 'fossils',
  [ItemOverviewType.Resonator]: 'resonators',
  [ItemOverviewType.Beast]: 'beats',
  [ItemOverviewType.Essence]: 'essences',
  [ItemOverviewType.Vial]: 'vials',
  // Deprecated
  [ItemOverviewType.Prophecy]: 'prophecies',
  [ItemOverviewType.Seed]: 'seeds',
  [ItemOverviewType.Watchstone]: 'watchstones',
}

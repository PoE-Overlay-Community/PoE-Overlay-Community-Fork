import { Query } from '@data/poe'
import { Language } from './language.type'
import { StatType } from './stat.type'

export interface Item {
  source?: string
  rarity?: ItemRarity
  category?: ItemCategory
  nameId?: string
  name?: string
  typeId?: string
  type?: string
  level?: ItemValue
  corrupted?: boolean
  mirrored?: boolean
  unmodifiable?: boolean
  unidentified?: boolean
  veiled?: boolean
  blighted?: boolean
  blightRavaged?: boolean
  relic?: boolean
  damage?: ItemWeaponDamage
  sockets?: ItemSocket[]
  properties?: ItemProperties
  requirements?: ItemRequirements
  stats?: ItemStat[]
  influences?: ItemInfluences
  note?: string
}

export interface ItemValue {
  text: string
  value?: number
  min?: number
  max?: number
  tier?: ItemValueTier
}

export interface ItemValueTier {
  min?: number
  max?: number
}

export enum ItemRarity {
  Normal = 'normal',
  Magic = 'magic',
  Rare = 'rare',
  Unique = 'unique',
  UniqueRelic = 'uniquefoil',
  Currency = 'currency',
  Gem = 'gem',
  DivinationCard = 'divinationcard',
  NonUnique = 'nonunique',
}

export enum ItemCategory {
  Weapon = 'weapon',
  WeaponOne = 'weapon.one',
  WeaponOneMelee = 'weapon.onemelee',
  WeaponTwoMelee = 'weapon.twomelee',
  WeaponBow = 'weapon.bow',
  WeaponClaw = 'weapon.claw',
  WeaponDagger = 'weapon.dagger',
  WeaponRunedagger = 'weapon.runedagger',
  WeaponOneAxe = 'weapon.oneaxe',
  WeaponOneMace = 'weapon.onemace',
  WeaponOneSword = 'weapon.onesword',
  WeaponSceptre = 'weapon.sceptre',
  WeaponStaff = 'weapon.staff',
  WeaponWarstaff = 'weapon.warstaff',
  WeaponTwoAxe = 'weapon.twoaxe',
  WeaponTwoMace = 'weapon.twomace',
  WeaponTwoSword = 'weapon.twosword',
  WeaponWand = 'weapon.wand',
  WeaponRod = 'weapon.rod',
  Armour = 'armour',
  ArmourChest = 'armour.chest',
  ArmourBoots = 'armour.boots',
  ArmourGloves = 'armour.gloves',
  ArmourHelmet = 'armour.helmet',
  ArmourShield = 'armour.shield',
  ArmourQuiver = 'armour.quiver',
  Accessory = 'accessory',
  AccessoryAmulet = 'accessory.amulet',
  AccessoryBelt = 'accessory.belt',
  AccessoryRing = 'accessory.ring',
  AccessoryTrinket = 'accessory.trinket',
  Gem = 'gem',
  GemActiveGem = 'gem.activegem',
  GemSupportGem = 'gem.supportgem',
  GemSupportGemplus = 'gem.supportgemplus',
  Jewel = 'jewel',
  JewelBase = 'jewel.base',
  JewelAbyss = 'jewel.abyss',
  JewelCluster = 'jewel.cluster',
  Flask = 'flask',
  Map = 'map',
  MapFragment = 'map.fragment',
  MapBreachstone = 'map.breachstone',
  MapInvitation = 'map.invitation',
  MapScarab = 'map.scarab',
  Leaguestone = 'leaguestone',
  MemoryLine = 'memoryline',
  Card = 'card',
  MonsterBeast = 'monster.beast',
  MonsterSample = 'monster.sample',
  HeistEquipment = 'heistequipment',
  HeistGear = 'heistequipment.heistweapon',
  HeistTool = 'heistequipment.heisttool',
  HeistCloak = 'heistequipment.heistutility',
  HeistBrooch = 'heistequipment.heistreward',
  HeistMission = 'heistmission',
  HeistContract = 'heistmission.contract',
  HeistBlueprint = 'heistmission.blueprint',
  ExpeditionLogbook = 'logbook',
  SanctumResearch = 'sanctum.research',
  SanctumRelic = 'sanctum.relic',
  AzmeriTincture = "azmeri.tincture",
  AzmeriCharm = "azmeri.charm",
  AzmeriCorpse = "azmeri.corpse",
  Currency = 'currency',
  CurrencyPiece = 'currency.piece',
  CurrencyResonator = 'currency.resonator',
  CurrencyFossil = 'currency.fossil',
  CurrencyIncubator = 'currency.incubator',
  CurrencyHeistTarget = 'currency.heistobjective',
  CurrencyOmen = 'currency.omen',
  CurrencyTattoo = 'currency.tattoo',

  // Deprecated (due to previous league mechanics not going core or being removed)
  CurrencySeed = 'currency.seed',
  CurrencyWildSeed = 'currency.wildseed',
  CurrencyVividSeed = 'currency.vividseed',
  CurrencyPrimalSeed = 'currency.primalseed',
  CurrencySeedBooster = 'currency.seedbooster',
  Watchstone = 'watchstone',
  Prophecy = 'prophecy',
}

// aka 'Mod Generation Type'
export enum StatGenType {
  Unknown = 0,
  Prefix = 1,
  Suffix = 2,
  // Others are omitted due to irrelevance.
}

export interface ItemWeaponDamage {
  dps?: ItemValue
  edps?: ItemValue
  pdps?: ItemValue
}

export enum ItemSocketColor {
  Any = '#',
  Red = 'R',
  Green = 'G',
  Blue = 'B',
  White = 'W',
  Abyss = 'A',
  Delve = 'DV',
}

export interface ItemSocket {
  color: ItemSocketColor
  linked: boolean
}

export interface ItemProperties {
  weaponPhysicalDamage?: ItemValueProperty
  weaponElementalDamage?: ItemValueProperty[]
  weaponChaosDamage?: ItemValueProperty
  weaponCriticalStrikeChance?: ItemValueProperty
  weaponAttacksPerSecond?: ItemValueProperty
  weaponRange?: ItemProperty
  shieldBlockChance?: ItemValueProperty
  armourArmour?: ItemValueProperty
  armourEvasionRating?: ItemValueProperty
  armourEnergyShield?: ItemValueProperty
  armourWard?: ItemValueProperty
  stackSize?: ItemValueProperty
  gemLevel?: ItemValueProperty
  gemQualityType?: ItemGemQualityType
  quality?: ItemValueProperty
  qualityType?: ItemQualityType
  gemExperience?: ItemValueProperty
  areaLevel?: ItemValueProperty
  mapTier?: ItemValueProperty
  mapQuantity?: ItemValueProperty
  mapRarity?: ItemValueProperty
  mapPacksize?: ItemValueProperty
  prophecyText?: string
  durability?: ItemValueProperty
  storedExperience?: ItemValueProperty
  ultimatum?: ItemPropertiesUltimatum
  incursion?: ItemPropertiesIncursion
  heist?: ItemPropertiesHeist
}

export interface ItemProperty {
  value: string
  augmented: boolean
}

export interface ItemValueProperty {
  value: ItemValue
  augmented: boolean
}

export enum ItemQualityType {
  Default = 0,
  ElementalDamage = 1,
  CasterModifiers = 2,
  AttackModifiers = 3,
  DefenceModifiers = 4,
  LifeAndManaModifiers = 5,
  ResistanceModifiers = 6,
  AttributeModifiers = 7,
}

export enum ItemGemQualityType {
  Default = 0,
  Anomalous = 1,
  Divergent = 2,
  Phantasmal = 3,
}

export interface ItemStat {
  id: string
  predicateIndex: number
  predicate: string
  tradeId: string
  mod: string
  negated: boolean
  genType?: StatGenType
  type: StatType
  values: ItemValue[]
  option: boolean
  indistinguishables: string[]
  relatedStats?: ItemStat[]
  modName?: string
}

export interface ItemRequirements {
  level?: number
  int?: number
  str?: number
  dex?: number
  class?: CharacterClass
}

export interface ItemInfluences {
  shaper?: boolean
  crusader?: boolean
  hunter?: boolean
  elder?: boolean
  redeemer?: boolean
  warlord?: boolean
  fractured?: boolean
  synthesised?: boolean
}

export interface ItemsMap {
  label: string
  items: Item[]
}

export enum CharacterClass {
  Scion = 'scion',
  Marauder = 'marauder',
  Ranger = 'ranger',
  Witch = 'witch',
  Duelist = 'duelist',
  Templar = 'templar',
  Shadow = 'shadow',
}

export enum UltimatumChallengeType {
  Exterminate = 'Exterminate',
  Survive = 'Survival',
  ProtectAltar = 'Defense',
  StandStoneCircles = 'Conquer',
}

export enum UltimatumRewardType {
  Currency = 'DoubleCurrency',
  DivCards = 'DoubleDivCards',
  MirroredRare = 'MirrorRare',
  UniqueItem = 'ExchangeUnique',
}

export interface ItemPropertiesUltimatum {
  challengeType?: UltimatumChallengeType
  rewardType?: UltimatumRewardType
  requiredItem?: string
  requiredItemAmount?: ItemValue
  rewardUnique?: string
}

export interface ItemPropertiesIncursion {
  openRooms: ItemPropertiesIncursionRoom[]
  closedRooms: ItemPropertiesIncursionRoom[]
}

export interface ItemPropertiesIncursionRoom {
  name: string
  stat: ItemStat
}

export interface ItemPropertiesHeist {
  requiredSkills: HeistSkillLevel[]
  objectiveName?: string
  objectiveValue?: HeistObjectiveValue
  wingsRevealed?: ItemValue
  escapeRoutes?: ItemValue
  rewardRooms?: ItemValue
}

export enum HeistObjectiveValue {
  Moderate = 1,
  High = 2,
  Precious = 3,
  Priceless = 4,
}

export enum HeistJob {
  Lockpicking = 0,
  BruteForce,
  Perception,
  Demolition,
  CounterThaumaturge,
  TrapDisarmament,
  Agility,
  Deception,
  Engineering,
}

export interface HeistSkillLevel {
  job: HeistJob
  level: ItemValue
}

export interface ExportedItem {
  sections: Section[]
}

export interface Section {
  content: string
  lines: string[]
}

export enum ItemSection {
  Corrupted,
  Mirrored,
  Unidentified,
  Influences,
  ItemLevel,
  Note,
  Properties,
  Rartiy,
  Requirements,
  Sockets,
  Stats,
  Veiled,
  Flask,
  Prophecy,
  Experience,
  Ultimatum,
  Relic,
  Incursion,
  Heist,
}

export interface ItemSectionParserService {
  section: ItemSection
  optional: boolean
  parse(item: ExportedItem, target: Item): Section | Section[]
}

export interface ItemSearchFiltersService {
  add(item: Item, language: Language, query: Query): void
}

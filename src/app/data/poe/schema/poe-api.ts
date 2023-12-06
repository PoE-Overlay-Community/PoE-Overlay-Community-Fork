import { ItemInfluences, ItemSocketColor } from '@shared/module/poe/type'

export interface TradeResponse<TResult> {
  result: TResult[]
}

export interface TradeItemsResult {
  label: TradeItemsResultLabel
  entries: TradeItemsEntry[]
}

export enum TradeItemsResultLabel {
  Accessories = 'Accessories',
  Armour = 'Armour',
  Cards = 'Cards',
  Currency = 'Currency',
  Flasks = 'Flasks',
  Gems = 'Gems',
  Jewels = 'Jewels',
  Maps = 'Maps',
  Weapons = 'Weapons',
  Leaguestones = 'Leaguestones',
  Prophecies = 'Prophecies',
  ItemisedMonsters = 'Itemised Monsters',
}

export interface TradeItemsEntry {
  name?: string
  type: string
  text: string
  disc?: string
  flags?: TradeItemsEntryFlags
}

export interface TradeItemsEntryFlags {
  unique?: boolean
  prophecy?: boolean
}

export interface TradeLeaguesResult {
  id: string
  text: string
  realm: string
}

export interface TradeStaticResult {
  id: TradeStaticResultId
  label?: string
  entries: TradeStaticResultEntry[]
}

export interface TradeStaticResultEntry {
  id: string
  text: string
  image?: string
}

export enum TradeStaticResultId {
  Currency = 'Currency',
  Splinters = 'Splinters',
  Fragments = 'Fragments',
  TaintedCurrency = 'TaintedCurrency',
  Expedition = 'Expedition',
  DeliriumOrbs = 'DeliriumOrbs',
  Catalysts = 'Catalysts',
  Oils = 'Oils',
  Incubators = 'Incubators',
  Scarabs = 'Scarabs',
  DelveResonators = 'DelveResonators',
  DelveFossils = 'DelveFossils',
  Essences = 'Essences',
  Cards = 'Cards',
  Prophecies = 'Prophecies',
  MapsTier1 = 'MapsTier1',
  MapsTier2 = 'MapsTier2',
  MapsTier3 = 'MapsTier3',
  MapsTier4 = 'MapsTier4',
  MapsTier5 = 'MapsTier5',
  MapsTier6 = 'MapsTier6',
  MapsTier7 = 'MapsTier7',
  MapsTier8 = 'MapsTier8',
  MapsTier9 = 'MapsTier9',
  MapsTier10 = 'MapsTier10',
  MapsTier11 = 'MapsTier11',
  MapsTier12 = 'MapsTier12',
  MapsTier13 = 'MapsTier13',
  MapsTier14 = 'MapsTier14',
  MapsTier15 = 'MapsTier15',
  MapsTier16 = 'MapsTier16',
  MapsBlighted = 'MapsBlighted',
  MapsUberBlighted = 'MapsUberBlighted',
  MapsUnique = 'MapsUnique',
  Misc = 'Misc',
}

export interface TradeStatsResult {
  label: TradeStatsResultLabel
  entries: TradeStatsResultResultEntry[]
}

export enum TradeStatsResultLabel {
  Pseudo = 'Pseudo',
  Explicit = 'Explicit',
  Implicit = 'Implicit',
  Fractured = 'Fractured',
  Enchant = 'Enchant',
  Crafted = 'Crafted',
  Veiled = 'Veiled',
  Monster = 'Monster',
  Delve = 'Delve',
  Ultimatum = 'Ultimatum',
  Scourge = 'Scourge',
  Crucible = 'Crucible',
  Sanctum = 'Sanctum',
}

export interface TradeStatsResultResultEntry {
  id?: string
  text?: string
  type?: string
}

//{"error":{"code":8,"message":"Unauthorized"}}
export interface ApiErrorResponse {
  error?: {
    code?: number
    message?: string
  }
}

//{"uuid":"[GUID]","name":"[ACC NAME]","realm":"pc","locale":"en_US","guild":{"name":"[GUILD NAME]"},"twitch":{"name":"[TWITCH ACC NAME]"}}
export interface ApiProfileResponse {
  uuid?: string
  name?: string
  realm?: string
  locale?: string
  guild?: ApiGuildEntry
  twitch?: ApiTwitchEntry
}

export interface ApiGuildEntry {
  name?: string
}

export interface ApiTwitchEntry {
  name?: string
}

export interface ApiCharacterResponse {
  name?: string
  league?: string
  classId?: number
  ascendancyClass?: number
  class?: string
  level?: number
  experience?: number
  lastActive?: boolean
}

export interface ApiStashTabNames {
  numTabs?: number
  tabs?: ApiTabEntry[]
}

export interface ApiStashTabItems {
  numTabs?: number
  quadLayout?: boolean
  items?: ApiStashItem[]
}

export interface ApiStashItem {
  verified: boolean
  name: string
  typeLine: string
  baseType: string
  ilvl: number
  w: number
  h: number
  icon: string
  support?: boolean
  league?: string
  id?: string
  influences?: ItemInfluences
  sockets?: ApiStashItemSocket[]
  socketedItems?: ApiStashItem[]
  identified?: boolean
  itemLevel?: number
  note?: string
  lockedToCharacter?: boolean
  lockedToAccount?: boolean
  duplicated?: boolean
  split?: boolean
  corrupted?: boolean
  cisRaceReward?: boolean
  seaRaceReward?: boolean
  thRaceReward?: boolean
  properties?: ApiStashItemProperty[]
  notableProperties?: ApiStashItemProperty[]
  requirements?: ApiStashItemProperty[]
  additionalProperties?: ApiStashItemProperty[]
  nextLevelRequirements?: ApiStashItemProperty[]
  talismanTier?: number
  secDesctrText?: string
  utilityMods?: string[]
  logbookMods?: ApiStashItemLogbookMod[]
  enchantMods: string[]
  implicitMods: string[]
  ultimatumMods: ApiStashItemUltimatumMod[]
  explicitMods?: string[]
  craftedMods?: string[]
  fracturedMods?: string[]
  cosmeticMods?: string[]
  veiledMods?: string[]
  veiled?: boolean
  descrText?: string
  flavourText?: string[]
  flavourTextParsed?: string[]
  prophecyText?: string
  isRelic?: boolean
  replica?: boolean
  incubatedItem?: ApiStashItemIncubatedItem
  frameType?: number
  artFilename?: string
  hybrid?: ApiStashItemHybrid
  extended?: ApiStashItemExtended
  x?: number
  y?: number
  inventoryId?: string
  socket?: number
  colour?: string
}

export interface ApiStashItemSocket {
  group?: number
  attr?: string
  sColour?: ItemSocketColor
}

export interface ApiStashItemProperty {
  name: string
  values: (string | number)[][]
  displayMode: number
  progress?: number
  type?: number
  suffix?: string
}

export interface ApiStashItemLogbookMod {
  name: string
  faction: ApiStashItemFaction
  mods?: string[]
}

export interface ApiStashItemFaction {
  id: string
  name: string
}

export interface ApiStashItemUltimatumMod {
  type: string
  tier?: number
}

export interface ApiStashItemIncubatedItem {
  name: string
  level: number
  process: number
  total: number
}

export interface ApiStashItemHybrid {
  baseTypeName: string
  isVallGem?: boolean
  properties?: ApiStashItemProperty[]
  explicitMods?: string[]
  secDescrText?: string
}

export interface ApiStashItemExtended {
  category: string
  subcategories: string[]
  prefixes?: number
  suffixes?: number
}

export enum ApiStashType {
  CurrencyStash = 'CurrencyStash',
  MapStash = 'MapStash',
  FragmentStash = 'FragmentStash',
  DivinationCardStash = 'DivinationCardStash',
  EssenceStash = 'EssenceStash',
  DelveStash = 'DelveStash',
  BlightStash = 'BlightStash',
  MetamorphStash = 'MetamorphStash',
  DeliriumStash = 'DeliriumStash',
  UniqueStash = 'UniqueStash',
  QuadStash = 'QuadStash',
  PremiumStash = 'PremiumStash',
}

export interface ApiTabEntry {
  n?: string
  i?: number
  id?: string
  type?: ApiStashType
  selected?: boolean
  colour?: {
    r?: number
    g?: number
    b?: number
  },
  srcL?: string
  srcC?: string
  srcR?: string
}

export interface FilterValueOption {
  option?: string | number
  min?: number
  max?: number
}

export interface FilterOption {
  option?: string
}

export interface FilterGroup<TFilter> {
  filters?: TFilter
}

export interface StatsFilter {
  id?: string
  value?: FilterValueOption
  disabled?: boolean
}

export interface StatsGroup {
  type?: string
  min?: number
  max?: number
  filters?: StatsFilter[]
}

export interface TypeFilters {
  category?: FilterOption
  rarity?: FilterOption
}

export interface WeaponFilters {
  damage?: FilterValueOption
  crit?: FilterValueOption
  pdps?: FilterValueOption
  aps?: FilterValueOption
  dps?: FilterValueOption
  edps?: FilterValueOption
}

export interface ArmourFilters {
  ar?: FilterValueOption
  ev?: FilterValueOption
  es?: FilterValueOption
  ward?: FilterValueOption
  block?: FilterValueOption
}

export interface FilterSocketValueOption extends FilterValueOption {
  r?: number
  g?: number
  b?: number
  w?: number
}

export interface SocketFilters {
  sockets?: FilterSocketValueOption
  links?: FilterSocketValueOption
}

export interface ReqFilters {
  lvl?: FilterValueOption
  str?: FilterValueOption
  dex?: FilterValueOption
  int?: FilterValueOption
  class?: FilterOption
}

export interface MapFilters {
  map_tier?: FilterValueOption
  map_packsize?: FilterValueOption
  map_iiq?: FilterValueOption
  map_iir?: FilterValueOption
  area_level?: FilterValueOption
  map_blighted?: FilterOption
  map_uberblighted?: FilterOption
  map_region?: FilterOption
  map_series?: FilterOption
}

export interface HeistFilters {
  heist_wings?: FilterValueOption
  heist_max_wings?: FilterValueOption
  heist_escape_routes?: FilterValueOption
  heist_max_escape_routes?: FilterValueOption
  heist_reward_rooms?: FilterValueOption
  heist_max_reward_rooms?: FilterValueOption
  heist_objective_value?: FilterOption
  heist_lockpicking?: FilterValueOption
  heist_brute_force?: FilterValueOption
  heist_perception?: FilterValueOption
  heist_demolition?: FilterValueOption
  heist_counter_thaumaturgy?: FilterValueOption
  heist_trap_disarmament?: FilterValueOption
  heist_agility?: FilterValueOption
  heist_deception?: FilterValueOption
  heist_engineering?: FilterValueOption
}

export interface UltimatumFilters {
  ultimatum_challenge?: FilterOption
  ultimatum_reward?: FilterOption
  ultimatum_input?: FilterOption
  ultimatum_output?: FilterOption
}

export interface MiscFilters {
  quality?: FilterValueOption
  ilvl?: FilterValueOption
  gem_level?: FilterValueOption
  gem_level_progress?: FilterValueOption
  gem_alternate_quality?: FilterOption
  fractured_item?: FilterOption
  synthesised_item?: FilterOption
  alternate_art?: FilterOption
  identified?: FilterOption
  corrupted?: FilterOption
  mirrored?: FilterOption
  crafted?: FilterOption
  veiled?: FilterOption
  enchanted?: FilterOption
  talisman_tier?: FilterValueOption
  stored_experience?: FilterValueOption
  stack_size?: FilterValueOption
  durability?: FilterValueOption
}

export interface TradeFilters {
  price?: FilterOption
  sale_type?: FilterOption
  indexed?: FilterOption
}

export interface TradeFilterGroup extends FilterGroup<TradeFilters> {
  disabled?: boolean
}

export interface Filters {
  type_filters?: FilterGroup<TypeFilters>
  weapon_filters?: FilterGroup<WeaponFilters>
  armour_filters?: FilterGroup<ArmourFilters>
  socket_filters?: FilterGroup<SocketFilters>
  req_filters?: FilterGroup<ReqFilters>
  map_filters?: FilterGroup<MapFilters>
  heist_filters?: FilterGroup<HeistFilters>
  ultimatum_filters?: FilterGroup<UltimatumFilters>
  misc_filters?: FilterGroup<MiscFilters>
  trade_filters?: TradeFilterGroup
}

export interface Query {
  status?: FilterOption
  name?: FilterOptionDiscriminator
  type?: FilterOptionDiscriminator
  term?: string
  stats?: StatsGroup[]
  filters?: Filters
}

export interface FilterOptionDiscriminator extends FilterOption {
  discriminator?: string
}

export interface Exchange {
  status?: FilterOption
  want?: string[]
  have?: string[]
}

export enum ExchangeEngine {
  Legacy = 'legacy',// Note: no longer supported by GGG since 17/05/2022
  New = 'new'
}

export interface Sort {
  price?: string
}

export interface TradeSearchRequest {
  query: Query
  sort: Sort
}

export interface SearchResponse {
  searchType: TradeSearchType
  id: string
  url: string
  total: number
}

export interface TradeSearchResponse extends SearchResponse {
  result: string[]
}

export interface ExchangeSearchResponse extends SearchResponse {
  result: {
    [key: string]: ExchangeFetchResult
  }
}

export interface ExchangeSearchRequest {
  exchange: Exchange
  engine: ExchangeEngine
}

export interface TradeFetchResultPrice {
  type: string
  amount: number
  currency: string
}

export interface TradeFetchResultAccount {
  name: string
}

export interface TradeFetchResultListing {
  indexed: string
  price: TradeFetchResultPrice
  account: TradeFetchResultAccount
}

interface TradeFetchResultItem {
  note?: string
}

export interface TradeFetchResult {
  id: string
  listing: TradeFetchResultListing
  item: TradeFetchResultItem
}

export interface ExchangeResultItem {
  currency: string
  amount: number
}

export interface ExchangeResultItemStock extends ExchangeResultItem {
  id: string
  stock: number
}

export interface ExchangeResultOffer {
  exchange: ExchangeResultItem
  item: ExchangeResultItemStock
}

export interface ExchangeResultListing {
  indexed: string
  account: TradeFetchResultAccount
  offers: ExchangeResultOffer[]
}

export interface ExchangeFetchResult {
  id: string
  listing: ExchangeResultListing
}

export enum TradeSearchType {
  NormalTrade = 'search',
  BulkExchange = 'exchange',
}

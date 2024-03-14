import { Injectable } from '@angular/core'
import { environment } from '@env/environment'
import { Item, ItemCategory, ItemRarity, Language } from '../../type'
import { ContextService } from '../context.service'
import { ItemService } from './item.service'

const CATEGORY_CN_MAP = {
  [ItemCategory.ArmourBoots]: 'Boots',
  [ItemCategory.ArmourChest]: 'Body Armour',
  [ItemCategory.ArmourGloves]: 'Gloves',
  [ItemCategory.ArmourHelmet]: 'Helmet',
  [ItemCategory.ArmourQuiver]: 'Quiver',
  [ItemCategory.ArmourShield]: 'Shield',
  [ItemCategory.AccessoryAmulet]: 'Amulet',
  [ItemCategory.AccessoryBelt]: 'Belt',
  [ItemCategory.AccessoryRing]: 'Ring',
  [ItemCategory.AccessoryTrinket]: 'Trinket',
  [ItemCategory.WeaponBow]: 'Bow',
  [ItemCategory.WeaponClaw]: 'Claw',
  [ItemCategory.WeaponDagger]: 'Dagger',
  [ItemCategory.WeaponRunedagger]: 'Rune Dagger',
  [ItemCategory.WeaponOneAxe]: 'One Hand Axe',
  [ItemCategory.WeaponOneMace]: 'One Hand Mace',
  [ItemCategory.WeaponOneSword]: 'One Hand Sword',
  [ItemCategory.WeaponSceptre]: 'Sceptre',
  [ItemCategory.WeaponStaff]: 'Staff',
  [ItemCategory.WeaponWarstaff]: 'Warstaff',
  [ItemCategory.WeaponTwoAxe]: 'Two Hand Axe',
  [ItemCategory.WeaponTwoMace]: 'Two Hand Mace',
  [ItemCategory.WeaponTwoSword]: 'Two Hand Sword',
  [ItemCategory.WeaponWand]: 'Wand',
  [ItemCategory.WeaponRod]: 'FishingRod',
  [ItemCategory.Map]: 'Map',
  [ItemCategory.HeistContract]: 'HeistContract',
  [ItemCategory.HeistBlueprint]: 'HeistBlueprint',
}

const GENERIC_CN = 'BaseItemTypes'

const LANGUAGE_MAPPING = {
  [Language.English]: 'us',
  [Language.French]: 'fr',
  [Language.German]: 'de',
  [Language.Korean]: 'kr',
  [Language.Portuguese]: 'pt',
  [Language.Russian]: 'ru',
  [Language.Spanish]: 'sp',
  [Language.Thai]: 'th',
  // [Language.SimplifiedChinese]: 'cn',
  [Language.TraditionalChinese]: 'tw',
  [Language.Japanese]: 'jp',
}

@Injectable({
  providedIn: 'root',
})
export class ItemExternalService {
  constructor(
    private readonly context: ContextService,
    private readonly itemService: ItemService
  ) {}

  public getDbUrl(item: Item, language?: Language): string {
    language = language || this.context.get().gameLanguage || this.context.get().language

    const { typeId, nameId, rarity, category } = item

    let cn = CATEGORY_CN_MAP[category]
    const url = environment.poedb.baseUrl.replace('{country}', LANGUAGE_MAPPING[language])
    if (rarity === ItemRarity.Rare) {
      let tags = undefined

      if (!!cn) {
        const base = category.split('.')[0]
        if (typeId.includes('StrDexInt')) {
          tags = `str_dex_int_${base}`
        } else if (typeId.includes('StrInt')) {
          tags = `str_int_${base}`
        } else if (typeId.includes('StrDex')) {
          tags = `str_dex_${base}`
        } else if (typeId.includes('DexInt')) {
          tags = `dex_int_${base}`
        } else if (typeId.includes('Dex')) {
          tags = `dex_${base}`
        } else if (typeId.includes('Str')) {
          tags = `str_${base}`
        } else if (typeId.includes('Int')) {
          tags = `int_${base}`
        }
      } else {
        cn = GENERIC_CN
      }

      let itemDetailUrl = `${url}/mod.php?cn=${encodeURIComponent(cn)}`
      if (tags) {
        itemDetailUrl += `&tags=${encodeURIComponent(tags)}`
      } else {
        const an = this.getIdentifier(nameId, typeId)
        itemDetailUrl += `&an=${encodeURIComponent(an)}`
      }
      return itemDetailUrl
    }

    const q = this.getIdentifier(nameId, typeId)
    const itemUrl = `${url}/search?q=${encodeURIComponent(q)}`
    return itemUrl
  }

  public getWikiUrl(item: Item): string {
    const { nameId, typeId } = item
    const search = this.getIdentifier(nameId, typeId)
    const url = `${environment.wiki.baseUrl}/w/index.php?search=${encodeURIComponent(search)}`
    return url
  }

  private getIdentifier(nameId: string, typeId: string): string {
    const name = this.itemService.getName(nameId, Language.English)
    if (name && name.length) {
      return name
    }
    return this.itemService.getType(typeId, Language.English)
  }
}

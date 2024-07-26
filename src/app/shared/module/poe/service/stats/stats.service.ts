import { Injectable } from '@angular/core'
import { StatsLocalProvider } from '../../provider/stats-local.provider'
import { StatsIndistinguishableProvider } from '../../provider/stats-indistinguishable.provider'
import { StatsProvider } from '../../provider/stats.provider'
import { ItemStat, Language, Stat, StatGenType, StatType } from '../../type'
import { ContextService } from '../context.service'
import { ClientStringService } from '../client-string/client-string.service'

export interface StatsSearchResult {
  stat: ItemStat
  match: StatsSectionText
}

export interface StatsSearchOptions {
  ultimatum?: boolean
  sanctum?: boolean
  map?: boolean
  // The options below must match the ones used in stats-local.json
  local_poison_on_hit__?: boolean
  local_minimum_added_physical_damage_local_maximum_added_physical_damage?: boolean
  local_minimum_added_fire_damage_local_maximum_added_fire_damage?: boolean
  local_minimum_added_cold_damage_local_maximum_added_cold_damage?: boolean
  local_minimum_added_lightning_damage_local_maximum_added_lightning_damage?: boolean
  local_minimum_added_chaos_damage_local_maximum_added_chaos_damage?: boolean
  local_attack_speed___?: boolean
  local_base_physical_damage_reduction_rating?: boolean
  local_physical_damage_reduction_rating___?: boolean
  local_base_evasion_rating?: boolean
  local_evasion_rating___?: boolean
  local_energy_shield?: boolean
  local_accuracy_rating?: boolean
  local_mana_leech_from_physical_damage_permyriad?: boolean
  local_life_leech_from_physical_damage_permyriad?: boolean
  local_critical_strike_chance___?: boolean
  critical_strike_chance___?: boolean
}

interface StatsSectionText {
  index: number
  text: string
}

interface StatsSectionsSearch {
  types: StatType[]
  sections: StatsSectionText[]
}

interface StatMatch {
  tradeId: string
  statDescIndex: number
  sectionText: string
  match: RegExpExecArray
}

const REVERSE_REGEX = /\\[.*+?^${}()|[\]\\]/g
const VALUE_PLACEHOLDER = '(\\S+)'
const TYPE_PLACEHOLDER_REGEX = / \(implicit\)| \(fractured\)| \(crafted\)| \(enchant\)| \(scourge\)| \(crucible\)/
const SCOURGE_PLACEHOLDER_REGEX = / \(scourge\)$/
const CRUCIBLE_PLACEHOLDER_REGEX = / \(crucible\)$/

@Injectable({
  providedIn: 'root',
})
export class StatsService {
  private readonly cache: {
    [key: string]: RegExp
  } = {}

  constructor(
    private readonly context: ContextService,
    private readonly statsProvider: StatsProvider,
    private readonly statsLocalProvider: StatsLocalProvider,
    private readonly statsIndistinguishableProvider: StatsIndistinguishableProvider,
    private readonly clientStringService: ClientStringService,
  ) {}

  public translate(stat: Stat, statDescIndex: number, language?: Language): string {
    language = language || this.context.get().gameLanguage || this.context.get().language

    if (!stat.text[language] || statDescIndex < 0 || statDescIndex >= stat.text[language].length) {
      return `untranslated: '${stat.id}' for language: '${Language[language]}'`
    }

    const statDesc = stat.text[language][statDescIndex]
    const regex = statDesc[Object.getOwnPropertyNames(statDesc)[0]]
    return regex
      .slice(1, regex.length - 1)
      .split(VALUE_PLACEHOLDER)
      .map((part) =>
        part
          .split('\n')
          .map((p) =>
            p
              .replace(REVERSE_REGEX, (value) => value.replace('\\', ''))
              .replace(TYPE_PLACEHOLDER_REGEX, '')
          )
          .join('\n')
      )
      .join('#')
  }

  public transform(stat: ItemStat, language?: Language): string[] {
    language = language || this.context.get().gameLanguage || this.context.get().language

    const stats = this.statsProvider.provide(stat.type)
    const tradeStat = stats[stat.tradeId]
    const localStat = tradeStat?.text[language]
    if (
      !tradeStat ||
      !localStat ||
      stat.predicateIndex < 0 ||
      stat.predicateIndex >= localStat.length
    ) {
      return [`untranslated: '${stat.type}.${stat.tradeId}' for language: '${Language[language]}'`]
    }

    const statDesc = localStat[stat.predicateIndex]
    if (!statDesc) {
      return [
        `untranslated: '${stat.type}.${stat.tradeId}' (predicate '${stat.predicate}') for language: '${Language[language]}'`,
      ]
    }

    const result = statDesc[Object.getOwnPropertyNames(statDesc)[0]]
    return result
      .slice(1, result.length - 1)
      .split(VALUE_PLACEHOLDER)
      .map((part) =>
        part
          .split('\n')
          .map((p) =>
            p
              .replace(REVERSE_REGEX, (value) => value.replace('\\', ''))
              .replace(TYPE_PLACEHOLDER_REGEX, '')
          )
          .join('\n')
      )
  }

  public search(
    text: string,
    options?: StatsSearchOptions,
    language?: Language
  ): StatsSearchResult {
    return this.searchMultiple([text], options, language)[0]
  }

  public searchMultiple(
    texts: string[],
    options?: StatsSearchOptions,
    language?: Language
  ): StatsSearchResult[] {
    language = language || this.context.get().gameLanguage || this.context.get().language
    options = options || {}

    const { scourgedSearch, implicitsSearch, explicitsSearch, crucibleSearch } = this.buildSearch(texts, options)

    const results: StatsSearchResult[] = []
    if (scourgedSearch.sections.length > 0) {
      this.executeSearch(scourgedSearch, options, language, results)
    }

    if (implicitsSearch.sections.length > 0) {
      this.executeSearch(implicitsSearch, options, language, results)
    }

    if (explicitsSearch.sections.length > 0) {
      this.executeSearch(explicitsSearch, options, language, results)
    }

    if (crucibleSearch.sections.length > 0) {
      this.executeSearch(crucibleSearch, options, language, results)
    }

    return results
  }

  public searchExactInType(
    text: string,
    statTypesToSearch: StatType[],
    language?: Language
  ): ItemStat {
    language = language || this.context.get().gameLanguage || this.context.get().language

    let result: ItemStat

    for (const type of statTypesToSearch) {
      const stats = this.statsProvider.provide(type)
      for (const tradeId in stats) {
        if (!stats.hasOwnProperty(tradeId)) {
          continue
        }

        const stat = stats[tradeId]
        const statDescs = stat.text[language]
        statDescs.forEach((statDesc, statDescIndex) => {
          if (result) {
            return
          }
          const predicate = Object.getOwnPropertyNames(statDesc)[0]
          const regex = statDesc[predicate]
          if (!regex.length) {
            return
          }

          const key = `${type}_${tradeId}_${statDescIndex}`
          const expr = this.cache[key] || (this.cache[key] = new RegExp(regex, 'm'))
          const test = expr.exec(text)

          if (!test) {
            return
          }

          result = {
            id: stat.id,
            mod: stat.mod,
            option: stat.option,
            negated: stat.negated,
            predicateIndex: statDescIndex,
            predicate,
            type,
            tradeId,
            values: test.slice(1).map((x) => ({ text: x })),
            indistinguishables: undefined,
          }
        })
      }
    }

    return result
  }

  private executeSearch(
    search: StatsSectionsSearch,
    options: StatsSearchOptions,
    language: Language,
    results: StatsSearchResult[]
  ): void {
    // Sanitize sections (i.e. remove some advanced mod stuff we currently don't use at all)
    for (let index = search.sections.length - 1; index >= 0; --index) {
      const section = search.sections[index]
      // Ignore anything between the special hyphen and the first open-bracket (or the rest of the text if no bracket exists) [e.g. ' — Unscalable Value' or ' — Unscalable Value (implicit)']
      section.text = section.text.split('\n').map(statLine => {
        if (statLine.startsWith('{')) {
          return statLine
        }
        const splitted = statLine.split(' — ')
        let statText = splitted[0]
        const unscalableText = splitted[1]
        if (unscalableText && unscalableText.indexOf('(') !== -1) {
          // Extract the text found in brackets at the end of the unscalable text and append it (including brackets) to the stat text
          const splitted2 = unscalableText.split('(')
          statText += ' (' + splitted2[1]
        }
        return statText
      }).join('\n')
    }

    // Compose Stat Gen Type Regexes
    const prefixRegex = `^\{ ${this.clientStringService.translate('ModDescriptionLinePrefix', language).replace('{0}', '.*')}`
    const craftedPrefixRegex = `^\{ ${this.clientStringService.translate('ModDescriptionLineCraftedPrefix', language).replace('{0}', '.*')}`
    const suffixRegex = `^\{ ${this.clientStringService.translate('ModDescriptionLineSuffix', language).replace('{0}', '.*')}`
    const craftedSuffixRegex = `^\{ ${this.clientStringService.translate('ModDescriptionLineCraftedSuffix', language).replace('{0}', '.*')}`

    // Perform the search
    for (const type of search.types) {
      const stats = this.statsProvider.provide(type)
      const locals = this.statsLocalProvider.provide(type)
      const indistinguishableStats = this.statsIndistinguishableProvider.provide(type) || {}

      for (let index = search.sections.length - 1; index >= 0; --index) {
        const section = search.sections[index]

        // Gather all possible matching stats
        const matchingStats: StatMatch[] = []
        for (const tradeId in stats) {
          if (!stats.hasOwnProperty(tradeId)) {
            continue
          }

          const stat = stats[tradeId]

          const statDescs = stat.text[language]
          statDescs.forEach((statDesc, statDescIndex) => {
            const predicate = Object.getOwnPropertyNames(statDesc)[0]
            const regex = statDesc[predicate]
            if (!regex.length) {
              return
            }

            const key = `${type}_${tradeId}_${statDescIndex}`
            const expr = this.cache[key] || (this.cache[key] = new RegExp(regex, 'm'))
            const test = expr.exec(section.text)

            if (!test) {
              return
            }

            // Check if we're explicitly dealing with maps and map mods
            if (stat.mod === 'maps' && !options.map) {
              return
            }

            const getKey = (id: string) => {
              return id.split(' ').join('_').split('%').join('_').split('+').join('_')
            }

            const indistinguishables = indistinguishableStats[tradeId]

            const localKey = getKey(stat.id || '')
            if (locals[localKey] && !indistinguishables) {
              const optId = locals[localKey]
              const isLocalStat = stat.mod === 'local'
              const isLocalOption = locals[localKey].startsWith('local_')
              const localOptId = isLocalOption ? optId : locals[optId]
              let globalOptId = locals[localOptId]

              // Global vs Local stat approach:
              //   All stats are considered global, unless marked as local in the options and the global isn't present or marked false
              if (
                (isLocalStat && !options[localOptId]) ||
                (!isLocalStat && !options[globalOptId] && options[localOptId])
              ) {
                return
              }
            }

            const sectionText = test[0]

            const matchingStatIndex = matchingStats.findIndex(x => x.sectionText == sectionText)
            if (matchingStatIndex !== -1) {
              const matchingStat = matchingStats[matchingStatIndex]
              // Lower index takes priority
              if (statDescIndex >= matchingStat.statDescIndex) {
                return
              } else {
                matchingStats.splice(matchingStatIndex, 1)
              }
            }

            matchingStats.push({
              tradeId: tradeId,
              statDescIndex: statDescIndex,
              sectionText: test[0],
              match: test,
            })
          })
        }

        matchingStats.forEach(matchingStat => {
          const { tradeId, statDescIndex, match } = matchingStat
          const stat = stats[tradeId]
          const statDescs = stat.text[language]
          const statDesc = statDescs[statDescIndex]
          const predicate = Object.getOwnPropertyNames(statDesc)[0]
          const indistinguishables = indistinguishableStats[tradeId]

          const key = `${type}_${tradeId}_${statDescIndex}`
          const expr = this.cache[key]

          const sectionText = match[0]
          let matchedText = sectionText
          let matchedIndex = statDescIndex
          let matchedPredicate = predicate

          // Strip advanced mod values (located within brackets after the actual value) by splitting on the opening-bracket and taking the first element only
          let matchedValues = match.slice(1).map((x) => ({ text: x.split('(')[0] }))

          // Check if your predicate uses a single number
          // (e.g. '1 Added Passive Skill is a Jewel Socket' or 'Bow Attacks fire an additional Arrow')
          if (matchedPredicate === '1' && stat.option !== true) {
            // Check if the 'next' predicate is an 'any' ('#') number predicate, if it is, then use it accordingly
            const nextIndex = statDescIndex + 1
            const nextStatDesc = statDescs[nextIndex]
            if (nextStatDesc) {
              const nextStatPredicate = Object.getOwnPropertyNames(nextStatDesc)[0]
              if (nextStatPredicate.indexOf('#') !== -1) {
                matchedIndex = nextIndex
                matchedPredicate = nextStatPredicate
                matchedText = nextStatDesc[nextStatPredicate]
                matchedValues = [{ text: '1' }]
              }
            }
          }

          // Determine the Stat Gen Type based on the previous line (which contains advanced mod info)
          let genType = StatGenType.Unknown
          let modName: string = undefined
          const lines = section.text.split('\n')
          const lineIdx = lines.indexOf(matchedText.split('\n')[0])
          let prevLineIdx = lineIdx - 1
          while (prevLineIdx >= 0) {
            const prevLine = lines[prevLineIdx]
            if (prevLine.length === 0) {
              prevLineIdx--
              continue
            }

            // Determine the Stat Gen Type
            if (prevLine.match(prefixRegex) || prevLine.match(craftedPrefixRegex)) {
              genType = StatGenType.Prefix
            } else if (prevLine.match(suffixRegex) || prevLine.match(craftedSuffixRegex)) {
              genType = StatGenType.Suffix
            }

            // Determine the Mod Name
            const modNameSplit = prevLine.split("\"")
            if (modNameSplit.length >= 3) {
              modName = modNameSplit[1]
            }

            // Found the info -> break out of the loop
            break
          }

          const itemStat: ItemStat = {
            id: stat.id,
            mod: stat.mod,
            option: stat.option,
            negated: stat.negated,
            genType,
            predicateIndex: matchedIndex,
            predicate: matchedPredicate,
            type,
            tradeId,
            values: matchedValues,
            indistinguishables,
            modName,
          }
          results.push({
            stat: itemStat,
            match: { index: section.index, text: matchedText },
          })

          const length = section.text.length
          if (section.text[expr.lastIndex] === '\n') {
            section.text = section.text.replace(`${sectionText}\n`, '')
          }
          if (section.text.length === length) {
            section.text = section.text.replace(`${sectionText}`, '')
          }
          if (section.text.trim().length === 0) {
            search.sections.splice(index, 1)
          }
        })
        if (matchingStats.length > 0 && section.text.trim().length !== 0) {
          // one or more stats were succesfully found & added, but the same stat(s) might occur more than once in the same section -> increased index to search this section again.
          index++
        }
      }

      if (search.sections.length === 0) {
        return
      }
    }
  }

  private buildSearch(
    texts: string[],
    options?: StatsSearchOptions
  ): {
    scourgedSearch: StatsSectionsSearch
    implicitsSearch: StatsSectionsSearch
    explicitsSearch: StatsSectionsSearch
    crucibleSearch: StatsSectionsSearch
  } {
    const implicitPhrase = ` (${StatType.Implicit})`
    const implicitsSearch: StatsSectionsSearch = {
      types: [StatType.Implicit],
      sections: [],
    }
    const scourgePhrase = ` (${StatType.Scourge})`
    const scourgedSearch: StatsSectionsSearch = {
      types: [StatType.Scourge],
      sections: [],
    }
    const enchantPhrase = ` (${StatType.Enchant})`
    const craftedPhrase = ` (${StatType.Crafted})`
    const fracturedPhrase = ` (${StatType.Fractured})`
    const explicitsSearch: StatsSectionsSearch = {
      types: [StatType.Explicit],
      sections: [],
    }
    if (options.ultimatum) {
      explicitsSearch.types.push(StatType.Ultimatum)
    }
    if (options.sanctum) {
      explicitsSearch.types.push(StatType.Sanctum)
    }
    const cruciblePhrase = ` (${StatType.Crucible})`
    const crucibleSearch: StatsSectionsSearch = {
      types: [StatType.Crucible],
      sections: [],
    }
    texts.forEach((text, index) => {
      if (text.indexOf(scourgePhrase) !== -1) {
        // scourge stats have their own section
        scourgedSearch.sections.push({
          index,
          text: text.split('\n').map(x => x.replace(SCOURGE_PLACEHOLDER_REGEX, '')).join('\n')
        })
      } else if (text.indexOf(cruciblePhrase) !== -1) {
        // crucible stats have their own section
        crucibleSearch.sections.push({
          index,
          text,
        })
      } else {
        const section: StatsSectionText = {
          index,
          text,
        }
        if (text.indexOf(implicitPhrase) !== -1) {
          // implicits have there own section
          implicitsSearch.sections.push(section)
        } else {
          const hasEnchants = text.indexOf(enchantPhrase) !== -1
          if (hasEnchants) {
            if (explicitsSearch.types.indexOf(StatType.Enchant) === -1) {
              explicitsSearch.types.push(StatType.Enchant)
            }
          }

          const hasCrafted = text.indexOf(craftedPhrase) !== -1
          if (hasCrafted) {
            if (explicitsSearch.types.indexOf(StatType.Crafted) === -1) {
              explicitsSearch.types.push(StatType.Crafted)
            }
          }

          const hasFractured = text.indexOf(fracturedPhrase) !== -1
          if (hasFractured) {
            if (explicitsSearch.types.indexOf(StatType.Fractured) === -1) {
              explicitsSearch.types.push(StatType.Fractured)
            }
          }

          explicitsSearch.sections.push(section)
        }
      }
    })
    return { scourgedSearch, implicitsSearch, explicitsSearch, crucibleSearch }
  }
}

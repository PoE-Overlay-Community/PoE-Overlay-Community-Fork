export enum StatType {
  Pseudo = 'pseudo',
  Explicit = 'explicit',
  Implicit = 'implicit',
  Crafted = 'crafted',
  Fractured = 'fractured',
  Enchant = 'enchant',
  Veiled = 'veiled',
  Ultimatum = 'ultimatum',
  Scourge = 'scourge',
  Crucible = 'crucible',
  Sanctum = 'sanctum',
}

export interface Stat {
  id?: string
  mod?: string
  negated?: boolean
  text: {
    [language: number]: StatDesc[]
  }
  option?: boolean
}

export interface StatDesc {
  [predicate: string]: string
}

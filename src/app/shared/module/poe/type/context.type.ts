import { Language } from './language.type'

export type Context = {
  language: Language
  gameLanguage?: Language
  leagueId?: string
}

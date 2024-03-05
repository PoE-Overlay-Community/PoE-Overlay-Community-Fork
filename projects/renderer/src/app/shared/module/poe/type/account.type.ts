export type PoEAccount = {
  loggedIn: boolean
  name?: string
  characters?: PoECharacter[]
}

export type PoECharacter = {
  name: string
  leagueId?: string
  level?: number
  experience?: number
  lastActive?: boolean
}

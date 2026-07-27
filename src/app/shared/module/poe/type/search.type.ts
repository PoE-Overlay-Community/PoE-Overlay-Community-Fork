import { Language } from './language.type'

export enum ItemSearchIndexed {
  AnyTime = 'any',
  UpToAnHourAgo = '1hour',
  UpTo3HoursAgo = '3hours',
  UpTo12HoursAgo = '12hours',
  UpToADayAgo = '1day',
  UpTo3DaysAgo = '3days',
  UpToAWeekAgo = '1week',
  UpTo2WeeksAgo = '2weeks',
  UpTo1MonthAgo = '1month',
  UpTo2MonthsAgo = '2months',
}

export enum ItemSearchStatus {
  Online = 'online',//In Person (Online)
  InLeague = 'onlineleague',//In Person (Online in League)
  Securable = 'securable',//Instant Buyout
  Available = 'available',//Instant Buyout and In Person
  Any = 'any',
}
export interface ItemSearchOptions {
  status?: ItemSearchStatus
  indexed?: ItemSearchIndexed
  leagueId?: string
  language?: Language
}

export interface ExchangeOverviewResponse {
  core: ExchangeCore
  lines: ExchangeOverviewLine[]
  items: ExchangeOverviewItem[]
  url: string
}

export interface ExchangeCore {
  items: ExchangeOverviewItem[]
  rates: {
    [key: string]: number
  }
  primary: string
  secondary: string
}

export interface ExchangeOverviewLine {
  id: string
  primaryValue: number
  volumePrimaryValue: number
  maxVolumeCurrency: string
  maxVolumeRate: number
  sparkline: SparkLine
}

export interface ExchangeOverviewItem {
  id: string
  name: string
}

export interface SparkLine {
  data: number[]
  totalChange: number
}

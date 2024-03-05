export interface ItemPricePredictionResponse {
  min: number
  max: number
  currency: 'chaos' | 'exalt' | 'divine'
  warning_msg: string
  error_msg: string
  pred_confidence_score: number
}

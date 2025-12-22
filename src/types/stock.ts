export interface StockPriceData {
  date: Date
  open: number
  close: number
  high: number
  low: number
  volume: number
}

export interface NewsItem {
  title: string
  description: string
  url: string
  publishedAt: string
  source: string
}

export type ValuationStatus = 'UNDERVALUED' | 'FAIR' | 'OVERVALUED'

export interface Fundamentals {
  dividendYieldPct: number | null
  dividendPerShare: number | null
  peRatio: number | null
  forwardPE: number | null
  earningsGrowth: number | null
  revenueGrowth: number | null
  dcfValue: number | null
  notes: string
}

export interface StockAnalysis {
  symbol: string
  intrinsicValue: number
  currentPrice: number
  valuationStatus: ValuationStatus
  analysisSummary: string
  technicalIndicators: {
    sma20: number | null
    sma50: number | null
    sma200: number | null
    rsi: number
    volumeSpike: boolean
    volumeRatio: number
  }
  priceMovement: {
    absolute: number
    percentage: number
    trend: 'up' | 'down' | 'neutral'
    periods?: {
      '1d': { absolute: number; percentage: number; trend: 'up' | 'down' | 'neutral' }
      '7d': { absolute: number; percentage: number; trend: 'up' | 'down' | 'neutral' }
      '30d': { absolute: number; percentage: number; trend: 'up' | 'down' | 'neutral' }
      '1y': { absolute: number; percentage: number; trend: 'up' | 'down' | 'neutral' }
    }
  }
  recentNews?: NewsItem[]
  fundamentals?: Fundamentals
}


export interface PriceData {
  date: Date
  open: number
  close: number
  high: number
  low: number
  volume: number
}

export function calculateSMA(data: PriceData[], period: number): number[] {
  const sma: number[] = []
  
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((acc, d) => acc + d.close, 0)
    sma.push(sum / period)
  }
  
  return sma
}

export function calculateRSI(data: PriceData[], period: number = 14): number {
  if (data.length < period + 1) {
    return 50 // Neutral RSI if not enough data
  }
  
  const changes = []
  for (let i = 1; i < data.length; i++) {
    changes.push(data[i].close - data[i - 1].close)
  }
  
  const gains = changes.filter(c => c > 0)
  const losses = changes.filter(c => c < 0).map(c => Math.abs(c))
  
  const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / period : 0
  const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / period : 0
  
  if (avgLoss === 0) {
    return 100
  }
  
  const rs = avgGain / avgLoss
  const rsi = 100 - (100 / (1 + rs))
  
  return Math.round(rsi * 100) / 100
}

export function detectVolumeSpike(data: PriceData[]): { isSpike: boolean; ratio: number } {
  if (data.length < 2) {
    return { isSpike: false, ratio: 1 }
  }
  
  const recentVolume = data[data.length - 1].volume
  const avgVolume = data.slice(0, -1).reduce((sum, d) => sum + d.volume, 0) / (data.length - 1)
  
  const ratio = recentVolume / avgVolume
  
  return {
    isSpike: ratio > 1.5, // 50% above average
    ratio: Math.round(ratio * 100) / 100,
  }
}

export function calculatePriceChange(data: PriceData[]): {
  absolute: number
  percentage: number
  trend: 'up' | 'down' | 'neutral'
} {
  if (data.length < 2) {
    return { absolute: 0, percentage: 0, trend: 'neutral' }
  }
  
  const first = data[0].close
  const last = data[data.length - 1].close
  const absolute = last - first
  const percentage = ((last - first) / first) * 100
  
  let trend: 'up' | 'down' | 'neutral' = 'neutral'
  if (percentage > 2) trend = 'up'
  else if (percentage < -2) trend = 'down'
  
  return {
    absolute: Math.round(absolute * 100) / 100,
    percentage: Math.round(percentage * 100) / 100,
    trend,
  }
}

export function calculatePriceChangeForPeriod(
  data: PriceData[],
  days: number
): { absolute: number; percentage: number; trend: 'up' | 'down' | 'neutral' } {
  if (data.length < 2) {
    return { absolute: 0, percentage: 0, trend: 'neutral' }
  }

  // Get the most recent price
  const currentPrice = data[data.length - 1].close
  const currentDate = data[data.length - 1].date

  // Find the price N days ago (or as close as possible)
  const targetDate = new Date(currentDate)
  targetDate.setDate(targetDate.getDate() - days)

  // Find the closest data point to the target date that is NOT after the target date
  let pastPrice = data[0].close
  let closestIndex = 0
  let minDiff = Infinity

  // Search backwards from the end to find the closest point that's <= targetDate
  for (let i = data.length - 2; i >= 0; i--) {
    const dataDate = data[i].date
    const diff = Math.abs(dataDate.getTime() - targetDate.getTime())
    
    // Prefer dates that are on or before the target date
    if (dataDate <= targetDate) {
      if (diff < minDiff) {
        minDiff = diff
        closestIndex = i
        pastPrice = data[i].close
      }
    }
  }

  // If no date found before target, use the closest one overall
  if (minDiff === Infinity) {
    minDiff = Math.abs(data[0].date.getTime() - targetDate.getTime())
    for (let i = 1; i < data.length - 1; i++) {
      const diff = Math.abs(data[i].date.getTime() - targetDate.getTime())
      if (diff < minDiff) {
        minDiff = diff
        closestIndex = i
        pastPrice = data[i].close
      }
    }
  }

  const absolute = currentPrice - pastPrice
  const percentage = ((currentPrice - pastPrice) / pastPrice) * 100

  let trend: 'up' | 'down' | 'neutral' = 'neutral'
  if (percentage > 2) trend = 'up'
  else if (percentage < -2) trend = 'down'

  return {
    absolute: Math.round(absolute * 100) / 100,
    percentage: Math.round(percentage * 100) / 100,
    trend,
  }
}


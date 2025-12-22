import { PriceData } from './indicators'
import { calculateSMA, calculateRSI, detectVolumeSpike, calculatePriceChange } from './indicators'

export type ValuationStatus = 'UNDERVALUED' | 'FAIR' | 'OVERVALUED'

export interface ValuationResult {
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
  }
}

export function analyzeStock(data: PriceData[], currentPrice: number): ValuationResult {
  if (data.length === 0) {
    throw new Error('No price data provided for analysis')
  }
  
  // Calculate technical indicators
  const sma20 = data.length >= 20 ? calculateSMA(data, 20)[calculateSMA(data, 20).length - 1] : null
  const sma50 = data.length >= 50 ? calculateSMA(data, 50)[calculateSMA(data, 50).length - 1] : null
  const sma200 = data.length >= 200 ? calculateSMA(data, 200)[calculateSMA(data, 200).length - 1] : null
  const rsi = calculateRSI(data)
  const volumeSpike = detectVolumeSpike(data)
  const priceMovement = calculatePriceChange(data)
  
  // Simplified intrinsic value calculation
  // Using a combination of moving averages and price momentum
  let intrinsicValue = currentPrice
  
  if (sma20 && sma50) {
    // Weighted average of SMAs
    intrinsicValue = (sma20 * 0.4 + sma50 * 0.6)
  } else if (sma20) {
    intrinsicValue = sma20
  }
  
  // Adjust based on RSI
  if (rsi < 30) {
    // Oversold - potentially undervalued
    intrinsicValue *= 1.1
  } else if (rsi > 70) {
    // Overbought - potentially overvalued
    intrinsicValue *= 0.9
  }
  
  // Adjust based on price trend
  if (priceMovement.trend === 'up' && priceMovement.percentage > 5) {
    intrinsicValue *= 0.95 // Recent surge might indicate overvaluation
  } else if (priceMovement.trend === 'down' && priceMovement.percentage < -5) {
    intrinsicValue *= 1.05 // Recent drop might indicate undervaluation
  }
  
  // Determine valuation status
  const priceDifference = ((currentPrice - intrinsicValue) / intrinsicValue) * 100
  let valuationStatus: ValuationStatus = 'FAIR'
  
  if (priceDifference < -10) {
    valuationStatus = 'UNDERVALUED'
  } else if (priceDifference > 10) {
    valuationStatus = 'OVERVALUED'
  }
  
  // Generate analysis summary
  const summary = generateAnalysisSummary({
    currentPrice,
    intrinsicValue,
    valuationStatus,
    sma20,
    sma50,
    sma200,
    rsi,
    volumeSpike: volumeSpike.isSpike,
    volumeRatio: volumeSpike.ratio,
    priceMovement,
  })
  
  return {
    intrinsicValue: Math.round(intrinsicValue * 100) / 100,
    currentPrice: Math.round(currentPrice * 100) / 100,
    valuationStatus,
    analysisSummary: summary,
    technicalIndicators: {
      sma20: sma20 ? Math.round(sma20 * 100) / 100 : null,
      sma50: sma50 ? Math.round(sma50 * 100) / 100 : null,
      sma200: sma200 ? Math.round(sma200 * 100) / 100 : null,
      rsi: Math.round(rsi * 100) / 100,
      volumeSpike: volumeSpike.isSpike,
      volumeRatio: volumeSpike.ratio,
    },
    priceMovement,
  }
}

function generateAnalysisSummary(params: {
  currentPrice: number
  intrinsicValue: number
  valuationStatus: ValuationStatus
  sma20: number | null
  sma50: number | null
  sma200: number | null
  rsi: number
  volumeSpike: boolean
  volumeRatio: number
  priceMovement: { absolute: number; percentage: number; trend: 'up' | 'down' | 'neutral' }
}): string {
  const {
    currentPrice,
    intrinsicValue,
    valuationStatus,
    sma20,
    sma50,
    sma200,
    rsi,
    volumeSpike,
    volumeRatio,
    priceMovement,
  } = params
  
  const parts: string[] = []
  
  // Valuation status
  const priceDiff = ((currentPrice - intrinsicValue) / intrinsicValue) * 100
  parts.push(
    `The stock is currently trading at $${currentPrice.toFixed(2)}, while our analysis suggests an intrinsic value of $${intrinsicValue.toFixed(2)} (${priceDiff > 0 ? '+' : ''}${priceDiff.toFixed(1)}% difference). Based on this, the stock appears to be ${valuationStatus.toLowerCase().replace('_', ' ')}.`
  )
  
  // Technical indicators
  if (sma20 && sma50) {
    if (currentPrice > sma20 && sma20 > sma50) {
      parts.push('The price is above both the 20-day and 50-day moving averages, indicating a positive short-term trend.')
    } else if (currentPrice < sma20 && sma20 < sma50) {
      parts.push('The price is below both the 20-day and 50-day moving averages, indicating a negative short-term trend.')
    }
  }
  
  if (sma200 && currentPrice > sma200) {
    parts.push('The stock is trading above its 200-day moving average, suggesting long-term bullish momentum.')
  } else if (sma200 && currentPrice < sma200) {
    parts.push('The stock is trading below its 200-day moving average, suggesting long-term bearish momentum.')
  }
  
  // RSI
  if (rsi < 30) {
    parts.push(`The RSI of ${rsi.toFixed(1)} indicates the stock is oversold, which may present a buying opportunity.`)
  } else if (rsi > 70) {
    parts.push(`The RSI of ${rsi.toFixed(1)} indicates the stock is overbought, suggesting potential for a price correction.`)
  } else {
    parts.push(`The RSI of ${rsi.toFixed(1)} is in neutral territory, indicating balanced buying and selling pressure.`)
  }
  
  // Volume
  if (volumeSpike) {
    parts.push(`Trading volume is ${(volumeRatio * 100).toFixed(0)}% above average, indicating heightened investor interest.`)
  }
  
  // Price movement
  if (priceMovement.trend === 'up') {
    parts.push(
      `Over the recent period, the stock has gained ${priceMovement.percentage.toFixed(1)}% ($${Math.abs(priceMovement.absolute).toFixed(2)}), showing positive momentum.`
    )
  } else if (priceMovement.trend === 'down') {
    parts.push(
      `Over the recent period, the stock has declined ${Math.abs(priceMovement.percentage).toFixed(1)}% ($${Math.abs(priceMovement.absolute).toFixed(2)}), showing negative momentum.`
    )
  } else {
    parts.push(`The stock price has remained relatively stable, with a ${priceMovement.percentage.toFixed(1)}% change over the recent period.`)
  }
  
  return parts.join(' ')
}


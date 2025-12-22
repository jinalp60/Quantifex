import yahooFinance from 'yahoo-finance2'
import { getCachedStockData, cacheStockData } from './cache'

export interface StockPriceData {
  date: Date
  open: number
  close: number
  high: number
  low: number
  volume: number
}

/**
 * Fetch recent stock data with 24h caching and Alpha Vantage fallback.
 */
export async function fetchStockData(symbol: string, days: number = 7): Promise<StockPriceData[]> {
  const symbolUpper = symbol.toUpperCase()

  // Check cache first
  const cached = await getCachedStockData(symbolUpper, days)
  if (cached) {
    return cached
  }

  try {
    // Use yahoo-finance2 historical data (UTC dates)
    const period1 = new Date()
    period1.setDate(period1.getDate() - Math.min(days + 5, 30)) // small buffer to ensure enough points

    const history = (await yahooFinance.historical(symbolUpper, {
      period1,
      period2: new Date(),
      interval: '1d',
    })) as any[]

    if (!Array.isArray(history) || history.length === 0) {
      throw new Error(`No data found for symbol: ${symbolUpper}`)
    }

    // Sort ascending by date and take last N days
    const sorted = [...history].sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0))
    const recent = sorted.slice(-days)

    const data: StockPriceData[] = recent.map((row) => ({
      date: row.date ? new Date(row.date) : new Date(),
      open: Number(row.open ?? 0),
      close: Number(row.close ?? 0),
      high: Number(row.high ?? 0),
      low: Number(row.low ?? 0),
      volume: Number(row.volume ?? 0),
    }))

    await cacheStockData(symbolUpper, data)
    return data
  } catch (error) {
    console.error(`Error fetching stock data with yahoo-finance2 for ${symbolUpper}:`, error)

    // Try Alpha Vantage as fallback
    return fetchStockDataAlphaVantage(symbolUpper, days)
  }
}

async function fetchStockDataAlphaVantage(symbol: string, days: number): Promise<StockPriceData[]> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY
  if (!apiKey) {
    throw new Error('No stock data API key configured')
  }

  try {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}&outputsize=compact`
    )
    const data = await response.json()

    if (data['Error Message'] || data['Note']) {
      throw new Error(data['Error Message'] || data['Note'])
    }

    const timeSeries = data['Time Series (Daily)']
    if (!timeSeries) {
      throw new Error('Invalid response from Alpha Vantage')
    }

    const entries = Object.entries(timeSeries)
      .slice(0, days)
      .reverse()
      .map(([date, values]: [string, any]) => ({
        date: new Date(date),
        open: parseFloat(values['1. open']),
        close: parseFloat(values['4. close']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        volume: parseInt(values['5. volume'], 10),
      }))

    await cacheStockData(symbol, entries)
    return entries
  } catch (error) {
    console.error(`Error fetching from Alpha Vantage for ${symbol}:`, error)
    throw new Error(`Failed to fetch stock data for ${symbol}`)
  }
}

export async function getCurrentPrice(symbol: string): Promise<number> {
  const data = await fetchStockData(symbol, 1)
  if (data.length === 0) {
    throw new Error(`No current price data for ${symbol}`)
  }
  return data[data.length - 1].close
}


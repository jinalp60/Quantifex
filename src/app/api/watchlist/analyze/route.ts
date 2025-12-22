import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { z } from 'zod'
import { fetchStockData } from '@/lib/stocks/yfinance'
import { analyzeStock } from '@/lib/valuation/analyzer'
import { fetchNews } from '@/lib/news/newsapi'
import { fetchFundamentals } from '@/lib/stocks/fundamentals'
import { handleError } from '@/utils/errors'
import { logger } from '@/utils/logger'

export const dynamic = 'force-dynamic'

const analyzeSchema = z.object({
  symbol: z.string().min(1).max(10).toUpperCase(),
})

// POST - Analyze a stock (for watchlist display)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { symbol } = analyzeSchema.parse(body)

    logger.info('Analyzing stock for watchlist', { symbol, userId: session.user.id })

    const priceData = await fetchStockData(symbol, 7)

    if (priceData.length === 0) {
      return NextResponse.json(
        { error: `No data available for symbol: ${symbol}` },
        { status: 404 }
      )
    }

    const currentPrice = priceData[priceData.length - 1].close
    const analysis = analyzeStock(priceData, currentPrice)
    const fundamentals = await fetchFundamentals(symbol)
    const news = await fetchNews(symbol, 3)

    return NextResponse.json({
      ...analysis,
      recentNews: news,
      fundamentals,
    })
  } catch (error) {
    logger.error('Error in watchlist analyze route', { error })
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}


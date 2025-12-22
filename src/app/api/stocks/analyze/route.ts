import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { z } from 'zod'
import { fetchStockData, getCurrentPrice } from '@/lib/stocks/yfinance'
import { analyzeStock } from '@/lib/valuation/analyzer'
import { fetchNews } from '@/lib/news/newsapi'
import { trackEvent } from '@/lib/analytics/tracker'
import { prisma } from '@/lib/db/prisma'
import { handleError } from '@/utils/errors'
import { logger } from '@/utils/logger'
import { fetchFundamentals } from '@/lib/stocks/fundamentals'
import { calculatePriceChangeForPeriod } from '@/lib/valuation/indicators'

export const dynamic = 'force-dynamic'

const analyzeSchema = z.object({
  symbol: z.string().min(1).max(10).toUpperCase(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await req.json()
    const { symbol } = analyzeSchema.parse(body)
    
    // Track search event
    await trackEvent(session.user.id, symbol, 'search')
    
    // Fetch stock data (with caching) - fetch 1 year for multiple period calculations
    logger.info('Fetching stock data', { symbol, userId: session.user.id })
    const priceData = await fetchStockData(symbol, 365)
    
    if (priceData.length === 0) {
      return NextResponse.json(
        { error: `No data available for symbol: ${symbol}` },
        { status: 404 }
      )
    }
    
    const currentPrice = priceData[priceData.length - 1].close
    
    // Use last 7 days for main analysis (to keep existing behavior)
    const recentData = priceData.slice(-7)
    
    // Perform analysis
    const analysis = analyzeStock(recentData, currentPrice)
    
    // Calculate price movements for different periods
    const periods = {
      '1d': calculatePriceChangeForPeriod(priceData, 1),
      '7d': calculatePriceChangeForPeriod(priceData, 7),
      '30d': calculatePriceChangeForPeriod(priceData, 30),
      '1y': calculatePriceChangeForPeriod(priceData, 365),
    }
    
    // Add periods to priceMovement
    analysis.priceMovement.periods = periods

    // Fetch fundamentals (dividends, P/E, growth, DCF-style reference)
    const fundamentals = await fetchFundamentals(symbol)

    // Fetch news (with caching)
    const news = await fetchNews(symbol, 5)
    
    // Save analysis to database (store extended summary)
    const savedAnalysis = await prisma.stockAnalysis.create({
      data: {
        symbol,
        intrinsicValue: analysis.intrinsicValue,
        currentPrice: analysis.currentPrice,
        valuationStatus: analysis.valuationStatus,
        analysisSummary: analysis.analysisSummary,
        userId: session.user.id,
      },
    })
    
    // Track analysis event
    await trackEvent(session.user.id, symbol, 'analysis', {
      valuationStatus: analysis.valuationStatus,
    })
    
    return NextResponse.json({
      ...analysis,
      analysisSummary: analysis.analysisSummary,
      recentNews: news,
      fundamentals,
      id: savedAnalysis.id,
      createdAt: savedAnalysis.createdAt,
    })
  } catch (error) {
    logger.error('Error in analyze route', { error })
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}


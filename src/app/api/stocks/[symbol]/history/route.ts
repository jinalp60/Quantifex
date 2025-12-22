import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { fetchStockData } from '@/lib/stocks/yfinance'
import { handleError } from '@/utils/errors'
import { logger } from '@/utils/logger'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const symbol = params.symbol.toUpperCase()
    const days = parseInt(req.nextUrl.searchParams.get('days') || '7', 10)
    
    logger.info('Fetching stock history', { symbol, days, userId: session.user.id })
    
    const data = await fetchStockData(symbol, Math.min(days, 30))
    
    return NextResponse.json({ symbol, data })
  } catch (error) {
    logger.error('Error in history route', { error })
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}


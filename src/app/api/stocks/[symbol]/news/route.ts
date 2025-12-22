import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { fetchNews } from '@/lib/news/newsapi'
import { handleError } from '@/utils/errors'
import { logger } from '@/utils/logger'

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
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10', 10)
    
    logger.info('Fetching news', { symbol, limit, userId: session.user.id })
    
    const news = await fetchNews(symbol, Math.min(limit, 20))
    
    return NextResponse.json({ symbol, news })
  } catch (error) {
    logger.error('Error in news route', { error })
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}


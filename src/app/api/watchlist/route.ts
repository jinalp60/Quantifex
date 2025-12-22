import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { handleError } from '@/utils/errors'
import { logger } from '@/utils/logger'

export const dynamic = 'force-dynamic'

// GET - Fetch user's watchlist
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const watchlist = await prisma.watchlist.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ watchlist })
  } catch (error) {
    logger.error('Error fetching watchlist', { error })
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}

// POST - Add stock to watchlist
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { symbol } = body

    if (!symbol || typeof symbol !== 'string') {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
    }

    const symbolUpper = symbol.toUpperCase().trim()

    // Check if already in watchlist
    const existing = await prisma.watchlist.findUnique({
      where: {
        userId_symbol: {
          userId: session.user.id,
          symbol: symbolUpper,
        },
      },
    })

    if (existing) {
      return NextResponse.json({ error: 'Stock already in watchlist' }, { status: 400 })
    }

    const watchlistItem = await prisma.watchlist.create({
      data: {
        userId: session.user.id,
        symbol: symbolUpper,
      },
    })

    logger.info('Stock added to watchlist', {
      userId: session.user.id,
      symbol: symbolUpper,
    })

    return NextResponse.json({ success: true, watchlistItem })
  } catch (error) {
    logger.error('Error adding to watchlist', { error })
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}

// DELETE - Remove stock from watchlist
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const symbol = searchParams.get('symbol')

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
    }

    await prisma.watchlist.delete({
      where: {
        userId_symbol: {
          userId: session.user.id,
          symbol: symbol.toUpperCase(),
        },
      },
    })

    logger.info('Stock removed from watchlist', {
      userId: session.user.id,
      symbol: symbol.toUpperCase(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error removing from watchlist', { error })
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}


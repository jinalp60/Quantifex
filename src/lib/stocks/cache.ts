import { prisma } from '@/lib/db/prisma'

const CACHE_TTL_HOURS = parseInt(process.env.CACHE_TTL_HOURS || '24', 10)

export async function getCachedStockData(symbol: string, days: number = 7) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)
  
  const cached = await prisma.stockSnapshot.findMany({
    where: {
      symbol: symbol.toUpperCase(),
      date: {
        gte: cutoffDate,
      },
      cachedAt: {
        gte: new Date(Date.now() - CACHE_TTL_HOURS * 60 * 60 * 1000),
      },
    },
    orderBy: {
      date: 'desc',
    },
  })
  
  if (cached.length >= days) {
    return cached.map(snapshot => ({
      date: snapshot.date,
      open: snapshot.open,
      close: snapshot.close,
      high: snapshot.high,
      low: snapshot.low,
      volume: Number(snapshot.volume),
    }))
  }
  
  return null
}

export async function cacheStockData(symbol: string, data: Array<{
  date: Date
  open: number
  close: number
  high: number
  low: number
  volume: number
}>) {
  const symbolUpper = symbol.toUpperCase()
  
  for (const item of data) {
    await prisma.stockSnapshot.upsert({
      where: {
        symbol_date: {
          symbol: symbolUpper,
          date: item.date,
        },
      },
      update: {
        open: item.open,
        close: item.close,
        high: item.high,
        low: item.low,
        volume: BigInt(item.volume),
        cachedAt: new Date(),
      },
      create: {
        symbol: symbolUpper,
        date: item.date,
        open: item.open,
        close: item.close,
        high: item.high,
        low: item.low,
        volume: BigInt(item.volume),
      },
    })
  }
}


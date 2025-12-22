import { prisma } from '@/lib/db/prisma'

const CACHE_TTL_HOURS = parseInt(process.env.CACHE_TTL_HOURS || '24', 10)

interface NewsItem {
  title: string
  description: string
  url: string
  publishedAt: string
  source: string
}

let newsCache: Map<string, { data: NewsItem[]; timestamp: number }> = new Map()

export async function getCachedNews(symbol: string): Promise<NewsItem[] | null> {
  const cacheKey = symbol.toUpperCase()
  const cached = newsCache.get(cacheKey)
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_HOURS * 60 * 60 * 1000) {
    return cached.data
  }
  
  return null
}

export function cacheNews(symbol: string, data: NewsItem[]) {
  const cacheKey = symbol.toUpperCase()
  newsCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  })
}


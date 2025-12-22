import { prisma } from '@/lib/db/prisma'

export async function trackEvent(
  userId: string | null,
  symbol: string,
  eventType: 'search' | 'analysis' | 'repeat_search',
  metadata?: Record<string, any>
) {
  try {
    await prisma.analytics.create({
      data: {
        userId: userId || undefined,
        symbol: symbol.toUpperCase(),
        eventType,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    })
  } catch (error) {
    // Fail silently - analytics should not break the app
    console.error('Error tracking analytics:', error)
  }
}

export async function checkRepeatSearch(userId: string | null, symbol: string): Promise<boolean> {
  if (!userId) return false
  
  try {
    const previousSearch = await prisma.analytics.findFirst({
      where: {
        userId,
        symbol: symbol.toUpperCase(),
        eventType: 'search',
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    
    return previousSearch !== null
  } catch (error) {
    console.error('Error checking repeat search:', error)
    return false
  }
}


import { prisma } from '@/lib/db/prisma'

// Fixed daily limit for early validation phase.
// Adjust here if you want to change the limit; no env var required.
const MAX_ANALYSES_PER_DAY = 10

export async function checkRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  let rateLimit = await prisma.rateLimit.findUnique({
    where: { userId },
  })
  
  // Reset if last reset was before today
  if (!rateLimit || rateLimit.lastReset < today) {
    rateLimit = await prisma.rateLimit.upsert({
      where: { userId },
      update: {
        analysisCount: 0,
        lastReset: today,
      },
      create: {
        userId,
        analysisCount: 0,
        lastReset: today,
      },
    })
  }
  
  const remaining = Math.max(0, MAX_ANALYSES_PER_DAY - rateLimit.analysisCount)
  const allowed = remaining > 0
  
  return { allowed, remaining }
}

export async function incrementRateLimit(userId: string): Promise<void> {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  await prisma.rateLimit.upsert({
    where: { userId },
    update: {
      analysisCount: {
        increment: 1,
      },
    },
    create: {
      userId,
      analysisCount: 1,
      lastReset: today,
    },
  })
}


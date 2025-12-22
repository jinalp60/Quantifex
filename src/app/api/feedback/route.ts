import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { handleError } from '@/utils/errors'
import { logger } from '@/utils/logger'

const feedbackSchema = z.object({
  symbol: z.string().min(1).max(10).toUpperCase(),
  isHelpful: z.boolean(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await req.json()
    const { symbol, isHelpful } = feedbackSchema.parse(body)
    
    const feedback = await prisma.feedback.create({
      data: {
        symbol,
        isHelpful,
        userId: session.user.id,
      },
    })
    
    logger.info('Feedback submitted', {
      userId: session.user.id,
      symbol,
      isHelpful,
    })
    
    return NextResponse.json({ success: true, feedback })
  } catch (error) {
    logger.error('Error in feedback route', { error })
    const { message, statusCode } = handleError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}


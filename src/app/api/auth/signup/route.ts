import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { hashPassword } from '@/lib/auth/password'

const signupSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  name: z.string().max(120).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, name } = signupSchema.parse(body)
    const normalizedEmail = email.toLowerCase()

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
    }

    const passwordHash = await hashPassword(password)

    await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name?.trim() || null,
        passwordHash,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Signup error', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 })
  }
}



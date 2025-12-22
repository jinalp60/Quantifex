import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { verifyPassword } from './password'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim()
        const password = credentials?.password

        if (!email || !password) return null

        const { prisma } = await import('@/lib/db/prisma')
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user || !user.passwordHash) return null

        const valid = await verifyPassword(password, user.passwordHash)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          const { prisma } = await import('@/lib/db/prisma')
          
          // Upsert user in database
          await prisma.user.upsert({
            where: { email: user.email! },
            update: {
              name: user.name,
              image: user.image,
            },
            create: {
              email: user.email!,
              name: user.name,
              image: user.image,
            },
          })
          
          return true
        } catch (error) {
          console.error('Error during sign in:', error)
          return false
        }
      }
      return true
    },
    async session({ session, token }) {
      if (session.user?.email) {
        const { prisma } = await import('@/lib/db/prisma')
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email },
        })
        
        if (dbUser) {
          session.user.id = dbUser.id
        }
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}


import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import prisma from './prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null
          
          // Hardcoded bypass for demo
          const validUsers: Record<string, { password: string; role: string }> = {
            'rahul@30sundays.com': { password: 'tm123', role: 'TRIP_MANAGER' },
            'admin@30sundays.com': { password: 'admin123', role: 'ADMIN' },
          }
          
          const validUser = validUsers[credentials.email]
          if (!validUser || validUser.password !== credentials.password) return null
          
          // Try to get from DB, fall back to hardcoded
          try {
            const user = await prisma.user.findUnique({ where: { email: credentials.email } })
            if (user) return user
          } catch (e) {
            console.error('DB error, using fallback:', e)
          }
          
          // Fallback user object
          return {
            id: credentials.email,
            email: credentials.email,
            role: validUser.role,
            name: credentials.email.split('@')[0],
          } as any
          
        } catch (e) {
          console.error('Auth error:', e)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role
        ;(session.user as any).id = token.id
      }
      return session
    },
  },
}

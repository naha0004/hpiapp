import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import EmailProvider from "next-auth/providers/email"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"
import { env } from "./env"
import { authSchemas } from "./validation"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Only include GoogleProvider if credentials are set
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? [GoogleProvider({
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
        })]
      : []),
    // Only include EmailProvider if email server is configured
    ...(env.SMTP_SERVER
      ? [EmailProvider({
          server: {
            host: env.SMTP_SERVER,
            port: env.SMTP_PORT || 587,
            auth: {
              user: env.SMTP_USER!,
              pass: env.SMTP_PASSWORD!,
            },
            secure: env.SMTP_PORT === 465,
            tls: {
              rejectUnauthorized: env.NODE_ENV === 'production'
            }
          },
          from: env.EMAIL_FROM,
        })]
      : []),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Validate input
          const { email, password } = authSchemas.login.parse(credentials)

          const user = await prisma.user.findUnique({
            where: { email }
          })

          if (!user || !user.password) {
            // Prevent timing attacks
            await bcrypt.compare("dummy", "$2b$12$dummy.hash.to.prevent.timing.attacks")
            return null
          }

          const isPasswordValid = await bcrypt.compare(password, user.password)

          if (!isPasswordValid) {
            return null
          }

          // Log successful login (without sensitive data)
          console.log(`User login: ${user.id}`)

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          }
        } catch (error) {
          console.error('Login error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: env.NODE_ENV === 'production' ? `__Secure-next-auth.session-token` : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: env.NODE_ENV === 'production',
        // Remove domain setting for development to avoid redirect loops
        domain: env.NODE_ENV === 'production' ? '.yourdomain.com' : undefined
      }
    }
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log("JWT callback - token:", token, "user:", user)
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      console.log("Session callback - session:", session, "token:", token)
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    },
    async signIn({ user, account, profile, email, credentials }) {
      console.log("SignIn callback - user:", user, "account:", account)
      // Allow sign in
      return true
    },
    async redirect({ url, baseUrl }) {
      console.log("Redirect callback - url:", url, "baseUrl:", baseUrl)
      // Redirect to home page (which shows dashboard for authenticated users) after successful login
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // If it's the same origin, allow redirect
      else if (new URL(url).origin === baseUrl) return url
      // Otherwise redirect to home page
      return baseUrl
    },
  },
}

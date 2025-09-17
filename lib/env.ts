import { z } from 'zod'

// Environment variable schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  // NextAuth
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters long'),
  
  // Email (optional)
  SMTP_SERVER: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().email().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  
  // API Keys (optional - provide empty string if not using)
  DVLA_API_KEY: z.string().optional(),
  DVSA_API_KEY: z.string().optional(),
  DVSA_CLIENT_ID: z.string().optional(),
  DVSA_CLIENT_SECRET: z.string().optional(),
  DVSA_SCOPE_URL: z.string().optional(),
  DVSA_AUTH_URL: z.string().optional(),
  DVSA_MOT_API_URL: z.string().optional(),
  
  // OAuth (optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  
  // Stripe (optional - only required if using payments)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // OpenAI (optional)
  OPENAI_API_KEY: z.string().optional(),
  
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

type Env = z.infer<typeof envSchema>

// Validate environment variables
function validateEnv(): Env {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join('\n  ')
      
      console.error(`❌ Environment variable validation errors:\n  ${missingVars}`)
      
      // In development, show warning but don't crash
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️  Continuing in development mode with missing environment variables')
        // Return a partial env object with defaults
        return {
          DATABASE_URL: process.env.DATABASE_URL || "file:./dev.db",
          NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://localhost:3000",
          NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "uNAQ58r1OY+lXJxm6SOfV6zuunt7KErtxTC1OXxIDpQ=",
          NODE_ENV: 'development',
          // Add other optional fields as undefined
        } as Env
      }
      
      // In production, exit the process
      process.exit(1)
    }
    throw error
  }
}

// Export validated environment
export const env = validateEnv()

// Environment-specific configurations
export const config = {
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  
  // Security settings
  security: {
    enableHTTPS: env.NODE_ENV === 'production',
    enableCSRF: env.NODE_ENV === 'production',
    enableRateLimiting: true,
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  },
  
  // API settings
  api: {
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    rateLimitWindow: 15 * 60 * 1000, // 15 minutes
    rateLimitMax: 100,
  }
}

// Utility to check if required env vars are set
export function checkRequiredEnvVars(vars: (keyof Env)[]): void {
  const missing = vars.filter(varName => !env[varName])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

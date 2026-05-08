const clerkWebhookSigningSecretKey = 'CLERK_WEBHOOK_SIGNING_SECRET'
const clerkWebhookSigningSecretPrefix = 'whsec_'
const clerkSecretKey = 'CLERK_SECRET_KEY'
const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/
const defaultCorsOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173']

const requiredDatabaseEnv = ['PG_URL', 'PG_PORT', 'PG_DATABASE', 'PG_USER', 'PG_PASSWORD', 'PG_CERT']
const requiredApiEnv = [clerkWebhookSigningSecretKey, ...requiredDatabaseEnv]

export function validateApiEnvironment(): void {
  validateDatabaseEnvironment()

  for (const key of requiredApiEnv) {
    if (!process.env[key]) throw new Error(`${key} is not set`)
  }

  getClerkWebhookSigningSecret()
}

export function getClerkWebhookSigningSecret(): string {
  const secret = process.env[clerkWebhookSigningSecretKey]?.trim()

  if (!secret) throw new Error(`${clerkWebhookSigningSecretKey} is not set`)
  if (!secret.startsWith(clerkWebhookSigningSecretPrefix)) {
    throw new Error(`${clerkWebhookSigningSecretKey} must start with ${clerkWebhookSigningSecretPrefix}`)
  }

  const encodedSecret = secret.slice(clerkWebhookSigningSecretPrefix.length)

  if (!encodedSecret || !base64Pattern.test(encodedSecret)) {
    throw new Error(`${clerkWebhookSigningSecretKey} is malformed; copy only the ${clerkWebhookSigningSecretPrefix} signing secret from Clerk`)
  }

  return secret
}

export function validateDatabaseEnvironment(): void {
  for (const key of requiredDatabaseEnv) {
    if (!process.env[key]) throw new Error(`${key} is not set`)
  }
}

export function getClerkSecretKey(): string {
  const secret = process.env[clerkSecretKey]?.trim()

  if (!secret) throw new Error(`${clerkSecretKey} is not set`)
  if (!secret.startsWith('sk_')) throw new Error(`${clerkSecretKey} must start with sk_`)

  return secret
}

export function getAllowedCorsOrigin(origin: string): string | undefined {
  const configuredOrigins = process.env.API_CORS_ORIGINS?.split(',').map((value) => value.trim()).filter(Boolean) ?? []
  const allowedOrigins = configuredOrigins.length > 0 ? configuredOrigins : defaultCorsOrigins

  return allowedOrigins.includes(origin) ? origin : undefined
}

const clerkWebhookSigningSecretKey = 'CLERK_WEBHOOK_SIGNING_SECRET'
const clerkWebhookSigningSecretPrefix = 'whsec_'
const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/

const requiredApiEnv = [clerkWebhookSigningSecretKey, 'PG_URL', 'PG_PORT', 'PG_DATABASE', 'PG_USER', 'PG_PASSWORD', 'PG_CERT']

export function validateApiEnvironment(): void {
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

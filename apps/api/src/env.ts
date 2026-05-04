const requiredApiEnv = ['CLERK_WEBHOOK_SIGNING_SECRET', 'PG_URL', 'PG_PORT', 'PG_DATABASE', 'PG_USER', 'PG_PASSWORD', 'PG_CERT']

export function validateApiEnvironment(): void {
  for (const key of requiredApiEnv) {
    if (!process.env[key]) throw new Error(`${key} is not set`)
  }
}

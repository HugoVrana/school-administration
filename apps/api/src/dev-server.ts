import { serve } from '@hono/node-server'
import app from './app.js'
import { closeDb } from './services/database.js'

const port = Number(process.env.PORT ?? 4000)

const server = serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`API server listening on http://localhost:${info.port}`)
})

async function shutdown(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error)
      else resolve()
    })
  })

  await closeDb()
}

process.on('SIGINT', () => {
  void shutdown().finally(() => process.exit(0))
})

process.on('SIGTERM', () => {
  void shutdown().finally(() => process.exit(0))
})

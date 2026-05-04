import { closeDb, handleClerkWebhookRequest, HttpError, validateEnvironment } from './clerk-user-sync.js'
import { openApiDocument, swaggerUiHtml } from './openapi.js'
import { createServer, type IncomingHttpHeaders, type IncomingMessage, type ServerResponse } from 'node:http'

validateEnvironment()

const port = Number(process.env.PORT ?? 4000)

const server = createServer(async (request, response) => {
  try {
    const pathname = getPathname(request)

    if (request.method === 'GET' && (pathname === '/' || pathname === '/api')) {
      redirect(response, '/api/docs')
      return
    }

    if (request.method === 'GET' && (pathname === '/health' || pathname === '/api/health')) {
      sendJson(response, 200, { ok: true })
      return
    }

    if (request.method === 'GET' && pathname === '/api/openapi') {
      sendJson(response, 200, openApiDocument)
      return
    }

    if (request.method === 'GET' && pathname === '/api/docs') {
      sendHtml(response, 200, swaggerUiHtml())
      return
    }

    if (request.method === 'POST' && pathname === '/api/webhooks/clerk') {
      await handleClerkWebhook(request)
      sendJson(response, 200, { received: true })
      return
    }

    sendJson(response, 404, { error: 'Not found' })
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Internal server error'

    console.error(message)
    sendJson(response, status, { error: message })
  }
})

server.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`)
})

async function handleClerkWebhook(request: IncomingMessage): Promise<void> {
  const body = await readBody(request)
  await handleClerkWebhookRequest(new Request(getRequestUrl(request), {
    method: request.method,
    headers: toHeaders(request.headers),
    body,
  }))
}

async function readBody(request: IncomingMessage): Promise<string> {
  request.setEncoding('utf8')

  let body = ''

  for await (const chunk of request) {
    body += chunk
  }

  return body
}

function getRequestUrl(request: IncomingMessage): string {
  const host = request.headers.host ?? `localhost:${port}`

  return `http://${host}${request.url ?? '/'}`
}

function getPathname(request: IncomingMessage): string {
  return new URL(getRequestUrl(request)).pathname
}

function toHeaders(headers: IncomingHttpHeaders): Headers {
  const normalizedHeaders = new Headers()

  for (const [key, value] of Object.entries(headers)) {
    if (Array.isArray(value)) {
      for (const item of value) normalizedHeaders.append(key, item)
    } else if (typeof value === 'string') {
      normalizedHeaders.set(key, value)
    }
  }

  return normalizedHeaders
}

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { 'content-type': 'application/json' })
  response.end(JSON.stringify(body))
}

function sendHtml(response: ServerResponse, status: number, body: string): void {
  response.writeHead(status, { 'content-type': 'text/html; charset=utf-8' })
  response.end(body)
}

function redirect(response: ServerResponse, location: string): void {
  response.writeHead(307, { location })
  response.end()
}

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

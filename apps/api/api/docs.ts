import { swaggerUiHtml } from '../src/openapi.js'

export function GET(): Response {
  return new Response(swaggerUiHtml(), {
    headers: {
      'content-type': 'text/html; charset=utf-8',
    },
  })
}

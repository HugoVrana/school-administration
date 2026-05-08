import { SwaggerUI } from '@hono/swagger-ui'
import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { Hono } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { HttpError } from './errors.js'
import { registerAdminRoleRequestRoutes } from './routes/admin/role-requests.js'
import { registerHealthRoutes } from './routes/health.js'
import { registerClerkWebhookRoutes } from './routes/webhooks/clerk.js'
import { ErrorResponseSchema } from './schemas/common.js'

const api = new OpenAPIHono({
  defaultHook: (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Invalid request' }, 400)
    }
  },
}).basePath('/api')

const docsRoute = createRoute({
  method: 'get',
  path: '/docs',
  tags: ['Documentation'],
  summary: 'View Swagger UI',
  responses: {
    200: {
      description: 'Swagger UI HTML.',
    },
  },
})

api.openAPIRegistry.registerPath(docsRoute)
api.get('/docs', (c) =>
  c.html(
    SwaggerUI({
      url: '/api/openapi',
      title: 'School Administration API Docs',
    }),
    200,
  ),
)

registerHealthRoutes(api)
registerClerkWebhookRoutes(api)
registerAdminRoleRequestRoutes(api)

api.doc31('/openapi', {
  openapi: '3.1.0',
  info: {
    title: 'School Administration API',
    version: '0.1.0',
    description: 'API endpoints for the school administration application.',
  },
  tags: [
    {
      name: 'Admin',
      description: 'Administrative endpoints',
    },
    {
      name: 'System',
      description: 'Operational endpoints',
    },
    {
      name: 'Clerk',
      description: 'Clerk integration endpoints',
    },
    {
      name: 'Documentation',
      description: 'API documentation endpoints',
    },
  ],
})

const app = new Hono()

app.get('/', (c) => c.redirect('/api/docs'))
app.route('/', api)

app.onError((error, c) => {
  const status: ContentfulStatusCode = error instanceof HttpError ? error.status as ContentfulStatusCode : 500
  const message = error instanceof Error ? error.message : 'Internal server error'

  console.error(error)

  return c.json({ error: message }, status)
})

app.notFound((c) => c.json({ error: 'Not found' }, 404))

export type AppType = typeof api
export { ErrorResponseSchema }
export default app

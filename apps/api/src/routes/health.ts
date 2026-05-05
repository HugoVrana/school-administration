import { createRoute, type OpenAPIHono, z } from '@hono/zod-openapi'

const HealthResponseSchema = z
  .object({
    ok: z.boolean().openapi({
      example: true,
    }),
  })
  .openapi('HealthResponse')

const healthRoute = createRoute({
  method: 'get',
  path: '/health',
  tags: ['System'],
  summary: 'Check API health',
  responses: {
    200: {
      description: 'The API is running.',
      content: {
        'application/json': {
          schema: HealthResponseSchema,
        },
      },
    },
  },
})

export function registerHealthRoutes(app: OpenAPIHono): void {
  app.openAPIRegistry.registerPath(healthRoute)
  app.get('/health', (c) => c.json({ ok: true }, 200))
}

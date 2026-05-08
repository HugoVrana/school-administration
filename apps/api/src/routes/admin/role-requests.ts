import { createRoute, type OpenAPIHono, z } from '@hono/zod-openapi'
import { getAllowedCorsOrigin } from '../../env.js'
import { ErrorResponseSchema } from '../../schemas/common.js'

const RoleSchema = z.enum(['admin', 'teacher', 'student'])

const RoleRequestUserSchema = z.object({
  clerkId: z.string().nullable().openapi({
    example: 'user_123',
  }),
  createdAt: z.string().openapi({
    example: '2026-05-08T10:30:00.000Z',
  }),
  email: z.string().email().openapi({
    example: 'student@example.com',
  }),
  id: z.number().int().openapi({
    example: 1,
  }),
  name: z.string().nullable().openapi({
    example: 'Ada Lovelace',
  }),
  requestedRole: RoleSchema.openapi({
    example: 'teacher',
  }),
  role: RoleSchema.nullable().openapi({
    example: 'student',
  }),
  updatedAt: z.string().openapi({
    example: '2026-05-08T10:30:00.000Z',
  }),
})

const RoleRequestsResponseSchema = z.object({
  roleRequests: z.array(RoleRequestUserSchema),
}).openapi('RoleRequestsResponse')

const roleRequestsRoute = createRoute({
  method: 'get',
  path: '/admin/role-requests',
  tags: ['Admin'],
  summary: 'List users with pending role requests',
  description: 'Returns users whose requested_role is not empty. Requires a Clerk session for a synced admin user.',
  responses: {
    200: {
      description: 'Pending role requests.',
      content: {
        'application/json': {
          schema: RoleRequestsResponseSchema,
        },
      },
    },
    401: {
      description: 'Missing or invalid bearer token.',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    403: {
      description: 'The signed-in user is not an admin.',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: 'Unexpected server error.',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
})

export function registerAdminRoleRequestRoutes(app: OpenAPIHono): void {
  app.use('/admin/*', async (c, next) => {
    const origin = c.req.header('origin')
    const allowedOrigin = origin ? getAllowedCorsOrigin(origin) : undefined

    if (allowedOrigin) {
      c.header('Access-Control-Allow-Origin', allowedOrigin)
      c.header('Access-Control-Allow-Headers', 'Authorization, Content-Type')
      c.header('Access-Control-Allow-Methods', 'GET, OPTIONS')
      c.header('Access-Control-Max-Age', '600')
      c.header('Vary', 'Origin')
    }

    if (c.req.method === 'OPTIONS') {
      return c.body(null, 204)
    }

    await next()
  })

  app.openAPIRegistry.registerPath(roleRequestsRoute)
  app.get('/admin/role-requests', async (c) => {
    const { requireAdminRequest } = await import('../../services/admin-auth.js')
    const { listRoleRequests } = await import('../../services/role-requests.js')

    await requireAdminRequest(c.req.raw)

    return c.json({ roleRequests: await listRoleRequests() }, 200)
  })
}

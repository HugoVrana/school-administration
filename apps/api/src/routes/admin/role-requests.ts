import { createRoute, type OpenAPIHono, z } from '@hono/zod-openapi'
import { getAllowedCorsOrigin } from '../../env.js'
import { ErrorResponseSchema } from '../../schemas/common.js'
import { requireAdminRequest } from '../../services/admin-auth.js'
import { approveRoleRequest, declineRoleRequest, listRoleRequests } from '../../services/role-requests.js'

const RoleSchema = z.enum(['admin', 'teacher', 'student'])

const PendingRoleRequestUserSchema = z.object({
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
}).openapi('PendingRoleRequestUser')

const ResolvedRoleRequestUserSchema = PendingRoleRequestUserSchema.extend({
  requestedRole: RoleSchema.nullable(),
}).openapi('ResolvedRoleRequestUser')

const RoleRequestsResponseSchema = z.object({
  roleRequests: z.array(PendingRoleRequestUserSchema),
}).openapi('RoleRequestsResponse')

const RoleRequestActionResponseSchema = z.object({
  user: ResolvedRoleRequestUserSchema,
}).openapi('RoleRequestActionResponse')

const RoleRequestParamsSchema = z.object({
  userId: z.coerce.number().int().positive().openapi({
    param: {
      name: 'userId',
      in: 'path',
    },
    example: 1,
  }),
})

const UnauthorizedResponse = {
  description: 'Missing or invalid bearer token.',
  content: {
    'application/json': {
      schema: ErrorResponseSchema,
    },
  },
}

const ForbiddenResponse = {
  description: 'The signed-in user is not an admin.',
  content: {
    'application/json': {
      schema: ErrorResponseSchema,
    },
  },
}

const NotFoundResponse = {
  description: 'Role request not found.',
  content: {
    'application/json': {
      schema: ErrorResponseSchema,
    },
  },
}

const ConflictResponse = {
  description: 'Role request user is not linked to a Clerk user.',
  content: {
    'application/json': {
      schema: ErrorResponseSchema,
    },
  },
}

const UnexpectedErrorResponse = {
  description: 'Unexpected server error.',
  content: {
    'application/json': {
      schema: ErrorResponseSchema,
    },
  },
}

const AdminErrorResponses = {
  401: UnauthorizedResponse,
  403: ForbiddenResponse,
  500: UnexpectedErrorResponse,
}

const RoleRequestActionErrorResponses = {
  ...AdminErrorResponses,
  409: ConflictResponse,
  404: NotFoundResponse,
}

const listRoleRequestsRoute = createRoute({
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
    ...AdminErrorResponses,
  },
})

const approveRoleRequestRoute = createRoute({
  method: 'post',
  path: '/admin/role-requests/{userId}/approve',
  request: {
    params: RoleRequestParamsSchema,
  },
  tags: ['Admin'],
  summary: 'Approve a role request',
  description: 'Sets role to the requested role and clears requested_role for the selected user.',
  responses: {
    200: {
      description: 'Role request approved.',
      content: {
        'application/json': {
          schema: RoleRequestActionResponseSchema,
        },
      },
    },
    ...RoleRequestActionErrorResponses,
  },
})

const declineRoleRequestRoute = createRoute({
  method: 'post',
  path: '/admin/role-requests/{userId}/decline',
  request: {
    params: RoleRequestParamsSchema,
  },
  tags: ['Admin'],
  summary: 'Decline a role request',
  description: 'Clears requested_role without changing the selected user role.',
  responses: {
    200: {
      description: 'Role request declined.',
      content: {
        'application/json': {
          schema: RoleRequestActionResponseSchema,
        },
      },
    },
    ...RoleRequestActionErrorResponses,
  },
})

export function registerAdminRoleRequestRoutes(app: OpenAPIHono): void {
  registerAdminCors(app)

  app.openapi(listRoleRequestsRoute, async (c) => {
    await requireAdminRequest(c.req.raw)

    return c.json({ roleRequests: await listRoleRequests() }, 200)
  })

  app.openapi(approveRoleRequestRoute, async (c) => {
    const { userId } = c.req.valid('param')

    await requireAdminRequest(c.req.raw)

    return c.json({ user: await approveRoleRequest(userId) }, 200)
  })

  app.openapi(declineRoleRequestRoute, async (c) => {
    const { userId } = c.req.valid('param')

    await requireAdminRequest(c.req.raw)

    return c.json({ user: await declineRoleRequest(userId) }, 200)
  })
}

function registerAdminCors(app: OpenAPIHono): void {
  app.use('/admin/*', async (c, next) => {
    const origin = c.req.header('origin')
    const allowedOrigin = origin ? getAllowedCorsOrigin(origin) : undefined

    if (allowedOrigin) {
      c.header('Access-Control-Allow-Origin', allowedOrigin)
      c.header('Access-Control-Allow-Headers', 'Authorization, Content-Type')
      c.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      c.header('Access-Control-Max-Age', '600')
      c.header('Vary', 'Origin')
    }

    if (c.req.method === 'OPTIONS') {
      return c.body(null, 204)
    }

    await next()
  })
}

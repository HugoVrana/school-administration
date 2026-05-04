import { createRoute, type OpenAPIHono, z } from '@hono/zod-openapi'
import { handleClerkWebhookRequest } from '../../services/clerk-user-sync.js'
import { ErrorResponseSchema } from '../../schemas/common.js'

const SvixHeadersSchema = z.object({
  'svix-id': z.string().openapi({
    param: {
      name: 'svix-id',
      in: 'header',
    },
    example: 'msg_123',
  }),
  'svix-timestamp': z.string().openapi({
    param: {
      name: 'svix-timestamp',
      in: 'header',
    },
    example: '1710000000',
  }),
  'svix-signature': z.string().openapi({
    param: {
      name: 'svix-signature',
      in: 'header',
    },
    example: 'v1,...',
  }),
})

const WebhookReceivedResponseSchema = z
  .object({
    duplicate: z.boolean().openapi({
      example: false,
    }),
    eventType: z.string().openapi({
      example: 'user.created',
    }),
    received: z.boolean().openapi({
      example: true,
    }),
    status: z.enum(['received', 'processing', 'processed', 'ignored', 'failed']).openapi({
      example: 'processed',
    }),
  })
  .openapi('WebhookReceivedResponse')

const clerkWebhookRoute = createRoute({
  method: 'post',
  path: '/webhooks/clerk',
  tags: ['Clerk'],
  summary: 'Receive Clerk user webhooks',
  description: 'Verifies Clerk webhook signatures and syncs user.created and user.updated events into the application database.',
  request: {
    headers: SvixHeadersSchema,
  },
  responses: {
    200: {
      description: 'Webhook received.',
      content: {
        'application/json': {
          schema: WebhookReceivedResponseSchema,
        },
      },
    },
    400: {
      description: 'Webhook signature verification failed.',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    422: {
      description: 'Webhook user payload cannot be stored.',
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

export function registerClerkWebhookRoutes(app: OpenAPIHono): void {
  app.openapi(clerkWebhookRoute, async (c) => {
    const result = await handleClerkWebhookRequest(c.req.raw)

    return c.json(result, 200)
  })
}

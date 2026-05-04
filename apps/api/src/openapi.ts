export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'School Administration API',
    version: '0.1.0',
    description: 'API endpoints for the school administration application.',
  },
  servers: [
    {
      url: '/',
      description: 'Current deployment',
    },
  ],
  tags: [
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
  paths: {
    '/api/health': {
      get: {
        tags: ['System'],
        summary: 'Check API health',
        responses: {
          '200': {
            description: 'The API is running.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['ok'],
                  properties: {
                    ok: {
                      type: 'boolean',
                      example: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/webhooks/clerk': {
      post: {
        tags: ['Clerk'],
        summary: 'Receive Clerk user webhooks',
        description: 'Verifies Clerk webhook signatures and syncs user.created and user.updated events into the application database.',
        parameters: [
          {
            name: 'svix-id',
            in: 'header',
            required: true,
            schema: { type: 'string' },
          },
          {
            name: 'svix-timestamp',
            in: 'header',
            required: true,
            schema: { type: 'string' },
          },
          {
            name: 'svix-signature',
            in: 'header',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ClerkWebhookEvent',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Webhook received.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/WebhookReceivedResponse',
                },
              },
            },
          },
          '400': {
            description: 'Webhook signature verification failed.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '422': {
            description: 'Webhook user payload cannot be stored.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '500': {
            description: 'Unexpected server error.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/api/docs': {
      get: {
        tags: ['Documentation'],
        summary: 'View Swagger UI',
        responses: {
          '200': {
            description: 'Swagger UI HTML.',
            content: {
              'text/html': {
                schema: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
    '/api/openapi': {
      get: {
        tags: ['Documentation'],
        summary: 'Get OpenAPI document',
        responses: {
          '200': {
            description: 'OpenAPI document.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      ClerkWebhookEvent: {
        type: 'object',
        required: ['type', 'data'],
        properties: {
          type: {
            type: 'string',
            examples: ['user.created', 'user.updated'],
          },
          object: {
            type: 'string',
            example: 'event',
          },
          data: {
            type: 'object',
            description: 'Clerk event payload.',
          },
        },
        additionalProperties: true,
      },
      WebhookReceivedResponse: {
        type: 'object',
        required: ['received'],
        properties: {
          received: {
            type: 'boolean',
            example: true,
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'string',
          },
        },
      },
    },
  },
} as const

export function swaggerUiHtml(openApiUrl = '/api/openapi'): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>School Administration API Docs</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body {
        margin: 0;
        background: #f7f8fb;
      }

      .swagger-ui .topbar {
        display: none;
      }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: '${openApiUrl}',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis],
        layout: 'BaseLayout'
      })
    </script>
  </body>
</html>`
}

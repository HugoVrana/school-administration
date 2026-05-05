# shadcn/ui monorepo template

This is a Vite monorepo template with shadcn/ui.

## Adding components

To add components to your app, run the following command at the root of your `web` app:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

This will place the ui components in the `packages/ui/src/components` directory.

## Using components

To use the components in your app, import them from the `ui` package.

```tsx
import { Button } from "@workspace/ui/components/button";
```

## Clerk user sync

The API app is a Hono service. Routes are registered in `apps/api/src/app.ts`, and Vercel serves them through the catch-all function at `apps/api/api/[[...route]].ts`.

It exposes a Clerk webhook endpoint that stores registered users in the application database:

```txt
POST /api/webhooks/clerk
```

Incoming Clerk deliveries are recorded in the `clerk_webhook_events` table using the `svix-id` header for idempotency. The current dispatcher processes `user.created` and `user.updated` by syncing the Clerk user into `users`; unsupported event types are stored and marked as ignored.

Swagger UI is available at:

```txt
GET /api/docs
```

Run it with:

```bash
pnpm --filter @school/api dev
```

Run it locally with Doppler-managed secrets:

```bash
pnpm --filter @school/api doppler:run
```

Run database migrations with the dedicated migration config:

```bash
pnpm --filter @school/db doppler:migrate
```

Use the same config for rollback or reset:

```bash
pnpm --filter @school/db doppler:rollback
pnpm --filter @school/db doppler:reset
```

Configure a Clerk webhook for `user.created` and `user.updated`, then set `CLERK_WEBHOOK_SIGNING_SECRET` along with the existing `PG_*` database environment variables for the API app.

For Vercel, Doppler must sync secrets into the API Vercel project environment. Running the build through Doppler is not enough for runtime serverless functions; `process.env` in the deployed function reads Vercel project environment variables.

On Vercel, create a second project for the same repository with Root Directory set to `apps/api`. Use that API project's domain for Clerk:

```txt
https://{api-project-domain}/api/webhooks/clerk
```

Keep the API project's Output Directory set to `public`. The API app includes an empty `public` directory because Vercel still expects one for an API-only project using the Other framework preset.

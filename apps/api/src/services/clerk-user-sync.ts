import type { UserJSON } from '@clerk/backend'
import { verifyWebhook, type WebhookEvent } from '@clerk/backend/webhooks'
import { createDb, type ClerkWebhookEventStatus, type Database, type NewUser, type UserRole } from '@school/db'
import { sql, type Kysely, type Transaction } from 'kysely'
import { validateApiEnvironment } from '../env.js'
import { HttpError } from '../errors.js'

const userRoles = ['admin', 'teacher', 'student'] as const

let db: ReturnType<typeof createDb> | undefined

export interface ClerkWebhookResult {
  duplicate: boolean
  eventType: string
  received: true
  status: ClerkWebhookEventStatus
}

type DatabaseExecutor = Kysely<Database> | Transaction<Database>

export async function handleClerkWebhookRequest(request: Request): Promise<ClerkWebhookResult> {
  validateApiEnvironment()

  const svixId = request.headers.get('svix-id')

  if (!svixId) {
    throw new HttpError(400, 'Missing svix-id header')
  }

  const event = await verifyClerkWebhook(request)
  const existingEvent = await getWebhookEvent(svixId)

  if (existingEvent?.status === 'processed' || existingEvent?.status === 'ignored') {
    return {
      duplicate: true,
      eventType: existingEvent.event_type,
      received: true,
      status: existingEvent.status,
    }
  }

  await ensureWebhookEvent(svixId, event)
  await updateWebhookEvent(svixId, 'processing')

  try {
    const status = await getDb().transaction().execute(async (trx) => {
      const result = await processClerkEvent(event, trx)

      await markWebhookEventCompleted(trx, svixId, result)

      return result
    })

    return {
      duplicate: false,
      eventType: event.type,
      received: true,
      status,
    }
  } catch (error) {
    await markWebhookEventFailed(svixId, error)
    throw error
  }
}

export async function closeDb(): Promise<void> {
  await db?.destroy()
  db = undefined
}

async function verifyClerkWebhook(request: Request): Promise<WebhookEvent> {
  try {
    return await verifyWebhook(request)
  } catch {
    throw new HttpError(400, 'Webhook verification failed')
  }
}

async function processClerkEvent(event: WebhookEvent, trx: Transaction<Database>): Promise<'processed' | 'ignored'> {
  if (event.type === 'user.created' || event.type === 'user.updated') {
    await upsertClerkUser(event.data, trx)
    return 'processed'
  }

  return 'ignored'
}

async function upsertClerkUser(user: UserJSON, db: DatabaseExecutor): Promise<void> {
  const email = getPrimaryEmail(user)

  if (!email) {
    throw new HttpError(422, `Clerk user ${user.id} does not have an email address`)
  }

  const syncedUser: NewUser = {
    clerk_id: user.id,
    email,
    name: getDisplayName(user),
    role: parseUserRole(user.public_metadata.role),
    requested_role: parseUserRole(user.unsafe_metadata.requestedRole),
  }

  const existingUser = await db
    .selectFrom('users')
    .select('id')
    .where('clerk_id', '=', user.id)
    .executeTakeFirst()

  if (existingUser) {
    await db
      .updateTable('users')
      .set({ ...syncedUser, updated_at: sql<Date>`now()` })
      .where('id', '=', existingUser.id)
      .execute()
    return
  }

  await db
    .insertInto('users')
    .values(syncedUser)
    .onConflict((oc) =>
      oc.column('email').doUpdateSet({
        ...syncedUser,
        updated_at: sql<Date>`now()`,
      }),
    )
    .execute()
}

async function getWebhookEvent(svixId: string) {
  return getDb()
    .selectFrom('clerk_webhook_events')
    .select(['event_type', 'status'])
    .where('svix_id', '=', svixId)
    .executeTakeFirst()
}

async function ensureWebhookEvent(svixId: string, event: WebhookEvent): Promise<void> {
  await getDb()
    .insertInto('clerk_webhook_events')
    .values({
      svix_id: svixId,
      event_type: event.type,
      payload: event as unknown as Record<string, unknown>,
      status: 'received',
    })
    .onConflict((oc) => oc.column('svix_id').doNothing())
    .execute()
}

async function updateWebhookEvent(svixId: string, status: ClerkWebhookEventStatus): Promise<void> {
  await getDb()
    .updateTable('clerk_webhook_events')
    .set({
      error: null,
      status,
    })
    .where('svix_id', '=', svixId)
    .execute()
}

async function markWebhookEventCompleted(db: DatabaseExecutor, svixId: string, status: 'processed' | 'ignored'): Promise<void> {
  await db
    .updateTable('clerk_webhook_events')
    .set({
      error: null,
      processed_at: sql<Date>`now()`,
      status,
    })
    .where('svix_id', '=', svixId)
    .execute()
}

async function markWebhookEventFailed(svixId: string, error: unknown): Promise<void> {
  await getDb()
    .updateTable('clerk_webhook_events')
    .set({
      error: getErrorMessage(error),
      processed_at: sql<Date>`now()`,
      status: 'failed',
    })
    .where('svix_id', '=', svixId)
    .execute()
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message

  return 'Unknown webhook processing error'
}

function getDb(): ReturnType<typeof createDb> {
  db ??= createDb()

  return db
}

function getPrimaryEmail(user: UserJSON): string | undefined {
  const primaryEmail = user.email_addresses.find((email) => email.id === user.primary_email_address_id)

  return primaryEmail?.email_address ?? user.email_addresses[0]?.email_address
}

function getDisplayName(user: UserJSON): string | null {
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ')

  return name || user.username || null
}

function parseUserRole(role: unknown): UserRole | null {
  if (userRoles.includes(role as UserRole)) return role as UserRole

  return null
}

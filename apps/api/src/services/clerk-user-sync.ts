import type { UserJSON } from '@clerk/backend'
import { verifyWebhook, type WebhookEvent } from '@clerk/backend/webhooks'
import { createDb, type NewUser, type UserRole } from '@school/db'
import { sql } from 'kysely'
import { validateApiEnvironment } from '../env.js'
import { HttpError } from '../errors.js'

const userRoles = ['admin', 'teacher', 'student'] as const

let db: ReturnType<typeof createDb> | undefined

export async function handleClerkWebhookRequest(request: Request): Promise<void> {
  validateApiEnvironment()

  const event = await verifyClerkWebhook(request)

  if (event.type === 'user.created' || event.type === 'user.updated') {
    await upsertClerkUser(event.data)
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

async function upsertClerkUser(user: UserJSON): Promise<void> {
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

  await getDb().transaction().execute(async (trx) => {
    const existingUser = await trx
      .selectFrom('users')
      .select('id')
      .where('clerk_id', '=', user.id)
      .executeTakeFirst()

    if (existingUser) {
      await trx
        .updateTable('users')
        .set({ ...syncedUser, updated_at: sql<Date>`now()` })
        .where('id', '=', existingUser.id)
        .execute()
      return
    }

    await trx
      .insertInto('users')
      .values(syncedUser)
      .onConflict((oc) =>
        oc.column('email').doUpdateSet({
          ...syncedUser,
          updated_at: sql<Date>`now()`,
        }),
      )
      .execute()
  })
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

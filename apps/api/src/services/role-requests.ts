import type { Database, UserRole } from '@school/db'
import { sql, type Transaction } from 'kysely'
import { HttpError } from '../errors.js'
import { assignClerkUserRole, clearClerkUserRequestedRole } from './clerk-user-metadata.js'
import { getDb } from './database.js'

const roleRequestUserColumns = [
  'id',
  'clerk_id',
  'email',
  'name',
  'role',
  'requested_role',
  'created_at',
  'updated_at',
] as const

interface RoleRequestUserRow {
  clerk_id: string | null
  created_at: Date
  email: string
  id: number
  name: string | null
  requested_role: UserRole | null
  role: UserRole | null
  updated_at: Date
}

type RoleRequestTransaction = Transaction<Database>

export interface ResolvedRoleRequestUser {
  clerkId: string | null
  createdAt: string
  email: string
  id: number
  name: string | null
  requestedRole: UserRole | null
  role: UserRole | null
  updatedAt: string
}

export interface RoleRequestUser extends ResolvedRoleRequestUser {
  requestedRole: UserRole
}

export async function listRoleRequests(): Promise<RoleRequestUser[]> {
  const users = await getDb()
    .selectFrom('users')
    .select(roleRequestUserColumns)
    .where('requested_role', 'is not', null)
    .orderBy('created_at', 'desc')
    .execute()

  return users.flatMap((user) => {
    if (!user.requested_role) return []

    return [{
      ...toRoleRequestUser(user),
      requestedRole: user.requested_role,
    }]
  })
}

export async function approveRoleRequest(userId: number): Promise<ResolvedRoleRequestUser> {
  return getDb().transaction().execute(async (trx) => {
    const user = await getPendingRoleRequest(userId, trx)
    const clerkId = getRequiredClerkId(user)
    const requestedRole = getRequiredRequestedRole(user)

    await assignClerkUserRole(clerkId, requestedRole)

    const updatedUser = await trx
      .updateTable('users')
      .set({
        role: requestedRole,
        requested_role: null,
        updated_at: sql<Date>`now()`,
      })
      .where('id', '=', userId)
      .returning(roleRequestUserColumns)
      .executeTakeFirst()

    return toExistingRoleRequestUser(updatedUser)
  })
}

export async function declineRoleRequest(userId: number): Promise<ResolvedRoleRequestUser> {
  return getDb().transaction().execute(async (trx) => {
    const user = await getPendingRoleRequest(userId, trx)
    const clerkId = getRequiredClerkId(user)

    await clearClerkUserRequestedRole(clerkId)

    const updatedUser = await trx
      .updateTable('users')
      .set({
        requested_role: null,
        updated_at: sql<Date>`now()`,
      })
      .where('id', '=', userId)
      .returning(roleRequestUserColumns)
      .executeTakeFirst()

    return toExistingRoleRequestUser(updatedUser)
  })
}

async function getPendingRoleRequest(userId: number, db: RoleRequestTransaction): Promise<RoleRequestUserRow> {
  const user = await db
    .selectFrom('users')
    .select(roleRequestUserColumns)
    .where('id', '=', userId)
    .where('requested_role', 'is not', null)
    .forUpdate()
    .executeTakeFirst()

  if (!user) {
    throw new HttpError(404, 'Role request not found')
  }

  return user
}

function getRequiredClerkId(user: RoleRequestUserRow): string {
  if (!user.clerk_id) {
    throw new HttpError(409, 'Role request user is not linked to a Clerk user')
  }

  return user.clerk_id
}

function getRequiredRequestedRole(user: RoleRequestUserRow): UserRole {
  if (!user.requested_role) {
    throw new HttpError(404, 'Role request not found')
  }

  return user.requested_role
}

function toExistingRoleRequestUser(user: RoleRequestUserRow | undefined): ResolvedRoleRequestUser {
  if (!user) {
    throw new HttpError(404, 'Role request not found')
  }

  return toRoleRequestUser(user)
}

function toRoleRequestUser(user: RoleRequestUserRow): ResolvedRoleRequestUser {
  return {
    clerkId: user.clerk_id,
    createdAt: user.created_at.toISOString(),
    email: user.email,
    id: user.id,
    name: user.name,
    requestedRole: user.requested_role,
    role: user.role,
    updatedAt: user.updated_at.toISOString(),
  }
}

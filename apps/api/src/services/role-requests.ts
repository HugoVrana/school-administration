import type { UserRole } from '@school/db'
import { sql } from 'kysely'
import { HttpError } from '../errors.js'
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
  const user = await getDb()
    .updateTable('users')
    .set((eb) => ({
      role: eb.ref('requested_role'),
      requested_role: null,
      updated_at: sql<Date>`now()`,
    }))
    .where('id', '=', userId)
    .where('requested_role', 'is not', null)
    .returning(roleRequestUserColumns)
    .executeTakeFirst()

  return toExistingRoleRequestUser(user)
}

export async function declineRoleRequest(userId: number): Promise<ResolvedRoleRequestUser> {
  const user = await getDb()
    .updateTable('users')
    .set({
      requested_role: null,
      updated_at: sql<Date>`now()`,
    })
    .where('id', '=', userId)
    .where('requested_role', 'is not', null)
    .returning(roleRequestUserColumns)
    .executeTakeFirst()

  return toExistingRoleRequestUser(user)
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

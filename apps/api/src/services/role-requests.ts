import type { UserRole } from '@school/db'
import { getDb } from './database.js'

export interface RoleRequestUser {
  clerkId: string | null
  createdAt: string
  email: string
  id: number
  name: string | null
  requestedRole: UserRole
  role: UserRole | null
  updatedAt: string
}

export async function listRoleRequests(): Promise<RoleRequestUser[]> {
  const users = await getDb()
    .selectFrom('users')
    .select(['id', 'clerk_id', 'email', 'name', 'role', 'requested_role', 'created_at', 'updated_at'])
    .where('requested_role', 'is not', null)
    .orderBy('created_at', 'desc')
    .execute()

  return users.flatMap((user) => {
    if (!user.requested_role) return []

    return [{
      clerkId: user.clerk_id,
      createdAt: user.created_at.toISOString(),
      email: user.email,
      id: user.id,
      name: user.name,
      requestedRole: user.requested_role,
      role: user.role,
      updatedAt: user.updated_at.toISOString(),
    }]
  })
}

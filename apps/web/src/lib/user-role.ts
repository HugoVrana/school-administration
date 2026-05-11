export type UserRole = "admin" | "teacher" | "student"

type UserMetadata = Record<string, unknown>

type UserWithRoleMetadata = {
  publicMetadata?: UserMetadata
  unsafeMetadata?: UserMetadata
}

const userRoles = ["admin", "teacher", "student"] as const

export function getUserRole(
  user: UserWithRoleMetadata | null | undefined
): UserRole | undefined {
  const publicRole = user?.publicMetadata?.role

  if (isUserRole(publicRole)) {
    return publicRole
  }

  return undefined
}

export function getRequestedUserRole(
  user: UserWithRoleMetadata | null | undefined
): UserRole | undefined {
  const selectedRole = user?.unsafeMetadata?.requestedRole

  if (isUserRole(selectedRole)) {
    return selectedRole
  }

  return undefined
}

function isUserRole(role: unknown): role is UserRole {
  return userRoles.includes(role as UserRole)
}

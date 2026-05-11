import { createClerkClient, type ClerkClient } from '@clerk/backend'
import type { UserRole } from '@school/db'
import { getClerkSecretKey } from '../env.js'

let clerkClient: ClerkClient | undefined

export async function assignClerkUserRole(clerkUserId: string, role: UserRole): Promise<void> {
  await getClerkClient().users.updateUserMetadata(clerkUserId, {
    publicMetadata: {
      role,
    },
    unsafeMetadata: {
      requestedRole: null,
    },
  })
}

export async function clearClerkUserRequestedRole(clerkUserId: string): Promise<void> {
  await getClerkClient().users.updateUserMetadata(clerkUserId, {
    unsafeMetadata: {
      requestedRole: null,
    },
  })
}

function getClerkClient(): ClerkClient {
  clerkClient ??= createClerkClient({
    secretKey: getClerkSecretKey(),
  })

  return clerkClient
}

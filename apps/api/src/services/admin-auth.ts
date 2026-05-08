import { verifyToken } from '@clerk/backend'
import { getClerkSecretKey, validateDatabaseEnvironment } from '../env.js'
import { HttpError } from '../errors.js'
import { getDb } from './database.js'

export interface AdminAuth {
  clerkUserId: string
}

export async function requireAdminRequest(request: Request): Promise<AdminAuth> {
  validateDatabaseEnvironment()

  const token = getBearerToken(request)

  if (!token) throw new HttpError(401, 'Missing bearer token')

  const secretKey = getClerkSecretKey()
  let clerkUserId: string | undefined

  try {
    const payload = await verifyToken(token, {
      secretKey,
    })

    clerkUserId = payload.sub
  } catch {
    throw new HttpError(401, 'Invalid bearer token')
  }

  if (!clerkUserId) throw new HttpError(401, 'Invalid bearer token')

  const user = await getDb()
    .selectFrom('users')
    .select(['role'])
    .where('clerk_id', '=', clerkUserId)
    .executeTakeFirst()

  if (user?.role !== 'admin') throw new HttpError(403, 'Admin role required')

  return { clerkUserId }
}

function getBearerToken(request: Request): string | undefined {
  const authorization = request.headers.get('authorization')

  if (!authorization) return undefined

  const [scheme, token] = authorization.split(' ', 2)

  if (scheme !== 'Bearer' || !token) return undefined

  return token
}

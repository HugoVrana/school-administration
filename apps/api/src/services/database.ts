import { createDb } from '@school/db'

let db: ReturnType<typeof createDb> | undefined

export function getDb(): ReturnType<typeof createDb> {
  db ??= createDb()

  return db
}

export async function closeDb(): Promise<void> {
  await db?.destroy()
  db = undefined
}

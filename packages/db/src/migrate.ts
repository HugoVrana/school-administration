import { FileMigrationProvider, Migrator } from 'kysely'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createAdminDb } from './db.js'

for (const key of ['PG_URL', 'PG_PORT', 'PG_ADMIN_USER', 'PG_ADMIN_PASSWORD', 'PG_CERT', 'PG_USER', 'PG_DATABASE']) {
  if (!process.env[key]) {
    throw new Error(`${key} is not set`);
  }
  else  {
    console.log(`${key} available`)
  }
}

const db = createAdminDb()

const migrator = new Migrator({
  db,
  provider: new FileMigrationProvider({
    fs,
    path,
    migrationFolder: path.join(fileURLToPath(import.meta.url), '..', 'migrations'),
  }),
})

const command = process.argv[2]

if (command === 'up') {
  const { error, results } = await migrator.migrateToLatest()
  results?.forEach((r) => {
    if (r.status === 'Success') console.log(`migration "${r.migrationName}" applied`)
    else if (r.status === 'Error') console.error(`migration "${r.migrationName}" failed`)
  })
  if (error) { console.error(error); process.exit(1) }
} else if (command === 'down') {
  const { error, results } = await migrator.migrateDown()
  results?.forEach((r) => {
    if (r.status === 'Success') console.log(`migration "${r.migrationName}" rolled back`)
    else if (r.status === 'Error') console.error(`migration "${r.migrationName}" failed`)
  })
  if (error) { console.error(error); process.exit(1) }
} else if (command === 'reset') {
  let error: unknown
  do {
    ;({ error } = await migrator.migrateDown())
  } while (!error)
  console.log('all migrations rolled back')
} else {
  console.error(`unknown command: ${command}. Use "up", "down", or "reset"`)
  process.exit(1)
}

await db.destroy()

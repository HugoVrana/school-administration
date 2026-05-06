import { sql, type Kysely } from 'kysely'

const runtimeTables = ['users', 'courses', 'enrollments', 'clerk_webhook_events'] as const
const runtimeSequences = ['users_id_seq', 'courses_id_seq', 'enrollments_id_seq', 'clerk_webhook_events_id_seq'] as const

export async function up(db: Kysely<unknown>): Promise<void> {
  const runtimeUser = getRuntimeUser()

  await sql`grant usage on schema public to ${sql.id(runtimeUser)}`.execute(db)
  await sql`grant select, insert, update, delete on table ${sql.join(runtimeTables.map((table) => sql.table(table)))} to ${sql.id(runtimeUser)}`.execute(db)
  await sql`grant usage, select, update on sequence ${sql.join(runtimeSequences.map((sequence) => sql.id(sequence)))} to ${sql.id(runtimeUser)}`.execute(db)
}

export async function down(db: Kysely<unknown>): Promise<void> {
  const runtimeUser = getRuntimeUser()

  await sql`revoke usage, select, update on sequence ${sql.join(runtimeSequences.map((sequence) => sql.id(sequence)))} from ${sql.id(runtimeUser)}`.execute(db)
  await sql`revoke select, insert, update, delete on table ${sql.join(runtimeTables.map((table) => sql.table(table)))} from ${sql.id(runtimeUser)}`.execute(db)
  await sql`revoke usage on schema public from ${sql.id(runtimeUser)}`.execute(db)
}

function getRuntimeUser(): string {
  const runtimeUser = process.env.PG_USER

  if (!runtimeUser) throw new Error('PG_USER is not set')

  return runtimeUser
}

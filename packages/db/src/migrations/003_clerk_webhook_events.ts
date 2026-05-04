import { sql, type Kysely } from 'kysely'

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('clerk_webhook_events')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('svix_id', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('event_type', 'varchar(255)', (col) => col.notNull())
    .addColumn('payload', 'jsonb', (col) => col.notNull())
    .addColumn('status', 'varchar(50)', (col) => col.notNull())
    .addColumn('error', 'text')
    .addColumn('received_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('processed_at', 'timestamptz')
    .execute()

  await db.schema.createIndex('clerk_webhook_events_event_type_idx').on('clerk_webhook_events').column('event_type').execute()
  await db.schema.createIndex('clerk_webhook_events_status_idx').on('clerk_webhook_events').column('status').execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropIndex('clerk_webhook_events_status_idx').ifExists().execute()
  await db.schema.dropIndex('clerk_webhook_events_event_type_idx').ifExists().execute()
  await db.schema.dropTable('clerk_webhook_events').execute()
}

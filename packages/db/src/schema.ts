import type { ColumnType, Generated, Insertable, Selectable, Updateable } from 'kysely'

// ---- users ----

export type UserRole = 'admin' | 'teacher' | 'student'

export interface UserTable {
  id: Generated<number>
  clerk_id: string | null
  email: string
  name: string | null
  role: UserRole | null
  requested_role: UserRole | null
  created_at: ColumnType<Date, never, never>
  updated_at: ColumnType<Date, never, Date>
}

export type User = Selectable<UserTable>
export type NewUser = Insertable<UserTable>
export type UserUpdate = Updateable<UserTable>

// ---- courses ----

export interface CourseTable {
  id: Generated<number>
  name: string
  description: string | null
  created_at: ColumnType<Date, never, never>
}

export type Course = Selectable<CourseTable>
export type NewCourse = Insertable<CourseTable>
export type CourseUpdate = Updateable<CourseTable>

// ---- enrollments ----

export interface EnrollmentTable {
  id: Generated<number>
  student_id: number
  course_id: number
  enrolled_at: ColumnType<Date, never, never>
}

export type Enrollment = Selectable<EnrollmentTable>
export type NewEnrollment = Insertable<EnrollmentTable>
export type EnrollmentUpdate = Updateable<EnrollmentTable>

// ---- clerk webhook events ----

export type ClerkWebhookEventStatus = 'received' | 'processing' | 'processed' | 'ignored' | 'failed'

export interface ClerkWebhookEventTable {
  id: Generated<number>
  svix_id: string
  event_type: string
  payload: ColumnType<Record<string, unknown>, Record<string, unknown>, Record<string, unknown>>
  status: ClerkWebhookEventStatus
  error: string | null
  received_at: ColumnType<Date, never, never>
  processed_at: ColumnType<Date | null, never, Date | null>
}

export type ClerkWebhookEvent = Selectable<ClerkWebhookEventTable>
export type NewClerkWebhookEvent = Insertable<ClerkWebhookEventTable>
export type ClerkWebhookEventUpdate = Updateable<ClerkWebhookEventTable>

// ---- database ----

export interface Database {
  users: UserTable
  courses: CourseTable
  enrollments: EnrollmentTable
  clerk_webhook_events: ClerkWebhookEventTable
}

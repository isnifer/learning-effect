import { sql } from 'drizzle-orm'
import { check, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { TaskStatus } from '#/shared/contracts/Task'

const taskStatusValues = sql
  .join(
    TaskStatus.literals.map(status => sql`${status}`),
    sql`, `
  )
  .inlineParams()

export const tasks = sqliteTable(
  'tasks',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    status: text('status', {
      enum: TaskStatus.literals,
    })
      .notNull()
      .default('TODO'),
    createdAt: integer('created_at').notNull(),
  },
  table => [check('tasks_status_check', sql`${table.status} in (${taskStatusValues})`)]
)

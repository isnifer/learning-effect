import { sql } from 'drizzle-orm'
import { check, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { TodoStatus } from '#/shared/contracts/Todo'

const todoStatusValues = sql
  .join(
    TodoStatus.literals.map(status => sql`${status}`),
    sql`, `
  )
  .inlineParams()

export const todos = sqliteTable(
  'todos',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    status: text('status', {
      enum: TodoStatus.literals,
    })
      .notNull()
      .default('TODO'),
    createdAt: integer('created_at').notNull(),
  },
  table => [check('todos_status_check', sql`${table.status} in (${todoStatusValues})`)]
)

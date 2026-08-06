import { sql } from 'drizzle-orm'
import { check, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { TicketStatus } from '#/shared/contracts/Ticket'
import { projects } from './projects'

const ticketStatusValues = sql
  .join(
    TicketStatus.literals.map(status => sql`${status}`),
    sql`, `
  )
  .inlineParams()

export const tickets = sqliteTable(
  'tickets',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id),
    number: integer('number').notNull(),
    title: text('title').notNull(),
    status: text('status', {
      enum: TicketStatus.literals,
    })
      .notNull()
      .default('TODO'),
    createdAt: integer('created_at').notNull(),
  },
  table => [
    uniqueIndex('tickets_project_id_number_unique').on(table.projectId, table.number),
    check('tickets_number_check', sql`typeof(${table.number}) = 'integer' and ${table.number} > 0`),
    check('tickets_status_check', sql`${table.status} in (${ticketStatusValues})`),
  ]
)

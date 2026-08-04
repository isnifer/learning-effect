import { sql } from 'drizzle-orm'
import { check, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { TicketStatus } from '#/shared/contracts/Ticket'

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
    title: text('title').notNull(),
    status: text('status', {
      enum: TicketStatus.literals,
    })
      .notNull()
      .default('TODO'),
    createdAt: integer('created_at').notNull(),
  },
  table => [check('tickets_status_check', sql`${table.status} in (${ticketStatusValues})`)]
)

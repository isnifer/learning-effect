import { asc, desc, eq, inArray } from 'drizzle-orm'
import * as Clock from 'effect/Clock'
import * as Crypto from 'effect/Crypto'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import TicketRepository, {
  TicketNotFoundError,
  TicketRepositoryError,
} from '#/server/application/repositories/TicketRepository'
import Ticket, { TicketStatus, type TTicket } from '#/shared/contracts/Ticket'
import { tickets } from '../../sqlite/schema'
import BetterSqlite3Client from '../client/BetterSqlite3Client'

const ticketStatusGroup = {
  IN_PROGRESS: 'ACTIVE',
  TODO: 'PENDING',
  COMPLETED: 'COMPLETED',
} satisfies Record<TTicket['status'], 'ACTIVE' | 'PENDING' | 'COMPLETED'>

const activeTicketStatuses = TicketStatus.literals.filter(
  status => ticketStatusGroup[status] === 'ACTIVE'
)
const completedTicketStatuses = TicketStatus.literals.filter(
  status => ticketStatusGroup[status] === 'COMPLETED'
)

const BetterSqlite3TicketRepository = Layer.effect(TicketRepository)(
  Effect.gen(function* () {
    const crypto = yield* Crypto.Crypto
    const db = yield* BetterSqlite3Client

    return {
      create: input =>
        Effect.gen(function* () {
          const id = yield* crypto.randomUUIDv7
          const createdAt = yield* Clock.currentTimeMillis

          const ticketItem = yield* Effect.try(() =>
            db
              .insert(tickets)
              .values({
                id,
                title: input.title,
                status: 'TODO',
                createdAt,
              })
              .returning()
              .get()
          )

          return yield* Schema.decodeEffect(Ticket)(ticketItem)
        }).pipe(
          Effect.mapError(cause =>
            TicketRepositoryError.make({
              operation: 'create',
              cause,
            })
          )
        ),
      getAll: () =>
        Effect.try(() =>
          db
            .select()
            .from(tickets)
            .orderBy(
              desc(inArray(tickets.status, activeTicketStatuses)),
              asc(inArray(tickets.status, completedTicketStatuses)),
              desc(tickets.id)
            )
            .all()
        ).pipe(
          Effect.flatMap(Schema.decodeEffect(Schema.Array(Ticket))),
          Effect.mapError(cause =>
            TicketRepositoryError.make({
              operation: 'getAll',
              cause,
            })
          )
        ),
      updateStatus: input =>
        Effect.gen(function* () {
          const ticketItem = yield* Effect.try(() =>
            db
              .update(tickets)
              .set({ status: input.status })
              .where(eq(tickets.id, input.id))
              .returning()
              .get()
          ).pipe(
            Effect.mapError(cause =>
              TicketRepositoryError.make({
                operation: 'updateStatus',
                cause,
              })
            )
          )

          if (!ticketItem) {
            return yield* Effect.fail(TicketNotFoundError.make({ id: input.id }))
          }

          return yield* Schema.decodeEffect(Ticket)(ticketItem).pipe(
            Effect.mapError(cause =>
              TicketRepositoryError.make({
                operation: 'updateStatus',
                cause,
              })
            )
          )
        }),
      updateTitle: input =>
        Effect.gen(function* () {
          const ticketItem = yield* Effect.try(() =>
            db
              .update(tickets)
              .set({ title: input.title })
              .where(eq(tickets.id, input.id))
              .returning()
              .get()
          ).pipe(
            Effect.mapError(cause =>
              TicketRepositoryError.make({
                operation: 'updateTitle',
                cause,
              })
            )
          )

          if (!ticketItem) {
            return yield* Effect.fail(TicketNotFoundError.make({ id: input.id }))
          }

          return yield* Schema.decodeEffect(Ticket)(ticketItem).pipe(
            Effect.mapError(cause =>
              TicketRepositoryError.make({
                operation: 'updateTitle',
                cause,
              })
            )
          )
        }),
    }
  })
)

export default BetterSqlite3TicketRepository

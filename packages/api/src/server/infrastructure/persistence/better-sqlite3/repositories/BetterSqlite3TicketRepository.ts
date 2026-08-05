import Database from 'better-sqlite3'
import { and, asc, desc, eq, inArray, isNull } from 'drizzle-orm'
import * as Cause from 'effect/Cause'
import * as Clock from 'effect/Clock'
import * as Crypto from 'effect/Crypto'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import { ProjectArchivedError } from '#/server/application/repositories/ProjectRepository'
import TicketRepository, {
  TicketNotFoundError,
  TicketRepositoryError,
} from '#/server/application/repositories/TicketRepository'
import { ProjectId } from '#/shared/contracts/Project'
import Ticket, { TicketStatus, type TTicket } from '#/shared/contracts/Ticket'
import { projects, tickets } from '../../sqlite/schema'
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
                projectId: input.projectId,
                title: input.title,
                status: 'TODO',
                createdAt,
              })
              .returning()
              .get()
          )

          return yield* Schema.decodeEffect(Ticket)(ticketItem)
        }).pipe(
          Effect.mapError(cause => {
            const repositoryCause = Cause.isUnknownError(cause) ? cause.cause : cause

            return repositoryCause instanceof Database.SqliteError &&
              repositoryCause.code === 'SQLITE_CONSTRAINT_TRIGGER' &&
              repositoryCause.message === 'tickets_project_archived'
              ? ProjectArchivedError.make({ id: input.projectId })
              : TicketRepositoryError.make({
                  operation: 'create',
                  cause: repositoryCause,
                })
          })
        ),
      getByProject: input =>
        Effect.try(() =>
          db
            .select()
            .from(tickets)
            .where(eq(tickets.projectId, input.projectId))
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
              operation: 'getByProject',
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
            return yield* TicketNotFoundError.make({ id: input.id })
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
              .from(projects)
              .where(
                and(
                  eq(tickets.id, input.id),
                  eq(tickets.projectId, projects.id),
                  isNull(projects.archivedAt)
                )
              )
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
            const ticketProjectItem = yield* Effect.try(() =>
              db
                .select({ projectId: tickets.projectId })
                .from(tickets)
                .where(eq(tickets.id, input.id))
                .get()
            ).pipe(
              Effect.mapError(cause =>
                TicketRepositoryError.make({
                  operation: 'updateTitle',
                  cause,
                })
              )
            )

            if (!ticketProjectItem) {
              return yield* TicketNotFoundError.make({ id: input.id })
            }

            const projectId = yield* Schema.decodeEffect(ProjectId)(
              ticketProjectItem.projectId
            ).pipe(
              Effect.mapError(cause =>
                TicketRepositoryError.make({
                  operation: 'updateTitle',
                  cause,
                })
              )
            )

            return yield* ProjectArchivedError.make({ id: projectId })
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

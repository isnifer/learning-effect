import { fileURLToPath } from 'node:url'
import { BrowserCrypto } from '@effect/platform-browser'
import { afterAll, beforeEach, describe, expect, layer } from '@effect/vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import { TestClock } from 'effect/testing'
import TicketRepository, {
  TicketNotFoundError,
} from '#/server/application/repositories/TicketRepository'
import { TicketId, TicketTitle } from '#/shared/contracts/Ticket'
import * as schema from '../../sqlite/schema'
import BetterSqlite3Client from '../client/BetterSqlite3Client'
import BetterSqlite3TicketRepository from './BetterSqlite3TicketRepository'

const migrationsFolder = fileURLToPath(new URL('../../../../../../migrations', import.meta.url))

describe('BetterSqlite3TicketRepository', () => {
  const database = new Database(':memory:')
  const client = drizzle(database, { schema })
  const InfrastructureTest = Layer.mergeAll(
    BetterSqlite3Client.fromDatabase(database),
    BrowserCrypto.layer
  )
  const BetterSqlite3TicketRepositoryTest = Layer.provide(
    BetterSqlite3TicketRepository,
    InfrastructureTest
  )

  migrate(client, { migrationsFolder })

  beforeEach(() => {
    database.exec('DELETE FROM tickets')
  })
  afterAll(() => database.close())

  layer(BetterSqlite3TicketRepositoryTest)(it => {
    it.effect('create: inserts and returns a Ticket', () =>
      Effect.gen(function* () {
        const ticketRepository = yield* TicketRepository

        const ticketTitle = yield* Schema.decodeEffect(TicketTitle)('Test')
        const createdTicket = yield* ticketRepository.create({ title: ticketTitle })

        expect(createdTicket.title).toEqual('Test')
      })
    )

    it.effect('getAll: orders status groups and then UUIDv7 descending', () =>
      Effect.gen(function* () {
        const ticketRepository = yield* TicketRepository

        const olderInProgressTitle = yield* Schema.decodeEffect(TicketTitle)('Older In Progress')
        const ticketTitle = yield* Schema.decodeEffect(TicketTitle)('Ticket')
        const newerInProgressTitle = yield* Schema.decodeEffect(TicketTitle)('Newer In Progress')
        const completedTitle = yield* Schema.decodeEffect(TicketTitle)('Completed')

        const olderInProgressTicket = yield* ticketRepository.create({
          title: olderInProgressTitle,
        })
        const olderInProgress = yield* ticketRepository.updateStatus({
          id: olderInProgressTicket.id,
          status: 'IN_PROGRESS',
        })

        yield* TestClock.adjust('1 millis')
        const ticket = yield* ticketRepository.create({ title: ticketTitle })

        yield* TestClock.adjust('1 millis')
        const newerInProgressTicket = yield* ticketRepository.create({
          title: newerInProgressTitle,
        })
        const newerInProgress = yield* ticketRepository.updateStatus({
          id: newerInProgressTicket.id,
          status: 'IN_PROGRESS',
        })

        yield* TestClock.adjust('1 millis')
        const completedTicket = yield* ticketRepository.create({ title: completedTitle })
        const completed = yield* ticketRepository.updateStatus({
          id: completedTicket.id,
          status: 'COMPLETED',
        })

        const tickets = yield* ticketRepository.getAll()

        expect(newerInProgress.id > olderInProgress.id).toBe(true)
        expect(tickets).toStrictEqual([newerInProgress, olderInProgress, ticket, completed])
      })
    )

    it.effect('updateStatus: updates and returns a Ticket', () =>
      Effect.gen(function* () {
        const ticketRepository = yield* TicketRepository

        const ticketTitle = yield* Schema.decodeEffect(TicketTitle)('Updated Ticket')
        const createdTicket = yield* ticketRepository.create({ title: ticketTitle })
        const updatedTicket = yield* ticketRepository.updateStatus({
          id: createdTicket.id,
          status: 'COMPLETED',
        })
        const tickets = yield* ticketRepository.getAll()

        expect(updatedTicket).toStrictEqual({
          ...createdTicket,
          status: 'COMPLETED',
        })
        expect(tickets).toContainEqual(updatedTicket)
      })
    )

    it.effect('updateStatus: fails with TicketNotFoundError when the Ticket does not exist', () =>
      Effect.gen(function* () {
        const ticketRepository = yield* TicketRepository
        const id = yield* Schema.decodeEffect(TicketId)('019fcc1a-bd5d-751e-9a30-0bc92d133b2c')

        const error = yield* ticketRepository
          .updateStatus({ id, status: 'COMPLETED' })
          .pipe(Effect.flip)

        expect(error).toStrictEqual(TicketNotFoundError.make({ id }))
      })
    )

    it.effect('updateTitle: updates and returns a Ticket', () =>
      Effect.gen(function* () {
        const ticketRepository = yield* TicketRepository

        const ticketTitle = yield* Schema.decodeEffect(TicketTitle)('Original Ticket')
        const updatedTicketTitle = yield* Schema.decodeEffect(TicketTitle)('Updated Ticket')
        const createdTicket = yield* ticketRepository.create({ title: ticketTitle })
        const updatedTicket = yield* ticketRepository.updateTitle({
          id: createdTicket.id,
          title: updatedTicketTitle,
        })
        const tickets = yield* ticketRepository.getAll()

        expect(updatedTicket).toStrictEqual({
          ...createdTicket,
          title: updatedTicketTitle,
        })
        expect(tickets).toContainEqual(updatedTicket)
      })
    )

    it.effect('updateTitle: fails with TicketNotFoundError when the Ticket does not exist', () =>
      Effect.gen(function* () {
        const ticketRepository = yield* TicketRepository
        const id = yield* Schema.decodeEffect(TicketId)('019fcc1a-bd5d-751e-9a30-0bc92d133b2d')
        const title = yield* Schema.decodeEffect(TicketTitle)('Updated Ticket')

        const error = yield* ticketRepository.updateTitle({ id, title }).pipe(Effect.flip)

        expect(error).toStrictEqual(TicketNotFoundError.make({ id }))
      })
    )
  })
})

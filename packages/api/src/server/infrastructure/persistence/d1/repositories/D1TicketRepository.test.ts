import { BrowserCrypto } from '@effect/platform-browser'
import { describe, expect, layer } from '@effect/vitest'
import { env } from 'cloudflare:workers'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import { TestClock } from 'effect/testing'
import TicketRepository, {
  TicketNotFoundError,
} from '#/server/application/repositories/TicketRepository'
import { TicketId, TicketTitle } from '#/shared/contracts/Ticket'
import D1Client from '../client/D1Client'
import D1TicketRepository from './D1TicketRepository'

describe('D1TicketRepository', () => {
  const InfrastructureTest = Layer.mergeAll(D1Client.layer(env.DB), BrowserCrypto.layer)
  const D1TicketRepositoryTest = Layer.provide(D1TicketRepository, InfrastructureTest)

  layer(D1TicketRepositoryTest)(it => {
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
        const createdTicketIds = new Set([
          olderInProgress.id,
          ticket.id,
          newerInProgress.id,
          completed.id,
        ])
        const createdTickets = tickets.filter(ticket => createdTicketIds.has(ticket.id))

        expect(newerInProgress.id > olderInProgress.id).toBe(true)
        expect(createdTickets).toStrictEqual([newerInProgress, olderInProgress, ticket, completed])
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

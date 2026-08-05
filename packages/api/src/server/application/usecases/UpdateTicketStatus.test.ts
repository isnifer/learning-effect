import { describe, expect, layer } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import TicketRepositoryStub from '#/server/application/repositories/testing/TicketRepositoryStub'
import TicketRepository, {
  TicketNotFoundError,
  TicketRepositoryError,
} from '#/server/application/repositories/TicketRepository'
import Ticket from '#/shared/contracts/Ticket'
import UpdateTicketStatus from './UpdateTicketStatus'

describe('UpdateTicketStatus', () => {
  const expectedTicket = Schema.decodeUnknownSync(Ticket)({
    id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2a',
    projectId: '019fcc1a-bd5d-751e-9a30-0bc92d133b29',
    title: 'Test Ticket',
    status: 'COMPLETED',
    createdAt: 1785835769172,
  })

  const input = {
    id: expectedTicket.id,
    status: expectedTicket.status,
  }

  const TicketRepositorySucceeded = Layer.succeed(TicketRepository)({
    ...TicketRepositoryStub,
    updateStatus: repositoryInput =>
      Effect.sync(() => {
        expect(repositoryInput).toStrictEqual(input)

        return expectedTicket
      }),
  })

  layer(TicketRepositorySucceeded)('when the repository succeeds', it => {
    it.effect('updateStatus: returns the updated Ticket', () =>
      Effect.gen(function* () {
        const result = yield* UpdateTicketStatus(input)

        expect(result).toBe(expectedTicket)
      })
    )
  })

  const notFoundError = TicketNotFoundError.make({ id: expectedTicket.id })
  const TicketRepositoryMissing = Layer.succeed(TicketRepository)({
    ...TicketRepositoryStub,
    updateStatus: () => Effect.fail(notFoundError),
  })

  layer(TicketRepositoryMissing)('when the Ticket does not exist', it => {
    it.effect('updateStatus: preserves TicketNotFoundError', () =>
      Effect.gen(function* () {
        const error = yield* UpdateTicketStatus(input).pipe(Effect.flip)

        expect(error).toBe(notFoundError)
      })
    )
  })

  const repositoryError = TicketRepositoryError.make({
    operation: 'updateStatus',
    cause: new Error('Repository unavailable'),
  })
  const TicketRepositoryFailed = Layer.succeed(TicketRepository)({
    ...TicketRepositoryStub,
    updateStatus: () => Effect.fail(repositoryError),
  })

  layer(TicketRepositoryFailed)('when the repository fails', it => {
    it.effect('updateStatus: preserves TicketRepositoryError', () =>
      Effect.gen(function* () {
        const error = yield* UpdateTicketStatus(input).pipe(Effect.flip)

        expect(error).toBe(repositoryError)
      })
    )
  })
})

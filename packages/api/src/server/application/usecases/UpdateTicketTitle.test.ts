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
import UpdateTicketTitle from './UpdateTicketTitle'

describe('UpdateTicketTitle', () => {
  const expectedTicket = Schema.decodeUnknownSync(Ticket)({
    id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2a',
    projectId: '019fcc1a-bd5d-751e-9a30-0bc92d133b29',
    title: 'Updated Ticket',
    status: 'TODO',
    createdAt: 1785835769172,
  })

  const input = {
    id: expectedTicket.id,
    title: expectedTicket.title,
  }

  const TicketRepositorySucceeded = Layer.succeed(TicketRepository)({
    ...TicketRepositoryStub,
    updateTitle: repositoryInput =>
      Effect.sync(() => {
        expect(repositoryInput).toStrictEqual(input)

        return expectedTicket
      }),
  })

  layer(TicketRepositorySucceeded)('when the repository succeeds', it => {
    it.effect('updateTitle: returns the updated Ticket', () =>
      Effect.gen(function* () {
        const result = yield* UpdateTicketTitle(input)

        expect(result).toBe(expectedTicket)
      })
    )
  })

  const notFoundError = TicketNotFoundError.make({ id: expectedTicket.id })
  const TicketRepositoryMissing = Layer.succeed(TicketRepository)({
    ...TicketRepositoryStub,
    updateTitle: () => Effect.fail(notFoundError),
  })

  layer(TicketRepositoryMissing)('when the Ticket does not exist', it => {
    it.effect('updateTitle: preserves TicketNotFoundError', () =>
      Effect.gen(function* () {
        const error = yield* UpdateTicketTitle(input).pipe(Effect.flip)

        expect(error).toBe(notFoundError)
      })
    )
  })

  const repositoryError = TicketRepositoryError.make({
    operation: 'updateTitle',
    cause: new Error('Repository unavailable'),
  })
  const TicketRepositoryFailed = Layer.succeed(TicketRepository)({
    ...TicketRepositoryStub,
    updateTitle: () => Effect.fail(repositoryError),
  })

  layer(TicketRepositoryFailed)('when the repository fails', it => {
    it.effect('updateTitle: preserves TicketRepositoryError', () =>
      Effect.gen(function* () {
        const error = yield* UpdateTicketTitle(input).pipe(Effect.flip)

        expect(error).toBe(repositoryError)
      })
    )
  })
})

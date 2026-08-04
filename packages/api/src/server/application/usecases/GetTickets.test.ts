import { describe, expect, layer } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import Ticket from '#/shared/contracts/Ticket'
import TicketRepositoryStub from '../repositories/testing/TicketRepositoryStub'
import TicketRepository, { TicketRepositoryError } from '../repositories/TicketRepository'
import GetTickets from './GetTickets'

describe('GetTickets', () => {
  const expectedTickets = Schema.decodeUnknownSync(Schema.Array(Ticket))([
    {
      id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2a',
      title: 'First Ticket',
      status: 'TODO',
      createdAt: 1785835769172,
    },
    {
      id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2b',
      title: 'Second Ticket',
      status: 'IN_PROGRESS',
      createdAt: 1785835769173,
    },
  ])

  const SucceedingTicketRepository = Layer.succeed(TicketRepository)({
    ...TicketRepositoryStub,
    getAll: () => Effect.succeed(expectedTickets),
  })

  layer(SucceedingTicketRepository)('when the repository succeeds', it => {
    it.effect('getAll: returns Tickets from the repository', () =>
      Effect.gen(function* () {
        const result = yield* GetTickets()

        expect(result).toBe(expectedTickets)
      })
    )
  })

  const repositoryError = TicketRepositoryError.make({
    operation: 'getAll',
    cause: new Error('Repository unavailable'),
  })

  const FailingTicketRepository = Layer.succeed(TicketRepository)({
    ...TicketRepositoryStub,
    getAll: () => Effect.fail(repositoryError),
  })

  layer(FailingTicketRepository)('when the repository fails', it => {
    it.effect('getAll: preserves TicketRepositoryError', () =>
      Effect.gen(function* () {
        const error = yield* GetTickets().pipe(Effect.flip)

        expect(error).toBe(repositoryError)
      })
    )
  })
})

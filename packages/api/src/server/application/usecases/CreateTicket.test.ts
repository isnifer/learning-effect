import { describe, expect, layer } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import Ticket from '#/shared/contracts/Ticket'
import TicketRepositoryStub from '../repositories/testing/TicketRepositoryStub'
import TicketRepository, { TicketRepositoryError } from '../repositories/TicketRepository'
import CreateTicket from './CreateTicket'

describe('CreateTicket', () => {
  const expectedTicket = Schema.decodeUnknownSync(Ticket)({
    id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2a',
    projectId: '019fcc1a-bd5d-751e-9a30-0bc92d133b29',
    title: 'Test Ticket',
    status: 'TODO',
    createdAt: 1785835769172,
  })

  const TestTicketRepository = Layer.succeed(TicketRepository)({
    ...TicketRepositoryStub,
    create: input =>
      Effect.sync(() => {
        expect(input).toStrictEqual({
          projectId: expectedTicket.projectId,
          title: expectedTicket.title,
        })

        return expectedTicket
      }),
  })

  layer(TestTicketRepository)('when the repository succeeds', it => {
    it.effect('create: creates a Ticket through the repository', () =>
      Effect.gen(function* () {
        const result = yield* CreateTicket({
          projectId: expectedTicket.projectId,
          title: expectedTicket.title,
        })

        expect(result).toBe(expectedTicket)
      })
    )
  })

  const repositoryError = TicketRepositoryError.make({
    operation: 'create',
    cause: new Error('Repository unavailable'),
  })

  const FailingTicketRepository = Layer.succeed(TicketRepository)({
    ...TicketRepositoryStub,
    create: () => Effect.fail(repositoryError),
  })

  layer(FailingTicketRepository)('when the repository fails', it => {
    it.effect('create: preserves TicketRepositoryError', () =>
      Effect.gen(function* () {
        const error = yield* CreateTicket({
          projectId: expectedTicket.projectId,
          title: expectedTicket.title,
        }).pipe(Effect.flip)

        expect(error).toBe(repositoryError)
      })
    )
  })
})

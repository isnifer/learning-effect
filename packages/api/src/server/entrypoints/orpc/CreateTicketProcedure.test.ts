import { afterAll, describe, expect, it } from '@effect/vitest'
import { ORPCError, call } from '@orpc/server'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as ManagedRuntime from 'effect/ManagedRuntime'
import * as Schema from 'effect/Schema'
import TicketRepositoryStub from '#/server/application/repositories/testing/TicketRepositoryStub'
import TicketRepository, {
  TicketRepositoryError,
} from '#/server/application/repositories/TicketRepository'
import type { AppRunPromise } from '#/server/runtime/AppRuntime'
import Ticket from '#/shared/contracts/Ticket'
import CreateTicketProcedure from './CreateTicketProcedure'

describe('CreateTicketProcedure', () => {
  const expectedTicket = Schema.decodeUnknownSync(Ticket)({
    id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2a',
    title: 'Test Ticket',
    status: 'TODO',
    createdAt: 1785835769172,
  })

  const callCreateTicket = (runPromise: AppRunPromise) =>
    call(
      CreateTicketProcedure,
      { title: expectedTicket.title },
      {
        context: { runPromise },
      }
    )

  const SucceedingTicketRepository = Layer.succeed(TicketRepository)({
    ...TicketRepositoryStub,
    create: () => Effect.succeed(expectedTicket),
  })

  const SuccessRuntime = ManagedRuntime.make(SucceedingTicketRepository)

  describe('when the repository succeeds', () => {
    it('create: returns the created Ticket', async () => {
      const result = await callCreateTicket(SuccessRuntime.runPromise)

      expect(result).toStrictEqual(expectedTicket)
    })
  })

  const repositoryError = TicketRepositoryError.make({
    operation: 'create',
    cause: new Error('Repository unavailable'),
  })

  const FailingTicketRepository = Layer.succeed(TicketRepository)({
    ...TicketRepositoryStub,
    create: () => Effect.fail(repositoryError),
  })

  const FailureRuntime = ManagedRuntime.make(FailingTicketRepository)

  describe('when the repository fails', () => {
    it('create: maps TicketRepositoryError to INTERNAL_SERVER_ERROR', async () => {
      const error = await callCreateTicket(FailureRuntime.runPromise).catch(cause => cause)

      if (!(error instanceof ORPCError)) {
        throw error
      }

      expect(error.code).toBe('INTERNAL_SERVER_ERROR')
      expect(error.cause).toBe(repositoryError)
    })
  })

  afterAll(async () => {
    await Promise.all([SuccessRuntime.dispose(), FailureRuntime.dispose()])
  })
})

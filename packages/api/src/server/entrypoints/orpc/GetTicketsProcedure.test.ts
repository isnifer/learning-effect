import { afterAll, describe, expect, it } from '@effect/vitest'
import { ORPCError, call } from '@orpc/server'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as ManagedRuntime from 'effect/ManagedRuntime'
import * as Schema from 'effect/Schema'
import ProjectRepository from '#/server/application/repositories/ProjectRepository'
import ProjectRepositoryStub from '#/server/application/repositories/testing/ProjectRepositoryStub'
import TicketRepositoryStub from '#/server/application/repositories/testing/TicketRepositoryStub'
import TicketRepository, {
  TicketRepositoryError,
} from '#/server/application/repositories/TicketRepository'
import type { AppRunPromise } from '#/server/runtime/AppRuntime'
import Ticket from '#/shared/contracts/Ticket'
import GetTicketsProcedure from './GetTicketsProcedure'

describe('GetTicketsProcedure', () => {
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

  const callGetTickets = (runPromise: AppRunPromise) =>
    call(GetTicketsProcedure, undefined, {
      context: { runPromise },
    })

  const SucceedingTicketRepository = Layer.succeed(TicketRepository)({
    ...TicketRepositoryStub,
    getAll: () => Effect.succeed(expectedTickets),
  })
  const TestProjectRepository = Layer.succeed(ProjectRepository)(ProjectRepositoryStub)

  const SuccessRuntime = ManagedRuntime.make(
    Layer.mergeAll(TestProjectRepository, SucceedingTicketRepository)
  )

  describe('when the repository succeeds', () => {
    it('getAll: returns Tickets', async () => {
      const result = await callGetTickets(SuccessRuntime.runPromise)

      expect(result).toStrictEqual(expectedTickets)
    })
  })

  const repositoryError = TicketRepositoryError.make({
    operation: 'getAll',
    cause: new Error('Repository unavailable'),
  })

  const FailingTicketRepository = Layer.succeed(TicketRepository)({
    ...TicketRepositoryStub,
    getAll: () => Effect.fail(repositoryError),
  })

  const FailureRuntime = ManagedRuntime.make(
    Layer.mergeAll(TestProjectRepository, FailingTicketRepository)
  )

  describe('when the repository fails', () => {
    it('getAll: maps TicketRepositoryError to INTERNAL_SERVER_ERROR', async () => {
      const error = await callGetTickets(FailureRuntime.runPromise).catch(cause => cause)

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

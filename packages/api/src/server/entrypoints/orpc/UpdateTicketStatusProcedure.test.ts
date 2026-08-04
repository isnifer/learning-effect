import { afterAll, describe, expect, it } from '@effect/vitest'
import { ORPCError, call } from '@orpc/server'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as ManagedRuntime from 'effect/ManagedRuntime'
import * as Schema from 'effect/Schema'
import TicketRepositoryStub from '#/server/application/repositories/testing/TicketRepositoryStub'
import TicketRepository, {
  TicketNotFoundError,
  TicketRepositoryError,
} from '#/server/application/repositories/TicketRepository'
import type { AppRunPromise } from '#/server/runtime/AppRuntime'
import Ticket, { UpdateTicketStatusInput } from '#/shared/contracts/Ticket'
import UpdateTicketStatusProcedure from './UpdateTicketStatusProcedure'

describe('UpdateTicketStatusProcedure', () => {
  const expectedTicket = Schema.decodeUnknownSync(Ticket)({
    id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2a',
    title: 'Test Ticket',
    status: 'COMPLETED',
    createdAt: 1785835769172,
  })

  const input = Schema.decodeUnknownSync(UpdateTicketStatusInput)({
    id: expectedTicket.id,
    status: expectedTicket.status,
  })

  const callUpdateTicketStatus = (runPromise: AppRunPromise) =>
    call(UpdateTicketStatusProcedure, input, {
      context: { runPromise },
    })

  const SucceedingTicketRepository = Layer.succeed(TicketRepository)({
    ...TicketRepositoryStub,
    updateStatus: () => Effect.succeed(expectedTicket),
  })
  const SuccessRuntime = ManagedRuntime.make(SucceedingTicketRepository)

  it('updateStatus: returns the updated Ticket when the repository succeeds', async () => {
    const result = await callUpdateTicketStatus(SuccessRuntime.runPromise)

    expect(result).toStrictEqual(expectedTicket)
  })

  const notFoundError = TicketNotFoundError.make({ id: expectedTicket.id })
  const MissingTicketRepository = Layer.succeed(TicketRepository)({
    ...TicketRepositoryStub,
    updateStatus: () => Effect.fail(notFoundError),
  })
  const MissingTicketRuntime = ManagedRuntime.make(MissingTicketRepository)

  it('updateStatus: maps TicketNotFoundError to NOT_FOUND', async () => {
    const error = await callUpdateTicketStatus(MissingTicketRuntime.runPromise).catch(
      cause => cause
    )

    if (!(error instanceof ORPCError)) {
      throw error
    }

    expect(error.code).toBe('NOT_FOUND')
    expect(error.cause).toBe(notFoundError)
  })

  const repositoryError = TicketRepositoryError.make({
    operation: 'updateStatus',
    cause: new Error('Repository unavailable'),
  })
  const FailingTicketRepository = Layer.succeed(TicketRepository)({
    ...TicketRepositoryStub,
    updateStatus: () => Effect.fail(repositoryError),
  })
  const FailureRuntime = ManagedRuntime.make(FailingTicketRepository)

  it('updateStatus: maps TicketRepositoryError to INTERNAL_SERVER_ERROR', async () => {
    const error = await callUpdateTicketStatus(FailureRuntime.runPromise).catch(cause => cause)

    if (!(error instanceof ORPCError)) {
      throw error
    }

    expect(error.code).toBe('INTERNAL_SERVER_ERROR')
    expect(error.cause).toBe(repositoryError)
  })

  afterAll(async () => {
    await Promise.all([
      SuccessRuntime.dispose(),
      MissingTicketRuntime.dispose(),
      FailureRuntime.dispose(),
    ])
  })
})

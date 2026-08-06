import { afterAll, describe, expect, it } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as ManagedRuntime from 'effect/ManagedRuntime'
import * as Schema from 'effect/Schema'
import ProjectRepository, {
  ProjectArchivedError,
} from '#/server/application/repositories/ProjectRepository'
import ProjectRepositoryStub from '#/server/application/repositories/testing/ProjectRepositoryStub'
import TicketRepositoryStub from '#/server/application/repositories/testing/TicketRepositoryStub'
import TicketRepository, {
  TicketNotFoundError,
  TicketRepositoryError,
} from '#/server/application/repositories/TicketRepository'
import Ticket, { UpdateTicketStatusInput } from '#/shared/contracts/Ticket'
import { UpdateTicketStatusToolHandler } from './UpdateTicketStatusTool'

describe('UpdateTicketStatusTool', () => {
  const expectedTicket = Schema.decodeUnknownSync(Ticket)({
    id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2a',
    projectId: '019fcc1a-bd5d-751e-9a30-0bc92d133b29',
    number: 1,
    title: 'Test Ticket',
    status: 'COMPLETED',
    createdAt: 1785835769172,
  })
  const input = Schema.decodeUnknownSync(UpdateTicketStatusInput)({
    id: expectedTicket.id,
    status: expectedTicket.status,
  })
  const ProjectRepositoryUnused = Layer.succeed(ProjectRepository)(ProjectRepositoryStub)

  const TicketRepositorySucceeded = Layer.succeed(TicketRepository)({
    ...TicketRepositoryStub,
    updateStatus: () => Effect.succeed(expectedTicket),
  })
  const SuccessRuntime = ManagedRuntime.make(
    Layer.mergeAll(ProjectRepositoryUnused, TicketRepositorySucceeded)
  )

  it('updateStatus: returns the updated Ticket', async () => {
    const result = await UpdateTicketStatusToolHandler(SuccessRuntime.runPromise)(input)

    expect(result).toStrictEqual({
      content: [{ type: 'text', text: `Updated status of ticket "${expectedTicket.title}".` }],
      structuredContent: expectedTicket,
    })
  })

  const notFoundError = TicketNotFoundError.make({ id: input.id })
  const TicketRepositoryMissing = Layer.succeed(TicketRepository)({
    ...TicketRepositoryStub,
    updateStatus: () => Effect.fail(notFoundError),
  })
  const MissingTicketRuntime = ManagedRuntime.make(
    Layer.mergeAll(ProjectRepositoryUnused, TicketRepositoryMissing)
  )

  it('updateStatus: explains that the Ticket was not found', async () => {
    const result = await UpdateTicketStatusToolHandler(MissingTicketRuntime.runPromise)(input)

    expect(result).toStrictEqual({
      content: [{ type: 'text', text: `Ticket ${input.id} was not found.` }],
      isError: true,
    })
  })

  const archivedError = ProjectArchivedError.make({ id: expectedTicket.projectId })
  const TicketRepositoryArchived = Layer.succeed(TicketRepository)({
    ...TicketRepositoryStub,
    updateStatus: () => Effect.fail(archivedError),
  })
  const ArchivedProjectRuntime = ManagedRuntime.make(
    Layer.mergeAll(ProjectRepositoryUnused, TicketRepositoryArchived)
  )

  it('updateStatus: explains that a human must restore the archived Project', async () => {
    const result = await UpdateTicketStatusToolHandler(ArchivedProjectRuntime.runPromise)(input)

    expect(result).toStrictEqual({
      content: [
        {
          type: 'text',
          text: `Project ${expectedTicket.projectId} is archived. A human must restore it before updating Ticket statuses.`,
        },
      ],
      isError: true,
    })
  })

  const repositoryError = TicketRepositoryError.make({
    operation: 'updateStatus',
    cause: new Error('Repository unavailable'),
  })
  const TicketRepositoryFailed = Layer.succeed(TicketRepository)({
    ...TicketRepositoryStub,
    updateStatus: () => Effect.fail(repositoryError),
  })
  const FailureRuntime = ManagedRuntime.make(
    Layer.mergeAll(ProjectRepositoryUnused, TicketRepositoryFailed)
  )

  it('updateStatus: hides repository details', async () => {
    const result = await UpdateTicketStatusToolHandler(FailureRuntime.runPromise)(input)

    expect(result).toStrictEqual({
      content: [{ type: 'text', text: 'Could not update ticket status.' }],
      isError: true,
    })
  })

  afterAll(async () => {
    await Promise.all([
      SuccessRuntime.dispose(),
      MissingTicketRuntime.dispose(),
      ArchivedProjectRuntime.dispose(),
      FailureRuntime.dispose(),
    ])
  })
})

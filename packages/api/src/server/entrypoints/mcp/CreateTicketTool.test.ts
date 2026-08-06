import { afterAll, describe, expect, it } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as ManagedRuntime from 'effect/ManagedRuntime'
import * as Schema from 'effect/Schema'
import ProjectRepository, {
  ProjectArchivedError,
  ProjectNotFoundError,
  ProjectRepositoryError,
} from '#/server/application/repositories/ProjectRepository'
import ProjectRepositoryStub from '#/server/application/repositories/testing/ProjectRepositoryStub'
import TicketRepositoryStub from '#/server/application/repositories/testing/TicketRepositoryStub'
import TicketRepository, {
  TicketRepositoryError,
} from '#/server/application/repositories/TicketRepository'
import Project from '#/shared/contracts/Project'
import Ticket, { CreateTicketInput } from '#/shared/contracts/Ticket'
import { CreateTicketToolHandler } from './CreateTicketTool'

describe('CreateTicketTool', () => {
  const input = Schema.decodeUnknownSync(CreateTicketInput)({
    projectId: '019fcc1a-bd5d-751e-9a30-0bc92d133b29',
    title: 'Test Ticket',
  })
  const activeProject = Schema.decodeUnknownSync(Project)({
    id: input.projectId,
    name: 'Red Docket',
    key: 'RD',
    createdAt: 1785835769171,
    archivedAt: null,
  })
  const expectedTicket = Schema.decodeUnknownSync(Ticket)({
    id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2a',
    ...input,
    number: 1,
    status: 'TODO',
    createdAt: 1785835769172,
  })
  const TicketRepositoryUnused = Layer.succeed(TicketRepository)(TicketRepositoryStub)

  const ProjectRepositorySucceeded = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    getActiveById: () => Effect.succeed(activeProject),
  })
  const TicketRepositorySucceeded = Layer.succeed(TicketRepository)({
    ...TicketRepositoryStub,
    create: () => Effect.succeed(expectedTicket),
  })
  const SuccessRuntime = ManagedRuntime.make(
    Layer.mergeAll(ProjectRepositorySucceeded, TicketRepositorySucceeded)
  )

  it('create: returns the created Ticket', async () => {
    const result = await CreateTicketToolHandler(SuccessRuntime.runPromise)(input)

    expect(result).toStrictEqual({
      content: [{ type: 'text', text: `Created Ticket "${expectedTicket.title}".` }],
      structuredContent: expectedTicket,
    })
  })

  const notFoundError = ProjectNotFoundError.make({ id: input.projectId })
  const ProjectRepositoryMissing = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    getActiveById: () => Effect.fail(notFoundError),
  })
  const MissingProjectRuntime = ManagedRuntime.make(
    Layer.mergeAll(ProjectRepositoryMissing, TicketRepositoryUnused)
  )

  it('create: explains that the Project was not found', async () => {
    const result = await CreateTicketToolHandler(MissingProjectRuntime.runPromise)(input)

    expect(result).toStrictEqual({
      content: [{ type: 'text', text: `Project ${input.projectId} was not found.` }],
      isError: true,
    })
  })

  const archivedError = ProjectArchivedError.make({ id: input.projectId })
  const ProjectRepositoryArchived = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    getActiveById: () => Effect.fail(archivedError),
  })
  const ArchivedProjectRuntime = ManagedRuntime.make(
    Layer.mergeAll(ProjectRepositoryArchived, TicketRepositoryUnused)
  )

  it('create: explains that a human must restore the archived Project', async () => {
    const result = await CreateTicketToolHandler(ArchivedProjectRuntime.runPromise)(input)

    expect(result).toStrictEqual({
      content: [
        {
          type: 'text',
          text: `Project ${input.projectId} is archived. A human must restore it before creating Tickets.`,
        },
      ],
      isError: true,
    })
  })

  const projectRepositoryError = ProjectRepositoryError.make({
    operation: 'getActiveById',
    cause: new Error('Repository unavailable'),
  })
  const ProjectRepositoryFailed = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    getActiveById: () => Effect.fail(projectRepositoryError),
  })
  const FailureRuntime = ManagedRuntime.make(
    Layer.mergeAll(ProjectRepositoryFailed, TicketRepositoryUnused)
  )

  it('create: hides Project repository details', async () => {
    const result = await CreateTicketToolHandler(FailureRuntime.runPromise)(input)

    expect(result).toStrictEqual({
      content: [{ type: 'text', text: 'Could not create Ticket.' }],
      isError: true,
    })
  })

  const ticketRepositoryError = TicketRepositoryError.make({
    operation: 'create',
    cause: new Error('Repository unavailable'),
  })
  const TicketRepositoryFailed = Layer.succeed(TicketRepository)({
    ...TicketRepositoryStub,
    create: () => Effect.fail(ticketRepositoryError),
  })
  const TicketFailureRuntime = ManagedRuntime.make(
    Layer.mergeAll(ProjectRepositorySucceeded, TicketRepositoryFailed)
  )

  it('create: hides Ticket repository details', async () => {
    const result = await CreateTicketToolHandler(TicketFailureRuntime.runPromise)(input)

    expect(result).toStrictEqual({
      content: [{ type: 'text', text: 'Could not create Ticket.' }],
      isError: true,
    })
  })

  afterAll(async () => {
    await Promise.all([
      SuccessRuntime.dispose(),
      MissingProjectRuntime.dispose(),
      ArchivedProjectRuntime.dispose(),
      FailureRuntime.dispose(),
      TicketFailureRuntime.dispose(),
    ])
  })
})

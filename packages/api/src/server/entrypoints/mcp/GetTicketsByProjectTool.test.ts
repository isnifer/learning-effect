import { afterAll, describe, expect, it } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as ManagedRuntime from 'effect/ManagedRuntime'
import * as Schema from 'effect/Schema'
import ProjectRepository, {
  ProjectNotFoundError,
  ProjectRepositoryError,
} from '#/server/application/repositories/ProjectRepository'
import ProjectRepositoryStub from '#/server/application/repositories/testing/ProjectRepositoryStub'
import TicketRepositoryStub from '#/server/application/repositories/testing/TicketRepositoryStub'
import TicketRepository, {
  TicketRepositoryError,
} from '#/server/application/repositories/TicketRepository'
import Project from '#/shared/contracts/Project'
import { GetTicketsByProjectInput, Tickets } from '#/shared/contracts/Ticket'
import { GetTicketsByProjectToolHandler } from './GetTicketsByProjectTool'

describe('GetTicketsByProjectTool', () => {
  const input = Schema.decodeUnknownSync(GetTicketsByProjectInput)({
    projectId: '019fcc1a-bd5d-751e-9a30-0bc92d133b29',
  })
  const project = Schema.decodeUnknownSync(Project)({
    id: input.projectId,
    name: 'Red Docket',
    key: 'RD',
    createdAt: 1785835769171,
    archivedAt: null,
  })
  const expectedTickets = Schema.decodeUnknownSync(Tickets)([
    {
      id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2a',
      projectId: input.projectId,
      number: 1,
      title: 'Test Ticket',
      status: 'TODO',
      createdAt: 1785835769172,
    },
  ])

  const ProjectRepositorySucceeded = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    getById: () => Effect.succeed(project),
  })
  const TicketRepositorySucceeded = Layer.succeed(TicketRepository)({
    ...TicketRepositoryStub,
    getByProject: () => Effect.succeed(expectedTickets),
  })
  const SuccessRuntime = ManagedRuntime.make(
    Layer.mergeAll(ProjectRepositorySucceeded, TicketRepositorySucceeded)
  )

  it('getByProject: returns Project Tickets', async () => {
    const result = await GetTicketsByProjectToolHandler(SuccessRuntime.runPromise)(input)

    expect(result).toStrictEqual({
      content: [
        {
          type: 'text',
          text: `Found ${expectedTickets.length} Tickets in Project ${input.projectId}.`,
        },
      ],
      structuredContent: expectedTickets,
    })
  })

  const notFoundError = ProjectNotFoundError.make({ id: input.projectId })
  const ProjectRepositoryMissing = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    getById: () => Effect.fail(notFoundError),
  })
  const TicketRepositoryUnused = Layer.succeed(TicketRepository)(TicketRepositoryStub)
  const MissingProjectRuntime = ManagedRuntime.make(
    Layer.mergeAll(ProjectRepositoryMissing, TicketRepositoryUnused)
  )

  it('getByProject: explains that the Project was not found', async () => {
    const result = await GetTicketsByProjectToolHandler(MissingProjectRuntime.runPromise)(input)

    expect(result).toStrictEqual({
      content: [{ type: 'text', text: `Project ${input.projectId} was not found.` }],
      isError: true,
    })
  })

  const projectRepositoryError = ProjectRepositoryError.make({
    operation: 'getById',
    cause: new Error('Repository unavailable'),
  })
  const ProjectRepositoryFailed = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    getById: () => Effect.fail(projectRepositoryError),
  })
  const ProjectFailureRuntime = ManagedRuntime.make(
    Layer.mergeAll(ProjectRepositoryFailed, TicketRepositoryUnused)
  )

  it('getByProject: hides Project repository details', async () => {
    const result = await GetTicketsByProjectToolHandler(ProjectFailureRuntime.runPromise)(input)

    expect(result).toStrictEqual({
      content: [{ type: 'text', text: 'Could not get Tickets.' }],
      isError: true,
    })
  })

  const ticketRepositoryError = TicketRepositoryError.make({
    operation: 'getByProject',
    cause: new Error('Repository unavailable'),
  })
  const TicketRepositoryFailed = Layer.succeed(TicketRepository)({
    ...TicketRepositoryStub,
    getByProject: () => Effect.fail(ticketRepositoryError),
  })
  const TicketFailureRuntime = ManagedRuntime.make(
    Layer.mergeAll(ProjectRepositorySucceeded, TicketRepositoryFailed)
  )

  it('getByProject: hides Ticket repository details', async () => {
    const result = await GetTicketsByProjectToolHandler(TicketFailureRuntime.runPromise)(input)

    expect(result).toStrictEqual({
      content: [{ type: 'text', text: 'Could not get Tickets.' }],
      isError: true,
    })
  })

  afterAll(async () => {
    await Promise.all([
      SuccessRuntime.dispose(),
      MissingProjectRuntime.dispose(),
      ProjectFailureRuntime.dispose(),
      TicketFailureRuntime.dispose(),
    ])
  })
})

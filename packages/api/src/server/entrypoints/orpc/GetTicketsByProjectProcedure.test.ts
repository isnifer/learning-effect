import { afterAll, describe, expect, it } from '@effect/vitest'
import { ORPCError, call } from '@orpc/server'
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
import type { AppRunPromise } from '#/server/runtime/AppRuntime'
import Project from '#/shared/contracts/Project'
import { GetTicketsByProjectInput, Tickets } from '#/shared/contracts/Ticket'
import GetTicketsByProjectProcedure from './GetTicketsByProjectProcedure'

describe('GetTicketsByProjectProcedure', () => {
  const input = Schema.decodeUnknownSync(GetTicketsByProjectInput)({
    projectId: '019fcc1a-bd5d-751e-9a30-0bc92d133b29',
  })

  const expectedTickets = Schema.decodeUnknownSync(Tickets)([
    {
      id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2a',
      projectId: input.projectId,
      title: 'First Ticket',
      status: 'TODO',
      createdAt: 1785835769172,
    },
    {
      id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2b',
      projectId: input.projectId,
      title: 'Second Ticket',
      status: 'COMPLETED',
      createdAt: 1785835769173,
    },
  ])

  const project = Schema.decodeUnknownSync(Project)({
    id: input.projectId,
    name: 'Red Docket',
    key: 'RD',
    createdAt: 1785835769171,
    archivedAt: null,
  })

  const callGetTicketsByProject = (runPromise: AppRunPromise) =>
    call(GetTicketsByProjectProcedure, input, {
      context: { runPromise },
    })

  const SucceedingTicketRepository = Layer.succeed(TicketRepository)({
    ...TicketRepositoryStub,
    getByProject: () => Effect.succeed(expectedTickets),
  })
  const SucceedingProjectRepository = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    getById: () => Effect.succeed(project),
  })
  const SuccessRuntime = ManagedRuntime.make(
    Layer.mergeAll(SucceedingProjectRepository, SucceedingTicketRepository)
  )

  describe('when the repository succeeds', () => {
    it('getByProject: returns Project Tickets', async () => {
      const result = await callGetTicketsByProject(SuccessRuntime.runPromise)

      expect(result).toStrictEqual(expectedTickets)
    })
  })

  const notFoundError = ProjectNotFoundError.make({ id: input.projectId })
  const MissingProjectRepository = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    getById: () => Effect.fail(notFoundError),
  })
  const MissingProjectRuntime = ManagedRuntime.make(
    Layer.mergeAll(MissingProjectRepository, Layer.succeed(TicketRepository)(TicketRepositoryStub))
  )

  describe('when the Project does not exist', () => {
    it('getByProject: maps ProjectNotFoundError to NOT_FOUND', async () => {
      const error = await callGetTicketsByProject(MissingProjectRuntime.runPromise).catch(
        cause => cause
      )

      if (!(error instanceof ORPCError)) {
        throw error
      }

      expect(error.code).toBe('NOT_FOUND')
      expect(error.cause).toBe(notFoundError)
    })
  })

  const projectRepositoryError = ProjectRepositoryError.make({
    operation: 'getById',
    cause: new Error('Project repository unavailable'),
  })
  const FailingProjectRepository = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    getById: () => Effect.fail(projectRepositoryError),
  })
  const ProjectFailureRuntime = ManagedRuntime.make(
    Layer.mergeAll(FailingProjectRepository, Layer.succeed(TicketRepository)(TicketRepositoryStub))
  )

  describe('when the Project repository fails', () => {
    it('getByProject: maps ProjectRepositoryError to INTERNAL_SERVER_ERROR', async () => {
      const error = await callGetTicketsByProject(ProjectFailureRuntime.runPromise).catch(
        cause => cause
      )

      if (!(error instanceof ORPCError)) {
        throw error
      }

      expect(error.code).toBe('INTERNAL_SERVER_ERROR')
      expect(error.cause).toBe(projectRepositoryError)
    })
  })

  const repositoryError = TicketRepositoryError.make({
    operation: 'getByProject',
    cause: new Error('Repository unavailable'),
  })
  const FailingTicketRepository = Layer.succeed(TicketRepository)({
    ...TicketRepositoryStub,
    getByProject: () => Effect.fail(repositoryError),
  })
  const FailureRuntime = ManagedRuntime.make(
    Layer.mergeAll(SucceedingProjectRepository, FailingTicketRepository)
  )

  describe('when the repository fails', () => {
    it('getByProject: maps TicketRepositoryError to INTERNAL_SERVER_ERROR', async () => {
      const error = await callGetTicketsByProject(FailureRuntime.runPromise).catch(cause => cause)

      if (!(error instanceof ORPCError)) {
        throw error
      }

      expect(error.code).toBe('INTERNAL_SERVER_ERROR')
      expect(error.cause).toBe(repositoryError)
    })
  })

  afterAll(async () => {
    await Promise.all([
      SuccessRuntime.dispose(),
      MissingProjectRuntime.dispose(),
      ProjectFailureRuntime.dispose(),
      FailureRuntime.dispose(),
    ])
  })
})

import { afterAll, describe, expect, it } from '@effect/vitest'
import { ORPCError, call } from '@orpc/server'
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
import type { AppRunPromise } from '#/server/runtime/AppRuntime'
import Project from '#/shared/contracts/Project'
import Ticket from '#/shared/contracts/Ticket'
import CreateTicketProcedure from './CreateTicketProcedure'

describe('CreateTicketProcedure', () => {
  const expectedTicket = Schema.decodeUnknownSync(Ticket)({
    id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2a',
    projectId: '019fcc1a-bd5d-751e-9a30-0bc92d133b29',
    number: 1,
    title: 'Test Ticket',
    status: 'TODO',
    createdAt: 1785835769172,
  })
  const activeProject = Schema.decodeUnknownSync(Project)({
    id: expectedTicket.projectId,
    name: 'Red Docket',
    key: 'RD',
    createdAt: 1785835769171,
    archivedAt: null,
  })

  const callCreateTicket = (runPromise: AppRunPromise) =>
    call(
      CreateTicketProcedure,
      { projectId: expectedTicket.projectId, title: expectedTicket.title },
      {
        context: { runPromise },
      }
    )

  const TicketRepositorySucceeded = Layer.succeed(TicketRepository)({
    ...TicketRepositoryStub,
    create: () => Effect.succeed(expectedTicket),
  })
  const ProjectRepositorySucceeded = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    getActiveById: () => Effect.succeed(activeProject),
  })

  const SuccessRuntime = ManagedRuntime.make(
    Layer.mergeAll(ProjectRepositorySucceeded, TicketRepositorySucceeded)
  )

  describe('when the repositories succeed', () => {
    it('create: returns the created Ticket', async () => {
      const result = await callCreateTicket(SuccessRuntime.runPromise)

      expect(result).toStrictEqual(expectedTicket)
    })
  })

  const notFoundError = ProjectNotFoundError.make({ id: expectedTicket.projectId })
  const ProjectRepositoryMissing = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    getActiveById: () => Effect.fail(notFoundError),
  })
  const MissingProjectRuntime = ManagedRuntime.make(
    Layer.mergeAll(ProjectRepositoryMissing, Layer.succeed(TicketRepository)(TicketRepositoryStub))
  )

  describe('when the Project does not exist', () => {
    it('create: maps ProjectNotFoundError to NOT_FOUND', async () => {
      const error = await callCreateTicket(MissingProjectRuntime.runPromise).catch(cause => cause)

      if (!(error instanceof ORPCError)) {
        throw error
      }

      expect(error.code).toBe('NOT_FOUND')
      expect(error.cause).toBe(notFoundError)
    })
  })

  const archivedError = ProjectArchivedError.make({ id: expectedTicket.projectId })
  const ProjectRepositoryArchived = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    getActiveById: () => Effect.fail(archivedError),
  })
  const ArchivedProjectRuntime = ManagedRuntime.make(
    Layer.mergeAll(ProjectRepositoryArchived, Layer.succeed(TicketRepository)(TicketRepositoryStub))
  )

  describe('when the Project is archived', () => {
    it('create: maps ProjectArchivedError to CONFLICT', async () => {
      const error = await callCreateTicket(ArchivedProjectRuntime.runPromise).catch(cause => cause)

      if (!(error instanceof ORPCError)) {
        throw error
      }

      expect(error.code).toBe('CONFLICT')
      expect(error.cause).toStrictEqual(archivedError)
    })
  })

  const projectRepositoryError = ProjectRepositoryError.make({
    operation: 'getActiveById',
    cause: new Error('Project repository unavailable'),
  })
  const ProjectRepositoryFailed = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    getActiveById: () => Effect.fail(projectRepositoryError),
  })
  const ProjectFailureRuntime = ManagedRuntime.make(
    Layer.mergeAll(ProjectRepositoryFailed, Layer.succeed(TicketRepository)(TicketRepositoryStub))
  )

  describe('when the Project repository fails', () => {
    it('create: maps ProjectRepositoryError to INTERNAL_SERVER_ERROR', async () => {
      const error = await callCreateTicket(ProjectFailureRuntime.runPromise).catch(cause => cause)

      if (!(error instanceof ORPCError)) {
        throw error
      }

      expect(error.code).toBe('INTERNAL_SERVER_ERROR')
      expect(error.cause).toBe(projectRepositoryError)
    })
  })

  const repositoryError = TicketRepositoryError.make({
    operation: 'create',
    cause: new Error('Repository unavailable'),
  })

  const TicketRepositoryFailed = Layer.succeed(TicketRepository)({
    ...TicketRepositoryStub,
    create: () => Effect.fail(repositoryError),
  })

  const FailureRuntime = ManagedRuntime.make(
    Layer.mergeAll(ProjectRepositorySucceeded, TicketRepositoryFailed)
  )

  describe('when the Ticket repository fails', () => {
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
    await Promise.all([
      SuccessRuntime.dispose(),
      MissingProjectRuntime.dispose(),
      ArchivedProjectRuntime.dispose(),
      ProjectFailureRuntime.dispose(),
      FailureRuntime.dispose(),
    ])
  })
})

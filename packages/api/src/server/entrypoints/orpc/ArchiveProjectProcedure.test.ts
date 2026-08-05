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
import TicketRepository from '#/server/application/repositories/TicketRepository'
import type { AppRunPromise } from '#/server/runtime/AppRuntime'
import Project, { ArchiveProjectInput } from '#/shared/contracts/Project'
import ArchiveProjectProcedure from './ArchiveProjectProcedure'

describe('ArchiveProjectProcedure', () => {
  const expectedProject = Schema.decodeUnknownSync(Project)({
    id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2a',
    name: 'Red Docket',
    key: 'RD',
    createdAt: 1785835769172,
    archivedAt: 1785835769173,
  })

  const input = Schema.decodeUnknownSync(ArchiveProjectInput)({ id: expectedProject.id })

  const callArchiveProject = (runPromise: AppRunPromise) =>
    call(ArchiveProjectProcedure, input, {
      context: { runPromise },
    })

  const SucceedingProjectRepository = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    archive: () => Effect.succeed(expectedProject),
  })
  const TestTicketRepository = Layer.succeed(TicketRepository)(TicketRepositoryStub)
  const SuccessRuntime = ManagedRuntime.make(
    Layer.mergeAll(SucceedingProjectRepository, TestTicketRepository)
  )

  it('archive: returns the archived Project when the repository succeeds', async () => {
    const result = await callArchiveProject(SuccessRuntime.runPromise)

    expect(result).toStrictEqual(expectedProject)
  })

  const notFoundError = ProjectNotFoundError.make({ id: expectedProject.id })
  const MissingProjectRepository = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    archive: () => Effect.fail(notFoundError),
  })
  const MissingProjectRuntime = ManagedRuntime.make(
    Layer.mergeAll(MissingProjectRepository, TestTicketRepository)
  )

  it('archive: maps ProjectNotFoundError to NOT_FOUND', async () => {
    const error = await callArchiveProject(MissingProjectRuntime.runPromise).catch(cause => cause)

    if (!(error instanceof ORPCError)) {
      throw error
    }

    expect(error.code).toBe('NOT_FOUND')
    expect(error.cause).toBe(notFoundError)
  })

  const repositoryError = ProjectRepositoryError.make({
    operation: 'archive',
    cause: new Error('Repository unavailable'),
  })
  const FailingProjectRepository = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    archive: () => Effect.fail(repositoryError),
  })
  const FailureRuntime = ManagedRuntime.make(
    Layer.mergeAll(FailingProjectRepository, TestTicketRepository)
  )

  it('archive: maps ProjectRepositoryError to INTERNAL_SERVER_ERROR', async () => {
    const error = await callArchiveProject(FailureRuntime.runPromise).catch(cause => cause)

    if (!(error instanceof ORPCError)) {
      throw error
    }

    expect(error.code).toBe('INTERNAL_SERVER_ERROR')
    expect(error.cause).toBe(repositoryError)
  })

  afterAll(async () => {
    await Promise.all([
      SuccessRuntime.dispose(),
      MissingProjectRuntime.dispose(),
      FailureRuntime.dispose(),
    ])
  })
})

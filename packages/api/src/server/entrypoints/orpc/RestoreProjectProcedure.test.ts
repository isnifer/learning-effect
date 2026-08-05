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
import Project, { RestoreProjectInput } from '#/shared/contracts/Project'
import RestoreProjectProcedure from './RestoreProjectProcedure'

describe('RestoreProjectProcedure', () => {
  const expectedProject = Schema.decodeUnknownSync(Project)({
    id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2a',
    name: 'Red Docket',
    key: 'RD',
    createdAt: 1785835769172,
    archivedAt: null,
  })

  const input = Schema.decodeUnknownSync(RestoreProjectInput)({ id: expectedProject.id })

  const callRestoreProject = (runPromise: AppRunPromise) =>
    call(RestoreProjectProcedure, input, {
      context: { runPromise },
    })

  const ProjectRepositorySucceeded = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    restore: () => Effect.succeed(expectedProject),
  })
  const TicketRepositoryUnused = Layer.succeed(TicketRepository)(TicketRepositoryStub)
  const SuccessRuntime = ManagedRuntime.make(
    Layer.mergeAll(ProjectRepositorySucceeded, TicketRepositoryUnused)
  )

  it('restore: returns the restored Project when the repository succeeds', async () => {
    const result = await callRestoreProject(SuccessRuntime.runPromise)

    expect(result).toStrictEqual(expectedProject)
  })

  const notFoundError = ProjectNotFoundError.make({ id: expectedProject.id })
  const ProjectRepositoryMissing = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    restore: () => Effect.fail(notFoundError),
  })
  const MissingProjectRuntime = ManagedRuntime.make(
    Layer.mergeAll(ProjectRepositoryMissing, TicketRepositoryUnused)
  )

  it('restore: maps ProjectNotFoundError to NOT_FOUND', async () => {
    const error = await callRestoreProject(MissingProjectRuntime.runPromise).catch(cause => cause)

    if (!(error instanceof ORPCError)) {
      throw error
    }

    expect(error.code).toBe('NOT_FOUND')
    expect(error.cause).toBe(notFoundError)
  })

  const repositoryError = ProjectRepositoryError.make({
    operation: 'restore',
    cause: new Error('Repository unavailable'),
  })
  const ProjectRepositoryFailed = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    restore: () => Effect.fail(repositoryError),
  })
  const FailureRuntime = ManagedRuntime.make(
    Layer.mergeAll(ProjectRepositoryFailed, TicketRepositoryUnused)
  )

  it('restore: maps ProjectRepositoryError to INTERNAL_SERVER_ERROR', async () => {
    const error = await callRestoreProject(FailureRuntime.runPromise).catch(cause => cause)

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

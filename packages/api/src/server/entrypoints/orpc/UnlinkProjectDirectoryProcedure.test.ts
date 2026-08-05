import { afterAll, describe, expect, it } from '@effect/vitest'
import { ORPCError, call } from '@orpc/server'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as ManagedRuntime from 'effect/ManagedRuntime'
import * as Schema from 'effect/Schema'
import ProjectRepository, {
  ProjectArchivedError,
  ProjectDirectoryNotLinkedError,
  ProjectNotFoundError,
  ProjectRepositoryError,
} from '#/server/application/repositories/ProjectRepository'
import ProjectRepositoryStub from '#/server/application/repositories/testing/ProjectRepositoryStub'
import TicketRepositoryStub from '#/server/application/repositories/testing/TicketRepositoryStub'
import TicketRepository from '#/server/application/repositories/TicketRepository'
import type { AppRunPromise } from '#/server/runtime/AppRuntime'
import { UnlinkProjectDirectoryInput } from '#/shared/contracts/Project'
import UnlinkProjectDirectoryProcedure from './UnlinkProjectDirectoryProcedure'

describe('UnlinkProjectDirectoryProcedure', () => {
  const input = Schema.decodeUnknownSync(UnlinkProjectDirectoryInput)({
    projectId: '019fcc1a-bd5d-751e-9a30-0bc92d133b2a',
    absolutePath: '/Users/isnifer/www/red-docket',
  })

  const callUnlinkProjectDirectory = (runPromise: AppRunPromise) =>
    call(UnlinkProjectDirectoryProcedure, input, {
      context: { runPromise },
    })

  const SucceedingProjectRepository = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    unlinkDirectory: () => Effect.succeed(input),
  })
  const TestTicketRepository = Layer.succeed(TicketRepository)(TicketRepositoryStub)
  const SuccessRuntime = ManagedRuntime.make(
    Layer.mergeAll(SucceedingProjectRepository, TestTicketRepository)
  )

  it('unlinkDirectory: returns the unlinked Project directory when the repository succeeds', async () => {
    const result = await callUnlinkProjectDirectory(SuccessRuntime.runPromise)

    expect(result).toStrictEqual(input)
  })

  const notFoundError = ProjectNotFoundError.make({ id: input.projectId })
  const MissingProjectRepository = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    unlinkDirectory: () => Effect.fail(notFoundError),
  })
  const MissingProjectRuntime = ManagedRuntime.make(
    Layer.mergeAll(MissingProjectRepository, TestTicketRepository)
  )

  it('unlinkDirectory: maps ProjectNotFoundError to NOT_FOUND', async () => {
    const error = await callUnlinkProjectDirectory(MissingProjectRuntime.runPromise).catch(
      cause => cause
    )

    if (!(error instanceof ORPCError)) {
      throw error
    }

    expect(error.code).toBe('NOT_FOUND')
    expect(error.cause).toBe(notFoundError)
  })

  const archivedError = ProjectArchivedError.make({ id: input.projectId })
  const ArchivedProjectRepository = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    unlinkDirectory: () => Effect.fail(archivedError),
  })
  const ArchivedProjectRuntime = ManagedRuntime.make(
    Layer.mergeAll(ArchivedProjectRepository, TestTicketRepository)
  )

  it('unlinkDirectory: maps ProjectArchivedError to CONFLICT', async () => {
    const error = await callUnlinkProjectDirectory(ArchivedProjectRuntime.runPromise).catch(
      cause => cause
    )

    if (!(error instanceof ORPCError)) {
      throw error
    }

    expect(error.code).toBe('CONFLICT')
    expect(error.cause).toBe(archivedError)
  })

  const notLinkedError = ProjectDirectoryNotLinkedError.make(input)
  const UnlinkedDirectoryProjectRepository = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    unlinkDirectory: () => Effect.fail(notLinkedError),
  })
  const UnlinkedDirectoryRuntime = ManagedRuntime.make(
    Layer.mergeAll(UnlinkedDirectoryProjectRepository, TestTicketRepository)
  )

  it('unlinkDirectory: maps ProjectDirectoryNotLinkedError to NOT_FOUND', async () => {
    const error = await callUnlinkProjectDirectory(UnlinkedDirectoryRuntime.runPromise).catch(
      cause => cause
    )

    if (!(error instanceof ORPCError)) {
      throw error
    }

    expect(error.code).toBe('NOT_FOUND')
    expect(error.cause).toBe(notLinkedError)
  })

  const repositoryError = ProjectRepositoryError.make({
    operation: 'unlinkDirectory',
    cause: new Error('Repository unavailable'),
  })
  const FailingProjectRepository = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    unlinkDirectory: () => Effect.fail(repositoryError),
  })
  const FailureRuntime = ManagedRuntime.make(
    Layer.mergeAll(FailingProjectRepository, TestTicketRepository)
  )

  it('unlinkDirectory: maps ProjectRepositoryError to INTERNAL_SERVER_ERROR', async () => {
    const error = await callUnlinkProjectDirectory(FailureRuntime.runPromise).catch(cause => cause)

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
      ArchivedProjectRuntime.dispose(),
      UnlinkedDirectoryRuntime.dispose(),
      FailureRuntime.dispose(),
    ])
  })
})

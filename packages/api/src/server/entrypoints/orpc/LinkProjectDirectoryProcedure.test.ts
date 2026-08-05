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
import TicketRepository from '#/server/application/repositories/TicketRepository'
import { ProjectDirectoryPathNotLocalError } from '#/server/application/usecases/LinkProjectDirectory'
import type { AppRunPromise } from '#/server/runtime/AppRuntime'
import { LinkProjectDirectoryInput } from '#/shared/contracts/Project'
import LinkProjectDirectoryProcedure from './LinkProjectDirectoryProcedure'

describe('LinkProjectDirectoryProcedure', () => {
  const input = Schema.decodeUnknownSync(LinkProjectDirectoryInput)({
    projectId: '019fcc1a-bd5d-751e-9a30-0bc92d133b2a',
    absolutePath: '/Users/isnifer/www/learning-effect',
  })

  const callLinkProjectDirectory = (
    runPromise: AppRunPromise,
    procedureInput: typeof input = input
  ) =>
    call(LinkProjectDirectoryProcedure, procedureInput, {
      context: { runPromise },
    })

  const SucceedingProjectRepository = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    linkDirectory: () => Effect.succeed(input),
  })
  const TestTicketRepository = Layer.succeed(TicketRepository)(TicketRepositoryStub)
  const SuccessRuntime = ManagedRuntime.make(
    Layer.mergeAll(SucceedingProjectRepository, TestTicketRepository)
  )

  it('linkDirectory: returns the linked Project directory when the repository succeeds', async () => {
    const result = await callLinkProjectDirectory(SuccessRuntime.runPromise)

    expect(result).toStrictEqual(input)
  })

  it('linkDirectory: maps ProjectDirectoryPathNotLocalError to BAD_REQUEST', async () => {
    const pathFromAnotherSystem = Schema.decodeUnknownSync(LinkProjectDirectoryInput)({
      projectId: input.projectId,
      absolutePath: process.platform === 'win32' ? '/red-docket' : 'C:\\red-docket',
    })

    const error = await callLinkProjectDirectory(
      SuccessRuntime.runPromise,
      pathFromAnotherSystem
    ).catch(cause => cause)

    if (!(error instanceof ORPCError)) {
      throw error
    }

    expect(error.code).toBe('BAD_REQUEST')
    expect(error.cause).toStrictEqual(
      ProjectDirectoryPathNotLocalError.make({
        absolutePath: pathFromAnotherSystem.absolutePath,
      })
    )
  })

  const notFoundError = ProjectNotFoundError.make({ id: input.projectId })
  const MissingProjectRepository = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    linkDirectory: () => Effect.fail(notFoundError),
  })
  const MissingProjectRuntime = ManagedRuntime.make(
    Layer.mergeAll(MissingProjectRepository, TestTicketRepository)
  )

  it('linkDirectory: maps ProjectNotFoundError to NOT_FOUND', async () => {
    const error = await callLinkProjectDirectory(MissingProjectRuntime.runPromise).catch(
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
    linkDirectory: () => Effect.fail(archivedError),
  })
  const ArchivedProjectRuntime = ManagedRuntime.make(
    Layer.mergeAll(ArchivedProjectRepository, TestTicketRepository)
  )

  it('linkDirectory: maps ProjectArchivedError to CONFLICT', async () => {
    const error = await callLinkProjectDirectory(ArchivedProjectRuntime.runPromise).catch(
      cause => cause
    )

    if (!(error instanceof ORPCError)) {
      throw error
    }

    expect(error.code).toBe('CONFLICT')
    expect(error.cause).toBe(archivedError)
  })

  const repositoryError = ProjectRepositoryError.make({
    operation: 'linkDirectory',
    cause: new Error('Repository unavailable'),
  })
  const FailingProjectRepository = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    linkDirectory: () => Effect.fail(repositoryError),
  })
  const FailureRuntime = ManagedRuntime.make(
    Layer.mergeAll(FailingProjectRepository, TestTicketRepository)
  )

  it('linkDirectory: maps ProjectRepositoryError to INTERNAL_SERVER_ERROR', async () => {
    const error = await callLinkProjectDirectory(FailureRuntime.runPromise).catch(cause => cause)

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
      FailureRuntime.dispose(),
    ])
  })
})

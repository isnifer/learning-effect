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
import { GetProjectDirectoriesInput, ProjectDirectoryPaths } from '#/shared/contracts/Project'
import GetProjectDirectoriesProcedure from './GetProjectDirectoriesProcedure'

describe('GetProjectDirectoriesProcedure', () => {
  const input = Schema.decodeUnknownSync(GetProjectDirectoriesInput)({
    id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2a',
  })
  const expectedDirectories = Schema.decodeUnknownSync(ProjectDirectoryPaths)([
    '/Users/isnifer/www/learning-effect',
    '/Users/isnifer/www/red-docket',
  ])

  const callGetProjectDirectories = (runPromise: AppRunPromise) =>
    call(GetProjectDirectoriesProcedure, input, {
      context: { runPromise },
    })

  const SucceedingProjectRepository = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    getDirectories: () => Effect.succeed(expectedDirectories),
  })
  const TestTicketRepository = Layer.succeed(TicketRepository)(TicketRepositoryStub)
  const SuccessRuntime = ManagedRuntime.make(
    Layer.mergeAll(SucceedingProjectRepository, TestTicketRepository)
  )

  describe('when the repository succeeds', () => {
    it('getDirectories: returns Project directory paths', async () => {
      const result = await callGetProjectDirectories(SuccessRuntime.runPromise)

      expect(result).toStrictEqual(expectedDirectories)
    })
  })

  const notFoundError = ProjectNotFoundError.make({ id: input.id })
  const MissingProjectRepository = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    getDirectories: () => Effect.fail(notFoundError),
  })
  const MissingProjectRuntime = ManagedRuntime.make(
    Layer.mergeAll(MissingProjectRepository, TestTicketRepository)
  )

  describe('when the Project does not exist', () => {
    it('getDirectories: maps ProjectNotFoundError to NOT_FOUND', async () => {
      const error = await callGetProjectDirectories(MissingProjectRuntime.runPromise).catch(
        cause => cause
      )

      if (!(error instanceof ORPCError)) {
        throw error
      }

      expect(error.code).toBe('NOT_FOUND')
      expect(error.cause).toBe(notFoundError)
    })
  })

  const repositoryError = ProjectRepositoryError.make({
    operation: 'getDirectories',
    cause: new Error('Repository unavailable'),
  })
  const FailingProjectRepository = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    getDirectories: () => Effect.fail(repositoryError),
  })
  const FailureRuntime = ManagedRuntime.make(
    Layer.mergeAll(FailingProjectRepository, TestTicketRepository)
  )

  describe('when the repository fails', () => {
    it('getDirectories: maps ProjectRepositoryError to INTERNAL_SERVER_ERROR', async () => {
      const error = await callGetProjectDirectories(FailureRuntime.runPromise).catch(cause => cause)

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
      FailureRuntime.dispose(),
    ])
  })
})

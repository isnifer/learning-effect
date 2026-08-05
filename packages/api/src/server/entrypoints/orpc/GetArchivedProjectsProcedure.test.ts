import { afterAll, describe, expect, it } from '@effect/vitest'
import { ORPCError, call } from '@orpc/server'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as ManagedRuntime from 'effect/ManagedRuntime'
import * as Schema from 'effect/Schema'
import ProjectRepository, {
  ProjectRepositoryError,
} from '#/server/application/repositories/ProjectRepository'
import ProjectRepositoryStub from '#/server/application/repositories/testing/ProjectRepositoryStub'
import TicketRepositoryStub from '#/server/application/repositories/testing/TicketRepositoryStub'
import TicketRepository from '#/server/application/repositories/TicketRepository'
import type { AppRunPromise } from '#/server/runtime/AppRuntime'
import { Projects } from '#/shared/contracts/Project'
import GetArchivedProjectsProcedure from './GetArchivedProjectsProcedure'

describe('GetArchivedProjectsProcedure', () => {
  const expectedProjects = Schema.decodeUnknownSync(Projects)([
    {
      id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2a',
      name: 'Recently Archived Project',
      key: 'RECENT',
      createdAt: 1785835769172,
      archivedAt: 1785835769174,
    },
    {
      id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2b',
      name: 'Previously Archived Project',
      key: 'PREVIOUS',
      createdAt: 1785835769173,
      archivedAt: 1785835769172,
    },
  ])

  const callGetArchivedProjects = (runPromise: AppRunPromise) =>
    call(GetArchivedProjectsProcedure, undefined, {
      context: { runPromise },
    })

  const ProjectRepositorySucceeded = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    getArchived: Effect.succeed(expectedProjects),
  })
  const TicketRepositoryUnused = Layer.succeed(TicketRepository)(TicketRepositoryStub)

  const SuccessRuntime = ManagedRuntime.make(
    Layer.mergeAll(ProjectRepositorySucceeded, TicketRepositoryUnused)
  )

  describe('when the repository succeeds', () => {
    it('getArchived: returns archived Projects', async () => {
      const result = await callGetArchivedProjects(SuccessRuntime.runPromise)

      expect(result).toStrictEqual(expectedProjects)
    })
  })

  const repositoryError = ProjectRepositoryError.make({
    operation: 'getArchived',
    cause: new Error('Repository unavailable'),
  })

  const ProjectRepositoryFailed = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    getArchived: Effect.fail(repositoryError),
  })

  const FailureRuntime = ManagedRuntime.make(
    Layer.mergeAll(ProjectRepositoryFailed, TicketRepositoryUnused)
  )

  describe('when the repository fails', () => {
    it('getArchived: maps ProjectRepositoryError to INTERNAL_SERVER_ERROR', async () => {
      const error = await callGetArchivedProjects(FailureRuntime.runPromise).catch(cause => cause)

      if (!(error instanceof ORPCError)) {
        throw error
      }

      expect(error.code).toBe('INTERNAL_SERVER_ERROR')
      expect(error.cause).toBe(repositoryError)
    })
  })

  afterAll(async () => {
    await Promise.all([SuccessRuntime.dispose(), FailureRuntime.dispose()])
  })
})

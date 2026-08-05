import { afterAll, describe, expect, it } from '@effect/vitest'
import { ORPCError, call } from '@orpc/server'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as ManagedRuntime from 'effect/ManagedRuntime'
import * as Schema from 'effect/Schema'
import ProjectDirectoryPathNotLocalError from '#/server/application/errors/ProjectDirectoryPathNotLocalError'
import ProjectRepository, {
  ProjectKeyAlreadyExistsError,
  ProjectRepositoryError,
} from '#/server/application/repositories/ProjectRepository'
import ProjectRepositoryStub from '#/server/application/repositories/testing/ProjectRepositoryStub'
import TicketRepositoryStub from '#/server/application/repositories/testing/TicketRepositoryStub'
import TicketRepository from '#/server/application/repositories/TicketRepository'
import type { AppRunPromise } from '#/server/runtime/AppRuntime'
import Project, { CreateProjectInput, ProjectDirectoryPath } from '#/shared/contracts/Project'
import CreateProjectProcedure from './CreateProjectProcedure'

describe('CreateProjectProcedure', () => {
  const expectedProject = Schema.decodeUnknownSync(Project)({
    id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2a',
    name: 'Red Docket',
    key: 'RD',
    createdAt: 1785835769172,
    archivedAt: null,
  })

  const input = Schema.decodeUnknownSync(CreateProjectInput)({
    name: expectedProject.name,
    key: expectedProject.key,
    absolutePath: process.platform === 'win32' ? 'C:\\red-docket' : '/Users/isnifer/www/red-docket',
  })

  const callCreateProject = (runPromise: AppRunPromise, procedureInput: typeof input = input) =>
    call(CreateProjectProcedure, procedureInput, {
      context: { runPromise },
    })

  const ProjectRepositorySucceeded = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    create: repositoryInput =>
      Effect.sync(() => {
        expect(repositoryInput).toStrictEqual(input)

        return expectedProject
      }),
  })
  const TicketRepositoryUnused = Layer.succeed(TicketRepository)(TicketRepositoryStub)

  const SuccessRuntime = ManagedRuntime.make(
    Layer.mergeAll(ProjectRepositorySucceeded, TicketRepositoryUnused)
  )

  describe('when the repository succeeds', () => {
    it('create: returns the created Project', async () => {
      const result = await callCreateProject(SuccessRuntime.runPromise)

      expect(result).toStrictEqual(expectedProject)
    })
  })

  describe('when the directory path is not local to the current system', () => {
    it('create: maps ProjectDirectoryPathNotLocalError to BAD_REQUEST', async () => {
      const absolutePathFromAnotherSystem = Schema.decodeUnknownSync(ProjectDirectoryPath)(
        process.platform === 'win32' ? '/red-docket' : 'C:\\red-docket'
      )
      const pathFromAnotherSystem = Schema.decodeUnknownSync(CreateProjectInput)({
        name: expectedProject.name,
        key: expectedProject.key,
        absolutePath: absolutePathFromAnotherSystem,
      })

      const error = await callCreateProject(SuccessRuntime.runPromise, pathFromAnotherSystem).catch(
        cause => cause
      )

      if (!(error instanceof ORPCError)) {
        throw error
      }

      expect(error.code).toBe('BAD_REQUEST')
      expect(error.cause).toStrictEqual(
        ProjectDirectoryPathNotLocalError.make({
          absolutePath: absolutePathFromAnotherSystem,
        })
      )
    })
  })

  const projectKeyAlreadyExistsError = ProjectKeyAlreadyExistsError.make({
    key: expectedProject.key,
  })
  const ProjectRepositoryConflicting = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    create: () => Effect.fail(projectKeyAlreadyExistsError),
  })
  const ConflictRuntime = ManagedRuntime.make(
    Layer.mergeAll(ProjectRepositoryConflicting, TicketRepositoryUnused)
  )

  describe('when the Project key is already reserved', () => {
    it('create: maps ProjectKeyAlreadyExistsError to CONFLICT', async () => {
      const error = await callCreateProject(ConflictRuntime.runPromise).catch(cause => cause)

      if (!(error instanceof ORPCError)) {
        throw error
      }

      expect(error.code).toBe('CONFLICT')
      expect(error.cause).toBe(projectKeyAlreadyExistsError)
    })
  })

  const repositoryError = ProjectRepositoryError.make({
    operation: 'create',
    cause: new Error('Repository unavailable'),
  })
  const ProjectRepositoryFailed = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    create: () => Effect.fail(repositoryError),
  })
  const FailureRuntime = ManagedRuntime.make(
    Layer.mergeAll(ProjectRepositoryFailed, TicketRepositoryUnused)
  )

  describe('when the repository fails', () => {
    it('create: maps ProjectRepositoryError to INTERNAL_SERVER_ERROR', async () => {
      const error = await callCreateProject(FailureRuntime.runPromise).catch(cause => cause)

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
      ConflictRuntime.dispose(),
      FailureRuntime.dispose(),
    ])
  })
})

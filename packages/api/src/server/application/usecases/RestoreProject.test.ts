import { describe, expect, layer } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import ProjectRepository, {
  ProjectNotFoundError,
  ProjectRepositoryError,
} from '#/server/application/repositories/ProjectRepository'
import ProjectRepositoryStub from '#/server/application/repositories/testing/ProjectRepositoryStub'
import Project from '#/shared/contracts/Project'
import RestoreProject from './RestoreProject'

describe('RestoreProject', () => {
  const expectedProject = Schema.decodeUnknownSync(Project)({
    id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2a',
    name: 'Red Docket',
    key: 'RD',
    createdAt: 1785835769172,
    archivedAt: null,
  })

  const input = { id: expectedProject.id }

  const SucceedingProjectRepository = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    restore: repositoryInput =>
      Effect.sync(() => {
        expect(repositoryInput).toStrictEqual(input)

        return expectedProject
      }),
  })

  layer(SucceedingProjectRepository)('when the repository succeeds', it => {
    it.effect('restore: returns the restored Project', () =>
      Effect.gen(function* () {
        const result = yield* RestoreProject(input)

        expect(result).toBe(expectedProject)
      })
    )
  })

  const notFoundError = ProjectNotFoundError.make({ id: expectedProject.id })
  const MissingProjectRepository = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    restore: () => Effect.fail(notFoundError),
  })

  layer(MissingProjectRepository)('when the Project does not exist', it => {
    it.effect('restore: preserves ProjectNotFoundError', () =>
      Effect.gen(function* () {
        const error = yield* RestoreProject(input).pipe(Effect.flip)

        expect(error).toBe(notFoundError)
      })
    )
  })

  const repositoryError = ProjectRepositoryError.make({
    operation: 'restore',
    cause: new Error('Repository unavailable'),
  })
  const FailingProjectRepository = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    restore: () => Effect.fail(repositoryError),
  })

  layer(FailingProjectRepository)('when the repository fails', it => {
    it.effect('restore: preserves ProjectRepositoryError', () =>
      Effect.gen(function* () {
        const error = yield* RestoreProject(input).pipe(Effect.flip)

        expect(error).toBe(repositoryError)
      })
    )
  })
})

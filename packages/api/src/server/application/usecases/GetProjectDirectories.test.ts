import { describe, expect, layer } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import ProjectRepository, {
  ProjectNotFoundError,
  ProjectRepositoryError,
} from '#/server/application/repositories/ProjectRepository'
import ProjectRepositoryStub from '#/server/application/repositories/testing/ProjectRepositoryStub'
import { GetProjectDirectoriesInput, ProjectDirectoryPaths } from '#/shared/contracts/Project'
import GetProjectDirectories from './GetProjectDirectories'

describe('GetProjectDirectories', () => {
  const input = Schema.decodeUnknownSync(GetProjectDirectoriesInput)({
    id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2a',
  })
  const expectedDirectories = Schema.decodeUnknownSync(ProjectDirectoryPaths)([
    '/Users/isnifer/www/learning-effect',
    '/Users/isnifer/www/red-docket',
  ])

  const ProjectRepositorySucceeded = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    getDirectories: repositoryInput =>
      Effect.sync(() => {
        expect(repositoryInput).toStrictEqual(input)

        return expectedDirectories
      }),
  })

  layer(ProjectRepositorySucceeded)('when the repository succeeds', it => {
    it.effect('getDirectories: returns Project directory paths from the repository', () =>
      Effect.gen(function* () {
        const result = yield* GetProjectDirectories(input)

        expect(result).toBe(expectedDirectories)
      })
    )
  })

  const notFoundError = ProjectNotFoundError.make({ id: input.id })
  const ProjectRepositoryMissing = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    getDirectories: () => Effect.fail(notFoundError),
  })

  layer(ProjectRepositoryMissing)('when the Project does not exist', it => {
    it.effect('getDirectories: preserves ProjectNotFoundError', () =>
      Effect.gen(function* () {
        const error = yield* GetProjectDirectories(input).pipe(Effect.flip)

        expect(error).toBe(notFoundError)
      })
    )
  })

  const repositoryError = ProjectRepositoryError.make({
    operation: 'getDirectories',
    cause: new Error('Repository unavailable'),
  })
  const ProjectRepositoryFailed = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    getDirectories: () => Effect.fail(repositoryError),
  })

  layer(ProjectRepositoryFailed)('when the repository fails', it => {
    it.effect('getDirectories: preserves ProjectRepositoryError', () =>
      Effect.gen(function* () {
        const error = yield* GetProjectDirectories(input).pipe(Effect.flip)

        expect(error).toBe(repositoryError)
      })
    )
  })
})

import { describe, expect, layer } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import ProjectRepository, {
  ProjectRepositoryError,
} from '#/server/application/repositories/ProjectRepository'
import ProjectRepositoryStub from '#/server/application/repositories/testing/ProjectRepositoryStub'
import Project from '#/shared/contracts/Project'
import CreateProject from './CreateProject'

describe('CreateProject', () => {
  const expectedProject = Schema.decodeUnknownSync(Project)({
    id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2a',
    name: 'Red Docket',
    key: 'RD',
    createdAt: 1785835769172,
    archivedAt: null,
  })

  const ProjectRepositorySucceeded = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    create: input =>
      Effect.sync(() => {
        expect(input).toStrictEqual({
          name: expectedProject.name,
          key: expectedProject.key,
        })

        return expectedProject
      }),
  })

  layer(ProjectRepositorySucceeded)('when the repository succeeds', it => {
    it.effect('create: creates a Project through the repository', () =>
      Effect.gen(function* () {
        const result = yield* CreateProject({
          name: expectedProject.name,
          key: expectedProject.key,
        })

        expect(result).toBe(expectedProject)
      })
    )
  })

  const repositoryError = ProjectRepositoryError.make({
    operation: 'create',
    cause: new Error('Repository unavailable'),
  })

  const ProjectRepositoryFailed = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    create: () => Effect.fail(repositoryError),
  })

  layer(ProjectRepositoryFailed)('when the repository fails', it => {
    it.effect('create: preserves ProjectRepositoryError', () =>
      Effect.gen(function* () {
        const error = yield* CreateProject({
          name: expectedProject.name,
          key: expectedProject.key,
        }).pipe(Effect.flip)

        expect(error).toBe(repositoryError)
      })
    )
  })
})

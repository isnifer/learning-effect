import { describe, expect, layer } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import { Projects } from '#/shared/contracts/Project'
import ProjectRepository, { ProjectRepositoryError } from '../repositories/ProjectRepository'
import ProjectRepositoryStub from '../repositories/testing/ProjectRepositoryStub'
import GetActiveProjects from './GetActiveProjects'

describe('GetActiveProjects', () => {
  const expectedProjects = Schema.decodeUnknownSync(Projects)([
    {
      id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2b',
      name: 'New Project',
      key: 'NEW',
      createdAt: 1785835769173,
      archivedAt: null,
    },
    {
      id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2a',
      name: 'Old Project',
      key: 'OLD',
      createdAt: 1785835769172,
      archivedAt: null,
    },
  ])

  const SucceedingProjectRepository = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    getActive: Effect.succeed(expectedProjects),
  })

  layer(SucceedingProjectRepository)('when the repository succeeds', it => {
    it.effect('getActive: returns active Projects from the repository', () =>
      Effect.gen(function* () {
        const result = yield* GetActiveProjects()

        expect(result).toBe(expectedProjects)
      })
    )
  })

  const repositoryError = ProjectRepositoryError.make({
    operation: 'getActive',
    cause: new Error('Repository unavailable'),
  })

  const FailingProjectRepository = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    getActive: Effect.fail(repositoryError),
  })

  layer(FailingProjectRepository)('when the repository fails', it => {
    it.effect('getActive: preserves ProjectRepositoryError', () =>
      Effect.gen(function* () {
        const error = yield* GetActiveProjects().pipe(Effect.flip)

        expect(error).toBe(repositoryError)
      })
    )
  })
})

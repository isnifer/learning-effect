import { describe, expect, layer } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import { Projects } from '#/shared/contracts/Project'
import ProjectRepository, { ProjectRepositoryError } from '../repositories/ProjectRepository'
import ProjectRepositoryStub from '../repositories/testing/ProjectRepositoryStub'
import GetArchivedProjects from './GetArchivedProjects'

describe('GetArchivedProjects', () => {
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

  const ProjectRepositorySucceeded = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    getArchived: Effect.succeed(expectedProjects),
  })

  layer(ProjectRepositorySucceeded)('when the repository succeeds', it => {
    it.effect('getArchived: returns archived Projects from the repository', () =>
      Effect.gen(function* () {
        const result = yield* GetArchivedProjects()

        expect(result).toBe(expectedProjects)
      })
    )
  })

  const repositoryError = ProjectRepositoryError.make({
    operation: 'getArchived',
    cause: new Error('Repository unavailable'),
  })

  const ProjectRepositoryFailed = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    getArchived: Effect.fail(repositoryError),
  })

  layer(ProjectRepositoryFailed)('when the repository fails', it => {
    it.effect('getArchived: preserves ProjectRepositoryError', () =>
      Effect.gen(function* () {
        const error = yield* GetArchivedProjects().pipe(Effect.flip)

        expect(error).toBe(repositoryError)
      })
    )
  })
})

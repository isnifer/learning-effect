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
import ArchiveProject from './ArchiveProject'

describe('ArchiveProject', () => {
  const expectedProject = Schema.decodeUnknownSync(Project)({
    id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2a',
    name: 'Red Docket',
    key: 'RD',
    createdAt: 1785835769172,
    archivedAt: 1785835769173,
  })

  const input = { id: expectedProject.id }

  const ProjectRepositorySucceeded = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    archive: repositoryInput =>
      Effect.sync(() => {
        expect(repositoryInput).toStrictEqual(input)

        return expectedProject
      }),
  })

  layer(ProjectRepositorySucceeded)('when the repository succeeds', it => {
    it.effect('archive: returns the archived Project', () =>
      Effect.gen(function* () {
        const result = yield* ArchiveProject(input)

        expect(result).toBe(expectedProject)
      })
    )
  })

  const notFoundError = ProjectNotFoundError.make({ id: expectedProject.id })
  const ProjectRepositoryMissing = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    archive: () => Effect.fail(notFoundError),
  })

  layer(ProjectRepositoryMissing)('when the Project does not exist', it => {
    it.effect('archive: preserves ProjectNotFoundError', () =>
      Effect.gen(function* () {
        const error = yield* ArchiveProject(input).pipe(Effect.flip)

        expect(error).toBe(notFoundError)
      })
    )
  })

  const repositoryError = ProjectRepositoryError.make({
    operation: 'archive',
    cause: new Error('Repository unavailable'),
  })
  const ProjectRepositoryFailed = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    archive: () => Effect.fail(repositoryError),
  })

  layer(ProjectRepositoryFailed)('when the repository fails', it => {
    it.effect('archive: preserves ProjectRepositoryError', () =>
      Effect.gen(function* () {
        const error = yield* ArchiveProject(input).pipe(Effect.flip)

        expect(error).toBe(repositoryError)
      })
    )
  })
})

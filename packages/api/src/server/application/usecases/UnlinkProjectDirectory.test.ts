import { describe, expect, layer } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import ProjectRepository, {
  ProjectArchivedError,
  ProjectDirectoryNotLinkedError,
  ProjectNotFoundError,
  ProjectRepositoryError,
} from '#/server/application/repositories/ProjectRepository'
import ProjectRepositoryStub from '#/server/application/repositories/testing/ProjectRepositoryStub'
import { UnlinkProjectDirectoryInput } from '#/shared/contracts/Project'
import UnlinkProjectDirectory from './UnlinkProjectDirectory'

describe('UnlinkProjectDirectory', () => {
  const input = Schema.decodeUnknownSync(UnlinkProjectDirectoryInput)({
    projectId: '019fcc1a-bd5d-751e-9a30-0bc92d133b2a',
    absolutePath: '/Users/isnifer/www/red-docket',
  })

  const ProjectRepositorySucceeded = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    unlinkDirectory: repositoryInput =>
      Effect.sync(() => {
        expect(repositoryInput).toStrictEqual(input)

        return input
      }),
  })

  layer(ProjectRepositorySucceeded)('when the repository succeeds', it => {
    it.effect('unlinkDirectory: returns the unlinked Project directory', () =>
      Effect.gen(function* () {
        const result = yield* UnlinkProjectDirectory(input)

        expect(result).toBe(input)
      })
    )
  })

  const notFoundError = ProjectNotFoundError.make({ id: input.projectId })
  const ProjectRepositoryMissing = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    unlinkDirectory: () => Effect.fail(notFoundError),
  })

  layer(ProjectRepositoryMissing)('when the Project does not exist', it => {
    it.effect('unlinkDirectory: preserves ProjectNotFoundError', () =>
      Effect.gen(function* () {
        const error = yield* UnlinkProjectDirectory(input).pipe(Effect.flip)

        expect(error).toBe(notFoundError)
      })
    )
  })

  const archivedError = ProjectArchivedError.make({ id: input.projectId })
  const ProjectRepositoryArchived = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    unlinkDirectory: () => Effect.fail(archivedError),
  })

  layer(ProjectRepositoryArchived)('when the Project is archived', it => {
    it.effect('unlinkDirectory: preserves ProjectArchivedError', () =>
      Effect.gen(function* () {
        const error = yield* UnlinkProjectDirectory(input).pipe(Effect.flip)

        expect(error).toBe(archivedError)
      })
    )
  })

  const notLinkedError = ProjectDirectoryNotLinkedError.make(input)
  const ProjectRepositoryDirectoryUnlinked = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    unlinkDirectory: () => Effect.fail(notLinkedError),
  })

  layer(ProjectRepositoryDirectoryUnlinked)('when the directory is not linked', it => {
    it.effect('unlinkDirectory: preserves ProjectDirectoryNotLinkedError', () =>
      Effect.gen(function* () {
        const error = yield* UnlinkProjectDirectory(input).pipe(Effect.flip)

        expect(error).toBe(notLinkedError)
      })
    )
  })

  const repositoryError = ProjectRepositoryError.make({
    operation: 'unlinkDirectory',
    cause: new Error('Repository unavailable'),
  })
  const ProjectRepositoryFailed = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    unlinkDirectory: () => Effect.fail(repositoryError),
  })

  layer(ProjectRepositoryFailed)('when the repository fails', it => {
    it.effect('unlinkDirectory: preserves ProjectRepositoryError', () =>
      Effect.gen(function* () {
        const error = yield* UnlinkProjectDirectory(input).pipe(Effect.flip)

        expect(error).toBe(repositoryError)
      })
    )
  })
})

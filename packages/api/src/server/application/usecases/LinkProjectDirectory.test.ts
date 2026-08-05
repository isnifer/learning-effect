import { describe, expect, layer } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import ProjectRepository, {
  ProjectArchivedError,
  ProjectNotFoundError,
  ProjectRepositoryError,
} from '#/server/application/repositories/ProjectRepository'
import ProjectRepositoryStub from '#/server/application/repositories/testing/ProjectRepositoryStub'
import { LinkProjectDirectoryInput } from '#/shared/contracts/Project'
import LinkProjectDirectory, { ProjectDirectoryPathNotLocalError } from './LinkProjectDirectory'

describe('LinkProjectDirectory', () => {
  const input = Schema.decodeUnknownSync(LinkProjectDirectoryInput)({
    projectId: '019fcc1a-bd5d-751e-9a30-0bc92d133b2a',
    absolutePath: '/Users/isnifer/www/learning-effect',
  })

  const SucceedingProjectRepository = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    linkDirectory: repositoryInput =>
      Effect.sync(() => {
        expect(repositoryInput).toStrictEqual(input)

        return input
      }),
  })

  layer(SucceedingProjectRepository)('when the repository succeeds', it => {
    it.effect('linkDirectory: returns the linked Project directory', () =>
      Effect.gen(function* () {
        const result = yield* LinkProjectDirectory(input)

        expect(result).toBe(input)
      })
    )
  })

  const pathFromAnotherSystem = Schema.decodeUnknownSync(LinkProjectDirectoryInput)({
    projectId: input.projectId,
    absolutePath: process.platform === 'win32' ? '/red-docket' : 'C:\\red-docket',
  })

  layer(Layer.succeed(ProjectRepository)(ProjectRepositoryStub))(
    'when the path is not local to the current system',
    it => {
      it.effect('linkDirectory: fails with ProjectDirectoryPathNotLocalError', () =>
        Effect.gen(function* () {
          const error = yield* LinkProjectDirectory(pathFromAnotherSystem).pipe(Effect.flip)

          expect(error).toStrictEqual(
            ProjectDirectoryPathNotLocalError.make({
              absolutePath: pathFromAnotherSystem.absolutePath,
            })
          )
        })
      )
    }
  )

  const notFoundError = ProjectNotFoundError.make({ id: input.projectId })
  const MissingProjectRepository = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    linkDirectory: () => Effect.fail(notFoundError),
  })

  layer(MissingProjectRepository)('when the Project does not exist', it => {
    it.effect('linkDirectory: preserves ProjectNotFoundError', () =>
      Effect.gen(function* () {
        const error = yield* LinkProjectDirectory(input).pipe(Effect.flip)

        expect(error).toBe(notFoundError)
      })
    )
  })

  const archivedError = ProjectArchivedError.make({ id: input.projectId })
  const ArchivedProjectRepository = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    linkDirectory: () => Effect.fail(archivedError),
  })

  layer(ArchivedProjectRepository)('when the Project is archived', it => {
    it.effect('linkDirectory: preserves ProjectArchivedError', () =>
      Effect.gen(function* () {
        const error = yield* LinkProjectDirectory(input).pipe(Effect.flip)

        expect(error).toBe(archivedError)
      })
    )
  })

  const repositoryError = ProjectRepositoryError.make({
    operation: 'linkDirectory',
    cause: new Error('Repository unavailable'),
  })
  const FailingProjectRepository = Layer.succeed(ProjectRepository)({
    ...ProjectRepositoryStub,
    linkDirectory: () => Effect.fail(repositoryError),
  })

  layer(FailingProjectRepository)('when the repository fails', it => {
    it.effect('linkDirectory: preserves ProjectRepositoryError', () =>
      Effect.gen(function* () {
        const error = yield* LinkProjectDirectory(input).pipe(Effect.flip)

        expect(error).toBe(repositoryError)
      })
    )
  })
})

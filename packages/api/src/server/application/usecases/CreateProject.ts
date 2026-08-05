import * as Effect from 'effect/Effect'
import ProjectDirectoryPathNotLocalError from '#/server/application/errors/ProjectDirectoryPathNotLocalError'
import ProjectRepository from '#/server/application/repositories/ProjectRepository'
import type { TCreateProjectInput } from '#/shared/contracts/Project'
import isAbsoluteProjectDirectoryPath from '#/utils/isAbsoluteProjectDirectoryPath'

const CreateProject = Effect.fn('CreateProject')(function* (input: TCreateProjectInput) {
  if (input.absolutePath && !isAbsoluteProjectDirectoryPath(input.absolutePath, process.platform)) {
    return yield* ProjectDirectoryPathNotLocalError.make({
      absolutePath: input.absolutePath,
    })
  }

  const projectRepository = yield* ProjectRepository

  return yield* projectRepository.create(input)
})

export default CreateProject

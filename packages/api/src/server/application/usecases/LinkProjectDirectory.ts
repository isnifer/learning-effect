import * as Effect from 'effect/Effect'
import ProjectDirectoryPathNotLocalError from '#/server/application/errors/ProjectDirectoryPathNotLocalError'
import type { TLinkProjectDirectoryInput } from '#/shared/contracts/Project'
import isAbsoluteProjectDirectoryPath from '#/utils/isAbsoluteProjectDirectoryPath'
import ProjectRepository from '../repositories/ProjectRepository'

const LinkProjectDirectory = Effect.fn('LinkProjectDirectory')(function* (
  input: TLinkProjectDirectoryInput
) {
  if (!isAbsoluteProjectDirectoryPath(input.absolutePath, process.platform)) {
    return yield* ProjectDirectoryPathNotLocalError.make({
      absolutePath: input.absolutePath,
    })
  }

  const projectRepository = yield* ProjectRepository

  return yield* projectRepository.linkDirectory(input)
})

export default LinkProjectDirectory

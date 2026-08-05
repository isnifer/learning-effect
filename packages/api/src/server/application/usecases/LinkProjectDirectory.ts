import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'
import { ProjectDirectoryPath, type TLinkProjectDirectoryInput } from '#/shared/contracts/Project'
import isAbsoluteProjectDirectoryPath from '#/utils/isAbsoluteProjectDirectoryPath'
import ProjectRepository from '../repositories/ProjectRepository'

export class ProjectDirectoryPathNotLocalError extends Schema.TaggedErrorClass<ProjectDirectoryPathNotLocalError>()(
  'ProjectDirectoryPathNotLocalError',
  {
    absolutePath: ProjectDirectoryPath,
  }
) {}

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

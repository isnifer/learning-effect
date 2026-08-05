import * as Schema from 'effect/Schema'
import { ProjectDirectoryPath } from '#/shared/contracts/Project'

export default class ProjectDirectoryPathNotLocalError extends Schema.TaggedErrorClass<ProjectDirectoryPathNotLocalError>()(
  'ProjectDirectoryPathNotLocalError',
  {
    absolutePath: ProjectDirectoryPath,
  }
) {}

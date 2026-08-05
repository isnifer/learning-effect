import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'
import { ProjectKey, type TProject } from '#/shared/contracts/Project'

export class ProjectRepositoryError extends Schema.TaggedErrorClass<ProjectRepositoryError>()(
  'ProjectRepositoryError',
  {
    operation: Schema.Trim.pipe(Schema.check(Schema.isNonEmpty())),
    cause: Schema.Defect(),
  }
) {}

export class ProjectKeyAlreadyExistsError extends Schema.TaggedErrorClass<ProjectKeyAlreadyExistsError>()(
  'ProjectKeyAlreadyExistsError',
  {
    key: ProjectKey,
  }
) {}

export default class ProjectRepository extends Context.Service<
  ProjectRepository,
  {
    readonly create: (
      input: Pick<TProject, 'name' | 'key'>
    ) => Effect.Effect<TProject, ProjectKeyAlreadyExistsError | ProjectRepositoryError>
  }
>()('ProjectRepository') {}

import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'
import {
  ProjectId,
  ProjectDirectoryPath,
  ProjectKey,
  type TLinkProjectDirectoryInput,
  type TProject,
  type TUnlinkProjectDirectoryInput,
} from '#/shared/contracts/Project'

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

export class ProjectNotFoundError extends Schema.TaggedErrorClass<ProjectNotFoundError>()(
  'ProjectNotFoundError',
  {
    id: ProjectId,
  }
) {}

export class ProjectArchivedError extends Schema.TaggedErrorClass<ProjectArchivedError>()(
  'ProjectArchivedError',
  {
    id: ProjectId,
  }
) {}

export class ProjectDirectoryNotLinkedError extends Schema.TaggedErrorClass<ProjectDirectoryNotLinkedError>()(
  'ProjectDirectoryNotLinkedError',
  {
    projectId: ProjectId,
    absolutePath: ProjectDirectoryPath,
  }
) {}

export default class ProjectRepository extends Context.Service<
  ProjectRepository,
  {
    readonly create: (
      input: Pick<TProject, 'name' | 'key'>
    ) => Effect.Effect<TProject, ProjectKeyAlreadyExistsError | ProjectRepositoryError>
    readonly getActive: Effect.Effect<ReadonlyArray<TProject>, ProjectRepositoryError>
    readonly archive: (
      input: Pick<TProject, 'id'>
    ) => Effect.Effect<TProject, ProjectNotFoundError | ProjectRepositoryError>
    readonly restore: (
      input: Pick<TProject, 'id'>
    ) => Effect.Effect<TProject, ProjectNotFoundError | ProjectRepositoryError>
    readonly linkDirectory: (
      input: TLinkProjectDirectoryInput
    ) => Effect.Effect<
      TLinkProjectDirectoryInput,
      ProjectArchivedError | ProjectNotFoundError | ProjectRepositoryError
    >
    readonly unlinkDirectory: (
      input: TUnlinkProjectDirectoryInput
    ) => Effect.Effect<
      TUnlinkProjectDirectoryInput,
      | ProjectArchivedError
      | ProjectDirectoryNotLinkedError
      | ProjectNotFoundError
      | ProjectRepositoryError
    >
  }
>()('ProjectRepository') {}

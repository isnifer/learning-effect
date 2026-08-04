import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'
import { TaskId, type TTask } from '#/shared/contracts/Task'

export class TaskRepositoryError extends Schema.TaggedErrorClass<TaskRepositoryError>()(
  'TaskRepositoryError',
  {
    operation: Schema.Trim.pipe(Schema.check(Schema.isNonEmpty())),
    cause: Schema.Defect(),
  }
) {}

export class TaskNotFoundError extends Schema.TaggedErrorClass<TaskNotFoundError>()(
  'TaskNotFoundError',
  {
    id: TaskId,
  }
) {}

export default class TaskRepository extends Context.Service<
  TaskRepository,
  {
    readonly create: (input: Pick<TTask, 'title'>) => Effect.Effect<TTask, TaskRepositoryError>
    readonly getAll: () => Effect.Effect<ReadonlyArray<TTask>, TaskRepositoryError>
    readonly updateStatus: (
      input: Pick<TTask, 'id' | 'status'>
    ) => Effect.Effect<TTask, TaskNotFoundError | TaskRepositoryError>
    readonly updateTitle: (
      input: Pick<TTask, 'id' | 'title'>
    ) => Effect.Effect<TTask, TaskNotFoundError | TaskRepositoryError>
  }
>()('TaskRepository') {}

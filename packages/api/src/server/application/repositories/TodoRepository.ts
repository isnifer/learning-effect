import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'
import { TodoId, type TTodo } from '#/shared/contracts/Todo'

export class TodoRepositoryError extends Schema.TaggedErrorClass<TodoRepositoryError>()(
  'TodoRepositoryError',
  {
    operation: Schema.Trim.pipe(Schema.check(Schema.isNonEmpty())),
    cause: Schema.Defect(),
  }
) {}

export class TodoNotFoundError extends Schema.TaggedErrorClass<TodoNotFoundError>()(
  'TodoNotFoundError',
  {
    id: TodoId,
  }
) {}

export default class TodoRepository extends Context.Service<
  TodoRepository,
  {
    readonly create: (input: Pick<TTodo, 'title'>) => Effect.Effect<TTodo, TodoRepositoryError>
    readonly getAll: () => Effect.Effect<ReadonlyArray<TTodo>, TodoRepositoryError>
    readonly updateStatus: (
      input: Pick<TTodo, 'id' | 'status'>
    ) => Effect.Effect<TTodo, TodoNotFoundError | TodoRepositoryError>
    readonly updateTitle: (
      input: Pick<TTodo, 'id' | 'title'>
    ) => Effect.Effect<TTodo, TodoNotFoundError | TodoRepositoryError>
  }
>()('TodoRepository') {}

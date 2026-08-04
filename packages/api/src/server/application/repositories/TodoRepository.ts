import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'
import type { TTodo } from '#/server/domain/entities/Todo'

export class TodoRepositoryError extends Schema.TaggedErrorClass<TodoRepositoryError>()(
  'TodoRepositoryError',
  {
    operation: Schema.String,
    cause: Schema.Defect(),
  }
) {}

export default class TodoRepository extends Context.Service<
  TodoRepository,
  {
    readonly create: (input: Pick<TTodo, 'title'>) => Effect.Effect<TTodo, TodoRepositoryError>
    readonly getAll: () => Effect.Effect<ReadonlyArray<TTodo>, TodoRepositoryError>
  }
>()('TodoRepository') {}

import * as Schema from 'effect/Schema'

const TodoId = Schema.String.pipe(Schema.check(Schema.isUUID(7)), Schema.brand('TodoId'))

export const TodoTitle = Schema.Trim.pipe(
  Schema.check(Schema.isNonEmpty()),
  Schema.brand('TodoTitle')
)

export const TodoStatus = Schema.Literals(['TODO', 'IN_PROGRESS', 'COMPLETED'])

const Todo = Schema.Struct({
  id: TodoId,
  title: TodoTitle,
  status: TodoStatus,
  createdAt: Schema.DateTimeUtcFromMillis,
})

export type TTodo = typeof Todo.Type

export default Todo

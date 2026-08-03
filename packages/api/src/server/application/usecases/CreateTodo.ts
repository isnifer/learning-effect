import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'
import { TodoTitle } from '#/server/domain/entities/Todo'
import TodoRepository from '../repositories/TodoRepository'

const CreateTodoInput = Schema.Struct({
  title: TodoTitle,
})

type TCreateTodoInput = typeof CreateTodoInput.Type

const CreateTodo = Effect.fn('CreateTodo')(function* (input: TCreateTodoInput) {
  // Получить TodoRepository
  const todoRepository = yield* TodoRepository

  // Вернуть Todo.
  return yield* todoRepository.create(input)
})

export default CreateTodo

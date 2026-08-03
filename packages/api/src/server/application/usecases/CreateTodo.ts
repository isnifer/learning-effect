import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'
import { TodoTitle } from '#/server/domain/entities/Todo'
import TodoRepository from '../repositories/TodoRepository'

export const CreateTodoInput = Schema.Struct({
  title: TodoTitle,
})

type TCreateTodoInput = typeof CreateTodoInput.Type

const CreateTodo = Effect.fn('CreateTodo')(function* (input: TCreateTodoInput) {
  const todoRepository = yield* TodoRepository

  return yield* todoRepository.create(input)
})

export default CreateTodo

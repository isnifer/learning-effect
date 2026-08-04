import * as Effect from 'effect/Effect'
import type { TCreateTodoInput } from '#/shared/contracts/Todo'
import TodoRepository from '../repositories/TodoRepository'

const CreateTodo = Effect.fn('CreateTodo')(function* (input: TCreateTodoInput) {
  const todoRepository = yield* TodoRepository

  return yield* todoRepository.create(input)
})

export default CreateTodo

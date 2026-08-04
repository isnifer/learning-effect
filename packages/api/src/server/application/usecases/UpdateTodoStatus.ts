import * as Effect from 'effect/Effect'
import type { TUpdateTodoStatusInput } from '#/shared/contracts/Todo'
import TodoRepository from '../repositories/TodoRepository'

const UpdateTodoStatus = Effect.fn('UpdateTodoStatus')(function* (input: TUpdateTodoStatusInput) {
  const todoRepository = yield* TodoRepository

  return yield* todoRepository.updateStatus(input)
})

export default UpdateTodoStatus

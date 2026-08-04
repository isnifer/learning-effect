import * as Effect from 'effect/Effect'
import type { TUpdateTodoTitleInput } from '#/shared/contracts/Todo'
import TodoRepository from '../repositories/TodoRepository'

const UpdateTodoTitle = Effect.fn('UpdateTodoTitle')(function* (input: TUpdateTodoTitleInput) {
  const todoRepository = yield* TodoRepository

  return yield* todoRepository.updateTitle(input)
})

export default UpdateTodoTitle

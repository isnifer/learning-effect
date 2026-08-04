import * as Effect from 'effect/Effect'
import * as Struct from 'effect/Struct'
import Todo from '#/server/domain/entities/Todo'
import TodoRepository from '../repositories/TodoRepository'

export const UpdateTodoStatusInput = Todo.mapFields(Struct.pick(['id', 'status']))

type TUpdateTodoStatusInput = typeof UpdateTodoStatusInput.Type

const UpdateTodoStatus = Effect.fn('UpdateTodoStatus')(function* (input: TUpdateTodoStatusInput) {
  const todoRepository = yield* TodoRepository

  return yield* todoRepository.updateStatus(input)
})

export default UpdateTodoStatus

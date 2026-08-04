import * as Effect from 'effect/Effect'
import TodoRepository from '../repositories/TodoRepository'

const GetTodos = Effect.fn('GetTodos')(function* () {
  const todoRepository = yield* TodoRepository

  return yield* todoRepository.getAll()
})

export default GetTodos

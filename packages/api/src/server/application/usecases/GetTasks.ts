import * as Effect from 'effect/Effect'
import TaskRepository from '../repositories/TaskRepository'

const GetTasks = Effect.fn('GetTasks')(function* () {
  const taskRepository = yield* TaskRepository

  return yield* taskRepository.getAll()
})

export default GetTasks

import * as Effect from 'effect/Effect'
import type { TUpdateTaskStatusInput } from '#/shared/contracts/Task'
import TaskRepository from '../repositories/TaskRepository'

const UpdateTaskStatus = Effect.fn('UpdateTaskStatus')(function* (input: TUpdateTaskStatusInput) {
  const taskRepository = yield* TaskRepository

  return yield* taskRepository.updateStatus(input)
})

export default UpdateTaskStatus

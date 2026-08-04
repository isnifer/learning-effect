import * as Effect from 'effect/Effect'
import type { TUpdateTaskTitleInput } from '#/shared/contracts/Task'
import TaskRepository from '../repositories/TaskRepository'

const UpdateTaskTitle = Effect.fn('UpdateTaskTitle')(function* (input: TUpdateTaskTitleInput) {
  const taskRepository = yield* TaskRepository

  return yield* taskRepository.updateTitle(input)
})

export default UpdateTaskTitle

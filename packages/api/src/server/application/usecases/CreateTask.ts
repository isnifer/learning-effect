import * as Effect from 'effect/Effect'
import type { TCreateTaskInput } from '#/shared/contracts/Task'
import TaskRepository from '../repositories/TaskRepository'

const CreateTask = Effect.fn('CreateTask')(function* (input: TCreateTaskInput) {
  const taskRepository = yield* TaskRepository

  return yield* taskRepository.create(input)
})

export default CreateTask

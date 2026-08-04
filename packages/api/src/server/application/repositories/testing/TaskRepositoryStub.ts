import * as Effect from 'effect/Effect'
import TaskRepository from '../TaskRepository'

const TaskRepositoryStub: TaskRepository['Service'] = {
  create: () => Effect.die(new Error('Unexpected TaskRepository.create')),
  getAll: () => Effect.die(new Error('Unexpected TaskRepository.getAll')),
  updateStatus: () => Effect.die(new Error('Unexpected TaskRepository.updateStatus')),
  updateTitle: () => Effect.die(new Error('Unexpected TaskRepository.updateTitle')),
}

export default TaskRepositoryStub

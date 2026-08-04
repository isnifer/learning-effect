import * as Effect from 'effect/Effect'
import TodoRepository from '../TodoRepository'

const TodoRepositoryStub: TodoRepository['Service'] = {
  create: () => Effect.die(new Error('Unexpected TodoRepository.create')),
  getAll: () => Effect.die(new Error('Unexpected TodoRepository.getAll')),
  updateStatus: () => Effect.die(new Error('Unexpected TodoRepository.updateStatus')),
  updateTitle: () => Effect.die(new Error('Unexpected TodoRepository.updateTitle')),
}

export default TodoRepositoryStub

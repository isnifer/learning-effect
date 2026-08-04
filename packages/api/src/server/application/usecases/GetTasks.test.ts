import { describe, expect, layer } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import Task from '#/shared/contracts/Task'
import TaskRepository, { TaskRepositoryError } from '../repositories/TaskRepository'
import TaskRepositoryStub from '../repositories/testing/TaskRepositoryStub'
import GetTasks from './GetTasks'

describe('GetTasks', () => {
  const expectedTasks = Schema.decodeUnknownSync(Schema.Array(Task))([
    {
      id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2a',
      title: 'First Task',
      status: 'TODO',
      createdAt: 1785835769172,
    },
    {
      id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2b',
      title: 'Second Task',
      status: 'IN_PROGRESS',
      createdAt: 1785835769173,
    },
  ])

  const SucceedingTaskRepository = Layer.succeed(TaskRepository)({
    ...TaskRepositoryStub,
    getAll: () => Effect.succeed(expectedTasks),
  })

  layer(SucceedingTaskRepository)('when the repository succeeds', it => {
    it.effect('getAll: returns Tasks from the repository', () =>
      Effect.gen(function* () {
        const result = yield* GetTasks()

        expect(result).toBe(expectedTasks)
      })
    )
  })

  const repositoryError = TaskRepositoryError.make({
    operation: 'getAll',
    cause: new Error('Repository unavailable'),
  })

  const FailingTaskRepository = Layer.succeed(TaskRepository)({
    ...TaskRepositoryStub,
    getAll: () => Effect.fail(repositoryError),
  })

  layer(FailingTaskRepository)('when the repository fails', it => {
    it.effect('getAll: preserves TaskRepositoryError', () =>
      Effect.gen(function* () {
        const error = yield* GetTasks().pipe(Effect.flip)

        expect(error).toBe(repositoryError)
      })
    )
  })
})

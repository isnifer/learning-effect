import { describe, expect, layer } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import Task from '#/shared/contracts/Task'
import TaskRepository, { TaskRepositoryError } from '../repositories/TaskRepository'
import TaskRepositoryStub from '../repositories/testing/TaskRepositoryStub'
import CreateTask from './CreateTask'

describe('CreateTask', () => {
  const expectedTask = Schema.decodeUnknownSync(Task)({
    id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2a',
    title: 'Test Task',
    status: 'TODO',
    createdAt: 1785835769172,
  })

  const TestTaskRepository = Layer.succeed(TaskRepository)({
    ...TaskRepositoryStub,
    create: input =>
      Effect.sync(() => {
        expect(input).toStrictEqual({ title: expectedTask.title })

        return expectedTask
      }),
  })

  layer(TestTaskRepository)('when the repository succeeds', it => {
    it.effect('create: creates a Task through the repository', () =>
      Effect.gen(function* () {
        const result = yield* CreateTask({
          title: expectedTask.title,
        })

        expect(result).toBe(expectedTask)
      })
    )
  })

  const repositoryError = TaskRepositoryError.make({
    operation: 'create',
    cause: new Error('Repository unavailable'),
  })

  const FailingTaskRepository = Layer.succeed(TaskRepository)({
    ...TaskRepositoryStub,
    create: () => Effect.fail(repositoryError),
  })

  layer(FailingTaskRepository)('when the repository fails', it => {
    it.effect('create: preserves TaskRepositoryError', () =>
      Effect.gen(function* () {
        const error = yield* CreateTask({
          title: expectedTask.title,
        }).pipe(Effect.flip)

        expect(error).toBe(repositoryError)
      })
    )
  })
})

import { describe, expect, layer } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import TaskRepository, {
  TaskNotFoundError,
  TaskRepositoryError,
} from '#/server/application/repositories/TaskRepository'
import TaskRepositoryStub from '#/server/application/repositories/testing/TaskRepositoryStub'
import Task from '#/shared/contracts/Task'
import UpdateTaskStatus from './UpdateTaskStatus'

describe('UpdateTaskStatus', () => {
  const expectedTask = Schema.decodeUnknownSync(Task)({
    id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2a',
    title: 'Test Task',
    status: 'COMPLETED',
    createdAt: 1785835769172,
  })

  const input = {
    id: expectedTask.id,
    status: expectedTask.status,
  }

  const SucceedingTaskRepository = Layer.succeed(TaskRepository)({
    ...TaskRepositoryStub,
    updateStatus: repositoryInput =>
      Effect.sync(() => {
        expect(repositoryInput).toStrictEqual(input)

        return expectedTask
      }),
  })

  layer(SucceedingTaskRepository)('when the repository succeeds', it => {
    it.effect('updateStatus: returns the updated Task', () =>
      Effect.gen(function* () {
        const result = yield* UpdateTaskStatus(input)

        expect(result).toBe(expectedTask)
      })
    )
  })

  const notFoundError = TaskNotFoundError.make({ id: expectedTask.id })
  const MissingTaskRepository = Layer.succeed(TaskRepository)({
    ...TaskRepositoryStub,
    updateStatus: () => Effect.fail(notFoundError),
  })

  layer(MissingTaskRepository)('when the Task does not exist', it => {
    it.effect('updateStatus: preserves TaskNotFoundError', () =>
      Effect.gen(function* () {
        const error = yield* UpdateTaskStatus(input).pipe(Effect.flip)

        expect(error).toBe(notFoundError)
      })
    )
  })

  const repositoryError = TaskRepositoryError.make({
    operation: 'updateStatus',
    cause: new Error('Repository unavailable'),
  })
  const FailingTaskRepository = Layer.succeed(TaskRepository)({
    ...TaskRepositoryStub,
    updateStatus: () => Effect.fail(repositoryError),
  })

  layer(FailingTaskRepository)('when the repository fails', it => {
    it.effect('updateStatus: preserves TaskRepositoryError', () =>
      Effect.gen(function* () {
        const error = yield* UpdateTaskStatus(input).pipe(Effect.flip)

        expect(error).toBe(repositoryError)
      })
    )
  })
})

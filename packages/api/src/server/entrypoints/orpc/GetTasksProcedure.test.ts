import { afterAll, describe, expect, it } from '@effect/vitest'
import { ORPCError, call } from '@orpc/server'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as ManagedRuntime from 'effect/ManagedRuntime'
import * as Schema from 'effect/Schema'
import TaskRepository, {
  TaskRepositoryError,
} from '#/server/application/repositories/TaskRepository'
import TaskRepositoryStub from '#/server/application/repositories/testing/TaskRepositoryStub'
import type { AppRunPromise } from '#/server/runtime/AppRuntime'
import Task from '#/shared/contracts/Task'
import GetTasksProcedure from './GetTasksProcedure'

describe('GetTasksProcedure', () => {
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

  const callGetTasks = (runPromise: AppRunPromise) =>
    call(GetTasksProcedure, undefined, {
      context: { runPromise },
    })

  const SucceedingTaskRepository = Layer.succeed(TaskRepository)({
    ...TaskRepositoryStub,
    getAll: () => Effect.succeed(expectedTasks),
  })

  const SuccessRuntime = ManagedRuntime.make(SucceedingTaskRepository)

  describe('when the repository succeeds', () => {
    it('getAll: returns Tasks', async () => {
      const result = await callGetTasks(SuccessRuntime.runPromise)

      expect(result).toStrictEqual(expectedTasks)
    })
  })

  const repositoryError = TaskRepositoryError.make({
    operation: 'getAll',
    cause: new Error('Repository unavailable'),
  })

  const FailingTaskRepository = Layer.succeed(TaskRepository)({
    ...TaskRepositoryStub,
    getAll: () => Effect.fail(repositoryError),
  })

  const FailureRuntime = ManagedRuntime.make(FailingTaskRepository)

  describe('when the repository fails', () => {
    it('getAll: maps TaskRepositoryError to INTERNAL_SERVER_ERROR', async () => {
      const error = await callGetTasks(FailureRuntime.runPromise).catch(cause => cause)

      if (!(error instanceof ORPCError)) {
        throw error
      }

      expect(error.code).toBe('INTERNAL_SERVER_ERROR')
      expect(error.cause).toBe(repositoryError)
    })
  })

  afterAll(async () => {
    await Promise.all([SuccessRuntime.dispose(), FailureRuntime.dispose()])
  })
})

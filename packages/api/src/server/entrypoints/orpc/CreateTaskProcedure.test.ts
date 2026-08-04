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
import CreateTaskProcedure from './CreateTaskProcedure'

describe('CreateTaskProcedure', () => {
  const expectedTask = Schema.decodeUnknownSync(Task)({
    id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2a',
    title: 'Test Task',
    status: 'TODO',
    createdAt: 1785835769172,
  })

  const callCreateTask = (runPromise: AppRunPromise) =>
    call(
      CreateTaskProcedure,
      { title: expectedTask.title },
      {
        context: { runPromise },
      }
    )

  const SucceedingTaskRepository = Layer.succeed(TaskRepository)({
    ...TaskRepositoryStub,
    create: () => Effect.succeed(expectedTask),
  })

  const SuccessRuntime = ManagedRuntime.make(SucceedingTaskRepository)

  describe('when the repository succeeds', () => {
    it('create: returns the created Task', async () => {
      const result = await callCreateTask(SuccessRuntime.runPromise)

      expect(result).toStrictEqual(expectedTask)
    })
  })

  const repositoryError = TaskRepositoryError.make({
    operation: 'create',
    cause: new Error('Repository unavailable'),
  })

  const FailingTaskRepository = Layer.succeed(TaskRepository)({
    ...TaskRepositoryStub,
    create: () => Effect.fail(repositoryError),
  })

  const FailureRuntime = ManagedRuntime.make(FailingTaskRepository)

  describe('when the repository fails', () => {
    it('create: maps TaskRepositoryError to INTERNAL_SERVER_ERROR', async () => {
      const error = await callCreateTask(FailureRuntime.runPromise).catch(cause => cause)

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

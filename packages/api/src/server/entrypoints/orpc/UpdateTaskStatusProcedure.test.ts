import { afterAll, describe, expect, it } from '@effect/vitest'
import { ORPCError, call } from '@orpc/server'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as ManagedRuntime from 'effect/ManagedRuntime'
import * as Schema from 'effect/Schema'
import TaskRepository, {
  TaskNotFoundError,
  TaskRepositoryError,
} from '#/server/application/repositories/TaskRepository'
import TaskRepositoryStub from '#/server/application/repositories/testing/TaskRepositoryStub'
import type { AppRunPromise } from '#/server/runtime/AppRuntime'
import Task, { UpdateTaskStatusInput } from '#/shared/contracts/Task'
import UpdateTaskStatusProcedure from './UpdateTaskStatusProcedure'

describe('UpdateTaskStatusProcedure', () => {
  const expectedTask = Schema.decodeUnknownSync(Task)({
    id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2a',
    title: 'Test Task',
    status: 'COMPLETED',
    createdAt: 1785835769172,
  })

  const input = Schema.decodeUnknownSync(UpdateTaskStatusInput)({
    id: expectedTask.id,
    status: expectedTask.status,
  })

  const callUpdateTaskStatus = (runPromise: AppRunPromise) =>
    call(UpdateTaskStatusProcedure, input, {
      context: { runPromise },
    })

  const SucceedingTaskRepository = Layer.succeed(TaskRepository)({
    ...TaskRepositoryStub,
    updateStatus: () => Effect.succeed(expectedTask),
  })
  const SuccessRuntime = ManagedRuntime.make(SucceedingTaskRepository)

  it('updateStatus: returns the updated Task when the repository succeeds', async () => {
    const result = await callUpdateTaskStatus(SuccessRuntime.runPromise)

    expect(result).toStrictEqual(expectedTask)
  })

  const notFoundError = TaskNotFoundError.make({ id: expectedTask.id })
  const MissingTaskRepository = Layer.succeed(TaskRepository)({
    ...TaskRepositoryStub,
    updateStatus: () => Effect.fail(notFoundError),
  })
  const MissingTaskRuntime = ManagedRuntime.make(MissingTaskRepository)

  it('updateStatus: maps TaskNotFoundError to NOT_FOUND', async () => {
    const error = await callUpdateTaskStatus(MissingTaskRuntime.runPromise).catch(cause => cause)

    if (!(error instanceof ORPCError)) {
      throw error
    }

    expect(error.code).toBe('NOT_FOUND')
    expect(error.cause).toBe(notFoundError)
  })

  const repositoryError = TaskRepositoryError.make({
    operation: 'updateStatus',
    cause: new Error('Repository unavailable'),
  })
  const FailingTaskRepository = Layer.succeed(TaskRepository)({
    ...TaskRepositoryStub,
    updateStatus: () => Effect.fail(repositoryError),
  })
  const FailureRuntime = ManagedRuntime.make(FailingTaskRepository)

  it('updateStatus: maps TaskRepositoryError to INTERNAL_SERVER_ERROR', async () => {
    const error = await callUpdateTaskStatus(FailureRuntime.runPromise).catch(cause => cause)

    if (!(error instanceof ORPCError)) {
      throw error
    }

    expect(error.code).toBe('INTERNAL_SERVER_ERROR')
    expect(error.cause).toBe(repositoryError)
  })

  afterAll(async () => {
    await Promise.all([
      SuccessRuntime.dispose(),
      MissingTaskRuntime.dispose(),
      FailureRuntime.dispose(),
    ])
  })
})

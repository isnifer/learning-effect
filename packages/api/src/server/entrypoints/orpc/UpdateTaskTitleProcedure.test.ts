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
import Task, { UpdateTaskTitleInput } from '#/shared/contracts/Task'
import UpdateTaskTitleProcedure from './UpdateTaskTitleProcedure'

describe('UpdateTaskTitleProcedure', () => {
  const expectedTask = Schema.decodeUnknownSync(Task)({
    id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2a',
    title: 'Updated Task',
    status: 'TODO',
    createdAt: 1785835769172,
  })

  const input = Schema.decodeUnknownSync(UpdateTaskTitleInput)({
    id: expectedTask.id,
    title: expectedTask.title,
  })

  const callUpdateTaskTitle = (runPromise: AppRunPromise) =>
    call(UpdateTaskTitleProcedure, input, {
      context: { runPromise },
    })

  const SucceedingTaskRepository = Layer.succeed(TaskRepository)({
    ...TaskRepositoryStub,
    updateTitle: () => Effect.succeed(expectedTask),
  })
  const SuccessRuntime = ManagedRuntime.make(SucceedingTaskRepository)

  it('updateTitle: returns the updated Task when the repository succeeds', async () => {
    const result = await callUpdateTaskTitle(SuccessRuntime.runPromise)

    expect(result).toStrictEqual(expectedTask)
  })

  const notFoundError = TaskNotFoundError.make({ id: expectedTask.id })
  const MissingTaskRepository = Layer.succeed(TaskRepository)({
    ...TaskRepositoryStub,
    updateTitle: () => Effect.fail(notFoundError),
  })
  const MissingTaskRuntime = ManagedRuntime.make(MissingTaskRepository)

  it('updateTitle: maps TaskNotFoundError to NOT_FOUND', async () => {
    const error = await callUpdateTaskTitle(MissingTaskRuntime.runPromise).catch(cause => cause)

    if (!(error instanceof ORPCError)) {
      throw error
    }

    expect(error.code).toBe('NOT_FOUND')
    expect(error.cause).toBe(notFoundError)
  })

  const repositoryError = TaskRepositoryError.make({
    operation: 'updateTitle',
    cause: new Error('Repository unavailable'),
  })
  const FailingTaskRepository = Layer.succeed(TaskRepository)({
    ...TaskRepositoryStub,
    updateTitle: () => Effect.fail(repositoryError),
  })
  const FailureRuntime = ManagedRuntime.make(FailingTaskRepository)

  it('updateTitle: maps TaskRepositoryError to INTERNAL_SERVER_ERROR', async () => {
    const error = await callUpdateTaskTitle(FailureRuntime.runPromise).catch(cause => cause)

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

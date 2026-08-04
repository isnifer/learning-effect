import { afterAll, describe, expect, it } from '@effect/vitest'
import { ORPCError, call } from '@orpc/server'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as ManagedRuntime from 'effect/ManagedRuntime'
import * as Schema from 'effect/Schema'
import TodoRepositoryStub from '#/server/application/repositories/testing/TodoRepositoryStub'
import TodoRepository, {
  TodoNotFoundError,
  TodoRepositoryError,
} from '#/server/application/repositories/TodoRepository'
import type { AppRunPromise } from '#/server/runtime/AppRuntime'
import Todo, { UpdateTodoStatusInput } from '#/shared/contracts/Todo'
import UpdateTodoStatusProcedure from './UpdateTodoStatusProcedure'

describe('UpdateTodoStatusProcedure', () => {
  const expectedTodo = Schema.decodeUnknownSync(Todo)({
    id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2a',
    title: 'Test Todo',
    status: 'COMPLETED',
    createdAt: 1785835769172,
  })

  const input = Schema.decodeUnknownSync(UpdateTodoStatusInput)({
    id: expectedTodo.id,
    status: expectedTodo.status,
  })

  const callUpdateTodoStatus = (runPromise: AppRunPromise) =>
    call(UpdateTodoStatusProcedure, input, {
      context: { runPromise },
    })

  const SucceedingTodoRepository = Layer.succeed(TodoRepository)({
    ...TodoRepositoryStub,
    updateStatus: () => Effect.succeed(expectedTodo),
  })
  const SuccessRuntime = ManagedRuntime.make(SucceedingTodoRepository)

  it('updateStatus: returns the updated Todo when the repository succeeds', async () => {
    const result = await callUpdateTodoStatus(SuccessRuntime.runPromise)

    expect(result).toStrictEqual(expectedTodo)
  })

  const notFoundError = TodoNotFoundError.make({ id: expectedTodo.id })
  const MissingTodoRepository = Layer.succeed(TodoRepository)({
    ...TodoRepositoryStub,
    updateStatus: () => Effect.fail(notFoundError),
  })
  const MissingTodoRuntime = ManagedRuntime.make(MissingTodoRepository)

  it('updateStatus: maps TodoNotFoundError to NOT_FOUND', async () => {
    const error = await callUpdateTodoStatus(MissingTodoRuntime.runPromise).catch(cause => cause)

    if (!(error instanceof ORPCError)) {
      throw error
    }

    expect(error.code).toBe('NOT_FOUND')
    expect(error.cause).toBe(notFoundError)
  })

  const repositoryError = TodoRepositoryError.make({
    operation: 'updateStatus',
    cause: new Error('Repository unavailable'),
  })
  const FailingTodoRepository = Layer.succeed(TodoRepository)({
    ...TodoRepositoryStub,
    updateStatus: () => Effect.fail(repositoryError),
  })
  const FailureRuntime = ManagedRuntime.make(FailingTodoRepository)

  it('updateStatus: maps TodoRepositoryError to INTERNAL_SERVER_ERROR', async () => {
    const error = await callUpdateTodoStatus(FailureRuntime.runPromise).catch(cause => cause)

    if (!(error instanceof ORPCError)) {
      throw error
    }

    expect(error.code).toBe('INTERNAL_SERVER_ERROR')
    expect(error.cause).toBe(repositoryError)
  })

  afterAll(async () => {
    await Promise.all([
      SuccessRuntime.dispose(),
      MissingTodoRuntime.dispose(),
      FailureRuntime.dispose(),
    ])
  })
})

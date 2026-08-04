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
import Todo, { UpdateTodoTitleInput } from '#/shared/contracts/Todo'
import UpdateTodoTitleProcedure from './UpdateTodoTitleProcedure'

describe('UpdateTodoTitleProcedure', () => {
  const expectedTodo = Schema.decodeUnknownSync(Todo)({
    id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2a',
    title: 'Updated Todo',
    status: 'TODO',
    createdAt: 1785835769172,
  })

  const input = Schema.decodeUnknownSync(UpdateTodoTitleInput)({
    id: expectedTodo.id,
    title: expectedTodo.title,
  })

  const callUpdateTodoTitle = (runPromise: AppRunPromise) =>
    call(UpdateTodoTitleProcedure, input, {
      context: { runPromise },
    })

  const SucceedingTodoRepository = Layer.succeed(TodoRepository)({
    ...TodoRepositoryStub,
    updateTitle: () => Effect.succeed(expectedTodo),
  })
  const SuccessRuntime = ManagedRuntime.make(SucceedingTodoRepository)

  it('updateTitle: returns the updated Todo when the repository succeeds', async () => {
    const result = await callUpdateTodoTitle(SuccessRuntime.runPromise)

    expect(result).toStrictEqual(expectedTodo)
  })

  const notFoundError = TodoNotFoundError.make({ id: expectedTodo.id })
  const MissingTodoRepository = Layer.succeed(TodoRepository)({
    ...TodoRepositoryStub,
    updateTitle: () => Effect.fail(notFoundError),
  })
  const MissingTodoRuntime = ManagedRuntime.make(MissingTodoRepository)

  it('updateTitle: maps TodoNotFoundError to NOT_FOUND', async () => {
    const error = await callUpdateTodoTitle(MissingTodoRuntime.runPromise).catch(cause => cause)

    if (!(error instanceof ORPCError)) {
      throw error
    }

    expect(error.code).toBe('NOT_FOUND')
    expect(error.cause).toBe(notFoundError)
  })

  const repositoryError = TodoRepositoryError.make({
    operation: 'updateTitle',
    cause: new Error('Repository unavailable'),
  })
  const FailingTodoRepository = Layer.succeed(TodoRepository)({
    ...TodoRepositoryStub,
    updateTitle: () => Effect.fail(repositoryError),
  })
  const FailureRuntime = ManagedRuntime.make(FailingTodoRepository)

  it('updateTitle: maps TodoRepositoryError to INTERNAL_SERVER_ERROR', async () => {
    const error = await callUpdateTodoTitle(FailureRuntime.runPromise).catch(cause => cause)

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

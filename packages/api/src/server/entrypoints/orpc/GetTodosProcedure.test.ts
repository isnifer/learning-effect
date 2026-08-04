import { afterAll, describe, expect, it } from '@effect/vitest'
import { ORPCError, call } from '@orpc/server'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as ManagedRuntime from 'effect/ManagedRuntime'
import * as Schema from 'effect/Schema'
import TodoRepositoryStub from '#/server/application/repositories/testing/TodoRepositoryStub'
import TodoRepository, {
  TodoRepositoryError,
} from '#/server/application/repositories/TodoRepository'
import type { AppRunPromise } from '#/server/runtime/AppRuntime'
import Todo from '#/shared/contracts/Todo'
import GetTodosProcedure from './GetTodosProcedure'

describe('GetTodosProcedure', () => {
  const expectedTodos = Schema.decodeUnknownSync(Schema.Array(Todo))([
    {
      id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2a',
      title: 'First Todo',
      status: 'TODO',
      createdAt: 1785835769172,
    },
    {
      id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2b',
      title: 'Second Todo',
      status: 'IN_PROGRESS',
      createdAt: 1785835769173,
    },
  ])

  const callGetTodos = (runPromise: AppRunPromise) =>
    call(GetTodosProcedure, undefined, {
      context: { runPromise },
    })

  const SucceedingTodoRepository = Layer.succeed(TodoRepository)({
    ...TodoRepositoryStub,
    getAll: () => Effect.succeed(expectedTodos),
  })

  const SuccessRuntime = ManagedRuntime.make(SucceedingTodoRepository)

  describe('when the repository succeeds', () => {
    it('getAll: returns Todos', async () => {
      const result = await callGetTodos(SuccessRuntime.runPromise)

      expect(result).toStrictEqual(expectedTodos)
    })
  })

  const repositoryError = TodoRepositoryError.make({
    operation: 'getAll',
    cause: new Error('Repository unavailable'),
  })

  const FailingTodoRepository = Layer.succeed(TodoRepository)({
    ...TodoRepositoryStub,
    getAll: () => Effect.fail(repositoryError),
  })

  const FailureRuntime = ManagedRuntime.make(FailingTodoRepository)

  describe('when the repository fails', () => {
    it('getAll: maps TodoRepositoryError to INTERNAL_SERVER_ERROR', async () => {
      const error = await callGetTodos(FailureRuntime.runPromise).catch(cause => cause)

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

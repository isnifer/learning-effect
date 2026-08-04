import { afterAll, describe, expect, it } from '@effect/vitest'
import { ORPCError, call } from '@orpc/server'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as ManagedRuntime from 'effect/ManagedRuntime'
import * as Schema from 'effect/Schema'
import TodoRepository, {
  TodoRepositoryError,
} from '#/server/application/repositories/TodoRepository'
import Todo from '#/server/domain/entities/Todo'
import type { AppRunPromise } from '#/server/runtime/AppRuntime'
import CreateTodoProcedure from './CreateTodoProcedure'

describe('CreateTodoProcedure', () => {
  const expectedTodo = Schema.decodeUnknownSync(Todo)({
    id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2a',
    title: 'Test Todo',
    status: 'TODO',
    createdAt: 1785835769172,
  })

  const callCreateTodo = (runPromise: AppRunPromise) =>
    call(
      CreateTodoProcedure,
      { title: expectedTodo.title },
      {
        context: { runPromise },
      }
    )

  const SucceedingTodoRepository = Layer.succeed(TodoRepository)({
    create: () => Effect.succeed(expectedTodo),
  })

  const SuccessRuntime = ManagedRuntime.make(SucceedingTodoRepository)

  describe('when the repository succeeds', () => {
    it('create: returns the created Todo', async () => {
      const result = await callCreateTodo(SuccessRuntime.runPromise)

      expect(result).toBe(expectedTodo)
    })
  })

  const repositoryError = TodoRepositoryError.make({
    operation: 'create',
    cause: new Error('Repository unavailable'),
  })

  const FailingTodoRepository = Layer.succeed(TodoRepository)({
    create: () => Effect.fail(repositoryError),
  })

  const FailureRuntime = ManagedRuntime.make(FailingTodoRepository)

  describe('when the repository fails', () => {
    it('create: maps TodoRepositoryError to INTERNAL_SERVER_ERROR', async () => {
      const error = await callCreateTodo(FailureRuntime.runPromise).catch(cause => cause)

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

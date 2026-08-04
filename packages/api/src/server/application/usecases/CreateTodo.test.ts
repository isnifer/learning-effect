import { describe, expect, layer } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import Todo from '#/server/domain/entities/Todo'
import TodoRepository, { TodoRepositoryError } from '../repositories/TodoRepository'
import CreateTodo from './CreateTodo'

describe('CreateTodo', () => {
  const expectedTodo = Schema.decodeUnknownSync(Todo)({
    id: '019fcc1a-bd5d-751e-9a30-0bc92d133b2a',
    title: 'Test Todo',
    status: 'TODO',
    createdAt: 1785835769172,
  })

  const TestTodoRepository = Layer.succeed(TodoRepository)({
    create: input =>
      Effect.sync(() => {
        expect(input).toStrictEqual({ title: expectedTodo.title })

        return expectedTodo
      }),
  })

  layer(TestTodoRepository)('when the repository succeeds', it => {
    it.effect('create: creates a Todo through the repository', () =>
      Effect.gen(function* () {
        const result = yield* CreateTodo({
          title: expectedTodo.title,
        })

        expect(result).toBe(expectedTodo)
      })
    )
  })

  const repositoryError = TodoRepositoryError.make({
    operation: 'create',
    cause: new Error('Repository unavailable'),
  })

  const FailingTodoRepository = Layer.succeed(TodoRepository)({
    create: () => Effect.fail(repositoryError),
  })

  layer(FailingTodoRepository)('when the repository fails', it => {
    it.effect('create: preserves TodoRepositoryError', () =>
      Effect.gen(function* () {
        const error = yield* CreateTodo({
          title: expectedTodo.title,
        }).pipe(Effect.flip)

        expect(error).toBe(repositoryError)
      })
    )
  })
})

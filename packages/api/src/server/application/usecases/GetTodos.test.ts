import { describe, expect, layer } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Schema from 'effect/Schema'
import Todo from '#/shared/contracts/Todo'
import TodoRepositoryStub from '../repositories/testing/TodoRepositoryStub'
import TodoRepository, { TodoRepositoryError } from '../repositories/TodoRepository'
import GetTodos from './GetTodos'

describe('GetTodos', () => {
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

  const SucceedingTodoRepository = Layer.succeed(TodoRepository)({
    ...TodoRepositoryStub,
    getAll: () => Effect.succeed(expectedTodos),
  })

  layer(SucceedingTodoRepository)('when the repository succeeds', it => {
    it.effect('getAll: returns Todos from the repository', () =>
      Effect.gen(function* () {
        const result = yield* GetTodos()

        expect(result).toBe(expectedTodos)
      })
    )
  })

  const repositoryError = TodoRepositoryError.make({
    operation: 'getAll',
    cause: new Error('Repository unavailable'),
  })

  const FailingTodoRepository = Layer.succeed(TodoRepository)({
    ...TodoRepositoryStub,
    getAll: () => Effect.fail(repositoryError),
  })

  layer(FailingTodoRepository)('when the repository fails', it => {
    it.effect('getAll: preserves TodoRepositoryError', () =>
      Effect.gen(function* () {
        const error = yield* GetTodos().pipe(Effect.flip)

        expect(error).toBe(repositoryError)
      })
    )
  })
})
